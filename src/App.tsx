import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, RotateCcw, ArrowRight, BookOpen } from 'lucide-react';
import { WordItem, UserWordProgress, AppSettings } from './types';
import { getStoredProgress, saveStoredProgress, getStoredSessionCounter, saveStoredSessionCounter, getStoredSettings, saveStoredSettings, resetLetterProgressInDb } from './lib/db';
import { selectNextWord, generateQuizOptions, processCorrectAnswer, processIncorrectAnswer } from './lib/leitner';
import { Header } from './components/Header';
import { LetterSelector } from './components/LetterSelector';
import { QuizCard } from './components/QuizCard';
import { StatsModal } from './components/StatsModal';
import { BackupModal } from './components/BackupModal';

export const App: React.FC = () => {
  // Master word bank & user data
  const [allWords, setAllWords] = useState<WordItem[]>([]);
  const [progress, setProgress] = useState<Record<string, UserWordProgress>>({});
  const [sessionCounter, setSessionCounter] = useState<number>(0);
  const [settings, setSettings] = useState<AppSettings>({
    soundEnabled: true,
    hapticFeedback: true,
    showHebrewFirst: false,
  });

  // Navigation & Quiz state
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [currentWord, setCurrentWord] = useState<WordItem | null>(null);
  const [currentOptions, setCurrentOptions] = useState<{ text: string; isCorrect: boolean }[]>([]);
  const [isLetterFinished, setIsLetterFinished] = useState(false);

  // Modals & UI
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Initial Load of vocabulary and storage
  useEffect(() => {
    async function initApp() {
      try {
        const [loadedProgress, loadedSession, loadedSettings] = await Promise.all([
          getStoredProgress(),
          getStoredSessionCounter(),
          getStoredSettings(),
        ]);

        setProgress(loadedProgress);
        setSessionCounter(loadedSession);
        setSettings(loadedSettings);

        // Fetch vocabulary.json from public/data/
        const vocabUrl = `${import.meta.env.BASE_URL}data/vocabulary.json`;
        const res = await fetch(vocabUrl);
        if (res.ok) {
          const vocabData: WordItem[] = await res.json();
          setAllWords(vocabData);
        } else {
          console.error('Failed to load vocabulary.json');
        }
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    initApp();
  }, []);

  // 2. Filter words for the active session
  const getActiveWords = useCallback((): WordItem[] => {
    if (!selectedLetter) return [];
    if (selectedLetter === 'ALL') return allWords;
    return allWords.filter(w => w.letter === selectedLetter);
  }, [selectedLetter, allWords]);

  // 3. Advance to the next quiz question
  const pickNextQuestion = useCallback(
    (
      currentProgress: Record<string, UserWordProgress>,
      counter: number,
      lastId?: string
    ) => {
      const activeWords = getActiveWords();
      if (!activeWords.length) return;

      const next = selectNextWord(activeWords, currentProgress, counter, lastId);

      if (!next) {
        // All words mastered in this pool!
        setIsLetterFinished(true);
        setCurrentWord(null);
        setCurrentOptions([]);
        try {
          confetti({
            particleCount: 120,
            spread: 90,
            origin: { y: 0.5 },
          });
        } catch {
          // Fallback
        }
      } else {
        setIsLetterFinished(false);
        setCurrentWord(next);
        const letterWords = allWords.filter(w => w.letter === next.letter);
        const options = generateQuizOptions(
          next,
          letterWords,
          allWords,
          settings.showHebrewFirst
        );
        setCurrentOptions(options);
      }
    },
    [getActiveWords, allWords, settings.showHebrewFirst]
  );

  // 4. Handle Letter Selection
  const handleSelectLetter = (letter: string) => {
    setSelectedLetter(letter);
    setIsLetterFinished(false);
    // Next tick pick word
    setTimeout(() => {
      const activeWords = letter === 'ALL' ? allWords : allWords.filter(w => w.letter === letter);
      const next = selectNextWord(activeWords, progress, sessionCounter);
      if (!next) {
        setIsLetterFinished(true);
        setCurrentWord(null);
        setCurrentOptions([]);
      } else {
        setIsLetterFinished(false);
        setCurrentWord(next);
        const letterWords = allWords.filter(w => w.letter === next.letter);
        const options = generateQuizOptions(
          next,
          letterWords,
          allWords,
          settings.showHebrewFirst
        );
        setCurrentOptions(options);
      }
    }, 0);
  };

  // 5. Handle user answering a quiz item
  const handleAnswer = (isCorrect: boolean) => {
    if (!currentWord) return;

    const newCounter = sessionCounter + 1;
    setSessionCounter(newCounter);
    saveStoredSessionCounter(newCounter);

    const prevWordProgress = progress[currentWord.id];
    let updatedWordProgress: UserWordProgress;

    if (isCorrect) {
      const result = processCorrectAnswer(prevWordProgress, currentWord.id, newCounter);
      updatedWordProgress = result.updatedProgress;
    } else {
      const result = processIncorrectAnswer(prevWordProgress, currentWord.id, newCounter);
      updatedWordProgress = result.updatedProgress;
    }

    const nextProgressMap = {
      ...progress,
      [currentWord.id]: updatedWordProgress,
    };

    setProgress(nextProgressMap);
    saveStoredProgress(nextProgressMap);

    // Pick next question
    pickNextQuestion(nextProgressMap, newCounter, currentWord.id);
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveStoredSettings(newSettings);
  };

  const handleDataReload = (
    newProgress: Record<string, UserWordProgress>,
    newSession: number,
    newSettings: AppSettings
  ) => {
    setProgress(newProgress);
    setSessionCounter(newSession);
    setSettings(newSettings);
    if (selectedLetter) {
      pickNextQuestion(newProgress, newSession);
    }
  };

  const handleResetCurrentLetter = async () => {
    if (!selectedLetter) return;
    const updated = await resetLetterProgressInDb(selectedLetter, allWords);
    setProgress(updated);
    setIsLetterFinished(false);
    pickNextQuestion(updated, sessionCounter);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-900 text-slate-100 p-6">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-2xl animate-pulse mb-4">
          G
        </div>
        <p className="text-slate-400 font-medium">טוען אוצר מילים...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-900 text-slate-100">
      {/* Top Header */}
      <Header
        currentLetter={selectedLetter}
        onBack={() => {
          setSelectedLetter(null);
          setCurrentWord(null);
        }}
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        sessionCount={sessionCounter}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col pt-4 pb-8 overflow-y-auto">
        {!selectedLetter ? (
          /* Screen 1: Letter Selector */
          <LetterSelector
            words={allWords}
            progress={progress}
            onSelectLetter={handleSelectLetter}
          />
        ) : isLetterFinished ? (
          /* Screen 2: All Words Mastered celebration screen */
          <div className="w-full max-w-md mx-auto my-auto flex flex-col items-center justify-center text-center p-6 bg-slate-850/80 border border-emerald-500/30 rounded-3xl shadow-2xl animate-pop">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/40">
              <Sparkles className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-white mb-1">
              {selectedLetter === 'ALL' ? 'כל הכבוד! סיימת את כל אוצר המילים!' : 'כל הכבוד! אות הושלמה במלואה'}
            </h2>
            <p className="text-sm text-slate-300 mb-6 max-w-xs">
              {selectedLetter === 'ALL'
                ? `כל ${allWords.length} המילים במאגר הגיעו לתיבה 5 (Mastered) ונלמדו בהצלחה מלאה!`
                : 'כל המילים באות זו הגיעו לתיבה 5 (Mastered) ונלמדו בהצלחה על פי שיטת לייטנר!'}
            </p>

            <div className="w-full flex flex-col gap-2.5">
              <button
                onClick={() => setSelectedLetter(null)}
                className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-indigo-600/30"
              >
                <ArrowRight className="w-5 h-5" />
                <span>בחירת אות נוספת</span>
              </button>

              <button
                onClick={handleResetCurrentLetter}
                className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{selectedLetter === 'ALL' ? 'תרגל את כל המילים מחדש' : 'תרגל אות זו מחדש'}</span>
              </button>
            </div>
          </div>
        ) : currentWord ? (
          /* Screen 3: Active Leitner Quiz Card */
          <QuizCard
            word={currentWord}
            options={currentOptions}
            progress={progress[currentWord.id]}
            soundEnabled={settings.soundEnabled}
            hapticEnabled={settings.hapticFeedback}
            showHebrewFirst={settings.showHebrewFirst}
            onAnswer={handleAnswer}
          />
        ) : (
          <div className="w-full max-w-md mx-auto text-center p-8 text-slate-400">
            <BookOpen className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p>אין מילים זמינות להצגה</p>
          </div>
        )}
      </main>

      {/* Stats Modal */}
      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        words={allWords}
        progress={progress}
        sessionCount={sessionCounter}
      />

      {/* Backup and Settings Modal */}
      <BackupModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        words={allWords}
        currentLetter={selectedLetter}
        onDataReload={handleDataReload}
      />
    </div>
  );
};
export default App;


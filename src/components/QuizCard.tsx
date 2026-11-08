import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Volume2, CheckCircle2, XCircle, Award } from 'lucide-react';
import { WordItem, UserWordProgress, LeitnerBox } from '../types';
import { ProgressBar } from './ProgressBar';
import { playSuccessSound, playErrorSound, playMasteryFanfare, triggerHaptic } from '../lib/sound';

interface QuizOption {
  text: string;
  isCorrect: boolean;
}

interface QuizCardProps {
  word: WordItem;
  options: QuizOption[];
  progress?: UserWordProgress;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  showHebrewFirst: boolean;
  onAnswer: (isCorrect: boolean) => void;
}

export const QuizCard: React.FC<QuizCardProps> = ({
  word,
  options,
  progress,
  soundEnabled,
  hapticEnabled,
  showHebrewFirst,
  onAnswer,
}) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [masteredAlert, setMasteredAlert] = useState(false);

  // Reset state on word change
  useEffect(() => {
    setSelectedIdx(null);
    setIsAnswered(false);
    setMasteredAlert(false);
  }, [word.id]);

  const speak = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word.word);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return; // Prevent double taps

    const option = options[idx];
    setSelectedIdx(idx);
    setIsAnswered(true);

    const isCorrect = option.isCorrect;
    const currentBox = (progress?.box ?? 0) as LeitnerBox;
    const willBeMastered = isCorrect && currentBox === 4; // Moving to box 5

    if (isCorrect) {
      triggerHaptic('medium', hapticEnabled);
      if (willBeMastered) {
        setMasteredAlert(true);
        playMasteryFanfare(soundEnabled);
        try {
          confetti({
            particleCount: 90,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {
          // Confetti fallback
        }
      } else {
        playSuccessSound(soundEnabled);
      }

      // Transition smoothly
      const delay = willBeMastered ? 1400 : 700;
      setTimeout(() => {
        onAnswer(true);
      }, delay);
    } else {
      triggerHaptic('error', hapticEnabled);
      playErrorSound(soundEnabled);

      // Incorrect answer: pause for 1.2s so user inspects correct answer
      setTimeout(() => {
        onAnswer(false);
      }, 1300);
    }
  };

  const promptText = showHebrewFirst ? word.translation : word.word;
  const isPromptEnglish = !showHebrewFirst;
  const currentBox = (progress?.box ?? 0) as LeitnerBox;

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-4 animate-pop px-4 pb-6">
      {/* Box Progression Tracker */}
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-3">
        <ProgressBar box={currentBox} consecutiveCorrect={progress?.consecutiveCorrect} />
      </div>

      {/* Target Word Center Card */}
      <div className="relative bg-gradient-to-b from-slate-800/90 to-slate-850 border border-slate-700/80 rounded-3xl p-6 text-center shadow-xl shadow-black/30 backdrop-blur-sm">
        {/* Letter & Status Badge */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            אות {word.letter}
          </span>
          <span className="text-xs text-slate-400 font-medium">
            חזרות: {progress?.totalAttempts ?? 0}
          </span>
        </div>

        {/* Mastered Celebration Banner */}
        {masteredAlert && (
          <div className="mb-3 px-3 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm font-bold flex items-center justify-center gap-2 animate-bounce">
            <Award className="w-5 h-5 text-emerald-400" />
            <span>מילה זו הועברה לשליטה מלאה!</span>
          </div>
        )}

        {/* Big Word / Expression */}
        <div className="flex items-center justify-center gap-2 my-2">
          <h2
            dir={isPromptEnglish ? 'ltr' : 'rtl'}
            className={`font-extrabold tracking-wide text-white select-none ${
              isPromptEnglish ? 'text-3xl sm:text-4xl font-sans' : 'text-2xl sm:text-3xl'
            }`}
          >
            {promptText}
          </h2>

          {isPromptEnglish && (
            <button
              onClick={speak}
              className="p-2 rounded-full text-indigo-400 hover:text-white hover:bg-indigo-600/30 active:scale-90 transition-all"
              aria-label="השמע הגייה באנגלית"
              title="השמע מילה"
            >
              <Volume2 className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Example Sentence if revealed or available */}
        {word.exampleSentence && (isAnswered || !showHebrewFirst) && (
          <p
            dir="ltr"
            className="text-xs sm:text-sm text-slate-400 italic mt-2 line-clamp-2 px-2"
          >
            "{word.exampleSentence}"
          </p>
        )}
      </div>

      {/* 4 Option Buttons */}
      <div className="grid grid-cols-1 gap-2.5">
        {options.map((option, idx) => {
          const isSelected = selectedIdx === idx;
          const isCorrectAnswer = option.isCorrect;

          let btnStyle = 'bg-slate-800/80 hover:bg-slate-750 border-slate-700/80 text-slate-100';
          let icon = null;

          if (isAnswered) {
            if (isCorrectAnswer) {
              btnStyle = 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-500/30 scale-[1.01]';
              icon = <CheckCircle2 className="w-5 h-5 text-white shrink-0 ml-2" />;
            } else if (isSelected && !isCorrectAnswer) {
              btnStyle = 'bg-rose-600 border-rose-400 text-white shadow-lg shadow-rose-500/30 animate-shake';
              icon = <XCircle className="w-5 h-5 text-white shrink-0 ml-2" />;
            } else {
              btnStyle = 'bg-slate-850/60 border-slate-800/60 text-slate-400 opacity-60';
            }
          }

          return (
            <button
              key={idx}
              disabled={isAnswered}
              onClick={() => handleSelectOption(idx)}
              dir={showHebrewFirst ? 'ltr' : 'rtl'}
              className={`min-h-[58px] px-4 py-3.5 rounded-2xl border text-base font-semibold transition-all duration-200 flex items-center justify-between text-right active:scale-[0.98] ${btnStyle}`}
            >
              <span className="flex-1 leading-snug">{option.text}</span>
              {icon}
            </button>
          );
        })}
      </div>
    </div>
  );
};


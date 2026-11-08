import React, { useState } from 'react';
import { Sparkles, CheckCheck, Search, X, Volume2, Shuffle } from 'lucide-react';
import { WordItem, UserWordProgress } from '../types';

interface LetterSelectorProps {
  words: WordItem[];
  progress: Record<string, UserWordProgress>;
  onSelectLetter: (letter: string) => void;
  shuffleEnabled?: boolean;
  onToggleShuffle?: (enabled: boolean) => void;
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const LetterSelector: React.FC<LetterSelectorProps> = ({
  words,
  progress,
  onSelectLetter,
  shuffleEnabled = true,
  onToggleShuffle,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Compute global summary
  const totalGlobalWords = words.length;
  const masteredGlobalWords = words.filter(w => progress[w.id]?.box === 5).length;
  const globalPercent = totalGlobalWords > 0 ? Math.round((masteredGlobalWords / totalGlobalWords) * 100) : 0;

  // Search results
  const trimmedQuery = searchQuery.trim().toLowerCase();
  const searchResults = trimmedQuery
    ? words.filter(w =>
        w.word.toLowerCase().includes(trimmedQuery) ||
        w.translation.includes(trimmedQuery)
      ).slice(0, 40)
    : [];

  const speak = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-5 px-4 pb-12">
      {/* Top Banner / Practice All CTA */}
      <div className="bg-gradient-to-br from-indigo-900/60 via-slate-800/80 to-slate-850 border border-indigo-500/30 rounded-3xl p-5 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">תרגול כולל לייטנר</h2>
            <p className="text-xs text-indigo-200/80 mt-0.5">
              אלגוריתם חזרות מרווחות לפי שיטת לייטנר (Spaced Repetition)
            </p>
          </div>
          <div className="text-left">
            <span className="text-2xl font-black text-indigo-400">{globalPercent}%</span>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">שליטה</div>
          </div>
        </div>

        {/* Global Progress Line */}
        <div className="w-full bg-slate-950/60 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-700/50 mb-4">
          <div
            className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${globalPercent}%` }}
          />
        </div>

        {/* Practice All Button & Shuffle Mode Toggle */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => onSelectLetter('ALL')}
            className="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Sparkles className="w-5 h-5 text-indigo-200" />
            <span>תרגל את כל האותיות (A-Z)</span>
          </button>

          {onToggleShuffle && (
            <button
              onClick={() => onToggleShuffle(!shuffleEnabled)}
              className="flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-indigo-500/20 text-xs font-medium text-slate-300 transition-all active:scale-95"
            >
              <Shuffle className={`w-3.5 h-3.5 ${shuffleEnabled ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span>
                סדר שאלות: <strong className={shuffleEnabled ? 'text-emerald-400' : 'text-slate-400'}>{shuffleEnabled ? 'אקראי ומעורבב (מומלץ)' : 'אלפביתי מסודר'}</strong>
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Dictionary Search Bar */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="חיפוש מילה באנגלית או בעברית..."
            className="w-full bg-slate-800/80 border border-slate-700/70 rounded-2xl pr-10 pl-10 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-1.5 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white absolute left-2.5"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Results Display */}
        {trimmedQuery && (
          <div className="mt-2.5 bg-slate-850/95 border border-slate-750 rounded-2xl p-2.5 shadow-2xl flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
            <div className="flex items-center justify-between px-2 pt-1 pb-1 text-xs text-slate-400 border-b border-slate-800">
              <span>תוצאות חיפוש ({searchResults.length})</span>
              <span>לחץ על אות כדי לתרגל</span>
            </div>

            {searchResults.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500">
                לא נמצאו מילים תואמות לחיפוש
              </div>
            ) : (
              searchResults.map((item) => {
                const p = progress[item.id];
                const box = p?.box ?? 0;
                return (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-750 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-base truncate font-sans">
                          {item.word}
                        </span>
                        <button
                          onClick={(e) => speak(e, item.word)}
                          className="p-1 rounded-full text-indigo-400 hover:bg-indigo-600/20 active:scale-90"
                          title="השמע הגייה"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-300 truncate mt-0.5" dir="rtl">
                        {item.translation}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        box === 5
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : box > 0
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                          : 'bg-slate-700/30 text-slate-400 border-slate-700/50'
                      }`}>
                        {box === 5 ? 'שליטה' : `תיבה ${box}`}
                      </span>

                      <button
                        onClick={() => onSelectLetter(item.letter)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white text-xs font-bold font-sans border border-indigo-500/40 transition-colors"
                      >
                        אות {item.letter}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Grid of A-Z Letters (shown when not searching) */}
      {!trimmedQuery && (
        <div>
          <div className="flex items-center justify-between px-1 mb-3">
            <h3 className="text-sm font-bold text-slate-300">בחר אות לתרגול</h3>
            <span className="text-xs text-slate-400">{masteredGlobalWords} מתוך {totalGlobalWords} נלמדו</span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
            {LETTERS.map((letter) => {
              const letterWords = words.filter(w => w.letter === letter);
              const total = letterWords.length;
              const mastered = letterWords.filter(w => progress[w.id]?.box === 5).length;
              const isCompleted = total > 0 && mastered === total;
              const percent = total > 0 ? Math.round((mastered / total) * 100) : 0;

              return (
                <button
                  key={letter}
                  onClick={() => onSelectLetter(letter)}
                  className={`flex flex-col items-center justify-between p-3.5 rounded-2xl border transition-all duration-200 active:scale-95 text-center relative group ${
                    isCompleted
                      ? 'bg-emerald-950/30 border-emerald-500/40 hover:border-emerald-400/70'
                      : 'bg-slate-800/70 hover:bg-slate-800 border-slate-700/60 hover:border-indigo-500/50'
                  }`}
                >
                  {/* Completed Check Badge */}
                  {isCompleted && (
                    <div className="absolute top-2 right-2">
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                  )}

                  {/* Big Letter Label */}
                  <span className={`text-2xl font-black font-sans tracking-wide transition-colors ${
                    isCompleted ? 'text-emerald-400' : 'text-white group-hover:text-indigo-400'
                  }`}>
                    {letter}
                  </span>

                  {/* Mastery Counts */}
                  <div className="w-full mt-2">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium mb-1">
                      <span>{mastered}/{total}</span>
                      <span className={percent === 100 ? 'text-emerald-400 font-bold' : ''}>{percent}%</span>
                    </div>
                    {/* Mini Progress Bar */}
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          percent === 100 ? 'bg-emerald-500' : 'bg-indigo-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

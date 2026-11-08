import React from 'react';
import { Sparkles, CheckCheck } from 'lucide-react';
import { WordItem, UserWordProgress } from '../types';

interface LetterSelectorProps {
  words: WordItem[];
  progress: Record<string, UserWordProgress>;
  onSelectLetter: (letter: string) => void;
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const LetterSelector: React.FC<LetterSelectorProps> = ({
  words,
  progress,
  onSelectLetter,
}) => {
  // Compute global summary
  const totalGlobalWords = words.length;
  const masteredGlobalWords = words.filter(w => progress[w.id]?.box === 5).length;
  const globalPercent = totalGlobalWords > 0 ? Math.round((masteredGlobalWords / totalGlobalWords) * 100) : 0;

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

        {/* Practice All Button */}
        <button
          onClick={() => onSelectLetter('ALL')}
          className="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
        >
          <Sparkles className="w-5 h-5 text-indigo-200" />
          <span>תרגל את כל האותיות (A-Z)</span>
        </button>
      </div>

      {/* Grid of A-Z Letters */}
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
    </div>
  );
};


import React from 'react';
import { X, Trophy, CheckCircle, Brain, Target, BarChart2 } from 'lucide-react';
import { WordItem, UserWordProgress, LeitnerBox } from '../types';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  words: WordItem[];
  progress: Record<string, UserWordProgress>;
  sessionCount: number;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  words,
  progress,
  sessionCount,
}) => {
  if (!isOpen) return null;

  const totalWords = words.length;

  // Box counters
  const boxCounts: Record<LeitnerBox, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let totalAttempts = 0;
  let totalErrors = 0;

  for (const word of words) {
    const p = progress[word.id];
    if (p) {
      boxCounts[p.box] = (boxCounts[p.box] || 0) + 1;
      totalAttempts += p.totalAttempts;
      totalErrors += p.totalErrors;
    } else {
      boxCounts[0] += 1;
    }
  }

  const masteredCount = boxCounts[5];
  const inProgressCount = boxCounts[1] + boxCounts[2] + boxCounts[3] + boxCounts[4];

  const accuracy = totalAttempts > 0
    ? Math.round(((totalAttempts - totalErrors) / totalAttempts) * 100)
    : 0;

  const boxDetails = [
    { box: 5, label: 'שליטה מלאה (מאסטרי)', count: boxCounts[5], color: 'bg-emerald-500', text: 'text-emerald-400' },
    { box: 4, label: 'שלב 4 (רווח: 28)', count: boxCounts[4], color: 'bg-indigo-500', text: 'text-indigo-400' },
    { box: 3, label: 'שלב 3 (רווח: 12)', count: boxCounts[3], color: 'bg-indigo-400', text: 'text-indigo-300' },
    { box: 2, label: 'שלב 2 (רווח: 5)', count: boxCounts[2], color: 'bg-violet-400', text: 'text-violet-300' },
    { box: 1, label: 'שלב 1 (רווח: 2)', count: boxCounts[1], color: 'bg-violet-500', text: 'text-violet-400' },
    { box: 0, label: 'לא נלמד / טעות', count: boxCounts[0], color: 'bg-slate-600', text: 'text-slate-400' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-bold text-white">סטטיסטיקות למידה</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Highlight Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-3.5 flex flex-col items-center text-center">
            <CheckCircle className="w-5 h-5 text-emerald-400 mb-1" />
            <span className="text-2xl font-black text-white">{masteredCount}</span>
            <span className="text-xs text-slate-400 font-medium">מילים שנשלטו (Box 5)</span>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-3.5 flex flex-col items-center text-center">
            <Target className="w-5 h-5 text-indigo-400 mb-1" />
            <span className="text-2xl font-black text-white">{accuracy}%</span>
            <span className="text-xs text-slate-400 font-medium">דיוק כולל</span>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-3.5 flex flex-col items-center text-center">
            <Brain className="w-5 h-5 text-violet-400 mb-1" />
            <span className="text-2xl font-black text-white">{inProgressCount}</span>
            <span className="text-xs text-slate-400 font-medium">מילים בתהליך</span>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-3.5 flex flex-col items-center text-center">
            <BarChart2 className="w-5 h-5 text-amber-400 mb-1" />
            <span className="text-2xl font-black text-white">{totalAttempts}</span>
            <span className="text-xs text-slate-400 font-medium">סה"כ מענים</span>
          </div>
        </div>

        {/* Leitner Boxes Breakdown */}
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-4 flex flex-col gap-2.5">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
            התפלגות תיבות לייטנר ({totalWords} מילים במאגר)
          </h3>

          {boxDetails.map(({ box, label, count, color, text }) => {
            const pct = totalWords > 0 ? Math.round((count / totalWords) * 100) : 0;
            return (
              <div key={box} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-semibold ${text}`}>{label}</span>
                  <span className="text-slate-400 font-mono">
                    {count} ({pct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${color} rounded-full transition-all duration-300`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-500">
          שאלות שנענו בסשן הנוכחי: <strong className="text-slate-300">{sessionCount}</strong>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-all active:scale-95"
        >
          סגור
        </button>
      </div>
    </div>
  );
};

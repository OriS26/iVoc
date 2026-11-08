import React from 'react';
import { LeitnerBox } from '../types';

interface ProgressBarProps {
  box: LeitnerBox;
  consecutiveCorrect?: number;
}

const BOX_LABELS = [
  'התחלה',
  'שלב 1 (רווח: 2)',
  'שלב 2 (רווח: 5)',
  'שלב 3 (רווח: 12)',
  'שלב 4 (רווח: 28)',
  'שליטה מלאה 🎉',
];

export const ProgressBar: React.FC<ProgressBarProps> = ({ box }) => {
  return (
    <div className="w-full flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs text-slate-400 font-medium px-0.5">
        <span>רמת שליטה (תיבת לייטנר):</span>
        <span className={`font-semibold ${box === 5 ? 'text-emerald-400' : box > 0 ? 'text-indigo-400' : 'text-slate-400'}`}>
          {BOX_LABELS[box]}
        </span>
      </div>

      {/* 5-step visual segments */}
      <div className="grid grid-cols-5 gap-1.5 h-2 w-full">
        {[1, 2, 3, 4, 5].map((step) => {
          const isFilled = box >= step;
          const isCurrent = box === step;
          
          let color = 'bg-slate-800';
          if (isFilled) {
            if (step === 5) color = 'bg-emerald-500 shadow-sm shadow-emerald-500/50';
            else color = 'bg-indigo-500 shadow-sm shadow-indigo-500/30';
          }

          return (
            <div
              key={step}
              className={`h-full rounded-full transition-all duration-300 ${color} ${
                isCurrent ? 'ring-2 ring-indigo-400/50 ring-offset-1 ring-offset-slate-900 scale-105' : ''
              }`}
            />
          );
        })}
      </div>
    </div>
  );
};


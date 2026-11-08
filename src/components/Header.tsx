import React from 'react';
import { ArrowRight, BarChart3, Settings, Flame } from 'lucide-react';

interface HeaderProps {
  currentLetter: string | null;
  onBack?: () => void;
  onOpenStats: () => void;
  onOpenSettings: () => void;
  sessionCount: number;
  activeStreak?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentLetter,
  onBack,
  onOpenStats,
  onOpenSettings,
  sessionCount,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-3 px-4 transition-all">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Left Section (Back Button or App Branding) */}
        <div className="flex items-center gap-2">
          {currentLetter ? (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-slate-200 transition-all font-medium text-sm"
              aria-label="חזרה לאותיות"
            >
              <ArrowRight className="w-4 h-4" />
              <span>אותיות</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
                V
              </div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                iVoc
              </span>
            </div>
          )}
        </div>

        {/* Center Section: Current Mode or Active Letter */}
        {currentLetter && (
          <div className="flex items-center gap-1.5 bg-slate-800/90 px-3 py-1 rounded-full border border-slate-700/60 shadow-inner">
            <span className="text-xs text-slate-400 font-medium">תרגול אות</span>
            <span className="font-extrabold text-indigo-400 text-sm">
              {currentLetter === 'ALL' ? 'הכל (A-Z)' : currentLetter}
            </span>
          </div>
        )}

        {/* Right Section: Session Stats, Analytics & Settings Trigger */}
        <div className="flex items-center gap-1.5">
          {/* Quick Counter */}
          <div
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/60 text-amber-400 text-xs font-semibold border border-slate-700/40"
            title="שאלות שנענו בסשן הנוכחי"
          >
            <Flame className="w-3.5 h-3.5 fill-amber-400/20" />
            <span>{sessionCount}</span>
          </div>

          {/* Stats Button */}
          <button
            onClick={onOpenStats}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 active:scale-90 transition-all"
            aria-label="סטטיסטיקות התקדמות"
            title="סטטיסטיקה"
          >
            <BarChart3 className="w-5 h-5" />
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 active:scale-90 transition-all"
            aria-label="הגדרות וגיבוי"
            title="הגדרות וגיבוי"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};


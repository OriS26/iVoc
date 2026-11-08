import React, { useRef, useState } from 'react';
import { X, Download, Upload, RotateCcw, Volume2, Smartphone, ArrowRightLeft, AlertTriangle, Share2, HelpCircle, ChevronDown, ChevronUp, Shuffle } from 'lucide-react';
import { AppSettings, WordItem, UserWordProgress } from '../types';
import { exportProgressToJson, importProgressFromJson, resetAllProgressInDb, resetLetterProgressInDb } from '../lib/db';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  words: WordItem[];
  currentLetter: string | null;
  onDataReload: (newProgress: Record<string, UserWordProgress>, newSession: number, newSettings: AppSettings) => void;
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  words,
  currentLetter,
  onDataReload,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedLetterToReset, setSelectedLetterToReset] = useState<string>(currentLetter && currentLetter !== 'ALL' ? currentLetter : 'A');
  const [message, setMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  if (!isOpen) return null;

  const showMsg = (text: string, isError = false) => {
    setMessage({ text, isError });
    setTimeout(() => setMessage(null), 3500);
  };

  const handleShare = async () => {
    const shareUrl = window.location.origin + window.location.pathname;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'iVoc - Vocabulary Trainer',
          text: 'תרגול אוצר מילים לפסיכומטרי ולאמירם במצב אופליין מלא',
          url: shareUrl,
        });
      } catch {
        // User dismissed share dialog
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        showMsg('הקישור הועתק ללוח בהצלחה!');
      } catch {
        showMsg(shareUrl);
      }
    }
  };

  const handleExport = async () => {
    try {
      await exportProgressToJson();
      showMsg('קובץ הגיבוי הורד בהצלחה!');
    } catch {
      showMsg('שגיאה בייצוא הנתונים', true);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = await importProgressFromJson(text);
      onDataReload(result.progress, result.sessionCounter, result.settings);
      showMsg('הנתונים יובאו בהצלחה!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'שגיאה בקריאת קובץ הגיבוי';
      showMsg(msg, true);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleResetLetter = async () => {
    if (window.confirm(`האם לאפס את כל ההתקדמות עבור אות ${selectedLetterToReset}?`)) {
      const updated = await resetLetterProgressInDb(selectedLetterToReset, words);
      onDataReload(updated, 0, settings);
      showMsg(`ההתקדמות עבור אות ${selectedLetterToReset} אופסה!`);
    }
  };

  const handleResetAll = async () => {
    if (window.confirm('אזהרה: פעולה זו תמחק את כל ההתקדמות שלך בכל האותיות! להמשיך?')) {
      await resetAllProgressInDb();
      onDataReload({}, 0, settings);
      showMsg('כל נתוני ההתקדמות אופסו בהצלחה!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-xl font-bold text-white">הגדרות וגיבוי</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Alert Banner */}
        {message && (
          <div
            className={`p-3 rounded-xl text-sm font-semibold text-center ${
              message.isError
                ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* App Settings */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">העדפות תרגול</h3>

          {/* Sound Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50">
            <div className="flex items-center gap-2.5">
              <Volume2 className="w-5 h-5 text-indigo-400" />
              <span className="text-sm font-medium text-slate-200">צלילי משוב</span>
            </div>
            <input
              type="checkbox"
              checked={settings.soundEnabled}
              onChange={(e) => onUpdateSettings({ ...settings, soundEnabled: e.target.checked })}
              className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
            />
          </div>

          {/* Haptic Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50">
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-5 h-5 text-indigo-400" />
              <span className="text-sm font-medium text-slate-200">רטט במגע (Haptics)</span>
            </div>
            <input
              type="checkbox"
              checked={settings.hapticFeedback}
              onChange={(e) => onUpdateSettings({ ...settings, hapticFeedback: e.target.checked })}
              className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
            />
          </div>

          {/* Direction Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50">
            <div className="flex items-center gap-2.5">
              <ArrowRightLeft className="w-5 h-5 text-indigo-400" />
              <span className="text-sm font-medium text-slate-200">תרגול מעברית לאנגלית</span>
            </div>
            <input
              type="checkbox"
              checked={settings.showHebrewFirst}
              onChange={(e) => onUpdateSettings({ ...settings, showHebrewFirst: e.target.checked })}
              className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
            />
          </div>

          {/* Shuffle Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50">
            <div className="flex items-center gap-2.5">
              <Shuffle className="w-5 h-5 text-indigo-400" />
              <div>
                <span className="text-sm font-medium text-slate-200 block">סדר אקראי (ערבוב מילים)</span>
                <span className="text-[11px] text-slate-400">ערבוב מילים במקום סדר אלפביתי</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.shuffleWords}
              onChange={(e) => onUpdateSettings({ ...settings, shuffleWords: e.target.checked })}
              className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Backup and Restore */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">גיבוי ושחזור נתונים</h3>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={handleExport}
              className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-semibold text-xs sm:text-sm active:scale-95 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>ייצוא ל-JSON</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-semibold text-xs sm:text-sm active:scale-95 transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>ייבוא מקובץ</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
          </div>
        </div>

        {/* Share & Mobile Installation */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">שיתוף והתקנה במכשיר</h3>

          <button
            onClick={handleShare}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-md active:scale-95 transition-all"
          >
            <Share2 className="w-4 h-4" />
            <span>שתף את האפליקציה (העתק קישור)</span>
          </button>

          {/* Collapsible Installation Guide */}
          <div className="rounded-2xl border border-slate-700/60 bg-slate-800/40 overflow-hidden">
            <button
              onClick={() => setShowInstallGuide(!showInstallGuide)}
              className="w-full p-3 flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-400" />
                <span>כיצד להתקין כאפליקציה בטלפון?</span>
              </div>
              {showInstallGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showInstallGuide && (
              <div className="p-3 pt-0 text-xs text-slate-300 border-t border-slate-700/40 space-y-2 mt-2">
                <div className="p-2.5 rounded-xl bg-slate-850 border border-slate-700/50">
                  <strong className="text-white block mb-1">🍏 באייפון (Safari):</strong>
                  <ol className="list-decimal list-inside space-y-0.5 text-slate-400">
                    <li>פתח את הקישור בדפדפן <strong>Safari</strong>.</li>
                    <li>לחץ על כפתור השיתוף (ריבוע עם חץ למעלה ⎋).</li>
                    <li>בחר <strong>"הוסף למסך הבית"</strong> (Add to Home Screen).</li>
                  </ol>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-850 border border-slate-700/50">
                  <strong className="text-white block mb-1">🤖 באנדרואיד (Chrome):</strong>
                  <p className="text-slate-400">
                    פתח ב-Chrome, לחץ על תפריט 3 הנקודות (⋮) ובחר <strong>"התקן אפליקציה"</strong>.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reset Actions */}
        <div className="flex flex-col gap-3 pt-2 border-t border-slate-800">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">איפוס התקדמות</h3>

          {/* Reset Letter */}
          <div className="flex items-center gap-2">
            <select
              value={selectedLetterToReset}
              onChange={(e) => setSelectedLetterToReset(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-indigo-500"
            >
              {LETTERS.map(l => (
                <option key={l} value={l}>אות {l}</option>
              ))}
            </select>
            <button
              onClick={handleResetLetter}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>אפס אות זו</span>
            </button>
          </div>

          {/* Reset All */}
          <button
            onClick={handleResetAll}
            className="w-full py-2.5 px-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>איפוס מלא של כל האפליקציה</span>
          </button>
        </div>
      </div>
    </div>
  );
};


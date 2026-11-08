import { get, set, del } from 'idb-keyval';
import { AppSettings, UserWordProgress, WordItem } from '../types';

const PROGRESS_KEY = 'ivoc_progress';
const SESSION_COUNTER_KEY = 'ivoc_session_counter';
const SETTINGS_KEY = 'ivoc_settings';

export const DEFAULT_SETTINGS: AppSettings = {
  soundEnabled: true,
  hapticFeedback: true,
  showHebrewFirst: false,
};

// Safe fallback helpers
function safeLocalGet<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function safeLocalSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // LocalStorage quota or unavailable
  }
}

// Progress Map
export async function getStoredProgress(): Promise<Record<string, UserWordProgress>> {
  try {
    const val = await get<Record<string, UserWordProgress>>(PROGRESS_KEY);
    if (val && typeof val === 'object') return val;
    return safeLocalGet<Record<string, UserWordProgress>>(PROGRESS_KEY, {});
  } catch {
    return safeLocalGet<Record<string, UserWordProgress>>(PROGRESS_KEY, {});
  }
}

export async function saveStoredProgress(progress: Record<string, UserWordProgress>): Promise<void> {
  try {
    await set(PROGRESS_KEY, progress);
  } catch {
    // Fallback to localStorage
  }
  safeLocalSet(PROGRESS_KEY, progress);
}

// Session Counter
export async function getStoredSessionCounter(): Promise<number> {
  try {
    const val = await get<number>(SESSION_COUNTER_KEY);
    if (typeof val === 'number') return val;
    return safeLocalGet<number>(SESSION_COUNTER_KEY, 0);
  } catch {
    return safeLocalGet<number>(SESSION_COUNTER_KEY, 0);
  }
}

export async function saveStoredSessionCounter(counter: number): Promise<void> {
  try {
    await set(SESSION_COUNTER_KEY, counter);
  } catch {
    // Fallback
  }
  safeLocalSet(SESSION_COUNTER_KEY, counter);
}

// Settings
export async function getStoredSettings(): Promise<AppSettings> {
  try {
    const val = await get<AppSettings>(SETTINGS_KEY);
    if (val && typeof val === 'object') {
      return { ...DEFAULT_SETTINGS, ...val };
    }
    return safeLocalGet<AppSettings>(SETTINGS_KEY, DEFAULT_SETTINGS);
  } catch {
    return safeLocalGet<AppSettings>(SETTINGS_KEY, DEFAULT_SETTINGS);
  }
}

export async function saveStoredSettings(settings: AppSettings): Promise<void> {
  try {
    await set(SETTINGS_KEY, settings);
  } catch {
    // Fallback
  }
  safeLocalSet(SETTINGS_KEY, settings);
}

// Reset specific letter (or 'ALL' for entire vocabulary)
export async function resetLetterProgressInDb(
  letter: string,
  words: WordItem[]
): Promise<Record<string, UserWordProgress>> {
  if (letter === 'ALL') {
    await resetAllProgressInDb();
    return {};
  }

  const current = await getStoredProgress();
  const letterWordIds = new Set(words.filter(w => w.letter === letter).map(w => w.id));

  const updated: Record<string, UserWordProgress> = {};
  for (const [id, progress] of Object.entries(current)) {
    if (!letterWordIds.has(id)) {
      updated[id] = progress;
    }
  }

  await saveStoredProgress(updated);
  return updated;
}

// Full Reset
export async function resetAllProgressInDb(): Promise<void> {
  try {
    await del(PROGRESS_KEY);
    await del(SESSION_COUNTER_KEY);
  } catch {
    // IDB error
  }
  try {
    localStorage.removeItem(PROGRESS_KEY);
    localStorage.removeItem(SESSION_COUNTER_KEY);
  } catch {
    // localStorage error
  }
}

// Export progress to downloadable JSON
export async function exportProgressToJson(): Promise<void> {
  const progress = await getStoredProgress();
  const sessionCounter = await getStoredSessionCounter();
  const settings = await getStoredSettings();

  const backupData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    sessionCounter,
    settings,
    progress,
  };

  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  a.href = url;
  a.download = `ivoc_backup_${timestamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Import progress from JSON string
export async function importProgressFromJson(jsonString: string): Promise<{
  progress: Record<string, UserWordProgress>;
  sessionCounter: number;
  settings: AppSettings;
}> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error('קובץ הגיבוי אינו בפורמט JSON תקין');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('מבנה קובץ הגיבוי אינו תקין');
  }

  const data = parsed as {
    progress?: Record<string, UserWordProgress>;
    sessionCounter?: number;
    settings?: AppSettings;
  };

  if (!data.progress || typeof data.progress !== 'object') {
    throw new Error('קובץ הגיבוי אינו כולל נתוני התקדמות תקינים');
  }

  const progress = data.progress;
  const sessionCounter = typeof data.sessionCounter === 'number' ? data.sessionCounter : 0;
  const settings = { ...DEFAULT_SETTINGS, ...(data.settings || {}) };

  await saveStoredProgress(progress);
  await saveStoredSessionCounter(sessionCounter);
  await saveStoredSettings(settings);

  return { progress, sessionCounter, settings };
}


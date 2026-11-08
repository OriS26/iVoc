export type LeitnerBox = 0 | 1 | 2 | 3 | 4 | 5;
// 0: Unlearned / Wrong Answer
// 1: Novice (Interval: 2 questions)
// 2: Familiar (Interval: 5 questions)
// 3: Intermediate (Interval: 12 questions)
// 4: Advanced (Interval: 28 questions)
// 5: Mastered (Excluded from active quiz pool until full reset)

export interface WordItem {
  id: string;             // e.g. "abandon_1"
  word: string;           // English (e.g. "Abandon")
  translation: string;    // Hebrew (e.g. "לנטוש, לעזוב")
  letter: string;         // 'A' through 'Z'
  exampleSentence?: string;
}

export interface UserWordProgress {
  wordId: string;
  box: LeitnerBox;
  consecutiveCorrect: number;
  totalAttempts: number;
  totalErrors: number;
  lastReviewedAt: number; // Timestamp (epoch ms)
  nextDueCounter: number; // Question counter index when it should reappear
}

export interface AppSettings {
  soundEnabled: boolean;
  hapticFeedback: boolean;
  showHebrewFirst: boolean; // default false (English to Hebrew)
}

export interface LetterMasterySummary {
  letter: string;
  totalWords: number;
  masteredWords: number;
  learningWords: number;
  unlearnedWords: number;
  accuracyRate: number;
}


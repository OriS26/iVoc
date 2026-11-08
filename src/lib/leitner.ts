import { LeitnerBox, UserWordProgress, WordItem } from '../types';

export const LEITNER_INTERVALS: Record<number, number> = {
  1: 2,  // Box 1 -> 2 questions later
  2: 5,  // Box 2 -> 5 questions later
  3: 12, // Box 3 -> 12 questions later
  4: 28, // Box 4 -> 28 questions later
};

/**
 * Computes updated progress on correct answer
 */
export function processCorrectAnswer(
  prevProgress: UserWordProgress | undefined,
  wordId: string,
  sessionCounter: number
): { updatedProgress: UserWordProgress; isMastered: boolean } {
  const currentBox = (prevProgress?.box ?? 0) as LeitnerBox;
  const newBox = Math.min(5, currentBox + 1) as LeitnerBox;
  const isMastered = newBox === 5;

  const interval = LEITNER_INTERVALS[newBox] ?? 0;
  const nextDue = sessionCounter + interval;

  const updatedProgress: UserWordProgress = {
    wordId,
    box: newBox,
    consecutiveCorrect: (prevProgress?.consecutiveCorrect ?? 0) + 1,
    totalAttempts: (prevProgress?.totalAttempts ?? 0) + 1,
    totalErrors: prevProgress?.totalErrors ?? 0,
    lastReviewedAt: Date.now(),
    nextDueCounter: nextDue,
  };

  return { updatedProgress, isMastered };
}

/**
 * Computes updated progress on incorrect answer
 */
export function processIncorrectAnswer(
  prevProgress: UserWordProgress | undefined,
  wordId: string,
  sessionCounter: number
): { updatedProgress: UserWordProgress } {
  const updatedProgress: UserWordProgress = {
    wordId,
    box: 0,
    consecutiveCorrect: 0,
    totalAttempts: (prevProgress?.totalAttempts ?? 0) + 1,
    totalErrors: (prevProgress?.totalErrors ?? 0) + 1,
    lastReviewedAt: Date.now(),
    nextDueCounter: sessionCounter + 1, // Re-appears immediately or next question
  };

  return { updatedProgress };
}

/**
 * Selects the next word to quiz according to Leitner rules
 */
export function selectNextWord(
  activeWords: WordItem[],
  progressMap: Record<string, UserWordProgress>,
  sessionCounter: number,
  lastWordId?: string,
  shuffle: boolean = true
): WordItem | null {
  if (!activeWords.length) return null;

  // Filter out fully mastered words (box 5)
  const unmastered = activeWords.filter(w => {
    const p = progressMap[w.id];
    return !p || p.box < 5;
  });

  if (unmastered.length === 0) {
    return null; // All words mastered in this pool!
  }

  // If only 1 word remaining, return it
  if (unmastered.length === 1) {
    return unmastered[0];
  }

  // Candidate pool excluding lastWordId if possible
  const candidates = unmastered.filter(w => w.id !== lastWordId);
  const pool = candidates.length > 0 ? candidates : unmastered;

  // Priority 1: Any word where box < 5 AND sessionCounter >= nextDueCounter AND has attempts
  const dueWords = pool.filter(w => {
    const p = progressMap[w.id];
    return p && p.totalAttempts > 0 && sessionCounter >= p.nextDueCounter;
  });

  if (dueWords.length > 0) {
    if (shuffle) {
      // Pick randomly among due words that share the lowest box level
      const minBox = Math.min(...dueWords.map(w => progressMap[w.id].box));
      const lowestDue = dueWords.filter(w => progressMap[w.id].box === minBox);
      const randomIdx = Math.floor(Math.random() * lowestDue.length);
      return lowestDue[randomIdx];
    } else {
      dueWords.sort((a, b) => {
        const pa = progressMap[a.id];
        const pb = progressMap[b.id];
        if (pa.box !== pb.box) return pa.box - pb.box;
        return pa.nextDueCounter - pb.nextDueCounter;
      });
      return dueWords[0];
    }
  }

  // Priority 2: Unstudied words (totalAttempts == 0 or no progress)
  const unstudiedWords = pool.filter(w => {
    const p = progressMap[w.id];
    return !p || p.totalAttempts === 0;
  });

  if (unstudiedWords.length > 0) {
    if (shuffle) {
      const randomIdx = Math.floor(Math.random() * unstudiedWords.length);
      return unstudiedWords[randomIdx];
    }
    return unstudiedWords[0];
  }

  // Fallback: Word with lowest box level
  const minBox = Math.min(...pool.map(w => progressMap[w.id]?.box ?? 0));
  const lowestBoxPool = pool.filter(w => (progressMap[w.id]?.box ?? 0) === minBox);
  if (shuffle) {
    const randomIdx = Math.floor(Math.random() * lowestBoxPool.length);
    return lowestBoxPool[randomIdx];
  }

  const sortedByBox = [...pool].sort((a, b) => {
    const boxA = progressMap[a.id]?.box ?? 0;
    const boxB = progressMap[b.id]?.box ?? 0;
    if (boxA !== boxB) return boxA - boxB;
    return (progressMap[a.id]?.nextDueCounter ?? 0) - (progressMap[b.id]?.nextDueCounter ?? 0);
  });

  return sortedByBox[0] ?? null;
}

/**
 * Fisher-Yates shuffle
 */
export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generates 4 multiple choice options: 1 correct + 3 unique distractors
 */
export function generateQuizOptions(
  targetWord: WordItem,
  letterWords: WordItem[],
  allWords: WordItem[],
  showHebrewFirst: boolean
): { text: string; isCorrect: boolean }[] {
  const getLabel = (w: WordItem) => showHebrewFirst ? w.word : w.translation;
  const correctText = getLabel(targetWord);

  const seen = new Set<string>([correctText]);
  const distractors: string[] = [];

  // Try picking from letterWords first
  const shuffledLetterWords = shuffleArray(letterWords);
  for (const w of shuffledLetterWords) {
    const text = getLabel(w);
    if (!seen.has(text)) {
      seen.add(text);
      distractors.push(text);
      if (distractors.length >= 3) break;
    }
  }

  // If fewer than 3, pick from allWords by random sampling
  if (distractors.length < 3 && allWords.length > 0) {
    let attempts = 0;
    while (distractors.length < 3 && attempts < 50) {
      attempts++;
      const randomWord = allWords[Math.floor(Math.random() * allWords.length)];
      const text = getLabel(randomWord);
      if (!seen.has(text)) {
        seen.add(text);
        distractors.push(text);
      }
    }
  }

  const options = [
    { text: correctText, isCorrect: true },
    ...distractors.map(d => ({ text: d, isCorrect: false }))
  ];

  return shuffleArray(options);
}


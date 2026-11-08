# MISSION DIRECTIVE: Autonomous Build of "iVoc" iOS Offline PWA

## 1. System Role & Autonomous Execution Rules
You are an expert Principal Full-Stack Engineer and Mobile PWA Architect. Your objective is to scaffold, implement, test, and build a production-ready, zero-cost, offline-first English Vocabulary Learning Web Application tailored for iOS Safari PWA (Psychometric/Amiram style).

### Autonomous Execution Constraints:
1. **Zero Human Intervention:** Do not ask clarifying questions. Make sensible, modern technical decisions adhering strictly to this document.
2. **No Placeholders:** Do not write `// TODO`, `/* Add items here */`, or dummy functions. Every function, state, and UI component must be fully implemented.
3. **Zero External Runtime CDNs:** Everything (fonts, icons, styles, datasets) must be bundled locally into the build so the app functions 100% offline in Airplane Mode.
4. **Target Platform:** iOS Safari Standalone PWA (Safe Area Inset, smooth 120Hz touch feedback, no bounce scrolling, full screen).

---

## 2. Tech Stack & Dependencies
* **Framework:** React 18+ with TypeScript
* **Bundler:** Vite
* **Styling:** Tailwind CSS (configured with dark theme slate/indigo palette, RTL support for Hebrew, Safe Area Utilities)
* **Icons:** `lucide-react`
* **Local Persistence:** `idb-keyval` (Lightweight IndexedDB wrapper)
* **PWA & Offline:** `vite-plugin-pwa` with Workbox Service Worker
* **Delight & Animations:** `canvas-confetti` (with types)

---

## 3. Directory Structure to Scaffold
```text
vocab-trainer/
├── public/
│   ├── favicon.ico
│   ├── apple-touch-icon.png
│   ├── pwa-192x192.png
│   ├── pwa-512x512.png
│   └── data/
│       └── vocabulary.json        # Bundled static word bank (A-Z)
├── src/
│   ├── components/
│   │   ├── Header.tsx             # Title, letter title, streak, settings trigger
│   │   ├── LetterSelector.tsx     # A-Z grid with mastery progress bars
│   │   ├── QuizCard.tsx           # 4-option multiple-choice quiz engine
│   │   ├── StatsModal.tsx         # Comprehensive progress breakdown
│   │   ├── BackupModal.tsx        # JSON Export / Import handler
│   │   └── ProgressBar.tsx        # Visual Leitner Box indicators
│   ├── lib/
│   │   ├── db.ts                  # IndexedDB persistent storage API
│   │   ├── leitner.ts             # Spaced Repetition / Decay Algorithm
│   │   └── sound.ts               # Web Audio API synthetic beeps (no audio assets needed)
│   ├── types/
│   │   └── index.ts               # Core domain models
│   ├── App.tsx                    # Root state coordinator
│   ├── index.css                  # Tailwind imports & iOS touch overrides
│   └── main.tsx                   # PWA registration and React mount
├── index.html                     # iOS standalone meta tags
├── tailwind.config.js
├── vite.config.ts                 # Full PWA offline service worker configuration
└── package.json
```

---

## 4. Domain Data Model (`src/types/index.ts`)

```typescript
export type LeitnerBox = 0 | 1 | 2 | 3 | 4 | 5; 
// 0: Unlearned / Wrong Answer
// 1: Novice (Interval: 1)
// 2: Familiar (Interval: 3)
// 3: Intermediate (Interval: 8)
// 4: Advanced (Interval: 20)
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
```

---

## 5. Leitner Decay Engine & Scheduling Logic (`src/lib/leitner.ts`)

The user wants an authentic spaced repetition experience: a word continues to appear after being solved, but with exponentially increasing intervals until it reaches Level 5 (Mastered) and leaves the active loop.

### Algorithm Rules:
1. **Global Session Counter:** Maintain an incremental `sessionCounter` (increases by 1 on every answered question).
2. **On Correct Answer:**
   * If current `box < 5`: `box = box + 1`.
   * Compute next due question index: `nextDueCounter = sessionCounter + Interval(box)`.
     * Box 1: `Interval = 2 questions`
     * Box 2: `Interval = 5 questions`
     * Box 3: `Interval = 12 questions`
     * Box 4: `Interval = 28 questions`
     * Box 5: `Mastered` (mark as inactive).
3. **On Incorrect Answer:**
   * Drop word immediately back to `box = 0`.
   * Set `nextDueCounter = sessionCounter + 1` (will appear again immediately or within the next 2 questions).
4. **Queue Selection Logic for Next Question:**
   * Priority 1: Any word where `box < 5` AND `sessionCounter >= nextDueCounter`.
   * Priority 2: Unstudied words in the chosen Letter (`box == 0` and `totalAttempts == 0`).
   * Fallback: If no words are strictly due, select the word in the active list with the lowest `box` level.
5. **Multiple Choice Distractor Generation:**
   * Correct option = `targetWord.translation`.
   * 3 Incorrect options = randomly sampled translations from the same letter bank or the global bank (never duplicate the correct answer).

---

## 6. Offline Persistence & Storage API (`src/lib/db.ts`)

Implement robust storage using `idb-keyval` with error fallback to `localStorage`:
* Key `ivoc_progress`: Map of `Record<string, UserWordProgress>`
* Key `ivoc_session_counter`: `number`
* Key `ivoc_settings`: `AppSettings`

### Required Backup/Restore Utility Functions:
* `exportProgressToJson()`: Generates a JSON string of all progress and triggers a native file download (`ivoc_backup_TIMESTAMP.json`).
* `importProgressFromJson(jsonString: string)`: Validates format, merges or overwrites current IndexedDB state, and reloads state.

---

## 7. iOS Standalone Web App Meta Configuration (`index.html`)

Must include the following tags in `<head>` to eliminate all Safari browser UI chrome:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="iVoc" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<meta name="theme-color" content="#0f172a" />
<style>
  /* Prevent iOS rubber-banding and accidental text selection during fast tapping */
  html, body {
    overscroll-behavior-y: none;
    -webkit-user-select: none;
    user-select: none;
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
  }
</style>
```

---

## 8. Service Worker & PWA Bundler Config (`vite.config.ts`)

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'data/vocabulary.json'],
      manifest: {
        name: 'iVoc - Vocabulary Trainer',
        short_name: 'iVoc',
        description: 'תרגול אוצר מילים לפסיכומטרי ולאמירם במצב אופליין מלא',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'document' || request.destination === 'script' || request.destination === 'style',
            handler: 'CacheFirst',
            options: {
              cacheName: 'app-shell-cache',
            }
          }
        ]
      }
    })
  ]
});
```

---

## 9. Comprehensive Word Bank Creation (`public/data/vocabulary.json`)

The agent MUST generate a rich, accurate vocabulary bank in `public/data/vocabulary.json` containing **at least 30 authentic Psychometric / Amir / Amiram words per letter for letters A through Z** (approx. 780–800 words total in the baseline file).

Each entry must strictly follow:
```json
[
  {
    "id": "advocate_1",
    "word": "Advocate",
    "translation": "לסנגר, לתמוך ; חסיד, תומך",
    "letter": "A",
    "exampleSentence": "She is a strong advocate for human rights."
  },
  {
    "id": "benign_1",
    "word": "Benign",
    "translation": "שפיר, עדין, לא מזיק",
    "letter": "B",
    "exampleSentence": "The doctor reassured him that the tumor was benign."
  }
]
```
Ensure high-frequency psychometric vocabulary:
* **A:** Abandon, Abolish, Abundant, Accomplish, Accumulate, Adjacent, Advocate, Ambiguous, Amend, Anticipate, Approximate, Arbitrary, Ascertain, Aspect, Assert, Assess, Attribute, Authorize, Autonomous, Avid...
* **B:** Barren, Belligerent, Benevolent, Benign, Bias, Breach, Brief, Bulk...
* And continue rigorously across all letters C through Z.

---

## 10. Web Audio API Feedback (`src/lib/sound.ts`)
To avoid any external `.mp3` assets, build sound effects using native Web Audio synthetic oscillators:
* `playSuccessSound()`: Crisp two-tone ascending chime (523Hz -> 659Hz).
* `playErrorSound()`: Low subtle buzz (180Hz downward pitch drop).
* `playMasteryFanfare()`: Short 3-note celebration arpeggio.

---

## 11. UI/UX Requirements
* **Orientation:** Clean, native-app feel on mobile (max-width `max-w-md` centered on desktop).
* **Color Scheme:** Dark mode default (`bg-slate-900`, `text-slate-100`, accents in `indigo-500` / `emerald-500` / `rose-500`).
* **Letter Selector Screen:**
  * Grid of buttons from A to Z.
  * Each card displays the letter and a progress ring or mini progress bar (e.g. `24/30 Mastered`).
  * "Practice All" button option.
* **Practice Screen:**
  * Top bar: Back to letters, current letter label, active Leitner box level of current word (0 to 5 pill tags).
  * Center card: Target word in big bold font (`text-3xl font-extrabold tracking-wide`). Optional speaker icon to trigger SpeechSynthesis (Native Safari TTS).
  * 4 Option Buttons (2x2 grid or stacked vertically). Generous tap targets (min 54px height).
  * Tap logic:
    * Tap correct: Option instantly lights up emerald/green, plays success sound, increments box.
    * Tap incorrect: Selected button flashes red, correct answer is highlighted green, card stays for 1.2s so the user can read the correct translation.
  * When a word reaches Box 5: Trigger `canvas-confetti` fireworks with a message "מילה זו הועברה לשליטה מלאה!".
* **Settings & Backup:**
  * Top corner gear icon opening a modal.
  * Direct "ייצוא נתונים לקובץ JSON" button.
  * Direct "ייבוא נתונים מקובץ" button.
  * "איפוס התקדמות אות" ו-"איפוס מלא".

---

## 12. Verification & Build Script Execution
Upon completing the code files:
1. Run `npm install` (verify all modules: `vite-plugin-pwa`, `lucide-react`, `idb-keyval`, `canvas-confetti`).
2. Generate placeholder PNG icons in `public/` (or an SVG-to-PNG fallback script) so Vite PWA build does not fail on missing icons.
3. Run `npm run build` and ensure TypeScript compiles with 0 errors.
4. Launch preview or notify readiness.
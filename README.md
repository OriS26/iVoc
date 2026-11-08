# iVoc - English Vocabulary Trainer 📱✨

An offline-first, zero-cost Progressive Web Application (PWA) tailored for iOS Safari and mobile devices, designed for mastering high-frequency English vocabulary for Psychometric and Amiram examinations using the Leitner Spaced Repetition method.

![App Screenshot](public/pwa-192x192.png)

---

## 🚀 Key Features

* **Spaced Repetition Decay Engine (Leitner Box System)**:
  * 5 progressive mastery boxes with exponential interval scheduling:
    * **Box 1**: Interval = 2 questions
    * **Box 2**: Interval = 5 questions
    * **Box 3**: Interval = 12 questions
    * **Box 4**: Interval = 28 questions
    * **Box 5**: Mastered (Celebrated with `canvas-confetti` and retired from active review)
  * Immediate reset to Box 0 on incorrect answers for rapid reinforcement.
* **Comprehensive 780-Word Psychometric Vocabulary Bank**:
  * 30 high-frequency, authentic exam words per letter for all letters **A through Z**.
  * Precise Hebrew translations and natural English contextual example sentences.
* **100% Offline Capability (Airplane Mode)**:
  * Built using `vite-plugin-pwa` and Workbox Service Worker caching.
  * Local IndexedDB persistence via `idb-keyval` with automatic fallback to `localStorage`.
  * Synthetic sound effects powered by native Web Audio API oscillators (no external audio assets).
* **iOS Safari Standalone Experience**:
  * Custom viewport configuration (`viewport-fit=cover`, safe area insets).
  * No rubber-banding bounce, fast 120Hz tap feedback, and no accidental text selection.
  * Native English speech pronunciation (Safari Web Speech API).
* **Analytics, Backup & Settings**:
  * Visual progress tracking per letter and global mastery ring.
  * Detailed statistics modal with box breakdown and accuracy metrics.
  * Full JSON export and import for seamless multi-device backup and progress transfer.
  * Flexible settings: sound effects toggle, haptic feedback toggle, English ↔ Hebrew direction.

---

## 🛠️ Tech Stack

* **Framework**: React 18 + TypeScript
* **Bundler**: Vite 5
* **Styling**: Tailwind CSS (dark mode slate/indigo palette, RTL Hebrew support)
* **Icons**: `lucide-react`
* **Local Persistence**: `idb-keyval` (IndexedDB)
* **PWA & Offline**: `vite-plugin-pwa` + Workbox
* **Delight & Animations**: `canvas-confetti`

---

## 📦 Getting Started

### Prerequisites

* Node.js 18+ (tested on Node v22)
* npm

### Installation

```bash
# Clone the repository
git clone https://github.com/OriS26/iVoc.git

# Navigate to project directory
cd iVoc

# Install dependencies
npm install
```

### Development Server

```bash
npm run dev
```

### Production Build & PWA Preview

```bash
# Type check and build production assets with offline service worker
npm run build

# Preview production build locally
npm run preview
```

---

## 📲 Installing on iOS (iPhone / iPad)

1. Open the application URL in **Safari**.
2. Tap the **Share** button (box with an arrow pointing up) in the Safari toolbar.
3. Scroll down and tap **"Add to Home Screen"** (**הוסף למסך הבית**).
4. Launch **iVoc** directly from your Home Screen for a native, full-screen standalone experience that works completely offline.


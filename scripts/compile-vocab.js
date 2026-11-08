import fs from 'fs';
import path from 'path';
import { wordsAD } from './words/a-d.js';
import { wordsEH } from './words/e-h.js';
import { wordsIL } from './words/i-l.js';
import { wordsMP } from './words/m-p.js';
import { wordsQT } from './words/q-t.js';
import { wordsUX } from './words/u-x.js';
import { wordsYZ } from './words/y-z.js';

const allWords = [
  ...wordsAD,
  ...wordsEH,
  ...wordsIL,
  ...wordsMP,
  ...wordsQT,
  ...wordsUX,
  ...wordsYZ,
];

console.log(`Merged ${allWords.length} words total.`);

// Validation
const seenIds = new Set();
const seenWords = new Set();
const letterCounts = {};

allWords.forEach((item, index) => {
  if (!item.id || !item.word || !item.translation || !item.letter || !item.exampleSentence) {
    throw new Error(`Incomplete entry at index ${index}: ${JSON.stringify(item)}`);
  }
  if (seenIds.has(item.id)) {
    throw new Error(`Duplicate id detected: ${item.id}`);
  }
  seenIds.add(item.id);
  letterCounts[item.letter] = (letterCounts[item.letter] || 0) + 1;
});

console.log('Letter counts breakdown:');
for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
  console.log(`  ${letter}: ${letterCounts[letter] || 0}`);
  if ((letterCounts[letter] || 0) < 30) {
    throw new Error(`Letter ${letter} has only ${letterCounts[letter] || 0} words (expected >= 30)`);
  }
}

// Write to public/data/vocabulary.json
const outputPath = path.resolve('public/data/vocabulary.json');
fs.writeFileSync(outputPath, JSON.stringify(allWords, null, 2), 'utf-8');
console.log(`Successfully wrote ${allWords.length} words to ${outputPath}`);


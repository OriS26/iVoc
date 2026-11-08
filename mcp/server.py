#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
iVoc Local MCP Server
Exposes Leitner spaced-repetition vocabulary learning tools via standard MCP JSON-RPC 2.0 stdio protocol.
"""

import sys
import os
import json
import random
import time
from pathlib import Path

# Ensure UTF-8 IO for Windows terminals and MCP stdio
if sys.platform == "win32":
    sys.stdin.reconfigure(encoding="utf-8")
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
VOCAB_PATH = BASE_DIR / "public" / "data" / "vocabulary.json"
PROGRESS_PATH = Path(__file__).resolve().parent / "progress.json"

LEITNER_INTERVALS = {
    1: 2,   # Box 1 -> 2 questions later
    2: 5,   # Box 2 -> 5 questions later
    3: 12,  # Box 3 -> 12 questions later
    4: 28,  # Box 4 -> 28 questions later
}

class IVocEngine:
    def __init__(self, vocab_file: Path, progress_file: Path):
        self.vocab_file = vocab_file
        self.progress_file = progress_file
        self.words = []
        self.words_by_id = {}
        self.words_by_letter = {}
        self.progress = {}
        self.session_counter = 0
        self.last_word_id = None
        self.load_vocab()
        self.load_progress()

    def load_vocab(self):
        if not self.vocab_file.exists():
            raise FileNotFoundError(f"Vocabulary file not found at {self.vocab_file}")
        with open(self.vocab_file, "r", encoding="utf-8") as f:
            self.words = json.load(f)
        self.words_by_id = {w["id"]: w for w in self.words}
        self.words_by_letter = {}
        for w in self.words:
            let = w.get("letter", "A").upper()
            if let not in self.words_by_letter:
                self.words_by_letter[let] = []
            self.words_by_letter[let].append(w)

    def load_progress(self):
        if self.progress_file.exists():
            try:
                with open(self.progress_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.progress = data.get("progress", {})
                    self.session_counter = data.get("session_counter", 0)
                    return
            except Exception as e:
                sys.stderr.write(f"[WARN] Failed to read progress file: {e}\n")
        self.progress = {}
        self.session_counter = 0

    def save_progress(self):
        try:
            with open(self.progress_file, "w", encoding="utf-8") as f:
                json.dump({
                    "session_counter": self.session_counter,
                    "last_updated": time.time(),
                    "progress": self.progress
                }, f, ensure_ascii=False, indent=2)
        except Exception as e:
            sys.stderr.write(f"[ERROR] Failed to save progress: {e}\n")

    def reset_progress(self, letter: str = "ALL"):
        letter_norm = letter.upper().strip()
        if letter_norm == "ALL" or not letter_norm:
            self.progress = {}
            self.session_counter = 0
            self.last_word_id = None
            self.save_progress()
            return {"status": "success", "message": "All progress reset successfully."}
        else:
            letter_words = self.words_by_letter.get(letter_norm, [])
            for w in letter_words:
                self.progress.pop(w["id"], None)
            self.save_progress()
            return {"status": "success", "message": f"Progress for letter '{letter_norm}' reset successfully."}

    def get_stats(self):
        box_counts = {0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        total_attempts = 0
        total_errors = 0
        studied_count = 0

        for w in self.words:
            wid = w["id"]
            p = self.progress.get(wid)
            if p:
                box = p.get("box", 0)
                box_counts[box] = box_counts.get(box, 0) + 1
                total_attempts += p.get("totalAttempts", 0)
                total_errors += p.get("totalErrors", 0)
                if p.get("totalAttempts", 0) > 0:
                    studied_count += 1
            else:
                box_counts[0] += 1

        correct_count = total_attempts - total_errors
        accuracy = (correct_count / total_attempts * 100.0) if total_attempts > 0 else 0.0

        return {
            "totalWords": len(self.words),
            "studiedWords": studied_count,
            "masteredWords": box_counts[5],
            "sessionCounter": self.session_counter,
            "totalAttempts": total_attempts,
            "correctAnswers": correct_count,
            "errorCount": total_errors,
            "accuracy": f"{accuracy:.1f}%",
            "boxDistribution": {
                "box0_unstudied_or_learning": box_counts[0],
                "box1_learning": box_counts[1],
                "box2_familiar": box_counts[2],
                "box3_known": box_counts[3],
                "box4_advanced": box_counts[4],
                "box5_mastered": box_counts[5],
            }
        }

    def get_next_question(self, letter: str = "ALL", show_hebrew_first: bool = False):
        letter_norm = letter.upper().strip() if letter else "ALL"
        if letter_norm == "ALL" or not letter_norm:
            pool_words = self.words
        else:
            pool_words = self.words_by_letter.get(letter_norm, [])
            if not pool_words:
                return {"error": f"No words found for letter '{letter_norm}'."}

        # Filter out mastered words (box 5)
        unmastered = [w for w in pool_words if self.progress.get(w["id"], {}).get("box", 0) < 5]
        if not unmastered:
            return {
                "message": f"Congratulations! All words in {'letter ' + letter_norm if letter_norm != 'ALL' else 'the dictionary'} are mastered (Box 5)!",
                "allMastered": True
            }

        candidates = [w for w in unmastered if w["id"] != self.last_word_id]
        selection_pool = candidates if candidates else unmastered

        # Priority 1: Due words (box < 5 AND session_counter >= nextDueCounter AND attempts > 0)
        due_words = [
            w for w in selection_pool
            if self.progress.get(w["id"], {}).get("totalAttempts", 0) > 0
            and self.session_counter >= self.progress.get(w["id"], {}).get("nextDueCounter", 0)
        ]

        selected_word = None
        if due_words:
            min_box = min(self.progress[w["id"]]["box"] for w in due_words)
            lowest_due = [w for w in due_words if self.progress[w["id"]]["box"] == min_box]
            selected_word = random.choice(lowest_due)
        else:
            # Priority 2: Unstudied words
            unstudied = [w for w in selection_pool if self.progress.get(w["id"], {}).get("totalAttempts", 0) == 0]
            if unstudied:
                selected_word = random.choice(unstudied)
            else:
                # Fallback: lowest box level
                min_box = min(self.progress.get(w["id"], {}).get("box", 0) for w in selection_pool)
                lowest_pool = [w for w in selection_pool if self.progress.get(w["id"], {}).get("box", 0) == min_box]
                selected_word = random.choice(lowest_pool)

        self.last_word_id = selected_word["id"]
        current_progress = self.progress.get(selected_word["id"], {})
        current_box = current_progress.get("box", 0)

        # Generate options (1 correct + 3 distractors)
        options = self._generate_options(selected_word, pool_words, show_hebrew_first)

        prompt_text = selected_word["translation"] if show_hebrew_first else selected_word["word"]
        target_answer = selected_word["word"] if show_hebrew_first else selected_word["translation"]

        return {
            "wordId": selected_word["id"],
            "word": selected_word["word"],
            "letter": selected_word.get("letter", "A"),
            "currentBox": current_box,
            "sessionCounter": self.session_counter,
            "prompt": prompt_text,
            "promptLanguage": "hebrew" if show_hebrew_first else "english",
            "targetLanguage": "english" if show_hebrew_first else "hebrew",
            "options": options,
            "targetAnswer": target_answer # Available for server reference
        }

    def _generate_options(self, target_word, pool_words, show_hebrew_first):
        target_label = target_word["word"] if show_hebrew_first else target_word["translation"]
        seen = {target_label}
        distractors = []

        # Try to sample from same pool
        shuffled_pool = list(pool_words)
        random.shuffle(shuffled_pool)
        for w in shuffled_pool:
            label = w["word"] if show_hebrew_first else w["translation"]
            if label not in seen:
                seen.add(label)
                distractors.append(label)
                if len(distractors) >= 3:
                    break

        # Fallback to all words if needed
        if len(distractors) < 3:
            all_shuffled = list(self.words)
            random.shuffle(all_shuffled)
            for w in all_shuffled:
                label = w["word"] if show_hebrew_first else w["translation"]
                if label not in seen:
                    seen.add(label)
                    distractors.append(label)
                    if len(distractors) >= 3:
                        break

        options = [target_label] + distractors
        random.shuffle(options)
        return options

    def submit_answer(self, word_id: str, selected_answer: str):
        if word_id not in self.words_by_id:
            return {"error": f"Word ID '{word_id}' not found."}

        word_item = self.words_by_id[word_id]
        prev_progress = self.progress.get(word_id, {
            "box": 0,
            "consecutiveCorrect": 0,
            "totalAttempts": 0,
            "totalErrors": 0,
            "lastReviewedAt": 0,
            "nextDueCounter": 0
        })

        is_correct = (selected_answer.strip() == word_item["translation"].strip()) or \
                     (selected_answer.strip().lower() == word_item["word"].strip().lower())

        self.session_counter += 1
        current_box = prev_progress.get("box", 0)

        if is_correct:
            new_box = min(5, current_box + 1)
            is_mastered = (new_box == 5)
            interval = LEITNER_INTERVALS.get(new_box, 0)
            next_due = self.session_counter + interval

            updated = {
                "box": new_box,
                "consecutiveCorrect": prev_progress.get("consecutiveCorrect", 0) + 1,
                "totalAttempts": prev_progress.get("totalAttempts", 0) + 1,
                "totalErrors": prev_progress.get("totalErrors", 0),
                "lastReviewedAt": int(time.time() * 1000),
                "nextDueCounter": next_due
            }
            feedback_msg = (
                f"נכון מאוד! '{word_item['word']}' = '{word_item['translation']}'. "
                f"עלה מתיבה {current_box} לתיבה {new_box}!"
            )
            if is_mastered:
                feedback_msg += " 🏆 המילה הגיעה לתיבה 5 ונלמדה בהצלחה (Mastered)!"
            elif interval > 0:
                feedback_msg += f" (החזרה הבאה בעוד {interval} שאלות)"
        else:
            new_box = 0
            is_mastered = False
            interval = 1
            next_due = self.session_counter + 1

            updated = {
                "box": 0,
                "consecutiveCorrect": 0,
                "totalAttempts": prev_progress.get("totalAttempts", 0) + 1,
                "totalErrors": prev_progress.get("totalErrors", 0) + 1,
                "lastReviewedAt": int(time.time() * 1000),
                "nextDueCounter": next_due
            }
            feedback_msg = (
                f"טעות. התשובה הנכונה עבור '{word_item['word']}' היא '{word_item['translation']}'. "
                f"המילה חוזרת לתיבה 0 לחזרה מוקדמת."
            )

        self.progress[word_id] = updated
        self.save_progress()

        return {
            "correct": is_correct,
            "word": word_item["word"],
            "correctTranslation": word_item["translation"],
            "selectedAnswer": selected_answer,
            "previousBox": current_box,
            "newBox": new_box,
            "isMastered": is_mastered,
            "nextDueCounter": next_due,
            "sessionCounter": self.session_counter,
            "feedback": feedback_msg
        }

    def lookup_word(self, query: str, limit: int = 10):
        q = query.strip().lower()
        if not q:
            return []
        matches = []
        for w in self.words:
            eng_match = q in w["word"].lower()
            heb_match = q in w["translation"]
            if eng_match or heb_match:
                p = self.progress.get(w["id"], {})
                matches.append({
                    "id": w["id"],
                    "word": w["word"],
                    "translation": w["translation"],
                    "letter": w.get("letter", "A"),
                    "box": p.get("box", 0),
                    "totalAttempts": p.get("totalAttempts", 0),
                    "consecutiveCorrect": p.get("consecutiveCorrect", 0)
                })
                if len(matches) >= limit:
                    break
        return matches


# MCP Tool Definitions
TOOLS_MANIFEST = [
    {
        "name": "ivoc_get_next_question",
        "description": "Fetch the next English vocabulary quiz question according to Leitner spaced repetition. Returns word ID, prompt word, current Leitner box (0-4), and 4 multiple-choice options.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "letter": {
                    "type": "string",
                    "description": "Optional letter filter ('A'-'Z') or 'ALL' to quiz across all 3,705 words."
                },
                "showHebrewFirst": {
                    "type": "boolean",
                    "description": "If true, prompt is Hebrew and options are English. Default is false (English prompt, Hebrew options)."
                }
            }
        }
    },
    {
        "name": "ivoc_submit_answer",
        "description": "Submit an answer for a quiz question. Automatically advances Leitner box level (0->1->2->3->4->5), tracks review intervals, and updates statistics.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "wordId": {
                    "type": "string",
                    "description": "The unique word ID from ivoc_get_next_question."
                },
                "selectedAnswer": {
                    "type": "string",
                    "description": "The chosen answer text (must match one of the multiple-choice options)."
                }
            },
            "required": ["wordId", "selectedAnswer"]
        }
    },
    {
        "name": "ivoc_get_stats",
        "description": "Get Leitner learning statistics: distribution across Boxes 0 to 5, total words studied, accuracy percentage, and total session attempts.",
        "inputSchema": {
            "type": "object",
            "properties": {}
        }
    },
    {
        "name": "ivoc_lookup_word",
        "description": "Search the dictionary of 3,705 words by English prefix or Hebrew keyword, returning translations and current user box levels.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Search keyword in English or Hebrew."
                },
                "limit": {
                    "type": "integer",
                    "description": "Maximum number of results to return (default 10)."
                }
            },
            "required": ["query"]
        }
    },
    {
        "name": "ivoc_reset_progress",
        "description": "Reset study progress (boxes, scores, intervals) for a specific letter or the entire dictionary.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "letter": {
                    "type": "string",
                    "description": "Specific letter ('A'-'Z') to reset, or 'ALL' to reset everything."
                }
            }
        }
    }
]


def handle_tool_call(engine: IVocEngine, name: str, args: dict):
    if name == "ivoc_get_next_question":
        letter = args.get("letter", "ALL")
        show_hebrew = args.get("showHebrewFirst", False)
        res = engine.get_next_question(letter, show_hebrew)
        # Exclude internal targetAnswer from quiz display to avoid spoiling
        display_res = dict(res)
        if "targetAnswer" in display_res:
            display_res.pop("targetAnswer")
        return display_res

    elif name == "ivoc_submit_answer":
        word_id = args.get("wordId", "")
        selected = args.get("selectedAnswer", "")
        return engine.submit_answer(word_id, selected)

    elif name == "ivoc_get_stats":
        return engine.get_stats()

    elif name == "ivoc_lookup_word":
        query = args.get("query", "")
        limit = args.get("limit", 10)
        return engine.lookup_word(query, limit)

    elif name == "ivoc_reset_progress":
        letter = args.get("letter", "ALL")
        return engine.reset_progress(letter)

    else:
        return {"error": f"Unknown tool name: {name}"}


def main():
    engine = IVocEngine(VOCAB_PATH, PROGRESS_PATH)
    sys.stderr.write(f"[iVoc MCP Server] Initialized with {len(engine.words)} words.\n")
    sys.stderr.flush()

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue

        try:
            req = json.loads(line)
        except Exception as e:
            sys.stderr.write(f"[iVoc MCP Server] JSON parse error: {e}\n")
            continue

        req_id = req.get("id")
        method = req.get("method")
        params = req.get("params", {})

        # Handle notifications
        if method == "notifications/initialized":
            sys.stderr.write("[iVoc MCP Server] Client initialized successfully.\n")
            continue

        if method == "initialize":
            resp = {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {
                        "tools": {}
                    },
                    "serverInfo": {
                        "name": "ivoc-mcp-server",
                        "version": "1.0.0"
                    }
                }
            }
        elif method == "ping":
            resp = {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {}
            }
        elif method == "tools/list":
            resp = {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "tools": TOOLS_MANIFEST
                }
            }
        elif method == "tools/call":
            tool_name = params.get("name")
            tool_args = params.get("arguments", {})
            try:
                tool_output = handle_tool_call(engine, tool_name, tool_args)
                resp = {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "result": {
                        "content": [
                            {
                                "type": "text",
                                "text": json.dumps(tool_output, ensure_ascii=False, indent=2)
                            }
                        ],
                        "isError": "error" in tool_output
                    }
                }
            except Exception as e:
                resp = {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "result": {
                        "content": [
                            {
                                "type": "text",
                                "text": f"Error executing {tool_name}: {str(e)}"
                            }
                        ],
                        "isError": True
                    }
                }
        else:
            resp = {
                "jsonrpc": "2.0",
                "id": req_id,
                "error": {
                    "code": -32601,
                    "message": f"Method '{method}' not implemented."
                }
            }

        sys.stdout.write(json.dumps(resp, ensure_ascii=False) + "\n")
        sys.stdout.flush()


if __name__ == "__main__":
    main()

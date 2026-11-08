import zipfile
import sqlite3
import tempfile
import json
import re
import html
import os

def extract_and_convert(apkg_path, output_json_path):
    with zipfile.ZipFile(apkg_path, 'r') as z:
        tmpdir = tempfile.mkdtemp()
        db_path = z.extract('collection.anki2', tmpdir)
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        cur.execute("SELECT id, flds FROM notes ORDER BY id ASC")
        rows = cur.fetchall()
        conn.close()

    print(f"Total notes in APKG: {len(rows)}")

    words_by_letter = {}
    total_count = 0
    
    # Track word occurrences for ID generation
    word_counters = {}
    result = []

    for row_id, flds in rows:
        parts = flds.split('\x1f')
        front = parts[0].strip()
        back = parts[1].strip() if len(parts) > 1 else ""

        # Clean any HTML or entities
        front = html.unescape(re.sub(r'<[^>]+>', '', front)).strip()
        back = html.unescape(re.sub(r'<[^>]+>', '', back)).strip()

        if not front:
            continue

        # Handle ordinal numbers like "1st - first"
        m = re.match(r'^(\d+(?:st|nd|rd|th))\s*-\s*(.+)$', front, re.IGNORECASE)
        if m:
            num = m.group(1).lower()
            word_part = m.group(2).strip()
            display_word = f"{word_part.capitalize()} ({num})"
            base_word = word_part
        else:
            # Capitalize first letter of the word / phrase
            display_word = front[0].upper() + front[1:]
            base_word = front

        # Determine letter (A-Z)
        first_letter = base_word[0].upper()
        if not ('A' <= first_letter <= 'Z'):
            print(f"Warning: Non A-Z starting char: {front}")
            continue

        # Generate clean unique ID
        slug = re.sub(r'[^a-zA-Z0-9]+', '_', base_word.lower()).strip('_')
        count = word_counters.get(slug, 0) + 1
        word_counters[slug] = count
        item_id = f"{slug}_{count}"

        entry = {
            "id": item_id,
            "word": display_word,
            "translation": back,
            "letter": first_letter
        }
        result.append(entry)

    # Check if X is empty. If so, add high-frequency psychometric X words
    x_entries = [e for e in result if e["letter"] == 'X']
    if not x_entries:
        classic_x_words = [
            ("Xenophobia", "שנאת זרים"),
            ("Xerocopy", "צילום מסמך, שכפול"),
            ("Xylophone", "קסילופון (כלי נגינה)"),
            ("Xenon", "קסנון (יסוד כימי, גז אציל)"),
            ("Xenial", "מכניס אורחים, ידידותי לזרים"),
            ("Xeric", "יובשני, מותאם לתנאי יובש"),
            ("Xerox", "לצלם מסמך במכונה ; זירוקס"),
            ("Xylography", "הדפס עץ, חריטה על עץ"),
        ]
        for w, trans in classic_x_words:
            slug = w.lower()
            count = word_counters.get(slug, 0) + 1
            word_counters[slug] = count
            result.append({
                "id": f"{slug}_{count}",
                "word": w,
                "translation": trans,
                "letter": "X"
            })

    # Sort results alphabetically: first by letter, then by word text
    result.sort(key=lambda x: (x["letter"], x["word"].lower()))

    # Calculate letter distribution
    letter_counts = {}
    for item in result:
        letter_counts[item["letter"]] = letter_counts.get(item["letter"], 0) + 1

    # Write output JSON
    os.makedirs(os.path.dirname(os.path.abspath(output_json_path)), exist_ok=True)
    with open(output_json_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"\nSuccessfully generated {len(result)} words in {output_json_path}!")
    print("\nBreakdown by letter (A-Z):")
    for l in "ABCDEFGHIJKLMNOPQRSTUVWXYZ":
        print(f"  {l}: {letter_counts.get(l, 0)}")

if __name__ == "__main__":
    extract_and_convert('__-_.apkg', 'public/data/vocabulary.json')

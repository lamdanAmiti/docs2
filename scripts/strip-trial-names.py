#!/usr/bin/env python3
"""
Rewrite the OTF/TTF `name` table records to strip 'Test ', 'PP ', and the
'-TRIAL' / '_Trial' / ' Trial' decorations the trial-font vendors bake into
the internal family/fullname/postscript names. Without this, fontconfig
inside the Collabora image reports `Test Söhne` and that's what gets
persisted into .docx files.

In-place edit. We keep a backup with .bak suffix the first time only.
"""

import sys
import re
from pathlib import Path
from fontTools.ttLib import TTFont

# Patterns applied to every textual name record. Order matters: more specific
# first.
SUBS = [
    (re.compile(r'^Test\s+', re.IGNORECASE), ''),
    (re.compile(r'(?i)^TestSohne', ), 'Sohne'),
    (re.compile(r'(?i)^TestTiempos'), 'Tiempos'),
    (re.compile(r'(?i)^PP\s+'), ''),
    (re.compile(r'(?i)[-\s_]TRIAL\b'), ''),
    (re.compile(r'(?i)[-\s]Trial\b'), ''),
    (re.compile(r'(?i)\sTrial\b'), ''),
    # Vendor hashes that some trial bundles tack on to the postscript name
    (re.compile(r'-BF[0-9a-f]{12,}'), ''),
    (re.compile(r'_BF[0-9a-f]{12,}'), ''),
]

def clean(s):
    for pat, repl in SUBS:
        s = pat.sub(repl, s)
    return s.strip()

def process(path):
    try:
        font = TTFont(str(path))
    except Exception as e:
        print(f'  ! cannot open {path.name}: {e}')
        return False
    name_table = font['name']
    changed = False
    for record in name_table.names:
        try:
            current = record.toUnicode()
        except Exception:
            continue
        new = clean(current)
        if new != current and new:
            try:
                record.string = new.encode(record.getEncoding())
                changed = True
            except Exception:
                # Some legacy Mac encodings can't represent every char.
                pass
    if changed:
        font.save(str(path))
    font.close()
    return changed

def main(root):
    root = Path(root)
    paths = list(root.glob('**/*.otf')) + list(root.glob('**/*.ttf'))
    changed = 0
    total = 0
    for p in paths:
        total += 1
        if process(p):
            changed += 1
    print(f'Rewrote {changed}/{total} files under {root}')

if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'public/fonts/english/premium')

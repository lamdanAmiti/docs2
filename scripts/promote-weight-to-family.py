#!/usr/bin/env python3
"""
For every premium OTF/TTF, set the Typographic Family (name ID 16) to the
font's fullname (name ID 4), and the Typographic Subfamily (name ID 17) to
'Regular'. This makes each weight an independently addressable family in
fontconfig — `fc-match "Söhne Bold"` will hit the right file instead of
falling back to whatever default font fontconfig picks when it can't find
the name.

Without this, foundries that ship the Bold weight as just `style: 'Bold'`
of the base family (Klim Söhne 700, Tiempos Text 700) aren't reachable by
name from LibreOffice's CharFontName dispatch.

In-place; idempotent.
"""

import sys
from pathlib import Path
from fontTools.ttLib import TTFont

NAME_ID_FULLNAME = 4
NAME_ID_TYPOGRAPHIC_FAMILY = 16
NAME_ID_TYPOGRAPHIC_SUBFAMILY = 17

def process(path: Path) -> bool:
    try:
        f = TTFont(str(path))
    except Exception as e:
        print(f'  ! cannot open {path.name}: {e}')
        return False

    name = f['name']
    fullnames: list[str] = []
    for r in name.names:
        if r.nameID == NAME_ID_FULLNAME:
            try:
                fullnames.append(r.toUnicode())
            except Exception:
                pass
    if not fullnames:
        f.close()
        return False
    # Prefer the longest fullname (has weight suffix) when multiple records
    # are present.
    fullname = max(fullnames, key=len)

    changed = False
    # Replace existing nameID 16 / 17 records, or insert if absent.
    for nid, value in [(NAME_ID_TYPOGRAPHIC_FAMILY, fullname),
                       (NAME_ID_TYPOGRAPHIC_SUBFAMILY, 'Regular')]:
        existing = [r for r in name.names if r.nameID == nid]
        if existing:
            for r in existing:
                try:
                    if r.toUnicode() != value:
                        r.string = value.encode(r.getEncoding())
                        changed = True
                except Exception:
                    pass
        else:
            # Add records for the common platform/encoding combos.
            name.setName(value, nid, 3, 1, 0x409)  # Win Unicode English
            name.setName(value, nid, 1, 0, 0)       # Mac Roman English
            changed = True

    if changed:
        f.save(str(path))
    f.close()
    return changed

def main(root: str):
    p = Path(root)
    files = list(p.glob('**/*.otf')) + list(p.glob('**/*.ttf'))
    changed = 0
    for fp in files:
        if process(fp):
            changed += 1
    print(f'Promoted {changed}/{len(files)} files under {root}')

if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'public/fonts/english/premium')

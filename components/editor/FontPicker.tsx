'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';
import { hebrewFontGroups, HEBREW_FONTS } from '@/lib/fonts/hebrew-fonts';
import { HEBREW_FONT_FILE_TO_FAMILY } from '@/lib/fonts/hebrew-font-families';
import {
  GOOGLE_FONTS,
  HEBREW_GOOGLE_FONTS,
  NON_HEBREW_GOOGLE_FONTS,
  googleFontLinkUrl,
} from '@/lib/fonts/google-fonts';
import { clsx } from 'clsx';

interface Props {
  currentFont: string;
  onPick: (family: string) => void;
}

const loadedGoogleFonts = new Set<string>();
function ensureGoogleFontLoaded(family: string, weights?: number[]) {
  if (typeof document === 'undefined') return;
  if (loadedGoogleFonts.has(family)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = googleFontLinkUrl(family, weights);
  document.head.appendChild(link);
  loadedGoogleFonts.add(family);
}

const RECENT_KEY = 'velr-docs-recent-fonts';

type ScriptFilter = 'hebrew' | 'english';

export function FontPicker({ currentFont, onPick }: Props) {
  const [open, setOpen] = useState(false);
  const [scriptFilter, setScriptFilter] = useState<ScriptFilter>('hebrew');
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [recentFonts, setRecentFonts] = useState<string[]>([]);

  // Restore recent fonts from localStorage on mount
  useEffect(() => {
    try { setRecentFonts(JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]')); } catch {}
  }, []);

  function pushRecentFont(name: string) {
    setRecentFonts((prev) => {
      const next = [name, ...prev.filter((n) => n !== name)].slice(0, 6);
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [open]);

  // When the picker opens, scroll the currently-selected font into view so
  // the user lands on it instead of always at the top of the list.
  useEffect(() => {
    if (!open) return;
    // Defer to next frame so the dropdown has actually rendered.
    const id = requestAnimationFrame(() => {
      const row = scrollerRef.current?.querySelector<HTMLElement>('[data-active="true"]');
      row?.scrollIntoView({ block: 'center' });
    });
    return () => cancelAnimationFrame(id);
  }, [open, currentFont]);

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = (name: string) => !q || name.toLowerCase().includes(q);

    const recent = recentFonts.filter(matches);

    const localHebrew = hebrewFontGroups().map((g) => ({
      label: g.label,
      fonts: g.fonts.filter((f) => matches(f.name)).map((f) => ({ name: f.name, kind: 'local-hebrew' as const })),
    })).filter((g) => g.fonts.length > 0);

    const hebrewGoogle = HEBREW_GOOGLE_FONTS
      .filter((f) => matches(f.family))
      .map((f) => ({ name: f.family, kind: 'google-hebrew' as const, weights: f.weights }));

    const allOtherGoogle = NON_HEBREW_GOOGLE_FONTS
      .filter((f) => matches(f.family))
      .map((f) => ({ name: f.family, kind: 'google' as const, weights: f.weights }));

    return { recent, localHebrew, hebrewGoogle, allOtherGoogle };
  }, [recentFonts, query]);

  const visible =
    scriptFilter === 'hebrew'
      ? { ...sections, allOtherGoogle: [] }
      : { ...sections, localHebrew: [], hebrewGoogle: [] };

  const totalCount =
    visible.recent.length +
    visible.localHebrew.reduce((acc, g) => acc + g.fonts.length, 0) +
    visible.hebrewGoogle.length +
    visible.allOtherGoogle.length;

  const handleSelect = (family: string, kind: string, weights?: number[]) => {
    if (kind === 'google' || kind === 'google-hebrew') {
      ensureGoogleFontLoaded(family, weights);
    }
    // Map the display name to the file's real internal family for local
    // Hebrew fonts (e.g. 'PT Frank' → 'PFT_Frank'). Apply for both
    // 'local-hebrew' AND 'recent' clicks (recents store the display name).
    let actualFamily = family;
    if (kind === 'local-hebrew' || kind === 'recent') {
      const entry = HEBREW_FONTS.find((f) => f.name === family);
      if (entry) {
        const mapped = HEBREW_FONT_FILE_TO_FAMILY[entry.file];
        if (mapped) actualFamily = mapped;
      }
    }
    onPick(actualFamily);
    pushRecentFont(family);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="tb-btn min-w-[120px] justify-between gap-2 px-2"
        title="Font family"
      >
        <span className="truncate text-left flex-1" style={{ fontFamily: currentFont || 'Inter' }}>
          {currentFont || 'Inter'}
        </span>
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-[320px] max-h-[60vh] bg-white border border-velr-rule rounded-lg shadow-lg overflow-hidden flex flex-col">
          <div className="p-2 border-b border-velr-rule flex items-center gap-2">
            <Search className="w-4 h-4 text-velr-subtle" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search fonts…"
              className="flex-1 text-sm outline-none"
            />
            <div
              role="tablist"
              aria-label="Script filter"
              className="flex items-center shrink-0 rounded-full border border-velr-rule overflow-hidden text-xs"
            >
              <button
                type="button"
                role="tab"
                aria-selected={scriptFilter === 'hebrew'}
                onClick={() => setScriptFilter('hebrew')}
                className={clsx(
                  'px-2.5 py-1 transition-colors',
                  scriptFilter === 'hebrew'
                    ? 'bg-velr-chip text-velr-chip-text'
                    : 'text-velr-subtle hover:bg-gray-50',
                )}
                title="Show Hebrew fonts"
              >
                עברית
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={scriptFilter === 'english'}
                onClick={() => setScriptFilter('english')}
                className={clsx(
                  'px-2.5 py-1 border-l border-velr-rule transition-colors',
                  scriptFilter === 'english'
                    ? 'bg-velr-chip text-velr-chip-text'
                    : 'text-velr-subtle hover:bg-gray-50',
                )}
                title="Show English / Latin fonts"
              >
                En
              </button>
            </div>
          </div>

          <div ref={scrollerRef} className="overflow-y-auto flex-1 py-1">
            {totalCount === 0 && (
              <div className="p-4 text-xs text-velr-subtle text-center">No matches.</div>
            )}

            {visible.recent.length > 0 && (
              <Group label="Recent">
                {visible.recent.map((name) => (
                  <Row key={`r:${name}`} name={name} active={isActiveHebrew(name, currentFont) || name === currentFont} onPick={() => handleSelect(name, 'recent')} hebrew={isHebrewFont(name)} />
                ))}
              </Group>
            )}

            {visible.localHebrew.map((g) => (
              <Group key={`lh:${g.label}`} label={g.label}>
                {g.fonts.map((f) => (
                  <Row key={`lh:${f.name}`} name={f.name} active={isActiveHebrew(f.name, currentFont)} onPick={() => handleSelect(f.name, 'local-hebrew')} hebrew />
                ))}
              </Group>
            ))}

            {visible.hebrewGoogle.length > 0 && (
              <Group label="Hebrew Google Fonts">
                {visible.hebrewGoogle.map((f) => (
                  <Row key={`hg:${f.name}`} name={f.name} active={f.name === currentFont} onPick={() => handleSelect(f.name, 'google-hebrew', f.weights)} hint="Google" hebrew />
                ))}
              </Group>
            )}

            {visible.allOtherGoogle.length > 0 && (
              <Group label="Google Fonts">
                {visible.allOtherGoogle.map((f) => (
                  <Row key={`g:${f.name}`} name={f.name} active={f.name === currentFont} onPick={() => handleSelect(f.name, 'google', f.weights)} hint="Google" />
                ))}
              </Group>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-1">
      <div className="px-3 py-1 text-[10px] tracking-wider uppercase text-velr-subtle">{label}</div>
      {children}
    </div>
  );
}

function Row({
  name, active, onPick, hint, hebrew,
}: {
  name: string;
  active: boolean;
  onPick: () => void;
  hint?: string;
  hebrew?: boolean;
}) {
  return (
    <button
      type="button"
      data-active={active ? 'true' : undefined}
      onMouseEnter={() => {
        const gf = GOOGLE_FONTS.find((f) => f.family === name);
        if (gf) ensureGoogleFontLoaded(name, gf.weights);
      }}
      onMouseDown={(e) => { e.preventDefault(); onPick(); }}
      className={clsx(
        'w-full text-left flex items-center justify-between gap-2 px-3 py-1.5 text-sm transition-colors',
        active ? 'bg-velr-chip text-velr-chip-text' : 'hover:bg-gray-50',
      )}
    >
      <span className="truncate flex-1 leading-tight flex items-center gap-2">
        <span className="truncate" style={{ fontFamily: name }}>{name}</span>
        {hebrew && (
          <span dir="rtl" aria-hidden className="text-velr-subtle text-base shrink-0" style={{ fontFamily: name }}>
            אבגדה
          </span>
        )}
      </span>
      {hint && <span className="text-[10px] text-velr-subtle">{hint}</span>}
      {active && <Check className="w-3.5 h-3.5" />}
    </button>
  );
}

function isHebrewFont(name: string): boolean {
  if (HEBREW_FONTS.some((f) => f.name === name)) return true;
  return GOOGLE_FONTS.some((f) => f.family === name && f.hebrew);
}

/**
 * True if the row for a local Hebrew font (display name `displayName`)
 * corresponds to the currently-applied internal family `currentFont`
 * reported by Collabora. We map the row's file → real internal family and
 * compare. Falls back to display-name match.
 */
function isActiveHebrew(displayName: string, currentFont: string): boolean {
  if (!currentFont) return false;
  if (displayName === currentFont) return true;
  const entry = HEBREW_FONTS.find((f) => f.name === displayName);
  if (!entry) return false;
  return HEBREW_FONT_FILE_TO_FAMILY[entry.file] === currentFont;
}

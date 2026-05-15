'use client';

import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Quote, Link2, Image as ImageIcon,
  Undo2, Redo2, Subscript as SubIcon, Superscript as SupIcon,
  Highlighter, Palette, ChevronDown, ArrowRightLeft,
  IndentIncrease, IndentDecrease, Minus, Eraser,
  TableProperties, Languages,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { FontPicker } from './FontPicker';
import type { CollaboraCommands, ActiveState } from '@/lib/collabora-commands';
import { findPremiumFamily, dispatchFamilyFor } from '@/lib/fonts/premium-fonts';

const WEIGHT_LABEL: Record<number, string> = {
  100: 'Thin', 200: 'ExtraLight', 300: 'Light', 400: 'Regular',
  500: 'Medium', 600: 'SemiBold', 700: 'Bold', 800: 'ExtraBold', 900: 'Black',
};

const FONT_SIZES = [
  '6','7','8','9','10','10.5','11','12','13','14','15','16','18','20','22','24','26','28',
  '30','32','36','40','44','48','54','60','66','72','80','88','96','108','120','144','168','192','218',
];
const PALETTE = [
  '#000000','#5f6368','#9aa0a6','#dadce0','#ffffff',
  '#d93025','#e8710a','#f29900','#188038','#1a73e8',
  '#673ab7','#c2185b','#795548','#827717','#0d652d',
  '#1565c0','#4527a0','#ad1457','#5d4037','#3e2723',
];

interface ToolbarProps {
  commands: CollaboraCommands;
  active: ActiveState;
}

export function Toolbar({ commands, active }: ToolbarProps) {
  const currentFont = active.font || 'Inter';
  const currentSize = active.fontSize || '11';
  const currentColor = active.color || '#202124';
  const currentHighlight = active.highlight || '';

  const Btn = ({
    children, onClick, active: isActive, title, disabled,
  }: {
    children: React.ReactNode;
    onClick: () => void;
    active?: boolean;
    title: string;
    disabled?: boolean;
  }) => (
    <button
      type="button"
      className={clsx('tb-btn', isActive && 'active')}
      onMouseDown={(e) => { e.preventDefault(); if (!disabled) onClick(); }}
      title={title}
      disabled={disabled}
    >
      {children}
    </button>
  );

  return (
    <div className="bg-velr-surface px-3 py-1">
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-1 rounded-full bg-velr-surface-container">
        <Btn title="Undo (Ctrl+Z)" onClick={commands.undo} disabled={active.canUndo === false}>
          <Undo2 className="w-[18px] h-[18px]" />
        </Btn>
        <Btn title="Redo (Ctrl+Y)" onClick={commands.redo} disabled={active.canRedo === false}>
          <Redo2 className="w-[18px] h-[18px]" />
        </Btn>

        <span className="tb-sep" />

        <BlockTypeSelect commands={commands} current={active.paraStyle} />

        <span className="tb-sep" />

        <FontPicker
          currentFont={currentFont}
          onPick={(f) => commands.setFont(f)}
        />

        <WeightControl
          currentFont={currentFont}
          onSet={(fcFamily) => commands.setFont(fcFamily)}
        />

        <FontSizeControl
          value={String(currentSize)}
          onSet={(n) => commands.setFontSize(n)}
        />

        <span className="tb-sep" />

        <Btn title="Bold (Ctrl+B)" active={!!active.bold} onClick={commands.bold}>
          <Bold className="w-[18px] h-[18px]" />
        </Btn>
        <Btn title="Italic (Ctrl+I)" active={!!active.italic} onClick={commands.italic}>
          <Italic className="w-[18px] h-[18px]" />
        </Btn>
        <Btn title="Underline (Ctrl+U)" active={!!active.underline} onClick={commands.underline}>
          <UnderlineIcon className="w-[18px] h-[18px]" />
        </Btn>
        <Btn title="Strikethrough" active={!!active.strike} onClick={commands.strike}>
          <Strikethrough className="w-[18px] h-[18px]" />
        </Btn>

        <ColorPick
          value={currentColor}
          title="Text color"
          icon={
            <span className="relative inline-flex flex-col items-center leading-none">
              <span className="text-[13px] font-semibold text-velr-ink">A</span>
              <span
                className="block w-4 h-[3px] rounded-sm mt-[1px]"
                style={{ background: currentColor || '#000000' }}
              />
            </span>
          }
          onPick={(c) => commands.setColor(c)}
        />
        <ColorPick
          value={currentHighlight}
          title="Highlight color"
          icon={<Highlighter className="w-[18px] h-[18px] text-velr-ink" />}
          onPick={(c) => commands.setHighlight(c)}
        />

        <span className="tb-sep" />

        <Btn title="Link (Ctrl+K)" active={!!active.link} onClick={() => {
          const url = window.prompt('URL', 'https://');
          if (url === null) return;
          if (url === '') commands.unsetLink();
          else commands.insertLink(url);
        }}>
          <Link2 className="w-[18px] h-[18px]" />
        </Btn>
        <Btn title="Insert image" onClick={() => { commands.insertImage(); }}>
          <ImageIcon className="w-[18px] h-[18px]" />
        </Btn>

        <span className="tb-sep" />

        <Btn title="Align left"    active={!!active.alignLeft}    onClick={() => commands.align('left')}>
          <AlignLeft className="w-[18px] h-[18px]" />
        </Btn>
        <Btn title="Align center"  active={!!active.alignCenter}  onClick={() => commands.align('center')}>
          <AlignCenter className="w-[18px] h-[18px]" />
        </Btn>
        <Btn title="Align right"   active={!!active.alignRight}   onClick={() => commands.align('right')}>
          <AlignRight className="w-[18px] h-[18px]" />
        </Btn>
        <Btn title="Justify"       active={!!active.alignJustify} onClick={() => commands.align('justify')}>
          <AlignJustify className="w-[18px] h-[18px]" />
        </Btn>

        <span className="tb-sep" />

        <DirectionMenu commands={commands} />

        <span className="tb-sep" />

        <Btn title="Bullet list"    active={!!active.bulletList}  onClick={commands.bulletList}>
          <List className="w-[18px] h-[18px]" />
        </Btn>
        <Btn title="Numbered list"  active={!!active.orderedList} onClick={commands.orderedList}>
          <ListOrdered className="w-[18px] h-[18px]" />
        </Btn>
        <Btn title="Blockquote"     active={!!active.blockquote}  onClick={commands.blockquote}>
          <Quote className="w-[18px] h-[18px]" />
        </Btn>

        <span className="tb-sep" />

        <Btn title="Decrease indent" onClick={() => commands.uno('.uno:DecrementIndent')}>
          <IndentDecrease className="w-[18px] h-[18px]" />
        </Btn>
        <Btn title="Increase indent" onClick={() => commands.uno('.uno:IncrementIndent')}>
          <IndentIncrease className="w-[18px] h-[18px]" />
        </Btn>

        <span className="tb-sep" />

        <TablePicker commands={commands} />
        <Btn title="Page break (Ctrl+Enter)" onClick={commands.pageBreak}>
          <Minus className="w-[18px] h-[18px]" />
        </Btn>

        <span className="tb-sep" />

        <Btn title="Clear formatting" onClick={commands.clearFormatting}>
          <Eraser className="w-[18px] h-[18px]" />
        </Btn>
      </div>
    </div>
  );
}

/* ─── ZoomControl: explicit − / value / + buttons + dropdown for presets ──── */
function ZoomControl({ commands }: { commands: CollaboraCommands }) {
  const [zoom, setZoom] = useState(100);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const presets = [50, 75, 90, 100, 125, 150, 175, 200];

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [open]);

  function applyZoom(pct: number) {
    const clamped = Math.max(25, Math.min(200, pct));
    setZoom(clamped);
    commands.zoom(clamped);
  }

  function bump(delta: number) {
    if (delta > 0) commands.zoomIn();
    else commands.zoomOut();
    // Step through Collabora's zoom table.
    const steps = [25, 33, 50, 75, 100, 125, 150, 175, 200];
    setZoom((z) => {
      const i = steps.indexOf(z);
      if (i < 0) return z + delta * 25;
      return steps[Math.max(0, Math.min(steps.length - 1, i + delta))];
    });
  }

  return (
    <div ref={ref} className="flex items-center">
      <button
        type="button"
        className="tb-btn w-7 text-base"
        onMouseDown={(e) => { e.preventDefault(); bump(-1); }}
        title="Zoom out (Ctrl+−)"
      >−</button>

      <button
        type="button"
        className="tb-btn min-w-[64px] gap-1 justify-center"
        onMouseDown={(e) => { e.preventDefault(); setOpen((o) => !o); }}
        title="Zoom"
      >
        {zoom}% <ChevronDown className="w-3 h-3 opacity-60" />
      </button>

      <button
        type="button"
        className="tb-btn w-7 text-base"
        onMouseDown={(e) => { e.preventDefault(); bump(1); }}
        title="Zoom in (Ctrl++)"
      >+</button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-[120px] bg-white border border-velr-rule rounded-lg shadow-lg py-1">
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); applyZoom(p); setOpen(false); }}
              className={clsx('w-full text-left px-3 py-1 text-sm hover:bg-gray-50', p === zoom && 'bg-velr-chip text-velr-chip-text')}
            >
              {p}%
            </button>
          ))}
          <div className="h-px bg-velr-rule my-1" />
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); commands.uno('.uno:FitPageWidth'); setOpen(false); }}
            className="w-full text-left px-3 py-1 text-sm hover:bg-gray-50"
          >
            Fit page width
          </button>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); commands.uno('.uno:FitPage'); setOpen(false); }}
            className="w-full text-left px-3 py-1 text-sm hover:bg-gray-50"
          >
            Fit whole page
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── BlockTypeSelect ─────────────────────────────────────────────────── */
function BlockTypeSelect({ commands, current }: { commands: CollaboraCommands; current?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [open]);

  const options: { label: string; size: string; style: string }[] = [
    { label: 'Normal text',     size: '11pt', style: 'Default Paragraph Style' },
    { label: 'Title',           size: '26pt', style: 'Title' },
    { label: 'Subtitle',        size: '20pt', style: 'Subtitle' },
    { label: 'Heading 1',       size: '18pt', style: 'Heading 1' },
    { label: 'Heading 2',       size: '16pt', style: 'Heading 2' },
    { label: 'Heading 3',       size: '14pt', style: 'Heading 3' },
    { label: 'Heading 4',       size: '13pt', style: 'Heading 4' },
    { label: 'Heading 5',       size: '12pt', style: 'Heading 5' },
    { label: 'Heading 6',       size: '11pt', style: 'Heading 6' },
    { label: 'Quotation',       size: '11pt', style: 'Quotations' },
    { label: 'Preformatted',    size: '11pt', style: 'Preformatted Text' },
    { label: 'List bullet',     size: '11pt', style: 'List Bullet' },
    { label: 'List number',     size: '11pt', style: 'List Number' },
  ];

  // Show the friendly label if we can find one, otherwise show the raw style name.
  const activeLabel = current
    ? (options.find((o) => o.style === current)?.label ?? current)
    : 'Style';

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} className="tb-btn min-w-[130px] justify-between gap-1">
        <span className="truncate">{activeLabel}</span>
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-[220px] max-h-[60vh] overflow-y-auto bg-white border border-velr-rule rounded-lg shadow-lg py-1">
          {options.map((o) => (
            <button
              key={o.label}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); commands.setParaStyle(o.style); setOpen(false); }}
              className={clsx(
                'w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50',
                (current === o.style || (!current && o.style === 'Default Paragraph Style')) && 'bg-velr-chip text-velr-chip-text',
              )}
            >
              <span style={{ fontSize: o.size, lineHeight: 1.1 }}>{o.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── FontSizeControl ─────────────────────────────────────────────────── */
function FontSizeControl({ value, onSet }: { value: string; onSet: (n: number) => void }) {
  const numeric = parseFloat(value) || 11;
  const set = (n: number) => onSet(Math.max(1, Math.min(999, n)));
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(numeric));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setDraft(String(numeric)); }, [numeric]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [open]);

  function commit() {
    setEditing(false);
    const n = parseFloat(draft);
    if (Number.isFinite(n) && n > 0) set(n);
    else setDraft(String(numeric));
  }

  return (
    <div ref={ref} className="relative flex items-center">
      <button
        className="tb-btn w-6"
        onMouseDown={(e) => { e.preventDefault(); set(numeric - 1); }}
        title="Decrease font size"
      >−</button>

      {editing ? (
        <input
          autoFocus
          type="number"
          min={1}
          max={999}
          step={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') { setDraft(String(numeric)); setEditing(false); }
          }}
          className="h-8 min-w-[52px] w-[52px] text-center text-sm border border-velr-accent rounded-md outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          onMouseDown={(e) => { if (e.detail === 2) { e.preventDefault(); setOpen(false); setEditing(true); } }}
          onContextMenu={(e) => { e.preventDefault(); setOpen((o) => !o); }}
          className="tb-btn min-w-[52px] w-[52px] justify-center"
          title="Click to edit; right-click for presets"
        >
          {numeric}
        </button>
      )}

      <button
        className="tb-btn w-6"
        onMouseDown={(e) => { e.preventDefault(); set(numeric + 1); }}
        title="Increase font size"
      >+</button>

      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); setOpen((o) => !o); }}
        className="tb-btn px-1"
        title="Font size presets"
      >
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-[80px] max-h-[300px] overflow-y-auto bg-white border border-velr-rule rounded-lg shadow-lg py-1">
          {FONT_SIZES.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); set(parseFloat(s)); setOpen(false); }}
              className={clsx(
                'w-full text-left px-2 py-0.5 text-sm hover:bg-gray-50',
                Math.abs(parseFloat(s) - numeric) < 0.01 && 'bg-velr-chip text-velr-chip-text',
              )}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── ColorPick ─────────────────────────────────────────────────────── */
function ColorPick({
  value, title, icon, onPick,
}: {
  value: string;
  title: string;
  icon: React.ReactNode;
  onPick: (color: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button type="button" className="tb-btn relative" onClick={() => setOpen((o) => !o)} title={title}>
        {icon}
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-[180px] bg-white border border-velr-rule rounded-lg shadow-lg p-2">
          <div className="grid grid-cols-5 gap-1">
            {PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); onPick(c); setOpen(false); }}
                className={clsx('w-6 h-6 rounded border', c === value ? 'border-velr-accent ring-2 ring-velr-accent/30' : 'border-velr-rule')}
                style={{ background: c }}
                title={c}
              />
            ))}
          </div>
          <div className="mt-2">
            <input
              type="color"
              defaultValue={value || '#000000'}
              onChange={(e) => onPick(e.target.value)}
              className="w-full h-7 rounded border border-velr-rule cursor-pointer"
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── TablePicker — hover grid to choose rows × cols ──────────────────── */
function TablePicker({ commands }: { commands: CollaboraCommands }) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState<{ r: number; c: number }>({ r: 0, c: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const MAX = 10;

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [open]);

  function pick() {
    if (hover.r < 1 || hover.c < 1) return;
    commands.insertTable(hover.r, hover.c);
    setOpen(false);
    setHover({ r: 0, c: 0 });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className="tb-btn"
        title="Insert table"
        onClick={() => setOpen((o) => !o)}
      >
        <TableProperties className="w-[18px] h-[18px]" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-velr-rule rounded-lg shadow-lg p-3">
          <div
            className="grid gap-[2px]"
            style={{ gridTemplateColumns: `repeat(${MAX}, 18px)` }}
            onMouseLeave={() => setHover({ r: 0, c: 0 })}
          >
            {Array.from({ length: MAX * MAX }).map((_, i) => {
              const r = Math.floor(i / MAX) + 1;
              const c = (i % MAX) + 1;
              const active = r <= hover.r && c <= hover.c;
              return (
                <button
                  key={i}
                  type="button"
                  className={clsx(
                    'w-[18px] h-[18px] rounded-sm border transition-colors',
                    active
                      ? 'bg-velr-chip border-velr-accent'
                      : 'bg-white border-velr-rule hover:bg-gray-50',
                  )}
                  onMouseEnter={() => setHover({ r, c })}
                  onClick={pick}
                />
              );
            })}
          </div>
          <div className="mt-2 text-center text-[12px] text-velr-subtle">
            {hover.r > 0
              ? `${hover.r} × ${hover.c} table`
              : 'Hover to choose size'}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── WeightControl ───────────────────────────────────────────────────────
   Dropdown that lists the weights available for the current font family.
   Visible only when the active font is one of the premium English families
   that ships multiple weights (Söhne, Tiempos, GT America, …). For Google
   Fonts the weight is requested at link-load time and Collabora already
   applies it via Bold; surfacing it here too would be noise. */
function WeightControl({
  currentFont,
  onSet,
}: {
  currentFont: string;
  /** Receives the CharFontName to dispatch (e.g. 'Söhne Kräftig'). */
  onSet: (fcFamily: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [open]);

  // Match currentFont against any premium family OR any of its variants'
  // fontconfig fullnames — so the chip stays visible once the user has
  // already picked a specific weight (Söhne Kräftig, Söhne Bold, …).
  const family = findPremiumFamily(currentFont);
  if (!family) return null;

  const weights = [...new Set(family.variants.map((v) => v.weight))].sort((a, b) => a - b);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className="tb-btn gap-1 px-2 text-xs"
        onClick={() => setOpen((o) => !o)}
        title={`Weight (${family.family})`}
      >
        <span className="text-velr-subtle">Wt</span>
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-[170px] bg-white border border-velr-rule rounded-lg shadow-lg py-1">
          {weights.map((w) => (
            <button
              key={w}
              onMouseDown={(e) => { e.preventDefault(); onSet(dispatchFamilyFor(family, w)); setOpen(false); }}
              className="w-full flex items-center justify-between gap-3 px-3 py-1.5 text-sm hover:bg-gray-50"
              style={{ fontFamily: family.family, fontWeight: w }}
            >
              <span>{WEIGHT_LABEL[w] ?? w}</span>
              <span className="text-[10px] text-velr-subtle">{w}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── DirectionMenu (LTR / RTL) ───────────────────────────────────────── */
function DirectionMenu({ commands }: { commands: CollaboraCommands }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button type="button" className="tb-btn gap-1" onClick={() => setOpen((o) => !o)} title="Text direction (RTL/LTR)">
        <Languages className="w-[18px] h-[18px]" />
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-[180px] bg-white border border-velr-rule rounded-lg shadow-lg py-1">
          <button onMouseDown={(e) => { e.preventDefault(); commands.setDirection('ltr'); setOpen(false); }} className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50">
            Left-to-Right
          </button>
          <button onMouseDown={(e) => { e.preventDefault(); commands.setDirection('rtl'); setOpen(false); }} className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50">
            Right-to-Left (עברית)
          </button>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import type { CollaboraCommands, ActiveState } from '@/lib/collabora-commands';

type Item =
  | { label: string; shortcut?: string; onClick?: () => void; disabled?: boolean }
  | 'sep';

interface Menu {
  label: string;
  items: Item[];
}

function buildMenus(commands: CollaboraCommands, active: ActiveState): Menu[] {
  return [
    {
      label: 'File',
      items: [
        { label: 'New document', shortcut: 'Ctrl+Alt+N', onClick: () => window.location.assign('/home') },
        'sep',
        { label: 'Download as PDF (.pdf)', onClick: () => commands.uno('.uno:ExportToPDF') },
        { label: 'Download as Word (.docx)', onClick: () => commands.uno('.uno:Save') },
        { label: 'Download as Plain Text (.txt)', onClick: () => commands.uno('.uno:ExportTo', { 'FilterName': { type: 'string', value: 'Text' } }) },
        'sep',
        { label: 'Page setup…', onClick: () => commands.uno('.uno:PageDialog') },
        { label: 'Print', shortcut: 'Ctrl+P', onClick: () => commands.uno('.uno:Print') },
      ],
    },
    {
      label: 'Edit',
      items: [
        { label: 'Undo', shortcut: 'Ctrl+Z', onClick: commands.undo, disabled: active.canUndo === false },
        { label: 'Redo', shortcut: 'Ctrl+Y', onClick: commands.redo, disabled: active.canRedo === false },
        'sep',
        { label: 'Cut', shortcut: 'Ctrl+X', onClick: commands.cut },
        { label: 'Copy', shortcut: 'Ctrl+C', onClick: commands.copy },
        { label: 'Paste', shortcut: 'Ctrl+V', onClick: commands.paste },
        'sep',
        { label: 'Select all', shortcut: 'Ctrl+A', onClick: commands.selectAll },
        { label: 'Find and replace…', shortcut: 'Ctrl+H', onClick: () => commands.uno('.uno:SearchDialog') },
      ],
    },
    {
      label: 'View',
      items: [
        { label: 'Zoom in', shortcut: 'Ctrl++', onClick: () => commands.uno('.uno:ZoomIn') },
        { label: 'Zoom out', shortcut: 'Ctrl+-', onClick: () => commands.uno('.uno:ZoomOut') },
        { label: 'Reset zoom', onClick: () => commands.uno('.uno:Zoom100Percent') },
        'sep',
        { label: 'Full screen', shortcut: 'F11', onClick: () => document.documentElement.requestFullscreen?.() },
      ],
    },
    {
      label: 'Insert',
      items: [
        { label: 'Image…', onClick: () => commands.uno('.uno:InsertGraphic') },
        { label: 'Link…', shortcut: 'Ctrl+K', onClick: () => {
            const url = window.prompt('URL', 'https://');
            if (url) commands.insertLink(url);
          } },
        { label: 'Table', onClick: () => commands.insertTable(3, 3) },
        'sep',
        { label: 'Page break', shortcut: 'Ctrl+Enter', onClick: commands.pageBreak },
        { label: 'Horizontal line', onClick: () => commands.uno('.uno:InsertSection') },
        { label: 'Special characters…', onClick: () => commands.uno('.uno:InsertSymbol') },
      ],
    },
    {
      label: 'Format',
      items: [
        { label: 'Bold',          shortcut: 'Ctrl+B', onClick: commands.bold },
        { label: 'Italic',        shortcut: 'Ctrl+I', onClick: commands.italic },
        { label: 'Underline',     shortcut: 'Ctrl+U', onClick: commands.underline },
        { label: 'Strikethrough', shortcut: 'Alt+Shift+5', onClick: commands.strike },
        'sep',
        { label: 'Direction: LTR', onClick: () => commands.setDirection('ltr') },
        { label: 'Direction: RTL (Hebrew)', onClick: () => commands.setDirection('rtl') },
        'sep',
        { label: 'Align left',   shortcut: 'Ctrl+Shift+L', onClick: () => commands.align('left') },
        { label: 'Align center', shortcut: 'Ctrl+Shift+E', onClick: () => commands.align('center') },
        { label: 'Align right',  shortcut: 'Ctrl+Shift+R', onClick: () => commands.align('right') },
        { label: 'Justify',      shortcut: 'Ctrl+Shift+J', onClick: () => commands.align('justify') },
        'sep',
        { label: 'Clear formatting', shortcut: 'Ctrl+\\', onClick: commands.clearFormatting },
      ],
    },
    {
      label: 'Tools',
      items: [
        { label: 'Word count', onClick: () => commands.uno('.uno:WordCountDialog') },
        { label: 'Spelling & grammar', onClick: () => commands.uno('.uno:SpellingAndGrammarDialog') },
      ],
    },
    {
      label: 'Help',
      items: [
        { label: 'About Velr Docs', onClick: () => window.open('/', '_blank') },
        { label: 'Keyboard shortcuts', onClick: () => commands.uno('.uno:ShortcutDialog') },
      ],
    },
  ];
}

export function MenuBar({ commands, active }: { commands: CollaboraCommands; active: ActiveState }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (openIdx === null) return;
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpenIdx(null);
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [openIdx]);

  const menus = buildMenus(commands, active);

  return (
    <div ref={containerRef} className="flex items-center -mx-1 bg-velr-surface text-sm relative">
      {menus.map((m, idx) => (
        <div key={m.label} className="relative">
          <button
            type="button"
            onMouseEnter={() => openIdx !== null && setOpenIdx(idx)}
            onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
            className={clsx('px-2 py-1 rounded hover:bg-gray-100', openIdx === idx && 'bg-gray-100')}
          >
            {m.label}
          </button>
          {openIdx === idx && (
            <div className="absolute left-0 top-full z-50 mt-0.5 min-w-[260px] bg-white border border-velr-rule rounded-lg shadow-lg py-1">
              {m.items.map((item, i) => {
                if (item === 'sep') return <div key={i} className="h-px bg-velr-rule my-1" />;
                return (
                  <div
                    key={i}
                    className={clsx('menu-item', item.disabled && 'disabled')}
                    onClick={() => {
                      if (item.disabled) return;
                      item.onClick?.();
                      setOpenIdx(null);
                    }}
                  >
                    <span>{item.label}</span>
                    {item.shortcut && <span className="shortcut">{item.shortcut}</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

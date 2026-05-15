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
  const uno = commands.uno;

  return [
    {
      label: 'File',
      items: [
        { label: 'New document', shortcut: 'Ctrl+Alt+N', onClick: () => window.location.assign('/home') },
        { label: 'Open from device…', onClick: () => window.location.assign('/home') },
        'sep',
        { label: 'Save',         shortcut: 'Ctrl+S',       onClick: () => uno('.uno:Save') },
        { label: 'Save a copy…', onClick: () => uno('.uno:SaveAs') },
        'sep',
        { label: 'Download as PDF (.pdf)',         onClick: () => uno('.uno:ExportToPDF') },
        { label: 'Download as Word (.docx)',       onClick: () => uno('.uno:Save') },
        { label: 'Download as ODF Text (.odt)',    onClick: () => uno('.uno:ExportToODT') },
        { label: 'Download as EPUB (.epub)',       onClick: () => uno('.uno:ExportToEPUB') },
        { label: 'Download as Plain Text (.txt)',  onClick: () => uno('.uno:ExportToText') },
        'sep',
        { label: 'Properties…',  onClick: () => uno('.uno:SetDocumentProperties') },
        { label: 'Page setup…',  onClick: () => uno('.uno:PageDialog') },
        { label: 'Print',        shortcut: 'Ctrl+P',  onClick: commands.print },
        'sep',
        { label: 'Close',        shortcut: 'Ctrl+W',  onClick: () => window.location.assign('/home') },
      ],
    },
    {
      label: 'Edit',
      items: [
        { label: 'Undo',  shortcut: 'Ctrl+Z',  onClick: commands.undo, disabled: active.canUndo === false },
        { label: 'Redo',  shortcut: 'Ctrl+Y',  onClick: commands.redo, disabled: active.canRedo === false },
        'sep',
        { label: 'Cut',    shortcut: 'Ctrl+X', onClick: commands.cut },
        { label: 'Copy',   shortcut: 'Ctrl+C', onClick: commands.copy },
        { label: 'Paste',  shortcut: 'Ctrl+V', onClick: commands.paste },
        { label: 'Paste special…', shortcut: 'Ctrl+Shift+V', onClick: () => uno('.uno:PasteSpecial') },
        'sep',
        { label: 'Select all',  shortcut: 'Ctrl+A',  onClick: commands.selectAll },
        'sep',
        { label: 'Find…',                shortcut: 'Ctrl+F',  onClick: () => uno('.uno:SearchDialog') },
        { label: 'Find and replace…',    shortcut: 'Ctrl+H',  onClick: () => uno('.uno:SearchDialog') },
        { label: 'Find next',            shortcut: 'Ctrl+G',  onClick: () => uno('.uno:RepeatSearch') },
        'sep',
        { label: 'Track changes',       onClick: () => uno('.uno:TrackChanges') },
        { label: 'Accept all changes',  onClick: () => uno('.uno:AcceptAllTrackedChanges') },
        { label: 'Reject all changes',  onClick: () => uno('.uno:RejectAllTrackedChanges') },
      ],
    },
    {
      label: 'View',
      items: [
        { label: 'Zoom in',     shortcut: 'Ctrl++',  onClick: () => uno('.uno:ZoomIn') },
        { label: 'Zoom out',    shortcut: 'Ctrl+-',  onClick: () => uno('.uno:ZoomOut') },
        { label: 'Reset zoom',                       onClick: () => uno('.uno:Zoom100Percent') },
        'sep',
        { label: 'Print layout',          onClick: () => uno('.uno:PrintLayout') },
        { label: 'Web layout',            onClick: () => uno('.uno:BrowseView') },
        'sep',
        { label: 'Show formatting marks', shortcut: 'Ctrl+F10', onClick: () => uno('.uno:ControlCodes') },
        { label: 'Show field names',      shortcut: 'Ctrl+F9',  onClick: () => uno('.uno:Fieldnames') },
        { label: 'Show ruler',            onClick: () => uno('.uno:Ruler') },
        'sep',
        { label: 'Navigator',  shortcut: 'F5',  onClick: () => uno('.uno:Navigator') },
        { label: 'Sidebar',                     onClick: () => uno('.uno:Sidebar') },
        'sep',
        { label: 'Full screen', shortcut: 'F11', onClick: () => document.documentElement.requestFullscreen?.() },
      ],
    },
    {
      label: 'Insert',
      items: [
        { label: 'Image…',                   onClick: () => commands.insertImage() },
        { label: 'Link…',  shortcut: 'Ctrl+K',  onClick: () => {
            const url = window.prompt('URL', 'https://');
            if (url) commands.insertLink(url);
          } },
        { label: 'Table…',                   onClick: () => commands.insertTable(3, 3) },
        'sep',
        { label: 'Text box',                 onClick: commands.insertTextBox },
        { label: 'Vertical text box',        onClick: commands.insertVerticalTextBox },
        { label: 'Frame',                    onClick: () => uno('.uno:InsertFrame') },
        'sep',
        { label: 'Chart…',                   onClick: () => uno('.uno:InsertObjectChart') },
        { label: 'OLE object…',              onClick: () => uno('.uno:InsertObject') },
        { label: 'Special character…',       onClick: () => uno('.uno:InsertSymbol') },
        { label: 'Formula',                  onClick: () => uno('.uno:InsertObjectStarMath') },
        'sep',
        { label: 'Comment',         shortcut: 'Ctrl+Alt+C', onClick: () => uno('.uno:InsertAnnotation') },
        { label: 'Footnote',                                onClick: () => uno('.uno:InsertFootnote') },
        { label: 'Endnote',                                 onClick: () => uno('.uno:InsertEndnote') },
        { label: 'Bookmark',                                onClick: () => uno('.uno:InsertBookmark') },
        { label: 'Cross-reference',                         onClick: () => uno('.uno:InsertField') },
        'sep',
        { label: 'Header',            onClick: () => uno('.uno:InsertPageHeader') },
        { label: 'Footer',            onClick: () => uno('.uno:InsertPageFooter') },
        { label: 'Page number',       onClick: () => uno('.uno:InsertPageNumberField') },
        { label: 'Page count',        onClick: () => uno('.uno:InsertPageCountField') },
        { label: 'Date',              onClick: () => uno('.uno:InsertDateField') },
        { label: 'Time',              onClick: () => uno('.uno:InsertTimeField') },
        'sep',
        { label: 'Page break',        shortcut: 'Ctrl+Enter', onClick: commands.pageBreak },
        { label: 'Column break',                              onClick: () => uno('.uno:InsertColumnBreak') },
        { label: 'Horizontal line',                           onClick: () => uno('.uno:InsertSection') },
        'sep',
        { label: 'Table of contents…',  onClick: () => uno('.uno:InsertMultiIndex') },
        { label: 'Index entry…',        onClick: () => uno('.uno:InsertIndexesEntry') },
      ],
    },
    {
      label: 'Format',
      items: [
        { label: 'Character…',                       onClick: () => uno('.uno:FontDialog') },
        { label: 'Paragraph…',                       onClick: () => uno('.uno:ParagraphDialog') },
        { label: 'Bullets and numbering…',           onClick: () => uno('.uno:BulletsAndNumberingDialog') },
        'sep',
        { label: 'Bold',          shortcut: 'Ctrl+B',         onClick: commands.bold },
        { label: 'Italic',        shortcut: 'Ctrl+I',         onClick: commands.italic },
        { label: 'Underline',     shortcut: 'Ctrl+U',         onClick: commands.underline },
        { label: 'Strikethrough', shortcut: 'Ctrl+Alt+5',     onClick: commands.strike },
        { label: 'Superscript',   shortcut: 'Ctrl+Shift+P',   onClick: commands.superscript },
        { label: 'Subscript',     shortcut: 'Ctrl+Shift+B',   onClick: commands.subscript },
        'sep',
        { label: 'Direction: LTR',                onClick: () => commands.setDirection('ltr') },
        { label: 'Direction: RTL (Hebrew)',       onClick: () => commands.setDirection('rtl') },
        'sep',
        { label: 'Align left',   shortcut: 'Ctrl+L',  onClick: () => commands.align('left') },
        { label: 'Align center', shortcut: 'Ctrl+E',  onClick: () => commands.align('center') },
        { label: 'Align right',  shortcut: 'Ctrl+R',  onClick: () => commands.align('right') },
        { label: 'Justify',      shortcut: 'Ctrl+J',  onClick: () => commands.align('justify') },
        'sep',
        { label: 'Line spacing — single',  shortcut: 'Ctrl+1', onClick: () => uno('.uno:SpacePara1') },
        { label: 'Line spacing — 1.15',                       onClick: () => uno('.uno:SpacePara115') },
        { label: 'Line spacing — 1.5',     shortcut: 'Ctrl+5', onClick: () => uno('.uno:SpacePara15') },
        { label: 'Line spacing — double',  shortcut: 'Ctrl+2', onClick: () => uno('.uno:SpacePara2') },
        { label: 'Increase paragraph spacing', onClick: () => uno('.uno:ParaspaceIncrease') },
        { label: 'Decrease paragraph spacing', onClick: () => uno('.uno:ParaspaceDecrease') },
        'sep',
        { label: 'Indent — increase', onClick: () => uno('.uno:IncrementIndent') },
        { label: 'Indent — decrease', onClick: () => uno('.uno:DecrementIndent') },
        'sep',
        { label: 'Drop Cap…',            onClick: () => uno('.uno:FormatDropcap') },
        'sep',
        { label: 'Page style…',          onClick: () => uno('.uno:PageDialog') },
        { label: 'Columns…',             onClick: () => uno('.uno:FormatColumns') },
        'sep',
        { label: 'Clear formatting', shortcut: 'Ctrl+M',  onClick: commands.clearFormatting },
      ],
    },
    {
      label: 'Styles',
      items: [
        { label: 'Default',     onClick: () => commands.setHeading(0) },
        'sep',
        { label: 'Heading 1',  shortcut: 'Ctrl+1', onClick: () => commands.setHeading(1) },
        { label: 'Heading 2',  shortcut: 'Ctrl+2', onClick: () => commands.setHeading(2) },
        { label: 'Heading 3',  shortcut: 'Ctrl+3', onClick: () => commands.setHeading(3) },
        { label: 'Heading 4',  shortcut: 'Ctrl+4', onClick: () => commands.setHeading(4) },
        { label: 'Heading 5',  shortcut: 'Ctrl+5', onClick: () => commands.setHeading(5) },
        { label: 'Heading 6',  shortcut: 'Ctrl+6', onClick: () => commands.setHeading(6) },
        'sep',
        { label: 'Quotation',     onClick: () => uno('.uno:ParaStyle', { Style: { type: 'string', value: 'Quotations' } }) },
        { label: 'Preformatted',  onClick: () => uno('.uno:ParaStyle', { Style: { type: 'string', value: 'Preformatted Text' } }) },
        { label: 'List bullet',   onClick: () => uno('.uno:ParaStyle', { Style: { type: 'string', value: 'List Bullet' } }) },
        { label: 'List number',   onClick: () => uno('.uno:ParaStyle', { Style: { type: 'string', value: 'List Number' } }) },
      ],
    },
    {
      label: 'Table',
      items: [
        { label: 'Insert table…',       onClick: () => commands.insertTable(3, 3) },
        'sep',
        { label: 'Insert row above',    onClick: () => uno('.uno:InsertRowsBefore') },
        { label: 'Insert row below',    onClick: () => uno('.uno:InsertRowsAfter') },
        { label: 'Insert column before',onClick: () => uno('.uno:InsertColumnsBefore') },
        { label: 'Insert column after', onClick: () => uno('.uno:InsertColumnsAfter') },
        'sep',
        { label: 'Delete row',          onClick: () => uno('.uno:DeleteRows') },
        { label: 'Delete column',       onClick: () => uno('.uno:DeleteColumns') },
        { label: 'Delete table',        onClick: () => uno('.uno:DeleteTable') },
        'sep',
        { label: 'Merge cells',         onClick: () => uno('.uno:MergeCells') },
        { label: 'Split cells…',        onClick: () => uno('.uno:SplitCell') },
        'sep',
        { label: 'Table properties…',   onClick: () => uno('.uno:TableDialog') },
      ],
    },
    {
      label: 'Tools',
      items: [
        { label: 'Spelling and grammar',  shortcut: 'F7',  onClick: () => uno('.uno:SpellingAndGrammarDialog') },
        { label: 'Auto-spellcheck',                        onClick: () => uno('.uno:SpellOnline') },
        { label: 'Word count…',                            onClick: () => uno('.uno:WordCountDialog') },
        'sep',
        { label: 'Thesaurus…',           shortcut: 'Ctrl+F7', onClick: () => uno('.uno:ThesaurusDialog') },
        { label: 'Set language…',                             onClick: () => uno('.uno:LanguageStatus') },
        'sep',
        { label: 'AutoCorrect options…', onClick: () => uno('.uno:AutoCorrectDlg') },
        { label: 'Apply AutoCorrect',    onClick: () => uno('.uno:AutoFormatApply') },
        'sep',
        { label: 'Macros…',              onClick: () => uno('.uno:MacroDialog') },
      ],
    },
    {
      label: 'Help',
      items: [
        { label: 'About Velr Docs',     onClick: () => window.open('/', '_blank') },
        { label: 'Keyboard shortcuts',  onClick: () => commands.uno('.uno:Help') },
        { label: 'Collabora help',      onClick: () => window.open('https://sdk.collaboraonline.com/', '_blank') },
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
            <div className="absolute left-0 top-full z-50 mt-0.5 min-w-[280px] max-h-[80vh] overflow-y-auto bg-white border border-velr-rule rounded-lg shadow-lg py-1">
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

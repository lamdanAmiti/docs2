'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Cloud, Share2, FileText, PanelRight } from 'lucide-react';
import { clsx } from 'clsx';
import { MenuBar } from './MenuBar';
import type { CollaboraCommands, ActiveState } from '@/lib/collabora-commands';

interface Props {
  title: string;
  onRename: (next: string) => void;
  onShare?: () => void;
  commands: CollaboraCommands;
  active: ActiveState;
  savedHint?: string;
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export function TopBar({ title, onRename, onShare, commands, active, savedHint = 'Saved', sidebarOpen, onToggleSidebar }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);

  function commit() {
    setEditing(false);
    if (draft.trim() && draft.trim() !== title) onRename(draft.trim());
    else setDraft(title);
  }

  return (
    <header className="flex items-end gap-0 px-3 pt-2 pb-0 bg-velr-surface">
      <Link href="/home" className="flex items-center hover:bg-gray-50 rounded p-1 -ml-1" aria-label="Velr Docs home">
        <FileText className="w-10 h-10 text-velr-accent" strokeWidth={1.6} />
      </Link>

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-end gap-2 leading-none pt-1">
          {editing ? (
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commit();
                if (e.key === 'Escape') { setDraft(title); setEditing(false); }
              }}
              className="text-[17px] font-normal bg-transparent outline-none border-b border-velr-accent w-[300px] leading-tight text-[#454647] relative top-1"
            />
          ) : (
            <button
              onClick={() => { setDraft(title); setEditing(true); }}
              className="text-[17px] font-normal hover:bg-gray-50 px-1 rounded text-left max-w-[300px] truncate leading-tight text-[#454647] relative top-1"
              title="Rename document"
            >
              {title}
            </button>
          )}
          <span className="inline-flex items-center gap-1 text-[12px] text-velr-subtle">
            <Cloud className="w-3.5 h-3.5" />
            {savedHint}
          </span>
        </div>

        <MenuBar commands={commands} active={active} />
      </div>

      <div className="flex items-center gap-2 mb-1">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className={clsx(
              'inline-flex items-center justify-center w-9 h-9 rounded-md',
              sidebarOpen
                ? 'bg-velr-chip text-velr-chip-text'
                : 'text-velr-subtle hover:text-velr-ink hover:bg-gray-50',
            )}
            title={sidebarOpen ? 'Hide properties panel' : 'Show properties panel'}
            aria-pressed={sidebarOpen}
          >
            <PanelRight className="w-4 h-4" />
          </button>
        )}
        <Link
          href="/home"
          className="text-sm text-velr-subtle hover:text-velr-ink hover:bg-gray-50 px-2.5 py-1.5 rounded-md"
        >
          About
        </Link>
        {onShare && (
          <button
            onClick={onShare}
            className="inline-flex items-center gap-1.5 bg-velr-accent hover:bg-velr-accent-hover text-white text-sm font-medium px-3 py-1.5 rounded-md"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        )}
      </div>
    </header>
  );
}

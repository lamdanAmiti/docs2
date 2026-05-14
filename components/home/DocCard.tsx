'use client';

import Link from 'next/link';
import { FileText, MoreVertical } from 'lucide-react';
import { Avatar } from './Avatar';
import type { ListedDoc } from '@/lib/documents';
import { useState, useRef, useEffect } from 'react';

export function DocCard({
  doc,
  onRename,
  onDelete,
  onShare,
}: {
  doc: ListedDoc;
  onRename: () => void;
  onDelete: () => void;
  onShare: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  return (
    <div className="group relative">
      <Link
        href={`/d/${doc.id}`}
        className="block rounded-lg overflow-hidden border border-velr-rule bg-white hover:border-velr-accent hover:shadow-page transition-all"
      >
        {/* Paper preview — the thumbnail sits inside the card as a floating
            page (small inset + ring + drop shadow) so it reads as a real
            document, not a flat poster. */}
        <div className="aspect-[8.5/11] bg-velr-canvas border-b border-velr-rule relative overflow-hidden p-3">
          <div className="relative w-full h-full bg-white rounded-sm ring-1 ring-black/[0.06] shadow-[0_2px_6px_rgba(15,23,42,0.08),0_12px_28px_-8px_rgba(15,23,42,0.18)] overflow-hidden">
            {doc.thumbnail_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={doc.thumbnail_url}
                alt=""
                className="absolute inset-0 w-full h-full object-cover object-top"
                loading="lazy"
              />
            ) : (
              <>
                <div className="absolute inset-0 grid place-items-center">
                  <FileText className="w-12 h-12 text-velr-rule" />
                </div>
                {/* Subtle "page" lines */}
                <div className="absolute top-6 left-6 right-6 space-y-2 opacity-40">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-[3px] bg-velr-rule rounded-sm"
                      style={{ width: `${85 - (i % 3) * 15}%` }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="px-3.5 py-3">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-velr-accent shrink-0" />
            <div className="text-[14px] font-medium text-velr-ink truncate">{doc.title}</div>
          </div>
          <div className="flex items-center justify-between text-[12px] text-velr-subtle">
            <span>{relativeTime(doc.opened_at)}</span>
            {doc.permission !== 'owner' && (
              <span className="inline-flex items-center gap-1">
                <Avatar name={doc.owner.display_name} color={doc.owner.avatar_color} size={16} />
                <span className="truncate max-w-[80px]">{doc.owner.display_name}</span>
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Hover menu */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" ref={menuRef}>
        <button
          onClick={(e) => { e.preventDefault(); setMenuOpen(v => !v); }}
          className="grid place-items-center w-8 h-8 rounded-full bg-white/95 border border-velr-rule hover:bg-white shadow-page"
          aria-label="Document options"
        >
          <MoreVertical className="w-4 h-4 text-velr-ink" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-1 bg-white border border-velr-rule rounded-lg shadow-page py-1 min-w-[160px] z-10 text-[14px]">
            <button onClick={(e) => { e.preventDefault(); setMenuOpen(false); onRename(); }} className="w-full text-left px-3.5 py-2 hover:bg-velr-surface-container">Rename</button>
            {doc.permission === 'owner' && (
              <button onClick={(e) => { e.preventDefault(); setMenuOpen(false); onShare(); }} className="w-full text-left px-3.5 py-2 hover:bg-velr-surface-container">Share</button>
            )}
            {doc.permission === 'owner' && (
              <button onClick={(e) => { e.preventDefault(); setMenuOpen(false); onDelete(); }} className="w-full text-left px-3.5 py-2 text-red-600 hover:bg-red-50">Delete</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

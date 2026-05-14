'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { FileText, Plus, Search, LogOut } from 'lucide-react';
import type { ListedDoc } from '@/lib/documents';
import { Avatar } from '@/components/home/Avatar';
import { DocCard } from '@/components/home/DocCard';
import { ShareDialog } from '@/components/home/ShareDialog';

interface Props {
  initialDocs: ListedDoc[];
  currentUser: { id: string; email: string; displayName: string; avatarColor: string };
}

export function HomeClient({ initialDocs, currentUser }: Props) {
  const router = useRouter();
  const [docs, setDocs] = useState<ListedDoc[]>(initialDocs);
  const [query, setQuery] = useState('');
  const [renameFor, setRenameFor] = useState<ListedDoc | null>(null);
  const [shareFor, setShareFor] = useState<ListedDoc | null>(null);
  const [_pending, startTransition] = useTransition();
  const [menuOpen, setMenuOpen] = useState(false);

  const filtered = useMemo(
    () =>
      docs.filter(d =>
        d.title.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [docs, query],
  );

  async function refresh() {
    const r = await fetch('/api/docs');
    const data = await r.json();
    if (data.ok) setDocs(data.docs);
  }

  async function onNewDoc() {
    const r = await fetch('/api/docs', { method: 'POST' });
    const data = await r.json();
    if (data.ok) startTransition(() => router.push(`/d/${data.doc.id}`));
  }

  async function onDelete(doc: ListedDoc) {
    if (!confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;
    await fetch(`/api/docs/${doc.id}`, { method: 'DELETE' });
    setDocs(prev => prev.filter(d => d.id !== doc.id));
  }

  async function onLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <div className="min-h-screen bg-velr-canvas">
      {/* Header */}
      <header className="bg-velr-canvas border-b border-velr-rule sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex items-center gap-4 px-6 py-3">
          <Link href="/home" className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-velr-accent text-white grid place-items-center">
              <FileText className="w-4 h-4" />
            </span>
            <span className="font-medium hidden sm:block">docs.velr.app</span>
          </Link>

          <div className="relative flex-1 max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-velr-subtle" />
            <input
              type="search"
              placeholder="Search your documents…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full bg-velr-surface-container hover:bg-white focus:bg-white border border-transparent focus:border-velr-rule rounded-full pl-10 pr-4 py-2 text-[14px] outline-none transition-colors"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="rounded-full focus:outline-none focus:ring-2 focus:ring-velr-accent/30"
              aria-label="Account menu"
            >
              <Avatar name={currentUser.displayName} color={currentUser.avatarColor} size={36} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 bg-white border border-velr-rule rounded-xl shadow-page py-1 min-w-[220px] z-30">
                <div className="px-4 py-3 border-b border-velr-rule">
                  <div className="text-[14px] font-medium truncate">{currentUser.displayName}</div>
                  <div className="text-[12px] text-velr-subtle truncate">{currentUser.email}</div>
                </div>
                <button onClick={onLogout} className="w-full flex items-center gap-2 px-4 py-2 text-[14px] text-velr-ink hover:bg-velr-surface-container">
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* New doc strip */}
      <section className="max-w-6xl mx-auto px-6 pt-8">
        <h2 className="text-[15px] font-medium text-velr-ink mb-3">Start a new document</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-10">
          <button
            onClick={onNewDoc}
            className="group rounded-lg overflow-hidden border border-velr-rule bg-white hover:border-velr-accent hover:shadow-page transition-all aspect-[8.5/11] grid place-items-center"
            aria-label="Blank document"
          >
            <div className="flex flex-col items-center gap-2 text-velr-subtle group-hover:text-velr-accent">
              <Plus className="w-10 h-10" strokeWidth={1.5} />
              <span className="text-[13px]">Blank</span>
            </div>
          </button>
        </div>
      </section>

      {/* Recent docs */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <h2 className="text-[15px] font-medium text-velr-ink mb-3">
          {query ? `Results for "${query}"` : 'Recent documents'}
        </h2>

        {filtered.length === 0 && (
          <div className="bg-white border border-velr-rule rounded-xl p-12 text-center">
            <FileText className="w-12 h-12 text-velr-rule mx-auto mb-3" />
            <p className="text-velr-subtle text-[14px] mb-4">
              {query ? 'No documents match your search.' : 'You don’t have any documents yet.'}
            </p>
            {!query && (
              <button onClick={onNewDoc} className="btn-primary">
                <Plus className="w-4 h-4" /> Create your first document
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filtered.map(doc => (
            <DocCard
              key={doc.id}
              doc={doc}
              onRename={() => setRenameFor(doc)}
              onDelete={() => onDelete(doc)}
              onShare={() => setShareFor(doc)}
            />
          ))}
        </div>
      </section>

      {/* Rename modal */}
      {renameFor && (
        <RenameDialog
          doc={renameFor}
          onClose={() => setRenameFor(null)}
          onDone={() => { setRenameFor(null); refresh(); }}
        />
      )}

      {/* Share modal */}
      {shareFor && (
        <ShareDialog docId={shareFor.id} title={shareFor.title} onClose={() => setShareFor(null)} />
      )}
    </div>
  );
}

function RenameDialog({
  doc,
  onClose,
  onDone,
}: {
  doc: ListedDoc;
  onClose: () => void;
  onDone: () => void;
}) {
  const [value, setValue] = useState(doc.title);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/docs/${doc.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: value }),
    });
    onDone();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 px-4" onClick={onClose}>
      <form
        onSubmit={onSubmit}
        className="bg-white rounded-2xl shadow-page max-w-sm w-full p-6"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold tracking-tight mb-3">Rename document</h2>
        <input autoFocus value={value} onChange={e => setValue(e.target.value)} className="input mb-4" />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button type="submit" disabled={saving || !value.trim()} className="btn-primary">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}

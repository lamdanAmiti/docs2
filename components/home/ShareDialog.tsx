'use client';

import { useEffect, useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { Avatar } from './Avatar';

interface ShareEntry {
  user_id: string;
  email: string;
  display_name: string;
  avatar_color: string;
  permission: 'read' | 'write';
}

export function ShareDialog({
  docId,
  title,
  onClose,
}: {
  docId: string;
  title: string;
  onClose: () => void;
}) {
  const [shares, setShares] = useState<ShareEntry[]>([]);
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'read' | 'write'>('write');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch(`/api/docs/${docId}/shares`);
    const data = await res.json();
    if (data.ok) setShares(data.shares);
  }
  useEffect(() => { load(); }, [docId]);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/docs/${docId}/shares`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, permission }),
    });
    setLoading(false);
    const data = await res.json();
    if (!data.ok) { setError(data.error); return; }
    setEmail('');
    await load();
  }

  async function onRemove(userId: string) {
    await fetch(`/api/docs/${docId}/shares`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    await load();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 px-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-page max-w-md w-full p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-1">
          <h2 className="text-lg font-semibold tracking-tight">Share document</h2>
          <button onClick={onClose} className="p-1 -m-1 rounded hover:bg-velr-surface-container">
            <X className="w-4 h-4 text-velr-subtle" />
          </button>
        </div>
        <p className="text-sm text-velr-subtle mb-4 truncate">{title}</p>

        <form onSubmit={onAdd} className="flex gap-2 mb-4">
          <input
            type="email"
            placeholder="Add by email…"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="input flex-1"
          />
          <select
            value={permission}
            onChange={e => setPermission(e.target.value as 'read' | 'write')}
            className="input w-[110px]"
          >
            <option value="write">Editor</option>
            <option value="read">Viewer</option>
          </select>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? '…' : 'Add'}
          </button>
        </form>
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        <div className="text-[13px] font-medium text-velr-subtle mb-2">People with access</div>
        <div className="space-y-2 max-h-64 overflow-auto">
          {shares.length === 0 && (
            <p className="text-sm text-velr-subtle">No one else has access yet.</p>
          )}
          {shares.map(s => (
            <div key={s.user_id} className="flex items-center gap-3">
              <Avatar name={s.display_name} color={s.avatar_color} size={32} />
              <div className="flex-1 min-w-0">
                <div className="text-[14px] text-velr-ink truncate">{s.display_name}</div>
                <div className="text-[12px] text-velr-subtle truncate">{s.email}</div>
              </div>
              <span className="text-[12px] text-velr-subtle px-2 py-1 rounded bg-velr-surface-container">
                {s.permission === 'write' ? 'Editor' : 'Viewer'}
              </span>
              <button
                onClick={() => onRemove(s.user_id)}
                className="p-1.5 rounded hover:bg-red-50 text-velr-subtle hover:text-red-600"
                aria-label="Remove"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Users } from 'lucide-react';
import { Avatar } from '@/components/home/Avatar';
import { ShareDialog } from '@/components/home/ShareDialog';

export interface EditorClientProps {
  docId: string;
  title: string;
  iframeUrl: string;
  accessToken: string;
  accessTokenTtl: number;
  canRename: boolean;
  currentUser: { id: string; displayName: string; email: string; avatarColor: string };
}

export function EditorClient(props: EditorClientProps) {
  const { docId, title, iframeUrl, accessToken, accessTokenTtl, canRename, currentUser } = props;
  const formRef = useRef<HTMLFormElement | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [docTitle, setDocTitle] = useState(title);
  const [titleEditing, setTitleEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title);

  // Auto-POST the form into the iframe on mount — this is how Collabora wants its
  // access_token: as form-encoded POST data, not query string.
  useEffect(() => {
    formRef.current?.submit();
  }, []);

  async function saveTitle() {
    const t = draftTitle.trim() || 'Untitled document';
    setTitleEditing(false);
    if (t === docTitle) return;
    setDocTitle(t);
    await fetch(`/api/docs/${docId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: t }),
    });
  }

  return (
    <div className="flex h-screen flex-col bg-velr-canvas">
      {/* Top bar */}
      <header className="flex items-center gap-3 px-4 py-2.5 bg-white border-b border-velr-rule">
        <Link href="/home" className="grid place-items-center w-9 h-9 rounded-full hover:bg-velr-surface-container">
          <ArrowLeft className="w-5 h-5 text-velr-ink" />
        </Link>

        {titleEditing && canRename ? (
          <input
            autoFocus
            value={draftTitle}
            onChange={e => setDraftTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') { setDraftTitle(docTitle); setTitleEditing(false); } }}
            className="flex-1 max-w-xl bg-transparent border border-velr-rule rounded-md px-2 py-1 text-[15px] focus:outline-none focus:border-velr-accent"
          />
        ) : (
          <button
            onClick={() => canRename && setTitleEditing(true)}
            disabled={!canRename}
            className="flex-1 max-w-xl text-left text-[15px] font-medium text-velr-ink hover:bg-velr-surface-container disabled:hover:bg-transparent disabled:cursor-default rounded-md px-2 py-1 truncate"
          >
            {docTitle}
          </button>
        )}

        <div className="flex items-center gap-2 ml-auto">
          {canRename && (
            <button
              onClick={() => setShowShare(true)}
              className="btn-primary"
            >
              <Users className="w-4 h-4" /> Share
            </button>
          )}
          <Avatar name={currentUser.displayName} color={currentUser.avatarColor} size={32} />
        </div>
      </header>

      {/* The Collabora iframe is filled via a self-submitting form (POST) so we
          can send access_token in the body rather than the URL. */}
      <form
        ref={formRef}
        action={iframeUrl}
        method="post"
        target="collabora-frame"
        className="hidden"
      >
        <input name="access_token" value={accessToken} readOnly />
        <input name="access_token_ttl" value={String(accessTokenTtl)} readOnly />
      </form>

      <iframe
        name="collabora-frame"
        title={docTitle}
        className="flex-1 w-full border-0"
        allow="autoplay; clipboard-read; clipboard-write"
      />

      {showShare && (
        <ShareDialog docId={docId} title={docTitle} onClose={() => setShowShare(false)} />
      )}
    </div>
  );
}

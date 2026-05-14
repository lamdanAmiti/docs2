'use client';

import { useEffect, useRef, useState } from 'react';
import { ShareDialog } from '@/components/home/ShareDialog';
import { TopBar } from '@/components/editor/TopBar';
import { Toolbar } from '@/components/editor/Toolbar';
import { useCollaboraCommands } from '@/lib/collabora-commands';

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
  const { docId, title, iframeUrl, accessToken, accessTokenTtl, canRename } = props;
  const formRef = useRef<HTMLFormElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [docTitle, setDocTitle] = useState(title);
  const [savedHint, setSavedHint] = useState('Saved');

  const { commands, active } = useCollaboraCommands(iframeRef);

  // Auto-POST the form into the iframe on mount.
  useEffect(() => {
    formRef.current?.submit();
  }, []);

  async function saveTitle(next: string) {
    setDocTitle(next);
    setSavedHint('Saving…');
    await fetch(`/api/docs/${docId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: next }),
    });
    setSavedHint('Saved');
  }

  return (
    <div className="flex h-screen flex-col bg-velr-canvas">
      <TopBar
        title={docTitle}
        onRename={(t) => { if (canRename) saveTitle(t); }}
        onShare={canRename ? () => setShowShare(true) : undefined}
        commands={commands}
        active={active}
        savedHint={savedHint}
      />

      <Toolbar commands={commands} active={active} />

      {/* Self-submitting form so we can send access_token in the POST body
          (cookie/header-friendly) rather than the URL. */}
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
        ref={iframeRef}
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

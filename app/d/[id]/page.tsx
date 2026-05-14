import { redirect, notFound } from 'next/navigation';
import { getSession } from '@/lib/session';
import { getDocForUser, touchOpened } from '@/lib/documents';
import { mintToken } from '@/lib/wopi';
import { getDocxEditUrl } from '@/lib/collabora';
import { EditorClient } from './EditorClient';

export const dynamic = 'force-dynamic';

export default async function DocPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await getSession();
  if (!s.userId) redirect(`/login?next=/d/${id}`);

  const access = await getDocForUser(id, s.userId);
  if (!access) notFound();

  const { token, ttlMs } = await mintToken(
    id,
    s.userId,
    access.permission === 'owner' ? 'write' : access.permission,
  );

  // Build the embed URL per WOPI host spec.
  const editUrl = await getDocxEditUrl();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const wopiSrc = `${appUrl}/api/wopi/files/${id}`;
  // Collabora's urlsrc often ends in `?`. We append params with `&`.
  const sep = editUrl.endsWith('?') ? '' : (editUrl.includes('?') ? '&' : '?');
  const iframeUrl =
    `${editUrl}${sep}` +
    new URLSearchParams({
      WOPISrc: wopiSrc,
      lang: 'en-US',
      closebutton: '1',
      revisionhistory: '1',
    }).toString();

  await touchOpened(id);

  return (
    <EditorClient
      docId={id}
      title={access.doc.title}
      iframeUrl={iframeUrl}
      accessToken={token}
      accessTokenTtl={Date.now() + ttlMs}
      canRename={access.permission !== 'read'}
      currentUser={{
        id: s.userId,
        displayName: s.displayName!,
        email: s.email!,
        avatarColor: s.avatarColor!,
      }}
    />
  );
}

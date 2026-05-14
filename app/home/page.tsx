import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { listDocsForUser } from '@/lib/documents';
import { HomeClient } from './HomeClient';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const s = await getSession();
  if (!s.userId) redirect('/login');
  const docs = await listDocsForUser(s.userId);
  return (
    <HomeClient
      initialDocs={docs}
      currentUser={{
        id: s.userId,
        email: s.email!,
        displayName: s.displayName!,
        avatarColor: s.avatarColor!,
      }}
    />
  );
}

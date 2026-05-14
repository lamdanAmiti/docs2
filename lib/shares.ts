import { db } from './supabase';

export interface ShareEntry {
  user_id: string;
  email: string;
  display_name: string;
  avatar_color: string;
  permission: 'read' | 'write';
}

export async function listShares(documentId: string): Promise<ShareEntry[]> {
  const { data } = await db
    .from('shares')
    .select('permission, user:users(id, email, display_name, avatar_color)')
    .eq('document_id', documentId);
  return (data ?? []).flatMap((s: any) =>
    s.user
      ? [{
          user_id: s.user.id,
          email: s.user.email,
          display_name: s.user.display_name,
          avatar_color: s.user.avatar_color,
          permission: s.permission,
        }]
      : [],
  );
}

export async function addShare(
  documentId: string,
  email: string,
  permission: 'read' | 'write',
  grantedBy: string,
) {
  const normalized = email.trim().toLowerCase();
  const { data: user } = await db
    .from('users').select('id').eq('email', normalized).maybeSingle();
  if (!user) throw new Error(`No account found for ${normalized}.`);

  const { error } = await db.from('shares').upsert(
    {
      document_id: documentId,
      user_id: user.id,
      permission,
      granted_by: grantedBy,
    },
    { onConflict: 'document_id,user_id' },
  );
  if (error) throw new Error(error.message);
}

export async function removeShare(documentId: string, userId: string) {
  await db.from('shares').delete().eq('document_id', documentId).eq('user_id', userId);
}

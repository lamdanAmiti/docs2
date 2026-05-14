import { db, storage } from './supabase';

/**
 * Mint a fresh WOPI access token for {document, user}. Expires in 10 hours.
 * The token is opaque — Collabora just echoes it back; we validate against the table.
 */
export async function mintToken(
  documentId: string,
  userId: string,
  permission: 'read' | 'write',
): Promise<{ token: string; ttlMs: number }> {
  const token = crypto.randomUUID() + '-' + crypto.randomUUID();
  const ttlMs = 1000 * 60 * 60 * 10;
  const expiresAt = new Date(Date.now() + ttlMs);

  const { error } = await db.from('wopi_tokens').insert({
    token,
    document_id: documentId,
    user_id: userId,
    permission,
    expires_at: expiresAt.toISOString(),
  });
  if (error) throw new Error('Failed to mint WOPI token: ' + error.message);
  return { token, ttlMs };
}

export interface WopiTokenInfo {
  document_id: string;
  user_id: string;
  permission: 'read' | 'write';
  user: { id: string; email: string; display_name: string; avatar_color: string };
  document: { id: string; title: string; storage_path: string; size_bytes: number; updated_at: string };
}

export async function validateToken(token: string, documentId: string): Promise<WopiTokenInfo | null> {
  const { data } = await db
    .from('wopi_tokens')
    .select(`
      document_id, user_id, permission,
      user:users(id, email, display_name, avatar_color),
      document:documents(id, title, storage_path, size_bytes, updated_at)
    `)
    .eq('token', token)
    .eq('document_id', documentId)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (!data || !data.user || !data.document) return null;
  return data as unknown as WopiTokenInfo;
}

/** Reads the file bytes from storage. */
export async function readDocBytes(storagePath: string): Promise<Uint8Array> {
  const { data, error } = await storage.download(storagePath);
  if (error || !data) throw new Error('Failed to read file: ' + error?.message);
  return new Uint8Array(await data.arrayBuffer());
}

/** Writes new file bytes back to storage (overwrite). */
export async function writeDocBytes(storagePath: string, bytes: Uint8Array) {
  const { error } = await storage.upload(storagePath, bytes, {
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    upsert: true,
  });
  if (error) throw new Error('Failed to save file: ' + error.message);
}

/**
 * Lock management — Collabora coordinates concurrent edits via WOPI lock IDs.
 * We persist locks in docs.locks and they auto-expire after 30 min of inactivity.
 */
const LOCK_TTL_MS = 30 * 60 * 1000;

export async function getLock(documentId: string): Promise<{ lock_value: string; user_id: string } | null> {
  await db.from('locks').delete().lt('expires_at', new Date().toISOString());
  const { data } = await db
    .from('locks').select('lock_value, user_id').eq('document_id', documentId).maybeSingle();
  return data ?? null;
}

export async function acquireLock(documentId: string, userId: string, lockValue: string) {
  const expiresAt = new Date(Date.now() + LOCK_TTL_MS).toISOString();
  const { error } = await db.from('locks').upsert({
    document_id: documentId,
    user_id: userId,
    lock_value: lockValue,
    expires_at: expiresAt,
  });
  if (error) throw new Error('Failed to acquire lock: ' + error.message);
}

export async function refreshLock(documentId: string) {
  const expiresAt = new Date(Date.now() + LOCK_TTL_MS).toISOString();
  await db.from('locks').update({ expires_at: expiresAt }).eq('document_id', documentId);
}

export async function releaseLock(documentId: string) {
  await db.from('locks').delete().eq('document_id', documentId);
}

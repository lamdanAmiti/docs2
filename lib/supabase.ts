import { createClient } from '@supabase/supabase-js';

let _root: any = null;
let _dbClient: any = null;

function rootClient(): any {
  if (_root) return _root;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  _root = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  return _root;
}

function dbClient(): any {
  if (_dbClient) return _dbClient;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  _dbClient = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: 'docs' },
  });
  return _dbClient;
}

/**
 * Service-role Supabase client scoped to the `docs` schema. Lazy — clients
 * only initialize on first property access, so import-time `next build`
 * code paths don't trip on missing env vars.
 */
export const db: any = new Proxy({}, { get(_t, prop) { return dbClient()[prop]; } });

/** Storage operations on the private `docs-files` bucket. */
export const storage: any = new Proxy({}, {
  get(_t, prop) { return rootClient().storage.from('docs-files')[prop]; },
});

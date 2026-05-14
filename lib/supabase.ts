import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

/**
 * Service-role Supabase client scoped to the `docs` schema.
 * Used server-side only — never expose this to the browser.
 */
export const db = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  db:   { schema: 'docs' },
});

/**
 * Service-role Supabase client for Storage operations on the `docs-files` bucket.
 */
export const storage = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
}).storage.from('docs-files');

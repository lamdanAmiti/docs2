import { createClient } from '@supabase/supabase-js';
import { db } from './supabase';

/**
 * Document-thumbnail pipeline.
 *
 * Flow on save:
 *   1. WOPI PutFile writes the .docx bytes to `docs-files`.
 *   2. We POST those bytes (multipart/form-data, field name `data`) to
 *      Collabora's `/cool/convert-to/png` endpoint over the docker
 *      network. Collabora's coolwsd renders the first page of the doc
 *      to PNG and streams it back.
 *   3. We upload the PNG to `doc-thumbnails/{ownerId}/{docId}.png`
 *      (private bucket) and stamp `documents.thumbnail_path` +
 *      `thumbnail_generated_at`.
 *
 * Rendering on /home reads the path and creates a short-lived signed URL.
 */

const BUCKET = 'doc-thumbnails';
const COLLABORA_URL = process.env.COLLABORA_INTERNAL_URL || 'http://collabora:9980';

let _root: any = null;
function rootClient() {
  if (_root) return _root;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  _root = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  return _root;
}

let _bucketReady = false;
async function ensureBucket() {
  if (_bucketReady) return;
  const client = rootClient();
  // Supabase storage createBucket is idempotent-ish: returns an error if it
  // already exists. We swallow that specific error.
  const { error } = await client.storage.createBucket(BUCKET, { public: false });
  if (error && !/already exists/i.test(error.message)) {
    console.warn('createBucket', BUCKET, 'failed:', error.message);
  }
  _bucketReady = true;
}

async function renderPng(docxBytes: Uint8Array): Promise<Uint8Array | null> {
  const form = new FormData();
  form.append('data', new Blob([new Uint8Array(docxBytes)]), 'doc.docx');
  let res: Response;
  try {
    res = await fetch(`${COLLABORA_URL}/cool/convert-to/png`, {
      method: 'POST',
      body: form,
    });
  } catch (err: any) {
    console.warn('thumbnail: convert-to/png request failed', err?.message ?? err);
    return null;
  }
  if (!res.ok) {
    console.warn('thumbnail: convert-to/png returned', res.status);
    return null;
  }
  const buf = new Uint8Array(await res.arrayBuffer());
  if (buf.byteLength < 100) {
    console.warn('thumbnail: png body suspiciously small', buf.byteLength);
    return null;
  }
  return buf;
}

/**
 * Render & upload a thumbnail for the given doc. Looks up owner_id from
 * the documents row. Returns the storage path on success, null on failure
 * (e.g. Collabora unreachable, render error). Never throws — callers can
 * fire-and-forget without crashing the save flow.
 */
export async function generateThumbnail(
  docId: string,
  docxBytes: Uint8Array,
): Promise<string | null> {
  try {
    const { data: doc } = await db
      .from('documents')
      .select('owner_id')
      .eq('id', docId)
      .maybeSingle();
    if (!doc) return null;

    const png = await renderPng(docxBytes);
    if (!png) return null;

    await ensureBucket();
    const path = `${doc.owner_id}/${docId}.png`;
    const { error: upErr } = await rootClient().storage
      .from(BUCKET)
      .upload(path, new Blob([new Uint8Array(png)], { type: 'image/png' }), {
        contentType: 'image/png',
        upsert: true,
      });
    if (upErr) {
      console.warn('thumbnail: upload failed', upErr.message);
      return null;
    }

    await db
      .from('documents')
      .update({
        thumbnail_path: path,
        thumbnail_generated_at: new Date().toISOString(),
      })
      .eq('id', docId);

    return path;
  } catch (err: any) {
    console.warn('thumbnail: generate threw', err?.message ?? err);
    return null;
  }
}

/** Returns a short-lived (10 min) signed URL for the thumbnail, or null. */
export async function signThumbnailUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await rootClient().storage
    .from(BUCKET)
    .createSignedUrl(path, 600);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

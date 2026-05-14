/**
 * Discover Collabora's edit URL for a .docx file by fetching /hosting/discovery.
 * Cached per process for 1 hour.
 */
const DISCOVERY_TTL_MS = 60 * 60 * 1000;
let _cache: { urlsrc: string; at: number } | null = null;

export async function getDocxEditUrl(): Promise<string> {
  const base = process.env.NEXT_PUBLIC_COLLABORA_URL;
  if (!base) throw new Error('NEXT_PUBLIC_COLLABORA_URL is not set');

  if (_cache && Date.now() - _cache.at < DISCOVERY_TTL_MS) return _cache.urlsrc;

  const res = await fetch(`${base}/hosting/discovery`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Collabora discovery failed: ${res.status}`);
  const xml = await res.text();

  // We want the action where ext="docx" and name="edit". Cheap regex extraction —
  // the discovery XML is small and stable.
  const docxEdit = xml.match(
    /<action\s+[^>]*ext="docx"[^>]*name="edit"[^>]*urlsrc="([^"]+)"/i,
  );
  // Fallback: the wordprocessingml mime app's default edit
  const writerEdit =
    docxEdit ||
    xml.match(
      /<app\s+name="writer"[\s\S]*?<action\s+[^>]*name="edit"[^>]*urlsrc="([^"]+)"/i,
    );
  if (!writerEdit) throw new Error('No .docx edit action found in discovery XML.');

  const urlsrc = writerEdit[1];
  _cache = { urlsrc, at: Date.now() };
  return urlsrc;
}

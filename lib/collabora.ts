/**
 * Discover Collabora's edit URL for a .docx file.
 *
 * The editor is served from the same origin as the app (docs.velr.app)
 * via a Traefik path-prefix route, so we fetch discovery from /hosting/*
 * on our own host and rewrite any absolute hostnames Collabora returns
 * to point back at our own app URL.
 *
 * Same-origin matters because Chrome partitions the system clipboard
 * by top-level origin — if the editor lived on a separate subdomain,
 * copy-from-iframe would never reach the OS clipboard.
 */
const DISCOVERY_TTL_MS = 60 * 60 * 1000;
let _cache: { urlsrc: string; at: number } | null = null;

export async function getDocxEditUrl(): Promise<string> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) throw new Error('NEXT_PUBLIC_APP_URL is not set');

  if (_cache && Date.now() - _cache.at < DISCOVERY_TTL_MS) return _cache.urlsrc;

  const res = await fetch(`${appUrl}/hosting/discovery`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Collabora discovery failed: ${res.status}`);
  const xml = await res.text();

  const docxEdit = xml.match(
    /<action\s+[^>]*ext="docx"[^>]*name="edit"[^>]*urlsrc="([^"]+)"/i,
  );
  const writerEdit =
    docxEdit ||
    xml.match(
      /<app\s+name="writer"[\s\S]*?<action\s+[^>]*name="edit"[^>]*urlsrc="([^"]+)"/i,
    );
  if (!writerEdit) throw new Error('No .docx edit action found in discovery XML.');

  // Force the urlsrc onto our same-origin app URL regardless of what
  // hostname Collabora baked in.
  const urlsrc = writerEdit[1].replace(/^https?:\/\/[^/]+/, appUrl);
  _cache = { urlsrc, at: Date.now() };
  return urlsrc;
}

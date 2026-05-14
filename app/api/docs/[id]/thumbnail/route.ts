import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/session';
import { getDocForUser } from '@/lib/documents';
import { readDocBytes } from '@/lib/wopi';
import { generateThumbnail } from '@/lib/thumbnails';

/**
 * Regenerate the first-page thumbnail for an existing doc. Used to backfill
 * docs created before the thumbnail pipeline existed, or to refresh after a
 * Collabora outage. Any user with read access can trigger it — the thumbnail
 * already reflects content they're allowed to see.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const u = await requireUser();
    const { id } = await params;
    const access = await getDocForUser(id, u.userId);
    if (!access) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });

    const bytes = await readDocBytes(access.doc.storage_path);
    const path = await generateThumbnail(id, bytes);
    if (!path) return NextResponse.json({ ok: false, error: 'Render failed' }, { status: 502 });
    return NextResponse.json({ ok: true, path });
  } catch (e: any) {
    if (e instanceof Response) return e;
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}

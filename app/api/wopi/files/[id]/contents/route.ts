import { NextRequest, NextResponse } from 'next/server';
import { validateToken, readDocBytes, writeDocBytes, getLock } from '@/lib/wopi';
import { db } from '@/lib/supabase';

/** GET file contents — Collabora downloads the .docx bytes. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.nextUrl.searchParams.get('access_token') ?? '';
  const info = await validateToken(token, id);
  if (!info) return new NextResponse('Unauthorized', { status: 401 });

  const bytes = await readDocBytes(info.document.storage_path);
  return new NextResponse(bytes, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Length': bytes.byteLength.toString(),
      'X-WOPI-ItemVersion': new Date(info.document.updated_at).getTime().toString(),
    },
  });
}

/** POST file contents — Collabora pushes saved bytes back. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.nextUrl.searchParams.get('access_token') ?? '';
  const info = await validateToken(token, id);
  if (!info) return new NextResponse('Unauthorized', { status: 401 });
  if (info.permission !== 'write') return new NextResponse('Forbidden', { status: 403 });

  // WOPI lock-correctness check: if the doc is locked, the lock value must match.
  const reqLock = req.headers.get('X-WOPI-Lock') ?? '';
  const current = await getLock(id);
  if (current && current.lock_value !== reqLock) {
    const headers = new Headers({ 'X-WOPI-Lock': current.lock_value });
    return new NextResponse(null, { status: 409, headers });
  }

  const bytes = new Uint8Array(await req.arrayBuffer());
  await writeDocBytes(info.document.storage_path, bytes);
  await db.from('documents').update({
    size_bytes: bytes.length,
    updated_at: new Date().toISOString(),
  }).eq('id', id);

  return new NextResponse(null, {
    status: 200,
    headers: { 'X-WOPI-ItemVersion': Date.now().toString() },
  });
}

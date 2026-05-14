import { NextRequest, NextResponse } from 'next/server';
import { validateToken, getLock, acquireLock, refreshLock, releaseLock } from '@/lib/wopi';
import { db } from '@/lib/supabase';

/**
 * GET /api/wopi/files/:id  →  CheckFileInfo
 *
 * Collabora calls this first to learn about the file and the user.
 * Spec: https://learn.microsoft.com/en-us/microsoft-365/cloud-storage-partner-program/rest/files/checkfileinfo
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.nextUrl.searchParams.get('access_token') ?? '';
  const info = await validateToken(token, id);
  if (!info) return new NextResponse('Unauthorized', { status: 401 });

  const userCanWrite = info.permission === 'write';

  // Touch opened_at so it bubbles up in the Recent list
  await db.from('documents').update({ opened_at: new Date().toISOString() }).eq('id', id);

  return NextResponse.json({
    BaseFileName: info.document.title.endsWith('.docx') ? info.document.title : `${info.document.title}.docx`,
    OwnerId: info.document.id,
    Size: info.document.size_bytes,
    Version: new Date(info.document.updated_at).getTime().toString(),

    UserId: info.user.id,
    UserFriendlyName: info.user.display_name,

    UserCanWrite: userCanWrite,
    UserCanRename: userCanWrite,
    UserCanNotWriteRelative: !userCanWrite,
    ReadOnly: !userCanWrite,
    SupportsLocks: true,
    SupportsGetLock: true,
    SupportsUpdate: true,
    SupportsRename: userCanWrite,

    PostMessageOrigin: process.env.NEXT_PUBLIC_APP_URL ?? '',
    EnableOwnerTermination: true,
    DisablePrint: false,
    DisableExport: false,
    DisableCopy: false,
  });
}

/**
 * POST /api/wopi/files/:id  →  Lock / GetLock / UnlockAndRelock / RefreshLock / Unlock / RenameFile
 *
 * Operation specified in the X-WOPI-Override header.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.nextUrl.searchParams.get('access_token') ?? '';
  const info = await validateToken(token, id);
  if (!info) return new NextResponse('Unauthorized', { status: 401 });

  const override = req.headers.get('X-WOPI-Override') ?? '';
  const reqLock = req.headers.get('X-WOPI-Lock') ?? '';
  const oldLock = req.headers.get('X-WOPI-OldLock') ?? '';

  const current = await getLock(id);

  switch (override) {
    case 'LOCK': {
      if (info.permission !== 'write') return lockFail(401);
      if (current && current.lock_value !== reqLock) return lockMismatch(current.lock_value);
      await acquireLock(id, info.user.id, reqLock);
      return new NextResponse(null, { status: 200 });
    }
    case 'GET_LOCK': {
      const headers = new Headers({ 'X-WOPI-Lock': current?.lock_value ?? '' });
      return new NextResponse(null, { status: 200, headers });
    }
    case 'REFRESH_LOCK': {
      if (!current || current.lock_value !== reqLock) return lockMismatch(current?.lock_value ?? '');
      await refreshLock(id);
      return new NextResponse(null, { status: 200 });
    }
    case 'UNLOCK': {
      if (!current || current.lock_value !== reqLock) return lockMismatch(current?.lock_value ?? '');
      await releaseLock(id);
      return new NextResponse(null, { status: 200 });
    }
    case 'UNLOCK_AND_RELOCK': {
      if (!current || current.lock_value !== oldLock) return lockMismatch(current?.lock_value ?? '');
      await acquireLock(id, info.user.id, reqLock);
      return new NextResponse(null, { status: 200 });
    }
    case 'RENAME_FILE': {
      if (info.permission !== 'write') return new NextResponse('Forbidden', { status: 403 });
      const requested = req.headers.get('X-WOPI-RequestedName') ?? '';
      const cleaned = (requested || 'Untitled').trim().slice(0, 200);
      await db.from('documents').update({ title: cleaned }).eq('id', id);
      const headers = new Headers({ 'X-WOPI-Name': cleaned });
      return new NextResponse(null, { status: 200, headers });
    }
    default:
      return new NextResponse(`Unsupported override: ${override}`, { status: 501 });
  }
}

function lockMismatch(currentLock: string) {
  const headers = new Headers({ 'X-WOPI-Lock': currentLock });
  return new NextResponse(null, { status: 409, headers });
}

function lockFail(status: number) {
  return new NextResponse(null, { status });
}

import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/session';
import { getDocForUser } from '@/lib/documents';
import { addShare, listShares, removeShare } from '@/lib/shares';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const u = await requireUser();
    const { id } = await params;
    const access = await getDocForUser(id, u.userId);
    if (!access) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
    const shares = await listShares(id);
    return NextResponse.json({ ok: true, shares });
  } catch (e: any) {
    if (e instanceof Response) return e;
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const u = await requireUser();
    const { id } = await params;
    const access = await getDocForUser(id, u.userId);
    if (!access || access.permission !== 'owner') {
      return NextResponse.json({ ok: false, error: 'Only the owner can share.' }, { status: 403 });
    }
    const { email, permission } = await req.json();
    if (!['read', 'write'].includes(permission)) {
      return NextResponse.json({ ok: false, error: 'Bad permission' }, { status: 400 });
    }
    await addShare(id, email, permission, u.userId);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e instanceof Response) return e;
    return NextResponse.json({ ok: false, error: e?.message }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const u = await requireUser();
    const { id } = await params;
    const access = await getDocForUser(id, u.userId);
    if (!access || access.permission !== 'owner') {
      return NextResponse.json({ ok: false, error: 'Only the owner can change sharing.' }, { status: 403 });
    }
    const { userId } = await req.json();
    await removeShare(id, userId);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e instanceof Response) return e;
    return NextResponse.json({ ok: false, error: e?.message }, { status: 400 });
  }
}

import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/session';
import { deleteDoc, renameDoc } from '@/lib/documents';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const u = await requireUser();
    const { id } = await params;
    const { title } = await req.json();
    if (typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ ok: false, error: 'Title required' }, { status: 400 });
    }
    await renameDoc(id, u.userId, title.trim().slice(0, 200));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e instanceof Response) return e;
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const u = await requireUser();
    const { id } = await params;
    await deleteDoc(id, u.userId);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e instanceof Response) return e;
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}

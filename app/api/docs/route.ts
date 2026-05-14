import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/session';
import { createDoc, listDocsForUser } from '@/lib/documents';

export async function GET() {
  try {
    const u = await requireUser();
    const docs = await listDocsForUser(u.userId);
    return NextResponse.json({ ok: true, docs });
  } catch (e: any) {
    if (e instanceof Response) return e;
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const u = await requireUser();
    const body = await req.json().catch(() => ({}));
    const doc = await createDoc(u.userId, body.title);
    return NextResponse.json({ ok: true, doc });
  } catch (e: any) {
    if (e instanceof Response) return e;
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { login } from '@/lib/auth';
import { getSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const user = await login({ email, password });
    const session = await getSession();
    session.userId = user.id;
    session.email = user.email;
    session.displayName = user.displayName;
    session.avatarColor = user.avatarColor;
    await session.save();
    return NextResponse.json({ ok: true, user });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'Login failed' }, { status: 400 });
  }
}

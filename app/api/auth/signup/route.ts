import { NextRequest, NextResponse } from 'next/server';
import { signup } from '@/lib/auth';
import { getSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const { email, password, displayName } = await req.json();
    const user = await signup({ email, password, displayName });
    const session = await getSession();
    session.userId = user.id;
    session.email = user.email;
    session.displayName = user.displayName;
    session.avatarColor = user.avatarColor;
    await session.save();
    return NextResponse.json({ ok: true, user });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'Signup failed' }, { status: 400 });
  }
}

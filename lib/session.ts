import { cookies } from 'next/headers';
import { getIronSession, type SessionOptions } from 'iron-session';

export interface DocsSession {
  userId?: string;
  email?: string;
  displayName?: string;
  avatarColor?: string;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'velr_docs_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
};

export async function getSession() {
  return getIronSession<DocsSession>(await cookies(), sessionOptions);
}

export async function requireUser() {
  const s = await getSession();
  if (!s.userId) throw new Response('Unauthorized', { status: 401 });
  return s as Required<DocsSession>;
}

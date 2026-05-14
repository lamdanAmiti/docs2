import { hash, verify } from '@node-rs/argon2';
import { db } from './supabase';

const ARGON = { memoryCost: 19456, timeCost: 2, outputLen: 32, parallelism: 1 };

const AVATAR_PALETTE = [
  '#1a73e8', '#188038', '#d93025', '#f9ab00', '#5f6368',
  '#a142f4', '#1e8e3e', '#e8710a', '#202124', '#4285f4',
];

function pickAvatarColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  avatarColor: string;
}

export async function signup(input: { email: string; password: string; displayName: string }): Promise<AuthUser> {
  const email = input.email.trim().toLowerCase();
  const displayName = input.displayName.trim() || email.split('@')[0];

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Please enter a valid email address.');
  }
  if (input.password.length < 8) {
    throw new Error('Password must be at least 8 characters.');
  }

  const { data: existing } = await db
    .from('users').select('id').eq('email', email).maybeSingle();
  if (existing) throw new Error('An account with that email already exists.');

  const password_hash = await hash(input.password, ARGON);
  const avatar_color = pickAvatarColor(email);

  const { data, error } = await db
    .from('users')
    .insert({ email, password_hash, display_name: displayName, avatar_color })
    .select('id, email, display_name, avatar_color')
    .single();
  if (error || !data) throw new Error(error?.message ?? 'Could not create account.');

  return {
    id: data.id,
    email: data.email,
    displayName: data.display_name,
    avatarColor: data.avatar_color,
  };
}

export async function login(input: { email: string; password: string }): Promise<AuthUser> {
  const email = input.email.trim().toLowerCase();
  const { data, error } = await db
    .from('users')
    .select('id, email, display_name, avatar_color, password_hash')
    .eq('email', email)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Invalid email or password.');

  const ok = await verify(data.password_hash, input.password);
  if (!ok) throw new Error('Invalid email or password.');

  await db.from('users').update({ last_seen_at: new Date().toISOString() }).eq('id', data.id);

  return {
    id: data.id,
    email: data.email,
    displayName: data.display_name,
    avatarColor: data.avatar_color,
  };
}

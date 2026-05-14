'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

export default function SignupPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName }),
    });
    const data = await res.json();
    if (!data.ok) { setError(data.error ?? 'Signup failed'); return; }
    startTransition(() => router.push('/home'));
  }

  return (
    <div className="bg-white border border-velr-rule rounded-2xl p-8 shadow-page">
      <h1 className="text-2xl font-semibold tracking-tight mb-1">Create your account</h1>
      <p className="text-sm text-velr-subtle mb-6">Get started in seconds.</p>

      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Your name">
          <input type="text" autoComplete="name" required value={displayName} onChange={e => setDisplayName(e.target.value)} className="input" />
        </Field>
        <Field label="Email">
          <input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} className="input" />
        </Field>
        <Field label="Password">
          <input type="password" autoComplete="new-password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} className="input" />
          <span className="block mt-1 text-[12px] text-velr-subtle">At least 8 characters.</span>
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={pending} className="w-full bg-velr-accent hover:bg-velr-accent-hover disabled:opacity-60 text-white font-medium py-2.5 rounded-md transition-colors">
          {pending ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-sm text-velr-subtle text-center">
        Already have an account? <Link href="/login" className="text-velr-accent hover:underline font-medium">Sign in</Link>
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[13px] font-medium text-velr-ink mb-1.5">{label}</span>
      {children}
    </label>
  );
}

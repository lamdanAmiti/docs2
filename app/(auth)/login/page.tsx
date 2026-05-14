'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, useTransition } from 'react';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!data.ok) { setError(data.error ?? 'Login failed'); return; }
    startTransition(() => router.push(search.get('next') ?? '/home'));
  }

  return (
    <div className="bg-white border border-velr-rule rounded-2xl p-8 shadow-page">
      <h1 className="text-2xl font-semibold tracking-tight mb-1">Welcome back</h1>
      <p className="text-sm text-velr-subtle mb-6">Sign in to your documents.</p>

      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Email">
          <input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} className="input" />
        </Field>
        <Field label="Password">
          <input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} className="input" />
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={pending} className="w-full bg-velr-accent hover:bg-velr-accent-hover disabled:opacity-60 text-white font-medium py-2.5 rounded-md transition-colors">
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-sm text-velr-subtle text-center">
        New here? <Link href="/signup" className="text-velr-accent hover:underline font-medium">Create an account</Link>
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

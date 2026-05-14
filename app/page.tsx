import Link from 'next/link';
import { redirect } from 'next/navigation';
import { FileText, Users, Share2, Languages, ArrowRight } from 'lucide-react';
import { getSession } from '@/lib/session';

export default async function LandingPage() {
  const s = await getSession();
  if (s.userId) redirect('/home');

  return (
    <div className="min-h-screen bg-velr-canvas">
      <header className="flex items-center justify-between px-8 py-5">
        <Link href="/" className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-velr-accent text-white grid place-items-center">
            <FileText className="w-4 h-4" />
          </span>
          <span className="font-medium text-base">docs.velr.app</span>
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/login" className="text-velr-ink hover:bg-velr-surface-container px-3 py-1.5 rounded-md">Sign in</Link>
          <Link href="/signup" className="btn-primary">
            Get started <ArrowRight className="w-4 h-4" />
          </Link>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-8 pt-16 pb-24">
        <h1 className="text-[64px] leading-[1.05] font-semibold tracking-tight max-w-3xl">
          A document editor for{' '}
          <span className="text-velr-accent">your team,</span>{' '}
          built for everything in between.
        </h1>
        <p className="mt-6 text-xl text-velr-subtle max-w-2xl leading-relaxed">
          Write, edit, and share documents with anyone. Real-time multi-user editing,
          first-class Hebrew &amp; RTL, your full library of fonts pre-loaded, and exports
          to PDF, DOCX, and TXT.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link href="/signup" className="inline-flex items-center gap-2 bg-velr-accent hover:bg-velr-accent-hover text-white text-base font-medium px-6 py-3 rounded-lg">
            Start writing <ArrowRight className="w-5 h-5" />
          </Link>
          <Link href="/login" className="inline-flex items-center gap-2 border border-velr-rule hover:bg-white text-velr-ink text-base font-medium px-6 py-3 rounded-lg">
            I have an account
          </Link>
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Feature
            icon={<Users className="w-5 h-5" />}
            title="Real-time collaboration"
            body="Edit the same document with anyone, anywhere. See cursors and changes as they happen. Powered by Collabora Online."
          />
          <Feature
            icon={<Share2 className="w-5 h-5" />}
            title="Share with one click"
            body="Invite editors and viewers by email. Owners stay in control of who can do what — change permissions any time."
          />
          <Feature
            icon={<Languages className="w-5 h-5" />}
            title="Hebrew, English, mixed"
            body="Type עברית and the paragraph auto-flips to RTL. Bidi-correct line wrapping, RTL lists — same in editor and on export."
          />
        </div>
      </main>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="bg-white border border-velr-rule rounded-xl p-5">
      <div className="w-9 h-9 rounded-lg bg-velr-chip text-velr-chip-text grid place-items-center mb-4">
        {icon}
      </div>
      <h3 className="text-base font-semibold mb-1.5">{title}</h3>
      <p className="text-sm text-velr-subtle leading-relaxed">{body}</p>
    </div>
  );
}

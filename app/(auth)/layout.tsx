import Link from 'next/link';
import { FileText } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-velr-canvas grid place-items-center px-6 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <span className="w-9 h-9 rounded-lg bg-velr-accent text-white grid place-items-center">
            <FileText className="w-4 h-4" />
          </span>
          <span className="font-medium text-lg">docs.velr.app</span>
        </Link>
        {children}
      </div>
    </div>
  );
}

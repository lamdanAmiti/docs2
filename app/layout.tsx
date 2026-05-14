import type { Metadata } from 'next';
import { Instrument_Sans, Inter } from 'next/font/google';
import './globals.css';

const instrument = Instrument_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-instrument',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-doc-default',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'docs.velr.app',
  description: 'Collaborative document editor with first-class Hebrew & RTL support.',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${instrument.variable} ${inter.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}

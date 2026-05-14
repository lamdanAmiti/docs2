import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const COLLABORA_ORIGIN = process.env.NEXT_PUBLIC_COLLABORA_URL || 'https://docsapi.velr.app';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  async headers() {
    return [
      {
        // Grant clipboard + other doc-editing permissions to the Collabora
        // iframe so Ctrl+V works across the docs.velr.app ↔ docsapi.velr.app
        // origin boundary without falling back to "Paste Special".
        source: '/d/:path*',
        headers: [
          {
            key: 'Permissions-Policy',
            value: [
              `clipboard-read=(self "${COLLABORA_ORIGIN}")`,
              `clipboard-write=(self "${COLLABORA_ORIGIN}")`,
              `autoplay=(self "${COLLABORA_ORIGIN}")`,
              `fullscreen=(self "${COLLABORA_ORIGIN}")`,
            ].join(', '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;

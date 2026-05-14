import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  async headers() {
    return [
      {
        // Both the app and the editor are served from this origin, so we
        // just need to advertise clipboard support to (self). No need to
        // delegate to a cross-origin embedder anymore.
        source: '/d/:path*',
        headers: [
          {
            key: 'Permissions-Policy',
            value: [
              `clipboard-read=(self)`,
              `clipboard-write=(self)`,
              `autoplay=(self)`,
              `fullscreen=(self)`,
            ].join(', '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;

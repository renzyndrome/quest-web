import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withPayload } from '@payloadcms/next/withPayload';

const dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output keeps the production image small (see Dockerfile).
  output: 'standalone',
  /*
    Pin the trace root to this app. The repo root also has a package-lock.json
    (the Astro site), which Next would otherwise treat as the workspace root —
    nesting the build as .next/standalone/cms/server.js and breaking the
    Dockerfile's `node server.js`.
  */
  outputFileTracingRoot: dirname,

  /*
    Cache uploaded files hard.

    Payload serves /api/media/file/* with no Cache-Control at all, so every
    image on the public site was being revalidated on every visit — the worst
    case for the mid-range Android on 4G that most of our traffic is.

    `immutable` is safe because these URLs are content-addressed in practice:
    Payload never rewrites a file in place, it writes a new filename (and each
    image size preset has its own). Replacing a photo produces a new URL.

    This covers the local-disk path only. Once R2_BUCKET is set, files are
    served from the bucket's own domain and never touch this route — caching
    there is configured on the Cloudflare side instead.
  */
  async headers() {
    return [
      {
        source: '/api/:collection(media|videos)/file/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};

export default withPayload(nextConfig);

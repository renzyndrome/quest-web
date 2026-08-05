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
};

export default withPayload(nextConfig);

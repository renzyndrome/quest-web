import path from "node:path";
import type { NextConfig } from "next";

// genzeal/ sits inside the quest-web repo, which has its own lockfile. Pin the
// root here so Next does not treat the parent repo as the workspace and nest
// the standalone output under genzeal/.
const root = path.resolve(__dirname);

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  outputFileTracingRoot: root,
  turbopack: { root },
};

export default nextConfig;

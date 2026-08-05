/*
  Boots a REAL Payload CMS, seeds it, builds the Astro site against it, and
  serves that build — so the integration specs exercise the genuine
  CMS → fetchers → static build → SSR preview path end to end.

  Everything runs on SQLite in a temp database, so no Docker or Postgres is
  needed. What is under test (REST query shape, access rules, Lexical→HTML,
  image presets, the Astro integration) is database-agnostic.

  Ports are separate from the offline suite's, and the site builds to
  dist-cms/ so the offline suite's dist/ is never clobbered.
*/
import { spawn, type ChildProcess } from 'node:child_process';
import { rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CMS_API_KEY, CMS_PORT, CMS_URL, PREVIEW_SECRET, SITE_PORT, SITE_URL } from './constants';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(dirname, '../..');
const cmsDir = path.join(repoRoot, 'cms');

const DB_FILE = path.join(cmsDir, 'e2e.db');
const MEDIA_DIR = path.join(cmsDir, 'media-e2e');
const SITE_OUT = path.join(repoRoot, 'dist-cms');

const cmsEnv = {
  ...process.env,
  CMS_TEST_SQLITE: '1',
  DATABASE_URI: `file:${DB_FILE}`,
  PAYLOAD_SECRET: 'e2e-payload-secret',
  PAYLOAD_PUBLIC_SERVER_URL: CMS_URL,
  MEDIA_DIR,
  // Deploy webhook + approver email intentionally unset → hooks no-op.
  NODE_ENV: 'development',
};

const children: ChildProcess[] = [];

function run(command: string, args: string[], cwd: string, env: NodeJS.ProcessEnv): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, env, stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} exited ${code}`)),
    );
  });
}

function background(command: string, args: string[], cwd: string, env: NodeJS.ProcessEnv): ChildProcess {
  const child = spawn(command, args, { cwd, env, stdio: 'inherit', detached: false });
  // Without this, a spawn failure (e.g. the binary not being on PATH) is
  // swallowed and the wait below just spins until it times out.
  child.on('error', (error) => {
    console.error(`[e2e:cms] failed to start "${command}": ${error.message}`);
  });
  child.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`[e2e:cms] "${command}" exited early with code ${code}`);
    }
  });
  children.push(child);
  return child;
}

async function waitFor(url: string, label: string, timeoutMs = 180_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let lastError = '';
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 404) return;
      lastError = `status ${res.status}`;
    } catch (error) {
      lastError = (error as Error).message;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Timed out waiting for ${label} at ${url} (last: ${lastError})`);
}

async function isUp(url: string): Promise<boolean> {
  try {
    const res = await fetch(url);
    return res.ok || res.status === 404;
  } catch {
    return false;
  }
}

export default async function globalSetup(): Promise<void> {
  // Reuse servers that are already running (fast local iteration). Set
  // E2E_FRESH=1 to force a rebuild.
  if (!process.env.E2E_FRESH) {
    const [cmsUp, siteUp] = await Promise.all([
      isUp(`${CMS_URL}/api/announcements`),
      isUp(`${SITE_URL}/news`),
    ]);
    if (cmsUp && siteUp) {
      console.log('[e2e:cms] reusing running CMS + site');
      process.env.__E2E_CMS_PIDS__ = '[]';
      return;
    }
  }

  /*
    Refuse to run against a server we did not start. Without this, a leftover
    CMS holding the port makes `next dev` die with EADDRINUSE while the suite
    silently tests the stale process — whose database we are about to delete.
    That produces baffling 500s instead of an obvious error.
  */
  for (const [url, label, port] of [
    [`${CMS_URL}/api/announcements`, 'CMS', CMS_PORT],
    [`${SITE_URL}/news`, 'site', SITE_PORT],
  ] as const) {
    if (await isUp(url)) {
      throw new Error(
        `[e2e:cms] port ${port} is already serving (${label}). Stop it before a fresh run, ` +
          `or drop E2E_FRESH to reuse the running servers.`,
      );
    }
  }

  // 1. Clean slate.
  rmSync(DB_FILE, { force: true });
  rmSync(MEDIA_DIR, { recursive: true, force: true });
  rmSync(SITE_OUT, { recursive: true, force: true });

  // 2. Seed the CMS (Local API — creates the schema via sqlite push).
  console.log('\n[e2e:cms] seeding Payload…');
  await run('npx', ['payload', 'run', 'scripts/seed-e2e.ts'], cmsDir, cmsEnv);

  // 3. Boot the CMS.
  console.log('[e2e:cms] starting Payload on', CMS_URL);
  background('npx', ['next', 'dev', '-p', String(CMS_PORT)], cmsDir, cmsEnv);
  await waitFor(`${CMS_URL}/api/announcements`, 'Payload CMS');

  // 4. Build the Astro site against the live CMS.
  console.log('[e2e:cms] building Astro against the CMS…');
  await run('npx', ['astro', 'build', '--outDir', SITE_OUT], repoRoot, {
    ...process.env,
    CMS_URL,
    CMS_TOKEN: CMS_API_KEY,
    SITE_URL,
  });

  // 5. Serve that build (SSR preview route reads the baked-in CMS env).
  // process.execPath, not "node": the runner's own binary is guaranteed to
  // exist regardless of how PATH is set up (nvm, CI images, …).
  console.log('[e2e:cms] serving the build on', SITE_URL);
  background(process.execPath, [path.join(SITE_OUT, 'server/entry.mjs')], repoRoot, {
    ...process.env,
    HOST: '127.0.0.1',
    PORT: String(SITE_PORT),
    PREVIEW_SECRET,
    CMS_URL,
    CMS_TOKEN: CMS_API_KEY,
  });
  await waitFor(`${SITE_URL}/news`, 'Astro site');

  // Hand the child PIDs to teardown.
  (globalThis as any).__E2E_CMS_PIDS__ = children.map((c) => c.pid).filter(Boolean);
  process.env.__E2E_CMS_PIDS__ = JSON.stringify(
    children.map((c) => c.pid).filter((pid): pid is number => typeof pid === 'number'),
  );
  console.log('[e2e:cms] ready\n');
}

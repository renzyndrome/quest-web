/*
  Stops the CMS + site servers started by global-setup. Killing the process
  group matters: `next dev` spawns workers that would otherwise hold the port.
*/
export default async function globalTeardown(): Promise<void> {
  const raw = process.env.__E2E_CMS_PIDS__;
  const pids: number[] = raw ? JSON.parse(raw) : [];
  for (const pid of pids) {
    try {
      process.kill(pid, 'SIGTERM');
    } catch {
      // Already gone.
    }
  }
  // Give children a moment to release ports before the runner exits.
  await new Promise((r) => setTimeout(r, 1000));
}

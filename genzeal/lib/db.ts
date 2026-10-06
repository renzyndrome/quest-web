import { Pool } from "pg";

// Kept on globalThis so every route bundle in the process shares one pool
// and one schema check, and dev hot reloads do not open new pools.
const store = globalThis as typeof globalThis & {
  __genzealPool?: Pool;
  __genzealSchema?: Promise<void>;
};

export function getPool(): Pool {
  if (store.__genzealPool) return store.__genzealPool;
  const connectionString = process.env.DATABASE_URI;
  if (!connectionString) {
    throw new Error("DATABASE_URI is not set. Point it at the genzeal Postgres database.");
  }
  store.__genzealPool = new Pool({ connectionString, max: 5 });
  return store.__genzealPool;
}

/** Creates the pages table once per process. A failed attempt is retried on the next call. */
export function ensureSchema(): Promise<void> {
  if (!store.__genzealSchema) {
    store.__genzealSchema = getPool()
      .query(
        `CREATE TABLE IF NOT EXISTS pages (
          path text PRIMARY KEY,
          data jsonb NOT NULL,
          updated_at timestamptz NOT NULL DEFAULT now()
        )`,
      )
      .then(() => undefined)
      .catch((error: unknown) => {
        store.__genzealSchema = undefined;
        throw error;
      });
  }
  return store.__genzealSchema;
}

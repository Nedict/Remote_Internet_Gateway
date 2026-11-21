import "server-only";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const globalForDb = globalThis as typeof globalThis & { rigPool?: Pool };

export function getDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not configured");
  const pool = globalForDb.rigPool ?? new Pool({ connectionString, max: 10, idleTimeoutMillis: 30_000 });
  if (process.env.NODE_ENV !== "production") globalForDb.rigPool = pool;
  return drizzle(pool, { schema });
}

export async function closeDbPool() {
  await globalForDb.rigPool?.end();
  delete globalForDb.rigPool;
}

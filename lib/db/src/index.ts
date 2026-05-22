import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema/index.js";

const { Pool } = pg;

let _pool: pg.Pool | null = null;
let _db: NodePgDatabase<typeof schema> | null = null;

export function getPool() {
  if (!_pool) {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL or POSTGRES_URL must be set. Please add it to your environment variables.");
    }
    
    try {
      const url = new URL(connectionString);
      console.log(`Connecting to database at: ${url.hostname}`);
    } catch (e) {
      console.error("Invalid DATABASE_URL format");
    }
    
    _pool = new Pool({ connectionString });
  }
  return _pool;
}

export const pool = new Proxy({} as pg.Pool, {
  get: (target, prop) => (getPool() as any)[prop],
});

export function getDb() {
  if (!_db) {
    _db = drizzle(getPool(), { schema });
  }
  return _db;
}

export const db = new Proxy({} as NodePgDatabase<typeof schema>, {
  get: (target, prop) => (getDb() as any)[prop],
});

export * from "./schema/index.js";

/**
 * Create a new pg.Pool with custom options. Useful for dedicated pools
 * (e.g. session stores) that shouldn't share connections with the main app pool.
 */
export function createPool(opts?: { max?: number; idleTimeoutMillis?: number; connectionTimeoutMillis?: number }) {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL or POSTGRES_URL must be set.");
  }
  return new Pool({ connectionString, ...opts });
}

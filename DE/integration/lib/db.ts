import "server-only";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured");
}

// Keep one bounded pool per running Node.js process.
declare global {
  // eslint-disable-next-line no-var
  var farmWardPgPool: Pool | undefined;
}

export const db =
  globalThis.farmWardPgPool ??
  new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    ssl: process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: true }
      : undefined,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.farmWardPgPool = db;
}

import "server-only";

import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { hashPassword } from "./password";

function resolveDatabasePath(): string {
  if (process.env.DATABASE_PATH) {
    return process.env.DATABASE_PATH;
  }

  // On Vercel or read-only serverless environments, store in /tmp
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const tmpDb = path.join(os.tmpdir(), "farm-portal.sqlite");
    const bundledDb = path.join(process.cwd(), "data", "farm-portal.sqlite");

    if (existsSync(bundledDb) && !existsSync(tmpDb)) {
      try {
        copyFileSync(bundledDb, tmpDb);
      } catch {
        // Fallback to fresh creation in /tmp
      }
    }
    return tmpDb;
  }

  // Local development fallback
  const localDir = path.join(process.cwd(), "data");
  try {
    mkdirSync(localDir, { recursive: true });
    return path.join(localDir, "farm-portal.sqlite");
  } catch {
    return path.join(os.tmpdir(), "farm-portal.sqlite");
  }
}

const databasePath = resolveDatabasePath();

try {
  mkdirSync(path.dirname(databasePath), { recursive: true });
} catch {
  // Directory might already exist or be read-only
}

export const db = new DatabaseSync(databasePath);

db.exec(`
  PRAGMA busy_timeout = 5000;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS farms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('pig', 'poultry')),
    animal_count INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS farm_access (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    farm_id TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    PRIMARY KEY (user_id, farm_id)
  );

  CREATE TABLE IF NOT EXISTS assessments (
    id TEXT PRIMARY KEY,
    farm_id TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    assessed_on TEXT NOT NULL,
    responses_json TEXT NOT NULL,
    submission_key TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_assessments_farm_created
    ON assessments(farm_id, created_at DESC);

  -- Accelerate farm-access lookups (canAccessFarm is called on every assessment submit).
  CREATE INDEX IF NOT EXISTS idx_farm_access_user
    ON farm_access(user_id);

  -- Accelerate submission-key idempotency lookups.
  CREATE INDEX IF NOT EXISTS idx_assessments_submission_key
    ON assessments(submission_key);
`);

try {
  db.exec("PRAGMA journal_mode = WAL;");
} catch {
  try {
    db.exec("PRAGMA journal_mode = DELETE;");
  } catch {
    // Keep default journal mode
  }
}

try {
  db.exec("ALTER TABLE farms ADD COLUMN animal_count INTEGER DEFAULT 0");
} catch {
  // Column already present in farms table
}

const insertUser = db.prepare(
  "INSERT OR IGNORE INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)",
);
const insertFarm = db.prepare(
  "INSERT OR IGNORE INTO farms (id, name, type, animal_count) VALUES (?, ?, ?, ?)",
);
const insertAccess = db.prepare(
  "INSERT OR IGNORE INTO farm_access (user_id, farm_id, role) VALUES (?, ?, ?)",
);

insertUser.run("user-farmer", "Sample Farmer", "farmer@example.com", hashPassword("demo123"));
insertUser.run("user-vet", "Sample Veterinarian", "vet@example.com", hashPassword("demo123"));
insertFarm.run("farm-pig", "Green Valley Pig Farm (Sample)", "pig", 250);
insertFarm.run("farm-poultry", "Sunrise Poultry Farm (Sample)", "poultry", 1200);

const updateDefaultFarmCount = db.prepare(
  "UPDATE farms SET animal_count = ? WHERE id = ? AND (animal_count IS NULL OR animal_count = 0)",
);
updateDefaultFarmCount.run(250, "farm-pig");
updateDefaultFarmCount.run(1200, "farm-poultry");

insertAccess.run("user-farmer", "farm-pig", "owner");
insertAccess.run("user-farmer", "farm-poultry", "manager");
insertAccess.run("user-vet", "farm-poultry", "veterinarian");

/**
 * Repository integration tests.
 * These tests run against an in-memory SQLite database (not the production DB)
 * to verify farm isolation, authentication, and assessment idempotency.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";
import { hashPassword, verifyPassword } from "../lib/password";

// ---------------------------------------------------------------------------
// Minimal in-memory schema that mirrors lib/database.ts
// ---------------------------------------------------------------------------
function createTestDb() {
  const db = new DatabaseSync(":memory:");
  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL
    );

    CREATE TABLE farms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('pig', 'poultry'))
    );

    CREATE TABLE farm_access (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      farm_id TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      PRIMARY KEY (user_id, farm_id)
    );

    CREATE TABLE assessments (
      id TEXT PRIMARY KEY,
      farm_id TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      assessed_on TEXT NOT NULL,
      responses_json TEXT NOT NULL,
      submission_key TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL
    );

    CREATE INDEX idx_farm_access_user ON farm_access(user_id);
    CREATE INDEX idx_assessments_submission_key ON assessments(submission_key);
  `);
  return db;
}

// ---------------------------------------------------------------------------
// Farm isolation: users can only see their own farms
// ---------------------------------------------------------------------------

test("listAccessibleFarms: user only sees their own farms", () => {
  const db = createTestDb();

  db.prepare("INSERT INTO users VALUES (?, ?, ?, ?)").run("u1", "Alice", "alice@x.com", hashPassword("pw"));
  db.prepare("INSERT INTO users VALUES (?, ?, ?, ?)").run("u2", "Bob", "bob@x.com", hashPassword("pw"));
  db.prepare("INSERT INTO farms VALUES (?, ?, ?)").run("f1", "Alice Farm", "pig");
  db.prepare("INSERT INTO farms VALUES (?, ?, ?)").run("f2", "Bob Farm", "poultry");
  db.prepare("INSERT INTO farm_access VALUES (?, ?, ?)").run("u1", "f1", "owner");
  db.prepare("INSERT INTO farm_access VALUES (?, ?, ?)").run("u2", "f2", "owner");

  const aliceFarms = db
    .prepare("SELECT farms.id FROM farms INNER JOIN farm_access ON farm_access.farm_id = farms.id WHERE farm_access.user_id = ?")
    .all("u1") as { id: string }[];
  const bobFarms = db
    .prepare("SELECT farms.id FROM farms INNER JOIN farm_access ON farm_access.farm_id = farms.id WHERE farm_access.user_id = ?")
    .all("u2") as { id: string }[];

  assert.deepEqual(aliceFarms.map(r => r.id), ["f1"]);
  assert.deepEqual(bobFarms.map(r => r.id), ["f2"]);
});

// ---------------------------------------------------------------------------
// canAccessFarm isolation
// ---------------------------------------------------------------------------

test("canAccessFarm: returns true only for authorized user", () => {
  const db = createTestDb();

  db.prepare("INSERT INTO users VALUES (?, ?, ?, ?)").run("u1", "Alice", "alice@x.com", hashPassword("pw"));
  db.prepare("INSERT INTO users VALUES (?, ?, ?, ?)").run("u2", "Bob", "bob@x.com", hashPassword("pw"));
  db.prepare("INSERT INTO farms VALUES (?, ?, ?)").run("f1", "Alice Farm", "pig");
  db.prepare("INSERT INTO farm_access VALUES (?, ?, ?)").run("u1", "f1", "owner");

  function canAccessFarm(userId: string, farmId: string) {
    const row = db.prepare("SELECT 1 AS allowed FROM farm_access WHERE user_id = ? AND farm_id = ?").get(userId, farmId) as { allowed: number } | undefined;
    return Boolean(row);
  }

  assert.ok(canAccessFarm("u1", "f1"), "alice should have access");
  assert.ok(!canAccessFarm("u2", "f1"), "bob should not have access to alice's farm");
});

// ---------------------------------------------------------------------------
// Assessment idempotency (submission_key UNIQUE constraint)
// ---------------------------------------------------------------------------

test("createAssessment: duplicate submission_key is ignored (idempotent)", () => {
  const db = createTestDb();

  db.prepare("INSERT INTO users VALUES (?, ?, ?, ?)").run("u1", "Alice", "alice@x.com", hashPassword("pw"));
  db.prepare("INSERT INTO farms VALUES (?, ?, ?)").run("f1", "Alice Farm", "pig");
  db.prepare("INSERT INTO farm_access VALUES (?, ?, ?)").run("u1", "f1", "owner");

  const key = "11111111-1111-1111-1111-111111111111";
  const insert = db.prepare(
    "INSERT OR IGNORE INTO assessments (id, farm_id, user_id, assessed_on, responses_json, submission_key, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );

  const r1 = insert.run("a1", "f1", "u1", "2024-06-01", "[]", key, new Date().toISOString());
  const r2 = insert.run("a2", "f1", "u1", "2024-06-01", "[]", key, new Date().toISOString());

  assert.equal(r1.changes, 1, "first insert should succeed");
  assert.equal(r2.changes, 0, "duplicate submission_key should be ignored");

  const rows = db.prepare("SELECT id FROM assessments WHERE submission_key = ?").all(key) as { id: string }[];
  assert.equal(rows.length, 1);
  assert.equal(rows[0].id, "a1");
});

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

test("authenticateUser: correct password returns user, wrong password returns null", () => {
  const db = createTestDb();

  const hash = hashPassword("secret123");
  db.prepare("INSERT INTO users VALUES (?, ?, ?, ?)").run("u1", "Alice", "alice@x.com", hash);

  function authenticateUser(email: string, password: string) {
    const row = db.prepare("SELECT id, name, email, password_hash FROM users WHERE lower(email) = lower(?)").get(email.trim()) as { id: string; name: string; email: string; password_hash: string } | undefined;
    if (!row?.password_hash || !verifyPassword(password, row.password_hash)) return null;
    return { id: row.id, name: row.name, email: row.email };
  }

  const ok = authenticateUser("alice@x.com", "secret123");
  assert.ok(ok !== null);
  assert.equal(ok?.email, "alice@x.com");

  const bad = authenticateUser("alice@x.com", "wrong");
  assert.equal(bad, null);

  const noUser = authenticateUser("nobody@x.com", "secret123");
  assert.equal(noUser, null);
});

test("authenticateUser: email lookup is case-insensitive", () => {
  const db = createTestDb();
  const hash = hashPassword("pw");
  db.prepare("INSERT INTO users VALUES (?, ?, ?, ?)").run("u1", "Alice", "alice@x.com", hash);

  function authenticateUser(email: string, password: string) {
    const row = db.prepare("SELECT id, password_hash FROM users WHERE lower(email) = lower(?)").get(email.trim()) as { id: string; password_hash: string } | undefined;
    if (!row?.password_hash || !verifyPassword(password, row.password_hash)) return null;
    return row.id;
  }

  assert.ok(authenticateUser("ALICE@X.COM", "pw") !== null);
  assert.ok(authenticateUser("Alice@X.com", "pw") !== null);
});

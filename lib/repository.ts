import "server-only";

import { db } from "./database";
import { verifyPassword } from "./password";
import type { Farm, PortalUser } from "./types";

type UserRow = PortalUser & { password_hash?: string };

export function authenticateUser(email: string, password: string): PortalUser | null {
  const row = db
    .prepare("SELECT id, name, email, password_hash FROM users WHERE lower(email) = lower(?)")
    .get(email.trim()) as UserRow | undefined;

  if (!row?.password_hash || !verifyPassword(password, row.password_hash)) return null;
  return { id: row.id, name: row.name, email: row.email };
}

export function findUserById(id: string): PortalUser | null {
  const row = db.prepare("SELECT id, name, email FROM users WHERE id = ?").get(id) as
    | PortalUser
    | undefined;
  return row ?? null;
}

export function listAccessibleFarms(userId: string): Farm[] {
  return db
    .prepare(
      `SELECT farms.id, farms.name, farms.type, farm_access.role AS accessRole
       FROM farms
       INNER JOIN farm_access ON farm_access.farm_id = farms.id
       WHERE farm_access.user_id = ?
       ORDER BY farms.name`,
    )
    .all(userId) as Farm[];
}

export function canAccessFarm(userId: string, farmId: string) {
  const row = db
    .prepare("SELECT 1 AS allowed FROM farm_access WHERE user_id = ? AND farm_id = ?")
    .get(userId, farmId) as { allowed: number } | undefined;
  return Boolean(row);
}

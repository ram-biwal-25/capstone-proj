import "server-only";

import { randomUUID } from "node:crypto";
import { db } from "./database";
import { verifyPassword } from "./password";
import type { Assessment, AssessmentResponse, Farm, FarmType, PortalUser } from "./types";

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
  const rows = db
    .prepare(
      `SELECT farms.id, farms.name, farms.type, farm_access.role AS accessRole
       FROM farms
       INNER JOIN farm_access ON farm_access.farm_id = farms.id
       WHERE farm_access.user_id = ?
       ORDER BY farms.name`,
    )
    .all(userId) as Farm[];

  return rows.map((farm) => ({
    id: farm.id,
    name: farm.name,
    type: farm.type,
    accessRole: farm.accessRole,
  }));
}

export function canAccessFarm(userId: string, farmId: string) {
  const row = db
    .prepare("SELECT 1 AS allowed FROM farm_access WHERE user_id = ? AND farm_id = ?")
    .get(userId, farmId) as { allowed: number } | undefined;
  return Boolean(row);
}

type AssessmentRow = {
  id: string;
  farmId: string;
  farmName: string;
  farmType: FarmType;
  assessedOn: string;
  responsesJson: string;
  createdAt: string;
  createdBy: string;
};

function mapAssessment(row: AssessmentRow): Assessment {
  return {
    id: row.id,
    farmId: row.farmId,
    farmName: row.farmName,
    farmType: row.farmType,
    assessedOn: row.assessedOn,
    responses: JSON.parse(row.responsesJson) as AssessmentResponse[],
    createdAt: row.createdAt,
    createdBy: row.createdBy,
  };
}

const assessmentSelect = `
  SELECT assessments.id,
         assessments.farm_id AS farmId,
         farms.name AS farmName,
         farms.type AS farmType,
         assessments.assessed_on AS assessedOn,
         assessments.responses_json AS responsesJson,
         assessments.created_at AS createdAt,
         users.name AS createdBy
  FROM assessments
  INNER JOIN farms ON farms.id = assessments.farm_id
  INNER JOIN users ON users.id = assessments.user_id
  INNER JOIN farm_access ON farm_access.farm_id = assessments.farm_id
`;

export function createAssessment(input: {
  userId: string;
  farmId: string;
  assessedOn: string;
  responses: AssessmentResponse[];
  submissionKey: string;
}) {
  const id = randomUUID();
  const result = db.prepare(
    `INSERT OR IGNORE INTO assessments
      (id, farm_id, user_id, assessed_on, responses_json, submission_key, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    input.farmId,
    input.userId,
    input.assessedOn,
    JSON.stringify(input.responses),
    input.submissionKey,
    new Date().toISOString(),
  );

  const saved = db
    .prepare("SELECT id FROM assessments WHERE submission_key = ? AND user_id = ?")
    .get(input.submissionKey, input.userId) as { id: string } | undefined;
  if (!saved) throw new Error("Submission key already belongs to a different user.");

  return { id: saved.id, created: result.changes === 1 };
}

export function listAssessments(userId: string): Assessment[] {
  const rows = db
    .prepare(
      `${assessmentSelect}
       WHERE farm_access.user_id = ?
       ORDER BY assessments.created_at DESC`,
    )
    .all(userId) as AssessmentRow[];
  return rows.map(mapAssessment);
}

export function findAssessmentById(userId: string, assessmentId: string): Assessment | null {
  const row = db
    .prepare(
      `${assessmentSelect}
       WHERE farm_access.user_id = ? AND assessments.id = ?`,
    )
    .get(userId, assessmentId) as AssessmentRow | undefined;
  return row ? mapAssessment(row) : null;
}

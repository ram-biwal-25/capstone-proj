import "server-only";
import { db } from "./db";

export type NewAssessment = {
  farmId: string;
  userId: string;
  assessedOn: string;
  riskLevel: "low" | "moderate" | "high" | "critical" | "not_assessed";
  completionPercent: number;
  submissionKey: string;
  checklistVersion: string;
  checklistSnapshot: Record<string, unknown>;
  responses: Array<{
    criterionCode: string;
    criterionLabel: string;
    status: "done" | "follow_up" | "not_applicable";
    note?: string | null;
  }>;
};

export async function listAccessibleFarms(userId: string) {
  const result = await db.query(
    `SELECT f.farm_id, f.farm_name, f.species, fa.role
       FROM farm_access fa
       JOIN farm f ON f.farm_id = fa.farm_id
      WHERE fa.user_id = $1
      ORDER BY f.farm_name`,
    [userId],
  );
  return result.rows;
}

export async function createAssessment(input: NewAssessment) {
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const access = await client.query(
      `SELECT 1 FROM farm_access
        WHERE user_id = $1 AND farm_id = $2`,
      [input.userId, input.farmId],
    );
    if (access.rowCount !== 1) {
      throw new Error("FARM_ACCESS_DENIED");
    }

    const inserted = await client.query(
      `INSERT INTO assessment
        (farm_id, submitted_by, assessed_on, risk_level, completion_percent,
         submission_key, checklist_version, checklist_snapshot)
       VALUES ($1, $2, $3::date, $4, $5, $6, $7, $8::jsonb)
       ON CONFLICT (submission_key) DO NOTHING
       RETURNING assessment_id`,
      [
        input.farmId,
        input.userId,
        input.assessedOn,
        input.riskLevel,
        input.completionPercent,
        input.submissionKey,
        input.checklistVersion,
        JSON.stringify(input.checklistSnapshot),
      ],
    );

    // Idempotent retry: return the already-created record rather than duplicate it.
    let assessmentId = inserted.rows[0]?.assessment_id as string | undefined;
    if (!assessmentId) {
      const existing = await client.query(
        `SELECT assessment_id FROM assessment WHERE submission_key = $1`,
        [input.submissionKey],
      );
      assessmentId = existing.rows[0]?.assessment_id as string | undefined;
      if (!assessmentId) throw new Error("ASSESSMENT_INSERT_FAILED");
      await client.query("COMMIT");
      return assessmentId;
    }

    for (const response of input.responses) {
      await client.query(
        `INSERT INTO assessment_response
          (assessment_id, criterion_code, criterion_label, status, note)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          assessmentId,
          response.criterionCode,
          response.criterionLabel,
          response.status,
          response.note ?? null,
        ],
      );
    }

    await client.query("COMMIT");
    return assessmentId;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getAssessmentForFarm(
  assessmentId: string,
  farmId: string,
  userId: string,
) {
  const result = await db.query(
    `SELECT a.assessment_id, a.assessed_on, a.risk_level,
            a.completion_percent, a.checklist_version, a.checklist_snapshot,
            COALESCE(
              jsonb_agg(
                jsonb_build_object(
                  'criterionCode', r.criterion_code,
                  'criterionLabel', r.criterion_label,
                  'status', r.status,
                  'note', r.note
                )
              ) FILTER (WHERE r.response_id IS NOT NULL),
              '[]'::jsonb
            ) AS responses
       FROM assessment a
       JOIN farm_access fa
         ON fa.farm_id = a.farm_id AND fa.user_id = $3
       LEFT JOIN assessment_response r
         ON r.assessment_id = a.assessment_id
      WHERE a.assessment_id = $1 AND a.farm_id = $2
      GROUP BY a.assessment_id`,
    [assessmentId, farmId, userId],
  );
  return result.rows[0] ?? null;
}

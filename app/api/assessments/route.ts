import { NextResponse } from "next/server";
import { validateResponses } from "@/lib/checklist";
import { canAccessFarm, createAssessment } from "@/lib/repository";
import { getCurrentUser } from "@/lib/session";

type SubmissionBody = {
  farmId?: string;
  assessedOn?: string;
  responses?: unknown;
  submissionKey?: string;
};

/** Farm IDs are UUIDs in this implementation — cap to 128 chars for safety. */
const MAX_FARM_ID_LENGTH = 128;

/**
 * Returns true when value is a valid YYYY-MM-DD date that is not in the future
 * and not more than 10 years in the past.
 */
function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value) return false;

  const now = new Date();
  // Allow up to today in UTC (future assessedOn values are not meaningful).
  const todayUtc = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  if (date > todayUtc) return false;

  // Reject dates more than 10 years in the past.
  const tenYearsAgo = new Date(todayUtc);
  tenYearsAgo.setUTCFullYear(tenYearsAgo.getUTCFullYear() - 10);
  if (date < tenYearsAgo) return false;

  return true;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  let body: SubmissionBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "The assessment data is not valid." }, { status: 400 });
  }

  if (!body.farmId || !body.assessedOn || !body.submissionKey) {
    return NextResponse.json(
      { error: "Farm, assessment date, and all checklist answers are required." },
      { status: 400 },
    );
  }

  if (typeof body.farmId !== "string" || body.farmId.length > MAX_FARM_ID_LENGTH) {
    return NextResponse.json({ error: "The farm identifier is invalid." }, { status: 400 });
  }

  if (!isValidDate(body.assessedOn)) {
    return NextResponse.json(
      { error: "Choose a valid assessment date (not in the future, not more than 10 years ago)." },
      { status: 400 },
    );
  }
  if (!/^[0-9a-f-]{36}$/i.test(body.submissionKey)) {
    return NextResponse.json({ error: "The submission identifier is invalid." }, { status: 400 });
  }
  if (!canAccessFarm(user.id, body.farmId)) {
    return NextResponse.json({ error: "You do not have access to that farm." }, { status: 403 });
  }

  const responses = validateResponses(body.responses);
  if (!responses) {
    return NextResponse.json(
      { error: "Answer every checklist item. Notes must be 500 characters or fewer." },
      { status: 400 },
    );
  }

  try {
    const result = createAssessment({
      userId: user.id,
      farmId: body.farmId,
      assessedOn: body.assessedOn,
      responses,
      submissionKey: body.submissionKey,
    });
    return NextResponse.json(result, { status: result.created ? 201 : 200 });
  } catch {
    return NextResponse.json(
      { error: "The assessment could not be saved. Please try again." },
      { status: 500 },
    );
  }
}

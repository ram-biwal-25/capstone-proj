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

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
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
  if (!isValidDate(body.assessedOn)) {
    return NextResponse.json({ error: "Choose a valid assessment date." }, { status: 400 });
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

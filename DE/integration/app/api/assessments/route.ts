import { NextResponse } from "next/server";
import { createAssessment, type NewAssessment } from "@/lib/assessment-repository";

// Replace this import with the actual authenticated-user guard in lib/session.ts.
// The guard must derive the user ID from the verified server-side session cookie.
import { requireUserId } from "@/lib/auth-adapter";

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Omit<NewAssessment, "userId">;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    typeof body.farmId !== "string" ||
    typeof body.submissionKey !== "string" ||
    !Array.isArray(body.responses) ||
    typeof body.completionPercent !== "number" ||
    body.completionPercent < 0 ||
    body.completionPercent > 100
  ) {
    return NextResponse.json({ error: "Invalid assessment data" }, { status: 400 });
  }

  try {
    const assessmentId = await createAssessment({ ...body, userId });
    return NextResponse.json({ assessmentId }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "FARM_ACCESS_DENIED") {
      return NextResponse.json({ error: "Farm access denied" }, { status: 403 });
    }
    console.error("Assessment persistence failed", error);
    return NextResponse.json({ error: "Could not save assessment" }, { status: 500 });
  }
}

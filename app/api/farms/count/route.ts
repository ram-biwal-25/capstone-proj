import { NextResponse } from "next/server";
import { updateFarmAnimalCount } from "@/lib/repository";
import { getCurrentUser } from "@/lib/session";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Support batch updates
    if (Array.isArray(body.updates)) {
      for (const item of body.updates) {
        if (item.farmId && typeof item.count === "number" && item.count >= 0) {
          updateFarmAnimalCount(user.id, item.farmId, item.count);
        }
      }
      return NextResponse.json({ success: true });
    }

    // Support single farm update
    const { farmId, count } = body;
    if (!farmId || typeof count !== "number" || count < 0) {
      return NextResponse.json({ error: "Invalid farm or count" }, { status: 400 });
    }

    const success = updateFarmAnimalCount(user.id, farmId, count);
    if (!success) {
      return NextResponse.json({ error: "Farm not accessible or not found" }, { status: 403 });
    }

    return NextResponse.json({ success: true, farmId, count });
  } catch {
    return NextResponse.json({ error: "Failed to update animal count" }, { status: 500 });
  }
}

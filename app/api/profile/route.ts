import { NextResponse } from "next/server";
import {
  findUserById,
  listAccessibleFarms,
  updateFarmDetails,
  updateUserProfile,
} from "@/lib/repository";
import { getCurrentUser } from "@/lib/session";

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, email, farms } = body;

    // Update user profile if provided
    if (name && typeof name === "string" && email && typeof email === "string") {
      updateUserProfile(currentUser.id, name, email);
    }

    // Update farms if provided
    if (Array.isArray(farms)) {
      for (const farm of farms) {
        if (farm?.id) {
          updateFarmDetails(currentUser.id, farm.id, {
            name: farm.name,
            type: farm.type,
            animalCount: typeof farm.animalCount === "number" ? farm.animalCount : undefined,
          });
        }
      }
    }

    const updatedUser = findUserById(currentUser.id);
    const updatedFarms = listAccessibleFarms(currentUser.id);

    return NextResponse.json({
      success: true,
      user: updatedUser,
      farms: updatedFarms,
    });
  } catch {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

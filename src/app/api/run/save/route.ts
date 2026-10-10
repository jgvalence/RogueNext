import { NextRequest, NextResponse } from "next/server";
import { saveRunStateSchema as saveRunSchema } from "@/server/services/run/run-validation";
import type { RunState } from "@/game/schemas/run-state";
import { requireAuth } from "@/lib/auth/helpers";
import { handleApiError } from "@/lib/errors/handlers";
import { saveRunStateForUser } from "@/server/services/run/run-persistence.service";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const validated = saveRunSchema.parse(body);

    const saved = await saveRunStateForUser({
      userId: user.id!,
      runId: validated.runId,
      state: validated.state as RunState,
    });

    return NextResponse.json({ saved });
  } catch (error) {
    return handleApiError(error);
  }
}

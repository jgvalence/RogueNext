"use server";

import { z } from "zod";
import { requireAuth } from "@/lib/auth/helpers";
import { handleServerActionError, success } from "@/lib/errors/handlers";
import { revalidatePath } from "next/cache";
import type { RunState } from "@/game/schemas/run-state";
import {
  createRunForUser,
  endRunForUser,
  getActiveRunSnapshotForUser,
} from "@/server/services/run/run-lifecycle.service";
import { saveRunStateForUser } from "@/server/services/run/run-persistence.service";
import { FIRST_RUN_ENERGY_TUTORIAL_OUTCOME } from "@/game/engine/first-run-script";

const createRunSchema = z.object({
  seed: z.string().optional(),
});

export async function createRunAction(input: z.infer<typeof createRunSchema>) {
  try {
    const validated = createRunSchema.parse(input);
    const user = await requireAuth();
    const created = await createRunForUser(user.id!, validated.seed);

    revalidatePath("/game");
    return success(created);
  } catch (error) {
    return handleServerActionError(error);
  }
}

const saveRunStateSchema = z.object({
  runId: z.string(),
  state: z.any(),
});

export async function saveRunStateAction(
  input: z.infer<typeof saveRunStateSchema>
) {
  try {
    const validated = saveRunStateSchema.parse(input);
    const user = await requireAuth();
    const saved = await saveRunStateForUser({
      userId: user.id!,
      runId: validated.runId,
      state: validated.state as RunState,
    });

    return success({ saved });
  } catch (error) {
    return handleServerActionError(error);
  }
}

const endRunSchema = z.object({
  runId: z.string(),
  status: z.enum(["VICTORY", "DEFEAT", "ABANDONED"]),
  runDurationMs: z.number().int().nonnegative().optional(),
  earnedResources: z.record(z.string(), z.number()).optional(),
  startMerchantSpentResources: z.record(z.string(), z.number()).optional(),
  scriptedOutcome: z.enum([FIRST_RUN_ENERGY_TUTORIAL_OUTCOME]).optional(),
  encounteredEnemies: z
    .record(z.string(), z.enum(["NORMAL", "ELITE", "BOSS"]))
    .optional(),
  enemyKillCounts: z.record(z.string(), z.number().int().min(0)).optional(),
});

export async function endRunAction(input: z.infer<typeof endRunSchema>) {
  try {
    const validated = endRunSchema.parse(input);
    const user = await requireAuth();
    const ended = await endRunForUser({
      userId: user.id!,
      runId: validated.runId,
      status: validated.status,
      runDurationMs: validated.runDurationMs,
      earnedResources: validated.earnedResources,
      startMerchantSpentResources: validated.startMerchantSpentResources,
      scriptedOutcome: validated.scriptedOutcome,
      encounteredEnemies: validated.encounteredEnemies,
      enemyKillCounts: validated.enemyKillCounts,
    });

    if (!ended) {
      return success({ ended: false });
    }

    revalidatePath("/game");
    return success({ ended: true });
  } catch (error) {
    return handleServerActionError(error);
  }
}

export async function getActiveRunAction() {
  try {
    const user = await requireAuth();
    const snapshot = await getActiveRunSnapshotForUser(user.id!);

    return success({
      run: snapshot.run,
      userRole: user.role,
      isFirstRun: snapshot.isFirstRun,
    });
  } catch (error) {
    return handleServerActionError(error);
  }
}

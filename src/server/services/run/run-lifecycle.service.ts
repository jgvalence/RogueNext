import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { RunState } from "@/game/schemas/run-state";
import { incrementRunStatsInternal } from "@/server/actions/progression";
import {
  createActiveRunForUser,
  deleteRunById,
  markRunEndedForUser,
} from "./run-persistence.service";
import { syncRunEndProgression } from "./run-progression-sync.service";
import {
  buildInitialRunStateForUser,
  getActiveRunSnapshotForUser,
} from "./run-state.service";

export type { ActiveRunSnapshot } from "./run-state.service";

export type RunCompletionStatus = "VICTORY" | "DEFEAT" | "ABANDONED";

export interface DeckSnapshotInput {
  characterId: string;
  floor: number;
  difficultyLevel: number;
  biome: string;
  deck: unknown;
  relicIds: string[];
  hp: number;
  maxHp: number;
  gold: number;
}

export interface EndRunForUserInput {
  userId: string;
  runId: string;
  status: RunCompletionStatus;
  runDurationMs?: number;
  earnedResources?: Record<string, number>;
  startMerchantSpentResources?: Record<string, number>;
  scriptedOutcome?: "FIRST_RUN_ENERGY_TUTORIAL";
  encounteredEnemies?: RunState["encounteredEnemies"];
  enemyKillCounts?: RunState["enemyKillCounts"];
  deckSnapshot?: DeckSnapshotInput;
}

export async function createRunForUser(
  userId: string,
  requestedSeed?: string
): Promise<{ runId: string; state: RunState }> {
  const { seed, state } = await buildInitialRunStateForUser(
    userId,
    requestedSeed
  );
  const created = await createActiveRunForUser(userId, seed, state);

  if (created.abandonedCount > 0) {
    await incrementRunStatsInternal(
      userId,
      "ABANDONED",
      created.abandonedCount
    );
  }

  return {
    runId: created.runId,
    state: created.state,
  };
}

export async function endRunForUser(
  input: EndRunForUserInput
): Promise<boolean> {
  const { run, ended } = await markRunEndedForUser({
    userId: input.userId,
    runId: input.runId,
    status: input.status,
  });

  if (!ended) {
    return false;
  }

  await syncRunEndProgression({
    userId: input.userId,
    run,
    status: input.status,
    runDurationMs: input.runDurationMs,
    earnedResources: input.earnedResources,
    startMerchantSpentResources: input.startMerchantSpentResources,
    scriptedOutcome: input.scriptedOutcome,
    encounteredEnemies: input.encounteredEnemies,
    enemyKillCounts: input.enemyKillCounts,
  });

  if (input.status !== "ABANDONED" && input.deckSnapshot) {
    const snap = input.deckSnapshot;
    const progression = await prisma.userProgression.findUnique({
      where: { userId: input.userId },
      select: { unlockedStoryIds: true },
    });
    const unlockedStoryCount =
      (progression?.unlockedStoryIds as string[] | null)?.length ?? 0;
    const powerScore =
      snap.floor * 10 +
      snap.difficultyLevel * 8 +
      snap.relicIds.length * 3 +
      unlockedStoryCount * 2;

    await prisma.pvpDeckSnapshot.create({
      data: {
        userId: input.userId,
        characterId: snap.characterId,
        floor: snap.floor,
        difficultyLevel: snap.difficultyLevel,
        biome: snap.biome,
        status: input.status,
        deck: snap.deck as Prisma.InputJsonValue,
        relicIds: snap.relicIds,
        hp: snap.hp,
        maxHp: snap.maxHp,
        gold: snap.gold,
        unlockedStoryCount,
        powerScore,
      },
    });
  }

  await deleteRunById(input.runId);

  return true;
}

export { getActiveRunSnapshotForUser };

import { Prisma, type Run } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  mergeEnemyKillCounts,
  mergeEncounteredEnemies,
  readEnemyKillCountsFromResources,
  readEncounteredEnemiesFromResources,
  writeEnemyKillCountsToResources,
  writeEncounteredEnemiesToResources,
} from "@/game/engine/bestiary";
import {
  readUnlockProgressFromResources,
  writeUnlockProgressToResources,
} from "@/game/engine/card-unlocks";
import {
  unlockNextDifficultyOnVictory,
  updateBestGoldInSingleRun,
  updateBestInfiniteFloor,
} from "@/game/engine/difficulty";
import { isInfiniteRunConditionId } from "@/game/engine/run-conditions";
import type { RunState } from "@/game/schemas/run-state";
import {
  addResourcesInternal,
  incrementRunStatsInternal,
} from "@/server/actions/progression";

const EMPTY_CARD_UNLOCK_PROGRESS = {
  enteredBiomes: {},
  biomeRunsCompleted: {},
  eliteKillsByBiome: {},
  bossKillsByBiome: {},
};

const SCRIBE_RESOURCE_KEYS: Record<string, string> = {
  scribe_1_first_meeting: "__SCRIBE_1_ATT",
  scribe_2_lost_words: "__SCRIBE_2_ATT",
  scribe_3_familiar_face: "__SCRIBE_3_ATT",
  scribe_4_torn_pages: "__SCRIBE_4_ATT",
  scribe_5_the_name: "__SCRIBE_5_ATT",
  scribe_6_the_warning: "__SCRIBE_6_ATT",
  scribe_7_the_other: "__SCRIBE_7_ATT",
  scribe_8_the_truth: "__SCRIBE_8_ATT",
  scribe_9_the_choice: "__SCRIBE_9_ATT",
  scribe_10_the_reveal: "__SCRIBE_10_ATT",
};

export interface SyncRunEndProgressionInput {
  userId: string;
  run: Run;
  status: "VICTORY" | "DEFEAT" | "ABANDONED";
  earnedResources?: Record<string, number>;
  startMerchantSpentResources?: Record<string, number>;
  encounteredEnemies?: RunState["encounteredEnemies"];
  enemyKillCounts?: RunState["enemyKillCounts"];
}

function scaleEarnedResources(
  earnedResources: Record<string, number>,
  status: SyncRunEndProgressionInput["status"]
): Record<string, number> {
  const multiplier = status === "VICTORY" ? 1.25 : 1;
  const scaledResources: Record<string, number> = {};

  for (const [key, amount] of Object.entries(earnedResources)) {
    scaledResources[key] = amount * multiplier;
  }

  return scaledResources;
}

function applySpentStartMerchantResources(
  baseResources: Record<string, number>,
  spentResources: Record<string, number>
): Record<string, number> {
  const nextResources = { ...baseResources };

  for (const [resource, spent] of Object.entries(spentResources)) {
    const safeSpent = Math.max(0, Math.floor(spent ?? 0));
    nextResources[resource] = Math.max(
      0,
      (nextResources[resource] ?? 0) - safeSpent
    );
  }

  return nextResources;
}

function mergeProgressMap(
  target: Record<string, number>,
  source: Record<string, number> | undefined
): void {
  if (!source) return;

  for (const [key, value] of Object.entries(source)) {
    target[key] = Math.max(target[key] ?? 0, value ?? 0);
  }
}

function buildStandardRunResources(
  currentResources: Record<string, number>,
  runState: RunState,
  status: SyncRunEndProgressionInput["status"]
): Record<string, number> {
  const currentUnlockProgress =
    readUnlockProgressFromResources(currentResources);
  const runUnlockProgress =
    runState.cardUnlockProgress ?? EMPTY_CARD_UNLOCK_PROGRESS;
  const mergedUnlockProgress = {
    enteredBiomes: { ...currentUnlockProgress.enteredBiomes },
    biomeRunsCompleted: { ...currentUnlockProgress.biomeRunsCompleted },
    eliteKillsByBiome: { ...currentUnlockProgress.eliteKillsByBiome },
    bossKillsByBiome: { ...currentUnlockProgress.bossKillsByBiome },
  };

  mergeProgressMap(
    mergedUnlockProgress.enteredBiomes,
    runUnlockProgress.enteredBiomes
  );
  mergeProgressMap(
    mergedUnlockProgress.biomeRunsCompleted,
    runUnlockProgress.biomeRunsCompleted
  );
  mergeProgressMap(
    mergedUnlockProgress.eliteKillsByBiome,
    runUnlockProgress.eliteKillsByBiome
  );
  mergeProgressMap(
    mergedUnlockProgress.bossKillsByBiome,
    runUnlockProgress.bossKillsByBiome
  );

  const resourcesWithUnlocks = writeUnlockProgressToResources(
    currentResources,
    mergedUnlockProgress
  );
  const difficultyLevelForUnlock = runState.selectedDifficultyLevel ?? 0;
  const characterIdForUnlock =
    (runState.characterId as string | undefined) ?? "scribe";
  const resourcesWithDifficultyUnlock =
    status === "VICTORY"
      ? unlockNextDifficultyOnVictory(
          resourcesWithUnlocks,
          difficultyLevelForUnlock,
          characterIdForUnlock
        )
      : resourcesWithUnlocks;

  return updateBestGoldInSingleRun(
    resourcesWithDifficultyUnlock,
    Math.max(runState.maxGoldReached ?? 0, runState.gold ?? 0)
  );
}

function applyScribeChoices(
  resources: Record<string, number>,
  runState: RunState
): Record<string, number> {
  const scribeChoices = runState.scribeChoices ?? {};
  if (Object.keys(scribeChoices).length === 0) {
    return resources;
  }

  const scribeDelta: Record<string, number> = {};
  for (const [eventId, attitudeDelta] of Object.entries(scribeChoices)) {
    const key = SCRIBE_RESOURCE_KEYS[eventId];
    if (key) {
      scribeDelta[key] = attitudeDelta + 2;
    }
  }

  return { ...resources, ...scribeDelta };
}

export async function syncRunEndProgression(
  input: SyncRunEndProgressionInput
): Promise<void> {
  const runState = input.run.state as unknown as RunState;
  const isInfiniteRun = isInfiniteRunConditionId(
    runState.selectedRunConditionId
  );
  const earnedResources = isInfiniteRun
    ? {}
    : (input.earnedResources ?? runState.earnedResources ?? {});

  if (Object.keys(earnedResources).length > 0) {
    await addResourcesInternal(
      input.userId,
      scaleEarnedResources(earnedResources, input.status)
    );
  }

  const progression = await prisma.userProgression.findUnique({
    where: { userId: input.userId },
    select: { resources: true, unlockedStoryIds: true },
  });
  const currentResourcesBase =
    (progression?.resources as Record<string, number>) ?? {};
  const startMerchantSpentResources =
    input.startMerchantSpentResources ??
    runState.startMerchantSpentResources ??
    {};
  const currentResources = applySpentStartMerchantResources(
    currentResourcesBase,
    startMerchantSpentResources
  );

  let nextResources = isInfiniteRun
    ? updateBestInfiniteFloor(currentResources, runState.floor)
    : buildStandardRunResources(currentResources, runState, input.status);

  nextResources = applyScribeChoices(nextResources, runState);

  const mergedEncounteredEnemies = mergeEncounteredEnemies(
    readEncounteredEnemiesFromResources(currentResourcesBase),
    input.encounteredEnemies ?? runState.encounteredEnemies ?? {}
  );
  nextResources = writeEncounteredEnemiesToResources(
    nextResources,
    mergedEncounteredEnemies
  );

  const mergedEnemyKillCounts = mergeEnemyKillCounts(
    readEnemyKillCountsFromResources(currentResourcesBase),
    input.enemyKillCounts ?? runState.enemyKillCounts ?? {}
  );
  nextResources = writeEnemyKillCountsToResources(
    nextResources,
    mergedEnemyKillCounts
  );

  await prisma.userProgression.upsert({
    where: { userId: input.userId },
    create: {
      userId: input.userId,
      resources: nextResources as unknown as Prisma.InputJsonValue,
      unlockedStoryIds: (progression?.unlockedStoryIds as string[]) ?? [],
    },
    update: {
      resources: nextResources as unknown as Prisma.InputJsonValue,
    },
  });

  const runDurationMs = Math.max(0, Date.now() - input.run.createdAt.getTime());
  await incrementRunStatsInternal(input.userId, input.status, 1, {
    difficultyLevel: runState.selectedDifficultyLevel ?? 0,
    runDurationMs,
  });
}

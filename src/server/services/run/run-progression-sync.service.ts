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
  getEarnedResourceMultiplierForRun,
  recordCharacterDifficultyVictory,
  unlockNextDifficultyOnVictory,
  updateBestGoldInSingleRun,
  updateBestInfiniteFloor,
} from "@/game/engine/difficulty";
import { isInfiniteRunConditionId } from "@/game/engine/run-conditions";
import type { RunState } from "@/game/schemas/run-state";
import { incrementRunStatsInternal } from "@/server/actions/progression";
import { markFirstRunGuidedStoryTutorialPending } from "@/game/engine/library-tutorial";

const EMPTY_CARD_UNLOCK_PROGRESS = {
  enteredBiomes: {},
  biomeRunsCompleted: {},
  eliteKillsByBiome: {},
  bossKillsByBiome: {},
  byCharacter: {},
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
  runDurationMs?: number;
  earnedResources?: Record<string, number>;
  startMerchantSpentResources?: Record<string, number>;
  scriptedOutcome?: "FIRST_RUN_ENERGY_TUTORIAL";
  encounteredEnemies?: RunState["encounteredEnemies"];
  enemyKillCounts?: RunState["enemyKillCounts"];
}

function scaleEarnedResources(
  earnedResources: Record<string, number>,
  multiplier: number
): Record<string, number> {
  const scaledResources: Record<string, number> = {};

  for (const [key, amount] of Object.entries(earnedResources)) {
    scaledResources[key] = amount * multiplier;
  }

  return scaledResources;
}

function addScaledResources(
  baseResources: Record<string, number>,
  earnedResources: Record<string, number>
): Record<string, number> {
  const nextResources = { ...baseResources };

  for (const [key, amount] of Object.entries(earnedResources)) {
    nextResources[key] = (nextResources[key] ?? 0) + Math.round(amount);
  }

  return nextResources;
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

function mergeCharacterProgressMap(
  target: Record<
    string,
    {
      enteredBiomes: Record<string, number>;
      biomeRunsCompleted: Record<string, number>;
      eliteKillsByBiome: Record<string, number>;
      bossKillsByBiome: Record<string, number>;
    }
  >,
  source:
    | Record<
        string,
        {
          enteredBiomes: Record<string, number>;
          biomeRunsCompleted: Record<string, number>;
          eliteKillsByBiome: Record<string, number>;
          bossKillsByBiome: Record<string, number>;
        }
      >
    | undefined
): void {
  if (!source) return;

  for (const [characterId, characterProgress] of Object.entries(source)) {
    const nextTarget = target[characterId] ?? {
      enteredBiomes: {},
      biomeRunsCompleted: {},
      eliteKillsByBiome: {},
      bossKillsByBiome: {},
    };
    mergeProgressMap(nextTarget.enteredBiomes, characterProgress.enteredBiomes);
    mergeProgressMap(
      nextTarget.biomeRunsCompleted,
      characterProgress.biomeRunsCompleted
    );
    mergeProgressMap(
      nextTarget.eliteKillsByBiome,
      characterProgress.eliteKillsByBiome
    );
    mergeProgressMap(
      nextTarget.bossKillsByBiome,
      characterProgress.bossKillsByBiome
    );
    target[characterId] = nextTarget;
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
    byCharacter: { ...(currentUnlockProgress.byCharacter ?? {}) },
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
  mergeCharacterProgressMap(
    mergedUnlockProgress.byCharacter,
    runUnlockProgress.byCharacter
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
  const resourcesWithCharacterDifficultyWin =
    status === "VICTORY"
      ? recordCharacterDifficultyVictory(
          resourcesWithDifficultyUnlock,
          characterIdForUnlock,
          difficultyLevelForUnlock
        )
      : resourcesWithDifficultyUnlock;

  return updateBestGoldInSingleRun(
    resourcesWithCharacterDifficultyWin,
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

  const progression = await prisma.userProgression.findUnique({
    where: { userId: input.userId },
    select: { resources: true, unlockedStoryIds: true },
  });
  const currentResourcesBase =
    (progression?.resources as Record<string, number>) ?? {};
  const characterId = (runState.characterId as string | undefined) ?? "scribe";
  const difficultyLevel = runState.selectedDifficultyLevel ?? 0;
  const earnedResourceMultiplier = getEarnedResourceMultiplierForRun(
    currentResourcesBase,
    characterId,
    difficultyLevel,
    input.status
  );
  const startMerchantSpentResources =
    input.startMerchantSpentResources ??
    runState.startMerchantSpentResources ??
    {};
  const currentResources = applySpentStartMerchantResources(
    currentResourcesBase,
    startMerchantSpentResources
  );
  const currentResourcesWithEarned = addScaledResources(
    currentResources,
    scaleEarnedResources(earnedResources, earnedResourceMultiplier)
  );

  let nextResources = isInfiniteRun
    ? updateBestInfiniteFloor(currentResourcesWithEarned, runState.floor)
    : buildStandardRunResources(
        currentResourcesWithEarned,
        runState,
        input.status
      );

  nextResources = applyScribeChoices(nextResources, runState);
  if (input.scriptedOutcome === "FIRST_RUN_ENERGY_TUTORIAL") {
    nextResources = markFirstRunGuidedStoryTutorialPending(nextResources);
  }

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

  const runDurationMs = Math.max(
    0,
    Math.floor(
      input.runDurationMs ??
        runState.activePlayMs ??
        Date.now() - input.run.createdAt.getTime()
    )
  );
  await incrementRunStatsInternal(input.userId, input.status, 1, {
    difficultyLevel: runState.selectedDifficultyLevel ?? 0,
    runDurationMs,
  });
}

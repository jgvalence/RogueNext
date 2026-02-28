"use server";

import { z } from "zod";
import { requireAuth } from "@/lib/auth/helpers";
import { handleServerActionError, success } from "@/lib/errors/handlers";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { createNewRun } from "@/game/engine/run";
import { createRNG } from "@/game/engine/rng";
import { GAME_CONSTANTS } from "@/game/constants";
import { starterDeckComposition } from "@/game/data/starter-deck";
import { allCardDefinitions, buildCardDefsMap } from "@/game/data";
import { relicDefinitions } from "@/game/data/relics";
import type { RunState } from "@/game/schemas/run-state";
import type { BiomeType } from "@/game/schemas/enums";
import { computeMetaBonuses } from "@/game/engine/meta";
import {
  computeUnlockedRunConditionIds,
  drawRunConditionChoices,
  isInfiniteRunConditionId,
  normalizeRunConditionIds,
} from "@/game/engine/run-conditions";
import {
  computeUnlockedRelicIds,
  getBestGoldInSingleRun,
  getUnlockedDifficultyLevels,
  getUnlockedMaxDifficultyFromResources,
  unlockNextDifficultyOnVictory,
  updateBestInfiniteFloor,
  updateBestGoldInSingleRun,
} from "@/game/engine/difficulty";
import { addResourcesInternal, incrementRunStatsInternal } from "./progression";
import {
  readUnlockProgressFromResources,
  writeUnlockProgressToResources,
} from "@/game/engine/card-unlocks";

const createRunSchema = z.object({
  seed: z.string().optional(),
});

function normalizeRunHpFromMetaBonuses(
  state: RunState,
  nextExtraHpBonus: number
): Pick<RunState, "playerMaxHp" | "playerCurrentHp"> {
  const previousExtraHpBonus = state.metaBonuses?.extraHp ?? 0;
  const extraHpDelta = nextExtraHpBonus - previousExtraHpBonus;
  const nextPlayerMaxHp = Math.max(1, state.playerMaxHp + extraHpDelta);
  const nextPlayerCurrentHp = Math.max(
    0,
    Math.min(nextPlayerMaxHp, state.playerCurrentHp + extraHpDelta)
  );

  return {
    playerMaxHp: nextPlayerMaxHp,
    playerCurrentHp: nextPlayerCurrentHp,
  };
}

export async function createRunAction(input: z.infer<typeof createRunSchema>) {
  try {
    const validated = createRunSchema.parse(input);
    const user = await requireAuth();

    const seed = validated.seed ?? `${Date.now()}-${nanoid()}`;
    const rng = createRNG(seed);

    // Load meta-progression bonuses for this user
    const progression = await prisma.userProgression.findUnique({
      where: { userId: user.id! },
      select: {
        resources: true,
        unlockedStoryIds: true,
        totalRuns: true,
        wonRuns: true,
        winsByDifficulty: true,
      },
    });
    const unlockedStoryIds = (progression?.unlockedStoryIds as string[]) ?? [];
    const resources = (progression?.resources as Record<string, number>) ?? {};
    const winsByDifficulty =
      (progression?.winsByDifficulty as Record<string, number>) ?? {};
    const initialUnlockProgress = readUnlockProgressFromResources(resources);
    const metaBonuses = computeMetaBonuses(unlockedStoryIds);
    const unlockedDifficultyLevels = getUnlockedDifficultyLevels(resources);
    const unlockedDifficultyLevelMax =
      getUnlockedMaxDifficultyFromResources(resources);
    const unlockedRelicIds = computeUnlockedRelicIds(
      relicDefinitions.map((relic) => relic.id),
      {
        totalRuns: progression?.totalRuns ?? 0,
        wonRuns: progression?.wonRuns ?? 0,
        unlockedDifficultyMax: unlockedDifficultyLevelMax,
        winsByDifficulty,
        bestGoldInSingleRun: getBestGoldInSingleRun(resources),
      }
    );
    const unlockedRunConditionIds = computeUnlockedRunConditionIds({
      totalRuns: progression?.totalRuns ?? 0,
      wonRuns: progression?.wonRuns ?? 0,
    });
    const startingBiomeChoices: [BiomeType, BiomeType] | null =
      (progression?.totalRuns ?? 0) > 0
        ? ([
            "LIBRARY",
            createRNG(`${seed}-opening-biome`).pick(
              GAME_CONSTANTS.AVAILABLE_BIOMES
            ),
          ] as [BiomeType, BiomeType])
        : null;

    // Build starter card definitions from composition
    const cardDefsMap = buildCardDefsMap();
    const starterCards = starterDeckComposition
      .map((id) => cardDefsMap.get(id))
      .filter((c): c is NonNullable<typeof c> => c != null);

    const runState = createNewRun(
      nanoid(),
      seed,
      starterCards,
      rng,
      metaBonuses,
      unlockedStoryIds,
      initialUnlockProgress,
      allCardDefinitions,
      unlockedRunConditionIds,
      unlockedDifficultyLevels,
      unlockedDifficultyLevelMax,
      startingBiomeChoices,
      resources,
      unlockedRelicIds
    );

    const now = new Date();
    let abandonedCount = 0;
    const run = await prisma.$transaction(async (tx) => {
      // Ensure there is only one active run per user: close previous ones first.
      const abandoned = await tx.run.updateMany({
        where: { userId: user.id!, status: "IN_PROGRESS" },
        data: { status: "ABANDONED", endedAt: now },
      });
      abandonedCount = abandoned.count;

      // Keep only the active run in DB.
      await tx.run.deleteMany({
        where: { userId: user.id!, status: { not: "IN_PROGRESS" } },
      });

      const created = await tx.run.create({
        data: {
          userId: user.id!,
          seed,
          state: runState as unknown as Prisma.InputJsonValue,
          status: "IN_PROGRESS",
        },
      });

      // Update runId in state to match DB id.
      const stateWithDbId: RunState = { ...runState, runId: created.id };
      await tx.run.update({
        where: { id: created.id },
        data: { state: stateWithDbId as unknown as Prisma.InputJsonValue },
      });

      return created;
    });

    if (abandonedCount > 0) {
      await incrementRunStatsInternal(user.id!, "ABANDONED", abandonedCount);
    }
    const stateWithDbId: RunState = { ...runState, runId: run.id };

    revalidatePath("/game");
    return success({ runId: run.id, state: stateWithDbId });
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

    const run = await prisma.run.findUnique({
      where: { id: validated.runId },
    });

    if (!run || run.userId !== user.id) {
      throw new Error("Run not found or access denied");
    }

    // Ignore stale auto-saves from ended/abandoned runs to avoid resurrecting old runs.
    if (run.status !== "IN_PROGRESS") {
      return success({ saved: false });
    }

    const state = validated.state as RunState;

    await prisma.run.update({
      where: { id: validated.runId },
      data: {
        state: state as unknown as Prisma.InputJsonValue,
        floor: state.floor,
        room: state.currentRoom,
        gold: state.gold,
      },
    });

    return success({ saved: true });
  } catch (error) {
    return handleServerActionError(error);
  }
}

const endRunSchema = z.object({
  runId: z.string(),
  status: z.enum(["VICTORY", "DEFEAT", "ABANDONED"]),
  earnedResources: z.record(z.string(), z.number()).optional(),
  startMerchantSpentResources: z.record(z.string(), z.number()).optional(),
});

export async function endRunAction(input: z.infer<typeof endRunSchema>) {
  try {
    const validated = endRunSchema.parse(input);
    const user = await requireAuth();

    const run = await prisma.run.findUnique({
      where: { id: validated.runId },
    });

    if (!run || run.userId !== user.id) {
      throw new Error("Run not found or access denied");
    }

    const updated = await prisma.run.updateMany({
      where: {
        id: validated.runId,
        userId: user.id!,
        status: "IN_PROGRESS",
      },
      data: {
        status: validated.status,
        endedAt: new Date(),
      },
    });
    if (updated.count === 0) {
      return success({ ended: false });
    }

    // Prefer client-supplied earnedResources (always up-to-date, avoids auto-save race),
    // fall back to DB state for robustness
    const runState = run.state as unknown as RunState;
    const isInfiniteRun = isInfiniteRunConditionId(
      runState.selectedRunConditionId
    );
    const earnedResources = isInfiniteRun
      ? {}
      : (validated.earnedResources ?? runState.earnedResources ?? {});
    if (Object.keys(earnedResources).length > 0) {
      // Victory bonus: multiply all resources by 1.25
      const multiplier = validated.status === "VICTORY" ? 1.25 : 1;
      const scaledResources: Record<string, number> = {};
      for (const [key, amount] of Object.entries(earnedResources)) {
        scaledResources[key] = (amount as number) * multiplier;
      }
      await addResourcesInternal(user.id!, scaledResources);
    }

    const progression = await prisma.userProgression.findUnique({
      where: { userId: user.id! },
      select: { resources: true, unlockedStoryIds: true },
    });
    const currentResourcesBase =
      (progression?.resources as Record<string, number>) ?? {};
    const startMerchantSpentResources =
      validated.startMerchantSpentResources ??
      runState.startMerchantSpentResources ??
      {};
    const currentResources = { ...currentResourcesBase };
    for (const [resource, spent] of Object.entries(
      startMerchantSpentResources
    )) {
      const safeSpent = Math.max(0, Math.floor(spent ?? 0));
      currentResources[resource] = Math.max(
        0,
        (currentResources[resource] ?? 0) - safeSpent
      );
    }

    let nextResources = currentResources;
    if (isInfiniteRun) {
      nextResources = updateBestInfiniteFloor(nextResources, runState.floor);
    } else {
      const currentUnlockProgress =
        readUnlockProgressFromResources(currentResources);
      const runUnlockProgress = runState.cardUnlockProgress ?? {
        enteredBiomes: {},
        biomeRunsCompleted: {},
        eliteKillsByBiome: {},
        bossKillsByBiome: {},
      };
      const mergedUnlockProgress = {
        enteredBiomes: { ...currentUnlockProgress.enteredBiomes },
        biomeRunsCompleted: { ...currentUnlockProgress.biomeRunsCompleted },
        eliteKillsByBiome: { ...currentUnlockProgress.eliteKillsByBiome },
        bossKillsByBiome: { ...currentUnlockProgress.bossKillsByBiome },
      };
      for (const [biome, value] of Object.entries(
        runUnlockProgress.enteredBiomes
      )) {
        mergedUnlockProgress.enteredBiomes[biome] = Math.max(
          mergedUnlockProgress.enteredBiomes[biome] ?? 0,
          value ?? 0
        );
      }
      for (const [biome, value] of Object.entries(
        runUnlockProgress.biomeRunsCompleted
      )) {
        mergedUnlockProgress.biomeRunsCompleted[biome] = Math.max(
          mergedUnlockProgress.biomeRunsCompleted[biome] ?? 0,
          value ?? 0
        );
      }
      for (const [biome, value] of Object.entries(
        runUnlockProgress.eliteKillsByBiome
      )) {
        mergedUnlockProgress.eliteKillsByBiome[biome] = Math.max(
          mergedUnlockProgress.eliteKillsByBiome[biome] ?? 0,
          value ?? 0
        );
      }
      for (const [biome, value] of Object.entries(
        runUnlockProgress.bossKillsByBiome
      )) {
        mergedUnlockProgress.bossKillsByBiome[biome] = Math.max(
          mergedUnlockProgress.bossKillsByBiome[biome] ?? 0,
          value ?? 0
        );
      }
      const resourcesWithUnlocks = writeUnlockProgressToResources(
        currentResources,
        mergedUnlockProgress
      );
      const difficultyLevelForUnlock = runState.selectedDifficultyLevel ?? 0;
      const resourcesWithDifficultyUnlock =
        validated.status === "VICTORY"
          ? unlockNextDifficultyOnVictory(
              resourcesWithUnlocks,
              difficultyLevelForUnlock
            )
          : resourcesWithUnlocks;
      nextResources = updateBestGoldInSingleRun(
        resourcesWithDifficultyUnlock,
        Math.max(runState.maxGoldReached ?? 0, runState.gold ?? 0)
      );
    }

    const selectedDifficultyLevel = runState.selectedDifficultyLevel ?? 0;
    const runDurationMs = Math.max(0, Date.now() - run.createdAt.getTime());
    await prisma.userProgression.upsert({
      where: { userId: user.id! },
      create: {
        userId: user.id!,
        resources: nextResources as unknown as Prisma.InputJsonValue,
        unlockedStoryIds: (progression?.unlockedStoryIds as string[]) ?? [],
      },
      update: {
        resources: nextResources as unknown as Prisma.InputJsonValue,
      },
    });

    await incrementRunStatsInternal(user.id!, validated.status, 1, {
      difficultyLevel: selectedDifficultyLevel,
      runDurationMs,
    });

    // Keep only active runs persisted in DB.
    await prisma.run.delete({
      where: { id: validated.runId },
    });

    revalidatePath("/game");
    return success({ ended: true });
  } catch (error) {
    return handleServerActionError(error);
  }
}

export async function getActiveRunAction() {
  try {
    const user = await requireAuth();

    const [run, progression] = await Promise.all([
      prisma.run.findFirst({
        where: { userId: user.id!, status: "IN_PROGRESS" },
        // Pick latest created run if duplicates exist for any reason.
        orderBy: { createdAt: "desc" },
      }),
      prisma.userProgression.findUnique({
        where: { userId: user.id! },
        select: {
          unlockedStoryIds: true,
          totalRuns: true,
          wonRuns: true,
          resources: true,
          winsByDifficulty: true,
        },
      }),
    ]);

    if (!run) {
      return success({ run: null, userRole: user.role });
    }

    // Recompute meta bonuses from current progression so that stories
    // unlocked after the run was created are still applied.
    const unlockedStoryIds = (progression?.unlockedStoryIds as string[]) ?? [];
    const resources = (progression?.resources as Record<string, number>) ?? {};
    const winsByDifficulty =
      (progression?.winsByDifficulty as Record<string, number>) ?? {};
    const freshMetaBonuses = computeMetaBonuses(unlockedStoryIds);
    const state = run.state as unknown as RunState;
    const unlockedDifficultyLevels = getUnlockedDifficultyLevels(resources);
    const unlockedDifficultyLevelMax =
      getUnlockedMaxDifficultyFromResources(resources);
    const freshUnlockedRelicIds = computeUnlockedRelicIds(
      relicDefinitions.map((relic) => relic.id),
      {
        totalRuns: progression?.totalRuns ?? 0,
        wonRuns: progression?.wonRuns ?? 0,
        unlockedDifficultyMax: unlockedDifficultyLevelMax,
        winsByDifficulty,
        bestGoldInSingleRun: getBestGoldInSingleRun(resources),
      }
    );
    const normalizedCurrentRoom = Math.max(
      0,
      Math.min(state.currentRoom, GAME_CONSTANTS.ROOMS_PER_FLOOR)
    );
    const selectedDifficultyLevel =
      state.selectedDifficultyLevel ??
      (state.floor > 1 || normalizedCurrentRoom > 0 || state.combat ? 0 : null);
    const pendingDifficultyLevels =
      selectedDifficultyLevel === null
        ? unlockedDifficultyLevels
        : (state.pendingDifficultyLevels ?? []);
    const hasChosenRunCondition = Boolean(state.selectedRunConditionId);
    const normalizedPendingRunConditionChoices = normalizeRunConditionIds(
      state.pendingRunConditionChoices ?? []
    );
    const shouldRebuildStartChoices =
      !hasChosenRunCondition &&
      state.floor === 1 &&
      normalizedCurrentRoom === 0;
    const unlockedRunConditionIds = computeUnlockedRunConditionIds({
      totalRuns: progression?.totalRuns ?? 0,
      wonRuns: progression?.wonRuns ?? 0,
    });
    const backfilledRunConditionChoices = shouldRebuildStartChoices
      ? drawRunConditionChoices(
          unlockedRunConditionIds,
          createRNG(`${state.seed}-run-conditions`)
        )
      : normalizedPendingRunConditionChoices;
    const isInfiniteRun = isInfiniteRunConditionId(
      state.selectedRunConditionId
    );
    const needsBiomeChoicesRecovery =
      state.pendingBiomeChoices === null &&
      state.combat === null &&
      normalizedCurrentRoom >= GAME_CONSTANTS.ROOMS_PER_FLOOR &&
      (isInfiniteRun || state.floor < GAME_CONSTANTS.MAX_FLOORS);
    let recoveredPendingBiomeChoices: RunState["pendingBiomeChoices"] =
      state.pendingBiomeChoices ?? null;
    if (needsBiomeChoicesRecovery) {
      const shuffledBiomes = createRNG(
        `${state.seed}-recover-biomes-floor-${state.floor}`
      ).shuffle([...GAME_CONSTANTS.AVAILABLE_BIOMES]);
      recoveredPendingBiomeChoices =
        state.floor === 1
          ? (["LIBRARY", shuffledBiomes[0]!] as [BiomeType, BiomeType])
          : ([shuffledBiomes[0]!, shuffledBiomes[1]!] as [
              BiomeType,
              BiomeType,
            ]);
    }
    const normalizedHp = normalizeRunHpFromMetaBonuses(
      state,
      freshMetaBonuses.extraHp ?? 0
    );

    const stateWithFreshBonuses: RunState = {
      ...state,
      currentRoom: normalizedCurrentRoom,
      playerMaxHp: normalizedHp.playerMaxHp,
      playerCurrentHp: normalizedHp.playerCurrentHp,
      runStartedAtMs:
        state.runStartedAtMs && state.runStartedAtMs > 0
          ? state.runStartedAtMs
          : run.createdAt.getTime(),
      metaBonuses: freshMetaBonuses,
      freeUpgradeUsed: state.freeUpgradeUsed ?? false,
      survivalOnceUsed: state.survivalOnceUsed ?? false,
      pendingDifficultyLevels,
      selectedDifficultyLevel,
      unlockedDifficultyLevelSnapshot:
        state.unlockedDifficultyLevelSnapshot ?? unlockedDifficultyLevelMax,
      pendingRunConditionChoices: backfilledRunConditionChoices,
      selectedRunConditionId: state.selectedRunConditionId ?? null,
      pendingBiomeChoices: recoveredPendingBiomeChoices,
      maxGoldReached: Math.max(state.maxGoldReached ?? 0, state.gold),
      startMerchantResourcePool:
        state.startMerchantResourcePool ??
        (progression?.resources as Record<string, number>) ??
        {},
      startMerchantSpentResources: state.startMerchantSpentResources ?? {},
      startMerchantPurchasedOfferIds:
        state.startMerchantPurchasedOfferIds ?? [],
      startMerchantCompleted:
        state.startMerchantCompleted ??
        !(
          state.floor === 1 &&
          normalizedCurrentRoom === 0 &&
          state.combat === null
        ),
      unlockedRelicIds: freshUnlockedRelicIds,
    };

    return success({
      run: {
        id: run.id,
        state: stateWithFreshBonuses,
        seed: run.seed,
        createdAt: run.createdAt,
      },
      userRole: user.role,
    });
  } catch (error) {
    return handleServerActionError(error);
  }
}

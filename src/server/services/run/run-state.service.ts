import { nanoid } from "nanoid";
import { prisma } from "@/lib/db/prisma";
import { GAME_CONSTANTS } from "@/game/constants";
import { allCardDefinitions, buildCardDefsMap } from "@/game/data";
import {
  getAvailableCharacters,
  getCharacterById,
} from "@/game/data/characters";
import { relicDefinitions } from "@/game/data/relics";
import {
  mergeEnemyKillCounts,
  mergeEncounteredEnemies,
  readEnemyKillCountsFromResources,
  readEncounteredEnemiesFromResources,
} from "@/game/engine/bestiary";
import { readUnlockProgressFromResources } from "@/game/engine/card-unlocks";
import {
  computeUnlockedRelicIds,
  getBestGoldInSingleRun,
  readCharacterWinsByDifficultyFromResources,
  getUnlockedDifficultyLevelsForCharacter,
  getUnlockedMaxDifficultyForCharacter,
  getUnlockedMaxDifficultyFromResources,
} from "@/game/engine/difficulty";
import { computeMetaBonuses } from "@/game/engine/meta";
import { createRNG } from "@/game/engine/rng";
import {
  computeUnlockedRunConditionIds,
  drawRunConditionChoices,
  isInfiniteRunConditionId,
  normalizeRunConditionIds,
} from "@/game/engine/run-conditions";
import { createNewRun } from "@/game/engine/run";
import type { BiomeType } from "@/game/schemas/enums";
import type { RunState } from "@/game/schemas/run-state";
import { findLatestActiveRunForUser } from "./run-persistence.service";
import {
  normalizeRunHpFromMetaBonuses,
  recoverPendingBiomeChoices,
} from "./run-state-helpers";

export interface ActiveRunSnapshot {
  run: {
    id: string;
    state: RunState;
    seed: string;
    createdAt: Date;
  } | null;
  isFirstRun: boolean;
}

export async function buildInitialRunStateForUser(
  userId: string,
  requestedSeed?: string
): Promise<{ seed: string; state: RunState }> {
  const seed = requestedSeed ?? `${Date.now()}-${nanoid()}`;
  const rng = createRNG(seed);
  const progression = await prisma.userProgression.findUnique({
    where: { userId },
    select: {
      resources: true,
      unlockedStoryIds: true,
      totalRuns: true,
      wonRuns: true,
      winsByDifficulty: true,
    },
  });
  const resources = (progression?.resources as Record<string, number>) ?? {};
  const unlockedStoryIds = (progression?.unlockedStoryIds as string[]) ?? [];
  const winsByDifficulty =
    (progression?.winsByDifficulty as Record<string, number>) ?? {};
  const totalRuns = progression?.totalRuns ?? 0;
  const initialUnlockProgress = readUnlockProgressFromResources(resources);
  const initialEncounteredEnemies =
    readEncounteredEnemiesFromResources(resources);
  const initialEnemyKillCounts = readEnemyKillCountsFromResources(resources);
  const metaBonuses = computeMetaBonuses(unlockedStoryIds);
  const unlockedDifficultyLevelMax =
    getUnlockedMaxDifficultyFromResources(resources);
  const unlockedRelicIds = computeUnlockedRelicIds(
    relicDefinitions.map((relic) => relic.id),
    {
      totalRuns,
      wonRuns: progression?.wonRuns ?? 0,
      unlockedDifficultyMax: unlockedDifficultyLevelMax,
      winsByDifficulty,
      characterWinsByDifficulty:
        readCharacterWinsByDifficultyFromResources(resources),
      bestGoldInSingleRun: getBestGoldInSingleRun(resources),
      enemyKillCounts: initialEnemyKillCounts,
    }
  );
  const unlockedRunConditionIds = computeUnlockedRunConditionIds({
    totalRuns,
    wonRuns: progression?.wonRuns ?? 0,
    enemyKillCounts: initialEnemyKillCounts,
  });
  const startingBiomeChoices: [BiomeType, BiomeType] | null =
    totalRuns > 0
      ? ([
          "LIBRARY",
          createRNG(`${seed}-opening-biome`).pick(
            GAME_CONSTANTS.AVAILABLE_BIOMES
          ),
        ] as [BiomeType, BiomeType])
      : null;
  const availableCharacters = getAvailableCharacters(totalRuns).map(
    (character) => character.id
  );
  const difficultyMaxByCharacter: Record<string, number> = {};
  for (const characterId of availableCharacters) {
    difficultyMaxByCharacter[characterId] =
      getUnlockedMaxDifficultyForCharacter(resources, characterId);
  }

  const unlockedDifficultyLevelsForScribe =
    getUnlockedDifficultyLevelsForCharacter(resources, "scribe");
  const cardDefsMap = buildCardDefsMap();
  const scribeStarterDeckIds = getCharacterById("scribe").starterDeckIds;
  const starterCards = scribeStarterDeckIds
    .map((id) => cardDefsMap.get(id))
    .filter((card): card is NonNullable<typeof card> => card != null);
  const state = createNewRun(
    nanoid(),
    seed,
    starterCards,
    rng,
    metaBonuses,
    unlockedStoryIds,
    initialUnlockProgress,
    allCardDefinitions,
    unlockedRunConditionIds,
    unlockedDifficultyLevelsForScribe,
    difficultyMaxByCharacter["scribe"] ?? 0,
    startingBiomeChoices,
    resources,
    initialEncounteredEnemies,
    unlockedRelicIds,
    initialEnemyKillCounts,
    availableCharacters,
    difficultyMaxByCharacter,
    totalRuns === 0
      ? {
          enabled: true,
          step: "FIRST_COMBAT",
        }
      : null
  );

  return { seed, state };
}

export async function getActiveRunSnapshotForUser(
  userId: string
): Promise<ActiveRunSnapshot> {
  const [run, progression] = await Promise.all([
    findLatestActiveRunForUser(userId),
    prisma.userProgression.findUnique({
      where: { userId },
      select: {
        unlockedStoryIds: true,
        totalRuns: true,
        wonRuns: true,
        resources: true,
        winsByDifficulty: true,
      },
    }),
  ]);

  const resources = (progression?.resources as Record<string, number>) ?? {};
  const isFirstRun = (progression?.totalRuns ?? 0) === 0;
  if (!run) {
    return { run: null, isFirstRun };
  }

  const unlockedStoryIds = (progression?.unlockedStoryIds as string[]) ?? [];
  const winsByDifficulty =
    (progression?.winsByDifficulty as Record<string, number>) ?? {};
  const freshMetaBonuses = computeMetaBonuses(unlockedStoryIds);
  const state = run.state as unknown as RunState;
  const activeCharacterId =
    (state.characterId as string | undefined) ?? "scribe";
  const unlockedDifficultyLevels = getUnlockedDifficultyLevelsForCharacter(
    resources,
    activeCharacterId
  );
  const unlockedDifficultyLevelMax =
    getUnlockedMaxDifficultyFromResources(resources);
  const mergedEnemyKillCounts = mergeEnemyKillCounts(
    readEnemyKillCountsFromResources(resources),
    state.enemyKillCounts ?? {}
  );
  const freshUnlockedRelicIds = computeUnlockedRelicIds(
    relicDefinitions.map((relic) => relic.id),
    {
      totalRuns: progression?.totalRuns ?? 0,
      wonRuns: progression?.wonRuns ?? 0,
      unlockedDifficultyMax: unlockedDifficultyLevelMax,
      winsByDifficulty,
      characterWinsByDifficulty:
        readCharacterWinsByDifficultyFromResources(resources),
      bestGoldInSingleRun: getBestGoldInSingleRun(resources),
      enemyKillCounts: mergedEnemyKillCounts,
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
    !hasChosenRunCondition && state.floor === 1 && normalizedCurrentRoom === 0;
  const unlockedRunConditionIds = computeUnlockedRunConditionIds({
    totalRuns: progression?.totalRuns ?? 0,
    wonRuns: progression?.wonRuns ?? 0,
    enemyKillCounts: mergedEnemyKillCounts,
  });
  const backfilledRunConditionChoices = shouldRebuildStartChoices
    ? drawRunConditionChoices(
        unlockedRunConditionIds,
        createRNG(`${state.seed}-run-conditions`)
      )
    : normalizedPendingRunConditionChoices;
  const isInfiniteRun = isInfiniteRunConditionId(state.selectedRunConditionId);
  const normalizedHp = normalizeRunHpFromMetaBonuses(
    state,
    freshMetaBonuses.extraHp ?? 0
  );
  const mergedEncounteredEnemies = mergeEncounteredEnemies(
    readEncounteredEnemiesFromResources(resources),
    state.encounteredEnemies ?? {}
  );
  const stateWithFreshBonuses: RunState = {
    ...state,
    currentRoom: normalizedCurrentRoom,
    activePlayMs: Math.max(0, state.activePlayMs ?? 0),
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
    pendingBiomeChoices: recoverPendingBiomeChoices(
      state,
      normalizedCurrentRoom,
      isInfiniteRun
    ),
    maxGoldReached: Math.max(state.maxGoldReached ?? 0, state.gold),
    startMerchantResourcePool: state.startMerchantResourcePool ?? resources,
    startMerchantSpentResources: state.startMerchantSpentResources ?? {},
    startMerchantPurchasedOfferIds: state.startMerchantPurchasedOfferIds ?? [],
    startMerchantCompleted:
      state.startMerchantCompleted ??
      !(
        state.floor === 1 &&
        normalizedCurrentRoom === 0 &&
        state.combat === null
      ),
    firstRunScript: state.firstRunScript ?? null,
    unlockedRelicIds: freshUnlockedRelicIds,
    encounteredEnemies: mergedEncounteredEnemies,
    enemyKillCounts: mergedEnemyKillCounts,
  };

  return {
    run: {
      id: run.id,
      state: stateWithFreshBonuses,
      seed: run.seed,
      createdAt: run.createdAt,
    },
    isFirstRun,
  };
}

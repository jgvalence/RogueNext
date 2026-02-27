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
import { buildEnemyDefsMap, buildAllyDefsMap } from "@/game/data";
import { RunStateSchema, type RunState } from "@/game/schemas/run-state";
import type { BiomeType } from "@/game/schemas/enums";
import { computeMetaBonuses } from "@/game/engine/meta";
import {
  computeUnlockedRunConditionIds,
  drawRunConditionChoices,
} from "@/game/engine/run-conditions";
import {
  getUnlockedDifficultyLevels,
  getUnlockedMaxDifficultyFromResources,
  unlockNextDifficultyOnVictory,
} from "@/game/engine/difficulty";
import { addResourcesInternal, incrementRunStatsInternal } from "./progression";
import {
  readUnlockProgressFromResources,
  writeUnlockProgressToResources,
} from "@/game/engine/card-unlocks";
import { playCard } from "@/game/engine/cards";
import {
  initCombat,
  startPlayerTurn,
  endPlayerTurn,
  executeAlliesEnemiesTurn,
  checkCombatEnd,
} from "@/game/engine/combat";
import {
  applyRelicsOnCombatStart,
  applyRelicsOnCardPlayed,
} from "@/game/engine/relics";
import { drawCards } from "@/game/engine/deck";
import {
  advanceFloor,
  applyDifficultyToRun,
  applyEventChoice,
  applyFreeUpgradeInDeck,
  applyHealRoom,
  applyRunConditionToRun,
  createGuaranteedRelicEvent,
  pickEvent,
  pickSpecialRoomTypeWithDifficulty,
  selectRoom,
  upgradeCardInDeck,
} from "@/game/engine/run";
import { completeCombat } from "@/game/engine/run";
import {
  generateCombatRewards,
  addCardToRunDeck,
  type CombatRewards,
} from "@/game/engine/rewards";
import { applyInkPower } from "@/game/engine/ink";
import { applyUsableItem } from "@/game/engine/items";
import {
  applyStartMerchantOffer,
  buyShopItem,
  completeStartMerchant,
  generateShopInventory,
  generateStartMerchantOffers,
} from "@/game/engine/merchant";
import { removeCardFromRunDeck } from "@/game/engine/run";
import { allyDefinitions } from "@/game/data/allies";
import { assertRateLimit } from "@/lib/security/rate-limit";

function normalizeResourceRecord(
  input: Record<string, number> | undefined
): Record<string, number> {
  if (!input) return {};
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(input)) {
    const safe = Math.max(0, Math.floor(value ?? 0));
    if (safe <= 0) continue;
    out[key] = safe;
  }
  return out;
}

function applySurvivalOnceIfNeeded(
  state: RunState,
  rng: ReturnType<typeof createRNG>
): RunState {
  if (!state.combat || state.combat.phase !== "COMBAT_LOST") return state;
  if (!state.metaBonuses?.survivalOnce || state.survivalOnceUsed) return state;

  const revivedBase = {
    ...state.combat,
    phase: "ALLIES_ENEMIES_TURN" as const,
    player: {
      ...state.combat.player,
      currentHp: 1,
      block: 0,
    },
  };
  const revivedCombat = startPlayerTurn(revivedBase, rng, state.relicIds);
  return {
    ...state,
    survivalOnceUsed: true,
    combat: revivedCombat,
  };
}

function getSelectedRoomNodeForIndex(state: RunState, roomIndex: number) {
  const roomChoices = state.map[roomIndex] ?? [];
  return roomChoices.find((room) => room.completed) ?? roomChoices[0] ?? null;
}

function computeCombatRewardsFromState(
  state: RunState,
  roomIndex: number
): {
  rewards: CombatRewards;
  isBoss: boolean;
  isElite: boolean;
} {
  const selectedRoom = getSelectedRoomNodeForIndex(state, roomIndex);
  if (!selectedRoom?.enemyIds?.length) {
    throw new Error("Cannot compute rewards for room");
  }
  const isBoss = roomIndex === GAME_CONSTANTS.BOSS_ROOM_INDEX;
  const isElite = selectedRoom.isElite ?? false;
  const enemyCount = selectedRoom.enemyIds.length;
  const defeatedBossId = isBoss ? selectedRoom.enemyIds[0] : undefined;
  const rewardRng = createRNG(`${state.seed}-rewards-${roomIndex}`);

  return {
    rewards: generateCombatRewards(
      state.floor,
      roomIndex,
      isBoss,
      isElite,
      enemyCount,
      allCardDefinitions,
      rewardRng,
      state.currentBiome,
      state.relicIds,
      state.unlockedCardIds,
      state.allyIds,
      state.metaBonuses?.allySlots ?? 0,
      state.unlockedDifficultyLevelSnapshot ?? 0,
      defeatedBossId,
      state.metaBonuses?.extraCardRewardChoices ?? 0,
      state.metaBonuses?.lootLuck ?? 0,
      state.selectedDifficultyLevel ?? 0
    ),
    isBoss,
    isElite,
  };
}

function getShopInventoryForState(state: RunState) {
  const shopRng = createRNG(`${state.seed}-shop-${state.currentRoom}`);
  return generateShopInventory(
    state.floor,
    allCardDefinitions,
    state.relicIds,
    shopRng,
    state.unlockedCardIds,
    state.unlockedDifficultyLevelSnapshot ?? 0,
    state.metaBonuses?.relicDiscount ?? 0,
    state.usableItems ?? [],
    state.usableItemCapacity ?? GAME_CONSTANTS.MAX_USABLE_ITEMS
  );
}

function getSpecialRoomEventForState(state: RunState) {
  const specialRng = createRNG(`${state.seed}-${state.currentRoom}`);
  const forceEventWithRelic = state.floor === 1 && state.currentRoom === 2;
  const roomType = forceEventWithRelic
    ? "EVENT"
    : pickSpecialRoomTypeWithDifficulty(
        specialRng,
        state.selectedDifficultyLevel ?? 0
      );
  if (roomType !== "EVENT") return null;
  return forceEventWithRelic
    ? createGuaranteedRelicEvent()
    : pickEvent(specialRng, state.selectedDifficultyLevel ?? 0);
}

function enforceRunActionRateLimit(userId: string, actionKey: string) {
  const isCombatAction =
    actionKey === "start-combat" ||
    actionKey === "play-card" ||
    actionKey === "end-turn" ||
    actionKey === "use-ink-power" ||
    actionKey === "use-usable-item";
  assertRateLimit({
    key: `run:${actionKey}:${userId}`,
    max: isCombatAction ? 120 : 60,
    windowMs: 10_000,
  });
}

async function persistRunState(
  runId: string,
  state: RunState,
  expectedUpdatedAt: Date,
  userId: string
) {
  const updated = await prisma.run.updateMany({
    where: {
      id: runId,
      userId,
      status: "IN_PROGRESS",
      updatedAt: expectedUpdatedAt,
    },
    data: {
      state: state as unknown as Prisma.InputJsonValue,
      floor: state.floor,
      room: state.currentRoom,
      gold: state.gold,
    },
  });
  if (updated.count !== 1) {
    throw new Error("Run changed concurrently; retry action");
  }
}

async function getOwnedInProgressRun(
  runId: string,
  userId: string,
  actionKey = "mutate-run"
) {
  enforceRunActionRateLimit(userId, actionKey);
  const run = await prisma.run.findUnique({ where: { id: runId } });
  if (!run || run.userId !== userId) {
    throw new Error("Run not found or access denied");
  }
  if (run.status !== "IN_PROGRESS") {
    throw new Error("Run is not active");
  }
  const parsed = RunStateSchema.safeParse(run.state);
  if (!parsed.success) {
    throw new Error("Stored run state is invalid");
  }
  return { run, state: parsed.data };
}

const createRunSchema = z.object({
  seed: z.string().optional(),
});

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
      },
    });
    const unlockedStoryIds = (progression?.unlockedStoryIds as string[]) ?? [];
    const resources = (progression?.resources as Record<string, number>) ?? {};
    const initialUnlockProgress = readUnlockProgressFromResources(resources);
    const metaBonuses = computeMetaBonuses(unlockedStoryIds);
    const unlockedDifficultyLevels = getUnlockedDifficultyLevels(resources);
    const unlockedDifficultyLevelMax =
      getUnlockedMaxDifficultyFromResources(resources);
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
      resources
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
  state: RunStateSchema,
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
    void validated;
    void run;
    // Intentionally disabled: gameplay is persisted only by server-authoritative actions.
    return success({ saved: false });
  } catch (error) {
    return handleServerActionError(error);
  }
}

const endRunSchema = z.object({
  runId: z.string(),
  status: z.enum(["VICTORY", "DEFEAT", "ABANDONED"]),
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

    const parsedRunState = RunStateSchema.safeParse(run.state);
    if (!parsedRunState.success) {
      throw new Error("Stored run state is invalid");
    }
    const runState = parsedRunState.data;
    if (validated.status === "VICTORY") {
      const completedRun =
        runState.floor >= GAME_CONSTANTS.MAX_FLOORS &&
        runState.currentRoom >= GAME_CONSTANTS.ROOMS_PER_FLOOR &&
        runState.combat === null;
      if (!completedRun) {
        throw new Error("Invalid victory state");
      }
    }
    const earnedResources = normalizeResourceRecord(runState.earnedResources);
    if (Object.keys(earnedResources).length > 0) {
      // Victory bonus: multiply all resources by 1.5
      const multiplier = validated.status === "VICTORY" ? 1.5 : 1;
      const scaledResources: Record<string, number> = {};
      for (const [key, amount] of Object.entries(earnedResources)) {
        scaledResources[key] = (amount as number) * multiplier;
      }
      await addResourcesInternal(user.id!, scaledResources);
    }

    // Persist card unlock progression counters from run state.
    const progression = await prisma.userProgression.findUnique({
      where: { userId: user.id! },
      select: { resources: true, unlockedStoryIds: true },
    });
    const currentResourcesBase =
      (progression?.resources as Record<string, number>) ?? {};
    const startMerchantSpentResources = normalizeResourceRecord(
      runState.startMerchantSpentResources
    );
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
    const selectedDifficultyLevel = runState.selectedDifficultyLevel ?? 0;
    const runDurationMs = Math.max(0, Date.now() - run.createdAt.getTime());
    const resourcesWithDifficultyUnlock =
      validated.status === "VICTORY"
        ? unlockNextDifficultyOnVictory(
            resourcesWithUnlocks,
            selectedDifficultyLevel
          )
        : resourcesWithUnlocks;
    await prisma.userProgression.upsert({
      where: { userId: user.id! },
      create: {
        userId: user.id!,
        resources:
          resourcesWithDifficultyUnlock as unknown as Prisma.InputJsonValue,
        unlockedStoryIds: (progression?.unlockedStoryIds as string[]) ?? [],
      },
      update: {
        resources:
          resourcesWithDifficultyUnlock as unknown as Prisma.InputJsonValue,
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

const getActiveRunSchema = z
  .object({
    runId: z.string().min(1).optional(),
  })
  .optional();

export async function getActiveRunAction(
  input?: z.infer<typeof getActiveRunSchema>
) {
  try {
    const validated = getActiveRunSchema.parse(input);
    const user = await requireAuth();

    const [run, progression] = await Promise.all([
      validated?.runId
        ? prisma.run.findFirst({
            where: {
              id: validated.runId,
              userId: user.id!,
              status: "IN_PROGRESS",
            },
          })
        : prisma.run.findFirst({
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
    const freshMetaBonuses = computeMetaBonuses(unlockedStoryIds);
    const state = run.state as unknown as RunState;
    const unlockedDifficultyLevels = getUnlockedDifficultyLevels(resources);
    const unlockedDifficultyLevelMax =
      getUnlockedMaxDifficultyFromResources(resources);
    const selectedDifficultyLevel =
      state.selectedDifficultyLevel ??
      (state.floor > 1 || state.currentRoom > 0 || state.combat ? 0 : null);
    const pendingDifficultyLevels =
      selectedDifficultyLevel === null
        ? unlockedDifficultyLevels
        : (state.pendingDifficultyLevels ?? []);
    const hasChosenRunCondition = Boolean(state.selectedRunConditionId);
    const needsStartChoicesBackfill =
      !hasChosenRunCondition &&
      state.floor === 1 &&
      state.currentRoom === 0 &&
      (state.pendingRunConditionChoices?.length ?? 0) === 0;
    const unlockedRunConditionIds = computeUnlockedRunConditionIds({
      totalRuns: progression?.totalRuns ?? 0,
      wonRuns: progression?.wonRuns ?? 0,
    });
    const backfilledRunConditionChoices = needsStartChoicesBackfill
      ? drawRunConditionChoices(
          unlockedRunConditionIds,
          createRNG(`${state.seed}-run-conditions`)
        )
      : (state.pendingRunConditionChoices ?? []);

    const stateWithFreshBonuses: RunState = {
      ...state,
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
          state.currentRoom === 0 &&
          state.combat === null
        ),
      shopSoldItemIds: state.shopSoldItemIds ?? [],
      pendingRewardRoomIndex: state.pendingRewardRoomIndex ?? null,
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

const startCombatSchema = z.object({
  runId: z.string(),
  choiceIndex: z
    .number()
    .int()
    .min(0)
    .max(GAME_CONSTANTS.ROOM_CHOICES - 1),
});

export async function startCombatAction(
  input: z.infer<typeof startCombatSchema>
) {
  try {
    const validated = startCombatSchema.parse(input);
    const user = await requireAuth();
    const { run, state: baseState } = await getOwnedInProgressRun(
      validated.runId,
      user.id!,
      "start-combat"
    );
    const rng = createRNG(`${baseState.seed}-${baseState.currentRoom}`);
    const enemyDefs = buildEnemyDefsMap();
    const allyDefs = buildAllyDefsMap();
    const cardDefs = buildCardDefsMap();

    const selectedState = selectRoom(baseState, validated.choiceIndex);
    const room =
      selectedState.map[selectedState.currentRoom]?.[validated.choiceIndex];
    if (
      !room ||
      (room.type !== "COMBAT" && room.type !== "PRE_BOSS") ||
      !room.enemyIds?.length
    ) {
      throw new Error("Selected room is not a fight room");
    }
    let combat = initCombat(
      selectedState,
      room.enemyIds,
      enemyDefs,
      allyDefs,
      cardDefs,
      rng
    );
    combat = applyRelicsOnCombatStart(combat, selectedState.relicIds);
    if (combat.hand.length < combat.player.drawCount) {
      combat = drawCards(
        combat,
        combat.player.drawCount - combat.hand.length,
        rng
      );
    }
    const nextState = applySurvivalOnceIfNeeded(
      { ...selectedState, combat },
      rng
    );

    await persistRunState(validated.runId, nextState, run.updatedAt, user.id!);
    return success({ state: nextState });
  } catch (error) {
    return handleServerActionError(error);
  }
}

const playCardSchema = z.object({
  runId: z.string(),
  instanceId: z.string(),
  targetId: z.string().nullable(),
  useInked: z.boolean(),
});

export async function playCardAction(input: z.infer<typeof playCardSchema>) {
  try {
    const validated = playCardSchema.parse(input);
    const user = await requireAuth();
    const { run, state: baseState } = await getOwnedInProgressRun(
      validated.runId,
      user.id!,
      "play-card"
    );
    if (!baseState.combat || baseState.combat.phase !== "PLAYER_TURN") {
      throw new Error("No active player turn");
    }

    const rng = createRNG(`${baseState.seed}-${baseState.currentRoom}`);
    const cardDefs = buildCardDefsMap();

    const playedInstance = baseState.combat.hand.find(
      (c) => c.instanceId === validated.instanceId
    );
    const playedCardDef = playedInstance
      ? cardDefs.get(playedInstance.definitionId)
      : undefined;
    let combat = playCard(
      baseState.combat,
      validated.instanceId,
      validated.targetId,
      validated.useInked,
      cardDefs,
      rng,
      {
        attackBonus: baseState.metaBonuses?.attackBonus ?? 0,
        exhaustKeepChance: baseState.metaBonuses?.exhaustKeepChance ?? 0,
      }
    );
    if (playedCardDef && baseState.relicIds.length > 0) {
      combat = applyRelicsOnCardPlayed(
        combat,
        baseState.relicIds,
        playedCardDef.type
      );
    }
    combat = checkCombatEnd(combat);
    const nextState = applySurvivalOnceIfNeeded({ ...baseState, combat }, rng);

    await persistRunState(validated.runId, nextState, run.updatedAt, user.id!);
    return success({ state: nextState });
  } catch (error) {
    return handleServerActionError(error);
  }
}

const endTurnCombatSchema = z.object({
  runId: z.string(),
});

export async function endTurnCombatAction(
  input: z.infer<typeof endTurnCombatSchema>
) {
  try {
    const validated = endTurnCombatSchema.parse(input);
    const user = await requireAuth();
    const { run, state: baseState } = await getOwnedInProgressRun(
      validated.runId,
      user.id!,
      "end-turn"
    );
    if (!baseState.combat || baseState.combat.phase !== "PLAYER_TURN") {
      throw new Error("No active player turn");
    }

    const rng = createRNG(`${baseState.seed}-${baseState.currentRoom}`);
    const enemyDefs = buildEnemyDefsMap();
    const allyDefs = buildAllyDefsMap();

    let combat = endPlayerTurn(baseState.combat, baseState.relicIds);
    combat = executeAlliesEnemiesTurn(combat, enemyDefs, allyDefs, rng);
    if (combat.phase !== "COMBAT_WON" && combat.phase !== "COMBAT_LOST") {
      combat = startPlayerTurn(combat, rng, baseState.relicIds);
    }
    const nextState = applySurvivalOnceIfNeeded({ ...baseState, combat }, rng);

    await persistRunState(validated.runId, nextState, run.updatedAt, user.id!);
    return success({ state: nextState });
  } catch (error) {
    return handleServerActionError(error);
  }
}

const useInkPowerSchema = z.object({
  runId: z.string(),
  power: z.enum(["REWRITE", "LOST_CHAPTER", "SEAL"]),
  targetId: z.string().nullable(),
});

export async function useInkPowerAction(
  input: z.infer<typeof useInkPowerSchema>
) {
  try {
    const validated = useInkPowerSchema.parse(input);
    const user = await requireAuth();
    const { run, state: baseState } = await getOwnedInProgressRun(
      validated.runId,
      user.id!,
      "use-ink-power"
    );
    if (!baseState.combat || baseState.combat.phase !== "PLAYER_TURN") {
      throw new Error("No active player turn");
    }

    const rng = createRNG(`${baseState.seed}-${baseState.currentRoom}`);
    const cardDefs = buildCardDefsMap();
    const combat = applyInkPower(
      baseState.combat,
      validated.power,
      validated.targetId,
      cardDefs,
      rng
    );
    const nextState = applySurvivalOnceIfNeeded({ ...baseState, combat }, rng);
    await persistRunState(validated.runId, nextState, run.updatedAt, user.id!);
    return success({ state: nextState });
  } catch (error) {
    return handleServerActionError(error);
  }
}

const useUsableItemSchema = z.object({
  runId: z.string(),
  itemInstanceId: z.string(),
  targetId: z.string().nullable(),
});

export async function useUsableItemAction(
  input: z.infer<typeof useUsableItemSchema>
) {
  try {
    const validated = useUsableItemSchema.parse(input);
    const user = await requireAuth();
    const { run, state: baseState } = await getOwnedInProgressRun(
      validated.runId,
      user.id!,
      "use-usable-item"
    );
    if (!baseState.combat || baseState.combat.phase !== "PLAYER_TURN") {
      throw new Error("No active player turn");
    }

    const rng = createRNG(`${baseState.seed}-${baseState.currentRoom}`);
    const nextState = applySurvivalOnceIfNeeded(
      applyUsableItem(
        baseState,
        validated.itemInstanceId,
        validated.targetId,
        rng
      ),
      rng
    );
    await persistRunState(validated.runId, nextState, run.updatedAt, user.id!);
    return success({ state: nextState });
  } catch (error) {
    return handleServerActionError(error);
  }
}

const buyStartMerchantOfferSchema = z.object({
  runId: z.string(),
  offerId: z.string(),
});

export async function buyStartMerchantOfferAction(
  input: z.infer<typeof buyStartMerchantOfferSchema>
) {
  try {
    const validated = buyStartMerchantOfferSchema.parse(input);
    const user = await requireAuth();
    const { run, state: baseState } = await getOwnedInProgressRun(
      validated.runId,
      user.id!
    );
    if (
      baseState.startMerchantCompleted ||
      baseState.floor !== 1 ||
      baseState.currentRoom !== 0 ||
      baseState.combat !== null
    ) {
      throw new Error("Start merchant is not available");
    }

    const offerRng = createRNG(`${baseState.seed}-start-merchant`);
    const availableOffers = generateStartMerchantOffers(
      baseState,
      allCardDefinitions,
      allyDefinitions,
      offerRng
    );
    const offer = availableOffers.find(
      (entry) => entry.id === validated.offerId
    );
    if (!offer) {
      throw new Error("Invalid start merchant offer");
    }

    const nextState = applyStartMerchantOffer(baseState, offer);
    await persistRunState(validated.runId, nextState, run.updatedAt, user.id!);
    return success({ state: nextState });
  } catch (error) {
    return handleServerActionError(error);
  }
}

const completeStartMerchantSchema = z.object({
  runId: z.string(),
});

export async function completeStartMerchantAction(
  input: z.infer<typeof completeStartMerchantSchema>
) {
  try {
    const validated = completeStartMerchantSchema.parse(input);
    const user = await requireAuth();
    const { run, state: baseState } = await getOwnedInProgressRun(
      validated.runId,
      user.id!
    );
    if (baseState.startMerchantCompleted) {
      return success({ state: baseState });
    }
    const nextState = completeStartMerchant(baseState);
    await persistRunState(validated.runId, nextState, run.updatedAt, user.id!);
    return success({ state: nextState });
  } catch (error) {
    return handleServerActionError(error);
  }
}

const buyShopItemSchema = z.object({
  runId: z.string(),
  itemId: z.string(),
  purgeCardInstanceId: z.string().optional(),
});

export async function buyShopItemAction(
  input: z.infer<typeof buyShopItemSchema>
) {
  try {
    const validated = buyShopItemSchema.parse(input);
    const user = await requireAuth();
    const { run, state: baseState } = await getOwnedInProgressRun(
      validated.runId,
      user.id!
    );

    const selectedRoom = getSelectedRoomNodeForIndex(
      baseState,
      baseState.currentRoom
    );
    if (!selectedRoom || selectedRoom.type !== "MERCHANT") {
      throw new Error("Not in merchant room");
    }

    const soldIds = new Set(baseState.shopSoldItemIds ?? []);
    if (soldIds.has(validated.itemId)) {
      throw new Error("Item already sold");
    }

    const inventory = getShopInventoryForState(baseState);
    const item = inventory.find((entry) => entry.id === validated.itemId);
    if (!item) {
      throw new Error("Invalid shop item");
    }

    let nextState = buyShopItem(baseState, item);
    if (!nextState) {
      throw new Error("Cannot buy shop item");
    }
    if (item.type === "purge") {
      if (!validated.purgeCardInstanceId) {
        throw new Error("Purge requires selecting a card");
      }
      const hasCard = nextState.deck.some(
        (card) => card.instanceId === validated.purgeCardInstanceId
      );
      if (!hasCard) {
        throw new Error("Invalid purge card selection");
      }
      nextState = removeCardFromRunDeck(
        nextState,
        validated.purgeCardInstanceId
      );
    }
    nextState = {
      ...nextState,
      shopSoldItemIds: [...(nextState.shopSoldItemIds ?? []), validated.itemId],
    };

    await persistRunState(validated.runId, nextState, run.updatedAt, user.id!);
    return success({ state: nextState });
  } catch (error) {
    return handleServerActionError(error);
  }
}

const leaveMerchantSchema = z.object({
  runId: z.string(),
});

export async function leaveMerchantAction(
  input: z.infer<typeof leaveMerchantSchema>
) {
  try {
    const validated = leaveMerchantSchema.parse(input);
    const user = await requireAuth();
    const { run, state: baseState } = await getOwnedInProgressRun(
      validated.runId,
      user.id!
    );
    const selectedRoom = getSelectedRoomNodeForIndex(
      baseState,
      baseState.currentRoom
    );
    if (!selectedRoom || selectedRoom.type !== "MERCHANT") {
      throw new Error("Not in merchant room");
    }
    const nextState: RunState = {
      ...baseState,
      currentRoom: baseState.currentRoom + 1,
      shopSoldItemIds: [],
    };
    await persistRunState(validated.runId, nextState, run.updatedAt, user.id!);
    return success({ state: nextState });
  } catch (error) {
    return handleServerActionError(error);
  }
}

const applyDifficultySchema = z.object({
  runId: z.string(),
  difficultyLevel: z.number().int().min(0),
});

export async function applyDifficultyAction(
  input: z.infer<typeof applyDifficultySchema>
) {
  try {
    const validated = applyDifficultySchema.parse(input);
    const user = await requireAuth();
    const { run, state: baseState } = await getOwnedInProgressRun(
      validated.runId,
      user.id!
    );
    const nextState = applyDifficultyToRun(
      baseState,
      validated.difficultyLevel
    );
    await persistRunState(validated.runId, nextState, run.updatedAt, user.id!);
    return success({ state: nextState });
  } catch (error) {
    return handleServerActionError(error);
  }
}

const applyRunConditionSchema = z.object({
  runId: z.string(),
  conditionId: z.string(),
});

export async function applyRunConditionAction(
  input: z.infer<typeof applyRunConditionSchema>
) {
  try {
    const validated = applyRunConditionSchema.parse(input);
    const user = await requireAuth();
    const { run, state: baseState } = await getOwnedInProgressRun(
      validated.runId,
      user.id!
    );
    const conditionRng = createRNG(`${baseState.seed}-run-conditions-apply`);
    const nextState = applyRunConditionToRun(
      baseState,
      validated.conditionId,
      conditionRng,
      allCardDefinitions
    );
    await persistRunState(validated.runId, nextState, run.updatedAt, user.id!);
    return success({ state: nextState });
  } catch (error) {
    return handleServerActionError(error);
  }
}

const applyFreeUpgradeSchema = z.object({
  runId: z.string(),
  cardInstanceId: z.string(),
});

export async function applyFreeUpgradeAction(
  input: z.infer<typeof applyFreeUpgradeSchema>
) {
  try {
    const validated = applyFreeUpgradeSchema.parse(input);
    const user = await requireAuth();
    const { run, state: baseState } = await getOwnedInProgressRun(
      validated.runId,
      user.id!
    );
    const nextState = applyFreeUpgradeInDeck(
      baseState,
      validated.cardInstanceId
    );
    await persistRunState(validated.runId, nextState, run.updatedAt, user.id!);
    return success({ state: nextState });
  } catch (error) {
    return handleServerActionError(error);
  }
}

const chooseBiomeSchema = z.object({
  runId: z.string(),
  biome: z.custom<BiomeType>(),
});

export async function chooseBiomeAction(
  input: z.infer<typeof chooseBiomeSchema>
) {
  try {
    const validated = chooseBiomeSchema.parse(input);
    const user = await requireAuth();
    const { run, state: baseState } = await getOwnedInProgressRun(
      validated.runId,
      user.id!
    );
    const floorRng = createRNG(`${baseState.seed}-${baseState.floor + 1}`);
    const nextState = advanceFloor(
      baseState,
      validated.biome,
      floorRng,
      allCardDefinitions
    );
    await persistRunState(validated.runId, nextState, run.updatedAt, user.id!);
    return success({ state: nextState });
  } catch (error) {
    return handleServerActionError(error);
  }
}

const enterNonCombatRoomSchema = z.object({
  runId: z.string(),
  choiceIndex: z
    .number()
    .int()
    .min(0)
    .max(GAME_CONSTANTS.ROOM_CHOICES - 1),
});

export async function enterNonCombatRoomAction(
  input: z.infer<typeof enterNonCombatRoomSchema>
) {
  try {
    const validated = enterNonCombatRoomSchema.parse(input);
    const user = await requireAuth();
    const { run, state: baseState } = await getOwnedInProgressRun(
      validated.runId,
      user.id!
    );
    const room = baseState.map[baseState.currentRoom]?.[validated.choiceIndex];
    if (!room) throw new Error("Invalid room choice");
    if (room.type === "COMBAT") {
      throw new Error("Use combat action for combat rooms");
    }
    const nextState = selectRoom(baseState, validated.choiceIndex);
    await persistRunState(validated.runId, nextState, run.updatedAt, user.id!);
    return success({ state: nextState, roomType: room.type });
  } catch (error) {
    return handleServerActionError(error);
  }
}

const applySpecialHealSchema = z.object({
  runId: z.string(),
});

export async function applySpecialHealAction(
  input: z.infer<typeof applySpecialHealSchema>
) {
  try {
    const validated = applySpecialHealSchema.parse(input);
    const user = await requireAuth();
    const { run, state: baseState } = await getOwnedInProgressRun(
      validated.runId,
      user.id!
    );
    const selectedRoom = getSelectedRoomNodeForIndex(
      baseState,
      baseState.currentRoom
    );
    if (!selectedRoom || selectedRoom.type !== "SPECIAL") {
      throw new Error("Not in special room");
    }
    const nextState = applyHealRoom(baseState);
    await persistRunState(validated.runId, nextState, run.updatedAt, user.id!);
    return success({ state: nextState });
  } catch (error) {
    return handleServerActionError(error);
  }
}

const applySpecialUpgradeSchema = z.object({
  runId: z.string(),
  cardInstanceId: z.string(),
});

export async function applySpecialUpgradeAction(
  input: z.infer<typeof applySpecialUpgradeSchema>
) {
  try {
    const validated = applySpecialUpgradeSchema.parse(input);
    const user = await requireAuth();
    const { run, state: baseState } = await getOwnedInProgressRun(
      validated.runId,
      user.id!
    );
    const selectedRoom = getSelectedRoomNodeForIndex(
      baseState,
      baseState.currentRoom
    );
    if (!selectedRoom || selectedRoom.type !== "SPECIAL") {
      throw new Error("Not in special room");
    }
    const nextState = upgradeCardInDeck(baseState, validated.cardInstanceId);
    await persistRunState(validated.runId, nextState, run.updatedAt, user.id!);
    return success({ state: nextState });
  } catch (error) {
    return handleServerActionError(error);
  }
}

const applySpecialEventChoiceSchema = z.object({
  runId: z.string(),
  choiceIndex: z.number().int().min(0),
  purgeCardInstanceId: z.string().optional(),
});

export async function applySpecialEventChoiceAction(
  input: z.infer<typeof applySpecialEventChoiceSchema>
) {
  try {
    const validated = applySpecialEventChoiceSchema.parse(input);
    const user = await requireAuth();
    const { run, state: baseState } = await getOwnedInProgressRun(
      validated.runId,
      user.id!
    );
    const selectedRoom = getSelectedRoomNodeForIndex(
      baseState,
      baseState.currentRoom
    );
    if (!selectedRoom || selectedRoom.type !== "SPECIAL") {
      throw new Error("Not in special room");
    }
    const event = getSpecialRoomEventForState(baseState);
    if (!event) {
      throw new Error("Special room is not an event room");
    }
    const choice = event.choices[validated.choiceIndex];
    if (!choice) {
      throw new Error("Invalid event choice");
    }

    let nextState = applyEventChoice(baseState, event, validated.choiceIndex);
    if (choice.requiresPurge) {
      if (!validated.purgeCardInstanceId) {
        throw new Error("This event choice requires selecting a purge card");
      }
      const hasCard = nextState.deck.some(
        (card) => card.instanceId === validated.purgeCardInstanceId
      );
      if (!hasCard) {
        throw new Error("Invalid purge card selection");
      }
      nextState = removeCardFromRunDeck(
        nextState,
        validated.purgeCardInstanceId
      );
      nextState = { ...nextState, currentRoom: nextState.currentRoom + 1 };
    }
    await persistRunState(validated.runId, nextState, run.updatedAt, user.id!);
    return success({ state: nextState });
  } catch (error) {
    return handleServerActionError(error);
  }
}

const skipSpecialRoomSchema = z.object({
  runId: z.string(),
});

export async function skipSpecialRoomAction(
  input: z.infer<typeof skipSpecialRoomSchema>
) {
  try {
    const validated = skipSpecialRoomSchema.parse(input);
    const user = await requireAuth();
    const { run, state: baseState } = await getOwnedInProgressRun(
      validated.runId,
      user.id!
    );
    const selectedRoom = getSelectedRoomNodeForIndex(
      baseState,
      baseState.currentRoom
    );
    if (!selectedRoom || selectedRoom.type !== "SPECIAL") {
      throw new Error("Not in special room");
    }
    const nextState: RunState = {
      ...baseState,
      currentRoom: baseState.currentRoom + 1,
    };
    await persistRunState(validated.runId, nextState, run.updatedAt, user.id!);
    return success({ state: nextState });
  } catch (error) {
    return handleServerActionError(error);
  }
}

const resolveCombatVictorySchema = z.object({
  runId: z.string(),
});

export async function resolveCombatVictoryAction(
  input: z.infer<typeof resolveCombatVictorySchema>
) {
  try {
    const validated = resolveCombatVictorySchema.parse(input);
    const user = await requireAuth();
    const { run, state: baseState } = await getOwnedInProgressRun(
      validated.runId,
      user.id!
    );
    if (!baseState.combat || baseState.combat.phase !== "COMBAT_WON") {
      throw new Error("Combat is not in won phase");
    }
    if (baseState.pendingRewardRoomIndex != null) {
      const pending = computeCombatRewardsFromState(
        baseState,
        baseState.pendingRewardRoomIndex
      );
      return success({
        state: baseState,
        rewards: pending.rewards,
        isBoss: pending.isBoss,
        isElite: pending.isElite,
      });
    }

    const roomIndex = baseState.currentRoom;
    const rewardBundle = computeCombatRewardsFromState(baseState, roomIndex);
    const rng = createRNG(`${baseState.seed}-${roomIndex}`);
    const nextState = completeCombat(
      baseState,
      baseState.combat,
      rewardBundle.rewards.gold,
      rng,
      rewardBundle.rewards.biomeResources,
      allCardDefinitions,
      baseState.relicIds,
      rewardBundle.rewards.usableItemDropDefinitionId
    );
    const withPendingReward: RunState = {
      ...nextState,
      pendingRewardRoomIndex: roomIndex,
    };

    await persistRunState(
      validated.runId,
      withPendingReward,
      run.updatedAt,
      user.id!
    );
    return success({
      state: withPendingReward,
      rewards: rewardBundle.rewards,
      isBoss: rewardBundle.isBoss,
      isElite: rewardBundle.isElite,
    });
  } catch (error) {
    return handleServerActionError(error);
  }
}

const claimCombatRewardSchema = z.object({
  runId: z.string(),
  choice: z.discriminatedUnion("type", [
    z.object({ type: z.literal("CARD"), definitionId: z.string() }),
    z.object({ type: z.literal("RELIC"), relicId: z.string() }),
    z.object({ type: z.literal("ALLY"), allyId: z.string() }),
    z.object({ type: z.literal("MAX_HP"), amount: z.number().int().min(1) }),
    z.object({ type: z.literal("SKIP") }),
  ]),
});

export async function claimCombatRewardAction(
  input: z.infer<typeof claimCombatRewardSchema>
) {
  try {
    const validated = claimCombatRewardSchema.parse(input);
    const user = await requireAuth();
    const { run, state: baseState } = await getOwnedInProgressRun(
      validated.runId,
      user.id!
    );
    const roomIndex = baseState.pendingRewardRoomIndex;
    if (roomIndex == null) {
      throw new Error("No pending reward to claim");
    }

    const { rewards } = computeCombatRewardsFromState(baseState, roomIndex);
    let nextState: RunState = baseState;

    const choice = validated.choice;
    switch (choice.type) {
      case "CARD": {
        const allowed = rewards.cardChoices.some(
          (card) => card.id === choice.definitionId
        );
        if (!allowed) throw new Error("Invalid card reward choice");
        nextState = addCardToRunDeck(nextState, choice.definitionId);
        break;
      }
      case "RELIC": {
        const allowed = rewards.relicChoices.some(
          (relic) => relic.id === choice.relicId
        );
        if (!allowed) throw new Error("Invalid relic reward choice");
        if (!nextState.relicIds.includes(choice.relicId)) {
          nextState = {
            ...nextState,
            relicIds: [...nextState.relicIds, choice.relicId],
          };
        }
        break;
      }
      case "ALLY": {
        const allowed = rewards.allyChoices.some(
          (ally) => ally.id === choice.allyId
        );
        if (!allowed) throw new Error("Invalid ally reward choice");
        const maxAllies = Math.min(
          GAME_CONSTANTS.MAX_ALLIES,
          Math.max(0, nextState.metaBonuses?.allySlots ?? 0)
        );
        if (!nextState.allyIds.includes(choice.allyId)) {
          if (nextState.allyIds.length >= maxAllies) {
            throw new Error("No ally slot available");
          }
          nextState = {
            ...nextState,
            allyIds: [...nextState.allyIds, choice.allyId],
          };
        }
        break;
      }
      case "MAX_HP": {
        if (rewards.bossMaxHpBonus == null) {
          throw new Error("No max HP reward available");
        }
        if (choice.amount !== rewards.bossMaxHpBonus) {
          throw new Error("Invalid max HP reward amount");
        }
        nextState = {
          ...nextState,
          playerMaxHp: nextState.playerMaxHp + choice.amount,
          playerCurrentHp: nextState.playerCurrentHp + choice.amount,
        };
        break;
      }
      case "SKIP":
        break;
    }

    nextState = { ...nextState, pendingRewardRoomIndex: null };
    await persistRunState(validated.runId, nextState, run.updatedAt, user.id!);
    return success({ state: nextState });
  } catch (error) {
    return handleServerActionError(error);
  }
}

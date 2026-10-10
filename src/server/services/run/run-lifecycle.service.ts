import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { RunState } from "@/game/schemas/run-state";
import {
  createActiveRunForUser,
  getOwnedRunForUser,
  saveRunStateForUser,
  markRunEndedForUser,
} from "./run-persistence.service";
import { syncRunEndProgression } from "./run-progression-sync.service";
import {
  buildInitialRunStateForUser,
  getActiveRunSnapshotForUser,
} from "./run-state.service";
import { deriveRunBuildArchetype } from "@/game/engine/run-analytics";
import { buildCardDefsMap, buildEnemyDefsMap } from "@/game/data";
import { DEFAULT_RUN_ANALYTICS } from "@/game/schemas/analytics";

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
  finalState?: RunState;
  runDurationMs?: number;
  earnedResources?: Record<string, number>;
  startMerchantSpentResources?: Record<string, number>;
  scriptedOutcome?: "FIRST_RUN_ENERGY_TUTORIAL";
  encounteredEnemies?: RunState["encounteredEnemies"];
  enemyKillCounts?: RunState["enemyKillCounts"];
  defeatEnemyId?: string;
  bossesDefeated?: string[];
  deckSnapshot?: DeckSnapshotInput;
}

export async function createRunForUser(
  userId: string,
  requestedSeed?: string
): Promise<{ runId: string; state: RunState }> {
  return prisma.$transaction(
    async (tx) => {
      const previousRuns = await tx.run.findMany({
        where: { userId, status: "IN_PROGRESS" },
        select: { id: true },
      });
      for (const previous of previousRuns) {
        await endRunInTransaction(
          { userId, runId: previous.id, status: "ABANDONED" },
          tx
        );
      }
      const { seed, state } = await buildInitialRunStateForUser(
        userId,
        requestedSeed,
        tx
      );
      const created = await createActiveRunForUser(userId, seed, state, tx);
      return { runId: created.runId, state: created.state };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      timeout: 15000,
    }
  );
}

export async function endRunForUser(
  input: EndRunForUserInput
): Promise<boolean> {
  return prisma.$transaction((tx) => endRunInTransaction(input, tx), {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    timeout: 15000,
  });
}

async function endRunInTransaction(
  input: EndRunForUserInput,
  tx: Prisma.TransactionClient
): Promise<boolean> {
  const existing = await getOwnedRunForUser(input.userId, input.runId, tx);
  if (existing.status !== "IN_PROGRESS")
    return existing.status === input.status;
  if (input.finalState) {
    const saved = await saveRunStateForUser(
      { userId: input.userId, runId: input.runId, state: input.finalState },
      tx
    );
    if (!saved) throw new Error("SAVE_CONFLICT");
  }
  const { run, ended } = await markRunEndedForUser(
    {
      userId: input.userId,
      runId: input.runId,
      status: input.status,
    },
    tx
  );

  if (!ended) {
    return false;
  }

  const final = run.state as unknown as RunState;
  if (input.status === "VICTORY" && final.status !== "VICTORY")
    throw new Error("Victory has not been reached");
  if (
    input.status === "DEFEAT" &&
    final.combat?.phase !== "COMBAT_LOST" &&
    final.status !== "DEFEAT"
  )
    throw new Error("Defeat has not been reached");
  // End rewards always use the confirmed snapshot, never a second client total.
  await syncRunEndProgression(
    {
      userId: input.userId,
      run,
      status: input.status,
      runDurationMs: final.activePlayMs,
      scriptedOutcome:
        final.firstRunScript?.step === "FORCED_ELITE"
          ? input.scriptedOutcome
          : undefined,
    },
    tx
  );
  input = {
    ...input,
    deckSnapshot: {
      characterId: final.characterId,
      floor: final.floor,
      difficultyLevel: final.selectedDifficultyLevel ?? 0,
      biome: final.currentBiome,
      deck: final.deck,
      relicIds: final.relicIds,
      hp: Math.max(0, final.combat?.player.currentHp ?? final.playerCurrentHp),
      maxHp: final.playerMaxHp,
      gold: final.gold,
    },
  };

  if (input.status !== "ABANDONED" && input.deckSnapshot) {
    const snap = input.deckSnapshot;
    const progression = await tx.userProgression.findUnique({
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

    await tx.pvpDeckSnapshot.create({
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

  // Write analytics summary (never deleted)
  const runState = run.state as unknown as RunState;
  const cardDefs = buildCardDefsMap();
  const buildArchetype = deriveRunBuildArchetype(runState.deck ?? [], cardDefs);
  const progression = await tx.userProgression.findUnique({
    where: { userId: input.userId },
    select: { unlockedStoryIds: true },
  });
  const unlockedStoryCount =
    (progression?.unlockedStoryIds as string[] | null)?.length ?? 0;
  const runDurationMs = Math.max(
    0,
    Math.floor(runState.activePlayMs ?? Date.now() - run.createdAt.getTime())
  );
  const runAnalytics = {
    ...DEFAULT_RUN_ANALYTICS,
    ...structuredClone(runState.analytics ?? {}),
    rulesVersion: runState.analytics?.rulesVersion ?? "legacy",
    unusedItemsAtEnd: runState.usableItems?.length ?? 0,
  };
  // A won combat is folded into the run by COMPLETE_COMBAT. A defeat ends the
  // run directly, so its final combat still lives in runState.combat here.
  if (input.status === "DEFEAT" && runState.combat) {
    const combat = runState.combat;
    runAnalytics.alliesLost += combat.allies.filter(
      (ally) => ally.currentHp <= 0
    ).length;
    const damageTaken = Math.max(
      0,
      (combat.analyticsStartHp ?? runState.playerCurrentHp) -
        Math.max(0, combat.player.currentHp)
    );
    runAnalytics.totalTurns += Math.max(0, combat.turnNumber);
    runAnalytics.damageTaken += damageTaken;
    runAnalytics.inkGenerated += combat.analyticsInkGenerated ?? 0;
    runAnalytics.inkSpent += combat.analyticsInkSpent ?? 0;
    runAnalytics.inkedCardsPlayed += combat.analyticsInkedCardsPlayed ?? 0;
    for (const [cardId, count] of Object.entries(
      combat.analyticsCardPlays ?? {}
    )) {
      runAnalytics.cardPlays[cardId] =
        (runAnalytics.cardPlays[cardId] ?? 0) + count;
    }
    for (const [mode, count] of Object.entries(
      combat.analyticsCardModePlays ?? {}
    )) {
      runAnalytics.cardModePlays[mode] =
        (runAnalytics.cardModePlays[mode] ?? 0) + count;
    }
    for (const [power, count] of Object.entries(
      combat.analyticsInkPowerUses ?? {}
    )) {
      runAnalytics.inkPowerUses[power] =
        (runAnalytics.inkPowerUses[power] ?? 0) + count;
    }
    const completedRoom = runState.map[runState.currentRoom]?.find(
      (room) => room.completed
    );
    runAnalytics.combats.push({
      biome: combat.encounterContext?.biome ?? runState.currentBiome,
      floor: runState.floor,
      room: runState.currentRoom,
      encounterType:
        runState.currentRoom === runState.map.length - 1
          ? "BOSS"
          : completedRoom?.isElite
            ? "ELITE"
            : "NORMAL",
      enemyIds: combat.enemies.map((enemy) => enemy.definitionId),
      won: false,
      turns: Math.max(0, combat.turnNumber),
      hpBefore: combat.analyticsStartHp ?? runState.playerCurrentHp,
      hpAfter: Math.max(0, combat.player.currentHp),
      damageTaken,
      inkGenerated: combat.analyticsInkGenerated ?? 0,
      inkSpent: combat.analyticsInkSpent ?? 0,
      inkedCardsPlayed: combat.analyticsInkedCardsPlayed ?? 0,
      inkPowerUses: combat.analyticsInkPowerUses ?? {},
      cardModePlays: combat.analyticsCardModePlays ?? {},
    });
  }

  await tx.runSummary.create({
    data: {
      userId: input.userId,
      status: input.status,
      characterId: runState.characterId ?? "scribe",
      difficultyLevel: runState.selectedDifficultyLevel ?? 0,
      biome: runState.currentBiome ?? "LIBRARY",
      floorReached: runState.floor ?? 1,
      roomReached: runState.currentRoom ?? 0,
      buildArchetype,
      defeatEnemyId: null, // No reliable fatal source in legacy combat snapshots.
      bossesDefeated: [
        ...new Set(
          runAnalytics.combats
            .filter((combat) => combat.won)
            .flatMap((combat) => combat.enemyIds)
            .filter((id) => buildEnemyDefsMap().get(id)?.isBoss)
        ),
      ],
      relicIds: runState.relicIds ?? [],
      deckSize: (runState.deck ?? []).length,
      unlockedStoryCount,
      durationMs: runDurationMs,
      runConditionId: runState.selectedRunConditionId,
      metaBonuses: (runState.metaBonuses ?? {}) as Prisma.InputJsonValue,
      analytics: runAnalytics as Prisma.InputJsonValue,
      finalDeck: (runState.deck ?? []) as Prisma.InputJsonValue,
    },
  });

  return true;
}

export { getActiveRunSnapshotForUser };

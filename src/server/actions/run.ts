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
import { starterDeckComposition } from "@/game/data/starter-deck";
import { allCardDefinitions, buildCardDefsMap } from "@/game/data";
import type { RunState } from "@/game/schemas/run-state";
import { computeMetaBonuses } from "@/game/engine/meta";
import { addResourcesInternal, incrementRunStatsInternal } from "./progression";
import {
  readUnlockProgressFromResources,
  writeUnlockProgressToResources,
} from "@/game/engine/card-unlocks";

const createRunSchema = z.object({
  seed: z.string().optional(),
});

export async function createRunAction(input: z.infer<typeof createRunSchema>) {
  try {
    const validated = createRunSchema.parse(input);
    const user = await requireAuth();

    const seed = validated.seed ?? nanoid();
    const rng = createRNG(seed);

    // Load meta-progression bonuses for this user
    const progression = await prisma.userProgression.findUnique({
      where: { userId: user.id! },
      select: { resources: true, unlockedStoryIds: true },
    });
    const unlockedStoryIds = (progression?.unlockedStoryIds as string[]) ?? [];
    const resources = (progression?.resources as Record<string, number>) ?? {};
    const initialUnlockProgress = readUnlockProgressFromResources(resources);
    const metaBonuses = computeMetaBonuses(unlockedStoryIds);

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
      allCardDefinitions
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
    const earnedResources =
      validated.earnedResources ?? runState.earnedResources ?? {};
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
    const currentResources =
      (progression?.resources as Record<string, number>) ?? {};
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
    await prisma.userProgression.upsert({
      where: { userId: user.id! },
      create: {
        userId: user.id!,
        resources: resourcesWithUnlocks as unknown as Prisma.InputJsonValue,
        unlockedStoryIds: (progression?.unlockedStoryIds as string[]) ?? [],
      },
      update: {
        resources: resourcesWithUnlocks as unknown as Prisma.InputJsonValue,
      },
    });

    await incrementRunStatsInternal(user.id!, validated.status, 1);

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
        select: { unlockedStoryIds: true },
      }),
    ]);

    if (!run) {
      return success({ run: null, userRole: user.role });
    }

    // Recompute meta bonuses from current progression so that stories
    // unlocked after the run was created are still applied.
    const unlockedStoryIds = (progression?.unlockedStoryIds as string[]) ?? [];
    const freshMetaBonuses = computeMetaBonuses(unlockedStoryIds);
    const state = run.state as unknown as RunState;
    const stateWithFreshBonuses: RunState = {
      ...state,
      metaBonuses: freshMetaBonuses,
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

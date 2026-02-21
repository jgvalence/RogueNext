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
import { addResourcesInternal } from "./progression";
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

    const run = await prisma.run.create({
      data: {
        userId: user.id!,
        seed,
        state: runState as unknown as Prisma.InputJsonValue,
        status: "IN_PROGRESS",
      },
    });

    // Update runId in state to match DB id
    const stateWithDbId: RunState = { ...runState, runId: run.id };
    await prisma.run.update({
      where: { id: run.id },
      data: { state: stateWithDbId as unknown as Prisma.InputJsonValue },
    });

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

    const state = validated.state as RunState;

    await prisma.run.update({
      where: { id: validated.runId },
      data: {
        state: state as unknown as Prisma.InputJsonValue,
        floor: state.floor,
        room: state.currentRoom,
        gold: state.gold,
        status: state.status,
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

    await prisma.run.update({
      where: { id: validated.runId },
      data: {
        status: validated.status,
        endedAt: new Date(),
      },
    });

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
    });
    const currentResources =
      (progression?.resources as Record<string, number>) ?? {};
    const currentUnlockProgress = readUnlockProgressFromResources(currentResources);
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
    for (const [biome, value] of Object.entries(runUnlockProgress.enteredBiomes)) {
      mergedUnlockProgress.enteredBiomes[biome] = Math.max(
        mergedUnlockProgress.enteredBiomes[biome] ?? 0,
        value ?? 0
      );
    }
    for (const [biome, value] of Object.entries(runUnlockProgress.biomeRunsCompleted)) {
      mergedUnlockProgress.biomeRunsCompleted[biome] = Math.max(
        mergedUnlockProgress.biomeRunsCompleted[biome] ?? 0,
        value ?? 0
      );
    }
    for (const [biome, value] of Object.entries(runUnlockProgress.eliteKillsByBiome)) {
      mergedUnlockProgress.eliteKillsByBiome[biome] = Math.max(
        mergedUnlockProgress.eliteKillsByBiome[biome] ?? 0,
        value ?? 0
      );
    }
    for (const [biome, value] of Object.entries(runUnlockProgress.bossKillsByBiome)) {
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
        orderBy: { updatedAt: "desc" },
      }),
      prisma.userProgression.findUnique({ where: { userId: user.id! } }),
    ]);

    if (!run) {
      return success({ run: null, userRole: user.role });
    }

    // Recompute meta bonuses from current progression so that stories
    // unlocked after the run was created are still applied.
    const unlockedStoryIds = (progression?.unlockedStoryIds as string[]) ?? [];
    const freshMetaBonuses = computeMetaBonuses(unlockedStoryIds);
    const state = run.state as unknown as RunState;
    const stateWithFreshBonuses: RunState = { ...state, metaBonuses: freshMetaBonuses };

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

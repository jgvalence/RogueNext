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
import { buildCardDefsMap } from "@/game/data";
import type { RunState } from "@/game/schemas/run-state";

const createRunSchema = z.object({
  seed: z.string().optional(),
});

export async function createRunAction(input: z.infer<typeof createRunSchema>) {
  try {
    const validated = createRunSchema.parse(input);
    const user = await requireAuth();

    const seed = validated.seed ?? nanoid();
    const rng = createRNG(seed);

    // Build starter card definitions from composition
    const cardDefsMap = buildCardDefsMap();
    const starterCards = starterDeckComposition
      .map((id) => cardDefsMap.get(id))
      .filter((c): c is NonNullable<typeof c> => c != null);

    const runState = createNewRun(nanoid(), seed, starterCards, rng);

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

    revalidatePath("/game");
    return success({ ended: true });
  } catch (error) {
    return handleServerActionError(error);
  }
}

export async function getActiveRunAction() {
  try {
    const user = await requireAuth();

    const run = await prisma.run.findFirst({
      where: {
        userId: user.id!,
        status: "IN_PROGRESS",
      },
      orderBy: { updatedAt: "desc" },
    });

    if (!run) {
      return success({ run: null });
    }

    return success({
      run: {
        id: run.id,
        state: run.state as unknown as RunState,
        seed: run.seed,
        createdAt: run.createdAt,
      },
    });
  } catch (error) {
    return handleServerActionError(error);
  }
}

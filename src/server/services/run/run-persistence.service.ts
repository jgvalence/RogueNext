import { Prisma, type Run } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { RunState } from "@/game/schemas/run-state";

function assertOwnedRun(run: Run | null, userId: string): Run {
  if (!run || run.userId !== userId) {
    throw new Error("Run not found or access denied");
  }

  return run;
}

export async function createActiveRunForUser(
  userId: string,
  seed: string,
  runState: RunState
): Promise<{
  runId: string;
  state: RunState;
  abandonedCount: number;
}> {
  const now = new Date();
  let abandonedCount = 0;

  const run = await prisma.$transaction(async (tx) => {
    const abandoned = await tx.run.updateMany({
      where: { userId, status: "IN_PROGRESS" },
      data: { status: "ABANDONED", endedAt: now },
    });
    abandonedCount = abandoned.count;

    await tx.run.deleteMany({
      where: { userId, status: { not: "IN_PROGRESS" } },
    });

    const created = await tx.run.create({
      data: {
        userId,
        seed,
        state: runState as unknown as Prisma.InputJsonValue,
        status: "IN_PROGRESS",
      },
    });

    const stateWithDbId: RunState = { ...runState, runId: created.id };
    await tx.run.update({
      where: { id: created.id },
      data: { state: stateWithDbId as unknown as Prisma.InputJsonValue },
    });

    return created;
  });

  return {
    runId: run.id,
    state: { ...runState, runId: run.id },
    abandonedCount,
  };
}

export async function findLatestActiveRunForUser(
  userId: string
): Promise<Run | null> {
  return prisma.run.findFirst({
    where: { userId, status: "IN_PROGRESS" },
    orderBy: { createdAt: "desc" },
  });
}

export async function getOwnedRunForUser(
  userId: string,
  runId: string
): Promise<Run> {
  const run = await prisma.run.findUnique({
    where: { id: runId },
  });

  return assertOwnedRun(run, userId);
}

export async function saveRunStateForUser(input: {
  userId: string;
  runId: string;
  state: RunState;
}): Promise<boolean> {
  const run = await getOwnedRunForUser(input.userId, input.runId);
  if (run.status !== "IN_PROGRESS") {
    return false;
  }

  await prisma.run.update({
    where: { id: input.runId },
    data: {
      state: input.state as unknown as Prisma.InputJsonValue,
      floor: input.state.floor,
      room: input.state.currentRoom,
      gold: input.state.gold,
    },
  });

  return true;
}

export async function markRunEndedForUser(input: {
  userId: string;
  runId: string;
  status: "VICTORY" | "DEFEAT" | "ABANDONED";
}): Promise<{ run: Run; ended: boolean }> {
  const run = await getOwnedRunForUser(input.userId, input.runId);

  const updated = await prisma.run.updateMany({
    where: {
      id: input.runId,
      userId: input.userId,
      status: "IN_PROGRESS",
    },
    data: {
      status: input.status,
      endedAt: new Date(),
    },
  });

  return {
    run,
    ended: updated.count > 0,
  };
}

export async function deleteRunById(runId: string): Promise<void> {
  await prisma.run.delete({
    where: { id: runId },
  });
}

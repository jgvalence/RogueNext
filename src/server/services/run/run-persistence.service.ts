import { isDeepStrictEqual } from "node:util";
import { Prisma, type Run } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { validateRunSnapshot } from "./run-validation";
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
  runState: RunState,
  db?: Prisma.TransactionClient
): Promise<{
  runId: string;
  state: RunState;
  abandonedCount: number;
}> {
  const now = new Date();
  let abandonedCount = 0;

  const create = async (tx: Prisma.TransactionClient) => {
    const abandoned = await tx.run.updateMany({
      where: { userId, status: "IN_PROGRESS" },
      data: { status: "ABANDONED", endedAt: now },
    });
    abandonedCount = abandoned.count;

    // Retain terminal snapshots for idempotent finalization and history.

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
  };
  const run = db
    ? await create(db)
    : await prisma.$transaction(create, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
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
  runId: string,
  db: Prisma.TransactionClient = prisma
): Promise<Run> {
  const run = await db.run.findUnique({
    where: { id: runId },
  });

  return assertOwnedRun(run, userId);
}

export async function saveRunStateForUser(
  input: {
    userId: string;
    runId: string;
    state: RunState;
  },
  db: Prisma.TransactionClient = prisma
): Promise<boolean> {
  const run = await getOwnedRunForUser(input.userId, input.runId, db);
  if (run.status !== "IN_PROGRESS") return false;
  const previous = run.state as unknown as RunState;
  const revision = previous.saveRevision ?? 0;
  const expectedRevision = input.state.saveRevision ?? 0;
  const nextState = { ...input.state, saveRevision: expectedRevision + 1 };
  if (revision !== expectedRevision) {
    // A lost acknowledgement may retry exactly the last committed snapshot.
    return (
      revision === expectedRevision + 1 &&
      isDeepStrictEqual(previous, JSON.parse(JSON.stringify(nextState)))
    );
  }
  validateRunSnapshot(input.state, {
    ...previous,
    // Match the legacy normalization performed when resuming a stored run.
    runStartedAtMs:
      previous.runStartedAtMs && previous.runStartedAtMs > 0
        ? previous.runStartedAtMs
        : run.createdAt.getTime(),
  });
  const updated = await db.run.updateMany({
    where: {
      id: input.runId,
      userId: input.userId,
      status: "IN_PROGRESS",
      state: { equals: run.state as Prisma.InputJsonValue },
    },
    data: {
      state: nextState as unknown as Prisma.InputJsonValue,
      floor: input.state.floor,
      room: input.state.currentRoom,
      gold: input.state.gold,
    },
  });
  return updated.count === 1;
}

export async function markRunEndedForUser(
  input: {
    userId: string;
    runId: string;
    status: "VICTORY" | "DEFEAT" | "ABANDONED";
  },
  db: Prisma.TransactionClient = prisma
): Promise<{ run: Run; ended: boolean }> {
  const run = await getOwnedRunForUser(input.userId, input.runId, db);

  const updated = await db.run.updateMany({
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

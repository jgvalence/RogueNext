import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export function normalizeDifficultyMap(input: unknown): Record<string, number> {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (!/^\d+$/.test(key)) continue;
    if (typeof value !== "number" || !Number.isFinite(value)) continue;
    out[key] = Math.max(0, Math.floor(value));
  }
  return out;
}

function normalizeDifficultyLevel(level: number): number {
  return Math.max(0, Math.floor(level));
}

export async function incrementRunStatsInternal(
  userId: string,
  status: "VICTORY" | "DEFEAT" | "ABANDONED",
  count = 1,
  options?: {
    difficultyLevel?: number;
    runDurationMs?: number;
  },
  db: Prisma.TransactionClient = prisma
): Promise<void> {
  if (count <= 0) return;
  try {
    const row = await db.userProgression.findUnique({ where: { userId } });
    const baseTotal = row?.totalRuns ?? 0;
    const baseWon = row?.wonRuns ?? 0;
    const baseLost = row?.lostRuns ?? 0;
    const baseAbandoned = row?.abandonedRuns ?? 0;

    await db.userProgression.upsert({
      where: { userId },
      create: {
        userId,
        resources: (row?.resources as Record<string, number>) ?? {},
        unlockedStoryIds: (row?.unlockedStoryIds as string[]) ?? [],
        totalRuns: count,
        wonRuns: status === "VICTORY" ? count : 0,
        lostRuns: status === "DEFEAT" ? count : 0,
        abandonedRuns: status === "ABANDONED" ? count : 0,
      },
      update: {
        totalRuns: baseTotal + count,
        wonRuns: baseWon + (status === "VICTORY" ? count : 0),
        lostRuns: baseLost + (status === "DEFEAT" ? count : 0),
        abandonedRuns: baseAbandoned + (status === "ABANDONED" ? count : 0),
      },
    });

    const canTrackDifficultyStats =
      status === "VICTORY" && options?.difficultyLevel != null;
    if (!canTrackDifficultyStats) return;

    const difficultyLevel = normalizeDifficultyLevel(options.difficultyLevel!);
    const difficultyKey = String(difficultyLevel);
    const durationMs = Math.max(0, Math.floor(options?.runDurationMs ?? 0));

    try {
      const difficultyRow = await db.userProgression.findUnique({
        where: { userId },
        select: { winsByDifficulty: true, bestTimeByDifficultyMs: true },
      });

      const winsByDifficulty = normalizeDifficultyMap(
        difficultyRow?.winsByDifficulty
      );
      const bestTimeByDifficultyMs = normalizeDifficultyMap(
        difficultyRow?.bestTimeByDifficultyMs
      );
      winsByDifficulty[difficultyKey] =
        (winsByDifficulty[difficultyKey] ?? 0) + count;

      if (durationMs > 0 && count === 1) {
        const currentBest = bestTimeByDifficultyMs[difficultyKey];
        if (currentBest == null || durationMs < currentBest) {
          bestTimeByDifficultyMs[difficultyKey] = durationMs;
        }
      }

      await db.userProgression.update({
        where: { userId },
        data: {
          winsByDifficulty: winsByDifficulty as Prisma.InputJsonValue,
          bestTimeByDifficultyMs:
            bestTimeByDifficultyMs as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      if (db !== prisma) throw error;
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2022"
      ) {
        return;
      }
      throw error;
    }
  } catch (error) {
    if (db !== prisma) throw error;
    // Backward compatibility during rollout: if run stats columns are missing
    // in the database, skip stat increments but keep gameplay functional.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2022"
    ) {
      return;
    }
    throw error;
  }
}

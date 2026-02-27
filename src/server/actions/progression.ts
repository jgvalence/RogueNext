"use server";

import { z } from "zod";
import { requireAuth } from "@/lib/auth/helpers";
import { handleServerActionError, success } from "@/lib/errors/handlers";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { computeMetaBonuses } from "@/game/engine/meta";
import { histoireDefinitions } from "@/game/data/histoires";
import type { MetaProgress } from "@/game/schemas/meta";
import {
  buildRunConditionCollectionRows,
  type RunConditionCollectionRow,
} from "@/game/engine/run-conditions";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getOrCreateProgression(userId: string): Promise<MetaProgress> {
  const row = await prisma.userProgression.findUnique({
    where: { userId },
    select: {
      resources: true,
      unlockedStoryIds: true,
      winsByDifficulty: true,
      bestTimeByDifficultyMs: true,
    },
  });
  if (row) {
    return {
      resources: (row.resources as Record<string, number>) ?? {},
      unlockedStoryIds: (row.unlockedStoryIds as string[]) ?? [],
      winsByDifficulty: normalizeDifficultyMap(row.winsByDifficulty),
      bestTimeByDifficultyMs: normalizeDifficultyMap(
        row.bestTimeByDifficultyMs
      ),
    };
  }
  await prisma.userProgression.create({
    data: { userId, resources: {}, unlockedStoryIds: [] },
  });
  return {
    resources: {},
    unlockedStoryIds: [],
    winsByDifficulty: {},
    bestTimeByDifficultyMs: {},
  };
}

// ---------------------------------------------------------------------------
// Public server actions
// ---------------------------------------------------------------------------

/**
 * Lit la progression méta de l'utilisateur connecté (crée si absente).
 */
export async function getProgressionAction() {
  try {
    const user = await requireAuth();
    const progression = await getOrCreateProgression(user.id!);
    return success({ progression });
  } catch (error) {
    return handleServerActionError(error);
  }
}

/**
 * Retourne les ComputedMetaBonuses calculés depuis les histoires débloquées.
 */
export async function getComputedBonusesAction() {
  try {
    const user = await requireAuth();
    const progression = await getOrCreateProgression(user.id!);
    const bonuses = computeMetaBonuses(progression.unlockedStoryIds);
    return success({ bonuses });
  } catch (error) {
    return handleServerActionError(error);
  }
}

export async function getRunConditionCollectionAction() {
  try {
    const user = await requireAuth();
    const row = await prisma.userProgression.findUnique({
      where: { userId: user.id! },
      select: { totalRuns: true, wonRuns: true },
    });
    const totalRuns = row?.totalRuns ?? 0;
    const wonRuns = row?.wonRuns ?? 0;
    const conditions: RunConditionCollectionRow[] =
      buildRunConditionCollectionRows({
        totalRuns,
        wonRuns,
      });
    return success({
      runStats: {
        totalRuns,
        wonRuns,
      },
      conditions,
    });
  } catch (error) {
    return handleServerActionError(error);
  }
}

const unlockStorySchema = z.object({
  storyId: z.string(),
});

/**
 * Débloque une Histoire en vérifiant prérequis + ressources disponibles.
 */
export async function unlockStoryAction(
  input: z.infer<typeof unlockStorySchema>
) {
  try {
    const { storyId } = unlockStorySchema.parse(input);
    const user = await requireAuth();
    const progression = await getOrCreateProgression(user.id!);

    // Trouver la définition
    const histoire = histoireDefinitions.find((h) => h.id === storyId);
    if (!histoire) throw new Error(`Histoire inconnue : ${storyId}`);

    // Vérifier qu'elle n'est pas déjà débloquée
    if (progression.unlockedStoryIds.includes(storyId)) {
      throw new Error(`Histoire déjà débloquée : ${storyId}`);
    }

    // Vérifier les prérequis
    for (const prereq of histoire.prerequis) {
      if (!progression.unlockedStoryIds.includes(prereq)) {
        throw new Error(`Prérequis manquant : ${prereq}`);
      }
    }

    // Vérifier les ressources
    for (const [resource, cost] of Object.entries(histoire.cout)) {
      const available = progression.resources[resource] ?? 0;
      if (available < cost) {
        throw new Error(
          `Ressources insuffisantes : ${resource} (${available}/${cost})`
        );
      }
    }

    // Débiter les ressources et ajouter l'histoire
    const updatedResources = { ...progression.resources };
    for (const [resource, cost] of Object.entries(histoire.cout)) {
      updatedResources[resource] = (updatedResources[resource] ?? 0) - cost;
    }
    const updatedStoryIds = [...progression.unlockedStoryIds, storyId];

    await prisma.userProgression.update({
      where: { userId: user.id! },
      data: {
        resources: updatedResources as Prisma.InputJsonValue,
        unlockedStoryIds: updatedStoryIds as Prisma.InputJsonValue,
      },
    });

    return success({
      unlockedStoryId: storyId,
      resources: updatedResources,
      unlockedStoryIds: updatedStoryIds,
    });
  } catch (error) {
    return handleServerActionError(error);
  }
}

/**
 * Ajoute des ressources à la progression (appelé en fin de run via endRunAction).
 * Ne pas appeler directement depuis le client.
 */
export async function addResourcesInternal(
  userId: string,
  resources: Record<string, number>
): Promise<void> {
  const row = await prisma.userProgression.findUnique({
    where: { userId },
    select: { resources: true, unlockedStoryIds: true },
  });
  const current = (row?.resources as Record<string, number>) ?? {};

  const updated: Record<string, number> = { ...current };
  for (const [key, amount] of Object.entries(resources)) {
    updated[key] = (updated[key] ?? 0) + Math.round(amount);
  }

  await prisma.userProgression.upsert({
    where: { userId },
    create: { userId, resources: updated, unlockedStoryIds: [] },
    update: { resources: updated as Prisma.InputJsonValue },
  });
}

function normalizeDifficultyMap(input: unknown): Record<string, number> {
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
  }
): Promise<void> {
  if (count <= 0) return;
  try {
    const row = await prisma.userProgression.findUnique({ where: { userId } });
    const baseTotal = row?.totalRuns ?? 0;
    const baseWon = row?.wonRuns ?? 0;
    const baseLost = row?.lostRuns ?? 0;
    const baseAbandoned = row?.abandonedRuns ?? 0;

    await prisma.userProgression.upsert({
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
      const difficultyRow = await prisma.userProgression.findUnique({
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

      await prisma.userProgression.update({
        where: { userId },
        data: {
          winsByDifficulty: winsByDifficulty as Prisma.InputJsonValue,
          bestTimeByDifficultyMs:
            bestTimeByDifficultyMs as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2022"
      ) {
        return;
      }
      throw error;
    }
  } catch (error) {
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

"use server";

import { z } from "zod";
import { requireAuth } from "@/lib/auth/helpers";
import { handleServerActionError, success } from "@/lib/errors/handlers";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { computeMetaBonuses } from "@/game/engine/meta";
import { histoireDefinitions } from "@/game/data/histoires";
import type { MetaProgress } from "@/game/schemas/meta";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getOrCreateProgression(userId: string): Promise<MetaProgress> {
  const row = await prisma.userProgression.findUnique({
    where: { userId },
    select: { resources: true, unlockedStoryIds: true },
  });
  if (row) {
    return {
      resources: (row.resources as Record<string, number>) ?? {},
      unlockedStoryIds: (row.unlockedStoryIds as string[]) ?? [],
    };
  }
  await prisma.userProgression.create({
    data: { userId, resources: {}, unlockedStoryIds: [] },
  });
  return { resources: {}, unlockedStoryIds: [] };
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

export async function incrementRunStatsInternal(
  userId: string,
  status: "VICTORY" | "DEFEAT" | "ABANDONED",
  count = 1
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

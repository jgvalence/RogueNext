"use server";

import { requireAuth } from "@/lib/auth/helpers";
import { handleServerActionError, success } from "@/lib/errors/handlers";
import { prisma } from "@/lib/db/prisma";

export interface RunHistoryEntry {
  id: string;
  characterId: string;
  biome: string;
  status: string;
  floor: number;
  difficultyLevel: number;
  powerScore: number;
  hp: number;
  maxHp: number;
  gold: number;
  unlockedStoryCount: number;
  relicCount: number;
  createdAt: Date;
}

const RUN_HISTORY_LIMIT = 50;

export async function getRunHistoryAction() {
  try {
    const user = await requireAuth();

    const snapshots = await prisma.pvpDeckSnapshot.findMany({
      where: { userId: user.id! },
      select: {
        id: true,
        characterId: true,
        biome: true,
        status: true,
        floor: true,
        difficultyLevel: true,
        powerScore: true,
        hp: true,
        maxHp: true,
        gold: true,
        unlockedStoryCount: true,
        relicIds: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: RUN_HISTORY_LIMIT,
    });

    const entries: RunHistoryEntry[] = snapshots.map((s) => ({
      id: s.id,
      characterId: s.characterId,
      biome: s.biome,
      status: s.status,
      floor: s.floor,
      difficultyLevel: s.difficultyLevel,
      powerScore: s.powerScore,
      hp: s.hp,
      maxHp: s.maxHp,
      gold: s.gold,
      unlockedStoryCount: s.unlockedStoryCount,
      relicCount: Array.isArray(s.relicIds) ? s.relicIds.length : 0,
      createdAt: s.createdAt,
    }));

    return success({ entries });
  } catch (error) {
    return handleServerActionError(error);
  }
}

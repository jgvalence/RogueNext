"use server";

import type { RunState } from "@/game/schemas/run-state";
import { CardInstanceSchema } from "@/game/schemas/cards";
import { buildCardDefsMap } from "@/game/data";
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
  activePlayMs: number | null;
  deck: Array<{
    definitionId: string;
    name: string;
    upgraded: boolean;
    branch: string | null;
    count: number;
  }>;
}

const RUN_HISTORY_LIMIT = 50;
const cardDefinitions = buildCardDefsMap();

function describeDeck(raw: unknown): RunHistoryEntry["deck"] {
  const cards = new Map<string, RunHistoryEntry["deck"][number]>();
  for (const value of Array.isArray(raw) ? raw : []) {
    const parsed = CardInstanceSchema.safeParse(value);
    if (!parsed.success) continue;
    const card = parsed.data;
    const branch = card.upgraded ? (card.upgradeBranch ?? null) : null;
    const key = `${card.definitionId}:${card.upgraded}:${branch}`;
    const existing = cards.get(key);
    if (existing) existing.count++;
    else
      cards.set(key, {
        definitionId: card.definitionId,
        name: cardDefinitions.get(card.definitionId)?.name ?? card.definitionId,
        upgraded: card.upgraded,
        branch,
        count: 1,
      });
  }
  return [...cards.values()];
}

export async function getRunHistoryAction() {
  try {
    const user = await requireAuth();

    const runs = await prisma.run.findMany({
      where: { userId: user.id!, status: { not: "IN_PROGRESS" } },
      orderBy: { endedAt: "desc" },
      take: RUN_HISTORY_LIMIT,
    });
    const entries: RunHistoryEntry[] = runs.map((run) => {
      const state = run.state as unknown as RunState;
      const stories = state.unlockedStoryIdsSnapshot?.length ?? 0;
      return {
        id: run.id,
        characterId: state.characterId ?? "scribe",
        biome: state.currentBiome,
        status: run.status,
        floor: state.floor,
        difficultyLevel: state.selectedDifficultyLevel ?? 0,
        powerScore:
          state.floor * 10 +
          (state.selectedDifficultyLevel ?? 0) * 8 +
          state.relicIds.length * 3 +
          stories * 2,
        hp: Math.max(
          0,
          state.combat?.player.currentHp ?? state.playerCurrentHp
        ),
        maxHp: state.playerMaxHp,
        gold: state.gold,
        unlockedStoryCount: stories,
        relicCount: state.relicIds.length,
        createdAt: run.endedAt ?? run.createdAt,
        activePlayMs: state.activePlayMs > 0 ? state.activePlayMs : null,
        deck: describeDeck(state.deck),
      };
    });
    // Preserve older history whose canonical snapshots were deleted by the former lifecycle.
    if (entries.length < RUN_HISTORY_LIMIT) {
      const oldest = entries.at(-1)?.createdAt;
      const legacy = await prisma.pvpDeckSnapshot.findMany({
        where: {
          userId: user.id!,
          ...(oldest ? { createdAt: { lt: oldest } } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: RUN_HISTORY_LIMIT - entries.length,
      });
      for (const snapshot of legacy)
        entries.push({
          ...snapshot,
          activePlayMs: null,
          deck: describeDeck(snapshot.deck),
          relicCount: Array.isArray(snapshot.relicIds)
            ? snapshot.relicIds.length
            : 0,
        });
    }

    return success({ entries });
  } catch (error) {
    return handleServerActionError(error);
  }
}

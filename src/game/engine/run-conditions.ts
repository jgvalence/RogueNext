import type { CardDefinition } from "../schemas/cards";
import type { ComputedMetaBonuses } from "../schemas/meta";
import { DEFAULT_META_BONUSES } from "../schemas/meta";
import type { RNG } from "./rng";

export interface RunConditionProgress {
  totalRuns: number;
  wonRuns: number;
}

export interface RunConditionMapRules {
  forceSingleChoice?: boolean;
  noMerchants?: boolean;
  extraSpecialRoom?: boolean;
  bossOnlyCombats?: boolean;
}

export interface RunConditionEffects {
  startingGoldDelta?: number;
  maxHpDelta?: number;
  addCardIds?: string[];
  replaceStarterDeckWithRandomCount?: number;
  combatRewardMultiplier?: number;
  addMetaBonuses?: Partial<ComputedMetaBonuses>;
  mapRules?: RunConditionMapRules;
}

export interface RunConditionDefinition {
  id: string;
  category:
    | "LIGHT_BOON"
    | "BOON_WITH_DRAWBACK"
    | "BONUS_CARD"
    | "GOOD_BAD_CARD"
    | "SPECIAL_RULE"
    | "UNIQUE_MECHANIC";
  unlock: {
    totalRuns?: number;
    wonRuns?: number;
  };
  effects: RunConditionEffects;
}

export const VANILLA_RUN_CONDITION_ID = "vanilla_run";
export const INFINITE_RUN_CONDITION_ID = "infinite_mode";
const RUN_CONDITION_ID_ALIASES: Record<string, string> = {
  vanilla: VANILLA_RUN_CONDITION_ID,
};

export const runConditionDefinitions: RunConditionDefinition[] = [
  {
    id: VANILLA_RUN_CONDITION_ID,
    category: "SPECIAL_RULE",
    unlock: {},
    effects: {},
  },
  {
    id: INFINITE_RUN_CONDITION_ID,
    category: "SPECIAL_RULE",
    unlock: {},
    effects: {},
  },
  {
    id: "quiet_pockets",
    category: "LIGHT_BOON",
    unlock: {},
    effects: { startingGoldDelta: 20 },
  },
  {
    id: "tempered_flesh",
    category: "BOON_WITH_DRAWBACK",
    unlock: {},
    effects: { maxHpDelta: 12, startingGoldDelta: -15 },
  },
  {
    id: "open_grimoire",
    category: "BONUS_CARD",
    unlock: {},
    effects: { addCardIds: ["fortify"] },
  },
  {
    id: "inked_beginning",
    category: "LIGHT_BOON",
    unlock: {},
    effects: {
      addMetaBonuses: {
        startingInk: 2,
      },
    },
  },
  {
    id: "battle_manual",
    category: "BONUS_CARD",
    unlock: {},
    effects: { addCardIds: ["heavy_strike"] },
  },
  {
    id: "packed_supplies",
    category: "LIGHT_BOON",
    unlock: {},
    effects: { startingGoldDelta: 12, maxHpDelta: 6 },
  },
  {
    id: "forbidden_contract",
    category: "GOOD_BAD_CARD",
    unlock: { totalRuns: 2 },
    effects: { addCardIds: ["mythic_blow", "haunting_regret"] },
  },
  {
    id: "single_path",
    category: "SPECIAL_RULE",
    unlock: { totalRuns: 3 },
    effects: { mapRules: { forceSingleChoice: true } },
  },
  {
    id: "eventful_routes",
    category: "UNIQUE_MECHANIC",
    unlock: { totalRuns: 5 },
    effects: { mapRules: { noMerchants: true, extraSpecialRoom: true } },
  },
  {
    id: "battle_rite",
    category: "BOON_WITH_DRAWBACK",
    unlock: { wonRuns: 2 },
    effects: {
      addMetaBonuses: {
        startingStrength: 1,
        healAfterCombat: -5,
      },
    },
  },
  {
    id: "chaos_draft",
    category: "UNIQUE_MECHANIC",
    unlock: { totalRuns: 4, wonRuns: 1 },
    effects: { replaceStarterDeckWithRandomCount: 10 },
  },
  {
    id: "boss_rush",
    category: "SPECIAL_RULE",
    unlock: { totalRuns: 8, wonRuns: 3 },
    effects: {
      combatRewardMultiplier: 2,
      mapRules: { bossOnlyCombats: true },
    },
  },
];

const runConditionById = new Map(runConditionDefinitions.map((c) => [c.id, c]));

export interface RunConditionCollectionRow {
  id: string;
  category: RunConditionDefinition["category"];
  unlock: RunConditionDefinition["unlock"];
  unlocked: boolean;
}

export function normalizeRunConditionId(
  conditionId: string | null | undefined
): string | null {
  if (!conditionId) return null;
  const normalized = conditionId.trim().toLowerCase();
  if (!normalized) return null;
  const canonical = RUN_CONDITION_ID_ALIASES[normalized] ?? normalized;
  return runConditionById.has(canonical) ? canonical : null;
}

export function normalizeRunConditionIds(
  conditionIds: readonly string[] | null | undefined
): string[] {
  const unique = new Set<string>();
  for (const rawId of conditionIds ?? []) {
    const conditionId = normalizeRunConditionId(rawId);
    if (conditionId) unique.add(conditionId);
  }
  return [...unique];
}

export function getRunConditionById(
  conditionId: string | null | undefined
): RunConditionDefinition | null {
  const normalized = normalizeRunConditionId(conditionId);
  if (!normalized) return null;
  return runConditionById.get(normalized) ?? null;
}

export function isInfiniteRunConditionId(
  conditionId: string | null | undefined
): boolean {
  return normalizeRunConditionId(conditionId) === INFINITE_RUN_CONDITION_ID;
}

export function isRunModeConditionId(
  conditionId: string | null | undefined
): boolean {
  const normalized = normalizeRunConditionId(conditionId);
  return (
    normalized === VANILLA_RUN_CONDITION_ID ||
    normalized === INFINITE_RUN_CONDITION_ID
  );
}

export function computeUnlockedRunConditionIds(
  progress: RunConditionProgress
): string[] {
  return runConditionDefinitions
    .filter((condition) => {
      const requiredRuns = condition.unlock.totalRuns ?? 0;
      const requiredWins = condition.unlock.wonRuns ?? 0;
      return (
        progress.totalRuns >= requiredRuns && progress.wonRuns >= requiredWins
      );
    })
    .map((condition) => condition.id);
}

export function drawRunConditionChoices(
  unlockedConditionIds: string[],
  rng: RNG,
  count = 3
): string[] {
  if (count <= 0) return [];
  const unlocked = normalizeRunConditionIds(unlockedConditionIds);
  const fallback = runConditionDefinitions
    .filter(
      (condition) => !condition.unlock.totalRuns && !condition.unlock.wonRuns
    )
    .map((condition) => condition.id);
  // Infinite mode is selected by a dedicated pre-run toggle, not by the
  // "pick 1 among 3" start-condition choices.
  const pool = Array.from(new Set([...unlocked, ...fallback])).filter(
    (id) => id !== INFINITE_RUN_CONDITION_ID
  );
  const alwaysIncluded = [VANILLA_RUN_CONDITION_ID].filter((id) =>
    pool.includes(id)
  );
  const remainingCount = Math.max(0, count - alwaysIncluded.length);
  const alwaysIncludedSet = new Set(alwaysIncluded);
  const remainingPool = pool.filter((id) => !alwaysIncludedSet.has(id));
  const picked =
    remainingPool.length <= remainingCount
      ? rng.shuffle(remainingPool)
      : rng.shuffle(remainingPool).slice(0, remainingCount);
  return [...alwaysIncluded, ...picked];
}

export function buildRunConditionCollectionRows(
  progress: RunConditionProgress
): RunConditionCollectionRow[] {
  const unlocked = new Set(computeUnlockedRunConditionIds(progress));
  return runConditionDefinitions.map((condition) => ({
    id: condition.id,
    category: condition.category,
    unlock: condition.unlock,
    unlocked: unlocked.has(condition.id),
  }));
}

export function getRunConditionMapRules(
  conditionId: string | null | undefined
): RunConditionMapRules {
  return getRunConditionById(conditionId)?.effects.mapRules ?? {};
}

export function applyRunConditionMetaBonuses(
  baseBonuses: ComputedMetaBonuses | undefined,
  conditionId: string
): ComputedMetaBonuses | undefined {
  const condition = getRunConditionById(conditionId);
  if (!condition?.effects.addMetaBonuses) return baseBonuses;

  const merged: ComputedMetaBonuses = {
    ...(baseBonuses ?? DEFAULT_META_BONUSES),
  };

  for (const [key, value] of Object.entries(condition.effects.addMetaBonuses)) {
    const typedKey = key as keyof ComputedMetaBonuses;
    const current = merged[typedKey];
    if (typeof current === "number" && typeof value === "number") {
      (merged[typedKey] as number) = current + value;
    }
  }

  if (merged.healAfterCombat < 0) merged.healAfterCombat = 0;
  if (merged.healAfterCombatFlat < 0) merged.healAfterCombatFlat = 0;
  return merged;
}

export function buildConditionStarterCards(
  conditionId: string,
  cardMap: Map<string, CardDefinition>
): CardDefinition[] {
  const condition = getRunConditionById(conditionId);
  if (!condition?.effects.addCardIds?.length) return [];
  return condition.effects.addCardIds
    .map((cardId) => cardMap.get(cardId))
    .filter((card): card is CardDefinition => Boolean(card));
}

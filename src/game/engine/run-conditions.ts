import type { CardDefinition } from "../schemas/cards";
import { enemyDefinitions } from "../data/enemies";
import type { BiomeType, Rarity } from "../schemas/enums";
import type { ComputedMetaBonuses } from "../schemas/meta";
import { DEFAULT_META_BONUSES } from "../schemas/meta";
import type { RNG } from "./rng";

export interface RunConditionProgress {
  totalRuns: number;
  wonRuns: number;
  enemyKillCounts?: Record<string, number>;
  resources?: Record<string, number>;
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
  startCombatCardIds?: string[];
  addRelicIds?: string[];
  addRandomCardsCount?: number;
  addRandomCardRarities?: Exclude<Rarity, "STARTER">[];
  removeRandomStarterCardsCount?: number;
  upgradeRandomDeckCardsCount?: number;
  replaceStarterDeckWithRandomCount?: number;
  combatRewardMultiplier?: number;
  addMetaBonuses?: Partial<ComputedMetaBonuses>;
  mapRules?: RunConditionMapRules;
}

export interface RunConditionUnlockRequirement {
  totalRuns?: number;
  wonRuns?: number;
  enemyKills?: {
    enemyId: string;
    count: number;
  };
  lootedCardId?: string;
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
  unlock: RunConditionUnlockRequirement;
  effects: RunConditionEffects;
}

export const VANILLA_RUN_CONDITION_ID = "vanilla_run";
export const INFINITE_RUN_CONDITION_ID = "infinite_mode";
export const BOSS_START_OPTION_CONDITION_PREFIX = "boss_start_option_";
export const RUN_CONDITION_CARD_LOOT_UNLOCK_PREFIX = "__RUN_CONDITION_CARD__";
const RUN_CONDITION_ID_ALIASES: Record<string, string> = {
  vanilla: VANILLA_RUN_CONDITION_ID,
};

export function getRunConditionCardLootUnlockResourceKey(
  cardId: string
): string {
  return `${RUN_CONDITION_CARD_LOOT_UNLOCK_PREFIX}${cardId}`;
}

export function isRunConditionCardLootUnlockResourceKey(
  resourceKey: string
): boolean {
  return resourceKey.startsWith(RUN_CONDITION_CARD_LOOT_UNLOCK_PREFIX);
}

const baseRunConditionDefinitions: RunConditionDefinition[] = [
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
    category: "LIGHT_BOON",
    unlock: {},
    effects: { maxHpDelta: 10 },
  },
  {
    id: "open_grimoire",
    category: "BONUS_CARD",
    unlock: {},
    effects: { addCardIds: ["fortify"] },
  },
  {
    id: "recursive_scratch_opening",
    category: "UNIQUE_MECHANIC",
    unlock: { lootedCardId: "recursive_scratch" },
    effects: { startCombatCardIds: ["recursive_scratch"] },
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
    effects: { upgradeRandomDeckCardsCount: 2 },
  },
  {
    id: "packed_supplies",
    category: "LIGHT_BOON",
    unlock: {},
    effects: { removeRandomStarterCardsCount: 1, addRandomCardsCount: 1 },
  },
  {
    id: "curators_patronage",
    category: "BOON_WITH_DRAWBACK",
    unlock: { totalRuns: 2 },
    effects: { addRelicIds: ["library_prep_satchel"], maxHpDelta: -12 },
  },
  {
    id: "fractured_archive",
    category: "GOOD_BAD_CARD",
    unlock: { totalRuns: 3, wonRuns: 1 },
    effects: {
      upgradeRandomDeckCardsCount: 3,
      addCardIds: ["haunting_regret", "haunting_regret"],
    },
  },
  {
    id: "severed_index",
    category: "UNIQUE_MECHANIC",
    unlock: { totalRuns: 4, wonRuns: 2 },
    effects: {
      removeRandomStarterCardsCount: 2,
      addRandomCardsCount: 1,
      addRandomCardRarities: ["RARE"],
      upgradeRandomDeckCardsCount: 1,
    },
  },
  {
    id: "merciless_routes",
    category: "SPECIAL_RULE",
    unlock: { totalRuns: 6, wonRuns: 2 },
    effects: {
      combatRewardMultiplier: 2,
      mapRules: { noMerchants: true, forceSingleChoice: true },
    },
  },
  {
    id: "forbidden_contract",
    category: "GOOD_BAD_CARD",
    unlock: { totalRuns: 2 },
    effects: {
      maxHpDelta: -6,
      addCardIds: ["mythic_blow", "haunting_regret"],
    },
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
    unlock: { totalRuns: 4 },
    effects: { mapRules: { noMerchants: true, extraSpecialRoom: true } },
  },
  {
    id: "battle_rite",
    category: "BOON_WITH_DRAWBACK",
    unlock: { wonRuns: 2 },
    effects: {
      maxHpDelta: -8,
      addMetaBonuses: {
        startingStrength: 1,
      },
    },
  },
  {
    id: "chaos_draft",
    category: "UNIQUE_MECHANIC",
    unlock: { totalRuns: 3, wonRuns: 1 },
    effects: { replaceStarterDeckWithRandomCount: 10 },
  },
  {
    id: "boss_rush",
    category: "SPECIAL_RULE",
    unlock: { totalRuns: 7, wonRuns: 3 },
    effects: {
      combatRewardMultiplier: 2,
      mapRules: { bossOnlyCombats: true },
    },
  },
  {
    id: "veterans_oath",
    category: "BOON_WITH_DRAWBACK",
    unlock: { totalRuns: 1 },
    effects: {
      maxHpDelta: -50,
      addMetaBonuses: {
        healAfterCombat: 100,
      },
    },
  },
  {
    id: "ink_lender",
    category: "BOON_WITH_DRAWBACK",
    unlock: { totalRuns: 1 },
    effects: {
      maxHpDelta: -8,
      addMetaBonuses: {
        startingInk: 2,
        inkPerCardChance: 100,
      },
    },
  },
  {
    id: "prepared_wards",
    category: "LIGHT_BOON",
    unlock: { totalRuns: 1 },
    effects: {
      addRelicIds: ["warded_ribbon"],
    },
  },
  {
    id: "archivist_cache",
    category: "BONUS_CARD",
    unlock: { totalRuns: 2 },
    effects: {
      addRandomCardsCount: 2,
      addRandomCardRarities: ["COMMON", "UNCOMMON"],
    },
  },
  {
    id: "rare_tithe",
    category: "BOON_WITH_DRAWBACK",
    unlock: { totalRuns: 3 },
    effects: {
      addRandomCardsCount: 1,
      addRandomCardRarities: ["RARE"],
      maxHpDelta: -14,
    },
  },
  {
    id: "surgical_cut",
    category: "UNIQUE_MECHANIC",
    unlock: { totalRuns: 3, wonRuns: 1 },
    effects: {
      removeRandomStarterCardsCount: 2,
      upgradeRandomDeckCardsCount: 2,
    },
  },
  {
    id: "quick_studies",
    category: "BONUS_CARD",
    unlock: { totalRuns: 3, wonRuns: 1 },
    effects: {
      upgradeRandomDeckCardsCount: 1,
      addRandomCardsCount: 1,
      addRandomCardRarities: ["UNCOMMON", "RARE"],
    },
  },
  {
    id: "cursed_compendium",
    category: "GOOD_BAD_CARD",
    unlock: { totalRuns: 3 },
    effects: {
      addRandomCardsCount: 2,
      addCardIds: ["haunting_regret", "haunting_regret"],
    },
  },
  {
    id: "crystal_loan",
    category: "GOOD_BAD_CARD",
    unlock: { totalRuns: 3, wonRuns: 1 },
    effects: {
      addRelicIds: ["energy_crystal"],
      addCardIds: ["haunting_regret"],
      upgradeRandomDeckCardsCount: 1,
    },
  },
  {
    id: "inkwell_bargain",
    category: "BOON_WITH_DRAWBACK",
    unlock: { totalRuns: 4, wonRuns: 1 },
    effects: {
      addRelicIds: ["inkwell_reservoir"],
      maxHpDelta: -10,
    },
  },
  {
    id: "forged_lexicon",
    category: "GOOD_BAD_CARD",
    unlock: { totalRuns: 4, wonRuns: 1 },
    effects: {
      addRelicIds: ["battle_lexicon"],
      addCardIds: ["haunting_regret"],
    },
  },
  {
    id: "isolated_trials",
    category: "SPECIAL_RULE",
    unlock: { totalRuns: 5, wonRuns: 2 },
    effects: {
      mapRules: { forceSingleChoice: true },
      removeRandomStarterCardsCount: 1,
      upgradeRandomDeckCardsCount: 1,
    },
  },
  {
    id: "grim_shortcuts",
    category: "SPECIAL_RULE",
    unlock: { totalRuns: 6, wonRuns: 2 },
    effects: {
      mapRules: { forceSingleChoice: true, extraSpecialRoom: true },
      startingGoldDelta: 10,
      addCardIds: ["haunting_regret"],
    },
  },
  {
    id: "fateful_manuscript",
    category: "GOOD_BAD_CARD",
    unlock: { totalRuns: 7, wonRuns: 2 },
    effects: {
      maxHpDelta: -12,
      addCardIds: ["haunting_regret", "haunting_regret"],
      addMetaBonuses: {
        extraEnergyMax: 1,
        extraDraw: 1,
      },
    },
  },
];

function getDefaultBossStartConditionMetaBonuses(
  biome: BiomeType
): Partial<ComputedMetaBonuses> {
  switch (biome) {
    case "LIBRARY":
      return { startingInk: 2 };
    case "VIKING":
      return { startingStrength: 1 };
    case "GREEK":
      return { startingBlock: 6 };
    case "EGYPTIAN":
      return { firstHitDamageReduction: 20 };
    case "LOVECRAFTIAN":
      return { extraDraw: 1 };
    case "AZTEC":
      return { attackBonus: 2 };
    case "CELTIC":
      return { startingRegen: 1 };
    case "RUSSIAN":
      return { extraHandAtStart: 1 };
    case "AFRICAN":
      return { healAfterCombatFlat: 2 };
  }
}

const bossStartConditionMetaBonusesByBossId: Record<
  string,
  Partial<ComputedMetaBonuses>
> = {
  chapter_guardian: { startingBlock: 8 },
  the_archivist: { startingInk: 2, extraDraw: 1 },
  fenrir: { startingStrength: 1, attackBonus: 1 },
  hel_queen: { healAfterCombatFlat: 3, firstHitDamageReduction: 10 },
  medusa: { firstHitDamageReduction: 20, startingBlock: 4 },
  hydra_aspect: { startingRegen: 1, extraEnergyMax: 1 },
  ra_avatar: { startingInk: 3, firstHitDamageReduction: 10 },
  osiris_judgment: { healAfterCombat: 8, extraHandAtStart: 1 },
  nyarlathotep_shard: { extraDraw: 1, extraInkMax: 2 },
  shub_spawn: { healAfterCombatFlat: 4, inkPerCardChance: 20 },
  tezcatlipoca_echo: { attackBonus: 2, extraHandAtStart: 1 },
  quetzalcoatl_wrath: { attackBonus: 1, extraDraw: 1 },
  dagda_shadow: { startingRegen: 1, startingBlock: 6 },
  cernunnos_shade: { healAfterCombatFlat: 2, inkPerCardValue: 1 },
  baba_yaga_hut: { extraHandAtStart: 1, startingInk: 1 },
  koschei_deathless: { firstHitDamageReduction: 25, extraInkMax: 1 },
  soundiata_spirit: { healAfterCombatFlat: 2, startingStrength: 1 },
  anansi_weaver: { extraDraw: 1, inkPerCardChance: 25 },
};

function getBossStartConditionMetaBonuses(
  bossId: string,
  biome: BiomeType
): Partial<ComputedMetaBonuses> {
  return (
    bossStartConditionMetaBonusesByBossId[bossId] ??
    getDefaultBossStartConditionMetaBonuses(biome)
  );
}

function buildBossStartRunConditions(): RunConditionDefinition[] {
  return enemyDefinitions
    .filter((enemy) => enemy.isBoss)
    .map((boss) => ({
      id: `${BOSS_START_OPTION_CONDITION_PREFIX}${boss.id}`,
      category: "UNIQUE_MECHANIC" as const,
      unlock: {
        enemyKills: {
          enemyId: boss.id,
          count: 2,
        },
      },
      effects: {
        addMetaBonuses: getBossStartConditionMetaBonuses(boss.id, boss.biome),
      },
    }));
}

const bossStartRunConditions = buildBossStartRunConditions();

export const runConditionDefinitions: RunConditionDefinition[] = [
  ...baseRunConditionDefinitions,
  ...bossStartRunConditions,
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
  const enemyKillCounts = progress.enemyKillCounts ?? {};
  const resources = progress.resources ?? {};
  return runConditionDefinitions
    .filter((condition) => {
      const requiredRuns = condition.unlock.totalRuns ?? 0;
      const requiredWins = condition.unlock.wonRuns ?? 0;
      const requiredEnemyKills = condition.unlock.enemyKills;
      const requiredLootedCardId = condition.unlock.lootedCardId;
      const hasRequiredEnemyKills = requiredEnemyKills
        ? (enemyKillCounts[requiredEnemyKills.enemyId] ?? 0) >=
          requiredEnemyKills.count
        : true;
      const hasRequiredLootedCard = requiredLootedCardId
        ? (resources[
            getRunConditionCardLootUnlockResourceKey(requiredLootedCardId)
          ] ?? 0) >= 1
        : true;
      return (
        progress.totalRuns >= requiredRuns &&
        progress.wonRuns >= requiredWins &&
        hasRequiredEnemyKills &&
        hasRequiredLootedCard
      );
    })
    .map((condition) => condition.id);
}

function hasNoUnlockRequirements(
  unlock: RunConditionUnlockRequirement
): boolean {
  return (
    !unlock.totalRuns &&
    !unlock.wonRuns &&
    !unlock.enemyKills &&
    !unlock.lootedCardId
  );
}

export function drawRunConditionChoices(
  unlockedConditionIds: string[],
  rng: RNG,
  count = 3
): string[] {
  if (count <= 0) return [];
  const unlocked = normalizeRunConditionIds(unlockedConditionIds);
  const fallback = runConditionDefinitions
    .filter((condition) => hasNoUnlockRequirements(condition.unlock))
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

export function buildConditionCombatStartCards(
  conditionId: string | null | undefined,
  cardMap: Map<string, CardDefinition>
): CardDefinition[] {
  const condition = getRunConditionById(conditionId);
  if (!condition?.effects.startCombatCardIds?.length) return [];
  return condition.effects.startCombatCardIds
    .map((cardId) => cardMap.get(cardId))
    .filter((card): card is CardDefinition => Boolean(card));
}

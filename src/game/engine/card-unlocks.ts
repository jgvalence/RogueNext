import type { CardDefinition } from "../schemas/cards";
import type { BiomeType } from "../schemas/enums";

export interface CardUnlockProgress {
  enteredBiomes: Record<string, number>;
  biomeRunsCompleted: Record<string, number>;
  eliteKillsByBiome: Record<string, number>;
  bossKillsByBiome: Record<string, number>;
}

export type CardUnlockRule =
  | { type: "ALWAYS" }
  | { type: "BIOME_FIRST_ENTRY"; biome: BiomeType }
  | { type: "BIOME_ELITE_KILLS"; biome: BiomeType; count: number }
  | { type: "BIOME_BOSS_KILLS"; biome: BiomeType; count: number }
  | { type: "BIOME_RUNS_COMPLETED"; biome: BiomeType; count: number }
  | { type: "STORY_UNLOCK"; storyId: string }
  | { type: "ALL_OF"; rules: CardUnlockRule[] };

export interface CardUnlockDetail {
  unlocked: boolean;
  condition: string;
  missingCondition: string | null;
  progress: string | null;
}

const BIOMES: BiomeType[] = [
  "LIBRARY",
  "VIKING",
  "GREEK",
  "EGYPTIAN",
  "LOVECRAFTIAN",
  "AZTEC",
  "CELTIC",
  "RUSSIAN",
  "AFRICAN",
];

// Explicit unlock rules by card id.
// Any non-LIBRARY collectible card must appear here.
// LIBRARY cards may also appear here to create meta progression inside the base biome.
// LIBRARY progression curve:
// - Early: fast unlocks (first elite / first stories)
// - Mid: first boss and tier-2 stories
// - Late: combined goals (boss + story / runs + story)
const EXPLICIT_CARD_UNLOCK_RULES: Record<string, CardUnlockRule> = {
  // LIBRARY (early)
  margin_barrage: { type: "BIOME_ELITE_KILLS", biome: "LIBRARY", count: 1 },
  war_drum: { type: "BIOME_ELITE_KILLS", biome: "LIBRARY", count: 1 },
  mythic_blow: { type: "BIOME_ELITE_KILLS", biome: "LIBRARY", count: 1 },
  annotated_thesis: { type: "STORY_UNLOCK", storyId: "encyclopedie_du_savoir" },
  binding_oath: { type: "STORY_UNLOCK", storyId: "traite_de_lenergie" },

  // LIBRARY (mid)
  rage_of_ages: { type: "BIOME_BOSS_KILLS", biome: "LIBRARY", count: 1 },
  inner_focus: { type: "BIOME_BOSS_KILLS", biome: "LIBRARY", count: 1 },
  meditation: {
    type: "ALL_OF",
    rules: [
      { type: "BIOME_RUNS_COMPLETED", biome: "LIBRARY", count: 1 },
      { type: "STORY_UNLOCK", storyId: "grimoire_des_index" },
    ],
  },

  // LIBRARY (late)
  final_chapter: {
    type: "ALL_OF",
    rules: [
      { type: "BIOME_BOSS_KILLS", biome: "LIBRARY", count: 2 },
      { type: "BIOME_ELITE_KILLS", biome: "LIBRARY", count: 2 },
    ],
  },
  forbidden_appendix: {
    type: "ALL_OF",
    rules: [
      { type: "STORY_UNLOCK", storyId: "grimoire_des_index" },
      { type: "BIOME_BOSS_KILLS", biome: "LIBRARY", count: 1 },
    ],
  },
  index_of_echoes: {
    type: "ALL_OF",
    rules: [
      { type: "STORY_UNLOCK", storyId: "manuel_de_revision" },
      { type: "BIOME_BOSS_KILLS", biome: "LIBRARY", count: 1 },
    ],
  },
  redacted_blast: {
    type: "ALL_OF",
    rules: [
      { type: "STORY_UNLOCK", storyId: "le_codex_infini" },
      { type: "BIOME_BOSS_KILLS", biome: "LIBRARY", count: 2 },
    ],
  },
  curator_pact: {
    type: "ALL_OF",
    rules: [
      { type: "BIOME_RUNS_COMPLETED", biome: "LIBRARY", count: 2 },
      { type: "STORY_UNLOCK", storyId: "le_codex_infini" },
    ],
  },

  // VIKING
  berserker_charge: { type: "BIOME_FIRST_ENTRY", biome: "VIKING" },
  shield_wall: { type: "BIOME_FIRST_ENTRY", biome: "VIKING" },
  rune_strike: { type: "BIOME_ELITE_KILLS", biome: "VIKING", count: 1 },
  mjolnir_echo: { type: "BIOME_BOSS_KILLS", biome: "VIKING", count: 1 },
  saga_of_blood: { type: "STORY_UNLOCK", storyId: "saga_de_ragnar" },

  // GREEK
  olympian_guard: { type: "BIOME_FIRST_ENTRY", biome: "GREEK" },
  lightning_bolt: { type: "BIOME_FIRST_ENTRY", biome: "GREEK" },
  gorgons_gaze: { type: "BIOME_ELITE_KILLS", biome: "GREEK", count: 1 },
  icarus_wings: { type: "BIOME_BOSS_KILLS", biome: "GREEK", count: 1 },
  labyrinth: { type: "STORY_UNLOCK", storyId: "l_odyssee" },

  // EGYPTIAN
  anubis_strike: { type: "BIOME_FIRST_ENTRY", biome: "EGYPTIAN" },
  canopic_ward: { type: "BIOME_FIRST_ENTRY", biome: "EGYPTIAN" },
  pharaohs_curse: { type: "BIOME_ELITE_KILLS", biome: "EGYPTIAN", count: 1 },
  eye_of_ra: { type: "BIOME_BOSS_KILLS", biome: "EGYPTIAN", count: 1 },
  mummies_wrath: { type: "STORY_UNLOCK", storyId: "livre_des_morts" },

  // LOVECRAFTIAN
  eldritch_blast: { type: "BIOME_FIRST_ENTRY", biome: "LOVECRAFTIAN" },
  forbidden_whisper: { type: "BIOME_FIRST_ENTRY", biome: "LOVECRAFTIAN" },
  madness_spike: { type: "BIOME_ELITE_KILLS", biome: "LOVECRAFTIAN", count: 1 },
  void_shield: { type: "BIOME_BOSS_KILLS", biome: "LOVECRAFTIAN", count: 1 },
  starborn_omen: { type: "STORY_UNLOCK", storyId: "necronomicon_fragment" },

  // AZTEC
  obsidian_jab: { type: "BIOME_FIRST_ENTRY", biome: "AZTEC" },
  sun_ritual: { type: "BIOME_FIRST_ENTRY", biome: "AZTEC" },
  blood_offering: { type: "BIOME_ELITE_KILLS", biome: "AZTEC", count: 1 },
  jaguar_pounce: { type: "BIOME_BOSS_KILLS", biome: "AZTEC", count: 1 },
  eclipse_vow: { type: "BIOME_RUNS_COMPLETED", biome: "AZTEC", count: 2 },

  // CELTIC
  thorn_slash: { type: "BIOME_FIRST_ENTRY", biome: "CELTIC" },
  oak_guard: { type: "BIOME_FIRST_ENTRY", biome: "CELTIC" },
  druids_breath: { type: "BIOME_ELITE_KILLS", biome: "CELTIC", count: 1 },
  stag_charge: { type: "BIOME_BOSS_KILLS", biome: "CELTIC", count: 1 },
  ancient_grove: { type: "STORY_UNLOCK", storyId: "mabinogion" },

  // RUSSIAN
  frost_nail: { type: "BIOME_FIRST_ENTRY", biome: "RUSSIAN" },
  iron_samovar: { type: "BIOME_FIRST_ENTRY", biome: "RUSSIAN" },
  winter_ballad: { type: "BIOME_ELITE_KILLS", biome: "RUSSIAN", count: 1 },
  wolf_hunt: { type: "BIOME_BOSS_KILLS", biome: "RUSSIAN", count: 1 },
  firebird_feather: { type: "STORY_UNLOCK", storyId: "byliny_de_ilya" },

  // AFRICAN
  lion_claw: { type: "BIOME_FIRST_ENTRY", biome: "AFRICAN" },
  mask_dance: { type: "BIOME_FIRST_ENTRY", biome: "AFRICAN" },
  ancestral_drum: { type: "BIOME_ELITE_KILLS", biome: "AFRICAN", count: 1 },
  trickster_snare: { type: "BIOME_BOSS_KILLS", biome: "AFRICAN", count: 1 },
  griot_legacy: { type: "BIOME_RUNS_COMPLETED", biome: "AFRICAN", count: 2 },
};

function defaultProgress(): CardUnlockProgress {
  return {
    enteredBiomes: {},
    biomeRunsCompleted: {},
    eliteKillsByBiome: {},
    bossKillsByBiome: {},
  };
}

function progressKey(prefix: string, biome: BiomeType): string {
  return `__${prefix}_${biome}`;
}

export function readUnlockProgressFromResources(
  resources: Record<string, number>
): CardUnlockProgress {
  const progress = defaultProgress();
  for (const biome of BIOMES) {
    progress.enteredBiomes[biome] =
      resources[progressKey("BIOME_ENTERED", biome)] ?? 0;
    progress.biomeRunsCompleted[biome] =
      resources[progressKey("BIOME_RUNS", biome)] ?? 0;
    progress.eliteKillsByBiome[biome] =
      resources[progressKey("BIOME_ELITE_KILLS", biome)] ?? 0;
    progress.bossKillsByBiome[biome] =
      resources[progressKey("BIOME_BOSS_KILLS", biome)] ?? 0;
  }
  // Library is always considered entered.
  progress.enteredBiomes.LIBRARY = Math.max(
    1,
    progress.enteredBiomes.LIBRARY ?? 0
  );
  return progress;
}

export function writeUnlockProgressToResources(
  resources: Record<string, number>,
  progress: CardUnlockProgress
): Record<string, number> {
  const next = { ...resources };
  for (const biome of BIOMES) {
    next[progressKey("BIOME_ENTERED", biome)] =
      progress.enteredBiomes[biome] ?? 0;
    next[progressKey("BIOME_RUNS", biome)] =
      progress.biomeRunsCompleted[biome] ?? 0;
    next[progressKey("BIOME_ELITE_KILLS", biome)] =
      progress.eliteKillsByBiome[biome] ?? 0;
    next[progressKey("BIOME_BOSS_KILLS", biome)] =
      progress.bossKillsByBiome[biome] ?? 0;
  }
  return next;
}

function getRuleByCardId(
  allCards: CardDefinition[]
): Map<string, CardUnlockRule> {
  const rules = new Map<string, CardUnlockRule>();

  for (const card of allCards) {
    if (card.isStarterCard || card.isCollectible === false) continue;

    const explicitRule = EXPLICIT_CARD_UNLOCK_RULES[card.id];
    if (explicitRule) {
      rules.set(card.id, explicitRule);
      continue;
    }

    if (card.biome === "LIBRARY") {
      rules.set(card.id, { type: "ALWAYS" });
      continue;
    }

    if (!explicitRule) {
      throw new Error(
        `Missing explicit unlock rule for card '${card.id}' (${card.biome}).`
      );
    }
  }

  return rules;
}

function isRuleUnlocked(
  rule: CardUnlockRule | undefined,
  progress: CardUnlockProgress,
  unlockedStoryIds: string[]
): boolean {
  if (!rule) return true;
  switch (rule.type) {
    case "ALWAYS":
      return true;
    case "BIOME_FIRST_ENTRY":
      return (progress.enteredBiomes[rule.biome] ?? 0) >= 1;
    case "BIOME_ELITE_KILLS":
      return (progress.eliteKillsByBiome[rule.biome] ?? 0) >= rule.count;
    case "BIOME_BOSS_KILLS":
      return (progress.bossKillsByBiome[rule.biome] ?? 0) >= rule.count;
    case "BIOME_RUNS_COMPLETED":
      return (progress.biomeRunsCompleted[rule.biome] ?? 0) >= rule.count;
    case "STORY_UNLOCK":
      return unlockedStoryIds.includes(rule.storyId);
    case "ALL_OF":
      return rule.rules.every((r) =>
        isRuleUnlocked(r, progress, unlockedStoryIds)
      );
  }
}

function formatBiome(biome: BiomeType): string {
  return biome;
}

function formatRuleCondition(rule: CardUnlockRule): string {
  switch (rule.type) {
    case "ALWAYS":
      return "Toujours debloquee";
    case "BIOME_FIRST_ENTRY":
      return `Entrer dans le biome ${formatBiome(rule.biome)} (1 fois)`;
    case "BIOME_ELITE_KILLS":
      return `Tuer ${rule.count} elite dans ${formatBiome(rule.biome)}`;
    case "BIOME_BOSS_KILLS":
      return `Tuer ${rule.count} boss dans ${formatBiome(rule.biome)}`;
    case "BIOME_RUNS_COMPLETED":
      return `Finir ${rule.count} run(s) dans ${formatBiome(rule.biome)}`;
    case "STORY_UNLOCK":
      return `Debloquer l'histoire ${rule.storyId}`;
    case "ALL_OF":
      return rule.rules.map((r) => formatRuleCondition(r)).join(" + ");
  }
}

function getMissingRule(
  rule: CardUnlockRule,
  progress: CardUnlockProgress,
  unlockedStoryIds: string[]
): CardUnlockRule | null {
  if (isRuleUnlocked(rule, progress, unlockedStoryIds)) return null;
  if (rule.type !== "ALL_OF") return rule;
  for (const subRule of rule.rules) {
    const missing = getMissingRule(subRule, progress, unlockedStoryIds);
    if (missing) return missing;
  }
  return null;
}

function formatRuleProgress(
  rule: CardUnlockRule,
  progress: CardUnlockProgress,
  unlockedStoryIds: string[]
): string | null {
  switch (rule.type) {
    case "ALWAYS":
      return null;
    case "BIOME_FIRST_ENTRY": {
      const current = Math.min(1, progress.enteredBiomes[rule.biome] ?? 0);
      return `${current}/1`;
    }
    case "BIOME_ELITE_KILLS": {
      const current = Math.min(
        rule.count,
        progress.eliteKillsByBiome[rule.biome] ?? 0
      );
      return `${current}/${rule.count}`;
    }
    case "BIOME_BOSS_KILLS": {
      const current = Math.min(
        rule.count,
        progress.bossKillsByBiome[rule.biome] ?? 0
      );
      return `${current}/${rule.count}`;
    }
    case "BIOME_RUNS_COMPLETED": {
      const current = Math.min(
        rule.count,
        progress.biomeRunsCompleted[rule.biome] ?? 0
      );
      return `${current}/${rule.count}`;
    }
    case "STORY_UNLOCK":
      return unlockedStoryIds.includes(rule.storyId) ? "1/1" : "0/1";
    case "ALL_OF": {
      const total = rule.rules.length;
      const done = rule.rules.filter((r) =>
        isRuleUnlocked(r, progress, unlockedStoryIds)
      ).length;
      return `${done}/${total} objectifs`;
    }
  }
}

export function computeUnlockedCardIds(
  allCards: CardDefinition[],
  progress: CardUnlockProgress,
  unlockedStoryIds: string[]
): string[] {
  const ruleByCardId = getRuleByCardId(allCards);
  const unlocked: string[] = [];
  for (const card of allCards) {
    if (card.isStarterCard || card.isCollectible === false) continue;
    if (isRuleUnlocked(ruleByCardId.get(card.id), progress, unlockedStoryIds)) {
      unlocked.push(card.id);
    }
  }
  return unlocked;
}

export function getCardUnlockDetails(
  allCards: CardDefinition[],
  progress: CardUnlockProgress,
  unlockedStoryIds: string[]
): Record<string, CardUnlockDetail> {
  const ruleByCardId = getRuleByCardId(allCards);
  const result: Record<string, CardUnlockDetail> = {};

  for (const card of allCards) {
    if (card.isStarterCard || card.isCollectible === false) continue;
    const rule = ruleByCardId.get(card.id) ?? { type: "ALWAYS" as const };
    const unlocked = isRuleUnlocked(rule, progress, unlockedStoryIds);
    const missingRule = unlocked
      ? null
      : getMissingRule(rule, progress, unlockedStoryIds);
    result[card.id] = {
      unlocked,
      condition: formatRuleCondition(rule),
      missingCondition: missingRule ? formatRuleCondition(missingRule) : null,
      progress: formatRuleProgress(rule, progress, unlockedStoryIds),
    };
  }

  return result;
}

export function onEnterBiome(
  progress: CardUnlockProgress,
  biome: BiomeType
): CardUnlockProgress {
  return {
    ...progress,
    enteredBiomes: {
      ...progress.enteredBiomes,
      [biome]: Math.max(1, progress.enteredBiomes[biome] ?? 0),
    },
  };
}

export function onEliteKilled(
  progress: CardUnlockProgress,
  biome: BiomeType
): CardUnlockProgress {
  return {
    ...progress,
    eliteKillsByBiome: {
      ...progress.eliteKillsByBiome,
      [biome]: (progress.eliteKillsByBiome[biome] ?? 0) + 1,
    },
  };
}

export function onBossKilled(
  progress: CardUnlockProgress,
  biome: BiomeType
): CardUnlockProgress {
  return {
    ...progress,
    bossKillsByBiome: {
      ...progress.bossKillsByBiome,
      [biome]: (progress.bossKillsByBiome[biome] ?? 0) + 1,
    },
    biomeRunsCompleted: {
      ...progress.biomeRunsCompleted,
      [biome]: (progress.biomeRunsCompleted[biome] ?? 0) + 1,
    },
  };
}

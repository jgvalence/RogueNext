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
  | { type: "ENEMY_KILLS"; enemyId: string; count: number }
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

const BESTIARY_NORMAL_UNLOCK_PREFIX = "bestiary_normal_";
const BESTIARY_ELITE_UNLOCK_PREFIX = "bestiary_elite_";

// Explicit unlock rules by card id.
// Any non-LIBRARY collectible card must appear here.
// LIBRARY cards may also appear here to create meta progression inside the base biome.
// LIBRARY progression curve:
// - Early: fast unlocks (first elite / first stories)
// - Mid: first boss and tier-2 stories
// - Late: combined goals (boss + story / runs + story)
const EXPLICIT_CARD_UNLOCK_RULES: Record<string, CardUnlockRule> = {
  // LIBRARY (early)
  mythic_blow: { type: "BIOME_ELITE_KILLS", biome: "LIBRARY", count: 1 },
  annotated_thesis: { type: "STORY_UNLOCK", storyId: "encyclopedie_du_savoir" },
  quick_feint: { type: "BIOME_ELITE_KILLS", biome: "LIBRARY", count: 1 },
  bastion_crash: { type: "BIOME_BOSS_KILLS", biome: "LIBRARY", count: 1 },
  venom_echo: {
    type: "ALL_OF",
    rules: [
      { type: "BIOME_BOSS_KILLS", biome: "LIBRARY", count: 1 },
      { type: "STORY_UNLOCK", storyId: "grimoire_des_index" },
    ],
  },

  // LIBRARY (mid)
  rage_of_ages: { type: "BIOME_BOSS_KILLS", biome: "LIBRARY", count: 1 },
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
  valkyries_dive: { type: "BIOME_BOSS_KILLS", biome: "VIKING", count: 2 },
  saga_of_blood: { type: "STORY_UNLOCK", storyId: "saga_de_ragnar" },
  // VIKING — Scribe (new)
  iron_verse: { type: "BIOME_FIRST_ENTRY", biome: "VIKING" },
  frost_rune_shield: { type: "BIOME_FIRST_ENTRY", biome: "VIKING" },
  scald_cry: { type: "BIOME_ELITE_KILLS", biome: "VIKING", count: 1 },
  rune_storm: { type: "BIOME_ELITE_KILLS", biome: "VIKING", count: 2 },
  battle_inscription: { type: "BIOME_ELITE_KILLS", biome: "VIKING", count: 3 },
  odin_script: { type: "BIOME_BOSS_KILLS", biome: "VIKING", count: 1 },
  epic_saga: { type: "BIOME_BOSS_KILLS", biome: "VIKING", count: 2 },
  // VIKING — Bibliothécaire (new)
  nordic_treatise: { type: "BIOME_FIRST_ENTRY", biome: "VIKING" },
  rune_curse: { type: "BIOME_FIRST_ENTRY", biome: "VIKING" },
  saga_archive: { type: "BIOME_ELITE_KILLS", biome: "VIKING", count: 2 },
  norn_prophecy: { type: "BIOME_ELITE_KILLS", biome: "VIKING", count: 3 },
  ancient_ward: { type: "BIOME_BOSS_KILLS", biome: "VIKING", count: 1 },
  saga_keeper: { type: "BIOME_BOSS_KILLS", biome: "VIKING", count: 1 },
  valhalla_codex: { type: "BIOME_BOSS_KILLS", biome: "VIKING", count: 2 },

  // GREEK
  olympian_guard: { type: "BIOME_FIRST_ENTRY", biome: "GREEK" },
  gorgons_gaze: { type: "BIOME_ELITE_KILLS", biome: "GREEK", count: 1 },
  heros_challenge: { type: "BIOME_ELITE_KILLS", biome: "GREEK", count: 2 },
  olympian_cleave: { type: "BIOME_BOSS_KILLS", biome: "GREEK", count: 1 },
  labyrinth: { type: "STORY_UNLOCK", storyId: "l_odyssee" },
  // GREEK — Scribe (new)
  logos_strike: { type: "BIOME_FIRST_ENTRY", biome: "GREEK" },
  philosophers_quill: { type: "BIOME_FIRST_ENTRY", biome: "GREEK" },
  epic_simile: { type: "BIOME_ELITE_KILLS", biome: "GREEK", count: 1 },
  hermes_dash: { type: "BIOME_ELITE_KILLS", biome: "GREEK", count: 1 },
  written_prophecy: { type: "BIOME_ELITE_KILLS", biome: "GREEK", count: 2 },
  titans_wrath: { type: "BIOME_ELITE_KILLS", biome: "GREEK", count: 3 },
  ares_verse: { type: "BIOME_ELITE_KILLS", biome: "GREEK", count: 2 },
  olympian_scripture: { type: "BIOME_BOSS_KILLS", biome: "GREEK", count: 1 },
  // GREEK — Bibliothécaire (new)
  oracle_scroll: { type: "BIOME_FIRST_ENTRY", biome: "GREEK" },
  shield_of_athena: { type: "BIOME_FIRST_ENTRY", biome: "GREEK" },
  sphinx_riddle: { type: "BIOME_ELITE_KILLS", biome: "GREEK", count: 2 },
  apollos_archive: { type: "BIOME_ELITE_KILLS", biome: "GREEK", count: 3 },
  labyrinth_trap: { type: "BIOME_ELITE_KILLS", biome: "GREEK", count: 3 },
  pythian_codex: { type: "BIOME_BOSS_KILLS", biome: "GREEK", count: 1 },
  fates_decree: { type: "BIOME_BOSS_KILLS", biome: "GREEK", count: 2 },

  // EGYPTIAN
  anubis_strike: { type: "BIOME_FIRST_ENTRY", biome: "EGYPTIAN" },
  canopic_ward: { type: "BIOME_FIRST_ENTRY", biome: "EGYPTIAN" },
  pharaohs_curse: { type: "BIOME_ELITE_KILLS", biome: "EGYPTIAN", count: 1 },
  sand_whip: { type: "BIOME_ELITE_KILLS", biome: "EGYPTIAN", count: 2 },
  eye_of_ra: { type: "BIOME_BOSS_KILLS", biome: "EGYPTIAN", count: 1 },
  solar_hymn: { type: "BIOME_BOSS_KILLS", biome: "EGYPTIAN", count: 2 },
  // EGYPTIAN — Scribe (new)
  hieroglyph_strike: { type: "BIOME_FIRST_ENTRY", biome: "EGYPTIAN" },
  sacred_papyrus: { type: "BIOME_FIRST_ENTRY", biome: "EGYPTIAN" },
  spell_inscription: { type: "BIOME_ELITE_KILLS", biome: "EGYPTIAN", count: 1 },
  book_of_ra: { type: "BIOME_ELITE_KILLS", biome: "EGYPTIAN", count: 2 },
  sacred_ink_burst: { type: "BIOME_ELITE_KILLS", biome: "EGYPTIAN", count: 3 },
  scribes_judgment: { type: "BIOME_BOSS_KILLS", biome: "EGYPTIAN", count: 1 },
  // EGYPTIAN — Bibliothécaire (new)
  death_scroll: { type: "BIOME_FIRST_ENTRY", biome: "EGYPTIAN" },
  mummy_ward: { type: "BIOME_FIRST_ENTRY", biome: "EGYPTIAN" },
  plague_of_words: { type: "BIOME_ELITE_KILLS", biome: "EGYPTIAN", count: 1 },
  osiris_archive: { type: "BIOME_ELITE_KILLS", biome: "EGYPTIAN", count: 2 },
  funerary_rite: { type: "BIOME_ELITE_KILLS", biome: "EGYPTIAN", count: 3 },
  desert_wisdom: { type: "BIOME_BOSS_KILLS", biome: "EGYPTIAN", count: 1 },
  embalmed_tome: { type: "BIOME_BOSS_KILLS", biome: "EGYPTIAN", count: 1 },
  book_of_the_dead: { type: "BIOME_BOSS_KILLS", biome: "EGYPTIAN", count: 2 },

  // LOVECRAFTIAN
  forbidden_whisper: { type: "BIOME_FIRST_ENTRY", biome: "LOVECRAFTIAN" },
  madness_spike: { type: "BIOME_ELITE_KILLS", biome: "LOVECRAFTIAN", count: 1 },
  void_touch: { type: "BIOME_ELITE_KILLS", biome: "LOVECRAFTIAN", count: 2 },
  void_shield: { type: "BIOME_BOSS_KILLS", biome: "LOVECRAFTIAN", count: 1 },
  eldritch_pact: { type: "BIOME_BOSS_KILLS", biome: "LOVECRAFTIAN", count: 2 },
  starborn_omen: { type: "STORY_UNLOCK", storyId: "necronomicon_fragment" },
  // LOVECRAFTIAN — Scribe (new)
  void_quill: { type: "BIOME_FIRST_ENTRY", biome: "LOVECRAFTIAN" },
  cursed_inscription: { type: "BIOME_FIRST_ENTRY", biome: "LOVECRAFTIAN" },
  black_page: { type: "BIOME_ELITE_KILLS", biome: "LOVECRAFTIAN", count: 1 },
  forbidden_verse: {
    type: "BIOME_ELITE_KILLS",
    biome: "LOVECRAFTIAN",
    count: 2,
  },
  eldritch_script: {
    type: "BIOME_ELITE_KILLS",
    biome: "LOVECRAFTIAN",
    count: 3,
  },
  necrotic_words: {
    type: "BIOME_ELITE_KILLS",
    biome: "LOVECRAFTIAN",
    count: 3,
  },
  void_scripture: { type: "BIOME_BOSS_KILLS", biome: "LOVECRAFTIAN", count: 1 },
  // LOVECRAFTIAN — Bibliothécaire (new)
  sealed_tome: { type: "BIOME_FIRST_ENTRY", biome: "LOVECRAFTIAN" },
  library_horror: { type: "BIOME_FIRST_ENTRY", biome: "LOVECRAFTIAN" },
  readers_pact: { type: "BIOME_ELITE_KILLS", biome: "LOVECRAFTIAN", count: 2 },
  forbidden_index: {
    type: "BIOME_ELITE_KILLS",
    biome: "LOVECRAFTIAN",
    count: 2,
  },
  void_librarian: {
    type: "BIOME_ELITE_KILLS",
    biome: "LOVECRAFTIAN",
    count: 3,
  },
  necronomicon_page: {
    type: "BIOME_BOSS_KILLS",
    biome: "LOVECRAFTIAN",
    count: 1,
  },
  cosmic_archive: { type: "BIOME_BOSS_KILLS", biome: "LOVECRAFTIAN", count: 2 },

  // AZTEC
  obsidian_jab: { type: "BIOME_FIRST_ENTRY", biome: "AZTEC" },
  sun_ritual: { type: "BIOME_FIRST_ENTRY", biome: "AZTEC" },
  blood_offering: { type: "BIOME_ELITE_KILLS", biome: "AZTEC", count: 1 },
  jaguar_pounce: { type: "BIOME_BOSS_KILLS", biome: "AZTEC", count: 1 },
  jaguars_blood: { type: "BIOME_BOSS_KILLS", biome: "AZTEC", count: 2 },
  eclipse_vow: { type: "BIOME_RUNS_COMPLETED", biome: "AZTEC", count: 2 },
  // AZTEC — Scribe (new)
  obsidian_quill: { type: "BIOME_FIRST_ENTRY", biome: "AZTEC" },
  codex_strike: { type: "BIOME_FIRST_ENTRY", biome: "AZTEC" },
  sacrificial_word: { type: "BIOME_ELITE_KILLS", biome: "AZTEC", count: 1 },
  xipe_shield: { type: "BIOME_ELITE_KILLS", biome: "AZTEC", count: 2 },
  sun_codex: { type: "BIOME_ELITE_KILLS", biome: "AZTEC", count: 3 },
  hummingbird_strike: { type: "BIOME_BOSS_KILLS", biome: "AZTEC", count: 1 },
  blood_codex: { type: "BIOME_BOSS_KILLS", biome: "AZTEC", count: 2 },
  // AZTEC — Bibliothécaire (new)
  calendric_ward: { type: "BIOME_FIRST_ENTRY", biome: "AZTEC" },
  poison_herb: { type: "BIOME_FIRST_ENTRY", biome: "AZTEC" },
  star_chart: { type: "BIOME_ELITE_KILLS", biome: "AZTEC", count: 1 },
  quetzal_shield: { type: "BIOME_ELITE_KILLS", biome: "AZTEC", count: 2 },
  temple_archive: { type: "BIOME_ELITE_KILLS", biome: "AZTEC", count: 3 },
  obsidian_ward: { type: "BIOME_BOSS_KILLS", biome: "AZTEC", count: 1 },
  feathered_serpent: { type: "BIOME_BOSS_KILLS", biome: "AZTEC", count: 2 },

  // CELTIC
  thorn_slash: { type: "BIOME_FIRST_ENTRY", biome: "CELTIC" },
  druids_breath: { type: "BIOME_ELITE_KILLS", biome: "CELTIC", count: 1 },
  faerie_fire: { type: "BIOME_ELITE_KILLS", biome: "CELTIC", count: 2 },
  wild_gale: { type: "BIOME_BOSS_KILLS", biome: "CELTIC", count: 1 },
  ancient_grove: { type: "STORY_UNLOCK", storyId: "mabinogion" },
  // CELTIC — Scribe (new)
  kells_strike: { type: "BIOME_FIRST_ENTRY", biome: "CELTIC" },
  bardic_verse: { type: "BIOME_FIRST_ENTRY", biome: "CELTIC" },
  illuminated_shield: { type: "BIOME_ELITE_KILLS", biome: "CELTIC", count: 1 },
  iron_bard: { type: "BIOME_ELITE_KILLS", biome: "CELTIC", count: 1 },
  triquetra_mark: { type: "BIOME_ELITE_KILLS", biome: "CELTIC", count: 2 },
  ogham_inscription: { type: "BIOME_ELITE_KILLS", biome: "CELTIC", count: 3 },
  celtic_illumination: { type: "BIOME_BOSS_KILLS", biome: "CELTIC", count: 1 },
  green_man_verse: { type: "BIOME_BOSS_KILLS", biome: "CELTIC", count: 2 },
  // CELTIC — Bibliothécaire (new)
  herb_lore: { type: "BIOME_FIRST_ENTRY", biome: "CELTIC" },
  fairy_veil: { type: "BIOME_FIRST_ENTRY", biome: "CELTIC" },
  morrigan_curse: { type: "BIOME_ELITE_KILLS", biome: "CELTIC", count: 1 },
  cauldron_lore: { type: "BIOME_ELITE_KILLS", biome: "CELTIC", count: 2 },
  selkie_song: { type: "BIOME_ELITE_KILLS", biome: "CELTIC", count: 3 },
  ancient_manuscript: { type: "BIOME_BOSS_KILLS", biome: "CELTIC", count: 1 },
  world_tree: { type: "BIOME_BOSS_KILLS", biome: "CELTIC", count: 2 },

  // RUSSIAN
  frost_nail: { type: "BIOME_FIRST_ENTRY", biome: "RUSSIAN" },
  iron_samovar: { type: "BIOME_FIRST_ENTRY", biome: "RUSSIAN" },
  bear_claw: { type: "BIOME_ELITE_KILLS", biome: "RUSSIAN", count: 2 },
  permafrost_ward: { type: "BIOME_BOSS_KILLS", biome: "RUSSIAN", count: 1 },
  // RUSSIAN — Scribe (new)
  byliny_verse: { type: "BIOME_FIRST_ENTRY", biome: "RUSSIAN" },
  bogatyr_strike: { type: "BIOME_FIRST_ENTRY", biome: "RUSSIAN" },
  winter_inscription: { type: "BIOME_ELITE_KILLS", biome: "RUSSIAN", count: 1 },
  blizzard_verse: { type: "BIOME_ELITE_KILLS", biome: "RUSSIAN", count: 1 },
  firebird_script: { type: "BIOME_ELITE_KILLS", biome: "RUSSIAN", count: 2 },
  baba_yaga_deal: { type: "BIOME_ELITE_KILLS", biome: "RUSSIAN", count: 3 },
  koschei_strike: { type: "BIOME_BOSS_KILLS", biome: "RUSSIAN", count: 1 },
  folk_epic: { type: "BIOME_BOSS_KILLS", biome: "RUSSIAN", count: 2 },
  // RUSSIAN — Bibliothécaire (new)
  fur_binding: { type: "BIOME_FIRST_ENTRY", biome: "RUSSIAN" },
  folk_curse: { type: "BIOME_FIRST_ENTRY", biome: "RUSSIAN" },
  matryoshka_lore: { type: "BIOME_ELITE_KILLS", biome: "RUSSIAN", count: 1 },
  snowstorm_trap: { type: "BIOME_ELITE_KILLS", biome: "RUSSIAN", count: 2 },
  leshy_ward: { type: "BIOME_ELITE_KILLS", biome: "RUSSIAN", count: 3 },
  zhar_ptitsa: { type: "BIOME_ELITE_KILLS", biome: "RUSSIAN", count: 3 },
  folklore_archive: { type: "BIOME_BOSS_KILLS", biome: "RUSSIAN", count: 1 },
  frost_witch: { type: "BIOME_BOSS_KILLS", biome: "RUSSIAN", count: 2 },

  // AFRICAN
  ancestral_drum: { type: "BIOME_FIRST_ENTRY", biome: "AFRICAN" },
  spirit_drum: { type: "BIOME_ELITE_KILLS", biome: "AFRICAN", count: 2 },
  trickster_snare: { type: "BIOME_BOSS_KILLS", biome: "AFRICAN", count: 1 },
  anansis_web: { type: "BIOME_BOSS_KILLS", biome: "AFRICAN", count: 2 },
  griot_legacy: { type: "BIOME_RUNS_COMPLETED", biome: "AFRICAN", count: 2 },
  // AFRICAN — Scribe (new)
  drum_strike: { type: "BIOME_FIRST_ENTRY", biome: "AFRICAN" },
  war_dance: { type: "BIOME_FIRST_ENTRY", biome: "AFRICAN" },
  ink_of_ancestors: { type: "BIOME_ELITE_KILLS", biome: "AFRICAN", count: 1 },
  griot_strike: { type: "BIOME_ELITE_KILLS", biome: "AFRICAN", count: 1 },
  anansi_tale: { type: "BIOME_ELITE_KILLS", biome: "AFRICAN", count: 2 },
  buffalo_charge: { type: "BIOME_ELITE_KILLS", biome: "AFRICAN", count: 3 },
  ancestral_verse: { type: "BIOME_BOSS_KILLS", biome: "AFRICAN", count: 1 },
  sunbird_power: { type: "BIOME_BOSS_KILLS", biome: "AFRICAN", count: 2 },
  // AFRICAN — Bibliothécaire (new)
  spider_web: { type: "BIOME_FIRST_ENTRY", biome: "AFRICAN" },
  baobab_shield: { type: "BIOME_FIRST_ENTRY", biome: "AFRICAN" },
  healing_rhythm: { type: "BIOME_ELITE_KILLS", biome: "AFRICAN", count: 1 },
  oral_history: { type: "BIOME_ELITE_KILLS", biome: "AFRICAN", count: 2 },
  trickster_lore: { type: "BIOME_ELITE_KILLS", biome: "AFRICAN", count: 3 },
  ancestor_archive: { type: "BIOME_BOSS_KILLS", biome: "AFRICAN", count: 1 },
  cosmic_spider: { type: "BIOME_BOSS_KILLS", biome: "AFRICAN", count: 2 },
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

    const generatedBestiaryRule = getGeneratedBestiaryRule(card.id);
    if (generatedBestiaryRule) {
      rules.set(card.id, generatedBestiaryRule);
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

function getGeneratedBestiaryRule(cardId: string): CardUnlockRule | null {
  if (cardId.startsWith(BESTIARY_NORMAL_UNLOCK_PREFIX)) {
    const enemyId = cardId.slice(BESTIARY_NORMAL_UNLOCK_PREFIX.length);
    if (enemyId.length === 0) return null;
    return {
      type: "ENEMY_KILLS",
      enemyId,
      count: 15,
    };
  }

  if (cardId.startsWith(BESTIARY_ELITE_UNLOCK_PREFIX)) {
    const enemyId = cardId.slice(BESTIARY_ELITE_UNLOCK_PREFIX.length);
    if (enemyId.length === 0) return null;
    return {
      type: "ENEMY_KILLS",
      enemyId,
      count: 5,
    };
  }

  return null;
}

function isRuleUnlocked(
  rule: CardUnlockRule | undefined,
  progress: CardUnlockProgress,
  unlockedStoryIds: string[],
  enemyKillCounts: Record<string, number>
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
    case "ENEMY_KILLS":
      return (enemyKillCounts[rule.enemyId] ?? 0) >= rule.count;
    case "STORY_UNLOCK":
      return unlockedStoryIds.includes(rule.storyId);
    case "ALL_OF":
      return rule.rules.every((r) =>
        isRuleUnlocked(r, progress, unlockedStoryIds, enemyKillCounts)
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
    case "ENEMY_KILLS":
      return `Tuer ${rule.count}x ${rule.enemyId}`;
    case "STORY_UNLOCK":
      return `Debloquer l'histoire ${rule.storyId}`;
    case "ALL_OF":
      return rule.rules.map((r) => formatRuleCondition(r)).join(" + ");
  }
}

function getMissingRule(
  rule: CardUnlockRule,
  progress: CardUnlockProgress,
  unlockedStoryIds: string[],
  enemyKillCounts: Record<string, number>
): CardUnlockRule | null {
  if (isRuleUnlocked(rule, progress, unlockedStoryIds, enemyKillCounts)) {
    return null;
  }
  if (rule.type !== "ALL_OF") return rule;
  for (const subRule of rule.rules) {
    const missing = getMissingRule(
      subRule,
      progress,
      unlockedStoryIds,
      enemyKillCounts
    );
    if (missing) return missing;
  }
  return null;
}

function formatRuleProgress(
  rule: CardUnlockRule,
  progress: CardUnlockProgress,
  unlockedStoryIds: string[],
  enemyKillCounts: Record<string, number>
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
    case "ENEMY_KILLS": {
      const current = Math.min(rule.count, enemyKillCounts[rule.enemyId] ?? 0);
      return `${current}/${rule.count}`;
    }
    case "STORY_UNLOCK":
      return unlockedStoryIds.includes(rule.storyId) ? "1/1" : "0/1";
    case "ALL_OF": {
      const total = rule.rules.length;
      const done = rule.rules.filter((r) =>
        isRuleUnlocked(r, progress, unlockedStoryIds, enemyKillCounts)
      ).length;
      return `${done}/${total} objectifs`;
    }
  }
}

export function computeUnlockedCardIds(
  allCards: CardDefinition[],
  progress: CardUnlockProgress,
  unlockedStoryIds: string[],
  enemyKillCounts: Record<string, number> = {}
): string[] {
  const ruleByCardId = getRuleByCardId(allCards);
  const unlocked: string[] = [];
  for (const card of allCards) {
    if (card.isStarterCard || card.isCollectible === false) continue;
    if (
      isRuleUnlocked(
        ruleByCardId.get(card.id),
        progress,
        unlockedStoryIds,
        enemyKillCounts
      )
    ) {
      unlocked.push(card.id);
    }
  }
  return unlocked;
}

export function getCardUnlockDetails(
  allCards: CardDefinition[],
  progress: CardUnlockProgress,
  unlockedStoryIds: string[],
  enemyKillCounts: Record<string, number> = {}
): Record<string, CardUnlockDetail> {
  const ruleByCardId = getRuleByCardId(allCards);
  const result: Record<string, CardUnlockDetail> = {};

  for (const card of allCards) {
    if (card.isStarterCard || card.isCollectible === false) continue;
    const rule = ruleByCardId.get(card.id) ?? { type: "ALWAYS" as const };
    const unlocked = isRuleUnlocked(
      rule,
      progress,
      unlockedStoryIds,
      enemyKillCounts
    );
    const missingRule = unlocked
      ? null
      : getMissingRule(rule, progress, unlockedStoryIds, enemyKillCounts);
    result[card.id] = {
      unlocked,
      condition: formatRuleCondition(rule),
      missingCondition: missingRule ? formatRuleCondition(missingRule) : null,
      progress: formatRuleProgress(
        rule,
        progress,
        unlockedStoryIds,
        enemyKillCounts
      ),
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

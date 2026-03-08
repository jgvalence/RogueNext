import { enemyDefinitions } from "./enemies";

export const NORMAL_ENEMY_MASTERY_KILL_THRESHOLD = 5;
export const ELITE_ENEMY_MASTERY_KILL_THRESHOLD = 3;
export const BOSS_ENEMY_MASTERY_KILL_THRESHOLD = 2;

export const ENEMIES_WITHOUT_BESTIARY_CARDS = [
  // LIBRARY
  "ink_slime",
  "paper_golem",
  "quill_sprite",
  "tome_wraith",
  "scroll_serpent",
  "ink_archon",
  "tome_colossus",
  "venom_wyrm",
  // VIKING
  "rune_berserker",
  "einherjar",
  "rune_shaman",
  // GREEK
  "lamia",
  "bronze_automaton",
  "lernaean_broodling",
  // EGYPTIAN
  "sand_guardian",
  "mummy_knight",
  "apep_scion",
  "wadjet_guardian",
  // LOVECRAFTIAN
  "shoggoth_spawn",
  "void_tendril",
  "mi_go_surgeon",
  // AZTEC
  "stone_idol",
  "flayed_cultist",
  "obsidian_priest",
  // CELTIC
  "bog_beast",
  "druid_apprentice",
  "amber_hound",
  // RUSSIAN
  "czar_guard",
  "iron_cossack",
  "kikimora",
  // AFRICAN
  "oya_harbinger",
  "baobab_giant",
  "impundulu",
] as const;

export const ENEMIES_WITHOUT_BESTIARY_CARDS_SET = new Set<string>(
  ENEMIES_WITHOUT_BESTIARY_CARDS
);

export interface EnemyMasteryRelicUnlockDefinition {
  enemyId: string;
  relicId: string;
  count: number;
}

const ENEMY_BY_ID = new Map(
  enemyDefinitions.map((enemy) => [enemy.id, enemy] as const)
);

export function getEnemyMasteryKillThreshold(
  enemyId: string,
  fallback = NORMAL_ENEMY_MASTERY_KILL_THRESHOLD
): number {
  const enemy = ENEMY_BY_ID.get(enemyId);
  if (enemy?.isBoss) return BOSS_ENEMY_MASTERY_KILL_THRESHOLD;
  if (enemy?.isElite) return ELITE_ENEMY_MASTERY_KILL_THRESHOLD;
  if (enemy) return NORMAL_ENEMY_MASTERY_KILL_THRESHOLD;
  return fallback;
}

// One enemy mastery relic per enemy that no longer has a bestiary card.
export const ENEMY_MASTERY_RELIC_UNLOCKS: EnemyMasteryRelicUnlockDefinition[] =
  [
    // LIBRARY
    {
      enemyId: "ink_slime",
      relicId: "slime_ink_vial",
      count: NORMAL_ENEMY_MASTERY_KILL_THRESHOLD,
    },
    {
      enemyId: "paper_golem",
      relicId: "golem_pulp_core",
      count: NORMAL_ENEMY_MASTERY_KILL_THRESHOLD,
    },
    {
      enemyId: "quill_sprite",
      relicId: "sprite_quill_charm",
      count: NORMAL_ENEMY_MASTERY_KILL_THRESHOLD,
    },
    {
      enemyId: "tome_wraith",
      relicId: "wraith_torn_folio",
      count: NORMAL_ENEMY_MASTERY_KILL_THRESHOLD,
    },
    {
      enemyId: "scroll_serpent",
      relicId: "serpent_scroll_seal",
      count: NORMAL_ENEMY_MASTERY_KILL_THRESHOLD,
    },
    {
      enemyId: "ink_archon",
      relicId: "archon_ink_crown",
      count: ELITE_ENEMY_MASTERY_KILL_THRESHOLD,
    },
    {
      enemyId: "tome_colossus",
      relicId: "colossus_tome_plate",
      count: ELITE_ENEMY_MASTERY_KILL_THRESHOLD,
    },
    {
      enemyId: "venom_wyrm",
      relicId: "wyrm_venom_signet",
      count: ELITE_ENEMY_MASTERY_KILL_THRESHOLD,
    },

    // VIKING
    {
      enemyId: "rune_berserker",
      relicId: "berserker_rune_axehead",
      count: NORMAL_ENEMY_MASTERY_KILL_THRESHOLD,
    },
    {
      enemyId: "einherjar",
      relicId: "einherjar_oath_band",
      count: NORMAL_ENEMY_MASTERY_KILL_THRESHOLD,
    },
    {
      enemyId: "rune_shaman",
      relicId: "shaman_storm_totem",
      count: NORMAL_ENEMY_MASTERY_KILL_THRESHOLD,
    },

    // GREEK
    {
      enemyId: "lamia",
      relicId: "lamia_veil",
      count: NORMAL_ENEMY_MASTERY_KILL_THRESHOLD,
    },
    {
      enemyId: "bronze_automaton",
      relicId: "automaton_bronze_gear",
      count: NORMAL_ENEMY_MASTERY_KILL_THRESHOLD,
    },
    {
      enemyId: "lernaean_broodling",
      relicId: "broodling_hydra_spine",
      count: ELITE_ENEMY_MASTERY_KILL_THRESHOLD,
    },

    // EGYPTIAN
    {
      enemyId: "sand_guardian",
      relicId: "guardian_dune_amulet",
      count: NORMAL_ENEMY_MASTERY_KILL_THRESHOLD,
    },
    {
      enemyId: "mummy_knight",
      relicId: "mummy_linen_knot",
      count: NORMAL_ENEMY_MASTERY_KILL_THRESHOLD,
    },
    {
      enemyId: "apep_scion",
      relicId: "apep_shadow_scale",
      count: NORMAL_ENEMY_MASTERY_KILL_THRESHOLD,
    },
    {
      enemyId: "wadjet_guardian",
      relicId: "wadjet_emerald_eye",
      count: NORMAL_ENEMY_MASTERY_KILL_THRESHOLD,
    },

    // LOVECRAFTIAN
    {
      enemyId: "shoggoth_spawn",
      relicId: "spawn_void_ichor",
      count: NORMAL_ENEMY_MASTERY_KILL_THRESHOLD,
    },
    {
      enemyId: "void_tendril",
      relicId: "tendril_star_knot",
      count: NORMAL_ENEMY_MASTERY_KILL_THRESHOLD,
    },
    {
      enemyId: "mi_go_surgeon",
      relicId: "surgeon_mi_go_tools",
      count: ELITE_ENEMY_MASTERY_KILL_THRESHOLD,
    },

    // AZTEC
    {
      enemyId: "stone_idol",
      relicId: "idol_sun_fragment",
      count: NORMAL_ENEMY_MASTERY_KILL_THRESHOLD,
    },
    {
      enemyId: "flayed_cultist",
      relicId: "cultist_flayed_mask",
      count: NORMAL_ENEMY_MASTERY_KILL_THRESHOLD,
    },
    {
      enemyId: "obsidian_priest",
      relicId: "priest_obsidian_censer",
      count: NORMAL_ENEMY_MASTERY_KILL_THRESHOLD,
    },

    // CELTIC
    {
      enemyId: "bog_beast",
      relicId: "beast_bog_heart",
      count: NORMAL_ENEMY_MASTERY_KILL_THRESHOLD,
    },
    {
      enemyId: "druid_apprentice",
      relicId: "apprentice_oak_scroll",
      count: NORMAL_ENEMY_MASTERY_KILL_THRESHOLD,
    },
    {
      enemyId: "amber_hound",
      relicId: "hound_amber_fang",
      count: NORMAL_ENEMY_MASTERY_KILL_THRESHOLD,
    },

    // RUSSIAN
    {
      enemyId: "czar_guard",
      relicId: "guard_czar_medal",
      count: NORMAL_ENEMY_MASTERY_KILL_THRESHOLD,
    },
    {
      enemyId: "iron_cossack",
      relicId: "cossack_iron_spur",
      count: NORMAL_ENEMY_MASTERY_KILL_THRESHOLD,
    },
    {
      enemyId: "kikimora",
      relicId: "kikimora_night_lantern",
      count: NORMAL_ENEMY_MASTERY_KILL_THRESHOLD,
    },

    // AFRICAN
    {
      enemyId: "oya_harbinger",
      relicId: "harbinger_storm_bell",
      count: ELITE_ENEMY_MASTERY_KILL_THRESHOLD,
    },
    {
      enemyId: "baobab_giant",
      relicId: "giant_baobab_seed",
      count: NORMAL_ENEMY_MASTERY_KILL_THRESHOLD,
    },
    {
      enemyId: "impundulu",
      relicId: "impundulu_thunder_plume",
      count: NORMAL_ENEMY_MASTERY_KILL_THRESHOLD,
    },
  ];

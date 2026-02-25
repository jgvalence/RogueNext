import type { RelicRarity } from "../schemas/enums";

export interface RelicDefinitionData {
  id: string;
  name: string;
  description: string;
  rarity: RelicRarity;
  /** If set, this relic is guaranteed as a choice when this boss is defeated. */
  sourceBossId?: string;
}

export const relicDefinitions: RelicDefinitionData[] = [
  {
    id: "ancient_quill",
    name: "Ancient Quill",
    description: "+2 ink max.",
    rarity: "COMMON",
  },
  {
    id: "energy_crystal",
    name: "Energy Crystal",
    description: "+1 energy per turn.",
    rarity: "RARE",
  },
  {
    id: "bookmark",
    name: "Bookmark",
    description: "Draw 1 extra card per turn.",
    rarity: "UNCOMMON",
  },
  {
    id: "ink_stamp",
    name: "Ink Stamp",
    description: "Start each combat with 3 ink.",
    rarity: "UNCOMMON",
  },
  {
    id: "iron_binding",
    name: "Iron Binding",
    description: "Gain +1 ink when ink-per-card triggers.",
    rarity: "BOSS",
  },
  {
    id: "blighted_compass",
    name: "Blighted Compass",
    description: "+1 draw per turn, but start combat with 1 Weak.",
    rarity: "UNCOMMON",
  },
  {
    id: "cursed_diacrit",
    name: "Cursed Diacrit",
    description: "+1 energy per turn, but add Haunting Regret each combat.",
    rarity: "RARE",
  },
  {
    id: "runic_bulwark",
    name: "Runic Bulwark",
    description: "Retain 50% of your remaining Block each turn.",
    rarity: "RARE",
  },
  {
    id: "eternal_hourglass",
    name: "Eternal Hourglass",
    description: "Unspent energy is conserved between turns.",
    rarity: "RARE",
  },
  {
    id: "briar_codex",
    name: "Briar Codex",
    description: "Start each combat with 2 Thorns.",
    rarity: "UNCOMMON",
  },
  {
    id: "warded_ribbon",
    name: "Warded Ribbon",
    description: "Start each combat with 6 Block.",
    rarity: "COMMON",
  },
  {
    id: "inkwell_reservoir",
    name: "Inkwell Reservoir",
    description: "+1 max ink and start each combat with 1 ink.",
    rarity: "COMMON",
  },
  {
    id: "battle_lexicon",
    name: "Battle Lexicon",
    description: "Start each combat with +1 Strength.",
    rarity: "UNCOMMON",
  },
  {
    id: "omens_compass",
    name: "Omen's Compass",
    description:
      "Boss rewards are more likely to include an additional Boss relic option.",
    rarity: "RARE",
  },
  {
    id: "lucky_charm",
    name: "Lucky Charm",
    description: "Increases loot luck for better rarity rolls.",
    rarity: "UNCOMMON",
  },
  {
    id: "blood_grimoire",
    name: "Blood Grimoire",
    description:
      "Gain 1 max HP per normal enemy killed, 2 per elite, 5 per boss.",
    rarity: "BOSS",
  },

  // ── Boss-specific relics (one per boss, guaranteed drop) ──────────────
  // LIBRARY bosses
  {
    id: "guardians_seal",
    name: "Guardian's Seal",
    description: "+2 max ink. Start each combat with 2 ink.",
    rarity: "BOSS",
    sourceBossId: "chapter_guardian",
  },
  {
    id: "archivists_lens",
    name: "Archivist's Lens",
    description: "+2 max ink. Start each combat with 2 Focus.",
    rarity: "BOSS",
    sourceBossId: "the_archivist",
  },

  // VIKING bosses
  {
    id: "wolf_fang",
    name: "Wolf Fang",
    description: "Start each combat with 2 Strength.",
    rarity: "BOSS",
    sourceBossId: "fenrir",
  },
  {
    id: "hels_crown",
    name: "Hel's Crown",
    description: "Start each combat with 2 Strength and 4 Thorns.",
    rarity: "BOSS",
    sourceBossId: "hel_queen",
  },

  // GREEK bosses
  {
    id: "stone_pendant",
    name: "Stone Pendant",
    description: "Start each combat with 1 Strength and 1 Focus.",
    rarity: "BOSS",
    sourceBossId: "medusa",
  },
  {
    id: "hydra_scale",
    name: "Hydra Scale",
    description: "Start each combat with 1 Strength and 5 Thorns.",
    rarity: "BOSS",
    sourceBossId: "hydra_aspect",
  },

  // EGYPTIAN bosses
  {
    id: "solar_disc",
    name: "Solar Disc",
    description: "+1 max energy. Start each combat with 2 ink.",
    rarity: "BOSS",
    sourceBossId: "ra_avatar",
  },
  {
    id: "eye_of_maat",
    name: "Eye of Maat",
    description: "+1 max energy. Start each combat with 1 Focus.",
    rarity: "BOSS",
    sourceBossId: "osiris_eye",
  },

  // LOVECRAFTIAN bosses
  {
    id: "void_shard",
    name: "Void Shard",
    description: "Start each combat with 2 Focus.",
    rarity: "BOSS",
    sourceBossId: "nyarlathotep_shard",
  },
  {
    id: "shub_idol",
    name: "Shub Idol",
    description: "Start each combat with 2 Strength and 3 ink.",
    rarity: "BOSS",
    sourceBossId: "shub_spawn",
  },

  // AZTEC bosses
  {
    id: "obsidian_mirror",
    name: "Obsidian Mirror",
    description: "Start each combat with 3 Strength.",
    rarity: "BOSS",
    sourceBossId: "tezcatlipoca_echo",
  },
  {
    id: "quetzal_feather",
    name: "Quetzal Feather",
    description: "Start each combat with 1 Strength, 1 Focus, and 1 energy.",
    rarity: "BOSS",
    sourceBossId: "quetzalcoatl_wrath",
  },

  // CELTIC bosses
  {
    id: "dagdas_club",
    name: "Dagda's Club",
    description: "Start each combat with 6 Thorns.",
    rarity: "BOSS",
    sourceBossId: "dagda_shadow",
  },
  {
    id: "cernunnos_horn",
    name: "Cernunnos's Horn",
    description: "Start each combat with 6 Thorns and 1 extra draw.",
    rarity: "BOSS",
    sourceBossId: "cernunnos_shade",
  },

  // RUSSIAN bosses
  {
    id: "yaga_skull",
    name: "Yaga's Skull",
    description: "Start each combat with 1 extra draw and 3 Thorns.",
    rarity: "BOSS",
    sourceBossId: "baba_yaga_hut",
  },
  {
    id: "deathless_bone",
    name: "Deathless Bone",
    description: "+1 max energy. Start each combat with 10 Block.",
    rarity: "BOSS",
    sourceBossId: "koschei_deathless",
  },

  // AFRICAN bosses
  {
    id: "griot_drum",
    name: "Griot's Drum",
    description: "Start each combat with 6 Block and 1 Strength.",
    rarity: "BOSS",
    sourceBossId: "soundiata_spirit",
  },
  {
    id: "weavers_thread",
    name: "Weaver's Thread",
    description: "Start each combat with 1 extra draw and 2 Focus.",
    rarity: "BOSS",
    sourceBossId: "anansi_weaver",
  },

  // ── Relics with recurring / reactive mechanics ────────────────────────
  // Turn-start
  {
    id: "thorn_mantle",
    name: "Thorn Mantle",
    description: "Gain 1 Thorn at the start of each turn.",
    rarity: "UNCOMMON",
  },
  {
    id: "spectral_inkwell",
    name: "Spectral Inkwell",
    description: "Gain 1 Ink at the start of each turn.",
    rarity: "UNCOMMON",
  },
  {
    id: "fading_grimoire",
    name: "Fading Grimoire",
    description: "Gain 1 Strength at the start of each turn.",
    rarity: "RARE",
  },

  // Turn-end
  {
    id: "iron_codex",
    name: "Iron Codex",
    description:
      "At the end of your turn, gain 1 Block per card still in hand.",
    rarity: "RARE",
  },
  {
    id: "resonant_quill",
    name: "Resonant Quill",
    description:
      "At the end of your turn, gain 1 Ink per unplayed card (max 3).",
    rarity: "UNCOMMON",
  },
  {
    id: "ember_seal",
    name: "Ember Seal",
    description: "At the end of your turn, gain 3 Block per unspent Energy.",
    rarity: "RARE",
  },

  // Card-played
  {
    id: "scholars_stone",
    name: "Scholar's Stone",
    description: "Each Attack card played grants 1 Ink.",
    rarity: "UNCOMMON",
  },
  {
    id: "reactive_binding",
    name: "Reactive Binding",
    description: "Each Skill card played grants 1 Block.",
    rarity: "UNCOMMON",
  },
];

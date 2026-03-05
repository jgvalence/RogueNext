export interface RelicUnlockRequirementData {
  totalRuns?: number;
  wonRuns?: number;
  winsByDifficulty?: Record<string, number>;
  bestGoldInSingleRun?: number;
  enemyKills?: {
    enemyId: string;
    count: number;
  };
}

export const RELIC_UNLOCK_REQUIREMENTS_FROM_DOC: Record<
  string,
  RelicUnlockRequirementData
> = {
  colossus_tome_plate: { enemyKills: { count: 5, enemyId: "tome_colossus" } },
  giant_baobab_seed: { enemyKills: { count: 15, enemyId: "baobab_giant" } },
  slime_ink_vial: { enemyKills: { count: 15, enemyId: "ink_slime" } },
  apep_shadow_scale: { enemyKills: { count: 15, enemyId: "apep_scion" } },
  archon_ink_crown: { enemyKills: { count: 5, enemyId: "ink_archon" } },
  automaton_bronze_gear: {
    enemyKills: { count: 15, enemyId: "bronze_automaton" },
  },
  cossack_iron_spur: { enemyKills: { count: 15, enemyId: "iron_cossack" } },
  guard_czar_medal: { enemyKills: { count: 15, enemyId: "czar_guard" } },
  guardian_dune_amulet: { enemyKills: { count: 15, enemyId: "sand_guardian" } },
  hound_amber_fang: { enemyKills: { count: 15, enemyId: "amber_hound" } },
  idol_sun_fragment: { enemyKills: { count: 15, enemyId: "stone_idol" } },
  kikimora_night_lantern: { enemyKills: { count: 15, enemyId: "kikimora" } },
  lamia_veil: { enemyKills: { count: 15, enemyId: "lamia" } },
  serpent_scroll_seal: { enemyKills: { count: 15, enemyId: "scroll_serpent" } },
  shaman_storm_totem: { enemyKills: { count: 15, enemyId: "rune_shaman" } },
  tendril_star_knot: { enemyKills: { count: 15, enemyId: "void_tendril" } },
  wadjet_emerald_eye: { enemyKills: { count: 15, enemyId: "wadjet_guardian" } },
  wraith_torn_folio: { enemyKills: { count: 15, enemyId: "tome_wraith" } },
  wyrm_venom_signet: { enemyKills: { count: 5, enemyId: "venom_wyrm" } },
  apprentice_oak_scroll: {
    enemyKills: { count: 15, enemyId: "druid_apprentice" },
  },
  beast_bog_heart: { enemyKills: { count: 15, enemyId: "bog_beast" } },
  berserker_rune_axehead: {
    enemyKills: { count: 15, enemyId: "rune_berserker" },
  },
  broodling_hydra_spine: {
    enemyKills: { count: 5, enemyId: "lernaean_broodling" },
  },
  cultist_flayed_mask: { enemyKills: { count: 15, enemyId: "flayed_cultist" } },
  einherjar_oath_band: { enemyKills: { count: 15, enemyId: "einherjar" } },
  golem_pulp_core: { enemyKills: { count: 15, enemyId: "paper_golem" } },
  harbinger_storm_bell: { enemyKills: { count: 5, enemyId: "oya_harbinger" } },
  impundulu_thunder_plume: { enemyKills: { count: 15, enemyId: "impundulu" } },
  mummy_linen_knot: { enemyKills: { count: 15, enemyId: "mummy_knight" } },
  priest_obsidian_censer: {
    enemyKills: { count: 15, enemyId: "obsidian_priest" },
  },
  spawn_void_ichor: { enemyKills: { count: 15, enemyId: "shoggoth_spawn" } },
  sprite_quill_charm: { enemyKills: { count: 15, enemyId: "quill_sprite" } },
  surgeon_mi_go_tools: { enemyKills: { count: 5, enemyId: "mi_go_surgeon" } },
  archivists_lens: { enemyKills: { count: 3, enemyId: "the_archivist" } },
  cernunnos_horn: { enemyKills: { count: 3, enemyId: "cernunnos_shade" } },
  dagdas_club: { enemyKills: { count: 3, enemyId: "dagda_shadow" } },
  deathless_bone: { enemyKills: { count: 3, enemyId: "koschei_deathless" } },
  eye_of_maat: { enemyKills: { count: 3, enemyId: "osiris_judgment" } },
  griot_drum: { enemyKills: { count: 3, enemyId: "soundiata_spirit" } },
  guardians_seal: { enemyKills: { count: 3, enemyId: "chapter_guardian" } },
  hels_crown: { enemyKills: { count: 3, enemyId: "hel_queen" } },
  hydra_scale: { enemyKills: { count: 3, enemyId: "hydra_aspect" } },
  obsidian_mirror: { enemyKills: { count: 3, enemyId: "tezcatlipoca_echo" } },
  quetzal_feather: { enemyKills: { count: 3, enemyId: "quetzalcoatl_wrath" } },
  shub_idol: { enemyKills: { count: 3, enemyId: "shub_spawn" } },
  solar_disc: { enemyKills: { count: 3, enemyId: "ra_avatar" } },
  stone_pendant: { enemyKills: { count: 3, enemyId: "medusa" } },
  void_shard: { enemyKills: { count: 3, enemyId: "nyarlathotep_shard" } },
  weavers_thread: { enemyKills: { count: 3, enemyId: "anansi_weaver" } },
  wolf_fang: { enemyKills: { count: 3, enemyId: "fenrir" } },
  yaga_skull: { enemyKills: { count: 3, enemyId: "baba_yaga_hut" } },
  library_margin_inkpot: { enemyKills: { count: 15, enemyId: "ink_slime" } },
  library_prep_satchel: { enemyKills: { count: 15, enemyId: "paper_golem" } },
  library_redaction_quill: {
    enemyKills: { count: 15, enemyId: "quill_sprite" },
  },
  library_archon_stamp: { enemyKills: { count: 5, enemyId: "ink_archon" } },
  library_colossus_plate: {
    enemyKills: { count: 5, enemyId: "tome_colossus" },
  },
  library_guardian_chain: {
    enemyKills: { count: 3, enemyId: "chapter_guardian" },
  },
  library_archivist_eye: { enemyKills: { count: 3, enemyId: "the_archivist" } },
  library_catalog_discount: { totalRuns: 8 },
  library_midnight_press: { wonRuns: 5 },
  viking_raider_horn: { enemyKills: { count: 15, enemyId: "draugr" } },
  viking_frost_torc: { enemyKills: { count: 15, enemyId: "frost_troll" } },
  viking_maiden_rune: { enemyKills: { count: 15, enemyId: "shield_maiden" } },
  viking_valkyrie_feather: { enemyKills: { count: 5, enemyId: "valkyrie" } },
  viking_serpent_scale: {
    enemyKills: { count: 5, enemyId: "jormungandr_spawn" },
  },
  viking_fenrir_fang: { enemyKills: { count: 3, enemyId: "fenrir" } },
  viking_hel_signet: { enemyKills: { count: 3, enemyId: "hel_queen" } },
  viking_skald_ledger: { totalRuns: 10 },
  viking_longship_standard: { winsByDifficulty: { "2": 1 } },
  greek_satyr_flute: { enemyKills: { count: 15, enemyId: "satyr" } },
  greek_harpy_pinion: { enemyKills: { count: 15, enemyId: "harpy" } },
  greek_cyclops_iris: { enemyKills: { count: 15, enemyId: "cyclops" } },
  greek_minotaur_labrys: { enemyKills: { count: 5, enemyId: "minotaur" } },
  greek_hydra_ichor: {
    enemyKills: { count: 5, enemyId: "lernaean_broodling" },
  },
  greek_medusa_eye: { enemyKills: { count: 3, enemyId: "medusa" } },
  greek_hydra_heart: { enemyKills: { count: 3, enemyId: "hydra_aspect" } },
  greek_oracle_drachma: { totalRuns: 12 },
  greek_stoa_treatise: { wonRuns: 6 },
  egypt_scarab_idol: { enemyKills: { count: 15, enemyId: "scarab_swarm" } },
  egypt_tomb_censer: { enemyKills: { count: 15, enemyId: "tomb_priest" } },
  egypt_ushabti_ward: { enemyKills: { count: 15, enemyId: "ushabti_servant" } },
  egypt_anubis_scale: { enemyKills: { count: 5, enemyId: "anubis_champion" } },
  egypt_sekhmet_blade: { enemyKills: { count: 5, enemyId: "sekhmet_chosen" } },
  egypt_ra_brazier: { enemyKills: { count: 3, enemyId: "ra_avatar" } },
  egypt_osiris_feather: {
    enemyKills: { count: 3, enemyId: "osiris_judgment" },
  },
  egypt_tomb_ledger: { totalRuns: 9 },
  egypt_golden_canopic: { bestGoldInSingleRun: 300 },
  love_deep_one_idol: { enemyKills: { count: 15, enemyId: "deep_one" } },
  love_star_chart: { enemyKills: { count: 15, enemyId: "star_spawn" } },
  love_byakhee_wing: { enemyKills: { count: 15, enemyId: "byakhee" } },
  love_elder_shard: { enemyKills: { count: 5, enemyId: "elder_hybrid" } },
  love_migo_lantern: { enemyKills: { count: 5, enemyId: "mi_go_surgeon" } },
  love_nyar_mask: { enemyKills: { count: 3, enemyId: "nyarlathotep_shard" } },
  love_shub_brood_core: { enemyKills: { count: 3, enemyId: "shub_spawn" } },
  love_forbidden_contract: { wonRuns: 8 },
  love_void_compass: { winsByDifficulty: { "3": 1 } },
  aztec_jaguar_fang: { enemyKills: { count: 15, enemyId: "jaguar_warrior" } },
  aztec_eagle_standard: { enemyKills: { count: 15, enemyId: "eagle_knight" } },
  aztec_tzitzimitl_star: { enemyKills: { count: 15, enemyId: "tzitzimitl" } },
  aztec_quetzal_coil: {
    enemyKills: { count: 5, enemyId: "quetzal_harbinger" },
  },
  aztec_huitzil_fire: {
    enemyKills: { count: 5, enemyId: "huitzilopochtli_enforcer" },
  },
  aztec_tezca_mirror: {
    enemyKills: { count: 3, enemyId: "tezcatlipoca_echo" },
  },
  aztec_quetzal_crown: {
    enemyKills: { count: 3, enemyId: "quetzalcoatl_wrath" },
  },
  aztec_codex_market: { totalRuns: 14 },
  aztec_blood_calendar: { wonRuns: 7 },
  celtic_sidhe_cloak: { enemyKills: { count: 15, enemyId: "sidhe_raider" } },
  celtic_morrigan_feather: {
    enemyKills: { count: 15, enemyId: "morrigan_wisp" },
  },
  celtic_briar_seed: { enemyKills: { count: 15, enemyId: "briar_beast" } },
  celtic_morrigan_cauldron: {
    enemyKills: { count: 5, enemyId: "morrigan_chosen" },
  },
  celtic_wild_hunt_horn: {
    enemyKills: { count: 5, enemyId: "wild_hunt_hound" },
  },
  celtic_dagda_cauldron: { enemyKills: { count: 3, enemyId: "dagda_shadow" } },
  celtic_cernunnos_antler: {
    enemyKills: { count: 3, enemyId: "cernunnos_shade" },
  },
  celtic_grove_compass: { totalRuns: 11 },
  celtic_oak_geas: { winsByDifficulty: { "2": 1 } },
  russian_wolf_pelt: { enemyKills: { count: 15, enemyId: "winter_wolf" } },
  russian_snow_charm: { enemyKills: { count: 15, enemyId: "snow_maiden" } },
  russian_rusalka_teardrop: { enemyKills: { count: 15, enemyId: "rusalka" } },
  russian_koschei_needle: {
    enemyKills: { count: 5, enemyId: "koschei_herald" },
  },
  russian_domovoi_hearth: {
    enemyKills: { count: 5, enemyId: "domovoi_titan" },
  },
  russian_yaga_mortar: { enemyKills: { count: 3, enemyId: "baba_yaga_hut" } },
  russian_deathless_locket: {
    enemyKills: { count: 3, enemyId: "koschei_deathless" },
  },
  russian_frost_ledger: { totalRuns: 9 },
  russian_midwinter_star: { winsByDifficulty: { "3": 1 } },
  african_hyena_talisman: { enemyKills: { count: 15, enemyId: "hyena_pack" } },
  african_mask_drum: { enemyKills: { count: 15, enemyId: "mask_hunter" } },
  african_oracle_shell: {
    enemyKills: { count: 15, enemyId: "serpent_oracle" },
  },
  african_legba_key: { enemyKills: { count: 5, enemyId: "legba_emissary" } },
  african_oya_anklet: { enemyKills: { count: 5, enemyId: "oya_harbinger" } },
  african_soundiata_standard: {
    enemyKills: { count: 3, enemyId: "soundiata_spirit" },
  },
  african_anansi_weave: { enemyKills: { count: 3, enemyId: "anansi_weaver" } },
  african_griot_archive: { totalRuns: 12 },
  african_sunbird_refrain: { wonRuns: 7 },
  global_codex_prime: { wonRuns: 10, winsByDifficulty: { "4": 1 } },
  global_labyrinth_spiral: {
    bestGoldInSingleRun: 400,
    winsByDifficulty: { "5": 1 },
  },
};

/**
 * CENTRALIZED ASSET REGISTRY
 *
 * All paths point to /public/images/...
 * SVG art is generated â€” no external downloads required.
 * When final art is ready, only update the paths here â€” no component changes needed.
 */

// â”€â”€â”€ Enemy art â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

import { PAINTED_ENEMY_IMAGES } from "./enemy-art.generated";

export const ENEMY_IMAGE_FALLBACKS: Record<string, string> = {
  archivist_black_inkwell: "/images/enemies/archivist_black_inkwell.svg",
  archivist_pale_inkwell: "/images/enemies/archivist_pale_inkwell.svg",
  hydra_head_left: "/images/enemies/hydra_head_left.svg",
  hydra_head_right: "/images/enemies/hydra_head_right.svg",
  hydra_head_center: "/images/enemies/hydra_head_center.svg",
  shub_brood_nest: "/images/enemies/shub_brood_nest.svg",
  dagda_cauldron: "/images/enemies/dagda_cauldron.svg",
  koschei_bone_chest: "/images/enemies/koschei_bone_chest.svg",
  koschei_black_egg: "/images/enemies/koschei_black_egg.svg",
  koschei_hidden_needle: "/images/enemies/koschei_hidden_needle.svg",

  ink_slime: "/images/enemies/ink_slime.svg",
  paper_golem: "/images/enemies/paper_golem.svg",
  page_knight: "/images/enemies/page_knight.svg",
  blot_beast: "/images/enemies/blot_beast.svg",
  quill_sprite: "/images/enemies/quill_sprite.svg",
  tome_wraith: "/images/enemies/tome_wraith.svg",
  scroll_serpent: "/images/enemies/scroll_serpent.svg",
  ink_archon: "/images/enemies/ink_archon.svg",
  tome_colossus: "/images/enemies/tome_colossus.svg",
  venom_wyrm: "/images/enemies/venom_wyrm.svg",
  chapter_guardian: "/images/enemies/chapter_guardian.svg",
  the_archivist: "/images/enemies/the_archivist.svg",
  the_censor: "/images/enemies/the_censor.svg",
  draugr: "/images/enemies/draugr.svg",
  rune_berserker: "/images/enemies/rune_berserker.svg",
  frost_troll: "/images/enemies/frost_troll.svg",
  shield_maiden: "/images/enemies/shield_maiden.svg",
  rune_shaman: "/images/enemies/rune_shaman.svg",
  einherjar: "/images/enemies/einherjar.svg",
  valkyrie: "/images/enemies/valkyrie.svg",
  jormungandr_spawn: "/images/enemies/jormungandr_spawn.svg",
  fenrir: "/images/enemies/fenrir.svg",
  hel_queen: "/images/enemies/hel_queen.svg",
  satyr: "/images/enemies/satyr.svg",
  harpy: "/images/enemies/harpy.svg",
  cyclops: "/images/enemies/cyclops.svg",
  gorgon: "/images/enemies/gorgon.svg",
  lamia: "/images/enemies/lamia.svg",
  bronze_automaton: "/images/enemies/bronze_automaton.svg",
  minotaur: "/images/enemies/minotaur.svg",
  lernaean_broodling: "/images/enemies/lernaean_broodling.svg",
  medusa: "/images/enemies/medusa.svg",
  hydra_aspect: "/images/enemies/hydra_aspect.svg",
  scarab_swarm: "/images/enemies/scarab_swarm.svg",
  sand_guardian: "/images/enemies/sand_guardian.svg",
  tomb_priest: "/images/enemies/tomb_priest.svg",
  mummy_knight: "/images/enemies/mummy_knight.svg",
  apep_scion: "/images/enemies/apep_scion.svg",
  wadjet_guardian: "/images/enemies/wadjet_guardian.svg",
  ushabti_servant: "/images/enemies/ushabti_servant.svg",
  anubis_champion: "/images/enemies/anubis_champion.svg",
  sekhmet_chosen: "/images/enemies/sekhmet_chosen.svg",
  ra_avatar: "/images/enemies/ra_avatar.svg",
  osiris_judgment: "/images/enemies/osiris_judgment.svg",
  cultist_scribe: "/images/enemies/cultist_scribe.svg",
  deep_one: "/images/enemies/deep_one.svg",
  shoggoth_spawn: "/images/enemies/shoggoth_spawn.svg",
  void_tendril: "/images/enemies/void_tendril.svg",
  star_spawn: "/images/enemies/star_spawn.svg",
  byakhee: "/images/enemies/byakhee.svg",
  elder_hybrid: "/images/enemies/elder_hybrid.svg",
  mi_go_surgeon: "/images/enemies/mi_go_surgeon.svg",
  nyarlathotep_shard: "/images/enemies/nyarlathotep_shard.svg",
  shub_spawn: "/images/enemies/shub_spawn.svg",
  jaguar_warrior: "/images/enemies/jaguar_warrior.svg",
  obsidian_priest: "/images/enemies/obsidian_priest.svg",
  eagle_knight: "/images/enemies/eagle_knight.svg",
  stone_idol: "/images/enemies/stone_idol.svg",
  flayed_cultist: "/images/enemies/flayed_cultist.svg",
  tzitzimitl: "/images/enemies/tzitzimitl.svg",
  quetzal_harbinger: "/images/enemies/quetzal_harbinger.svg",
  huitzilopochtli_enforcer: "/images/enemies/huitzilopochtli_enforcer.svg",
  tezcatlipoca_echo: "/images/enemies/tezcatlipoca_echo.svg",
  quetzalcoatl_wrath: "/images/enemies/quetzalcoatl_wrath.svg",
  sidhe_raider: "/images/enemies/sidhe_raider.svg",
  bog_beast: "/images/enemies/bog_beast.svg",
  druid_apprentice: "/images/enemies/druid_apprentice.svg",
  amber_hound: "/images/enemies/amber_hound.svg",
  morrigan_wisp: "/images/enemies/morrigan_wisp.svg",
  briar_beast: "/images/enemies/briar_beast.svg",
  morrigan_chosen: "/images/enemies/morrigan_chosen.svg",
  wild_hunt_hound: "/images/enemies/wild_hunt_hound.svg",
  dagda_shadow: "/images/enemies/dagda_shadow.svg",
  cernunnos_shade: "/images/enemies/cernunnos_shade.svg",
  winter_wolf: "/images/enemies/winter_wolf.svg",
  czar_guard: "/images/enemies/czar_guard.svg",
  snow_maiden: "/images/enemies/snow_maiden.svg",
  iron_cossack: "/images/enemies/iron_cossack.svg",
  kikimora: "/images/enemies/kikimora.svg",
  rusalka: "/images/enemies/rusalka.svg",
  koschei_herald: "/images/enemies/koschei_herald.svg",
  domovoi_titan: "/images/enemies/domovoi_titan.svg",
  baba_yaga_hut: "/images/enemies/baba_yaga_hut.svg",
  koschei_deathless: "/images/enemies/koschei_deathless.svg",
  hyena_pack: "/images/enemies/hyena_pack.svg",
  mask_hunter: "/images/enemies/mask_hunter.svg",
  baobab_giant: "/images/enemies/baobab_giant.svg",
  serpent_oracle: "/images/enemies/serpent_oracle.svg",
  impundulu: "/images/enemies/impundulu.svg",
  tokoloshe: "/images/enemies/tokoloshe.svg",
  legba_emissary: "/images/enemies/legba_emissary.svg",
  oya_harbinger: "/images/enemies/oya_harbinger.svg",
  soundiata_spirit: "/images/enemies/soundiata_spirit.svg",
  anansi_weaver: "/images/enemies/anansi_weaver.svg",
};

export const ENEMY_IMAGES: Record<string, string> = {
  ...ENEMY_IMAGE_FALLBACKS,
  ...PAINTED_ENEMY_IMAGES,
};

const ENEMY_IMAGE_ALIASES: Record<string, string> = {
  apep_scion: "desert_cobra",
  wadjet_guardian: "sand_guardian",
  osiris_judgment: "osiris_eye",
  flayed_cultist: "blood_cultist",
  snow_maiden: "frost_witch",
};

export function getEnemyFallbackSrc(enemyId: string): string {
  if (ENEMY_IMAGE_ALIASES[enemyId]) {
    return `/images/enemies/${ENEMY_IMAGE_ALIASES[enemyId]}.svg`;
  }
  if (ENEMY_IMAGE_FALLBACKS[enemyId]) return ENEMY_IMAGE_FALLBACKS[enemyId];
  return `/images/enemies/${enemyId}.svg`;
}

export function getEnemyImageSrc(
  enemyId: string,
  size: "card" | "thumb" | "full" = "card"
): string {
  const painted = PAINTED_ENEMY_IMAGES[enemyId];
  if (!painted) return getEnemyFallbackSrc(enemyId);
  return size === "card"
    ? painted
    : painted.replace(/\.webp$/, `-${size}.webp`);
}

// â”€â”€â”€ Card art â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

import { PAINTED_CARD_IMAGES } from "./card-art.generated";

export const CARD_IMAGE_FALLBACKS: Record<string, string> = {
  trace_tranchant: "/images/cards/trace_tranchant.svg",
  parchemin_de_soin: "/images/cards/parchemin_de_soin.svg",
  annotation: "/images/cards/annotation.svg",
  catalogue: "/images/cards/catalogue.svg",
  chuchotement: "/images/cards/chuchotement.svg",
  marque_page: "/images/cards/marque_page.svg",
  piqure: "/images/cards/piqure.svg",
  rythme_mortel: "/images/cards/rythme_mortel.svg",
  masque_de_bois: "/images/cards/masque_de_bois.svg",
  frappe_folle: "/images/cards/frappe_folle.svg",
  soif_de_puissance: "/images/cards/soif_de_puissance.svg",
  rage_aveugle: "/images/cards/rage_aveugle.svg",
  coup_de_grace_starter: "/images/cards/coup_de_grace_starter.svg",

  strike: "/images/cards/strike.svg",
  defend: "/images/cards/defend.svg",
  ink_surge: "/images/cards/ink_surge.svg",
};

export const CARD_IMAGES: Record<string, string> = {
  ...CARD_IMAGE_FALLBACKS,
  ...PAINTED_CARD_IMAGES,
};

// â”€â”€â”€ Backgrounds â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const BACKGROUNDS = {
  combat: "/images/backgrounds/combat.svg",
  map: "/images/backgrounds/map.svg",
} as const;

import type { BiomeType } from "@/game/schemas/enums";

export const COMBAT_BACKGROUND_FALLBACKS: Record<BiomeType, string> = {
  LIBRARY: "/images/backgrounds/combat.svg",
  VIKING: "/images/backgrounds/combat_viking.svg",
  GREEK: "/images/backgrounds/combat_greek.svg",
  EGYPTIAN: "/images/backgrounds/combat_egyptian.svg",
  LOVECRAFTIAN: "/images/backgrounds/combat_lovecraftian.svg",
  AZTEC: "/images/backgrounds/combat_aztec.svg",
  CELTIC: "/images/backgrounds/combat_celtic.svg",
  RUSSIAN: "/images/backgrounds/combat_russian.svg",
  AFRICAN: "/images/backgrounds/combat_african.svg",
};

export const COMBAT_BACKGROUNDS: Record<BiomeType, string> = {
  LIBRARY: "/images/scenes/panlibrarium-v2.webp",
  VIKING: "/images/scenes/viking-v2.webp",
  GREEK: "/images/scenes/greek-v2.webp",
  EGYPTIAN: "/images/scenes/egyptian-v2.webp",
  LOVECRAFTIAN: "/images/scenes/lovecraftian-v2.webp",
  AZTEC: "/images/scenes/aztec-v2.webp",
  CELTIC: "/images/scenes/celtic-v2.webp",
  RUSSIAN: "/images/scenes/russian-v2.webp",
  AFRICAN: "/images/scenes/african-v2.webp",
};

// â”€â”€â”€ Player â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const PLAYER_AVATAR = "/images/player/avatar.svg";

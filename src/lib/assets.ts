/**
 * CENTRALIZED ASSET REGISTRY
 *
 * All paths point to /public/images/...
 * SVG art is generated — no external downloads required.
 * When final art is ready, only update the paths here — no component changes needed.
 */

// ─── Enemy art ────────────────────────────────────────────────────────────────

export const ENEMY_IMAGES: Record<string, string> = {
  ink_slime: "/images/enemies/ink_slime.svg",
  paper_golem: "/images/enemies/paper_golem.svg",
  ink_wraith: "/images/enemies/ink_wraith.svg",
  page_knight: "/images/enemies/page_knight.svg",
  blot_beast: "/images/enemies/blot_beast.svg",
  // elites
  ink_archon: "/images/enemies/ink_archon.svg",
  tome_colossus: "/images/enemies/tome_colossus.svg",
  venom_wyrm: "/images/enemies/venom_wyrm.svg",
  // boss
  the_censor: "/images/enemies/the_censor.svg",
};

// ─── Card art ─────────────────────────────────────────────────────────────────

export const CARD_IMAGES: Record<string, string> = {
  strike: "/images/cards/strike.svg",
  defend: "/images/cards/defend.svg",
  ink_surge: "/images/cards/ink_surge.svg",
};

// ─── Backgrounds ──────────────────────────────────────────────────────────────

export const BACKGROUNDS = {
  combat: "/images/backgrounds/combat.svg",
  map: "/images/backgrounds/map.svg",
} as const;

import type { BiomeType } from "@/game/schemas/enums";

export const COMBAT_BACKGROUNDS: Record<BiomeType, string> = {
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

// ─── Player ───────────────────────────────────────────────────────────────────

export const PLAYER_AVATAR = "/images/player/avatar.svg";

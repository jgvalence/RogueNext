import { z } from "zod";

export const CardType = z.enum(["ATTACK", "SKILL", "POWER", "STATUS", "CURSE"]);
export type CardType = z.infer<typeof CardType>;

export const Targeting = z.enum([
  "SINGLE_ENEMY",
  "ALL_ENEMIES",
  "SELF",
  "SINGLE_ALLY",
  "ALL_ALLIES",
]);
export type Targeting = z.infer<typeof Targeting>;

export const Rarity = z.enum(["STARTER", "COMMON", "UNCOMMON", "RARE"]);
export type Rarity = z.infer<typeof Rarity>;

export const RelicRarity = z.enum(["COMMON", "UNCOMMON", "RARE", "BOSS"]);
export type RelicRarity = z.infer<typeof RelicRarity>;

export const RoomType = z.enum(["COMBAT", "MERCHANT", "SPECIAL", "PRE_BOSS"]);
export type RoomType = z.infer<typeof RoomType>;

export const RunStatus = z.enum([
  "IN_PROGRESS",
  "VICTORY",
  "DEFEAT",
  "ABANDONED",
]);
export type RunStatus = z.infer<typeof RunStatus>;

export const EffectType = z.enum([
  "DAMAGE",
  "BLOCK",
  "HEAL",
  "DRAW_CARDS",
  "GAIN_ENERGY",
  "GAIN_INK",
  "APPLY_BUFF",
  "APPLY_DEBUFF",
  "GAIN_STRENGTH",
  "GAIN_FOCUS",
  "EXHAUST",
  "DRAIN_INK",
  "ADD_CARD_TO_DRAW",
  "ADD_CARD_TO_DISCARD",
]);
export type EffectType = z.infer<typeof EffectType>;

export const BuffType = z.enum([
  "STRENGTH",
  "FOCUS",
  "VULNERABLE",
  "WEAK",
  "POISON",
  "THORNS",
]);
export type BuffType = z.infer<typeof BuffType>;

export const InkPowerType = z.enum(["REWRITE", "LOST_CHAPTER", "SEAL"]);
export type InkPowerType = z.infer<typeof InkPowerType>;

export const BiomeType = z.enum([
  "LIBRARY",
  "VIKING",
  "GREEK",
  "EGYPTIAN",
  "LOVECRAFTIAN",
  "AZTEC",
  "CELTIC",
  "RUSSIAN",
  "AFRICAN",
]);
export type BiomeType = z.infer<typeof BiomeType>;

export const BiomeResource = z.enum([
  "PAGES",
  "RUNES",
  "LAURIERS",
  "GLYPHES",
  "FRAGMENTS",
  "OBSIDIENNE",
  "AMBRE",
  "SCEAUX",
  "MASQUES",
]);
export type BiomeResource = z.infer<typeof BiomeResource>;

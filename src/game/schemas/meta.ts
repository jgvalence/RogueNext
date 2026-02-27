import { z } from "zod";
import { BiomeResource, BiomeType, InkPowerType } from "./enums";

// ---------------------------------------------------------------------------
// MetaBonus — tous les types de bonus permanents possibles
// ---------------------------------------------------------------------------

export const MetaBonusSchema = z.discriminatedUnion("type", [
  // Bonuses appliqués à l'initialisation du combat
  z.object({ type: z.literal("EXTRA_DRAW"), value: z.number().int() }),
  z.object({ type: z.literal("EXTRA_ENERGY_MAX"), value: z.number().int() }),
  z.object({ type: z.literal("EXTRA_INK_MAX"), value: z.number().int() }),
  z.object({ type: z.literal("INK_PER_CARD_CHANCE"), value: z.number().int() }),
  z.object({ type: z.literal("INK_PER_CARD_VALUE"), value: z.number().int() }),
  z.object({ type: z.literal("STARTING_INK"), value: z.number().int() }),
  z.object({ type: z.literal("STARTING_BLOCK"), value: z.number().int() }),
  z.object({ type: z.literal("STARTING_STRENGTH"), value: z.number().int() }),
  z.object({ type: z.literal("STARTING_REGEN"), value: z.number().int() }),
  z.object({
    type: z.literal("FIRST_HIT_DAMAGE_REDUCTION"),
    value: z.number().int(),
  }),
  z.object({ type: z.literal("EXTRA_HP"), value: z.number().int() }),
  z.object({ type: z.literal("EXTRA_HAND_AT_START"), value: z.number().int() }),
  // Bonuses appliqués à la création du run
  z.object({ type: z.literal("STARTING_GOLD"), value: z.number().int() }),
  z.object({
    type: z.literal("EXTRA_CARD_REWARD_CHOICES"),
    value: z.number().int(),
  }),
  // Unlock d'Ink Powers
  z.object({ type: z.literal("UNLOCK_INK_POWER"), power: InkPowerType }),
  // Bonuses complexes (non encore implémentés dans le moteur, stockés pour l'avenir)
  z.object({ type: z.literal("HEAL_AFTER_COMBAT"), value: z.number() }),
  z.object({ type: z.literal("EXHAUST_KEEP_CHANCE"), value: z.number() }),
  z.object({ type: z.literal("SURVIVAL_ONCE") }),
  z.object({ type: z.literal("FREE_UPGRADE_PER_RUN") }),
  z.object({ type: z.literal("ATTACK_BONUS"), value: z.number().int() }),
  z.object({ type: z.literal("ALLY_SLOTS"), value: z.number().int() }),
  z.object({ type: z.literal("RELIC_DISCOUNT"), value: z.number() }),
  z.object({ type: z.literal("LOOT_LUCK"), value: z.number().int() }),
  z.object({ type: z.literal("STARTING_RARE_CARD") }),
]);
export type MetaBonus = z.infer<typeof MetaBonusSchema>;

// ---------------------------------------------------------------------------
// Histoire — une œuvre à débloquer dans la bibliothèque
// ---------------------------------------------------------------------------

export const HistoireSchema = z.object({
  id: z.string(),
  titre: z.string(),
  auteur: z.string().optional(),
  biome: BiomeType,
  tier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  cout: z.record(BiomeResource, z.number().int()),
  prerequis: z.array(z.string()),
  bonus: MetaBonusSchema,
  description: z.string(),
  visuel: z.enum(["livre", "parchemin", "tablette", "grimoire"]),
});
export type Histoire = z.infer<typeof HistoireSchema>;

// ---------------------------------------------------------------------------
// MetaProgress — état persisté par utilisateur en base de données
// ---------------------------------------------------------------------------

export const MetaProgressSchema = z.object({
  resources: z.record(z.string(), z.number().int()).default({}),
  unlockedStoryIds: z.array(z.string()).default([]),
  winsByDifficulty: z.record(z.string(), z.number().int()).optional(),
  bestTimeByDifficultyMs: z.record(z.string(), z.number().int()).optional(),
});
export type MetaProgress = z.infer<typeof MetaProgressSchema>;

// ---------------------------------------------------------------------------
// ComputedMetaBonuses — agrégat plat de tous les bonus actifs d'un joueur
// Calculé depuis MetaProgress au moment de la création d'un run
// ---------------------------------------------------------------------------

export const ComputedMetaBonusesSchema = z.object({
  // Combat init bonuses
  extraDraw: z.number().int().default(0),
  extraEnergyMax: z.number().int().default(0),
  extraInkMax: z.number().int().default(0),
  inkPerCardChance: z.number().int().default(0),
  inkPerCardValue: z.number().int().default(0),
  startingInk: z.number().int().default(0),
  startingBlock: z.number().int().default(0),
  startingStrength: z.number().int().default(0),
  startingRegen: z.number().int().default(0),
  firstHitDamageReduction: z.number().int().default(0),
  extraHp: z.number().int().default(0),
  extraHandAtStart: z.number().int().default(0),
  attackBonus: z.number().int().default(0),
  allySlots: z.number().int().default(0),
  allyHpPercent: z.number().int().default(0),
  // Run init bonuses
  startingGold: z.number().int().default(0),
  extraCardRewardChoices: z.number().int().default(0),
  relicDiscount: z.number().default(0),
  lootLuck: z.number().int().default(0),
  // Ink powers — REWRITE toujours présent, SEAL et LOST_CHAPTER à débloquer
  unlockedInkPowers: z.array(InkPowerType).default(["REWRITE"]),
  // Complex bonuses
  healAfterCombat: z.number().default(0), // % of max HP healed after each combat
  exhaustKeepChance: z.number().default(0), // % chance to not exhaust
  survivalOnce: z.boolean().default(false),
  freeUpgradePerRun: z.boolean().default(false),
  startingRareCard: z.boolean().default(false),
});
export type ComputedMetaBonuses = z.infer<typeof ComputedMetaBonusesSchema>;

export const DEFAULT_META_BONUSES: ComputedMetaBonuses =
  ComputedMetaBonusesSchema.parse({});

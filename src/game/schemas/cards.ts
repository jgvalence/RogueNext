import { z } from "zod";
import {
  CardType,
  Rarity,
  Targeting,
  BiomeType,
  CardArchetypeTag,
} from "./enums";
import { EffectSchema, type Effect } from "./effects";

export const InkedVariantSchema = z.object({
  description: z.string(),
  effects: z.array(EffectSchema),
  inkMarkCost: z.number().int().min(1),
  upgradedDescription: z.string().optional(),
  upgradedEffects: z.array(EffectSchema).optional(),
});
export type InkedVariant = z.infer<typeof InkedVariantSchema>;

/** Per-card upgrade definition. Replaces the generic boostEffects() fallback. */
export const CardUpgradeSchema = z.object({
  energyCost: z.number().int().min(0).optional(), // override cost; absent = unchanged
  description: z.string(),
  effects: z.array(EffectSchema),
  onRandomDiscardEffects: z.array(EffectSchema).optional(),
});
export type CardUpgrade = z.infer<typeof CardUpgradeSchema>;

export const CardDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: CardType,
  energyCost: z.number().int().min(0),
  inkCost: z.number().int().min(0).default(0),
  targeting: Targeting,
  rarity: Rarity,
  description: z.string(),
  effects: z.array(EffectSchema),
  onRandomDiscardEffects: z.array(EffectSchema).default([]),
  inkedVariant: InkedVariantSchema.nullable().default(null),
  upgrade: CardUpgradeSchema.nullable().default(null),
  isStarterCard: z.boolean().default(false),
  isCollectible: z.boolean().default(true),
  isStatusCard: z.boolean().default(false),
  isCurseCard: z.boolean().default(false),
  biome: BiomeType.default("LIBRARY"),
  archetypeTags: z.array(CardArchetypeTag).default([]),
  /** Si défini, la carte n'apparaît qu'en récompense pour ce personnage. */
  characterId: z.string().optional(),
});
export type CardDefinition = Omit<
  z.infer<typeof CardDefinitionSchema>,
  | "isCollectible"
  | "isStatusCard"
  | "isCurseCard"
  | "onRandomDiscardEffects"
  | "archetypeTags"
> & {
  isCollectible?: boolean;
  isStatusCard?: boolean;
  isCurseCard?: boolean;
  onRandomDiscardEffects?: Effect[];
  archetypeTags?: Array<z.infer<typeof CardArchetypeTag>>;
  upgrade?: CardUpgrade | null;
};

export const CardInstanceSchema = z.object({
  instanceId: z.string(),
  definitionId: z.string(),
  upgraded: z.boolean().default(false),
});
export type CardInstance = z.infer<typeof CardInstanceSchema>;

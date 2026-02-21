import { z } from "zod";
import { CardType, Rarity, Targeting, BiomeType } from "./enums";
import { EffectSchema } from "./effects";

export const InkedVariantSchema = z.object({
  description: z.string(),
  effects: z.array(EffectSchema),
  inkMarkCost: z.number().int().min(1),
});
export type InkedVariant = z.infer<typeof InkedVariantSchema>;

/** Per-card upgrade definition. Replaces the generic boostEffects() fallback. */
export const CardUpgradeSchema = z.object({
  energyCost: z.number().int().min(0).optional(), // override cost; absent = unchanged
  description: z.string(),
  effects: z.array(EffectSchema),
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
  inkedVariant: InkedVariantSchema.nullable().default(null),
  upgrade: CardUpgradeSchema.nullable().default(null),
  isStarterCard: z.boolean().default(false),
  isCollectible: z.boolean().default(true),
  isStatusCard: z.boolean().default(false),
  isCurseCard: z.boolean().default(false),
  biome: BiomeType.default("LIBRARY"),
});
export type CardDefinition = Omit<
  z.infer<typeof CardDefinitionSchema>,
  "isCollectible" | "isStatusCard" | "isCurseCard"
> & {
  isCollectible?: boolean;
  isStatusCard?: boolean;
  isCurseCard?: boolean;
  upgrade?: CardUpgrade | null;
};

export const CardInstanceSchema = z.object({
  instanceId: z.string(),
  definitionId: z.string(),
  upgraded: z.boolean().default(false),
});
export type CardInstance = z.infer<typeof CardInstanceSchema>;

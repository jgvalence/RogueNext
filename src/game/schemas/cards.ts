import { z } from "zod";
import { CardType, Rarity, Targeting } from "./enums";
import { EffectSchema } from "./effects";

export const InkedVariantSchema = z.object({
  description: z.string(),
  effects: z.array(EffectSchema),
  inkMarkCost: z.number().int().min(1),
});
export type InkedVariant = z.infer<typeof InkedVariantSchema>;

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
  isStarterCard: z.boolean().default(false),
});
export type CardDefinition = z.infer<typeof CardDefinitionSchema>;

export const CardInstanceSchema = z.object({
  instanceId: z.string(),
  definitionId: z.string(),
  upgraded: z.boolean().default(false),
});
export type CardInstance = z.infer<typeof CardInstanceSchema>;

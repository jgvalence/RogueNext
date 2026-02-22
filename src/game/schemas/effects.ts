import { z } from "zod";
import { BuffType, EffectType, InkPowerType } from "./enums";

export const EffectSchema = z.object({
  type: EffectType,
  value: z.number(),
  buff: BuffType.optional(),
  duration: z.number().optional(),
  cardId: z.string().optional(),
  inkPower: z.union([InkPowerType, z.literal("ALL")]).optional(),
});
export type Effect = z.infer<typeof EffectSchema>;

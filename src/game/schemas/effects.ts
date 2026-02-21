import { z } from "zod";
import { BuffType, EffectType } from "./enums";

export const EffectSchema = z.object({
  type: EffectType,
  value: z.number(),
  buff: BuffType.optional(),
  duration: z.number().optional(),
  cardId: z.string().optional(),
});
export type Effect = z.infer<typeof EffectSchema>;

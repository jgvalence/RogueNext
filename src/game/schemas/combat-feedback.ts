import { z } from "zod";

export const CombatFeedbackKindSchema = z.enum([
  "hit",
  "poison",
  "poisonTick",
  "bleed",
  "bleedTick",
  "armor",
  "heal",
  "draw",
  "upgrade",
  "buff",
  "debuff",
  "skill",
  "ink",
]);
export const CombatFeedbackEventSchema = z.object({
  id: z.number().int().nonnegative(),
  kind: CombatFeedbackKindSchema,
  target: z.string(),
  source: z.string().optional(),
  amount: z.number().nonnegative().optional(),
  blocked: z.number().nonnegative().optional(),
});
export const CombatFeedbackSchema = z.object({
  sequence: z.number().int().nonnegative(),
  events: z.array(CombatFeedbackEventSchema).max(64),
});
export type CombatFeedbackEvent = z.infer<typeof CombatFeedbackEventSchema>;
export type CombatFeedbackInput = Omit<CombatFeedbackEvent, "id">;

import { z } from "zod";
import { EffectSchema } from "./effects";

export const UsableItemTargeting = z.enum(["SELF", "SINGLE_ENEMY"]);
export type UsableItemTargeting = z.infer<typeof UsableItemTargeting>;

export const UsableItemDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  targeting: UsableItemTargeting,
  effects: z.array(EffectSchema),
});
export type UsableItemDefinition = z.infer<typeof UsableItemDefinitionSchema>;

export const UsableItemInstanceSchema = z.object({
  instanceId: z.string(),
  definitionId: z.string(),
});
export type UsableItemInstance = z.infer<typeof UsableItemInstanceSchema>;

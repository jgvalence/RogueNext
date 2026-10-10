import { z } from "zod";
import { CardDefinitionSchema } from "./cards";
import { UsableItemDefinitionSchema } from "./items";

const ShopItemSnapshotSchema = z.object({
  id: z.string(),
  type: z.enum([
    "card",
    "relic",
    "heal",
    "max_hp",
    "purge",
    "blood_purge",
    "usable_item",
    "ally",
  ]),
  price: z.number().nonnegative(),
  cardDef: CardDefinitionSchema.partial({
    onRandomDiscardEffects: true,
    isCollectible: true,
    isStatusCard: true,
    isCurseCard: true,
    archetypeTags: true,
  }).optional(),
  usableItemDef: UsableItemDefinitionSchema.optional(),
  relicId: z.string().optional(),
  relicName: z.string().optional(),
  relicDescription: z.string().optional(),
  allyId: z.string().optional(),
  allyName: z.string().optional(),
  allyDescription: z.string().optional(),
  healAmount: z.number().optional(),
  hpCost: z.number().optional(),
  maxHpAmount: z.number().optional(),
});
export const MerchantVisitSchema = z.object({
  inventory: z.array(ShopItemSnapshotSchema).max(50),
  soldIds: z.array(z.string()).max(100),
  autoRestockChargesLeft: z.number().int().nonnegative(),
  pendingPurgeItemId: z.string().nullable(),
});
export const MerchantCheckpointSchema = MerchantVisitSchema.extend({
  floor: z.number().int().positive(),
  room: z.number().int().nonnegative(),
});
export type MerchantVisit = z.infer<typeof MerchantVisitSchema>;
export type MerchantCheckpoint = z.infer<typeof MerchantCheckpointSchema>;

import { z } from "zod";

// Store offer identities and rerolls, never regenerate rewards on resume.
export const PendingRewardsSchema = z.object({
  floor: z.number().int().positive(),
  room: z.number().int().nonnegative(),
  isBoss: z.boolean(),
  isElite: z.boolean(),
  gold: z.number().nonnegative(),
  biomeResources: z.record(z.string(), z.number().nonnegative()),
  cardIds: z.array(z.string()).max(20),
  relicIds: z.array(z.string()).max(20),
  allyIds: z.array(z.string()).max(20),
  bossMaxHpBonus: z.number().nullable(),
  usableItemDropDefinitionId: z.string().nullable(),
  rerollsRemaining: z.number().int().nonnegative(),
  rerollCounter: z.number().int().nonnegative(),
  rerollCardIds: z.array(z.array(z.string()).max(20)).max(20),
});
export type PendingRewards = z.infer<typeof PendingRewardsSchema>;

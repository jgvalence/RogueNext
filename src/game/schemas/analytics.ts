import { z } from "zod";

export const CombatAnalyticsSchema = z.object({
  biome: z.string(),
  floor: z.number().int(),
  room: z.number().int(),
  encounterType: z.enum(["NORMAL", "ELITE", "BOSS"]),
  enemyIds: z.array(z.string()),
  won: z.boolean(),
  turns: z.number().int().min(0),
  hpBefore: z.number().int(),
  hpAfter: z.number().int(),
  damageTaken: z.number().int().min(0),
  inkGenerated: z.number().int().min(0),
  inkSpent: z.number().int().min(0),
  inkedCardsPlayed: z.number().int().min(0),
  inkPowerUses: z.record(z.string(), z.number().int().min(0)),
  cardModePlays: z.record(z.string(), z.number().int().min(0)).default({}),
});
export type CombatAnalytics = z.infer<typeof CombatAnalyticsSchema>;

export const RunAnalyticsSchema = z.object({
  rulesVersion: z.string().optional(),
  totalRunsAtStart: z.number().int().nonnegative().optional(),
  cardlessTurnStarts: z.number().int().nonnegative().default(0),
  alliesLost: z.number().int().nonnegative().default(0),
  unusedItemsAtEnd: z.number().int().nonnegative().optional(),
  damageMetric: z.literal("NET_HP_LOSS").optional(),
  rewardOffers: z
    .array(
      z.object({
        key: z.string(),
        floor: z.number().int(),
        room: z.number().int(),
        cards: z.array(z.string()),
        relics: z.array(z.string()),
        chosen: z.array(z.string()),
        skipped: z.boolean(),
      })
    )
    .max(500)
    .optional(),
  combatsStarted: z.number().int().min(0).default(0),
  combatsWon: z.number().int().min(0).default(0),
  totalTurns: z.number().int().min(0).default(0),
  damageTaken: z.number().int().min(0).default(0),
  inkGenerated: z.number().int().min(0).default(0),
  inkSpent: z.number().int().min(0).default(0),
  inkedCardsPlayed: z.number().int().min(0).default(0),
  cardPlays: z.record(z.string(), z.number().int().min(0)).default({}),
  cardModePlays: z.record(z.string(), z.number().int().min(0)).default({}),
  upgradeBranchChoices: z
    .record(z.string(), z.number().int().min(0))
    .default({}),
  inkPowerUses: z.record(z.string(), z.number().int().min(0)).default({}),
  cardsAdded: z.record(z.string(), z.number().int().min(0)).default({}),
  cardRewardsSkipped: z.number().int().min(0).default(0),
  cardsRemoved: z.number().int().min(0).default(0),
  cardsRemovedById: z.record(z.string(), z.number().int().min(0)).default({}),
  cardsUpgraded: z.number().int().min(0).default(0),
  shopPurchases: z.number().int().min(0).default(0),
  shopRerolls: z.number().int().min(0).default(0),
  usableItemsUsed: z.number().int().min(0).default(0),
  combats: z.array(CombatAnalyticsSchema).default([]),
});
export type RunAnalytics = z.infer<typeof RunAnalyticsSchema>;

// Saved runs predate some or all counters. Fill missing fields on load without
// resetting existing statistics or labelling an older run with today's rules.
export function normalizeRunAnalytics(value: unknown): RunAnalytics {
  const analytics = RunAnalyticsSchema.parse(value ?? {});
  return { ...analytics, rulesVersion: analytics.rulesVersion ?? "legacy" };
}

export const DEFAULT_RUN_ANALYTICS: RunAnalytics = RunAnalyticsSchema.parse({
  rulesVersion: "2026-10-10.2",
  damageMetric: "NET_HP_LOSS",
});

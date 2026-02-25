import { z } from "zod";
import { RoomType, RunStatus, BiomeType } from "./enums";
import { CombatStateSchema } from "./combat-state";
import { CardInstanceSchema } from "./cards";
import { ComputedMetaBonusesSchema } from "./meta";
import { UsableItemInstanceSchema } from "./items";

const CardUnlockProgressSchema = z.object({
  enteredBiomes: z.record(z.string(), z.number().int()).default({}),
  biomeRunsCompleted: z.record(z.string(), z.number().int()).default({}),
  eliteKillsByBiome: z.record(z.string(), z.number().int()).default({}),
  bossKillsByBiome: z.record(z.string(), z.number().int()).default({}),
});

export const RoomNodeSchema = z.object({
  index: z.number().int(),
  type: RoomType,
  enemyIds: z.array(z.string()).optional(),
  isElite: z.boolean().default(false),
  completed: z.boolean().default(false),
});
export type RoomNode = z.infer<typeof RoomNodeSchema>;

export const RunStateSchema = z.object({
  runId: z.string(),
  seed: z.string(),
  status: RunStatus,
  floor: z.number().int().default(1),
  currentRoom: z.number().int().default(0),
  gold: z.number().int().default(0),
  playerMaxHp: z.number().int(),
  playerCurrentHp: z.number().int(),
  deck: z.array(CardInstanceSchema),
  allyIds: z.array(z.string()).default([]),
  relicIds: z.array(z.string()).default([]),
  usableItems: z.array(UsableItemInstanceSchema).default([]),
  usableItemCapacity: z.number().int().min(0).default(3),
  freeUpgradeUsed: z.boolean().default(false),
  survivalOnceUsed: z.boolean().optional(),
  map: z.array(z.array(RoomNodeSchema)),
  combat: CombatStateSchema.nullable().default(null),
  currentBiome: BiomeType.default("LIBRARY"),
  pendingBiomeChoices: z.tuple([BiomeType, BiomeType]).nullable().default(null),
  // Difficulty flow at run start: pick one unlocked level first
  pendingDifficultyLevels: z.array(z.number().int().min(0)).default([]),
  selectedDifficultyLevel: z.number().int().min(0).nullable().default(null),
  // Snapshot of highest unlocked difficulty at run start (used for card/relic gates)
  unlockedDifficultyLevelSnapshot: z.number().int().min(0).default(0),
  // Start-of-run condition choices shown to the player (pick 1 among 3)
  pendingRunConditionChoices: z.array(z.string()).default([]),
  // Chosen condition applied to this run
  selectedRunConditionId: z.string().nullable().default(null),
  // Resources accumulated during this run (flushed at endRun)
  earnedResources: z.record(z.string(), z.number().int()).default({}),
  // Optional start-of-run merchant flow state
  startMerchantResourcePool: z.record(z.string(), z.number().int()).optional(),
  startMerchantSpentResources: z
    .record(z.string(), z.number().int())
    .optional(),
  startMerchantPurchasedOfferIds: z.array(z.string()).optional(),
  startMerchantCompleted: z.boolean().optional(),
  // Meta bonuses computed at run creation
  metaBonuses: ComputedMetaBonusesSchema.optional(),
  // Snapshot of unlocked stories for card unlock logic
  unlockedStoryIdsSnapshot: z.array(z.string()).default([]),
  // Card ids unlocked and available in this run
  unlockedCardIds: z.array(z.string()).default([]),
  // Snapshot of unlocked cards at run start (for end-of-run summary)
  initialUnlockedCardIds: z.array(z.string()).default([]),
  // Detailed unlock progression state
  cardUnlockProgress: CardUnlockProgressSchema.default({}),
});
export type RunState = z.infer<typeof RunStateSchema>;

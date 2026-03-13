import { z } from "zod";
import { RoomType, RunStatus, BiomeType } from "./enums";
import { CombatStateSchema } from "./combat-state";
import { CardInstanceSchema } from "./cards";
import { ComputedMetaBonusesSchema } from "./meta";
import { UsableItemInstanceSchema } from "./items";

const CharacterCardUnlockProgressSchema = z.object({
  enteredBiomes: z.record(z.string(), z.number().int()).default({}),
  biomeRunsCompleted: z.record(z.string(), z.number().int()).default({}),
  eliteKillsByBiome: z.record(z.string(), z.number().int()).default({}),
  bossKillsByBiome: z.record(z.string(), z.number().int()).default({}),
});

const CardUnlockProgressSchema = CharacterCardUnlockProgressSchema.extend({
  byCharacter: z
    .record(z.string(), CharacterCardUnlockProgressSchema)
    .default({}),
});

const EncounteredEnemyTypeSchema = z.enum(["NORMAL", "ELITE", "BOSS"]);

export const FirstRunScriptStepSchema = z.enum([
  "FIRST_COMBAT",
  "MAP_INTRO",
  "FORCED_ELITE",
]);
export type FirstRunScriptStep = z.infer<typeof FirstRunScriptStepSchema>;

export const FirstRunScriptStateSchema = z.object({
  enabled: z.boolean().default(false),
  step: FirstRunScriptStepSchema.default("FIRST_COMBAT"),
});
export type FirstRunScriptState = z.infer<typeof FirstRunScriptStateSchema>;

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
  runStartedAtMs: z.number().int().nonnegative().default(0),
  activePlayMs: z.number().int().nonnegative().default(0),
  floor: z.number().int().default(1),
  currentRoom: z.number().int().default(0),
  gold: z.number().int().default(0),
  maxGoldReached: z.number().int().default(0),
  merchantRerollCount: z.number().int().min(0).default(0),
  playerMaxHp: z.number().int(),
  playerCurrentHp: z.number().int(),
  deck: z.array(CardInstanceSchema),
  allyIds: z.array(z.string()).default([]),
  // Persistent HP for each ally between combats (key = definitionId)
  // Absent entry = new ally, starts at full HP
  allyCurrentHps: z.record(z.string(), z.number().int()).default({}),
  relicIds: z.array(z.string()).default([]),
  usableItems: z.array(UsableItemInstanceSchema).default([]),
  usableItemCapacity: z.number().int().min(0).default(3),
  freeUpgradeUsed: z.boolean().default(false),
  survivalOnceUsed: z.boolean().optional(),
  map: z.array(z.array(RoomNodeSchema)),
  combat: CombatStateSchema.nullable().default(null),
  currentBiome: BiomeType.default("LIBRARY"),
  pendingBiomeChoices: z.tuple([BiomeType, BiomeType]).nullable().default(null),
  // Snapshot of max unlocked difficulty per character at run start
  difficultyMaxByCharacter: z
    .record(z.string(), z.number().int().min(0))
    .default({}),
  firstRunScript: FirstRunScriptStateSchema.nullable().default(null),
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
  // Personnage actif pour ce run
  characterId: z.string().default("scribe"),
  // Personnages disponibles à choisir en début de run (null = choix déjà fait)
  pendingCharacterChoices: z.array(z.string()).nullable().default(null),
  // Meta bonuses computed at run creation
  metaBonuses: ComputedMetaBonusesSchema.optional(),
  // Snapshot of unlocked stories for card unlock logic
  unlockedStoryIdsSnapshot: z.array(z.string()).default([]),
  // Relic ids unlocked and available in this run
  unlockedRelicIds: z.array(z.string()).default([]),
  // Card ids unlocked and available in this run
  unlockedCardIds: z.array(z.string()).default([]),
  // Snapshot of unlocked cards at run start (for end-of-run summary)
  initialUnlockedCardIds: z.array(z.string()).default([]),
  // Snapshot of unlocked relics at run start (for end-of-run summary)
  initialUnlockedRelicIds: z.array(z.string()).optional(),
  // Detailed unlock progression state
  cardUnlockProgress: CardUnlockProgressSchema.default({}),
  // Events already seen this run (used to prevent once-per-run events from repeating)
  seenEventIds: z.array(z.string()).default([]),
  // Tracks player's cumulative attitude toward the Erased Scribe across encounters
  // Positive = compassion, near zero = indifference, negative = hostility
  // Used by the final boss (Le Censeur) to alter its behavior
  scribeAttitude: z.number().int().default(0),
  // Per-encounter attitude delta for the Erased Scribe (key = event id, value = -1/0/+1)
  // Persisted individually to meta-progression at end of run for granular boss reactions
  scribeChoices: z.record(z.string(), z.number().int()).default({}),
  // Bestiary discovery map (key = enemy id, value = discovered category)
  encounteredEnemies: z
    .record(z.string(), EncounteredEnemyTypeSchema)
    .default({}),
  // Cumulative kills by enemy definition ID (used to unlock deeper bestiary lore tiers)
  enemyKillCounts: z.record(z.string(), z.number().int().min(0)).default({}),
  // Persistent stat bonuses granted by run-scale relics (applied at combat init)
  relicPersistentStats: z
    .object({
      strength: z.number().int().default(0),
      focus: z.number().int().default(0),
      inkMax: z.number().int().default(0),
    })
    .optional(),
});
export type RunState = z.infer<typeof RunStateSchema>;

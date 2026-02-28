import { z } from "zod";
import { CardInstanceSchema } from "./cards";
import {
  PlayerStateSchema,
  EnemyStateSchema,
  AllyStateSchema,
} from "./entities";
import { InkPowerType } from "./enums";

export const CombatPhase = z.enum([
  "PLAYER_TURN",
  "ALLIES_ENEMIES_TURN",
  "COMBAT_WON",
  "COMBAT_LOST",
]);
export type CombatPhase = z.infer<typeof CombatPhase>;

export const DrawDebugEventSchema = z.object({
  turnNumber: z.number().int().min(1),
  phase: CombatPhase,
  source: z.enum(["PLAYER", "ENEMY", "SYSTEM"]),
  reason: z.string(),
  requested: z.number().int().min(0),
  movedToHand: z.number().int().min(0),
  movedToDiscard: z.number().int().min(0),
  exhaustedOverflow: z.number().int().min(0),
  handBefore: z.number().int().min(0),
  handAfter: z.number().int().min(0),
  pendingOverflowAfter: z.number().int().min(0),
});
export type DrawDebugEvent = z.infer<typeof DrawDebugEventSchema>;

export const TurnDisruptionSchema = z.object({
  extraCardCost: z.number().int().default(0),
  drawPenalty: z.number().int().default(0),
  drawsToDiscardRemaining: z.number().int().default(0),
  freezeNextDrawsRemaining: z.number().int().default(0),
  frozenHandCardIds: z.array(z.string()).default([]),
  disabledInkPowers: z
    .array(z.union([InkPowerType, z.literal("ALL")]))
    .default([]),
});
export type TurnDisruption = z.infer<typeof TurnDisruptionSchema>;

export const CombatStateSchema = z.object({
  floor: z.number().int().default(1),
  difficultyLevel: z.number().int().min(0).optional(),
  enemyDamageScale: z.number().default(1),
  turnNumber: z.number().int().default(1),
  phase: CombatPhase.default("PLAYER_TURN"),
  player: PlayerStateSchema,
  allies: z.array(AllyStateSchema).default([]),
  enemies: z.array(EnemyStateSchema),
  drawPile: z.array(CardInstanceSchema),
  hand: z.array(CardInstanceSchema),
  discardPile: z.array(CardInstanceSchema),
  exhaustPile: z.array(CardInstanceSchema).default([]),
  pendingHandOverflowExhaust: z.number().int().min(0).default(0),
  drawDebugHistory: z.array(DrawDebugEventSchema).default([]),
  inkPowerUsedThisTurn: z.boolean().default(false),
  firstHitReductionUsed: z.boolean().default(false),
  playerDisruption: TurnDisruptionSchema.default({}),
  nextPlayerDisruption: TurnDisruptionSchema.default({}),
});
export type CombatState = z.infer<typeof CombatStateSchema>;

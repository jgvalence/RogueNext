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
  inkPowerUsedThisTurn: z.boolean().default(false),
  firstHitReductionUsed: z.boolean().default(false),
  playerDisruption: TurnDisruptionSchema.default({}),
  nextPlayerDisruption: TurnDisruptionSchema.default({}),
});
export type CombatState = z.infer<typeof CombatStateSchema>;

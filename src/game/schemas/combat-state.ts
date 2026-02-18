import { z } from "zod";
import { CardInstanceSchema } from "./cards";
import {
  PlayerStateSchema,
  EnemyStateSchema,
  AllyStateSchema,
} from "./entities";

export const CombatPhase = z.enum([
  "PLAYER_TURN",
  "ALLIES_ENEMIES_TURN",
  "COMBAT_WON",
  "COMBAT_LOST",
]);
export type CombatPhase = z.infer<typeof CombatPhase>;

export const CombatStateSchema = z.object({
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
});
export type CombatState = z.infer<typeof CombatStateSchema>;

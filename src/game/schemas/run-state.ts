import { z } from "zod";
import { RoomType, RunStatus } from "./enums";
import { CombatStateSchema } from "./combat-state";
import { CardInstanceSchema } from "./cards";

export const RoomNodeSchema = z.object({
  index: z.number().int(),
  type: RoomType,
  enemyIds: z.array(z.string()).optional(),
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
  relicIds: z.array(z.string()).default([]),
  map: z.array(z.array(RoomNodeSchema)),
  combat: CombatStateSchema.nullable().default(null),
});
export type RunState = z.infer<typeof RunStateSchema>;

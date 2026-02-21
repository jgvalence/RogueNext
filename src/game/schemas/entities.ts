import { z } from "zod";
import { BuffType, BiomeType } from "./enums";
import { EffectSchema } from "./effects";

export const BuffInstanceSchema = z.object({
  type: BuffType,
  stacks: z.number().int(),
  duration: z.number().int().optional(),
});
export type BuffInstance = z.infer<typeof BuffInstanceSchema>;

export const PlayerStateSchema = z.object({
  currentHp: z.number().int(),
  maxHp: z.number().int(),
  block: z.number().int().default(0),
  energyCurrent: z.number().int(),
  energyMax: z.number().int(),
  inkCurrent: z.number().int().default(0),
  inkMax: z.number().int(),
  inkPerCardChance: z.number().int().min(0).max(100).default(0),
  inkPerCardValue: z.number().int().min(0).default(1),
  regenPerTurn: z.number().int().min(0).default(0),
  firstHitDamageReductionPercent: z.number().int().min(0).max(100).default(0),
  drawCount: z.number().int().default(5),
  speed: z.number().int().default(0),
  strength: z.number().int().default(0),
  focus: z.number().int().default(0),
  buffs: z.array(BuffInstanceSchema).default([]),
});
export type PlayerState = z.infer<typeof PlayerStateSchema>;

export const EnemyAbilitySchema = z.object({
  name: z.string(),
  weight: z.number().default(1),
  target: z
    .enum(["PLAYER", "LOWEST_HP_ENEMY", "ALL_ENEMIES", "SELF", "ALLY_PRIORITY"])
    .optional(),
  effects: z.array(EffectSchema),
});
export type EnemyAbility = z.infer<typeof EnemyAbilitySchema>;

export const EnemyDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  maxHp: z.number().int().min(1),
  speed: z.number().int(),
  abilities: z.array(EnemyAbilitySchema),
  isBoss: z.boolean().default(false),
  isElite: z.boolean().default(false),
  tier: z.number().int().default(1),
  biome: BiomeType.default("LIBRARY"),
});
export type EnemyDefinition = z.infer<typeof EnemyDefinitionSchema>;

export const EnemyStateSchema = z.object({
  instanceId: z.string(),
  definitionId: z.string(),
  name: z.string(),
  currentHp: z.number().int(),
  maxHp: z.number().int(),
  block: z.number().int().default(0),
  mechanicFlags: z.record(z.string(), z.number().int()).optional(),
  speed: z.number().int(),
  buffs: z.array(BuffInstanceSchema).default([]),
  intentIndex: z.number().int().default(0),
});
export type EnemyState = z.infer<typeof EnemyStateSchema>;

export const AllyDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  maxHp: z.number().int().min(1),
  speed: z.number().int(),
  abilities: z.array(EnemyAbilitySchema),
});
export type AllyDefinition = z.infer<typeof AllyDefinitionSchema>;

export const AllyStateSchema = z.object({
  instanceId: z.string(),
  definitionId: z.string(),
  name: z.string(),
  currentHp: z.number().int(),
  maxHp: z.number().int(),
  block: z.number().int().default(0),
  speed: z.number().int(),
  buffs: z.array(BuffInstanceSchema).default([]),
  intentIndex: z.number().int().default(0),
});
export type AllyState = z.infer<typeof AllyStateSchema>;

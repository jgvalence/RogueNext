import type { BuffInstance } from "../schemas/entities";
import type { BuffType } from "../schemas/enums";

export function applyBuff(
  buffs: BuffInstance[],
  type: BuffType,
  stacks: number,
  duration?: number
): BuffInstance[] {
  if (type === "STUN" && getBuffStacks(buffs, "STUN_IMMUNITY") > 0) {
    return buffs;
  }

  const existing = buffs.find((b) => b.type === type);

  if (existing) {
    return buffs.map((b) =>
      b.type === type
        ? {
            ...b,
            stacks: b.stacks + stacks,
            duration: duration ?? b.duration,
          }
        : b
    );
  }

  return [...buffs, { type, stacks, duration }];
}

export function removeBuff(
  buffs: BuffInstance[],
  type: BuffType
): BuffInstance[] {
  return buffs.filter((b) => b.type !== type);
}

export function getBuffStacks(buffs: BuffInstance[], type: BuffType): number {
  return buffs.find((b) => b.type === type)?.stacks ?? 0;
}

/**
 * Tick buffs at end of round: decrement durations, remove expired.
 * Buffs without duration are permanent (until explicitly removed).
 */
export function tickBuffs(buffs: BuffInstance[]): BuffInstance[] {
  return buffs
    .map((b) => {
      if (b.duration === undefined) return b;
      return { ...b, duration: b.duration - 1 };
    })
    .filter((b) => b.duration === undefined || b.duration > 0);
}

/**
 * Apply bleed damage: deal stacks damage each round.
 * Unlike poison, stacks do NOT decrease — bleed expires via duration only.
 */
export function applyBleed(
  entity: {
    currentHp: number;
    buffs: BuffInstance[];
  },
  damageMultiplier = 1
): { currentHp: number; buffs: BuffInstance[] } {
  const bleedStacks = getBuffStacks(entity.buffs, "BLEED");
  if (bleedStacks <= 0) return entity;
  const scaledDamage = Math.max(
    0,
    Math.round(bleedStacks * Math.max(0, damageMultiplier))
  );

  return {
    currentHp: entity.currentHp - scaledDamage,
    buffs: entity.buffs,
  };
}

/**
 * Apply poison damage: deal stacks damage, then reduce stacks by 1.
 * Returns updated entity HP and buffs.
 */
export function applyPoison(
  entity: {
    currentHp: number;
    buffs: BuffInstance[];
  },
  damageMultiplier = 1
): { currentHp: number; buffs: BuffInstance[] } {
  const poisonStacks = getBuffStacks(entity.buffs, "POISON");
  if (poisonStacks <= 0) return entity;

  const scaledDamage = Math.max(
    0,
    Math.round(poisonStacks * Math.max(0, damageMultiplier))
  );
  const newHp = entity.currentHp - scaledDamage;
  const newBuffs =
    poisonStacks <= 1
      ? removeBuff(entity.buffs, "POISON")
      : entity.buffs.map((b) =>
          b.type === "POISON" ? { ...b, stacks: b.stacks - 1 } : b
        );

  return {
    currentHp: newHp,
    buffs: newBuffs,
  };
}

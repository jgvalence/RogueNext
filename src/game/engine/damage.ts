import type { BuffInstance } from "../schemas/entities";
import { getBuffStacks } from "./buffs";

export interface DamageSource {
  strength: number;
  buffs: BuffInstance[];
}

export interface DamageTarget {
  currentHp: number;
  block: number;
  buffs: BuffInstance[];
}

/**
 * Calculate final damage after strength and vulnerability modifiers.
 * Weak reduces outgoing damage by 25%.
 * Vulnerable increases incoming damage by 50%.
 */
export function calculateDamage(
  baseDamage: number,
  attacker: DamageSource,
  target: { buffs: BuffInstance[] }
): number {
  let damage = baseDamage + attacker.strength;

  // Weak attacker: -25% damage
  if (getBuffStacks(attacker.buffs, "WEAK") > 0) {
    damage = Math.floor(damage * 0.75);
  }

  // Vulnerable target: +50% damage
  if (getBuffStacks(target.buffs, "VULNERABLE") > 0) {
    damage = Math.floor(damage * 1.5);
  }

  return Math.max(0, damage);
}

/**
 * Apply damage to a target, accounting for block.
 * Returns new HP, block, and overkill amount.
 */
export function applyDamage(
  target: { currentHp: number; block: number },
  damage: number
): { currentHp: number; block: number; overkill: number } {
  const blockedDamage = Math.min(target.block, damage);
  const remainingDamage = damage - blockedDamage;
  const newBlock = target.block - blockedDamage;
  const newHp = target.currentHp - remainingDamage;

  return {
    currentHp: newHp,
    block: newBlock,
    overkill: Math.max(0, -newHp),
  };
}

/**
 * Apply block to a target, accounting for focus bonus.
 */
export function applyBlock(
  currentBlock: number,
  amount: number,
  focus: number
): number {
  return currentBlock + amount + focus;
}

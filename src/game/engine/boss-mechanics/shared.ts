import { nanoid } from "nanoid";

import type { CombatState } from "../../schemas/combat-state";
import type { EnemyDefinition } from "../../schemas/entities";
import { applyBuff } from "../buffs";
import { resolveEffects } from "../effects";
import type { EffectTarget } from "../effects";
import type { RNG } from "../rng";
import { isCurseCardDefinitionId } from "../status-cards";

export function summonEnemyIfPossible(
  state: CombatState,
  enemyId: string,
  enemyDefs?: Map<string, EnemyDefinition>
): CombatState {
  if (!enemyDefs) return state;
  const def = enemyDefs.get(enemyId);
  if (!def) return state;
  if (state.enemies.length >= 4) return state;

  return {
    ...state,
    enemies: [
      ...state.enemies,
      {
        instanceId: nanoid(),
        definitionId: def.id,
        name: def.name,
        currentHp: def.maxHp,
        maxHp: def.maxHp,
        block: 0,
        mechanicFlags: {},
        speed: def.speed,
        buffs: [],
        intentIndex: 0,
      },
    ],
  };
}

export function healEnemy(
  state: CombatState,
  enemyInstanceId: string,
  amount: number
): CombatState {
  return {
    ...state,
    enemies: state.enemies.map((enemy) =>
      enemy.instanceId === enemyInstanceId
        ? {
            ...enemy,
            currentHp: Math.min(enemy.maxHp, enemy.currentHp + amount),
          }
        : enemy
    ),
  };
}

export function grantEnemyStrength(
  state: CombatState,
  enemyInstanceId: string,
  amount: number
): CombatState {
  return {
    ...state,
    enemies: state.enemies.map((enemy) =>
      enemy.instanceId === enemyInstanceId
        ? {
            ...enemy,
            buffs: applyBuff(enemy.buffs, "STRENGTH", amount),
          }
        : enemy
    ),
  };
}

export function grantEnemyThorns(
  state: CombatState,
  enemyInstanceId: string,
  amount: number
): CombatState {
  return {
    ...state,
    enemies: state.enemies.map((enemy) =>
      enemy.instanceId === enemyInstanceId
        ? {
            ...enemy,
            buffs: applyBuff(enemy.buffs, "THORNS", amount),
          }
        : enemy
    ),
  };
}

export function damageSelf(
  state: CombatState,
  enemyInstanceId: string,
  amount: number
): CombatState {
  return {
    ...state,
    enemies: state.enemies.map((enemy) =>
      enemy.instanceId === enemyInstanceId
        ? { ...enemy, currentHp: Math.max(1, enemy.currentHp - amount) }
        : enemy
    ),
  };
}

export function drainAllPlayerInk(state: CombatState): CombatState {
  return {
    ...state,
    player: { ...state.player, inkCurrent: 0 },
  };
}

export function freezePlayerHandCards(
  state: CombatState,
  count: number
): CombatState {
  const toFreeze = state.hand.slice(0, count).map((card) => card.instanceId);
  if (toFreeze.length === 0) return state;

  return {
    ...state,
    playerDisruption: {
      ...state.playerDisruption,
      frozenHandCardIds: [
        ...(state.playerDisruption?.frozenHandCardIds ?? []),
        ...toFreeze,
      ],
    },
  };
}

export function applyNextTurnCardCostIncrease(
  state: CombatState,
  amount: number
): CombatState {
  return {
    ...state,
    nextPlayerDisruption: {
      ...state.nextPlayerDisruption,
      extraCardCost: (state.nextPlayerDisruption?.extraCardCost ?? 0) + amount,
    },
  };
}

export function addCardsToDrawPile(
  state: CombatState,
  definitionId: string,
  count: number
): CombatState {
  return {
    ...state,
    drawPile: [
      ...state.drawPile,
      ...Array.from({ length: count }, () => ({
        instanceId: nanoid(),
        definitionId,
        upgraded: false,
      })),
    ],
  };
}

export function addCardsToDiscardPile(
  state: CombatState,
  definitionId: string,
  count: number
): CombatState {
  return {
    ...state,
    discardPile: [
      ...state.discardPile,
      ...Array.from({ length: count }, () => ({
        instanceId: nanoid(),
        definitionId,
        upgraded: false,
      })),
    ],
  };
}

export function applyFlatBonusDamage(
  state: CombatState,
  enemyInstanceId: string,
  target: EffectTarget,
  rng: RNG,
  bonusDamage: number
): CombatState {
  if (bonusDamage <= 0) return state;

  return resolveEffects(
    state,
    [{ type: "DAMAGE", value: bonusDamage }],
    { source: { type: "enemy", instanceId: enemyInstanceId }, target },
    rng
  );
}

function countBossCurseCards(state: CombatState): number {
  return [
    ...state.hand,
    ...state.drawPile,
    ...state.discardPile,
    ...state.exhaustPile,
  ].filter((card) => isCurseCardDefinitionId(card.definitionId)).length;
}

export function applyBonusDamageFromCurseCount(
  state: CombatState,
  enemyInstanceId: string,
  target: EffectTarget,
  rng: RNG,
  perCurse: number
): CombatState {
  return applyFlatBonusDamage(
    state,
    enemyInstanceId,
    target,
    rng,
    countBossCurseCards(state) * perCurse
  );
}

export function applyBonusDamageIfPlayerDebuffed(
  state: CombatState,
  enemyInstanceId: string,
  target: EffectTarget,
  rng: RNG,
  bonusDamage: number
): CombatState {
  const debuffCount = state.player.buffs.filter(
    (buff) =>
      buff.type === "WEAK" ||
      buff.type === "VULNERABLE" ||
      buff.type === "POISON"
  ).length;
  if (debuffCount === 0) return state;

  return applyFlatBonusDamage(state, enemyInstanceId, target, rng, bonusDamage);
}

export function applyBuffToPlayer(
  state: CombatState,
  buff: "WEAK" | "VULNERABLE" | "POISON" | "BLEED",
  stacks: number,
  duration?: number
): CombatState {
  return {
    ...state,
    player: {
      ...state.player,
      buffs: applyBuff(state.player.buffs, buff, stacks, duration),
    },
  };
}

export function grantStrengthToAllEnemies(
  state: CombatState,
  amount: number
): CombatState {
  return {
    ...state,
    enemies: state.enemies.map((enemy) =>
      enemy.currentHp > 0
        ? { ...enemy, buffs: applyBuff(enemy.buffs, "STRENGTH", amount) }
        : enemy
    ),
  };
}

export function grantBlockToAllEnemies(
  state: CombatState,
  amount: number
): CombatState {
  return {
    ...state,
    enemies: state.enemies.map((enemy) =>
      enemy.currentHp > 0 ? { ...enemy, block: enemy.block + amount } : enemy
    ),
  };
}

export function grantThornsToAllEnemies(
  state: CombatState,
  amount: number
): CombatState {
  return {
    ...state,
    enemies: state.enemies.map((enemy) =>
      enemy.currentHp > 0
        ? { ...enemy, buffs: applyBuff(enemy.buffs, "THORNS", amount) }
        : enemy
    ),
  };
}

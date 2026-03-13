import type { CombatState } from "../schemas/combat-state";
import type { CardDefinition } from "../schemas/cards";
import type { Effect } from "../schemas/effects";
import type { PlayerState, EnemyState, AllyState } from "../schemas/entities";
import {
  calculateDamage,
  applyDamage,
  applyBlock,
  applyDirectDamage,
  computeDamageFromTargetBlock,
} from "./damage";
import { applyBuff, getBuffStacks } from "./buffs";
import {
  drawCards,
  isClogCardDefinitionId,
  moveFromDiscardToHand,
} from "./deck";
import { enemyDebuffsBypassBlock, getBossDebuffBonus } from "./difficulty";
import { nanoid } from "nanoid";
import type { RNG } from "./rng";

export type EffectSource =
  | "player"
  | { type: "enemy" | "ally"; instanceId: string };

export type EffectTarget =
  | "player"
  | "all_enemies"
  | "all_allies"
  | { type: "enemy"; instanceId: string }
  | { type: "ally"; instanceId: string };

export interface EffectContext {
  source: EffectSource;
  target: EffectTarget;
  drawReason?: string;
  cardDefs?: Map<string, CardDefinition>;
  sourceCardInstanceId?: string;
}

const WEAK_ATTACK_THORNS_RETRIGGER_COUNTER =
  "weak_attack_thorns_retrigger";

function getSourceStats(state: CombatState, source: EffectSource) {
  if (source === "player") {
    return {
      strength: state.player.strength,
      buffs: state.player.buffs,
      focus: state.player.focus,
    };
  }
  if (source.type === "ally") {
    const ally = state.allies.find((a) => a.instanceId === source.instanceId);
    return {
      strength: 0,
      buffs: ally?.buffs ?? [],
      focus: 0,
    };
  }
  const enemy = state.enemies.find((e) => e.instanceId === source.instanceId);
  return {
    strength: 0,
    buffs: enemy?.buffs ?? [],
    focus: 0,
  };
}

function getSelfTargetFromSource(source: EffectSource): EffectTarget {
  return source === "player"
    ? "player"
    : { type: source.type, instanceId: source.instanceId };
}

function getFriendlySupportTarget(
  source: EffectSource,
  target: EffectTarget
): EffectTarget {
  if (source === "player") {
    if (
      target === "player" ||
      target === "all_allies" ||
      (typeof target === "object" && target.type === "ally")
    ) {
      return target;
    }
    return getSelfTargetFromSource(source);
  }

  if (source.type === "ally") {
    if (
      target === "player" ||
      target === "all_allies" ||
      (typeof target === "object" && target.type === "ally")
    ) {
      return target;
    }
    return getSelfTargetFromSource(source);
  }

  if (typeof target === "object" && target.type === "enemy") {
    return target;
  }

  return getSelfTargetFromSource(source);
}

function updatePlayer(
  state: CombatState,
  updater: (p: PlayerState) => PlayerState
): CombatState {
  return { ...state, player: updater(state.player) };
}

function updateEnemy(
  state: CombatState,
  instanceId: string,
  updater: (e: EnemyState) => EnemyState
): CombatState {
  return {
    ...state,
    enemies: state.enemies.map((e) =>
      e.instanceId === instanceId ? updater(e) : e
    ),
  };
}

function updateAlly(
  state: CombatState,
  instanceId: string,
  updater: (a: AllyState) => AllyState
): CombatState {
  return {
    ...state,
    allies: state.allies.map((a) =>
      a.instanceId === instanceId ? updater(a) : a
    ),
  };
}

function applyDamageToTarget(
  state: CombatState,
  target: EffectTarget,
  baseDamage: number,
  source: EffectSource
): CombatState {
  const sourceStats = getSourceStats(state, source);
  const scaledBaseDamage =
    typeof source === "object" && source.type === "enemy"
      ? Math.max(1, Math.round(baseDamage * (state.enemyDamageScale ?? 1)))
      : baseDamage;

  if (target === "player") {
    const sourceEnemy =
      typeof source === "object" && source.type === "enemy"
        ? state.enemies.find((enemy) => enemy.instanceId === source.instanceId)
        : null;
    const playerVulnerableMultiplier =
      state.relicModifiers?.playerVulnerableDamageMultiplier ?? 1.5;
    const rawDamage = calculateDamage(
      scaledBaseDamage,
      sourceStats,
      {
        buffs: state.player.buffs,
      },
      {
        vulnerableMultiplier: playerVulnerableMultiplier,
      }
    );
    const canUseFirstHitReduction =
      typeof source === "object" &&
      source.type === "enemy" &&
      !state.firstHitReductionUsed &&
      state.player.firstHitDamageReductionPercent > 0 &&
      rawDamage > 0;
    let finalDmg = canUseFirstHitReduction
      ? Math.floor(
          (rawDamage * (100 - state.player.firstHitDamageReductionPercent)) /
            100
        )
      : rawDamage;

    let nextState = state;

    const sidheCloakActive = Boolean(
      nextState.relicFlags?.sidhe_cloak_available
    );
    if (
      sidheCloakActive &&
      sourceEnemy &&
      !sourceEnemy.isBoss &&
      finalDmg > 0
    ) {
      finalDmg = 0;
      nextState = {
        ...nextState,
        relicFlags: {
          ...(nextState.relicFlags ?? {}),
          sidhe_cloak_available: false,
        },
      };
    }

    const hpBefore = nextState.player.currentHp;
    const result = applyDamage(nextState.player, finalDmg);
    nextState = {
      ...updatePlayer(nextState, (p) => ({
        ...p,
        currentHp: result.currentHp,
        block: result.block,
      })),
      firstHitReductionUsed: canUseFirstHitReduction
        ? true
        : nextState.firstHitReductionUsed,
    };

    if (sourceEnemy && finalDmg > 0) {
      const reflectHitsLeft = Math.max(
        0,
        Math.floor(nextState.relicCounters?.tezca_reflect_hits_left ?? 0)
      );
      if (reflectHitsLeft > 0) {
        const reflected = applyDamage(sourceEnemy, 3);
        nextState = updateEnemy(nextState, sourceEnemy.instanceId, (enemy) => ({
          ...enemy,
          currentHp: reflected.currentHp,
          block: reflected.block,
        }));
        nextState = {
          ...nextState,
          relicCounters: {
            ...(nextState.relicCounters ?? {}),
            tezca_reflect_hits_left: reflectHitsLeft - 1,
          },
        };
      }
    }

    if (sourceEnemy && finalDmg > 0) {
      const hpLost = Math.max(0, hpBefore - result.currentHp);
      if (hpLost > 0 && nextState.relicFlags?.fenrir_fang_active) {
        const triggersUsed = Math.max(
          0,
          Math.floor(nextState.relicCounters?.turn_fenrir_triggers ?? 0)
        );
        if (triggersUsed < 3) {
          nextState = {
            ...nextState,
            player: {
              ...nextState.player,
              strength: nextState.player.strength + 1,
            },
            relicCounters: {
              ...(nextState.relicCounters ?? {}),
              turn_fenrir_triggers: triggersUsed + 1,
            },
          };
        }
      }

      const oakAvailable = Boolean(nextState.relicFlags?.oak_geas_available);
      if (
        oakAvailable &&
        result.currentHp > 0 &&
        result.currentHp <= Math.floor(nextState.player.maxHp * 0.4)
      ) {
        nextState = {
          ...nextState,
          player: {
            ...nextState.player,
            strength: nextState.player.strength + 2,
            block: nextState.player.block + 8,
          },
          relicFlags: {
            ...(nextState.relicFlags ?? {}),
            oak_geas_available: false,
          },
        };
      }
    }

    return nextState;
  }

  if (target === "all_enemies") {
    const enemyVulnerableMultiplier =
      state.relicModifiers?.enemyVulnerableDamageMultiplier ?? 1.5;
    let s = state;
    for (const enemy of state.enemies) {
      if (enemy.currentHp <= 0) continue;
      const finalDmg = calculateDamage(
        scaledBaseDamage,
        sourceStats,
        {
          buffs: enemy.buffs,
        },
        {
          vulnerableMultiplier: enemyVulnerableMultiplier,
        }
      );
      const result = applyDamage(enemy, finalDmg);
      s = updateEnemy(s, enemy.instanceId, (e) => ({
        ...e,
        currentHp: result.currentHp,
        block: result.block,
      }));
    }
    return s;
  }

  if (typeof target === "object" && target.type === "enemy") {
    const enemyVulnerableMultiplier =
      state.relicModifiers?.enemyVulnerableDamageMultiplier ?? 1.5;
    const enemy = state.enemies.find((e) => e.instanceId === target.instanceId);
    if (!enemy || enemy.currentHp <= 0) return state;
    const finalDmg = calculateDamage(
      scaledBaseDamage,
      sourceStats,
      {
        buffs: enemy.buffs,
      },
      {
        vulnerableMultiplier: enemyVulnerableMultiplier,
      }
    );
    const result = applyDamage(enemy, finalDmg);
    return updateEnemy(state, target.instanceId, (e) => ({
      ...e,
      currentHp: result.currentHp,
      block: result.block,
    }));
  }

  if (target === "all_allies") {
    const enemyVulnerableMultiplier =
      state.relicModifiers?.enemyVulnerableDamageMultiplier ?? 1.5;
    let s = state;
    for (const ally of state.allies) {
      if (ally.currentHp <= 0) continue;
      const finalDmg = calculateDamage(
        scaledBaseDamage,
        sourceStats,
        {
          buffs: ally.buffs,
        },
        {
          vulnerableMultiplier: enemyVulnerableMultiplier,
        }
      );
      const result = applyDamage(ally, finalDmg);
      s = updateAlly(s, ally.instanceId, (a) => ({
        ...a,
        currentHp: result.currentHp,
        block: result.block,
      }));
    }
    return s;
  }

  if (typeof target === "object" && target.type === "ally") {
    const enemyVulnerableMultiplier =
      state.relicModifiers?.enemyVulnerableDamageMultiplier ?? 1.5;
    const ally = state.allies.find((a) => a.instanceId === target.instanceId);
    if (!ally || ally.currentHp <= 0) return state;
    const finalDmg = calculateDamage(
      scaledBaseDamage,
      sourceStats,
      {
        buffs: ally.buffs,
      },
      {
        vulnerableMultiplier: enemyVulnerableMultiplier,
      }
    );
    const result = applyDamage(ally, finalDmg);
    return updateAlly(state, target.instanceId, (a) => ({
      ...a,
      currentHp: result.currentHp,
      block: result.block,
    }));
  }

  return state;
}

function applyDirectDamageToTarget(
  state: CombatState,
  target: EffectTarget,
  baseDamage: number,
  source: EffectSource
): CombatState {
  const sourceStats = getSourceStats(state, source);
  const scaledBaseDamage =
    typeof source === "object" && source.type === "enemy"
      ? Math.max(1, Math.round(baseDamage * (state.enemyDamageScale ?? 1)))
      : baseDamage;

  if (target === "player") {
    const sourceEnemy =
      typeof source === "object" && source.type === "enemy"
        ? state.enemies.find((enemy) => enemy.instanceId === source.instanceId)
        : null;
    const playerVulnerableMultiplier =
      state.relicModifiers?.playerVulnerableDamageMultiplier ?? 1.5;
    const rawDamage = calculateDamage(
      scaledBaseDamage,
      sourceStats,
      {
        buffs: state.player.buffs,
      },
      {
        vulnerableMultiplier: playerVulnerableMultiplier,
      }
    );
    const canUseFirstHitReduction =
      typeof source === "object" &&
      source.type === "enemy" &&
      !state.firstHitReductionUsed &&
      state.player.firstHitDamageReductionPercent > 0 &&
      rawDamage > 0;
    let finalDmg = canUseFirstHitReduction
      ? Math.floor(
          (rawDamage * (100 - state.player.firstHitDamageReductionPercent)) /
            100
        )
      : rawDamage;

    let nextState = state;

    const sidheCloakActive = Boolean(
      nextState.relicFlags?.sidhe_cloak_available
    );
    if (
      sidheCloakActive &&
      sourceEnemy &&
      !sourceEnemy.isBoss &&
      finalDmg > 0
    ) {
      finalDmg = 0;
      nextState = {
        ...nextState,
        relicFlags: {
          ...(nextState.relicFlags ?? {}),
          sidhe_cloak_available: false,
        },
      };
    }

    const hpBefore = nextState.player.currentHp;
    const result = applyDirectDamage(nextState.player, finalDmg);
    nextState = {
      ...updatePlayer(nextState, (p) => ({
        ...p,
        currentHp: result.currentHp,
        block: result.block,
      })),
      firstHitReductionUsed: canUseFirstHitReduction
        ? true
        : nextState.firstHitReductionUsed,
    };

    if (sourceEnemy && finalDmg > 0) {
      const reflectHitsLeft = Math.max(
        0,
        Math.floor(nextState.relicCounters?.tezca_reflect_hits_left ?? 0)
      );
      if (reflectHitsLeft > 0) {
        const reflected = applyDamage(sourceEnemy, 3);
        nextState = updateEnemy(nextState, sourceEnemy.instanceId, (enemy) => ({
          ...enemy,
          currentHp: reflected.currentHp,
          block: reflected.block,
        }));
        nextState = {
          ...nextState,
          relicCounters: {
            ...(nextState.relicCounters ?? {}),
            tezca_reflect_hits_left: reflectHitsLeft - 1,
          },
        };
      }
    }

    if (sourceEnemy && finalDmg > 0) {
      const hpLost = Math.max(0, hpBefore - result.currentHp);
      if (hpLost > 0 && nextState.relicFlags?.fenrir_fang_active) {
        const triggersUsed = Math.max(
          0,
          Math.floor(nextState.relicCounters?.turn_fenrir_triggers ?? 0)
        );
        if (triggersUsed < 3) {
          nextState = {
            ...nextState,
            player: {
              ...nextState.player,
              strength: nextState.player.strength + 1,
            },
            relicCounters: {
              ...(nextState.relicCounters ?? {}),
              turn_fenrir_triggers: triggersUsed + 1,
            },
          };
        }
      }

      const oakAvailable = Boolean(nextState.relicFlags?.oak_geas_available);
      if (
        oakAvailable &&
        result.currentHp > 0 &&
        result.currentHp <= Math.floor(nextState.player.maxHp * 0.4)
      ) {
        nextState = {
          ...nextState,
          player: {
            ...nextState.player,
            strength: nextState.player.strength + 2,
            block: nextState.player.block + 8,
          },
          relicFlags: {
            ...(nextState.relicFlags ?? {}),
            oak_geas_available: false,
          },
        };
      }
    }

    return nextState;
  }

  if (target === "all_enemies") {
    const enemyVulnerableMultiplier =
      state.relicModifiers?.enemyVulnerableDamageMultiplier ?? 1.5;
    let s = state;
    for (const enemy of state.enemies) {
      if (enemy.currentHp <= 0) continue;
      const finalDmg = calculateDamage(
        scaledBaseDamage,
        sourceStats,
        {
          buffs: enemy.buffs,
        },
        {
          vulnerableMultiplier: enemyVulnerableMultiplier,
        }
      );
      const result = applyDirectDamage(enemy, finalDmg);
      s = updateEnemy(s, enemy.instanceId, (e) => ({
        ...e,
        currentHp: result.currentHp,
        block: result.block,
      }));
    }
    return s;
  }

  if (typeof target === "object" && target.type === "enemy") {
    const enemyVulnerableMultiplier =
      state.relicModifiers?.enemyVulnerableDamageMultiplier ?? 1.5;
    const enemy = state.enemies.find((e) => e.instanceId === target.instanceId);
    if (!enemy || enemy.currentHp <= 0) return state;
    const finalDmg = calculateDamage(
      scaledBaseDamage,
      sourceStats,
      {
        buffs: enemy.buffs,
      },
      {
        vulnerableMultiplier: enemyVulnerableMultiplier,
      }
    );
    const result = applyDirectDamage(enemy, finalDmg);
    return updateEnemy(state, target.instanceId, (e) => ({
      ...e,
      currentHp: result.currentHp,
      block: result.block,
    }));
  }

  if (target === "all_allies") {
    let s = state;
    for (const ally of state.allies) {
      if (ally.currentHp <= 0) continue;
      const finalDmg = calculateDamage(scaledBaseDamage, sourceStats, {
        buffs: ally.buffs,
      });
      const result = applyDirectDamage(ally, finalDmg);
      s = updateAlly(s, ally.instanceId, (a) => ({
        ...a,
        currentHp: result.currentHp,
        block: result.block,
      }));
    }
    return s;
  }

  if (typeof target === "object" && target.type === "ally") {
    const ally = state.allies.find((a) => a.instanceId === target.instanceId);
    if (!ally || ally.currentHp <= 0) return state;
    const finalDmg = calculateDamage(scaledBaseDamage, sourceStats, {
      buffs: ally.buffs,
    });
    const result = applyDirectDamage(ally, finalDmg);
    return updateAlly(state, target.instanceId, (a) => ({
      ...a,
      currentHp: result.currentHp,
      block: result.block,
    }));
  }

  return state;
}

function applyDamagePerTargetBlockToTarget(
  state: CombatState,
  target: EffectTarget,
  divisor: number,
  source: EffectSource
): CombatState {
  const safeDivisor = Math.max(1, Math.floor(divisor));

  if (target === "player") {
    return applyDirectDamageToTarget(
      state,
      target,
      computeDamageFromTargetBlock(state.player.block, safeDivisor),
      source
    );
  }

  if (target === "all_enemies") {
    let current = state;
    for (const enemy of state.enemies) {
      if (enemy.currentHp <= 0) continue;
      current = applyDirectDamageToTarget(
        current,
        { type: "enemy", instanceId: enemy.instanceId },
        computeDamageFromTargetBlock(enemy.block, safeDivisor),
        source
      );
    }
    return current;
  }

  if (typeof target === "object" && target.type === "enemy") {
    const enemy = state.enemies.find(
      (entry) => entry.instanceId === target.instanceId
    );
    if (!enemy || enemy.currentHp <= 0) return state;
    return applyDirectDamageToTarget(
      state,
      target,
      computeDamageFromTargetBlock(enemy.block, safeDivisor),
      source
    );
  }

  if (target === "all_allies") {
    let current = state;
    for (const ally of state.allies) {
      if (ally.currentHp <= 0) continue;
      current = applyDirectDamageToTarget(
        current,
        { type: "ally", instanceId: ally.instanceId },
        computeDamageFromTargetBlock(ally.block, safeDivisor),
        source
      );
    }
    return current;
  }

  if (typeof target === "object" && target.type === "ally") {
    const ally = state.allies.find(
      (entry) => entry.instanceId === target.instanceId
    );
    if (!ally || ally.currentHp <= 0) return state;
    return applyDirectDamageToTarget(
      state,
      target,
      computeDamageFromTargetBlock(ally.block, safeDivisor),
      source
    );
  }

  return state;
}

function applyBlockToTarget(
  state: CombatState,
  target: EffectTarget,
  amount: number,
  focus: number
): CombatState {
  if (target === "player") {
    return updatePlayer(state, (p) => ({
      ...p,
      block: applyBlock(p.block, amount, focus),
    }));
  }

  if (typeof target === "object" && target.type === "enemy") {
    return updateEnemy(state, target.instanceId, (e) => ({
      ...e,
      block: applyBlock(e.block, amount, 0),
    }));
  }

  if (target === "all_allies") {
    let s = state;
    for (const ally of state.allies) {
      if (ally.currentHp <= 0) continue;
      s = updateAlly(s, ally.instanceId, (a) => ({
        ...a,
        block: applyBlock(a.block, amount, 0),
      }));
    }
    return s;
  }

  if (typeof target === "object" && target.type === "ally") {
    return updateAlly(state, target.instanceId, (a) => ({
      ...a,
      block: applyBlock(a.block, amount, 0),
    }));
  }

  return state;
}

function applyHealToTarget(
  state: CombatState,
  target: EffectTarget,
  amount: number
): CombatState {
  if (target === "player") {
    return updatePlayer(state, (p) => ({
      ...p,
      currentHp: Math.min(p.maxHp, p.currentHp + amount),
    }));
  }

  if (target === "all_allies") {
    let s = state;
    for (const ally of state.allies) {
      if (ally.currentHp <= 0) continue;
      s = updateAlly(s, ally.instanceId, (a) => ({
        ...a,
        currentHp: Math.min(a.maxHp, a.currentHp + amount),
      }));
    }
    return s;
  }

  if (typeof target === "object" && target.type === "ally") {
    return updateAlly(state, target.instanceId, (a) => ({
      ...a,
      currentHp: Math.min(a.maxHp, a.currentHp + amount),
    }));
  }

  return state;
}

function applyPoisonMultiplierToTarget(
  state: CombatState,
  target: EffectTarget,
  multiplier: number
): CombatState {
  const factor = Math.max(1, Math.floor(multiplier));
  if (factor <= 1) return state;

  const scalePoisonBuffs = <
    T extends { type: string; stacks: number; duration?: number },
  >(
    buffs: T[]
  ): T[] =>
    buffs.map((buff) =>
      buff.type === "POISON"
        ? ({ ...buff, stacks: Math.max(1, buff.stacks * factor) } as T)
        : buff
    );

  if (target === "all_enemies") {
    let current = state;
    for (const enemy of state.enemies) {
      if (enemy.currentHp <= 0) continue;
      current = updateEnemy(current, enemy.instanceId, (e) => ({
        ...e,
        buffs: scalePoisonBuffs(e.buffs),
      }));
    }
    return current;
  }

  if (typeof target === "object" && target.type === "enemy") {
    return updateEnemy(state, target.instanceId, (enemy) => ({
      ...enemy,
      buffs: scalePoisonBuffs(enemy.buffs),
    }));
  }

  return state;
}

function applyDamagePerDebuffToTarget(
  state: CombatState,
  target: EffectTarget,
  buff: Effect["buff"],
  perStackDamage: number,
  source: EffectSource
): CombatState {
  if (!buff || perStackDamage <= 0) return state;

  if (target === "player") {
    const stacks = getBuffStacks(state.player.buffs, buff);
    if (stacks <= 0) return state;
    return applyDamageToTarget(
      state,
      target,
      stacks * perStackDamage,
      source
    );
  }

  if (target === "all_enemies") {
    let current = state;
    for (const enemy of state.enemies) {
      if (enemy.currentHp <= 0) continue;
      const stacks = getBuffStacks(enemy.buffs, buff);
      if (stacks <= 0) continue;
      current = applyDamageToTarget(
        current,
        { type: "enemy", instanceId: enemy.instanceId },
        stacks * perStackDamage,
        source
      );
    }
    return current;
  }

  if (target === "all_allies") {
    let current = state;
    for (const ally of state.allies) {
      if (ally.currentHp <= 0) continue;
      const stacks = getBuffStacks(ally.buffs, buff);
      if (stacks <= 0) continue;
      current = applyDamageToTarget(
        current,
        { type: "ally", instanceId: ally.instanceId },
        stacks * perStackDamage,
        source
      );
    }
    return current;
  }

  if (typeof target === "object" && target.type === "enemy") {
    const enemy = state.enemies.find((e) => e.instanceId === target.instanceId);
    const stacks = getBuffStacks(enemy?.buffs ?? [], buff);
    if (stacks <= 0) return state;
    return applyDamageToTarget(
      state,
      target,
      stacks * perStackDamage,
      source
    );
  }

  if (typeof target === "object" && target.type === "ally") {
    const ally = state.allies.find((a) => a.instanceId === target.instanceId);
    const stacks = getBuffStacks(ally?.buffs ?? [], buff);
    if (stacks <= 0) return state;
    return applyDamageToTarget(
      state,
      target,
      stacks * perStackDamage,
      source
    );
  }

  return state;
}

function applyDamagePerCurrentInkToTarget(
  state: CombatState,
  target: EffectTarget,
  perInkDamage: number,
  source: EffectSource
): CombatState {
  const currentInk = Math.max(0, state.player.inkCurrent);
  let nextState = state;

  if (currentInk > 0 && perInkDamage > 0) {
    nextState = applyDamageToTarget(
      nextState,
      target,
      currentInk * perInkDamage,
      source
    );
  }

  return updatePlayer(nextState, (player) => ({
    ...player,
    inkCurrent: 0,
  }));
}

function applyDamagePerClogInDiscardToTarget(
  state: CombatState,
  target: EffectTarget,
  perCardDamage: number,
  source: EffectSource
): CombatState {
  const clogCount = state.discardPile.reduce(
    (sum, card) => sum + (isClogCardDefinitionId(card.definitionId) ? 1 : 0),
    0
  );
  if (clogCount <= 0 || perCardDamage <= 0) return state;
  return applyDamageToTarget(state, target, clogCount * perCardDamage, source);
}

function applyDamagePerExhaustedCardToTarget(
  state: CombatState,
  target: EffectTarget,
  perCardDamage: number,
  source: EffectSource
): CombatState {
  const exhaustedCount = Math.max(0, state.exhaustPile.length);
  if (exhaustedCount <= 0 || perCardDamage <= 0) return state;
  return applyDamageToTarget(
    state,
    target,
    exhaustedCount * perCardDamage,
    source
  );
}

function applyDamagePerDrawnThisTurnToTarget(
  state: CombatState,
  target: EffectTarget,
  perCardDamage: number,
  source: EffectSource
): CombatState {
  const drawnCount = Math.max(
    0,
    Math.floor(state.relicCounters?.turn_drawn_count ?? 0)
  );
  if (drawnCount <= 0 || perCardDamage <= 0) return state;
  return applyDamageToTarget(state, target, drawnCount * perCardDamage, source);
}

function applyBlockPerCurrentInkToTarget(
  state: CombatState,
  target: EffectTarget,
  perInkBlock: number
): CombatState {
  const currentInk = Math.max(0, state.player.inkCurrent);
  let nextState = state;

  if (currentInk > 0 && perInkBlock > 0) {
    nextState = applyBlockToTarget(
      nextState,
      target,
      currentInk * perInkBlock,
      nextState.player.focus
    );
  }

  return updatePlayer(nextState, (player) => ({
    ...player,
    inkCurrent: 0,
  }));
}

function applyBlockPerExhaustedCardToTarget(
  state: CombatState,
  target: EffectTarget,
  perCardBlock: number
): CombatState {
  const exhaustedCount = Math.max(0, state.exhaustPile.length);
  if (exhaustedCount <= 0 || perCardBlock <= 0) return state;
  return applyBlockToTarget(
    state,
    target,
    exhaustedCount * perCardBlock,
    state.player.focus
  );
}

function getOpposingDebuffStacks(
  state: CombatState,
  source: EffectSource,
  buff: Effect["buff"]
): number {
  if (!buff) return 0;

  if (source === "player" || source.type === "ally") {
    return state.enemies.reduce((sum, enemy) => {
      if (enemy.currentHp <= 0) return sum;
      return sum + getBuffStacks(enemy.buffs, buff);
    }, 0);
  }

  let total = getBuffStacks(state.player.buffs, buff);
  for (const ally of state.allies) {
    if (ally.currentHp <= 0) continue;
    total += getBuffStacks(ally.buffs, buff);
  }
  return total;
}

function applyBuffPerDebuffToFriendlyTarget(
  state: CombatState,
  target: EffectTarget,
  source: EffectSource,
  appliedBuff: Effect["buff"],
  scalingBuff: Effect["scalingBuff"],
  perStackValue: number
): CombatState {
  if (!appliedBuff || !scalingBuff || perStackValue <= 0) return state;

  const totalStacks = getOpposingDebuffStacks(state, source, scalingBuff);
  if (totalStacks <= 0) return state;

  const buffTarget = getFriendlySupportTarget(source, target);
  const appliedValue = totalStacks * perStackValue;

  if (buffTarget === "player") {
    return updatePlayer(state, (player) => ({
      ...player,
      strength:
        appliedBuff === "STRENGTH"
          ? player.strength + appliedValue
          : player.strength,
      focus:
        appliedBuff === "FOCUS" ? player.focus + appliedValue : player.focus,
      buffs:
        appliedBuff === "STRENGTH" || appliedBuff === "FOCUS"
          ? player.buffs
          : applyBuff(player.buffs, appliedBuff, appliedValue),
    }));
  }

  if (buffTarget === "all_allies") {
    let current = state;
    current = updatePlayer(current, (player) => ({
      ...player,
      buffs: applyBuff(player.buffs, appliedBuff, appliedValue),
    }));
    for (const ally of current.allies) {
      if (ally.currentHp <= 0) continue;
      current = updateAlly(current, ally.instanceId, (entity) => ({
        ...entity,
        buffs: applyBuff(entity.buffs, appliedBuff, appliedValue),
      }));
    }
    return current;
  }

  if (typeof buffTarget === "object" && buffTarget.type === "ally") {
    return updateAlly(state, buffTarget.instanceId, (ally) => ({
      ...ally,
      buffs: applyBuff(ally.buffs, appliedBuff, appliedValue),
    }));
  }

  if (typeof buffTarget === "object" && buffTarget.type === "enemy") {
    return updateEnemy(state, buffTarget.instanceId, (enemy) => ({
      ...enemy,
      buffs: applyBuff(enemy.buffs, appliedBuff, appliedValue),
    }));
  }

  return state;
}

function applyBuffPerExhaustedCardToFriendlyTarget(
  state: CombatState,
  target: EffectTarget,
  source: EffectSource,
  appliedBuff: Effect["buff"],
  perCardValue: number
): CombatState {
  if (!appliedBuff || perCardValue <= 0) return state;

  const exhaustedCount = Math.max(0, state.exhaustPile.length);
  if (exhaustedCount <= 0) return state;

  const buffTarget = getFriendlySupportTarget(source, target);
  const appliedValue = exhaustedCount * perCardValue;

  if (buffTarget === "player") {
    return updatePlayer(state, (player) => ({
      ...player,
      strength:
        appliedBuff === "STRENGTH"
          ? player.strength + appliedValue
          : player.strength,
      focus:
        appliedBuff === "FOCUS" ? player.focus + appliedValue : player.focus,
      buffs:
        appliedBuff === "STRENGTH" || appliedBuff === "FOCUS"
          ? player.buffs
          : applyBuff(player.buffs, appliedBuff, appliedValue),
    }));
  }

  if (buffTarget === "all_allies") {
    let current = state;
    current = updatePlayer(current, (player) => ({
      ...player,
      buffs: applyBuff(player.buffs, appliedBuff, appliedValue),
    }));
    for (const ally of current.allies) {
      if (ally.currentHp <= 0) continue;
      current = updateAlly(current, ally.instanceId, (entity) => ({
        ...entity,
        buffs: applyBuff(entity.buffs, appliedBuff, appliedValue),
      }));
    }
    return current;
  }

  if (typeof buffTarget === "object" && buffTarget.type === "ally") {
    return updateAlly(state, buffTarget.instanceId, (ally) => ({
      ...ally,
      buffs: applyBuff(ally.buffs, appliedBuff, appliedValue),
    }));
  }

  if (typeof buffTarget === "object" && buffTarget.type === "enemy") {
    return updateEnemy(state, buffTarget.instanceId, (enemy) => ({
      ...enemy,
      buffs: applyBuff(enemy.buffs, appliedBuff, appliedValue),
    }));
  }

  return state;
}

function moveRandomNonClogDiscardToHand(
  state: CombatState,
  count: number,
  rng: RNG
): CombatState {
  if (count <= 0 || state.discardPile.length === 0) return state;

  let current = state;
  let remaining = Math.max(0, Math.floor(count));

  while (remaining > 0) {
    const eligible = current.discardPile.filter(
      (card) => !isClogCardDefinitionId(card.definitionId)
    );
    if (eligible.length === 0) break;
    const picked = rng.pick(eligible);
    current = moveFromDiscardToHand(current, picked.instanceId);
    remaining--;
  }

  return current;
}

function freezeCardsInHand(state: CombatState, count: number): CombatState {
  if (count <= 0) return state;
  const alreadyFrozen = new Set(
    state.playerDisruption?.frozenHandCardIds ?? []
  );
  const toFreeze = state.hand
    .filter((c) => !alreadyFrozen.has(c.instanceId))
    .slice(0, count)
    .map((c) => c.instanceId);
  if (toFreeze.length === 0) {
    return {
      ...state,
      playerDisruption: {
        ...state.playerDisruption,
        freezeNextDrawsRemaining:
          (state.playerDisruption.freezeNextDrawsRemaining ?? 0) + count,
      },
    };
  }

  return {
    ...state,
    playerDisruption: {
      ...state.playerDisruption,
      frozenHandCardIds: [...alreadyFrozen, ...toFreeze],
      freezeNextDrawsRemaining:
        (state.playerDisruption.freezeNextDrawsRemaining ?? 0) +
        (count - toFreeze.length),
    },
  };
}

function forceDiscardRandom(
  state: CombatState,
  count: number,
  rng: RNG,
  ctx?: EffectContext
): CombatState {
  if (count <= 0 || state.hand.length === 0) return state;
  let current = {
    ...state,
    hand: [...state.hand],
    discardPile: [...state.discardPile],
  };
  let remaining = Math.min(count, current.hand.length);
  while (remaining > 0 && current.hand.length > 0) {
    const idx = rng.nextInt(0, current.hand.length - 1);
    const [card] = current.hand.splice(idx, 1);
    if (!card) break;
    current.discardPile.push(card);
    const frozen = new Set(current.playerDisruption?.frozenHandCardIds ?? []);
    frozen.delete(card.instanceId);
    current = {
      ...current,
      playerDisruption: {
        ...current.playerDisruption,
        frozenHandCardIds: [...frozen],
      },
    };
    const def = ctx?.cardDefs?.get(card.definitionId);
    const onRandomDiscardEffects = card.upgraded
      ? (def?.upgrade?.onRandomDiscardEffects ??
        def?.onRandomDiscardEffects ??
        [])
      : (def?.onRandomDiscardEffects ?? []);
    if (onRandomDiscardEffects.length > 0) {
      current = resolveEffects(
        current,
        onRandomDiscardEffects,
        {
          source: "player",
          target: "player",
          drawReason: `RANDOM_DISCARD:${card.definitionId}`,
          cardDefs: ctx?.cardDefs,
        },
        rng
      );
    }
    remaining--;
  }
  return current;
}

export function resolveEffect(
  state: CombatState,
  effect: Effect,
  ctx: EffectContext,
  rng: RNG
): CombatState {
  const sourceStats = getSourceStats(state, ctx.source);

  switch (effect.type) {
    case "DAMAGE":
      return applyDamageToTarget(state, ctx.target, effect.value, ctx.source);

    case "DAMAGE_PER_TARGET_BLOCK":
      return applyDamagePerTargetBlockToTarget(
        state,
        ctx.target,
        effect.value,
        ctx.source
      );

    case "DAMAGE_EQUAL_BLOCK": {
      const blockValue = Math.max(0, state.player.block);
      const multiplier = Math.max(1, Math.floor(effect.value));
      return applyDamageToTarget(
        state,
        ctx.target,
        blockValue * multiplier,
        ctx.source
      );
    }

    case "BLOCK":
      // Player-origin block uses the chosen target (player or ally).
      if (ctx.source === "player") {
        return applyBlockToTarget(
          state,
          getFriendlySupportTarget(ctx.source, ctx.target),
          effect.value,
          sourceStats.focus
        );
      }
      if (typeof ctx.source === "object" && ctx.source.type === "enemy") {
        return applyBlockToTarget(
          state,
          getFriendlySupportTarget(ctx.source, ctx.target),
          effect.value,
          0
        );
      }
      if (typeof ctx.source === "object" && ctx.source.type === "ally") {
        return applyBlockToTarget(
          state,
          getFriendlySupportTarget(ctx.source, ctx.target),
          effect.value,
          0
        );
      }
      return state;

    case "HEAL":
      return applyHealToTarget(
        state,
        getFriendlySupportTarget(ctx.source, ctx.target),
        effect.value
      );

    case "DRAW_CARDS":
      return drawCards(
        state,
        effect.value,
        rng,
        ctx.source === "player"
          ? "PLAYER"
          : typeof ctx.source === "object" && ctx.source.type === "ally"
            ? "SYSTEM"
            : "ENEMY",
        ctx.source === "player"
          ? (ctx.drawReason ?? "PLAYER_EFFECT_DRAW")
          : typeof ctx.source === "object" && ctx.source.type === "ally"
            ? (ctx.drawReason ?? "ALLY_EFFECT_DRAW")
            : (ctx.drawReason ?? "ENEMY_EFFECT_DRAW")
      );

    case "DOUBLE_POISON":
      return applyPoisonMultiplierToTarget(state, ctx.target, effect.value);

    case "DAMAGE_PER_DEBUFF":
      return applyDamagePerDebuffToTarget(
        state,
        ctx.target,
        effect.buff,
        effect.value,
        ctx.source
      );

    case "DAMAGE_PER_CURRENT_INK":
      return applyDamagePerCurrentInkToTarget(
        state,
        ctx.target,
        effect.value,
        ctx.source
      );

    case "DAMAGE_PER_CLOG_IN_DISCARD":
      return applyDamagePerClogInDiscardToTarget(
        state,
        ctx.target,
        effect.value,
        ctx.source
      );

    case "DAMAGE_PER_EXHAUSTED_CARD":
      return applyDamagePerExhaustedCardToTarget(
        state,
        ctx.target,
        effect.value,
        ctx.source
      );

    case "DAMAGE_PER_DRAWN_THIS_TURN":
      return applyDamagePerDrawnThisTurnToTarget(
        state,
        ctx.target,
        effect.value,
        ctx.source
      );

    case "BLOCK_PER_CURRENT_INK":
      return applyBlockPerCurrentInkToTarget(
        state,
        getFriendlySupportTarget(ctx.source, ctx.target),
        effect.value
      );

    case "GAIN_ENERGY":
      return updatePlayer(state, (p) => ({
        ...p,
        energyCurrent: p.energyCurrent + effect.value,
      }));

    case "GAIN_INK":
      return updatePlayer(state, (p) => ({
        ...p,
        inkCurrent: Math.min(p.inkMax, p.inkCurrent + effect.value),
      }));

    case "GAIN_STRENGTH": {
      if (getFriendlySupportTarget(ctx.source, ctx.target) !== "player") {
        return state;
      }
      return updatePlayer(state, (p) => ({
        ...p,
        strength: p.strength + effect.value,
      }));
    }

    case "GAIN_FOCUS": {
      if (getFriendlySupportTarget(ctx.source, ctx.target) !== "player") {
        return state;
      }
      return updatePlayer(state, (p) => ({
        ...p,
        focus: p.focus + effect.value,
      }));
    }

    case "APPLY_BUFF":
    case "APPLY_DEBUFF": {
      if (!effect.buff) return state;
      const sourceEnemyId =
        typeof ctx.source === "object" && ctx.source.type === "enemy"
          ? ctx.source.instanceId
          : null;
      const sourceEnemy =
        sourceEnemyId != null
          ? state.enemies.find((e) => e.instanceId === sourceEnemyId)
          : null;
      const bossDebuffBonus =
        effect.type === "APPLY_DEBUFF" &&
        sourceEnemy?.isBoss &&
        ctx.target === "player"
          ? getBossDebuffBonus(state.difficultyLevel ?? 0)
          : 0;
      const effectValue = effect.value + bossDebuffBonus;

      if (ctx.target === "player") {
        return updatePlayer(state, (p) => ({
          ...p,
          buffs: applyBuff(p.buffs, effect.buff!, effectValue, effect.duration),
        }));
      }

      if (ctx.target === "all_enemies") {
        let s = state;
        for (const enemy of state.enemies) {
          if (enemy.currentHp <= 0) continue;
          s = updateEnemy(s, enemy.instanceId, (e) => ({
            ...e,
            buffs: applyBuff(
              e.buffs,
              effect.buff!,
              effectValue,
              effect.duration
            ),
          }));
        }
        return s;
      }

      if (typeof ctx.target === "object" && ctx.target.type === "enemy") {
        return updateEnemy(state, ctx.target.instanceId, (e) => ({
          ...e,
          buffs: applyBuff(e.buffs, effect.buff!, effectValue, effect.duration),
        }));
      }

      if (ctx.target === "all_allies") {
        let s = state;
        for (const ally of state.allies) {
          if (ally.currentHp <= 0) continue;
          s = updateAlly(s, ally.instanceId, (a) => ({
            ...a,
            buffs: applyBuff(
              a.buffs,
              effect.buff!,
              effectValue,
              effect.duration
            ),
          }));
        }
        return s;
      }

      if (typeof ctx.target === "object" && ctx.target.type === "ally") {
        return updateAlly(state, ctx.target.instanceId, (a) => ({
          ...a,
          buffs: applyBuff(a.buffs, effect.buff!, effectValue, effect.duration),
        }));
      }

      return state;
    }

    case "BLOCK_PER_DEBUFF": {
      const totalStacks = getOpposingDebuffStacks(state, ctx.source, effect.buff);
      if (totalStacks <= 0) return state;
      return applyBlockToTarget(
        state,
        getFriendlySupportTarget(ctx.source, ctx.target),
        totalStacks * effect.value,
        ctx.source === "player" ? sourceStats.focus : 0
      );
    }

    case "BLOCK_PER_EXHAUSTED_CARD":
      return applyBlockPerExhaustedCardToTarget(
        state,
        getFriendlySupportTarget(ctx.source, ctx.target),
        effect.value
      );

    case "APPLY_BUFF_PER_DEBUFF":
      return applyBuffPerDebuffToFriendlyTarget(
        state,
        ctx.target,
        ctx.source,
        effect.buff,
        effect.scalingBuff,
        effect.value
      );

    case "APPLY_BUFF_PER_EXHAUSTED_CARD":
      return applyBuffPerExhaustedCardToFriendlyTarget(
        state,
        ctx.target,
        ctx.source,
        effect.buff,
        effect.value
      );

    case "RETRIGGER_THORNS_ON_WEAK_ATTACK":
      return {
        ...state,
        relicCounters: {
          ...(state.relicCounters ?? {}),
          [WEAK_ATTACK_THORNS_RETRIGGER_COUNTER]:
            Math.max(
              0,
              Math.floor(
                state.relicCounters?.[WEAK_ATTACK_THORNS_RETRIGGER_COUNTER] ?? 0
              )
            ) + Math.max(0, Math.floor(effect.value)),
        },
      };

    case "DRAIN_INK":
      return updatePlayer(state, (p) => ({
        ...p,
        inkCurrent: Math.max(0, p.inkCurrent - effect.value),
      }));

    case "EXHAUST":
      // Handled at card-play level, not here
      return state;

    case "ADD_CARD_TO_DRAW":
      if (!effect.cardId) return state;
      return {
        ...state,
        drawPile: [
          ...state.drawPile,
          {
            instanceId: nanoid(),
            definitionId: effect.cardId,
            upgraded: false,
          },
        ],
      };

    case "ADD_CARD_TO_DISCARD":
      if (!effect.cardId) return state;
      return {
        ...state,
        discardPile: [
          ...state.discardPile,
          {
            instanceId: nanoid(),
            definitionId: effect.cardId,
            upgraded: false,
          },
        ],
      };

    case "MOVE_RANDOM_NON_CLOG_DISCARD_TO_HAND":
      return moveRandomNonClogDiscardToHand(state, effect.value, rng);

    case "FREEZE_HAND_CARDS":
      return freezeCardsInHand(state, Math.max(0, Math.floor(effect.value)));

    case "NEXT_DRAW_TO_DISCARD_THIS_TURN":
      return {
        ...state,
        playerDisruption: {
          ...state.playerDisruption,
          drawsToDiscardRemaining:
            (state.playerDisruption.drawsToDiscardRemaining ?? 0) +
            Math.max(0, Math.floor(effect.value)),
        },
      };

    case "DISABLE_INK_POWER_THIS_TURN": {
      const power = effect.inkPower ?? "ALL";
      return {
        ...state,
        playerDisruption: {
          ...state.playerDisruption,
          disabledInkPowers: Array.from(
            new Set([
              ...(state.playerDisruption.disabledInkPowers ?? []),
              power,
            ])
          ),
        },
      };
    }

    case "INCREASE_CARD_COST_THIS_TURN":
      return {
        ...state,
        playerDisruption: {
          ...state.playerDisruption,
          extraCardCost:
            (state.playerDisruption.extraCardCost ?? 0) +
            Math.max(0, Math.floor(effect.value)),
        },
      };

    case "INCREASE_CARD_COST_NEXT_TURN":
      return {
        ...state,
        nextPlayerDisruption: {
          ...state.nextPlayerDisruption,
          extraCardCost:
            (state.nextPlayerDisruption.extraCardCost ?? 0) +
            Math.max(0, Math.floor(effect.value)),
        },
      };

    case "REDUCE_DRAW_THIS_TURN":
      return {
        ...state,
        playerDisruption: {
          ...state.playerDisruption,
          drawPenalty:
            (state.playerDisruption.drawPenalty ?? 0) +
            Math.max(0, Math.floor(effect.value)),
        },
      };

    case "REDUCE_DRAW_NEXT_TURN":
      return {
        ...state,
        nextPlayerDisruption: {
          ...state.nextPlayerDisruption,
          drawPenalty:
            (state.nextPlayerDisruption.drawPenalty ?? 0) +
            Math.max(0, Math.floor(effect.value)),
        },
      };

    case "FORCE_DISCARD_RANDOM":
      return forceDiscardRandom(
        state,
        Math.max(0, Math.floor(effect.value)),
        rng,
        ctx
      );

    case "DAMAGE_BONUS_IF_UPGRADED_IN_HAND": {
      const hasUpgraded = state.hand.some((c) => c.upgraded);
      if (!hasUpgraded) return state;
      return applyDamageToTarget(state, ctx.target, effect.value, ctx.source);
    }

    case "UPGRADE_RANDOM_CARD_IN_HAND": {
      const upgradeable = state.hand.filter(
        (c) => !c.upgraded && c.instanceId !== ctx.sourceCardInstanceId
      );
      if (upgradeable.length === 0) return state;
      const picked = rng.pick(upgradeable);
      return {
        ...state,
        hand: state.hand.map((c) =>
          c.instanceId === picked.instanceId ? { ...c, upgraded: true } : c
        ),
      };
    }

    default:
      return state;
  }
}

function getEnemyThornsRetaliationDamage(
  state: CombatState,
  target: EffectTarget
): number {
  if (target === "all_enemies") {
    return state.enemies.reduce((sum, enemy) => {
      if (enemy.currentHp <= 0) return sum;
      return sum + Math.max(0, getBuffStacks(enemy.buffs, "THORNS"));
    }, 0);
  }

  if (typeof target === "object" && target.type === "enemy") {
    const enemy = state.enemies.find((e) => e.instanceId === target.instanceId);
    if (!enemy || enemy.currentHp <= 0) return 0;
    return Math.max(0, getBuffStacks(enemy.buffs, "THORNS"));
  }

  return 0;
}

function applyThornsRetaliationToPlayer(
  state: CombatState,
  retaliationDamage: number
): CombatState {
  if (retaliationDamage <= 0 || state.player.currentHp <= 0) return state;
  const result = applyDamage(state.player, retaliationDamage);
  return updatePlayer(state, (p) => ({
    ...p,
    currentHp: result.currentHp,
    block: result.block,
  }));
}

export function resolveEffects(
  state: CombatState,
  effects: Effect[],
  ctx: EffectContext,
  rng: RNG
): CombatState {
  let current = state;
  let damageFullyBlocked = false;
  const sourceEnemyId =
    typeof ctx.source === "object" && ctx.source.type === "enemy"
      ? ctx.source.instanceId
      : null;
  const sourceEnemy =
    sourceEnemyId != null
      ? state.enemies.find((e) => e.instanceId === sourceEnemyId)
      : null;
  const sourceDebuffsBypassBlock =
    sourceEnemy != null &&
    enemyDebuffsBypassBlock(state.difficultyLevel ?? 0, sourceEnemy);

  for (const effect of effects) {
    // When an enemy attacks the player and damage was fully blocked,
    // skip debuffs and ink drain — they only apply if damage gets through
    if (
      damageFullyBlocked &&
      !sourceDebuffsBypassBlock &&
      ctx.target === "player" &&
      typeof ctx.source === "object" &&
      ctx.source.type === "enemy" &&
      (effect.type === "APPLY_DEBUFF" || effect.type === "DRAIN_INK")
    ) {
      continue;
    }

    // Track whether damage was fully absorbed by block
    if (
      (effect.type === "DAMAGE" || effect.type === "DAMAGE_PER_TARGET_BLOCK") &&
      ctx.target === "player"
    ) {
      const hpBefore = current.player.currentHp;
      const thorns = getBuffStacks(current.player.buffs, "THORNS");
      current = resolveEffect(current, effect, ctx, rng);
      damageFullyBlocked = current.player.currentHp >= hpBefore;

      // Thorns retaliates when enemies hit the player.
      if (
        thorns > 0 &&
        typeof ctx.source === "object" &&
        ctx.source.type === "enemy"
      ) {
        const enemySourceId = ctx.source.instanceId;
        const attacker = current.enemies.find(
          (e) => e.instanceId === enemySourceId
        );
        if (attacker && attacker.currentHp > 0) {
          const weakAttackRetriggers = Math.max(
            0,
            Math.floor(
              current.relicCounters?.[WEAK_ATTACK_THORNS_RETRIGGER_COUNTER] ?? 0
            )
          );
          const retaliationDamage =
            thorns +
            (getBuffStacks(attacker.buffs, "WEAK") > 0
              ? thorns * weakAttackRetriggers
              : 0);
          const thornsResult = applyDamage(attacker, retaliationDamage);
          current = updateEnemy(current, attacker.instanceId, (e) => ({
            ...e,
            currentHp: thornsResult.currentHp,
            block: thornsResult.block,
          }));
        }
      }
    } else if (
      (effect.type === "DAMAGE" || effect.type === "DAMAGE_PER_TARGET_BLOCK") &&
      ctx.source === "player" &&
      (ctx.target === "all_enemies" ||
        (typeof ctx.target === "object" && ctx.target.type === "enemy"))
    ) {
      // Enemy thorns retaliate when the player deals direct damage.
      const retaliationDamage = getEnemyThornsRetaliationDamage(
        current,
        ctx.target
      );
      current = resolveEffect(current, effect, ctx, rng);
      current = applyThornsRetaliationToPlayer(current, retaliationDamage);
    } else {
      current = resolveEffect(current, effect, ctx, rng);
    }
  }
  return current;
}

import type { CombatState } from "../schemas/combat-state";
import type { Effect } from "../schemas/effects";
import type { PlayerState, EnemyState, AllyState } from "../schemas/entities";
import { calculateDamage, applyDamage, applyBlock } from "./damage";
import { applyBuff, getBuffStacks } from "./buffs";
import { drawCards } from "./deck";
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
}

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
    const rawDamage = calculateDamage(scaledBaseDamage, sourceStats, {
      buffs: state.player.buffs,
    });
    const canUseFirstHitReduction =
      typeof source === "object" &&
      source.type === "enemy" &&
      !state.firstHitReductionUsed &&
      state.player.firstHitDamageReductionPercent > 0 &&
      rawDamage > 0;
    const finalDmg = canUseFirstHitReduction
      ? Math.floor(
          (rawDamage * (100 - state.player.firstHitDamageReductionPercent)) /
            100
        )
      : rawDamage;
    const result = applyDamage(state.player, finalDmg);
    return {
      ...updatePlayer(state, (p) => ({
        ...p,
        currentHp: result.currentHp,
        block: result.block,
      })),
      firstHitReductionUsed: canUseFirstHitReduction
        ? true
        : state.firstHitReductionUsed,
    };
  }

  if (target === "all_enemies") {
    let s = state;
    for (const enemy of state.enemies) {
      if (enemy.currentHp <= 0) continue;
      const finalDmg = calculateDamage(scaledBaseDamage, sourceStats, {
        buffs: enemy.buffs,
      });
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
    const enemy = state.enemies.find((e) => e.instanceId === target.instanceId);
    if (!enemy || enemy.currentHp <= 0) return state;
    const finalDmg = calculateDamage(scaledBaseDamage, sourceStats, {
      buffs: enemy.buffs,
    });
    const result = applyDamage(enemy, finalDmg);
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
    const ally = state.allies.find((a) => a.instanceId === target.instanceId);
    if (!ally || ally.currentHp <= 0) return state;
    const finalDmg = calculateDamage(scaledBaseDamage, sourceStats, {
      buffs: ally.buffs,
    });
    const result = applyDamage(ally, finalDmg);
    return updateAlly(state, target.instanceId, (a) => ({
      ...a,
      currentHp: result.currentHp,
      block: result.block,
    }));
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

    case "BLOCK":
      // Player-origin block uses the chosen target (player or ally).
      if (ctx.source === "player") {
        return applyBlockToTarget(
          state,
          ctx.target,
          effect.value,
          sourceStats.focus
        );
      }
      if (typeof ctx.source === "object" && ctx.source.type === "enemy") {
        return applyBlockToTarget(
          state,
          { type: "enemy", instanceId: ctx.source.instanceId },
          effect.value,
          0
        );
      }
      return state;

    case "HEAL":
      return applyHealToTarget(state, ctx.target, effect.value);

    case "DRAW_CARDS":
      return drawCards(state, effect.value, rng);

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

    case "GAIN_STRENGTH":
      if (ctx.target === "player") {
        return updatePlayer(state, (p) => ({
          ...p,
          strength: p.strength + effect.value,
        }));
      }
      return state;

    case "GAIN_FOCUS":
      if (ctx.target === "player") {
        return updatePlayer(state, (p) => ({
          ...p,
          focus: p.focus + effect.value,
        }));
      }
      return state;

    case "APPLY_BUFF":
    case "APPLY_DEBUFF": {
      if (!effect.buff) return state;

      if (ctx.target === "player") {
        return updatePlayer(state, (p) => ({
          ...p,
          buffs: applyBuff(
            p.buffs,
            effect.buff!,
            effect.value,
            effect.duration
          ),
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
              effect.value,
              effect.duration
            ),
          }));
        }
        return s;
      }

      if (typeof ctx.target === "object" && ctx.target.type === "enemy") {
        return updateEnemy(state, ctx.target.instanceId, (e) => ({
          ...e,
          buffs: applyBuff(
            e.buffs,
            effect.buff!,
            effect.value,
            effect.duration
          ),
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
              effect.value,
              effect.duration
            ),
          }));
        }
        return s;
      }

      if (typeof ctx.target === "object" && ctx.target.type === "ally") {
        return updateAlly(state, ctx.target.instanceId, (a) => ({
          ...a,
          buffs: applyBuff(
            a.buffs,
            effect.buff!,
            effect.value,
            effect.duration
          ),
        }));
      }

      return state;
    }

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

    default:
      return state;
  }
}

export function resolveEffects(
  state: CombatState,
  effects: Effect[],
  ctx: EffectContext,
  rng: RNG
): CombatState {
  let current = state;
  let damageFullyBlocked = false;

  for (const effect of effects) {
    // When an enemy attacks the player and damage was fully blocked,
    // skip debuffs and ink drain — they only apply if damage gets through
    if (
      damageFullyBlocked &&
      ctx.target === "player" &&
      typeof ctx.source === "object" &&
      ctx.source.type === "enemy" &&
      (effect.type === "APPLY_DEBUFF" || effect.type === "DRAIN_INK")
    ) {
      continue;
    }

    // Track whether damage was fully absorbed by block
    if (effect.type === "DAMAGE" && ctx.target === "player") {
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
          const thornsResult = applyDamage(attacker, thorns);
          current = updateEnemy(current, attacker.instanceId, (e) => ({
            ...e,
            currentHp: thornsResult.currentHp,
            block: thornsResult.block,
          }));
        }
      }
    } else {
      current = resolveEffect(current, effect, ctx, rng);
    }
  }
  return current;
}

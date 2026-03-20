import type { CombatState } from "../schemas/combat-state";
import type {
  EnemyDefinition,
  EnemyState,
  AllyDefinition,
  AllyState,
  EnemyAbility,
  AbilityCondition,
} from "../schemas/entities";
import { resolveEffects } from "./effects";
import type { EffectTarget } from "./effects";
import {
  applyPoison,
  applyBleed,
  tickBuffs,
  applyBuff,
  getBuffStacks,
  removeBuff,
} from "./buffs";
import type { RNG } from "./rng";
import { getDifficultyModifiers } from "./difficulty";
import { synchronizeArchivistCombatState } from "./archivist";
import {
  applyBossAbilityMechanics,
  maybeTriggerBossPhase,
} from "./boss-mechanics";
import {
  CHAPTER_GUARDIAN_REBIND_INTENT_INDEX,
  isChapterGuardianRebindPending,
  performChapterGuardianRebind,
} from "./chapter-guardian";
import { synchronizeHydraCombatState } from "./hydra";
import { synchronizeKoscheiCombatState } from "./koschei";
import { synchronizeMedusaCombatState } from "./medusa";
import { synchronizeAnansiCombatState } from "./anansi-weaver";
import { synchronizeCernunnosCombatState } from "./cernunnos-shade";
import { synchronizeDagdaCombatState } from "./dagda-shadow";
import { synchronizeNyarlathotepCombatState } from "./nyarlathotep";
import { synchronizeOsirisCombatState } from "./osiris-judgment";
import { synchronizeQuetzalcoatlCombatState } from "./quetzalcoatl";
import { synchronizeRaCombatState } from "./ra-avatar";
import { synchronizeShubCombatState } from "./shub-spawn";
import { synchronizeSoundiataCombatState } from "./soundiata-spirit";
import { synchronizeTezcatlipocaCombatState } from "./tezcatlipoca";

const SPLIT_ASSAULT_NAME = "Split Assault";
const PREDATOR_FORMATION_NAME = "Predator Formation";
const DOMINION_SWEEP_NAME = "Dominion Sweep";
const ALLY_RECKONING_NAME = "Ally Reckoning";

function evaluateCondition(
  condition: AbilityCondition,
  state: CombatState,
  enemy: EnemyState
): boolean {
  switch (condition.type) {
    case "PLAYER_HP_BELOW_PCT":
      return (
        (state.player.currentHp / state.player.maxHp) * 100 <
        condition.threshold
      );
    case "ENEMY_HP_BELOW_PCT":
      return (enemy.currentHp / enemy.maxHp) * 100 < condition.threshold;
    case "PLAYER_HAS_DEBUFF":
      return state.player.buffs.some(
        (b) => b.type === condition.buff && b.stacks > 0
      );
    case "PLAYER_BLOCK_ABOVE":
      return state.player.block > condition.value;
    case "PLAYER_INK_ABOVE":
      return state.player.inkCurrent > condition.value;
    case "PLAYER_INK_BELOW":
      return state.player.inkCurrent < condition.value;
    case "TURN_MULTIPLE":
      return state.turnNumber % condition.n === 0;
    case "ENEMY_HAS_NO_BLOCK":
      return enemy.block <= 0;
    case "ALLY_ALIVE":
      return state.allies.some((a) => a.currentHp > 0);
    case "NO_OTHER_ENEMIES":
      return !state.enemies.some(
        (e) => e.instanceId !== enemy.instanceId && e.currentHp > 0
      );
    default:
      return false;
  }
}

function getEffectiveWeight(
  ability: EnemyAbility,
  state: CombatState,
  enemy: EnemyState
): number {
  let weight = Math.max(0.01, ability.weight ?? 1);
  if (ability.conditionalWeights) {
    for (const cw of ability.conditionalWeights) {
      if (evaluateCondition(cw.condition, state, enemy)) {
        weight *= cw.weightMultiplier;
      }
    }
  }
  if (ability.isDisruption) {
    const diffMods = getDifficultyModifiers(state.difficultyLevel ?? 0);
    weight += diffMods.disruptionWeightBonus;
  }
  return Math.max(0.01, weight);
}

/**
 * Determine which ability an enemy will use next.
 * Uses ability weights with a soft anti-repeat penalty.
 * If state is provided, conditional weights are applied for contextual AI.
 */
export function getNextIntentIndex(
  enemy: EnemyState,
  enemyDef: EnemyDefinition,
  rng: RNG,
  state?: CombatState
): number {
  const abilities = enemyDef.abilities;
  if (abilities.length === 0) return 0;
  const selectableIndexes = abilities
    .map((_, index) => index)
    .filter((index) =>
      enemyDef.id === "chapter_guardian" &&
      !isChapterGuardianRebindPending(enemy)
        ? index !== CHAPTER_GUARDIAN_REBIND_INTENT_INDEX
        : true
    );
  if (selectableIndexes.length === 0) return 0;
  if (selectableIndexes.length === 1) return selectableIndexes[0]!;

  const repeatPenalty = selectableIndexes.length >= 3 ? 0.2 : 0.6;
  const weights = selectableIndexes.map((index) => {
    const ability = abilities[index]!;
    const base = state
      ? getEffectiveWeight(ability, state, enemy)
      : Math.max(0.01, ability.weight ?? 1);
    return {
      index,
      weight: index === enemy.intentIndex ? base * repeatPenalty : base,
    };
  });

  const total = weights.reduce((sum, entry) => sum + entry.weight, 0);
  if (total <= 0) {
    return selectableIndexes[0]!;
  }

  let roll = rng.next() * total;
  for (const entry of weights) {
    roll -= entry.weight;
    if (roll <= 0) return entry.index;
  }
  return weights[weights.length - 1]!.index;
}

/**
 * Execute a single enemy's turn.
 */
export function executeOneEnemyTurn(
  state: CombatState,
  enemy: EnemyState,
  enemyDef: EnemyDefinition,
  rng: RNG,
  enemyDefs?: Map<string, EnemyDefinition>
): CombatState {
  if (enemy.currentHp <= 0) return state;
  if (enemyDef.abilities.length === 0) return state;
  const forcedChapterGuardianRebind =
    enemyDef.id === "chapter_guardian" && isChapterGuardianRebindPending(enemy)
      ? (enemyDef.abilities[CHAPTER_GUARDIAN_REBIND_INTENT_INDEX] ?? null)
      : null;

  // STUN : l'ennemi passe son tour
  if (getBuffStacks(enemy.buffs, "STUN") > 0) {
    const shouldGainStunImmunity = Boolean(enemy.isElite || enemy.isBoss);
    return {
      ...state,
      enemies: state.enemies.map((e) =>
        e.instanceId === enemy.instanceId
          ? {
              ...e,
              buffs: shouldGainStunImmunity
                ? applyBuff(
                    removeBuff(removeBuff(e.buffs, "STUN"), "STUN_IMMUNITY"),
                    "STUN_IMMUNITY",
                    1,
                    2
                  )
                : removeBuff(e.buffs, "STUN"),
            }
          : e
      ),
    };
  }

  const { ability, usedIntentIndex } = forcedChapterGuardianRebind
    ? {
        ability: forcedChapterGuardianRebind,
        usedIntentIndex: CHAPTER_GUARDIAN_REBIND_INTENT_INDEX,
      }
    : pickAbilityForEnemyTurn(state, enemy, enemyDef);
  if (!ability) return state;

  // Resolve ability effects — enemy attacks target player by default
  let current = maybeTriggerBossPhase(state, enemy, enemyDefs);
  const freshEnemy =
    current.enemies.find((e) => e.instanceId === enemy.instanceId) ?? enemy;
  const target = resolveEnemyAbilityTarget(current, freshEnemy, ability);
  current = resolveEffects(
    current,
    ability.effects,
    {
      source: { type: "enemy", instanceId: freshEnemy.instanceId },
      target,
    },
    rng
  );

  current = applyCounterplayAbilityMechanics(current, freshEnemy, ability, rng);

  current = forcedChapterGuardianRebind
    ? performChapterGuardianRebind(current, freshEnemy.instanceId)
    : applyBossAbilityMechanics(
        current,
        freshEnemy,
        ability,
        target,
        enemyDefs,
        rng
      );

  const enemyAfterTurn =
    current.enemies.find((e) => e.instanceId === freshEnemy.instanceId) ??
    freshEnemy;
  const nextIntent = getNextIntentIndex(
    { ...enemyAfterTurn, intentIndex: usedIntentIndex },
    enemyDef,
    rng,
    current
  );
  current = {
    ...current,
    enemies: current.enemies.map((e) =>
      e.instanceId === freshEnemy.instanceId
        ? { ...e, intentIndex: nextIntent }
        : e
    ),
  };

  return synchronizeKoscheiCombatState(
    synchronizeHydraCombatState(
      synchronizeMedusaCombatState(
        synchronizeQuetzalcoatlCombatState(
          synchronizeTezcatlipocaCombatState(
            synchronizeOsirisCombatState(
              synchronizeShubCombatState(
                synchronizeNyarlathotepCombatState(
                  synchronizeSoundiataCombatState(
                    synchronizeAnansiCombatState(
                      synchronizeCernunnosCombatState(
                        synchronizeDagdaCombatState(
                          synchronizeRaCombatState(
                            synchronizeArchivistCombatState(current)
                          )
                        )
                      )
                    )
                  )
                )
              )
            )
          )
        )
      )
    )
  );
}

function hasOffensivePressure(ability: EnemyAbility): boolean {
  return ability.effects.some(
    (e) =>
      e.type === "DAMAGE" ||
      e.type === "DAMAGE_PER_TARGET_BLOCK" ||
      e.type === "DRAIN_INK" ||
      e.type === "APPLY_DEBUFF"
  );
}

function hasOtherLivingEnemies(
  state: CombatState,
  selfInstanceId: string
): boolean {
  return state.enemies.some(
    (e) => e.instanceId !== selfInstanceId && e.currentHp > 0
  );
}

function pickAbilityForEnemyTurn(
  state: CombatState,
  enemy: EnemyState,
  enemyDef: EnemyDefinition
): { ability: EnemyAbility | null; usedIntentIndex: number } {
  const defaultAbility = enemyDef.abilities[enemy.intentIndex] ?? null;
  if (!defaultAbility) {
    return { ability: null, usedIntentIndex: enemy.intentIndex };
  }

  if (enemyDef.role !== "SUPPORT") {
    return { ability: defaultAbility, usedIntentIndex: enemy.intentIndex };
  }

  if (hasOtherLivingEnemies(state, enemy.instanceId)) {
    return { ability: defaultAbility, usedIntentIndex: enemy.intentIndex };
  }

  if (hasOffensivePressure(defaultAbility)) {
    return { ability: defaultAbility, usedIntentIndex: enemy.intentIndex };
  }

  const fallbackIndex = enemyDef.abilities.findIndex(hasOffensivePressure);
  if (fallbackIndex < 0) {
    return { ability: defaultAbility, usedIntentIndex: enemy.intentIndex };
  }
  return {
    ability: enemyDef.abilities[fallbackIndex] ?? defaultAbility,
    usedIntentIndex: fallbackIndex,
  };
}

/**
 * Execute all enemies' turns in order of speed (highest first).
 * Also applies end-of-round effects (poison, buff ticks).
 */
export function executeEnemiesTurn(
  state: CombatState,
  enemyDefs: Map<string, EnemyDefinition>,
  rng: RNG
): CombatState {
  // Sort living enemies by speed descending
  const livingEnemies = state.enemies
    .filter((e) => e.currentHp > 0)
    .sort((a, b) => b.speed - a.speed);

  let current = state;

  for (const enemy of livingEnemies) {
    const def = enemyDefs.get(enemy.definitionId);
    if (!def) continue;

    // Re-fetch enemy state (may have changed during other enemy turns)
    const freshEnemy = current.enemies.find(
      (e) => e.instanceId === enemy.instanceId
    );
    if (!freshEnemy || freshEnemy.currentHp <= 0) continue;

    current = executeOneEnemyTurn(current, freshEnemy, def, rng, enemyDefs);
  }

  // End of round: apply poison, bleed and tick buffs for all enemies
  current = {
    ...current,
    enemies: current.enemies.map((e) => {
      if (e.currentHp <= 0) return e;
      const enemyPoisonMultiplier =
        current.relicModifiers?.enemyPoisonDamageMultiplier ?? 1;
      const enemyBleedMultiplier =
        current.relicModifiers?.enemyBleedDamageMultiplier ?? 1;
      const afterPoison = applyPoison(e, enemyPoisonMultiplier);
      const afterBleed = applyBleed(afterPoison, enemyBleedMultiplier);
      return {
        ...e,
        currentHp: afterBleed.currentHp,
        buffs: tickBuffs(afterBleed.buffs),
      };
    }),
  };

  // Apply poison, bleed and tick buffs for player and allies
  const playerPoisonMultiplier =
    current.relicModifiers?.playerPoisonDamageMultiplier ?? 1;
  const playerBleedMultiplier =
    current.relicModifiers?.playerBleedDamageMultiplier ?? 1;
  const playerAfterPoison = applyPoison(current.player, playerPoisonMultiplier);
  const playerAfterBleed = applyBleed(playerAfterPoison, playerBleedMultiplier);
  current = {
    ...current,
    player: {
      ...current.player,
      currentHp: playerAfterBleed.currentHp,
      buffs: tickBuffs(playerAfterBleed.buffs),
    },
    allies: current.allies.map((a) => {
      if (a.currentHp <= 0) return a;
      const afterPoison = applyPoison(a);
      const afterBleed = applyBleed(afterPoison);
      return {
        ...a,
        currentHp: afterBleed.currentHp,
        buffs: tickBuffs(afterBleed.buffs),
      };
    }),
  };

  return synchronizeKoscheiCombatState(
    synchronizeHydraCombatState(
      synchronizeMedusaCombatState(
        synchronizeQuetzalcoatlCombatState(
          synchronizeTezcatlipocaCombatState(
            synchronizeOsirisCombatState(
              synchronizeShubCombatState(
                synchronizeNyarlathotepCombatState(
                  synchronizeSoundiataCombatState(
                    synchronizeAnansiCombatState(
                      synchronizeCernunnosCombatState(
                        synchronizeDagdaCombatState(
                          synchronizeRaCombatState(current)
                        )
                      )
                    )
                  )
                )
              )
            )
          )
        )
      )
    )
  );
}

/**
 * Apply end-of-round effects only (poison + bleed + buff ticks).
 * Used in the step-by-step animation flow after all enemies have acted.
 */
export function finalizeEnemyRound(state: CombatState): CombatState {
  let current = state;

  // Apply poison, bleed and tick buffs for all enemies
  current = {
    ...current,
    enemies: current.enemies.map((e) => {
      if (e.currentHp <= 0) return e;
      const enemyPoisonMultiplier =
        current.relicModifiers?.enemyPoisonDamageMultiplier ?? 1;
      const enemyBleedMultiplier =
        current.relicModifiers?.enemyBleedDamageMultiplier ?? 1;
      const afterPoison = applyPoison(e, enemyPoisonMultiplier);
      const afterBleed = applyBleed(afterPoison, enemyBleedMultiplier);
      return {
        ...e,
        currentHp: afterBleed.currentHp,
        buffs: tickBuffs(afterBleed.buffs),
      };
    }),
  };

  // Apply poison, bleed and tick buffs for player and allies
  const playerPoisonMultiplier =
    current.relicModifiers?.playerPoisonDamageMultiplier ?? 1;
  const playerBleedMultiplier =
    current.relicModifiers?.playerBleedDamageMultiplier ?? 1;
  const playerAfterPoison = applyPoison(current.player, playerPoisonMultiplier);
  const playerAfterBleed = applyBleed(playerAfterPoison, playerBleedMultiplier);
  current = {
    ...current,
    player: {
      ...current.player,
      currentHp: playerAfterBleed.currentHp,
      buffs: tickBuffs(playerAfterBleed.buffs),
    },
    allies: current.allies.map((a) => {
      if (a.currentHp <= 0) return a;
      const afterPoison = applyPoison(a);
      const afterBleed = applyBleed(afterPoison);
      return {
        ...a,
        currentHp: afterBleed.currentHp,
        buffs: tickBuffs(afterBleed.buffs),
      };
    }),
  };

  return synchronizeKoscheiCombatState(
    synchronizeHydraCombatState(
      synchronizeMedusaCombatState(
        synchronizeQuetzalcoatlCombatState(
          synchronizeTezcatlipocaCombatState(
            synchronizeOsirisCombatState(
              synchronizeShubCombatState(
                synchronizeNyarlathotepCombatState(
                  synchronizeSoundiataCombatState(
                    synchronizeAnansiCombatState(
                      synchronizeCernunnosCombatState(
                        synchronizeDagdaCombatState(
                          synchronizeRaCombatState(current)
                        )
                      )
                    )
                  )
                )
              )
            )
          )
        )
      )
    )
  );
}

function getNextAllyIntentIndex(
  ally: AllyState,
  allyDef: AllyDefinition
): number {
  if (allyDef.abilities.length === 0) return 0;
  return (ally.intentIndex + 1) % allyDef.abilities.length;
}

function pickLowestHpEnemy(state: CombatState): string | null {
  const living = state.enemies.filter((e) => e.currentHp > 0);
  if (living.length === 0) return null;
  living.sort((a, b) => a.currentHp - b.currentHp);
  return living[0]?.instanceId ?? null;
}

function resolveAllyAbilityTarget(state: CombatState, ability: EnemyAbility) {
  switch (ability.target) {
    case "ALL_ENEMIES":
      return "all_enemies" as const;
    case "LOWEST_HP_ENEMY": {
      const enemyId = pickLowestHpEnemy(state);
      return enemyId
        ? ({ type: "enemy", instanceId: enemyId } as const)
        : "all_enemies";
    }
    case "PLAYER":
    case "SELF":
    default:
      return "player" as const;
  }
}

function pickLowestHpPlayerSideTarget(state: CombatState): EffectTarget {
  const aliveAllies = state.allies.filter((a) => a.currentHp > 0);
  if (aliveAllies.length === 0) return "player";

  const allyWithLowestHp = [...aliveAllies].sort(
    (a, b) => a.currentHp - b.currentHp
  )[0]!;

  if (state.player.currentHp <= allyWithLowestHp.currentHp) return "player";

  return { type: "ally", instanceId: allyWithLowestHp.instanceId };
}

function pickAllyPriorityTarget(state: CombatState): EffectTarget {
  const aliveAllies = state.allies.filter((a) => a.currentHp > 0);
  if (aliveAllies.length === 0) return "player";
  const allyWithLowestHp = [...aliveAllies].sort(
    (a, b) => a.currentHp - b.currentHp
  )[0]!;
  return { type: "ally", instanceId: allyWithLowestHp.instanceId };
}

export function resolveEnemyAbilityTarget(
  state: CombatState,
  enemy: EnemyState,
  ability: EnemyAbility
): EffectTarget {
  switch (ability.target) {
    case "SELF":
      return { type: "enemy", instanceId: enemy.instanceId };
    case "ALLY_PRIORITY":
      return pickAllyPriorityTarget(state);
    case "LOWEST_HP_ENEMY":
      return pickLowestHpPlayerSideTarget(state);
    case "ALL_ENEMIES":
      return "player";
    case "PLAYER":
      if (shouldPressureAllies(state, ability)) {
        return pickAllyPriorityTarget(state);
      }
      return "player";
    default: {
      const hasDamage = ability.effects.some(
        (e) => e.type === "DAMAGE" || e.type === "DAMAGE_PER_TARGET_BLOCK"
      );
      if (hasDamage && shouldPressureAllies(state, ability)) {
        return pickAllyPriorityTarget(state);
      }
      return "player";
    }
  }
}

function shouldPressureAllies(
  state: CombatState,
  ability: EnemyAbility
): boolean {
  const hasDamage = ability.effects.some(
    (e) => e.type === "DAMAGE" || e.type === "DAMAGE_PER_TARGET_BLOCK"
  );
  const livingAllies = state.allies.filter((a) => a.currentHp > 0).length;
  if (!hasDamage || livingAllies === 0) return false;

  // More ally pressure when the player fields multiple companions.
  if (livingAllies >= 2) return state.turnNumber % 2 === 0;
  return state.turnNumber % 3 === 0;
}

function applyCounterplayAbilityMechanics(
  state: CombatState,
  enemy: EnemyState,
  ability: EnemyAbility,
  rng: RNG
): CombatState {
  const source = { type: "enemy", instanceId: enemy.instanceId } as const;

  if (ability.name === SPLIT_ASSAULT_NAME) {
    return resolveEffects(
      state,
      [{ type: "DAMAGE", value: 4 }],
      { source, target: "all_allies" },
      rng
    );
  }

  if (ability.name === PREDATOR_FORMATION_NAME) {
    return resolveEffects(
      state,
      [
        { type: "DAMAGE", value: 6 },
        { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 1 },
      ],
      { source, target: "all_allies" },
      rng
    );
  }

  if (ability.name === DOMINION_SWEEP_NAME) {
    return resolveEffects(
      state,
      [
        { type: "DAMAGE", value: 8 },
        { type: "APPLY_DEBUFF", value: 1, buff: "WEAK", duration: 1 },
      ],
      { source, target: "all_allies" },
      rng
    );
  }

  if (ability.name === ALLY_RECKONING_NAME) {
    const livingAllies = state.allies.filter((a) => a.currentHp > 0).length;
    if (livingAllies <= 0) return state;
    return resolveEffects(
      state,
      [
        { type: "DAMAGE", value: livingAllies * 3 },
        {
          type: "APPLY_DEBUFF",
          value: Math.min(2, livingAllies),
          buff: "VULNERABLE",
          duration: 2,
        },
      ],
      { source, target: "player" },
      rng
    );
  }

  return state;
}

export function executeAlliesTurn(
  state: CombatState,
  allyDefs: Map<string, AllyDefinition>,
  rng: RNG
): CombatState {
  const livingAllies = state.allies
    .filter((a) => a.currentHp > 0)
    .sort((a, b) => b.speed - a.speed);

  let current = state;

  for (const ally of livingAllies) {
    const def = allyDefs.get(ally.definitionId);
    if (!def || def.abilities.length === 0) continue;

    const freshAlly = current.allies.find(
      (a) => a.instanceId === ally.instanceId
    );
    if (!freshAlly || freshAlly.currentHp <= 0) continue;

    const ability = def.abilities[freshAlly.intentIndex];
    if (!ability) continue;

    current = resolveEffects(
      current,
      ability.effects,
      {
        source: { type: "ally", instanceId: freshAlly.instanceId },
        target:
          ability.target === "SELF"
            ? { type: "ally", instanceId: freshAlly.instanceId }
            : resolveAllyAbilityTarget(current, ability),
      },
      rng
    );

    const nextIntent = getNextAllyIntentIndex(freshAlly, def);
    current = {
      ...current,
      allies: current.allies.map((a) =>
        a.instanceId === freshAlly.instanceId
          ? { ...a, intentIndex: nextIntent }
          : a
      ),
    };
  }

  return current;
}

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
import { applyPoison, applyBleed, tickBuffs, applyBuff } from "./buffs";
import type { RNG } from "./rng";
import { nanoid } from "nanoid";

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
  if (!ability.conditionalWeights) return weight;
  for (const cw of ability.conditionalWeights) {
    if (evaluateCondition(cw.condition, state, enemy)) {
      weight *= cw.weightMultiplier;
    }
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
  if (abilities.length === 1) return 0;

  const repeatPenalty = abilities.length >= 3 ? 0.2 : 0.6;
  const weights = abilities.map((ability, index) => {
    const base = state
      ? getEffectiveWeight(ability, state, enemy)
      : Math.max(0.01, ability.weight ?? 1);
    return index === enemy.intentIndex ? base * repeatPenalty : base;
  });

  const total = weights.reduce((sum, w) => sum + w, 0);
  if (total <= 0) {
    return (enemy.intentIndex + 1) % abilities.length;
  }

  let roll = rng.next() * total;
  for (let i = 0; i < weights.length; i++) {
    roll -= weights[i]!;
    if (roll <= 0) return i;
  }
  return weights.length - 1;
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

  const { ability, usedIntentIndex } = pickAbilityForEnemyTurn(
    state,
    enemy,
    enemyDef
  );
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

  current = applyBossAbilityMechanics(
    current,
    freshEnemy,
    ability,
    target,
    enemyDefs,
    rng
  );

  const nextIntent = getNextIntentIndex(
    { ...freshEnemy, intentIndex: usedIntentIndex },
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

  return current;
}

function hasOffensivePressure(ability: EnemyAbility): boolean {
  return ability.effects.some(
    (e) =>
      e.type === "DAMAGE" || e.type === "DRAIN_INK" || e.type === "APPLY_DEBUFF"
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
      const afterPoison = applyPoison(e);
      const afterBleed = applyBleed(afterPoison);
      return {
        ...e,
        currentHp: afterBleed.currentHp,
        buffs: tickBuffs(afterBleed.buffs),
      };
    }),
  };

  // Apply poison, bleed and tick buffs for player and allies
  const playerAfterPoison = applyPoison(current.player);
  const playerAfterBleed = applyBleed(playerAfterPoison);
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

  return current;
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
      const afterPoison = applyPoison(e);
      const afterBleed = applyBleed(afterPoison);
      return {
        ...e,
        currentHp: afterBleed.currentHp,
        buffs: tickBuffs(afterBleed.buffs),
      };
    }),
  };

  // Apply poison, bleed and tick buffs for player and allies
  const playerAfterPoison = applyPoison(current.player);
  const playerAfterBleed = applyBleed(playerAfterPoison);
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

  return current;
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
      const hasDamage = ability.effects.some((e) => e.type === "DAMAGE");
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
  const hasDamage = ability.effects.some((e) => e.type === "DAMAGE");
  const hasLivingAlly = state.allies.some((a) => a.currentHp > 0);
  if (!hasDamage || !hasLivingAlly) return false;

  // Deterministic pacing: every 4th turn, some attacks retarget allies.
  return state.turnNumber % 4 === 0;
}

function maybeTriggerBossPhase(
  state: CombatState,
  enemy: EnemyState,
  enemyDefs?: Map<string, EnemyDefinition>
): CombatState {
  if (enemy.currentHp > Math.floor(enemy.maxHp / 2)) return state;
  const phaseKey = `${enemy.definitionId}_phase2`;
  const alreadyTriggered = (enemy.mechanicFlags?.[phaseKey] ?? 0) > 0;
  if (alreadyTriggered) return state;

  let current = markBossPhaseTriggered(state, enemy.instanceId, phaseKey);

  switch (enemy.definitionId) {
    case "chapter_guardian":
      // Ink Overload: floods deck with curses + raises card costs next turn
      current = healEnemy(current, enemy.instanceId, 16);
      current = grantEnemyStrength(current, enemy.instanceId, 2);
      current = addCardsToDrawPile(current, "haunting_regret", 2);
      current = applyNextTurnCardCostIncrease(current, 1);
      return current;
    case "fenrir":
      // Pack Surge: summons reinforcement and inflicts bleed
      current = healEnemy(current, enemy.instanceId, 18);
      current = grantEnemyStrength(current, enemy.instanceId, 3);
      current = summonEnemyIfPossible(current, "draugr", enemyDefs);
      current = applyBuffToPlayer(current, "BLEED", 3, 4);
      return current;
    case "medusa":
      // Full Petrification: debuffs player heavily and adds dazed to hand
      current = healEnemy(current, enemy.instanceId, 16);
      current = grantEnemyStrength(current, enemy.instanceId, 2);
      current = applyBuffToPlayer(current, "VULNERABLE", 3, 3);
      current = applyBuffToPlayer(current, "WEAK", 2, 3);
      current = addCardsToDiscardPile(current, "dazed", 2);
      return current;
    case "ra_avatar":
      // Solar Judgment: drains all ink and weakens player
      current = healEnemy(current, enemy.instanceId, 20);
      current = grantEnemyStrength(current, enemy.instanceId, 3);
      current = drainAllPlayerInk(current);
      current = applyBuffToPlayer(current, "VULNERABLE", 2, 3);
      return current;
    case "nyarlathotep_shard":
      // Unraveling: floods hand with curses + freezes cards
      current = healEnemy(current, enemy.instanceId, 15);
      current = grantEnemyStrength(current, enemy.instanceId, 2);
      current = summonEnemyIfPossible(current, "void_tendril", enemyDefs);
      current = addCardsToDrawPile(current, "haunting_regret", 2);
      current = freezePlayerHandCards(current, 2);
      return current;
    case "tezcatlipoca_echo":
      // Blood Sacrifice: deals self-damage for massive strength burst
      current = damageSelf(current, enemy.instanceId, 20);
      current = grantEnemyStrength(current, enemy.instanceId, 6);
      current = addCardsToDrawPile(current, "ink_burn", 2);
      return current;
    case "dagda_shadow":
      // Eternal Regeneration: heavy self-heal + thorns + hexed parchment
      current = healEnemy(current, enemy.instanceId, 25);
      current = grantEnemyStrength(current, enemy.instanceId, 2);
      current = grantEnemyThorns(current, enemy.instanceId, 8);
      current = addCardsToDiscardPile(current, "hexed_parchment", 1);
      return current;
    case "baba_yaga_hut":
      // Winter Curse: summons witch + freezes player cards
      current = healEnemy(current, enemy.instanceId, 18);
      current = grantEnemyStrength(current, enemy.instanceId, 2);
      current = summonEnemyIfPossible(current, "frost_witch", enemyDefs);
      current = freezePlayerHandCards(current, 2);
      return current;
    case "soundiata_spirit":
      // Royal Command: buffs all living allies and summons
      current = healEnemy(current, enemy.instanceId, 18);
      current = grantEnemyStrength(current, enemy.instanceId, 3);
      current = summonEnemyIfPossible(current, "mask_hunter", enemyDefs);
      current = grantStrengthToAllEnemies(current, 2);
      return current;
    case "the_archivist":
      // Archive Corruption: drain all ink + freeze cards + flood deck
      current = healEnemy(current, enemy.instanceId, 12);
      current = grantEnemyStrength(current, enemy.instanceId, 2);
      current = drainAllPlayerInk(current);
      current = freezePlayerHandCards(current, 2);
      current = addCardsToDrawPile(current, "haunting_regret", 2);
      return current;
    case "hel_queen":
      // Realm of the Dead: summon draugr + heavy BLEED + Weak
      current = healEnemy(current, enemy.instanceId, 18);
      current = grantEnemyStrength(current, enemy.instanceId, 3);
      current = summonEnemyIfPossible(current, "draugr", enemyDefs);
      current = applyBuffToPlayer(current, "BLEED", 3, 5);
      current = applyBuffToPlayer(current, "WEAK", 2, 3);
      return current;
    case "hydra_aspect":
      // Hydra Surge: heal + strength + summon gorgon + VULNERABLE
      current = healEnemy(current, enemy.instanceId, 15);
      current = grantEnemyStrength(current, enemy.instanceId, 3);
      current = summonEnemyIfPossible(current, "gorgon", enemyDefs);
      current = applyBuffToPlayer(current, "VULNERABLE", 3, 3);
      return current;
    case "osiris_eye":
      // Divine Judgment: drain all ink + heavy debuffs + big heal
      current = healEnemy(current, enemy.instanceId, 20);
      current = grantEnemyStrength(current, enemy.instanceId, 3);
      current = drainAllPlayerInk(current);
      current = applyBuffToPlayer(current, "WEAK", 2, 3);
      current = applyBuffToPlayer(current, "VULNERABLE", 2, 3);
      return current;
    case "shub_spawn":
      // Dark Gestation: summon + POISON flood + dazed
      current = healEnemy(current, enemy.instanceId, 15);
      current = grantEnemyStrength(current, enemy.instanceId, 2);
      current = summonEnemyIfPossible(current, "shoggoth_spawn", enemyDefs);
      current = applyBuffToPlayer(current, "POISON", 6, undefined);
      current = addCardsToDiscardPile(current, "dazed", 2);
      return current;
    case "quetzalcoatl_wrath":
      // Serpent's Fury: BLEED + VULNERABLE + ink_burn flood
      current = healEnemy(current, enemy.instanceId, 15);
      current = grantEnemyStrength(current, enemy.instanceId, 3);
      current = applyBuffToPlayer(current, "BLEED", 3, 5);
      current = applyBuffToPlayer(current, "VULNERABLE", 2, 3);
      current = addCardsToDrawPile(current, "ink_burn", 2);
      return current;
    case "cernunnos_shade":
      // Nature's Fury: massive THORNS + summon amber hound + BLEED
      current = healEnemy(current, enemy.instanceId, 18);
      current = grantEnemyStrength(current, enemy.instanceId, 2);
      current = grantEnemyThorns(current, enemy.instanceId, 10);
      current = summonEnemyIfPossible(current, "amber_hound", enemyDefs);
      current = applyBuffToPlayer(current, "BLEED", 2, 4);
      return current;
    case "koschei_deathless":
      // Immortal Resurgence: massive heal + summon + card cost increase
      current = healEnemy(current, enemy.instanceId, 30);
      current = grantEnemyStrength(current, enemy.instanceId, 3);
      current = summonEnemyIfPossible(current, "koschei_herald", enemyDefs);
      current = applyNextTurnCardCostIncrease(current, 2);
      return current;
    case "anansi_weaver":
      // Trickster's Finale: WEAK + VULNERABLE + freeze + hexed parchment
      current = healEnemy(current, enemy.instanceId, 14);
      current = grantEnemyStrength(current, enemy.instanceId, 2);
      current = applyBuffToPlayer(current, "WEAK", 2, 3);
      current = applyBuffToPlayer(current, "VULNERABLE", 2, 3);
      current = freezePlayerHandCards(current, 2);
      current = addCardsToDiscardPile(current, "hexed_parchment", 2);
      return current;
    default:
      return current;
  }
}

function applyBossAbilityMechanics(
  state: CombatState,
  enemy: EnemyState,
  ability: EnemyAbility,
  target: EffectTarget,
  enemyDefs: Map<string, EnemyDefinition> | undefined,
  rng: RNG
): CombatState {
  let current = state;

  switch (enemy.definitionId) {
    case "chapter_guardian":
      if (ability.name === "Page Storm") {
        current = summonEnemyIfPossible(current, "ink_slime", enemyDefs);
      }
      if (ability.name === "Binding Curse") {
        current = addCardsToDiscardPile(current, "hexed_parchment", 1);
      }
      if (ability.name === "Ink Devour") {
        current = applyBonusDamageFromCurseCount(
          current,
          enemy.instanceId,
          target,
          rng,
          2
        );
      }
      return current;
    case "fenrir":
      if (ability.name === "Pack Howl") {
        current = summonEnemyIfPossible(current, "draugr", enemyDefs);
      }
      if (ability.name === "World's End") {
        current = addCardsToDrawPile(current, "dazed", 2);
      }
      return current;
    case "medusa":
      if (ability.name === "Petrifying Gaze") {
        current = addCardsToDiscardPile(current, "dazed", 1);
      }
      if (ability.name === "Stone Crush") {
        current = applyBonusDamageIfPlayerDebuffed(
          current,
          enemy.instanceId,
          target,
          rng,
          8
        );
      }
      return current;
    case "ra_avatar":
      if (ability.name === "Solar Barrier") {
        current = healEnemy(current, enemy.instanceId, 10);
      }
      if (ability.name === "Divine Scorch" && current.player.inkCurrent <= 2) {
        current = applyFlatBonusDamage(
          current,
          enemy.instanceId,
          target,
          rng,
          6
        );
      }
      return current;
    case "nyarlathotep_shard":
      if (ability.name === "Mad Prophecy") {
        current = addCardsToDrawPile(current, "haunting_regret", 1);
      }
      if (ability.name === "Void Mantle") {
        current = summonEnemyIfPossible(current, "cultist_scribe", enemyDefs);
      }
      return current;
    case "tezcatlipoca_echo":
      if (ability.name === "Mirror Slash") {
        current = applyFlatBonusDamage(
          current,
          enemy.instanceId,
          target,
          rng,
          8
        );
      }
      if (ability.name === "Night Mantle") {
        current = healEnemy(current, enemy.instanceId, 8);
      }
      return current;
    case "dagda_shadow":
      if (ability.name === "Ancient Feast") {
        current = healEnemy(current, enemy.instanceId, 12);
      }
      if (ability.name === "Cauldron Steam") {
        current = addCardsToDiscardPile(current, "hexed_parchment", 1);
      }
      return current;
    case "baba_yaga_hut":
      if (ability.name === "Witchfire") {
        current = addCardsToDiscardPile(current, "ink_burn", 1);
      }
      if (ability.name === "Soul Stew") {
        current = healEnemy(current, enemy.instanceId, 10);
      }
      return current;
    case "soundiata_spirit":
      if (ability.name === "Epic Command") {
        current = grantStrengthToAllEnemies(current, 1);
      }
      if (ability.name === "Griot's Shield") {
        current = grantBlockToAllEnemies(current, 8);
      }
      return current;
    case "the_archivist":
      if (ability.name === "Corrupted Index") {
        current = addCardsToDrawPile(current, "haunting_regret", 1);
      }
      if (ability.name === "Void Library") {
        if (current.player.inkCurrent <= 1) {
          current = applyFlatBonusDamage(
            current,
            enemy.instanceId,
            target,
            rng,
            6
          );
        }
      }
      return current;
    case "hel_queen":
      if (ability.name === "Death's Reckoning") {
        current = applyBonusDamageIfPlayerDebuffed(
          current,
          enemy.instanceId,
          target,
          rng,
          8
        );
      }
      return current;
    case "hydra_aspect":
      if (ability.name === "Necrotic Snap") {
        current = addCardsToDiscardPile(current, "dazed", 1);
      }
      return current;
    case "osiris_eye":
      if (ability.name === "Anubis Seal") {
        current = healEnemy(current, enemy.instanceId, 12);
      }
      if (ability.name === "Soul Drain" && current.player.inkCurrent <= 2) {
        current = applyFlatBonusDamage(
          current,
          enemy.instanceId,
          target,
          rng,
          8
        );
      }
      return current;
    case "shub_spawn":
      if (ability.name === "Spawn Eruption") {
        current = summonEnemyIfPossible(current, "shoggoth_spawn", enemyDefs);
      }
      if (ability.name === "Dark Young Stomp") {
        current = applyBonusDamageIfPlayerDebuffed(
          current,
          enemy.instanceId,
          target,
          rng,
          6
        );
      }
      return current;
    case "quetzalcoatl_wrath":
      if (ability.name === "Solar Dive") {
        current = applyFlatBonusDamage(
          current,
          enemy.instanceId,
          target,
          rng,
          8
        );
      }
      return current;
    case "cernunnos_shade":
      if (ability.name === "Ancient Wrath") {
        current = applyBonusDamageIfPlayerDebuffed(
          current,
          enemy.instanceId,
          target,
          rng,
          6
        );
      }
      return current;
    case "koschei_deathless":
      if (ability.name === "Deathless Blow") {
        current = applyBonusDamageIfPlayerDebuffed(
          current,
          enemy.instanceId,
          target,
          rng,
          10
        );
      }
      if (ability.name === "Immortal Ward") {
        current = healEnemy(current, enemy.instanceId, 15);
      }
      return current;
    case "anansi_weaver":
      if (ability.name === "Web Trap") {
        current = addCardsToDrawPile(current, "hexed_parchment", 1);
      }
      if (ability.name === "Story's End") {
        current = applyBonusDamageIfPlayerDebuffed(
          current,
          enemy.instanceId,
          target,
          rng,
          8
        );
      }
      return current;
    default:
      return current;
  }
}

function summonEnemyIfPossible(
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

function countBossCurseCards(state: CombatState): number {
  const isBossCurse = (definitionId: string) =>
    definitionId === "haunting_regret" || definitionId === "hexed_parchment";

  return [
    ...state.hand,
    ...state.drawPile,
    ...state.discardPile,
    ...state.exhaustPile,
  ].filter((c) => isBossCurse(c.definitionId)).length;
}

function markBossPhaseTriggered(
  state: CombatState,
  enemyInstanceId: string,
  phaseKey: string
): CombatState {
  return {
    ...state,
    enemies: state.enemies.map((e) =>
      e.instanceId === enemyInstanceId
        ? {
            ...e,
            mechanicFlags: { ...(e.mechanicFlags ?? {}), [phaseKey]: 1 },
          }
        : e
    ),
  };
}

function healEnemy(
  state: CombatState,
  enemyInstanceId: string,
  amount: number
): CombatState {
  return {
    ...state,
    enemies: state.enemies.map((e) =>
      e.instanceId === enemyInstanceId
        ? { ...e, currentHp: Math.min(e.maxHp, e.currentHp + amount) }
        : e
    ),
  };
}

function grantEnemyStrength(
  state: CombatState,
  enemyInstanceId: string,
  amount: number
): CombatState {
  return {
    ...state,
    enemies: state.enemies.map((e) =>
      e.instanceId === enemyInstanceId
        ? { ...e, buffs: applyBuff(e.buffs, "STRENGTH", amount) }
        : e
    ),
  };
}

function grantEnemyThorns(
  state: CombatState,
  enemyInstanceId: string,
  amount: number
): CombatState {
  return {
    ...state,
    enemies: state.enemies.map((e) =>
      e.instanceId === enemyInstanceId
        ? { ...e, buffs: applyBuff(e.buffs, "THORNS", amount) }
        : e
    ),
  };
}

function damageSelf(
  state: CombatState,
  enemyInstanceId: string,
  amount: number
): CombatState {
  return {
    ...state,
    enemies: state.enemies.map((e) =>
      e.instanceId === enemyInstanceId
        ? { ...e, currentHp: Math.max(1, e.currentHp - amount) }
        : e
    ),
  };
}

function drainAllPlayerInk(state: CombatState): CombatState {
  return {
    ...state,
    player: { ...state.player, inkCurrent: 0 },
  };
}

function freezePlayerHandCards(state: CombatState, count: number): CombatState {
  const toFreeze = state.hand.slice(0, count).map((c) => c.instanceId);
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

function applyNextTurnCardCostIncrease(
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

function addCardsToDrawPile(
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

function addCardsToDiscardPile(
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

function applyFlatBonusDamage(
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

function applyBonusDamageFromCurseCount(
  state: CombatState,
  enemyInstanceId: string,
  target: EffectTarget,
  rng: RNG,
  perCurse: number
): CombatState {
  const bonusDamage = countBossCurseCards(state) * perCurse;
  return applyFlatBonusDamage(state, enemyInstanceId, target, rng, bonusDamage);
}

function applyBonusDamageIfPlayerDebuffed(
  state: CombatState,
  enemyInstanceId: string,
  target: EffectTarget,
  rng: RNG,
  bonusDamage: number
): CombatState {
  const debuffCount = state.player.buffs.filter(
    (b) => b.type === "WEAK" || b.type === "VULNERABLE" || b.type === "POISON"
  ).length;
  if (debuffCount === 0) return state;
  return applyFlatBonusDamage(state, enemyInstanceId, target, rng, bonusDamage);
}

function applyBuffToPlayer(
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

function grantStrengthToAllEnemies(
  state: CombatState,
  amount: number
): CombatState {
  return {
    ...state,
    enemies: state.enemies.map((e) =>
      e.currentHp > 0
        ? { ...e, buffs: applyBuff(e.buffs, "STRENGTH", amount) }
        : e
    ),
  };
}

function grantBlockToAllEnemies(
  state: CombatState,
  amount: number
): CombatState {
  return {
    ...state,
    enemies: state.enemies.map((e) =>
      e.currentHp > 0 ? { ...e, block: e.block + amount } : e
    ),
  };
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

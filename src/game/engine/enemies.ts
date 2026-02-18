import type { CombatState } from "../schemas/combat-state";
import type { EnemyDefinition, EnemyState } from "../schemas/entities";
import { resolveEffects } from "./effects";
import { applyPoison, tickBuffs } from "./buffs";
import type { RNG } from "./rng";

/**
 * Determine which ability an enemy will use next.
 * MVP: cycle through abilities sequentially.
 */
export function getNextIntentIndex(
  enemy: EnemyState,
  enemyDef: EnemyDefinition
): number {
  if (enemyDef.abilities.length === 0) return 0;
  return (enemy.intentIndex + 1) % enemyDef.abilities.length;
}

/**
 * Execute a single enemy's turn.
 */
function executeOneEnemyTurn(
  state: CombatState,
  enemy: EnemyState,
  enemyDef: EnemyDefinition,
  rng: RNG
): CombatState {
  if (enemy.currentHp <= 0) return state;
  if (enemyDef.abilities.length === 0) return state;

  const ability = enemyDef.abilities[enemy.intentIndex];
  if (!ability) return state;

  // Resolve ability effects — enemy attacks target player by default
  let current = resolveEffects(
    state,
    ability.effects,
    {
      source: { type: "enemy", instanceId: enemy.instanceId },
      target: "player",
    },
    rng
  );

  // Advance intent to next ability
  const nextIntent = getNextIntentIndex(enemy, enemyDef);
  current = {
    ...current,
    enemies: current.enemies.map((e) =>
      e.instanceId === enemy.instanceId ? { ...e, intentIndex: nextIntent } : e
    ),
  };

  return current;
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

    current = executeOneEnemyTurn(current, freshEnemy, def, rng);
  }

  // End of round: apply poison and tick buffs for all enemies
  current = {
    ...current,
    enemies: current.enemies.map((e) => {
      if (e.currentHp <= 0) return e;
      const afterPoison = applyPoison(e);
      return {
        ...e,
        currentHp: afterPoison.currentHp,
        buffs: tickBuffs(afterPoison.buffs),
      };
    }),
  };

  // Apply poison and tick buffs for player
  const playerAfterPoison = applyPoison(current.player);
  current = {
    ...current,
    player: {
      ...current.player,
      currentHp: playerAfterPoison.currentHp,
      buffs: tickBuffs(playerAfterPoison.buffs),
    },
  };

  return current;
}

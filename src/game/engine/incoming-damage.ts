import type { CombatState } from "../schemas/combat-state";
import type { EnemyDefinition } from "../schemas/entities";
import { calculateDamage } from "./damage";
import { resolveEnemyAbilityTarget } from "./enemies";

export interface IncomingDamagePreview {
  /** Total incoming damage aimed at the player. */
  player: number;
  /** Total incoming damage per living ally, keyed by instanceId. */
  allies: Record<string, number>;
}

/**
 * Estimate incoming damage for the next enemy phase, based on each enemy's
 * current intent. Accounts for enemy WEAK debuff and target VULNERABLE buff,
 * as well as the floor-based enemy damage scale.
 *
 * Does NOT account for block (caller can compare against target.block).
 * Does NOT model counterplay boss special mechanics (edge case).
 */
export function computeIncomingDamage(
  state: CombatState,
  enemyDefs: Map<string, EnemyDefinition>
): IncomingDamagePreview {
  const result: IncomingDamagePreview = { player: 0, allies: {} };

  for (const enemy of state.enemies) {
    if (enemy.currentHp <= 0) continue;

    const def = enemyDefs.get(enemy.definitionId);
    if (!def) continue;

    const ability = def.abilities[enemy.intentIndex];
    if (!ability) continue;

    const damageEffects = ability.effects.filter((e) => e.type === "DAMAGE");
    if (damageEffects.length === 0) continue;

    const target = resolveEnemyAbilityTarget(state, enemy, ability);
    const sourceStats = { strength: 0, buffs: enemy.buffs };

    for (const effect of damageEffects) {
      const scaledBase = Math.max(
        1,
        Math.round(effect.value * (state.enemyDamageScale ?? 1))
      );

      if (target === "player") {
        result.player += calculateDamage(scaledBase, sourceStats, {
          buffs: state.player.buffs,
        });
      } else if (target === "all_allies") {
        for (const ally of state.allies) {
          if (ally.currentHp <= 0) continue;
          const dmg = calculateDamage(scaledBase, sourceStats, {
            buffs: ally.buffs,
          });
          result.allies[ally.instanceId] =
            (result.allies[ally.instanceId] ?? 0) + dmg;
        }
      } else if (typeof target === "object" && target.type === "ally") {
        const ally = state.allies.find(
          (a) => a.instanceId === target.instanceId
        );
        if (ally && ally.currentHp > 0) {
          const dmg = calculateDamage(scaledBase, sourceStats, {
            buffs: ally.buffs,
          });
          result.allies[ally.instanceId] =
            (result.allies[ally.instanceId] ?? 0) + dmg;
        }
      }
    }
  }

  return result;
}

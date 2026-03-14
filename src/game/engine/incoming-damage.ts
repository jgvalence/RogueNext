import type { CombatState } from "../schemas/combat-state";
import type { EnemyDefinition } from "../schemas/entities";
import { calculateDamage, computeDamageFromTargetBlock } from "./damage";
import { resolveEnemyAbilityTarget } from "./enemies";

export interface IncomingDamageEntry {
  /** Total raw damage aimed at the target before current block is applied. */
  total: number;
  /** Actual HP loss expected after current block is consumed. */
  hpLoss: number;
}

export interface IncomingDamagePreview {
  /** Total incoming pressure and expected HP loss aimed at the player. */
  player: IncomingDamageEntry;
  /** Total incoming pressure and expected HP loss per living ally. */
  allies: Record<string, IncomingDamageEntry>;
}

/**
 * Estimate incoming damage for the next enemy phase, based on each enemy's
 * current intent. Accounts for enemy WEAK debuff and target VULNERABLE buff,
 * as well as the floor-based enemy damage scale.
 *
 * Returns both total incoming damage and the HP loss expected after current
 * block is consumed. Damage that scales from target block is evaluated using
 * the block remaining at that point in the effect sequence.
 */
export function computeIncomingDamage(
  state: CombatState,
  enemyDefs: Map<string, EnemyDefinition>
): IncomingDamagePreview {
  const result: IncomingDamagePreview = {
    player: { total: 0, hpLoss: 0 },
    allies: {},
  };
  let playerBlock = Math.max(0, state.player.block);
  const allyBlocks: Record<string, number> = Object.fromEntries(
    state.allies
      .filter((ally) => ally.currentHp > 0)
      .map((ally) => [ally.instanceId, Math.max(0, ally.block)])
  );

  const addPlayerIncoming = (rawDamage: number, blockable: boolean) => {
    if (rawDamage <= 0) return;
    result.player.total += rawDamage;
    if (blockable) {
      const blocked = Math.min(playerBlock, rawDamage);
      playerBlock -= blocked;
      result.player.hpLoss += rawDamage - blocked;
      return;
    }
    result.player.hpLoss += rawDamage;
  };

  const addAllyIncoming = (
    allyInstanceId: string,
    rawDamage: number,
    blockable: boolean
  ) => {
    if (rawDamage <= 0) return;

    const existing = result.allies[allyInstanceId] ?? { total: 0, hpLoss: 0 };
    existing.total += rawDamage;

    if (blockable) {
      const currentBlock = allyBlocks[allyInstanceId] ?? 0;
      const blocked = Math.min(currentBlock, rawDamage);
      allyBlocks[allyInstanceId] = currentBlock - blocked;
      existing.hpLoss += rawDamage - blocked;
    } else {
      existing.hpLoss += rawDamage;
    }

    result.allies[allyInstanceId] = existing;
  };

  for (const enemy of state.enemies) {
    if (enemy.currentHp <= 0) continue;

    const def = enemyDefs.get(enemy.definitionId);
    if (!def) continue;

    const ability = def.abilities[enemy.intentIndex];
    if (!ability) continue;

    const damageEffects = ability.effects.filter(
      (e) =>
        e.type === "DAMAGE" || e.type === "DAMAGE_PER_TARGET_BLOCK"
    );
    if (damageEffects.length === 0) continue;

    const target = resolveEnemyAbilityTarget(state, enemy, ability);
    const sourceStats = { strength: 0, buffs: enemy.buffs };

    for (const effect of damageEffects) {
      const scaledBaseDamage =
        effect.type === "DAMAGE"
          ? Math.max(1, Math.round(effect.value * (state.enemyDamageScale ?? 1)))
          : null;
      const isBlockable = effect.type === "DAMAGE";

      if (target === "player") {
        const playerVulnerableMultiplier =
          state.relicModifiers?.playerVulnerableDamageMultiplier ?? 1.5;
        addPlayerIncoming(
          calculateDamage(
          scaledBaseDamage ??
            computeDamageFromTargetBlock(playerBlock, effect.value),
            sourceStats,
            {
              buffs: state.player.buffs,
            },
            {
              vulnerableMultiplier: playerVulnerableMultiplier,
            }
          ),
          isBlockable
        );
      } else if (target === "all_allies") {
        for (const ally of state.allies) {
          if (ally.currentHp <= 0) continue;
          addAllyIncoming(
            ally.instanceId,
            calculateDamage(
              scaledBaseDamage ??
                computeDamageFromTargetBlock(
                  allyBlocks[ally.instanceId] ?? ally.block,
                  effect.value
                ),
              sourceStats,
              {
                buffs: ally.buffs,
              }
            ),
            isBlockable
          );
        }
      } else if (typeof target === "object" && target.type === "ally") {
        const ally = state.allies.find(
          (a) => a.instanceId === target.instanceId
        );
        if (ally && ally.currentHp > 0) {
          addAllyIncoming(
            ally.instanceId,
            calculateDamage(
              scaledBaseDamage ??
                computeDamageFromTargetBlock(
                  allyBlocks[ally.instanceId] ?? ally.block,
                  effect.value
                ),
              sourceStats,
              {
                buffs: ally.buffs,
              }
            ),
            isBlockable
          );
        }
      }
    }
  }

  return result;
}

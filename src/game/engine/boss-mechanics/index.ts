import type { CombatState } from "../../schemas/combat-state";
import type {
  EnemyAbility,
  EnemyDefinition,
  EnemyState,
} from "../../schemas/entities";
import type { EffectTarget } from "../effects";
import type { RNG } from "../rng";
import { africanBossMechanicsById } from "./african";
import { aztecBossMechanicsById } from "./aztec";
import { celticBossMechanicsById } from "./celtic";
import { egyptianBossMechanicsById } from "./egyptian";
import { greekBossMechanicsById } from "./greek";
import { libraryBossMechanicsById } from "./library";
import { lovecraftianBossMechanicsById } from "./lovecraftian";
import { russianBossMechanicsById } from "./russian";
import type { BossMechanicsById } from "./types";
import { vikingBossMechanicsById } from "./viking";

const bossMechanicsById: BossMechanicsById = {
  ...libraryBossMechanicsById,
  ...vikingBossMechanicsById,
  ...greekBossMechanicsById,
  ...egyptianBossMechanicsById,
  ...lovecraftianBossMechanicsById,
  ...aztecBossMechanicsById,
  ...celticBossMechanicsById,
  ...russianBossMechanicsById,
  ...africanBossMechanicsById,
};

function markBossPhaseTriggered(
  state: CombatState,
  enemyInstanceId: string,
  phaseKey: string
): CombatState {
  return {
    ...state,
    enemies: state.enemies.map((enemy) =>
      enemy.instanceId === enemyInstanceId
        ? {
            ...enemy,
            mechanicFlags: { ...(enemy.mechanicFlags ?? {}), [phaseKey]: 1 },
          }
        : enemy
    ),
  };
}

export function maybeTriggerBossPhase(
  state: CombatState,
  enemy: EnemyState,
  enemyDefs?: Map<string, EnemyDefinition>
): CombatState {
  if (enemy.currentHp > Math.floor(enemy.maxHp / 2)) return state;

  const phaseKey = `${enemy.definitionId}_phase2`;
  const alreadyTriggered = (enemy.mechanicFlags?.[phaseKey] ?? 0) > 0;
  if (alreadyTriggered) return state;

  const nextState = markBossPhaseTriggered(state, enemy.instanceId, phaseKey);
  const mechanics = bossMechanicsById[enemy.definitionId];
  if (!mechanics?.onPhaseThreshold) return nextState;
  const freshEnemy =
    nextState.enemies.find((entry) => entry.instanceId === enemy.instanceId) ??
    enemy;

  return mechanics.onPhaseThreshold({
    state: nextState,
    enemy: freshEnemy,
    enemyDefs,
  });
}

export function applyBossAbilityMechanics(
  state: CombatState,
  enemy: EnemyState,
  ability: EnemyAbility,
  target: EffectTarget,
  enemyDefs: Map<string, EnemyDefinition> | undefined,
  rng: RNG
): CombatState {
  const mechanics = bossMechanicsById[enemy.definitionId];
  if (!mechanics?.onAbilityResolved) return state;

  return mechanics.onAbilityResolved({
    state,
    enemy,
    ability,
    target,
    enemyDefs,
    rng,
  });
}

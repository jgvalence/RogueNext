import type { CombatState } from "../../schemas/combat-state";
import type {
  EnemyAbility,
  EnemyDefinition,
  EnemyState,
} from "../../schemas/entities";
import type { EffectTarget } from "../effects";
import type { RNG } from "../rng";

export interface BossPhaseContext {
  state: CombatState;
  enemy: EnemyState;
  enemyDefs?: Map<string, EnemyDefinition>;
}

export interface BossAbilityContext {
  state: CombatState;
  enemy: EnemyState;
  ability: EnemyAbility;
  target: EffectTarget;
  enemyDefs?: Map<string, EnemyDefinition>;
  rng: RNG;
}

export interface BossMechanics {
  onPhaseThreshold?: (context: BossPhaseContext) => CombatState;
  onAbilityResolved?: (context: BossAbilityContext) => CombatState;
}

export type BossMechanicsById = Record<string, BossMechanics>;

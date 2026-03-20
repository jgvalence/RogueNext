import type { CombatState } from "../schemas/combat-state";
import type { EnemyDefinition, EnemyState } from "../schemas/entities";
import type { EffectSource } from "./effects";
import { summonEnemyIfPossible } from "./boss-mechanics/shared";

const CERNUNNOS_ID = "cernunnos_shade";
const FLAG_PREFIX = "cernunnos_shade";
const ANTLER_LAYERS_KEY = `${FLAG_PREFIX}_antler_layers`;

const MAX_ANTLER_LAYERS = 3;
const ANTLER_DAMAGE_CAP = 8;
const EXPOSED_DAMAGE_MULTIPLIER = 1.5;
const ANCIENT_WRATH_DAMAGE_PER_LAYER = 4;
const PHASE_ONE_REGROW = 1;
const PHASE_TWO_REGROW = 2;

export interface CernunnosUiState {
  phaseTwo: boolean;
  antlerLayers: number;
  maxAntlerLayers: number;
  exposed: boolean;
  damageCap: number;
  exposedDamageMultiplier: number;
  regrowPerTurn: number;
  ancientWrathBonus: number;
  ancientWrathPerLayer: number;
}

function sanitizeFlag(value: number | undefined, fallback: number): number {
  return Math.max(0, Math.floor(value ?? fallback));
}

function clampLayers(value: number): number {
  return Math.max(0, Math.min(MAX_ANTLER_LAYERS, Math.floor(value)));
}

function isCernunnosEnemy(
  enemy: Pick<EnemyState, "definitionId"> | null | undefined
): enemy is Pick<EnemyState, "definitionId"> {
  return Boolean(enemy && enemy.definitionId === CERNUNNOS_ID);
}

function isFriendlySource(source: EffectSource): boolean {
  return source === "player" || source.type === "ally";
}

function withDefaultMechanicFlags(
  flags: Record<string, number> | undefined
): Record<string, number> {
  return {
    ...(flags ?? {}),
    [ANTLER_LAYERS_KEY]: clampLayers(
      sanitizeFlag(flags?.[ANTLER_LAYERS_KEY], MAX_ANTLER_LAYERS)
    ),
  };
}

function updateCernunnos(
  state: CombatState,
  updater: (enemy: EnemyState) => EnemyState
): CombatState {
  return {
    ...state,
    enemies: state.enemies.map((enemy) => {
      if (!isCernunnosEnemy(enemy)) return enemy;
      return updater({
        ...enemy,
        mechanicFlags: withDefaultMechanicFlags(enemy.mechanicFlags),
      });
    }),
  };
}

function setLayers(enemy: EnemyState, value: number): EnemyState {
  return {
    ...enemy,
    mechanicFlags: {
      ...withDefaultMechanicFlags(enemy.mechanicFlags),
      [ANTLER_LAYERS_KEY]: clampLayers(value),
    },
  };
}

function getCernunnosEnemy(state: CombatState): EnemyState | null {
  const enemy = state.enemies.find(isCernunnosEnemy);
  if (!enemy) return null;
  return {
    ...enemy,
    mechanicFlags: withDefaultMechanicFlags(enemy.mechanicFlags),
  };
}

function getAntlerLayers(enemy: EnemyState): number {
  return clampLayers(
    withDefaultMechanicFlags(enemy.mechanicFlags)[ANTLER_LAYERS_KEY] ??
      MAX_ANTLER_LAYERS
  );
}

function isPhaseTwo(enemy: EnemyState): boolean {
  return (enemy.mechanicFlags?.cernunnos_shade_phase2 ?? 0) > 0;
}

function getRegrowPerTurn(enemy: EnemyState): number {
  return isPhaseTwo(enemy) ? PHASE_TWO_REGROW : PHASE_ONE_REGROW;
}

export function getCernunnosAncientWrathDamagePerLayer(): number {
  return ANCIENT_WRATH_DAMAGE_PER_LAYER;
}

export function getCernunnosAncientWrathBonus(
  enemy: EnemyState | null | undefined
): number {
  if (!enemy || !isCernunnosEnemy(enemy)) return 0;
  return getAntlerLayers(enemy) * ANCIENT_WRATH_DAMAGE_PER_LAYER;
}

export function initializeCernunnosCombat(state: CombatState): CombatState {
  const enemy = getCernunnosEnemy(state);
  if (!enemy) return state;
  return synchronizeCernunnosCombatState(state);
}

export function synchronizeCernunnosCombatState(
  state: CombatState
): CombatState {
  const enemy = getCernunnosEnemy(state);
  if (!enemy) return state;

  return updateCernunnos(state, (currentEnemy) => ({
    ...currentEnemy,
    mechanicFlags: withDefaultMechanicFlags(currentEnemy.mechanicFlags),
  }));
}

export function triggerCernunnosPhaseTwo(
  state: CombatState,
  enemyInstanceId: string,
  enemyDefs?: Map<string, EnemyDefinition>
): CombatState {
  const enemy = state.enemies.find(
    (entry) => entry.instanceId === enemyInstanceId
  );
  if (!enemy || !isCernunnosEnemy(enemy) || enemy.currentHp <= 0) {
    return synchronizeCernunnosCombatState(state);
  }

  return synchronizeCernunnosCombatState(
    summonEnemyIfPossible(state, "amber_hound", enemyDefs)
  );
}

export function modifyCernunnosIncomingDamage(
  state: CombatState,
  targetInstanceId: string,
  source: EffectSource,
  damage: number
): number {
  if (!isFriendlySource(source) || damage <= 0) return damage;

  const enemy = state.enemies.find(
    (entry) => entry.instanceId === targetInstanceId
  );
  if (!enemy || !isCernunnosEnemy(enemy) || enemy.currentHp <= 0) {
    return damage;
  }

  if (getAntlerLayers(enemy) > 0) {
    return Math.min(damage, ANTLER_DAMAGE_CAP);
  }

  return Math.max(1, Math.floor(damage * EXPOSED_DAMAGE_MULTIPLIER));
}

export function registerCernunnosDamage(
  state: CombatState,
  targetInstanceId: string,
  source: EffectSource
): CombatState {
  if (!isFriendlySource(source)) return state;

  const enemy = state.enemies.find(
    (entry) => entry.instanceId === targetInstanceId
  );
  if (!enemy || !isCernunnosEnemy(enemy) || enemy.currentHp <= 0) {
    return state;
  }

  const layers = getAntlerLayers(enemy);
  if (layers <= 0) return state;

  return synchronizeCernunnosCombatState(
    updateCernunnos(state, (currentEnemy) =>
      setLayers(currentEnemy, layers - 1)
    )
  );
}

export function resolveCernunnosPostAbility(
  state: CombatState,
  enemyInstanceId: string
): CombatState {
  const enemy = state.enemies.find(
    (entry) => entry.instanceId === enemyInstanceId
  );
  if (!enemy || !isCernunnosEnemy(enemy) || enemy.currentHp <= 0) {
    return synchronizeCernunnosCombatState(state);
  }

  return synchronizeCernunnosCombatState(
    updateCernunnos(state, (currentEnemy) =>
      setLayers(
        currentEnemy,
        getAntlerLayers(currentEnemy) + getRegrowPerTurn(currentEnemy)
      )
    )
  );
}

export function getCernunnosUiState(
  enemy: EnemyState | null | undefined
): CernunnosUiState | null {
  if (!enemy || !isCernunnosEnemy(enemy)) return null;

  const normalizedEnemy: EnemyState = {
    ...enemy,
    mechanicFlags: withDefaultMechanicFlags(enemy.mechanicFlags),
  };
  const antlerLayers = getAntlerLayers(normalizedEnemy);

  return {
    phaseTwo: isPhaseTwo(normalizedEnemy),
    antlerLayers,
    maxAntlerLayers: MAX_ANTLER_LAYERS,
    exposed: antlerLayers <= 0,
    damageCap: ANTLER_DAMAGE_CAP,
    exposedDamageMultiplier: EXPOSED_DAMAGE_MULTIPLIER,
    regrowPerTurn: getRegrowPerTurn(normalizedEnemy),
    ancientWrathBonus: antlerLayers * getCernunnosAncientWrathDamagePerLayer(),
    ancientWrathPerLayer: getCernunnosAncientWrathDamagePerLayer(),
  };
}

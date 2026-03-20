import { nanoid } from "nanoid";

import type { CombatState } from "../schemas/combat-state";
import type { EnemyDefinition, EnemyState } from "../schemas/entities";
import {
  addCardsToDiscardPile,
  applyBuffToPlayer,
  healEnemy,
  summonEnemyIfPossible,
} from "./boss-mechanics/shared";

const SHUB_SPAWN_ID = "shub_spawn";
export const SHUB_BROOD_NEST_ID = "shub_brood_nest";

const SHUB_FLAG_PREFIX = "shub_spawn";
const NEST_COUNT_KEY = `${SHUB_FLAG_PREFIX}_nest_count`;
const NEXT_HATCH_KEY = `${SHUB_FLAG_PREFIX}_next_hatch`;

const NEST_FLAG_PREFIX = "shub_brood_nest";
const NEST_TIMER_KEY = `${NEST_FLAG_PREFIX}_timer`;

const NEST_TIMER_MAX = 2;
const PHASE_ONE_CONSUME_HEAL = 12;
const PHASE_TWO_CONSUME_HEAL = 16;
const PHASE_ONE_CONSUME_POISON = 4;
const PHASE_TWO_CONSUME_POISON = 6;

export interface ShubUiState {
  phaseTwo: boolean;
  nestCount: number;
  maxNests: number;
  nextHatch: number;
  consumeHeal: number;
  consumePoison: number;
}

export interface ShubNestUiState {
  timer: number;
  maxTimer: number;
}

export interface ShubAbilityPreviewState {
  nestSummons: number;
  hatchSummons: number;
  consumeHeal: number;
  consumePoison: number;
}

function sanitizeFlag(value: number | undefined, fallback: number): number {
  return Math.max(0, Math.floor(value ?? fallback));
}

function clampTimer(value: number): number {
  return Math.max(1, Math.min(NEST_TIMER_MAX, Math.floor(value)));
}

function isShubSpawnEnemy(
  enemy: Pick<EnemyState, "definitionId"> | null | undefined
): enemy is Pick<EnemyState, "definitionId"> {
  return Boolean(enemy && enemy.definitionId === SHUB_SPAWN_ID);
}

function isShubNestEnemy(
  enemy: Pick<EnemyState, "definitionId"> | null | undefined
): enemy is Pick<EnemyState, "definitionId"> {
  return Boolean(enemy && enemy.definitionId === SHUB_BROOD_NEST_ID);
}

function withDefaultBossFlags(
  flags: Record<string, number> | undefined
): Record<string, number> {
  return {
    ...(flags ?? {}),
    [NEST_COUNT_KEY]: sanitizeFlag(flags?.[NEST_COUNT_KEY], 0),
    [NEXT_HATCH_KEY]: sanitizeFlag(flags?.[NEXT_HATCH_KEY], 0),
  };
}

function withDefaultNestFlags(
  flags: Record<string, number> | undefined
): Record<string, number> {
  return {
    ...(flags ?? {}),
    [NEST_TIMER_KEY]: clampTimer(
      sanitizeFlag(flags?.[NEST_TIMER_KEY], NEST_TIMER_MAX)
    ),
  };
}

function setBossFlag(
  enemy: EnemyState,
  key: string,
  value: number
): EnemyState {
  return {
    ...enemy,
    mechanicFlags: {
      ...withDefaultBossFlags(enemy.mechanicFlags),
      [key]: sanitizeFlag(value, 0),
    },
  };
}

function setNestFlag(
  enemy: EnemyState,
  key: string,
  value: number
): EnemyState {
  return {
    ...enemy,
    mechanicFlags: {
      ...withDefaultNestFlags(enemy.mechanicFlags),
      [key]:
        key === NEST_TIMER_KEY ? clampTimer(value) : sanitizeFlag(value, 0),
    },
  };
}

function normalizeEnemy(enemy: EnemyState): EnemyState {
  if (enemy.definitionId === SHUB_SPAWN_ID) {
    return {
      ...enemy,
      mechanicFlags: withDefaultBossFlags(enemy.mechanicFlags),
    };
  }
  if (enemy.definitionId === SHUB_BROOD_NEST_ID) {
    return {
      ...enemy,
      mechanicFlags: withDefaultNestFlags(enemy.mechanicFlags),
    };
  }
  return enemy;
}

function getShubEnemy(state: CombatState): EnemyState | null {
  const enemy = state.enemies.find(
    (candidate) => candidate.definitionId === SHUB_SPAWN_ID
  );
  if (!enemy) return null;
  return normalizeEnemy(enemy);
}

function getNestTimer(enemy: EnemyState): number {
  return clampTimer(
    withDefaultNestFlags(enemy.mechanicFlags)[NEST_TIMER_KEY] ?? 2
  );
}

function isPhaseTwo(enemy: EnemyState): boolean {
  return (enemy.mechanicFlags?.shub_spawn_phase2 ?? 0) > 0;
}

function getMaxNests(enemy: EnemyState): number {
  return isPhaseTwo(enemy) ? 2 : 1;
}

function getConsumeHeal(enemy: EnemyState): number {
  return isPhaseTwo(enemy) ? PHASE_TWO_CONSUME_HEAL : PHASE_ONE_CONSUME_HEAL;
}

function getConsumePoison(enemy: EnemyState): number {
  return isPhaseTwo(enemy)
    ? PHASE_TWO_CONSUME_POISON
    : PHASE_ONE_CONSUME_POISON;
}

function getLivingNests(state: CombatState): EnemyState[] {
  return state.enemies
    .filter(
      (enemy): enemy is EnemyState =>
        isShubNestEnemy(enemy) && enemy.currentHp > 0
    )
    .map(normalizeEnemy);
}

function getLivingEnemyCount(state: CombatState): number {
  return state.enemies.filter((enemy) => enemy.currentHp > 0).length;
}

function pruneShubCorpses(state: CombatState): CombatState {
  return {
    ...state,
    enemies: state.enemies.filter((enemy) => {
      if (enemy.currentHp > 0) return true;
      return (
        enemy.definitionId !== SHUB_BROOD_NEST_ID &&
        enemy.definitionId !== "shoggoth_spawn"
      );
    }),
  };
}

function updateShubEnemies(
  state: CombatState,
  updater: (enemy: EnemyState) => EnemyState
): CombatState {
  return {
    ...state,
    enemies: state.enemies.map((enemy) => {
      if (!isShubSpawnEnemy(enemy) && !isShubNestEnemy(enemy)) return enemy;
      return updater(normalizeEnemy(enemy));
    }),
  };
}

function removeEnemyByInstanceId(
  state: CombatState,
  instanceId: string
): CombatState {
  return {
    ...state,
    enemies: state.enemies.filter((enemy) => enemy.instanceId !== instanceId),
  };
}

function summonBroodNest(
  state: CombatState,
  enemyDefs?: Map<string, EnemyDefinition>
): { state: CombatState; nestInstanceId: string | null } {
  if (!enemyDefs || getLivingEnemyCount(state) >= 4) {
    return { state, nestInstanceId: null };
  }
  const definition = enemyDefs.get(SHUB_BROOD_NEST_ID);
  if (!definition) {
    return { state, nestInstanceId: null };
  }

  const nestInstanceId = nanoid();
  return {
    nestInstanceId,
    state: {
      ...state,
      enemies: [
        ...state.enemies,
        {
          instanceId: nestInstanceId,
          definitionId: definition.id,
          name: definition.name,
          currentHp: definition.maxHp,
          maxHp: definition.maxHp,
          block: 0,
          mechanicFlags: {
            [NEST_TIMER_KEY]: NEST_TIMER_MAX,
          },
          speed: definition.speed,
          buffs: [],
          intentIndex: 0,
        },
      ],
    },
  };
}

function summonShoggothSpawnIfPossible(
  state: CombatState,
  enemyDefs?: Map<string, EnemyDefinition>
): CombatState {
  if (!enemyDefs || getLivingEnemyCount(state) >= 4) return state;
  return summonEnemyIfPossible(state, "shoggoth_spawn", enemyDefs);
}

function consumeOneNest(state: CombatState): {
  state: CombatState;
  consumed: boolean;
} {
  const targetNest = getLivingNests(state).sort(
    (left, right) => getNestTimer(left) - getNestTimer(right)
  )[0];
  if (!targetNest) return { state, consumed: false };
  return {
    state: removeEnemyByInstanceId(state, targetNest.instanceId),
    consumed: true,
  };
}

function advanceExistingNests(
  state: CombatState,
  enemyDefs?: Map<string, EnemyDefinition>,
  skippedNestIds: Set<string> = new Set()
): CombatState {
  let current = pruneShubCorpses(state);
  const nestsToAdvance = getLivingNests(current).filter(
    (nest) => !skippedNestIds.has(nest.instanceId)
  );

  for (const nest of nestsToAdvance) {
    const freshNest = current.enemies.find(
      (enemy) => enemy.instanceId === nest.instanceId
    );
    if (!freshNest || freshNest.currentHp <= 0) continue;
    const timer = getNestTimer(normalizeEnemy(freshNest));
    if (timer <= 1) {
      current = removeEnemyByInstanceId(current, freshNest.instanceId);
      current = summonShoggothSpawnIfPossible(current, enemyDefs);
      continue;
    }
    current = updateShubEnemies(current, (enemy) =>
      enemy.instanceId === freshNest.instanceId
        ? setNestFlag(enemy, NEST_TIMER_KEY, timer - 1)
        : enemy
    );
  }

  return current;
}

export function initializeShubSpawnCombat(
  state: CombatState,
  enemyDefs?: Map<string, EnemyDefinition>
): CombatState {
  const shub = getShubEnemy(state);
  if (!shub) return state;

  let current = pruneShubCorpses(state);
  if (getLivingNests(current).length === 0) {
    current = summonBroodNest(current, enemyDefs).state;
  }
  return synchronizeShubCombatState(current);
}

export function synchronizeShubCombatState(state: CombatState): CombatState {
  const shub = getShubEnemy(state);
  if (!shub) return state;

  const livingNests = getLivingNests(state);
  const nestCount = livingNests.length;
  const nextHatch =
    livingNests.length > 0
      ? Math.min(...livingNests.map((nest) => getNestTimer(nest)))
      : 0;

  return updateShubEnemies(state, (enemy) => {
    if (isShubNestEnemy(enemy)) {
      return {
        ...enemy,
        mechanicFlags: withDefaultNestFlags(enemy.mechanicFlags),
      };
    }

    let nextEnemy = setBossFlag(enemy, NEST_COUNT_KEY, nestCount);
    nextEnemy = setBossFlag(nextEnemy, NEXT_HATCH_KEY, nextHatch);
    return nextEnemy;
  });
}

export function triggerShubSpawnPhaseTwo(
  state: CombatState,
  enemyInstanceId: string,
  enemyDefs?: Map<string, EnemyDefinition>
): CombatState {
  const shub = state.enemies.find(
    (enemy) => enemy.instanceId === enemyInstanceId
  );
  if (!shub || !isShubSpawnEnemy(shub)) {
    return synchronizeShubCombatState(state);
  }

  let current = updateShubEnemies(pruneShubCorpses(state), (enemy) =>
    isShubSpawnEnemy(enemy) ? setBossFlag(enemy, "shub_spawn_phase2", 1) : enemy
  );
  current = summonBroodNest(current, enemyDefs).state;
  return synchronizeShubCombatState(current);
}

export function resolveShubPostAbility(
  state: CombatState,
  enemyInstanceId: string,
  abilityName: string,
  enemyDefs?: Map<string, EnemyDefinition>
): CombatState {
  const shub = state.enemies.find(
    (enemy) => enemy.instanceId === enemyInstanceId
  );
  if (!shub || !isShubSpawnEnemy(shub)) {
    return synchronizeShubCombatState(state);
  }

  const normalizedShub = normalizeEnemy(shub);
  let current = pruneShubCorpses(state);
  const skippedNestIds = new Set<string>();

  if (abilityName === "Eldritch Veil") {
    const consumeResult = consumeOneNest(current);
    current = consumeResult.state;
    if (consumeResult.consumed) {
      current = healEnemy(
        current,
        enemyInstanceId,
        getConsumeHeal(normalizedShub)
      );
      current = applyBuffToPlayer(
        current,
        "POISON",
        getConsumePoison(normalizedShub)
      );
      if (isPhaseTwo(normalizedShub)) {
        current = addCardsToDiscardPile(current, "dazed", 1);
      }
    }
  }

  if (abilityName === "Spawn Eruption") {
    const currentShub = getShubEnemy(current);
    const maxNests = currentShub
      ? getMaxNests(currentShub)
      : getMaxNests(normalizedShub);
    const nestsToSummon = Math.max(
      0,
      maxNests - getLivingNests(current).length
    );
    for (let index = 0; index < nestsToSummon; index += 1) {
      const summonResult = summonBroodNest(current, enemyDefs);
      current = summonResult.state;
      if (summonResult.nestInstanceId) {
        skippedNestIds.add(summonResult.nestInstanceId);
      }
    }
  }

  current = advanceExistingNests(current, enemyDefs, skippedNestIds);
  return synchronizeShubCombatState(current);
}

export function getShubAbilityPreviewState(
  state: CombatState,
  enemy: EnemyState,
  abilityName: string
): ShubAbilityPreviewState | null {
  if (!isShubSpawnEnemy(enemy)) return null;

  const normalizedEnemy = normalizeEnemy(enemy);
  const livingNests = getLivingNests(state).sort(
    (left, right) => getNestTimer(left) - getNestTimer(right)
  );
  const nestSummons =
    abilityName === "Spawn Eruption"
      ? Math.max(0, getMaxNests(normalizedEnemy) - livingNests.length)
      : 0;
  const consumesNest =
    abilityName === "Eldritch Veil" && livingNests.length > 0;
  const hatchingCandidates = consumesNest ? livingNests.slice(1) : livingNests;

  return {
    nestSummons,
    hatchSummons: hatchingCandidates.filter((nest) => getNestTimer(nest) <= 1)
      .length,
    consumeHeal: consumesNest ? getConsumeHeal(normalizedEnemy) : 0,
    consumePoison: consumesNest ? getConsumePoison(normalizedEnemy) : 0,
  };
}

export function getShubUiState(
  enemy: EnemyState | null | undefined
): ShubUiState | null {
  if (!enemy || !isShubSpawnEnemy(enemy)) return null;

  const normalizedEnemy = normalizeEnemy(enemy);
  const flags = withDefaultBossFlags(normalizedEnemy.mechanicFlags);
  return {
    phaseTwo: isPhaseTwo(normalizedEnemy),
    nestCount: sanitizeFlag(flags[NEST_COUNT_KEY], 0),
    maxNests: getMaxNests(normalizedEnemy),
    nextHatch: sanitizeFlag(flags[NEXT_HATCH_KEY], 0),
    consumeHeal: getConsumeHeal(normalizedEnemy),
    consumePoison: getConsumePoison(normalizedEnemy),
  };
}

export function getShubNestUiState(
  enemy: EnemyState | null | undefined
): ShubNestUiState | null {
  if (!enemy || !isShubNestEnemy(enemy)) return null;

  const normalizedEnemy = normalizeEnemy(enemy);
  return {
    timer: getNestTimer(normalizedEnemy),
    maxTimer: NEST_TIMER_MAX,
  };
}

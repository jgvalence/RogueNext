import type { CombatState } from "../schemas/combat-state";
import type { EnemyAbility, EnemyState } from "../schemas/entities";
import type { EffectTarget, EffectSource } from "./effects";
import type { RNG } from "./rng";
import {
  applyFlatBonusDamage,
  drainAllPlayerInk,
} from "./boss-mechanics/shared";

const FLAG_PREFIX = "ra_avatar";
const SUN_CHARGE_KEY = `${FLAG_PREFIX}_sun_charge`;
const FORCED_JUDGMENT_KEY = `${FLAG_PREFIX}_forced_judgment`;
const SAVED_INTENT_KEY = `${FLAG_PREFIX}_saved_intent`;

const MAX_SUN_CHARGE = 3;
const DIVINE_SCORCH_INTENT_INDEX = 3;

export interface RaUiState {
  phaseTwo: boolean;
  charge: number;
  chargeMax: number;
  chargePerTurn: number;
  judgmentReady: boolean;
  judgmentBonusDamage: number;
  canEclipse: boolean;
}

function isRaEnemy(
  enemy: Pick<EnemyState, "definitionId"> | null | undefined
): enemy is Pick<EnemyState, "definitionId"> {
  return Boolean(enemy && enemy.definitionId === "ra_avatar");
}

function sanitizeFlag(value: number | undefined, fallback: number): number {
  return Math.max(0, Math.floor(value ?? fallback));
}

function clampCharge(value: number): number {
  return Math.min(MAX_SUN_CHARGE, Math.max(0, Math.floor(value)));
}

function withDefaultMechanicFlags(
  flags: Record<string, number> | undefined
): Record<string, number> {
  return {
    ...(flags ?? {}),
    [SUN_CHARGE_KEY]: clampCharge(sanitizeFlag(flags?.[SUN_CHARGE_KEY], 0)),
    [FORCED_JUDGMENT_KEY]:
      sanitizeFlag(flags?.[FORCED_JUDGMENT_KEY], 0) > 0 ? 1 : 0,
    [SAVED_INTENT_KEY]: sanitizeFlag(flags?.[SAVED_INTENT_KEY], 0),
  };
}

function setFlag(enemy: EnemyState, key: string, value: number): EnemyState {
  return {
    ...enemy,
    mechanicFlags: {
      ...withDefaultMechanicFlags(enemy.mechanicFlags),
      [key]:
        key === SUN_CHARGE_KEY ? clampCharge(value) : sanitizeFlag(value, 0),
    },
  };
}

function updateRa(
  state: CombatState,
  updater: (enemy: EnemyState) => EnemyState
): CombatState {
  return {
    ...state,
    enemies: state.enemies.map((enemy) => {
      if (!isRaEnemy(enemy)) return enemy;
      return updater({
        ...enemy,
        mechanicFlags: withDefaultMechanicFlags(enemy.mechanicFlags),
      });
    }),
  };
}

function getRaEnemy(state: CombatState): EnemyState | null {
  const ra = state.enemies.find(isRaEnemy);
  if (!ra) return null;
  return {
    ...ra,
    mechanicFlags: withDefaultMechanicFlags(ra.mechanicFlags),
  };
}

export function isRaPhaseTwo(enemy: EnemyState): boolean {
  return (enemy.mechanicFlags?.ra_avatar_phase2 ?? 0) > 0;
}

export function getRaChargePerTurn(enemy: EnemyState): number {
  return isRaPhaseTwo(enemy) ? 2 : 1;
}

export function getRaJudgmentBonusDamage(enemy: EnemyState): number {
  return isRaPhaseTwo(enemy) ? 14 : 10;
}

export function isRaSolarJudgmentReady(
  enemy: EnemyState | null | undefined
): boolean {
  if (!enemy || !isRaEnemy(enemy)) return false;
  return (
    clampCharge(
      withDefaultMechanicFlags(enemy.mechanicFlags)[SUN_CHARGE_KEY] ?? 0
    ) >= MAX_SUN_CHARGE
  );
}

function isFriendlySource(source: EffectSource): boolean {
  return source === "player" || source.type === "ally";
}

function setIntentIndex(
  state: CombatState,
  enemyInstanceId: string,
  intentIndex: number
): CombatState {
  return {
    ...state,
    enemies: state.enemies.map((enemy) =>
      enemy.instanceId === enemyInstanceId ? { ...enemy, intentIndex } : enemy
    ),
  };
}

export function initializeRaCombat(state: CombatState): CombatState {
  const enemy = getRaEnemy(state);
  if (!enemy) return state;
  return synchronizeRaCombatState(state);
}

export function synchronizeRaCombatState(state: CombatState): CombatState {
  const ra = getRaEnemy(state);
  if (!ra) return state;

  let current = updateRa(state, (enemy) => ({
    ...enemy,
    mechanicFlags: withDefaultMechanicFlags(enemy.mechanicFlags),
  }));
  const refreshedRa = getRaEnemy(current);
  if (!refreshedRa) return current;

  const judgmentReady = isRaSolarJudgmentReady(refreshedRa);
  const forcedJudgment =
    (withDefaultMechanicFlags(refreshedRa.mechanicFlags)[FORCED_JUDGMENT_KEY] ??
      0) > 0;
  const savedIntent =
    withDefaultMechanicFlags(refreshedRa.mechanicFlags)[SAVED_INTENT_KEY] ??
    refreshedRa.intentIndex;

  if (judgmentReady && !forcedJudgment) {
    current = updateRa(current, (enemy) => {
      let nextEnemy = setFlag(enemy, SAVED_INTENT_KEY, enemy.intentIndex);
      nextEnemy = setFlag(nextEnemy, FORCED_JUDGMENT_KEY, 1);
      return nextEnemy;
    });
    return setIntentIndex(
      current,
      refreshedRa.instanceId,
      DIVINE_SCORCH_INTENT_INDEX
    );
  }

  if (!judgmentReady && forcedJudgment) {
    current = updateRa(current, (enemy) => {
      let nextEnemy = setFlag(enemy, FORCED_JUDGMENT_KEY, 0);
      nextEnemy = setFlag(nextEnemy, SAVED_INTENT_KEY, 0);
      return nextEnemy;
    });
    return setIntentIndex(current, refreshedRa.instanceId, savedIntent);
  }

  if (judgmentReady && refreshedRa.intentIndex !== DIVINE_SCORCH_INTENT_INDEX) {
    return setIntentIndex(
      current,
      refreshedRa.instanceId,
      DIVINE_SCORCH_INTENT_INDEX
    );
  }

  return current;
}

export function finalizeRaPlayerTurn(state: CombatState): CombatState {
  const ra = getRaEnemy(state);
  if (!ra) return state;
  if (state.player.inkCurrent <= 0) return synchronizeRaCombatState(state);

  return synchronizeRaCombatState(
    updateRa(state, (enemy) =>
      setFlag(
        enemy,
        SUN_CHARGE_KEY,
        (withDefaultMechanicFlags(enemy.mechanicFlags)[SUN_CHARGE_KEY] ?? 0) +
          getRaChargePerTurn(enemy)
      )
    )
  );
}

export function registerRaSolarBarrierBreak(
  state: CombatState,
  targetInstanceId: string,
  source: EffectSource,
  previousBlock: number,
  nextBlock: number
): CombatState {
  if (!isFriendlySource(source)) return state;
  if (previousBlock <= 0 || nextBlock > 0) return state;

  const ra = state.enemies.find(
    (enemy) => enemy.instanceId === targetInstanceId
  );
  if (!ra || !isRaEnemy(ra)) return state;

  return synchronizeRaCombatState(
    updateRa(state, (enemy) =>
      setFlag(
        enemy,
        SUN_CHARGE_KEY,
        Math.max(
          0,
          (withDefaultMechanicFlags(enemy.mechanicFlags)[SUN_CHARGE_KEY] ?? 0) -
            1
        )
      )
    )
  );
}

function abilityHasDamageEffect(ability: EnemyAbility): boolean {
  return ability.effects.some(
    (effect) =>
      effect.type === "DAMAGE" || effect.type === "DAMAGE_PER_TARGET_BLOCK"
  );
}

export function applyRaSolarJudgment(
  state: CombatState,
  enemyInstanceId: string,
  ability: EnemyAbility,
  target: EffectTarget,
  rng: RNG
): CombatState {
  const ra = state.enemies.find(
    (enemy) => enemy.instanceId === enemyInstanceId
  );
  if (!ra || !isRaEnemy(ra) || !isRaSolarJudgmentReady(ra)) {
    return synchronizeRaCombatState(state);
  }

  let current = drainAllPlayerInk(state);
  if (abilityHasDamageEffect(ability)) {
    current = applyFlatBonusDamage(
      current,
      enemyInstanceId,
      target,
      rng,
      getRaJudgmentBonusDamage(ra)
    );
  }

  current = updateRa(current, (enemy) => {
    let nextEnemy = setFlag(enemy, SUN_CHARGE_KEY, 0);
    nextEnemy = setFlag(nextEnemy, FORCED_JUDGMENT_KEY, 0);
    nextEnemy = setFlag(nextEnemy, SAVED_INTENT_KEY, 0);
    return nextEnemy;
  });

  return synchronizeRaCombatState(current);
}

export function getRaUiState(
  enemy: EnemyState | null | undefined
): RaUiState | null {
  if (!enemy || !isRaEnemy(enemy)) return null;

  const normalizedEnemy = {
    ...enemy,
    mechanicFlags: withDefaultMechanicFlags(enemy.mechanicFlags),
  };
  const charge = clampCharge(
    normalizedEnemy.mechanicFlags?.[SUN_CHARGE_KEY] ?? 0
  );

  return {
    phaseTwo: isRaPhaseTwo(normalizedEnemy),
    charge,
    chargeMax: MAX_SUN_CHARGE,
    chargePerTurn: getRaChargePerTurn(normalizedEnemy),
    judgmentReady: charge >= MAX_SUN_CHARGE,
    judgmentBonusDamage: getRaJudgmentBonusDamage(normalizedEnemy),
    canEclipse: charge > 0 && normalizedEnemy.block > 0,
  };
}

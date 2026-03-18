import type { CombatState } from "../schemas/combat-state";
import type { EnemyState } from "../schemas/entities";
import { nanoid } from "nanoid";

const FLAG_PREFIX = "chapter_guardian";
const MARTIAL_ACTIVE_KEY = `${FLAG_PREFIX}_binding_martial_active`;
const SCRIPT_ACTIVE_KEY = `${FLAG_PREFIX}_binding_script_active`;
const INK_ACTIVE_KEY = `${FLAG_PREFIX}_binding_ink_active`;
const TURN_ATTACKS_KEY = `${FLAG_PREFIX}_turn_attacks`;
const TURN_BLOCK_GAINED_KEY = `${FLAG_PREFIX}_turn_block_gained`;
const TURN_INK_SPENT_KEY = `${FLAG_PREFIX}_turn_ink_spent`;
const TURN_SCRIPT_PUNISH_USED_KEY = `${FLAG_PREFIX}_turn_script_punish_used`;
const TURN_INK_PUNISH_USED_KEY = `${FLAG_PREFIX}_turn_ink_punish_used`;
const OPEN_CHAPTER_KEY = `${FLAG_PREFIX}_open_chapter`;
const REBIND_PENDING_KEY = `${FLAG_PREFIX}_rebind_pending`;

const MARTIAL_ATTACKS_TO_BREAK = 3;
const SCRIPT_BLOCK_TO_BREAK = 12;
const INK_TO_BREAK = 3;
const OPEN_CHAPTER_DAMAGE_MULTIPLIER = 1.5;

export const CHAPTER_GUARDIAN_REBIND_INTENT_INDEX = 6;

export interface ChapterGuardianUiState {
  phaseTwo: boolean;
  martialActive: boolean;
  martialProgress: number;
  martialThreshold: number;
  damageCap: number | null;
  scriptActive: boolean;
  scriptProgress: number;
  scriptThreshold: number;
  scriptPunishBlock: number;
  inkActive: boolean;
  inkProgress: number;
  inkThreshold: number;
  inkPunishCardId: string;
  open: boolean;
  rebindPending: boolean;
  openChapterDamageMultiplier: number;
}

function isChapterGuardianEnemy(
  enemy: Pick<EnemyState, "definitionId" | "currentHp"> | null | undefined
): enemy is Pick<EnemyState, "definitionId" | "currentHp"> {
  return Boolean(
    enemy &&
    enemy.definitionId === "chapter_guardian" &&
    Math.max(0, enemy.currentHp) > 0
  );
}

function withDefaultMechanicFlags(
  flags: Record<string, number> | undefined
): Record<string, number> {
  return {
    [MARTIAL_ACTIVE_KEY]: 1,
    [SCRIPT_ACTIVE_KEY]: 1,
    [INK_ACTIVE_KEY]: 1,
    [TURN_ATTACKS_KEY]: 0,
    [TURN_BLOCK_GAINED_KEY]: 0,
    [TURN_INK_SPENT_KEY]: 0,
    [TURN_SCRIPT_PUNISH_USED_KEY]: 0,
    [TURN_INK_PUNISH_USED_KEY]: 0,
    [OPEN_CHAPTER_KEY]: 0,
    [REBIND_PENDING_KEY]: 0,
    ...(flags ?? {}),
  };
}

function updateChapterGuardian(
  state: CombatState,
  updater: (enemy: EnemyState) => EnemyState
): CombatState {
  return {
    ...state,
    enemies: state.enemies.map((enemy) => {
      if (!isChapterGuardianEnemy(enemy)) return enemy;
      return updater({
        ...enemy,
        mechanicFlags: withDefaultMechanicFlags(enemy.mechanicFlags),
      });
    }),
  };
}

function getChapterGuardian(state: CombatState): EnemyState | null {
  const enemy = state.enemies.find(isChapterGuardianEnemy);
  if (!enemy) return null;
  return {
    ...enemy,
    mechanicFlags: withDefaultMechanicFlags(enemy.mechanicFlags),
  };
}

function getFlag(enemy: EnemyState, key: string): number {
  return Math.max(0, enemy.mechanicFlags?.[key] ?? 0);
}

function setFlag(enemy: EnemyState, key: string, value: number): EnemyState {
  return {
    ...enemy,
    mechanicFlags: {
      ...withDefaultMechanicFlags(enemy.mechanicFlags),
      [key]: Math.max(0, Math.floor(value)),
    },
  };
}

function incrementFlag(
  enemy: EnemyState,
  key: string,
  amount: number
): EnemyState {
  return setFlag(enemy, key, getFlag(enemy, key) + amount);
}

function isBindingActive(enemy: EnemyState, key: string): boolean {
  return getFlag(enemy, key) > 0;
}

function isPhaseTwo(enemy: EnemyState): boolean {
  return getFlag(enemy, `${FLAG_PREFIX}_phase2`) > 0;
}

function getScriptPunishBlock(enemy: EnemyState): number {
  return isPhaseTwo(enemy) ? 8 : 6;
}

function getInkPunishCardId(enemy: EnemyState): string {
  return isPhaseTwo(enemy) ? "binding_curse" : "haunting_regret";
}

function breakBinding(enemy: EnemyState, key: string): EnemyState {
  return setFlag(enemy, key, 0);
}

function areAllBindingsBroken(enemy: EnemyState): boolean {
  return (
    !isBindingActive(enemy, MARTIAL_ACTIVE_KEY) &&
    !isBindingActive(enemy, SCRIPT_ACTIVE_KEY) &&
    !isBindingActive(enemy, INK_ACTIVE_KEY)
  );
}

function openChapterIfNeeded(state: CombatState): CombatState {
  const guardian = getChapterGuardian(state);
  if (!guardian) return state;
  if (getFlag(guardian, OPEN_CHAPTER_KEY) > 0) return state;
  if (!areAllBindingsBroken(guardian)) return state;

  return updateChapterGuardian(state, (enemy) =>
    setFlag(
      setFlag({ ...enemy, block: 0 }, OPEN_CHAPTER_KEY, 1),
      REBIND_PENDING_KEY,
      0
    )
  );
}

export function initializeChapterGuardianCombat(
  state: CombatState
): CombatState {
  return updateChapterGuardian(state, (enemy) => ({
    ...enemy,
    mechanicFlags: withDefaultMechanicFlags(enemy.mechanicFlags),
  }));
}

export function resetChapterGuardianTurnState(state: CombatState): CombatState {
  return updateChapterGuardian(state, (enemy) =>
    setFlag(
      setFlag(
        setFlag(
          setFlag(
            setFlag(enemy, TURN_ATTACKS_KEY, 0),
            TURN_BLOCK_GAINED_KEY,
            0
          ),
          TURN_INK_SPENT_KEY,
          0
        ),
        TURN_SCRIPT_PUNISH_USED_KEY,
        0
      ),
      TURN_INK_PUNISH_USED_KEY,
      0
    )
  );
}

export function isChapterGuardianOpen(enemy: EnemyState): boolean {
  return (
    getFlag(
      {
        ...enemy,
        mechanicFlags: withDefaultMechanicFlags(enemy.mechanicFlags),
      },
      OPEN_CHAPTER_KEY
    ) > 0
  );
}

export function isChapterGuardianRebindPending(enemy: EnemyState): boolean {
  return (
    getFlag(
      {
        ...enemy,
        mechanicFlags: withDefaultMechanicFlags(enemy.mechanicFlags),
      },
      REBIND_PENDING_KEY
    ) > 0
  );
}

export function getChapterGuardianDamageCap(enemy: EnemyState): number | null {
  const chapterGuardian = {
    ...enemy,
    mechanicFlags: withDefaultMechanicFlags(enemy.mechanicFlags),
  };
  if (!isChapterGuardianEnemy(chapterGuardian)) return null;
  if (isChapterGuardianOpen(chapterGuardian)) return null;
  if (!isBindingActive(chapterGuardian, MARTIAL_ACTIVE_KEY)) return null;
  return isPhaseTwo(chapterGuardian) ? 6 : 8;
}

export function getChapterGuardianUiState(
  enemy: EnemyState | null | undefined
): ChapterGuardianUiState | null {
  if (!enemy) return null;
  const chapterGuardian = {
    ...enemy,
    mechanicFlags: withDefaultMechanicFlags(enemy.mechanicFlags),
  };
  if (!isChapterGuardianEnemy(chapterGuardian)) return null;

  const phaseTwo = isPhaseTwo(chapterGuardian);

  return {
    phaseTwo,
    martialActive: isBindingActive(chapterGuardian, MARTIAL_ACTIVE_KEY),
    martialProgress: getFlag(chapterGuardian, TURN_ATTACKS_KEY),
    martialThreshold: MARTIAL_ATTACKS_TO_BREAK,
    damageCap: getChapterGuardianDamageCap(chapterGuardian),
    scriptActive: isBindingActive(chapterGuardian, SCRIPT_ACTIVE_KEY),
    scriptProgress: getFlag(chapterGuardian, TURN_BLOCK_GAINED_KEY),
    scriptThreshold: SCRIPT_BLOCK_TO_BREAK,
    scriptPunishBlock: getScriptPunishBlock(chapterGuardian),
    inkActive: isBindingActive(chapterGuardian, INK_ACTIVE_KEY),
    inkProgress: getFlag(chapterGuardian, TURN_INK_SPENT_KEY),
    inkThreshold: INK_TO_BREAK,
    inkPunishCardId: getInkPunishCardId(chapterGuardian),
    open: isChapterGuardianOpen(chapterGuardian),
    rebindPending: isChapterGuardianRebindPending(chapterGuardian),
    openChapterDamageMultiplier: OPEN_CHAPTER_DAMAGE_MULTIPLIER,
  };
}

export function applyChapterGuardianIncomingDamageModifier(
  enemy: EnemyState,
  damage: number,
  source: "player" | "other"
): number {
  const chapterGuardian = {
    ...enemy,
    mechanicFlags: withDefaultMechanicFlags(enemy.mechanicFlags),
  };
  if (!isChapterGuardianEnemy(chapterGuardian)) return damage;

  let nextDamage = Math.max(0, damage);
  if (isChapterGuardianOpen(chapterGuardian)) {
    nextDamage = Math.floor(nextDamage * OPEN_CHAPTER_DAMAGE_MULTIPLIER);
  }

  if (source === "player") {
    const cap = getChapterGuardianDamageCap(chapterGuardian);
    if (cap != null) {
      nextDamage = Math.min(nextDamage, cap);
    }
  }

  return nextDamage;
}

export function registerChapterGuardianAttackCardPlayed(
  state: CombatState
): CombatState {
  const guardian = getChapterGuardian(state);
  if (!guardian) return state;
  if (!isBindingActive(guardian, MARTIAL_ACTIVE_KEY)) return state;
  if (isChapterGuardianOpen(guardian)) return state;

  const nextState = updateChapterGuardian(state, (enemy) => {
    let current = incrementFlag(enemy, TURN_ATTACKS_KEY, 1);
    if (getFlag(current, TURN_ATTACKS_KEY) >= MARTIAL_ATTACKS_TO_BREAK) {
      current = breakBinding(current, MARTIAL_ACTIVE_KEY);
    }
    return current;
  });

  return openChapterIfNeeded(nextState);
}

export function registerChapterGuardianBlockGain(
  state: CombatState,
  gainedBlock: number
): CombatState {
  if (gainedBlock <= 0) return state;
  const guardian = getChapterGuardian(state);
  if (!guardian) return state;
  if (!isBindingActive(guardian, SCRIPT_ACTIVE_KEY)) return state;
  if (isChapterGuardianOpen(guardian)) return state;

  const nextState = updateChapterGuardian(state, (enemy) => {
    let current = incrementFlag(enemy, TURN_BLOCK_GAINED_KEY, gainedBlock);
    if (getFlag(current, TURN_SCRIPT_PUNISH_USED_KEY) <= 0) {
      current = {
        ...current,
        block: current.block + getScriptPunishBlock(current),
      };
      current = setFlag(current, TURN_SCRIPT_PUNISH_USED_KEY, 1);
    }
    if (getFlag(current, TURN_BLOCK_GAINED_KEY) >= SCRIPT_BLOCK_TO_BREAK) {
      current = breakBinding(current, SCRIPT_ACTIVE_KEY);
    }
    return current;
  });

  return openChapterIfNeeded(nextState);
}

export function registerChapterGuardianInkSpent(
  state: CombatState,
  spentInk: number
): CombatState {
  if (spentInk <= 0) return state;
  const guardian = getChapterGuardian(state);
  if (!guardian) return state;
  if (!isBindingActive(guardian, INK_ACTIVE_KEY)) return state;
  if (isChapterGuardianOpen(guardian)) return state;

  const punishCardId = getInkPunishCardId(guardian);
  let nextState = updateChapterGuardian(state, (enemy) => {
    let current = incrementFlag(enemy, TURN_INK_SPENT_KEY, spentInk);
    current = setFlag(current, TURN_INK_PUNISH_USED_KEY, 1);
    if (getFlag(current, TURN_INK_SPENT_KEY) >= INK_TO_BREAK) {
      current = breakBinding(current, INK_ACTIVE_KEY);
    }
    return current;
  });

  if (getFlag(guardian, TURN_INK_PUNISH_USED_KEY) <= 0) {
    nextState = {
      ...nextState,
      discardPile: [
        ...nextState.discardPile,
        {
          instanceId: nanoid(),
          definitionId: punishCardId,
          upgraded: false,
        },
      ],
    };
  }

  return openChapterIfNeeded(nextState);
}

export function finalizeChapterGuardianPlayerTurn(
  state: CombatState
): CombatState {
  const guardian = getChapterGuardian(state);
  if (!guardian) return state;
  if (!isChapterGuardianOpen(guardian)) return state;

  return updateChapterGuardian(state, (enemy) =>
    setFlag(
      setFlag(
        {
          ...enemy,
          intentIndex: CHAPTER_GUARDIAN_REBIND_INTENT_INDEX,
        },
        OPEN_CHAPTER_KEY,
        0
      ),
      REBIND_PENDING_KEY,
      1
    )
  );
}

export function performChapterGuardianRebind(
  state: CombatState,
  enemyInstanceId: string
): CombatState {
  return updateChapterGuardian(state, (enemy) => {
    if (enemy.instanceId !== enemyInstanceId) return enemy;
    let current = setFlag(enemy, MARTIAL_ACTIVE_KEY, 1);
    current = setFlag(current, SCRIPT_ACTIVE_KEY, 1);
    current = setFlag(current, INK_ACTIVE_KEY, 1);
    current = setFlag(current, TURN_ATTACKS_KEY, 0);
    current = setFlag(current, TURN_BLOCK_GAINED_KEY, 0);
    current = setFlag(current, TURN_INK_SPENT_KEY, 0);
    current = setFlag(current, TURN_SCRIPT_PUNISH_USED_KEY, 0);
    current = setFlag(current, TURN_INK_PUNISH_USED_KEY, 0);
    current = setFlag(current, OPEN_CHAPTER_KEY, 0);
    current = setFlag(current, REBIND_PENDING_KEY, 0);
    return current;
  });
}

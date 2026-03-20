import type { CardDefinition, CardInstance } from "../schemas/cards";
import type { CombatState } from "../schemas/combat-state";
import type { EnemyState } from "../schemas/entities";
import type { RNG } from "./rng";

const FLAG_PREFIX = "medusa_gaze";
const INITIALIZED_KEY = `${FLAG_PREFIX}_initialized`;
const SLOT_ONE_PATTERN_KEY = `${FLAG_PREFIX}_slot_1_pattern`;
const SLOT_TWO_PATTERN_KEY = `${FLAG_PREFIX}_slot_2_pattern`;
const SLOT_ONE_PROGRESS_KEY = `${FLAG_PREFIX}_slot_1_progress`;
const SLOT_TWO_PROGRESS_KEY = `${FLAG_PREFIX}_slot_2_progress`;

type MedusaPatternStep = "ATTACK" | "SKILL";

interface MedusaPatternConfig {
  key: string;
  compactLabel: string;
  label: string;
  steps: readonly [MedusaPatternStep, MedusaPatternStep];
}

export interface MedusaPatternState {
  key: string;
  compactLabel: string;
  label: string;
  progress: number;
  length: number;
  completed: boolean;
}

export interface MedusaUiState {
  phaseTwo: boolean;
  petrifyCostBonus: number;
  patterns: MedusaPatternState[];
}

export interface MedusaCardPlayResult {
  state: CombatState;
  newlyPetrified: boolean;
}

const MEDUSA_PATTERNS: readonly MedusaPatternConfig[] = [
  {
    key: "ATTACK_ATTACK",
    compactLabel: "ATK > ATK",
    label: "ATTACK -> ATTACK",
    steps: ["ATTACK", "ATTACK"],
  },
  {
    key: "SKILL_ATTACK",
    compactLabel: "SKL > ATK",
    label: "SKILL -> ATTACK",
    steps: ["SKILL", "ATTACK"],
  },
  {
    key: "ATTACK_SKILL",
    compactLabel: "ATK > SKL",
    label: "ATTACK -> SKILL",
    steps: ["ATTACK", "SKILL"],
  },
  {
    key: "SKILL_SKILL",
    compactLabel: "SKL > SKL",
    label: "SKILL -> SKILL",
    steps: ["SKILL", "SKILL"],
  },
] as const;

function isMedusaEnemy(
  enemy: Pick<EnemyState, "definitionId"> | null | undefined
): enemy is Pick<EnemyState, "definitionId"> {
  return Boolean(enemy && enemy.definitionId === "medusa");
}

function sanitizeFlag(value: number | undefined, fallback: number): number {
  return Math.max(0, Math.floor(value ?? fallback));
}

function clampPatternIndex(value: number): number {
  return Math.min(MEDUSA_PATTERNS.length - 1, Math.max(0, Math.floor(value)));
}

function clampProgress(value: number): number {
  return Math.min(2, Math.max(0, Math.floor(value)));
}

function withDefaultMechanicFlags(
  flags: Record<string, number> | undefined
): Record<string, number> {
  return {
    ...(flags ?? {}),
    [INITIALIZED_KEY]: sanitizeFlag(flags?.[INITIALIZED_KEY], 0),
    [SLOT_ONE_PATTERN_KEY]: clampPatternIndex(
      sanitizeFlag(flags?.[SLOT_ONE_PATTERN_KEY], 0)
    ),
    [SLOT_TWO_PATTERN_KEY]: clampPatternIndex(
      sanitizeFlag(flags?.[SLOT_TWO_PATTERN_KEY], 1)
    ),
    [SLOT_ONE_PROGRESS_KEY]: clampProgress(
      sanitizeFlag(flags?.[SLOT_ONE_PROGRESS_KEY], 0)
    ),
    [SLOT_TWO_PROGRESS_KEY]: clampProgress(
      sanitizeFlag(flags?.[SLOT_TWO_PROGRESS_KEY], 0)
    ),
  };
}

function getFlag(enemy: EnemyState, key: string): number {
  return sanitizeFlag(withDefaultMechanicFlags(enemy.mechanicFlags)[key], 0);
}

function setFlag(enemy: EnemyState, key: string, value: number): EnemyState {
  return {
    ...enemy,
    mechanicFlags: {
      ...withDefaultMechanicFlags(enemy.mechanicFlags),
      [key]:
        key === SLOT_ONE_PATTERN_KEY || key === SLOT_TWO_PATTERN_KEY
          ? clampPatternIndex(value)
          : key === SLOT_ONE_PROGRESS_KEY || key === SLOT_TWO_PROGRESS_KEY
            ? clampProgress(value)
            : sanitizeFlag(value, 0),
    },
  };
}

function updateMedusa(
  state: CombatState,
  updater: (enemy: EnemyState) => EnemyState
): CombatState {
  return {
    ...state,
    enemies: state.enemies.map((enemy) => {
      if (!isMedusaEnemy(enemy)) return enemy;
      return updater({
        ...enemy,
        mechanicFlags: withDefaultMechanicFlags(enemy.mechanicFlags),
      });
    }),
  };
}

function getMedusaEnemy(state: CombatState): EnemyState | null {
  const medusa = state.enemies.find(isMedusaEnemy);
  if (!medusa) return null;
  return {
    ...medusa,
    mechanicFlags: withDefaultMechanicFlags(medusa.mechanicFlags),
  };
}

export function isMedusaPhaseTwo(enemy: EnemyState): boolean {
  return (enemy.mechanicFlags?.medusa_phase2 ?? 0) > 0;
}

function getActivePatternCount(enemy: EnemyState): number {
  return isMedusaPhaseTwo(enemy) ? 2 : 1;
}

function getPatternByIndex(index: number): MedusaPatternConfig {
  return MEDUSA_PATTERNS[clampPatternIndex(index)] ?? MEDUSA_PATTERNS[0]!;
}

function rollPatternIndex(rng: RNG, excludeIndex?: number): number {
  if (MEDUSA_PATTERNS.length <= 1) return 0;

  let picked = rng.nextInt(0, MEDUSA_PATTERNS.length - 1);
  if (excludeIndex == null) return picked;
  if (picked !== excludeIndex) return picked;

  picked = (picked + 1) % MEDUSA_PATTERNS.length;
  return picked;
}

function assignPatternsForTurn(state: CombatState, rng: RNG): CombatState {
  const medusa = getMedusaEnemy(state);
  if (!medusa) return state;

  const slotOneIndex = rollPatternIndex(rng);
  const slotTwoIndex =
    getActivePatternCount(medusa) > 1
      ? rollPatternIndex(rng, slotOneIndex)
      : getFlag(medusa, SLOT_TWO_PATTERN_KEY);

  return updateMedusa(state, (enemy) => {
    let next = setFlag(enemy, INITIALIZED_KEY, 1);
    next = setFlag(next, SLOT_ONE_PATTERN_KEY, slotOneIndex);
    next = setFlag(next, SLOT_TWO_PATTERN_KEY, slotTwoIndex);
    next = setFlag(next, SLOT_ONE_PROGRESS_KEY, 0);
    next = setFlag(next, SLOT_TWO_PROGRESS_KEY, 0);
    return next;
  });
}

function classifyPatternStep(
  cardType: CardDefinition["type"]
): MedusaPatternStep {
  return cardType === "ATTACK" ? "ATTACK" : "SKILL";
}

function advancePatternProgress(
  pattern: MedusaPatternConfig,
  currentProgress: number,
  playedStep: MedusaPatternStep
): number {
  const expected = pattern.steps[currentProgress];
  if (expected === playedStep) {
    return Math.min(pattern.steps.length, currentProgress + 1);
  }

  return pattern.steps[0] === playedStep ? 1 : 0;
}

function updateSlotProgress(
  enemy: EnemyState,
  patternKey: string,
  progressKey: string,
  playedStep: MedusaPatternStep
): { enemy: EnemyState; completedNow: boolean } {
  const pattern = getPatternByIndex(getFlag(enemy, patternKey));
  const previousProgress = getFlag(enemy, progressKey);
  if (previousProgress >= pattern.steps.length) {
    return { enemy, completedNow: false };
  }

  const nextProgress = advancePatternProgress(
    pattern,
    previousProgress,
    playedStep
  );
  return {
    enemy: setFlag(enemy, progressKey, nextProgress),
    completedNow:
      previousProgress < pattern.steps.length &&
      nextProgress >= pattern.steps.length,
  };
}

export function getCardPetrifiedCostBonus(
  state: Pick<CombatState, "petrifiedCardCostBonuses"> | null | undefined,
  instanceId: string | null | undefined
): number {
  if (!instanceId) return 0;
  return Math.max(
    0,
    Math.floor(state?.petrifiedCardCostBonuses?.[instanceId] ?? 0)
  );
}

function setCardPetrifiedCostBonus(
  state: CombatState,
  instanceId: string,
  value: number
): CombatState {
  const currentValue = getCardPetrifiedCostBonus(state, instanceId);
  const nextValue = Math.max(currentValue, Math.max(0, Math.floor(value)));
  if (nextValue === currentValue) return state;

  return {
    ...state,
    petrifiedCardCostBonuses: {
      ...(state.petrifiedCardCostBonuses ?? {}),
      [instanceId]: nextValue,
    },
  };
}

export function releasePetrifiedCard(
  state: CombatState,
  instanceId: string
): CombatState {
  if (!state.petrifiedCardCostBonuses?.[instanceId]) return state;

  const { [instanceId]: _removed, ...remainingBonuses } =
    state.petrifiedCardCostBonuses;
  return {
    ...state,
    petrifiedCardCostBonuses: remainingBonuses,
  };
}

function prunePetrifiedCards(state: CombatState): CombatState {
  if (!state.petrifiedCardCostBonuses) return state;

  const liveInstanceIds = new Set(
    [
      ...state.hand,
      ...state.drawPile,
      ...state.discardPile,
      ...state.exhaustPile,
    ].map((card) => card.instanceId)
  );
  let changed = false;
  const nextBonuses: Record<string, number> = {};

  for (const [instanceId, bonus] of Object.entries(
    state.petrifiedCardCostBonuses
  )) {
    const sanitizedBonus = Math.max(0, Math.floor(bonus));
    if (sanitizedBonus <= 0 || !liveInstanceIds.has(instanceId)) {
      changed = true;
      continue;
    }
    nextBonuses[instanceId] = sanitizedBonus;
    if (sanitizedBonus !== bonus) {
      changed = true;
    }
  }

  return changed
    ? {
        ...state,
        petrifiedCardCostBonuses: nextBonuses,
      }
    : state;
}

export function initializeMedusaCombat(
  state: CombatState,
  rng: RNG
): CombatState {
  const medusa = getMedusaEnemy(state);
  if (!medusa) return state;

  const current = updateMedusa(state, (enemy) => ({
    ...enemy,
    mechanicFlags: withDefaultMechanicFlags(enemy.mechanicFlags),
  }));

  if (getFlag(medusa, INITIALIZED_KEY) > 0) {
    return current;
  }

  return assignPatternsForTurn(current, rng);
}

export function startMedusaPlayerTurn(
  state: CombatState,
  rng: RNG
): CombatState {
  return assignPatternsForTurn(state, rng);
}

export function synchronizeMedusaCombatState(state: CombatState): CombatState {
  const medusa = getMedusaEnemy(state);
  if (!medusa) return prunePetrifiedCards(state);

  return prunePetrifiedCards(
    updateMedusa(state, (enemy) => ({
      ...enemy,
      mechanicFlags: withDefaultMechanicFlags(enemy.mechanicFlags),
    }))
  );
}

export function registerMedusaCardPlayed(
  state: CombatState,
  card: CardInstance,
  definition: CardDefinition
): MedusaCardPlayResult {
  const medusa = getMedusaEnemy(state);
  if (!medusa || state.phase !== "PLAYER_TURN") {
    return { state, newlyPetrified: false };
  }

  const playedStep = classifyPatternStep(definition.type);
  const activePatternCount = getActivePatternCount(medusa);
  const petrifyCostBonus = activePatternCount > 1 ? 2 : 1;
  let newlyPetrified = false;

  let current = updateMedusa(state, (enemy) => {
    let nextEnemy = enemy;

    const slotOne = updateSlotProgress(
      nextEnemy,
      SLOT_ONE_PATTERN_KEY,
      SLOT_ONE_PROGRESS_KEY,
      playedStep
    );
    nextEnemy = slotOne.enemy;
    newlyPetrified = newlyPetrified || slotOne.completedNow;

    if (activePatternCount > 1) {
      const slotTwo = updateSlotProgress(
        nextEnemy,
        SLOT_TWO_PATTERN_KEY,
        SLOT_TWO_PROGRESS_KEY,
        playedStep
      );
      nextEnemy = slotTwo.enemy;
      newlyPetrified = newlyPetrified || slotTwo.completedNow;
    } else {
      nextEnemy = setFlag(nextEnemy, SLOT_TWO_PROGRESS_KEY, 0);
    }

    return nextEnemy;
  });

  if (newlyPetrified) {
    current = setCardPetrifiedCostBonus(
      current,
      card.instanceId,
      petrifyCostBonus
    );
  }

  return {
    state: synchronizeMedusaCombatState(current),
    newlyPetrified,
  };
}

export function getMedusaUiState(
  enemy: EnemyState | null | undefined
): MedusaUiState | null {
  if (!enemy) return null;
  const medusa = {
    ...enemy,
    mechanicFlags: withDefaultMechanicFlags(enemy.mechanicFlags),
  };
  if (!isMedusaEnemy(medusa)) return null;

  const activePatternCount = getActivePatternCount(medusa);
  const patterns: MedusaPatternState[] = [];

  const slotOnePattern = getPatternByIndex(
    getFlag(medusa, SLOT_ONE_PATTERN_KEY)
  );
  const slotOneProgress = getFlag(medusa, SLOT_ONE_PROGRESS_KEY);
  patterns.push({
    key: slotOnePattern.key,
    compactLabel: slotOnePattern.compactLabel,
    label: slotOnePattern.label,
    progress: slotOneProgress,
    length: slotOnePattern.steps.length,
    completed: slotOneProgress >= slotOnePattern.steps.length,
  });

  if (activePatternCount > 1) {
    const slotTwoPattern = getPatternByIndex(
      getFlag(medusa, SLOT_TWO_PATTERN_KEY)
    );
    const slotTwoProgress = getFlag(medusa, SLOT_TWO_PROGRESS_KEY);
    patterns.push({
      key: slotTwoPattern.key,
      compactLabel: slotTwoPattern.compactLabel,
      label: slotTwoPattern.label,
      progress: slotTwoProgress,
      length: slotTwoPattern.steps.length,
      completed: slotTwoProgress >= slotTwoPattern.steps.length,
    });
  }

  return {
    phaseTwo: isMedusaPhaseTwo(medusa),
    petrifyCostBonus: activePatternCount > 1 ? 2 : 1,
    patterns,
  };
}

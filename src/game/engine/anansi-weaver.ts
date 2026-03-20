import type { CardDefinition, CardInstance } from "../schemas/cards";
import type { CombatState } from "../schemas/combat-state";
import type { EnemyState } from "../schemas/entities";
import type { RNG } from "./rng";
import { addCardsToDiscardPile } from "./boss-mechanics/shared";

const FLAG_PREFIX = "anansi_weaver";
const PATTERN_KEY = `${FLAG_PREFIX}_pattern`;
const PROGRESS_KEY = `${FLAG_PREFIX}_progress`;
const STALLED_KEY = `${FLAG_PREFIX}_stalled`;
const MATCH_ATTACK_KEY = `${FLAG_PREFIX}_match_attack`;
const MATCH_SKILL_KEY = `${FLAG_PREFIX}_match_skill`;
const MATCH_INK_KEY = `${FLAG_PREFIX}_match_ink`;
const WEBBED_COUNT_KEY = `${FLAG_PREFIX}_webbed_count`;

const PATTERN_ATTACK_SKILL = 0;
const PATTERN_ATTACK_INK = 1;
const PATTERN_SKILL_INK = 2;
const PATTERN_ATTACK_SKILL_INK = 3;
const PATTERN_ATTACK_ATTACK_INK = 4;
const PATTERN_ATTACK_SKILL_SKILL = 5;
const PATTERN_ATTACK_INK_INK = 6;
const PATTERN_SKILL_SKILL_INK = 7;
const PATTERN_SKILL_INK_INK = 8;

type AnansiStep = "ATTACK" | "SKILL" | "INK";

interface LoomPatternConfig {
  key: string;
  compactLabel: string;
  label: string;
  steps: readonly AnansiStep[];
}

export interface AnansiUiState {
  phaseTwo: boolean;
  stalled: boolean;
  progress: number;
  length: number;
  patternLabel: string;
  compactLabel: string;
  webbedCount: number;
}

export interface AnansiCardPlayResult {
  state: CombatState;
  newlyWebbed: boolean;
}

const LOOM_PATTERNS: readonly LoomPatternConfig[] = [
  {
    key: "ATTACK_SKILL",
    compactLabel: "ATK + SKL",
    label: "ATTACK + SKILL",
    steps: ["ATTACK", "SKILL"],
  },
  {
    key: "ATTACK_INK",
    compactLabel: "ATK + INK",
    label: "ATTACK + INK",
    steps: ["ATTACK", "INK"],
  },
  {
    key: "SKILL_INK",
    compactLabel: "SKL + INK",
    label: "SKILL + INK",
    steps: ["SKILL", "INK"],
  },
  {
    key: "ATTACK_SKILL_INK",
    compactLabel: "ATK + SKL + INK",
    label: "ATTACK + SKILL + INK",
    steps: ["ATTACK", "SKILL", "INK"],
  },
  {
    key: "ATTACK_ATTACK_INK",
    compactLabel: "ATK + ATK + INK",
    label: "ATTACK + ATTACK + INK",
    steps: ["ATTACK", "ATTACK", "INK"],
  },
  {
    key: "ATTACK_SKILL_SKILL",
    compactLabel: "ATK + SKL + SKL",
    label: "ATTACK + SKILL + SKILL",
    steps: ["ATTACK", "SKILL", "SKILL"],
  },
  {
    key: "ATTACK_INK_INK",
    compactLabel: "ATK + INK + INK",
    label: "ATTACK + INK + INK",
    steps: ["ATTACK", "INK", "INK"],
  },
  {
    key: "SKILL_SKILL_INK",
    compactLabel: "SKL + SKL + INK",
    label: "SKILL + SKILL + INK",
    steps: ["SKILL", "SKILL", "INK"],
  },
  {
    key: "SKILL_INK_INK",
    compactLabel: "SKL + INK + INK",
    label: "SKILL + INK + INK",
    steps: ["SKILL", "INK", "INK"],
  },
] as const;

function isAnansiEnemy(
  enemy: Pick<EnemyState, "definitionId"> | null | undefined
): enemy is Pick<EnemyState, "definitionId"> {
  return Boolean(enemy && enemy.definitionId === "anansi_weaver");
}

function sanitizeFlag(value: number | undefined, fallback: number): number {
  return Math.max(0, Math.floor(value ?? fallback));
}

function clampPatternIndex(value: number): number {
  return Math.min(LOOM_PATTERNS.length - 1, Math.max(0, Math.floor(value)));
}

function withDefaultMechanicFlags(
  flags: Record<string, number> | undefined
): Record<string, number> {
  return {
    ...(flags ?? {}),
    [PATTERN_KEY]: clampPatternIndex(sanitizeFlag(flags?.[PATTERN_KEY], 0)),
    [PROGRESS_KEY]: sanitizeFlag(flags?.[PROGRESS_KEY], 0),
    [STALLED_KEY]: sanitizeFlag(flags?.[STALLED_KEY], 0) > 0 ? 1 : 0,
    [MATCH_ATTACK_KEY]: sanitizeFlag(flags?.[MATCH_ATTACK_KEY], 0),
    [MATCH_SKILL_KEY]: sanitizeFlag(flags?.[MATCH_SKILL_KEY], 0),
    [MATCH_INK_KEY]: sanitizeFlag(flags?.[MATCH_INK_KEY], 0),
    [WEBBED_COUNT_KEY]: sanitizeFlag(flags?.[WEBBED_COUNT_KEY], 0),
  };
}

function setFlag(enemy: EnemyState, key: string, value: number): EnemyState {
  return {
    ...enemy,
    mechanicFlags: {
      ...withDefaultMechanicFlags(enemy.mechanicFlags),
      [key]:
        key === PATTERN_KEY
          ? clampPatternIndex(value)
          : key === STALLED_KEY
            ? sanitizeFlag(value, 0) > 0
              ? 1
              : 0
            : sanitizeFlag(value, 0),
    },
  };
}

function updateAnansi(
  state: CombatState,
  updater: (enemy: EnemyState) => EnemyState
): CombatState {
  return {
    ...state,
    enemies: state.enemies.map((enemy) => {
      if (!isAnansiEnemy(enemy)) return enemy;
      return updater({
        ...enemy,
        mechanicFlags: withDefaultMechanicFlags(enemy.mechanicFlags),
      });
    }),
  };
}

function getAnansiEnemy(state: CombatState): EnemyState | null {
  const anansi = state.enemies.find(isAnansiEnemy);
  if (!anansi) return null;
  return {
    ...anansi,
    mechanicFlags: withDefaultMechanicFlags(anansi.mechanicFlags),
  };
}

function isPhaseTwo(enemy: EnemyState): boolean {
  return (enemy.mechanicFlags?.anansi_weaver_phase2 ?? 0) > 0;
}

function getAvailablePatternIndexes(enemy: EnemyState): number[] {
  return isPhaseTwo(enemy)
    ? [
        PATTERN_ATTACK_SKILL_INK,
        PATTERN_ATTACK_ATTACK_INK,
        PATTERN_ATTACK_SKILL_SKILL,
        PATTERN_ATTACK_INK_INK,
        PATTERN_SKILL_SKILL_INK,
        PATTERN_SKILL_INK_INK,
      ]
    : [PATTERN_ATTACK_SKILL, PATTERN_ATTACK_INK, PATTERN_SKILL_INK];
}

function getPatternByIndex(index: number): LoomPatternConfig {
  return LOOM_PATTERNS[clampPatternIndex(index)] ?? LOOM_PATTERNS[0]!;
}

function pickPatternIndex(enemy: EnemyState, rng: RNG): number {
  const pool = getAvailablePatternIndexes(enemy);
  return pool[rng.nextInt(0, pool.length - 1)] ?? pool[0] ?? 0;
}

function getPlayedSteps(
  definition: CardDefinition,
  inkCost: number
): readonly AnansiStep[] {
  const steps: AnansiStep[] = [
    definition.type === "ATTACK" ? "ATTACK" : "SKILL",
  ];
  if (inkCost > 0) {
    steps.push("INK");
  }
  return steps;
}

function getCurrentPattern(enemy: EnemyState): LoomPatternConfig {
  const patternIndex =
    withDefaultMechanicFlags(enemy.mechanicFlags)[PATTERN_KEY] ?? 0;
  return getPatternByIndex(patternIndex);
}

function getProgress(enemy: EnemyState): number {
  return sanitizeFlag(
    withDefaultMechanicFlags(enemy.mechanicFlags)[PROGRESS_KEY],
    0
  );
}

function isStalled(enemy: EnemyState): boolean {
  return (
    sanitizeFlag(
      withDefaultMechanicFlags(enemy.mechanicFlags)[STALLED_KEY],
      0
    ) > 0
  );
}

function getRequiredCount(
  pattern: LoomPatternConfig,
  step: AnansiStep
): number {
  return pattern.steps.filter((patternStep) => patternStep === step).length;
}

function getMatchedCount(enemy: EnemyState, step: AnansiStep): number {
  const flags = withDefaultMechanicFlags(enemy.mechanicFlags);
  if (step === "ATTACK") return sanitizeFlag(flags[MATCH_ATTACK_KEY], 0);
  if (step === "INK") return sanitizeFlag(flags[MATCH_INK_KEY], 0);
  return sanitizeFlag(flags[MATCH_SKILL_KEY], 0);
}

function setMatchedCount(
  enemy: EnemyState,
  step: AnansiStep,
  value: number
): EnemyState {
  if (step === "ATTACK") return setFlag(enemy, MATCH_ATTACK_KEY, value);
  if (step === "INK") return setFlag(enemy, MATCH_INK_KEY, value);
  return setFlag(enemy, MATCH_SKILL_KEY, value);
}

function setPattern(state: CombatState, rng: RNG): CombatState {
  const anansi = getAnansiEnemy(state);
  if (!anansi) return state;

  const nextPattern = pickPatternIndex(anansi, rng);
  return updateAnansi(state, (enemy) => {
    let nextEnemy = setFlag(enemy, PATTERN_KEY, nextPattern);
    nextEnemy = setFlag(nextEnemy, PROGRESS_KEY, 0);
    nextEnemy = setFlag(nextEnemy, STALLED_KEY, 0);
    nextEnemy = setFlag(nextEnemy, MATCH_ATTACK_KEY, 0);
    nextEnemy = setFlag(nextEnemy, MATCH_SKILL_KEY, 0);
    nextEnemy = setFlag(nextEnemy, MATCH_INK_KEY, 0);
    return nextEnemy;
  });
}

function getWebbedCardIds(
  state: Pick<CombatState, "webbedCardIds"> | null | undefined
): string[] {
  return [...new Set((state?.webbedCardIds ?? []).filter(Boolean))];
}

export function isCardWebbed(
  state: Pick<CombatState, "webbedCardIds"> | null | undefined,
  instanceId: string | null | undefined
): boolean {
  if (!instanceId) return false;
  return getWebbedCardIds(state).includes(instanceId);
}

function setCardWebbed(state: CombatState, instanceId: string): CombatState {
  if (isCardWebbed(state, instanceId)) return state;
  return {
    ...state,
    webbedCardIds: [...getWebbedCardIds(state), instanceId],
  };
}

export function releaseWebbedCard(
  state: CombatState,
  instanceId: string
): CombatState {
  if (!isCardWebbed(state, instanceId)) return state;
  return {
    ...state,
    webbedCardIds: getWebbedCardIds(state).filter((id) => id !== instanceId),
  };
}

function pruneWebbedCards(state: CombatState): CombatState {
  const webbed = getWebbedCardIds(state);
  if (webbed.length === 0) return state;

  const liveIds = new Set(
    [...state.hand, ...state.drawPile, ...state.discardPile].map(
      (card) => card.instanceId
    )
  );
  const nextIds = webbed.filter((instanceId) => liveIds.has(instanceId));
  if (nextIds.length === webbed.length) return state;
  return {
    ...state,
    webbedCardIds: nextIds,
  };
}

function injectLoomOutcome(state: CombatState, enemy: EnemyState): CombatState {
  let current = addCardsToDiscardPile(state, "shrouded_omen", 1);
  if (isPhaseTwo(enemy)) {
    current = addCardsToDiscardPile(current, "binding_curse", 1);
  }
  return current;
}

export function initializeAnansiCombat(
  state: CombatState,
  rng: RNG
): CombatState {
  const anansi = getAnansiEnemy(state);
  if (!anansi) return state;
  return synchronizeAnansiCombatState(setPattern(state, rng));
}

export function startAnansiPlayerTurn(
  state: CombatState,
  rng: RNG
): CombatState {
  const anansi = getAnansiEnemy(state);
  if (!anansi) return state;
  return synchronizeAnansiCombatState(setPattern(state, rng));
}

export function synchronizeAnansiCombatState(state: CombatState): CombatState {
  const anansi = getAnansiEnemy(state);
  if (!anansi) return state;

  const pattern = getCurrentPattern(anansi);
  const attackMatches = Math.min(
    getRequiredCount(pattern, "ATTACK"),
    getMatchedCount(anansi, "ATTACK")
  );
  const skillMatches = Math.min(
    getRequiredCount(pattern, "SKILL"),
    getMatchedCount(anansi, "SKILL")
  );
  const inkMatches = Math.min(
    getRequiredCount(pattern, "INK"),
    getMatchedCount(anansi, "INK")
  );
  const progress = Math.min(
    pattern.steps.length,
    attackMatches + skillMatches + inkMatches
  );
  const webbedCount = getWebbedCardIds(state).length;

  const current = updateAnansi(state, (enemy) => {
    let nextEnemy = setFlag(enemy, MATCH_ATTACK_KEY, attackMatches);
    nextEnemy = setFlag(nextEnemy, MATCH_SKILL_KEY, skillMatches);
    nextEnemy = setFlag(nextEnemy, MATCH_INK_KEY, inkMatches);
    nextEnemy = setFlag(nextEnemy, PROGRESS_KEY, progress);
    nextEnemy = setFlag(nextEnemy, WEBBED_COUNT_KEY, webbedCount);
    return nextEnemy;
  });

  return pruneWebbedCards(current);
}

export function registerAnansiCardPlayed(
  state: CombatState,
  card: CardInstance,
  definition: CardDefinition,
  inkCost: number
): AnansiCardPlayResult {
  const anansi = getAnansiEnemy(state);
  if (!anansi || state.phase !== "PLAYER_TURN") {
    return { state, newlyWebbed: false };
  }
  if (definition.type === "STATUS" || definition.type === "CURSE") {
    return { state, newlyWebbed: false };
  }
  if (isStalled(anansi)) {
    return { state, newlyWebbed: false };
  }

  const pattern = getCurrentPattern(anansi);
  const progress = getProgress(anansi);
  if (progress >= pattern.steps.length) {
    return { state, newlyWebbed: false };
  }

  const playedSteps = getPlayedSteps(definition, inkCost);
  const contributingSteps = playedSteps.filter((step) => {
    const required = getRequiredCount(pattern, step);
    if (required <= 0) return false;
    return getMatchedCount(anansi, step) < required;
  });

  if (contributingSteps.length === 0) {
    const stalledState = updateAnansi(state, (enemy) =>
      setFlag(enemy, STALLED_KEY, 1)
    );
    const shouldPunishInkAvoidance = pattern.steps.includes("INK");
    return {
      state: synchronizeAnansiCombatState(
        shouldPunishInkAvoidance
          ? injectLoomOutcome(stalledState, anansi)
          : stalledState
      ),
      newlyWebbed: false,
    };
  }

  const nextProgress = Math.min(
    pattern.steps.length,
    progress + contributingSteps.length
  );
  let current = updateAnansi(state, (enemy) => {
    let nextEnemy = enemy;
    for (const step of contributingSteps) {
      nextEnemy = setMatchedCount(
        nextEnemy,
        step,
        getMatchedCount(nextEnemy, step) + 1
      );
    }
    nextEnemy = setFlag(nextEnemy, PROGRESS_KEY, nextProgress);
    return nextEnemy;
  });
  let newlyWebbed = false;

  if (nextProgress >= pattern.steps.length) {
    current = setCardWebbed(current, card.instanceId);
    current = injectLoomOutcome(current, anansi);
    newlyWebbed = true;
  }

  return {
    state: synchronizeAnansiCombatState(current),
    newlyWebbed,
  };
}

export function getAnansiUiState(
  enemy: EnemyState | null | undefined,
  state?: Pick<CombatState, "webbedCardIds">
): AnansiUiState | null {
  if (!enemy || !isAnansiEnemy(enemy)) return null;

  const normalizedEnemy = {
    ...enemy,
    mechanicFlags: withDefaultMechanicFlags(enemy.mechanicFlags),
  };
  const pattern = getCurrentPattern(normalizedEnemy);

  return {
    phaseTwo: isPhaseTwo(normalizedEnemy),
    stalled: isStalled(normalizedEnemy),
    progress: Math.min(pattern.steps.length, getProgress(normalizedEnemy)),
    length: pattern.steps.length,
    patternLabel: pattern.label,
    compactLabel: pattern.compactLabel,
    webbedCount:
      state != null
        ? getWebbedCardIds(state).length
        : sanitizeFlag(
            withDefaultMechanicFlags(normalizedEnemy.mechanicFlags)[
              WEBBED_COUNT_KEY
            ],
            0
          ),
  };
}

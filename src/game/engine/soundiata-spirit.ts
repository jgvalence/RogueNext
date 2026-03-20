import type { CombatState } from "../schemas/combat-state";
import type { EnemyDefinition, EnemyState } from "../schemas/entities";
import type { EffectSource } from "./effects";
import {
  grantBlockToAllEnemies,
  grantStrengthToAllEnemies,
  grantThornsToAllEnemies,
  summonEnemyIfPossible,
} from "./boss-mechanics/shared";

const FLAG_PREFIX = "soundiata_spirit";
const SLOT_ONE_CHAPTER_KEY = `${FLAG_PREFIX}_slot_1_chapter`;
const SLOT_ONE_PROGRESS_KEY = `${FLAG_PREFIX}_slot_1_progress`;
const SLOT_TWO_CHAPTER_KEY = `${FLAG_PREFIX}_slot_2_chapter`;
const SLOT_TWO_PROGRESS_KEY = `${FLAG_PREFIX}_slot_2_progress`;
const SLOT_ONE_INTERRUPT_PROGRESS_KEY = `${FLAG_PREFIX}_slot_1_interrupt_progress`;
const SLOT_TWO_INTERRUPT_PROGRESS_KEY = `${FLAG_PREFIX}_slot_2_interrupt_progress`;
const LEGACY_INTERRUPT_PROGRESS_KEY = `${FLAG_PREFIX}_interrupt_progress`;

const CHAPTER_RALLY = 0;
const CHAPTER_SHIELD = 1;
const CHAPTER_WAR = 2;

const CHAPTER_LENGTH = 2;
const PHASE_ONE_INTERRUPT_THRESHOLD = 12;
const PHASE_TWO_INTERRUPT_THRESHOLD = 14;
const PHASE_ONE_RALLY_STRENGTH = 1;
const PHASE_TWO_RALLY_STRENGTH = 2;
const PHASE_ONE_SHIELD_BLOCK = 8;
const PHASE_TWO_SHIELD_BLOCK = 12;
const PHASE_ONE_WAR_THORNS = 2;
const PHASE_TWO_WAR_THORNS = 4;

type SoundiataChapter =
  | typeof CHAPTER_RALLY
  | typeof CHAPTER_SHIELD
  | typeof CHAPTER_WAR;

export interface SoundiataVerseUiState {
  chapter: "RALLY" | "SHIELD" | "WAR";
  progress: number;
  length: number;
  interruptProgress: number;
  interruptThreshold: number;
  value: number;
}

export interface SoundiataUiState {
  phaseTwo: boolean;
  verses: SoundiataVerseUiState[];
}

function isSoundiataEnemy(
  enemy: Pick<EnemyState, "definitionId"> | null | undefined
): enemy is Pick<EnemyState, "definitionId"> {
  return Boolean(enemy && enemy.definitionId === "soundiata_spirit");
}

function sanitizeFlag(value: number | undefined, fallback: number): number {
  return Math.max(0, Math.floor(value ?? fallback));
}

function clampChapter(value: number): SoundiataChapter {
  if (value === CHAPTER_SHIELD) return CHAPTER_SHIELD;
  if (value === CHAPTER_WAR) return CHAPTER_WAR;
  return CHAPTER_RALLY;
}

function clampProgress(value: number): number {
  return Math.min(CHAPTER_LENGTH - 1, Math.max(0, Math.floor(value)));
}

function withDefaultMechanicFlags(
  flags: Record<string, number> | undefined
): Record<string, number> {
  return {
    ...(flags ?? {}),
    [SLOT_ONE_CHAPTER_KEY]: clampChapter(
      sanitizeFlag(flags?.[SLOT_ONE_CHAPTER_KEY], CHAPTER_RALLY)
    ),
    [SLOT_ONE_PROGRESS_KEY]: clampProgress(
      sanitizeFlag(flags?.[SLOT_ONE_PROGRESS_KEY], 0)
    ),
    [SLOT_TWO_CHAPTER_KEY]: clampChapter(
      sanitizeFlag(flags?.[SLOT_TWO_CHAPTER_KEY], CHAPTER_SHIELD)
    ),
    [SLOT_TWO_PROGRESS_KEY]: clampProgress(
      sanitizeFlag(flags?.[SLOT_TWO_PROGRESS_KEY], 0)
    ),
    [SLOT_ONE_INTERRUPT_PROGRESS_KEY]: sanitizeFlag(
      flags?.[SLOT_ONE_INTERRUPT_PROGRESS_KEY] ??
        flags?.[LEGACY_INTERRUPT_PROGRESS_KEY],
      0
    ),
    [SLOT_TWO_INTERRUPT_PROGRESS_KEY]: sanitizeFlag(
      flags?.[SLOT_TWO_INTERRUPT_PROGRESS_KEY],
      0
    ),
  };
}

function setFlag(enemy: EnemyState, key: string, value: number): EnemyState {
  return {
    ...enemy,
    mechanicFlags: {
      ...withDefaultMechanicFlags(enemy.mechanicFlags),
      [key]:
        key === SLOT_ONE_CHAPTER_KEY || key === SLOT_TWO_CHAPTER_KEY
          ? clampChapter(value)
          : key === SLOT_ONE_PROGRESS_KEY || key === SLOT_TWO_PROGRESS_KEY
            ? clampProgress(value)
            : sanitizeFlag(value, 0),
    },
  };
}

function updateSoundiata(
  state: CombatState,
  updater: (enemy: EnemyState) => EnemyState
): CombatState {
  return {
    ...state,
    enemies: state.enemies.map((enemy) => {
      if (!isSoundiataEnemy(enemy)) return enemy;
      return updater({
        ...enemy,
        mechanicFlags: withDefaultMechanicFlags(enemy.mechanicFlags),
      });
    }),
  };
}

function getSoundiataEnemy(state: CombatState): EnemyState | null {
  const enemy = state.enemies.find(isSoundiataEnemy);
  if (!enemy) return null;
  return {
    ...enemy,
    mechanicFlags: withDefaultMechanicFlags(enemy.mechanicFlags),
  };
}

function isPhaseTwo(enemy: EnemyState): boolean {
  return (enemy.mechanicFlags?.soundiata_spirit_phase2 ?? 0) > 0;
}

function getActiveVerseCount(enemy: EnemyState): number {
  return isPhaseTwo(enemy) ? 2 : 1;
}

function getInterruptThreshold(enemy: EnemyState): number {
  return isPhaseTwo(enemy)
    ? PHASE_TWO_INTERRUPT_THRESHOLD
    : PHASE_ONE_INTERRUPT_THRESHOLD;
}

function getInterruptProgressKey(slotIndex: 0 | 1): string {
  return slotIndex === 0
    ? SLOT_ONE_INTERRUPT_PROGRESS_KEY
    : SLOT_TWO_INTERRUPT_PROGRESS_KEY;
}

function getChapterValue(enemy: EnemyState, chapter: SoundiataChapter): number {
  const phaseTwo = isPhaseTwo(enemy);
  switch (chapter) {
    case CHAPTER_RALLY:
      return phaseTwo ? PHASE_TWO_RALLY_STRENGTH : PHASE_ONE_RALLY_STRENGTH;
    case CHAPTER_SHIELD:
      return phaseTwo ? PHASE_TWO_SHIELD_BLOCK : PHASE_ONE_SHIELD_BLOCK;
    case CHAPTER_WAR:
      return phaseTwo ? PHASE_TWO_WAR_THORNS : PHASE_ONE_WAR_THORNS;
    default:
      return 0;
  }
}

function nextChapter(chapter: SoundiataChapter): SoundiataChapter {
  if (chapter === CHAPTER_RALLY) return CHAPTER_SHIELD;
  if (chapter === CHAPTER_SHIELD) return CHAPTER_WAR;
  return CHAPTER_RALLY;
}

function getInterruptProgress(enemy: EnemyState, slotIndex: 0 | 1): number {
  return sanitizeFlag(
    withDefaultMechanicFlags(enemy.mechanicFlags)[
      getInterruptProgressKey(slotIndex)
    ],
    0
  );
}

function isFriendlySource(source: EffectSource): boolean {
  return source === "player" || source.type === "ally";
}

function getChapterUiLabel(
  chapter: SoundiataChapter
): SoundiataVerseUiState["chapter"] {
  if (chapter === CHAPTER_SHIELD) return "SHIELD";
  if (chapter === CHAPTER_WAR) return "WAR";
  return "RALLY";
}

function readVerse(enemy: EnemyState, slotIndex: 0 | 1) {
  const chapterKey =
    slotIndex === 0 ? SLOT_ONE_CHAPTER_KEY : SLOT_TWO_CHAPTER_KEY;
  const progressKey =
    slotIndex === 0 ? SLOT_ONE_PROGRESS_KEY : SLOT_TWO_PROGRESS_KEY;
  const interruptProgressKey = getInterruptProgressKey(slotIndex);
  const chapter = clampChapter(
    withDefaultMechanicFlags(enemy.mechanicFlags)[chapterKey] ?? CHAPTER_RALLY
  );
  const progress = clampProgress(
    withDefaultMechanicFlags(enemy.mechanicFlags)[progressKey] ?? 0
  );
  const interruptProgress = sanitizeFlag(
    withDefaultMechanicFlags(enemy.mechanicFlags)[interruptProgressKey],
    0
  );

  return {
    slotIndex,
    chapter,
    progress,
    interruptProgress,
    chapterKey,
    progressKey,
    interruptProgressKey,
  };
}

function applyChapterResolution(
  state: CombatState,
  enemy: EnemyState,
  chapter: SoundiataChapter
): CombatState {
  const value = getChapterValue(enemy, chapter);
  switch (chapter) {
    case CHAPTER_RALLY:
      return grantStrengthToAllEnemies(state, value);
    case CHAPTER_SHIELD:
      return grantBlockToAllEnemies(state, value);
    case CHAPTER_WAR:
      return grantThornsToAllEnemies(state, value);
    default:
      return state;
  }
}

function unlockSecondVerse(enemy: EnemyState): EnemyState {
  const currentChapter = clampChapter(
    withDefaultMechanicFlags(enemy.mechanicFlags)[SLOT_ONE_CHAPTER_KEY] ??
      CHAPTER_RALLY
  );
  const unlockedChapter = nextChapter(currentChapter);
  let nextEnemy = setFlag(enemy, SLOT_TWO_CHAPTER_KEY, unlockedChapter);
  nextEnemy = setFlag(nextEnemy, SLOT_TWO_PROGRESS_KEY, 0);
  nextEnemy = setFlag(nextEnemy, SLOT_TWO_INTERRUPT_PROGRESS_KEY, 0);
  return nextEnemy;
}

function hasLivingMaskHunter(state: CombatState): boolean {
  return state.enemies.some(
    (enemy) => enemy.definitionId === "mask_hunter" && enemy.currentHp > 0
  );
}

function ensureMaskHunterPresent(
  state: CombatState,
  enemyDefs?: Map<string, EnemyDefinition>
): CombatState {
  if (hasLivingMaskHunter(state)) return state;
  return summonEnemyIfPossible(state, "mask_hunter", enemyDefs);
}

export function initializeSoundiataCombat(
  state: CombatState,
  enemyDefs?: Map<string, EnemyDefinition>
): CombatState {
  const enemy = getSoundiataEnemy(state);
  if (!enemy) return state;
  return synchronizeSoundiataCombatState(
    ensureMaskHunterPresent(state, enemyDefs)
  );
}

export function startSoundiataPlayerTurn(state: CombatState): CombatState {
  const enemy = getSoundiataEnemy(state);
  if (!enemy) return state;

  return synchronizeSoundiataCombatState(
    updateSoundiata(state, (currentEnemy) => {
      let nextEnemy = setFlag(currentEnemy, SLOT_ONE_INTERRUPT_PROGRESS_KEY, 0);
      nextEnemy = setFlag(nextEnemy, SLOT_TWO_INTERRUPT_PROGRESS_KEY, 0);
      return nextEnemy;
    })
  );
}

export function synchronizeSoundiataCombatState(
  state: CombatState
): CombatState {
  const enemy = getSoundiataEnemy(state);
  if (!enemy) return state;

  return updateSoundiata(state, (currentEnemy) => {
    let nextEnemy: EnemyState = {
      ...currentEnemy,
      mechanicFlags: withDefaultMechanicFlags(currentEnemy.mechanicFlags),
    };

    if (!isPhaseTwo(nextEnemy)) {
      nextEnemy = setFlag(nextEnemy, SLOT_TWO_PROGRESS_KEY, 0);
      nextEnemy = setFlag(nextEnemy, SLOT_TWO_INTERRUPT_PROGRESS_KEY, 0);
    }

    return nextEnemy;
  });
}

export function triggerSoundiataPhaseTwo(
  state: CombatState,
  enemyInstanceId: string,
  enemyDefs?: Map<string, EnemyDefinition>
): CombatState {
  const soundiata = state.enemies.find(
    (enemy) => enemy.instanceId === enemyInstanceId
  );
  if (!soundiata || !isSoundiataEnemy(soundiata)) {
    return synchronizeSoundiataCombatState(state);
  }

  let current = updateSoundiata(state, (enemy) => unlockSecondVerse(enemy));
  current = ensureMaskHunterPresent(current, enemyDefs);
  return synchronizeSoundiataCombatState(current);
}

export function registerSoundiataInterruptDamage(
  state: CombatState,
  targetInstanceId: string,
  amount: number,
  source: EffectSource
): CombatState {
  if (
    !isFriendlySource(source) ||
    amount <= 0 ||
    state.phase !== "PLAYER_TURN"
  ) {
    return state;
  }

  const soundiata = getSoundiataEnemy(state);
  if (!soundiata) return state;

  const target = state.enemies.find(
    (enemy) => enemy.instanceId === targetInstanceId
  );
  if (!target || target.currentHp <= 0) return state;
  if (
    target.definitionId !== "soundiata_spirit" &&
    target.definitionId !== "mask_hunter"
  ) {
    return state;
  }

  return synchronizeSoundiataCombatState(
    updateSoundiata(state, (enemy) => {
      const threshold = getInterruptThreshold(enemy);
      let nextEnemy = enemy;
      let remaining = amount;
      const activeVerses = [readVerse(enemy, 0), readVerse(enemy, 1)].slice(
        0,
        getActiveVerseCount(enemy)
      );

      for (const verse of activeVerses) {
        if (remaining <= 0) break;
        const currentProgress = getInterruptProgress(
          nextEnemy,
          verse.slotIndex
        );
        const needed = Math.max(0, threshold - currentProgress);
        if (needed <= 0) continue;
        const applied = Math.min(remaining, needed);
        nextEnemy = setFlag(
          nextEnemy,
          verse.interruptProgressKey,
          currentProgress + applied
        );
        remaining -= applied;
      }

      return nextEnemy;
    })
  );
}

export function resolveSoundiataPostAbility(
  state: CombatState,
  enemyInstanceId: string
): CombatState {
  const soundiata = state.enemies.find(
    (enemy) => enemy.instanceId === enemyInstanceId
  );
  if (!soundiata || !isSoundiataEnemy(soundiata)) {
    return synchronizeSoundiataCombatState(state);
  }

  let current = state;

  const activeVerseIndexes = [0, 1].slice(
    0,
    getActiveVerseCount(soundiata)
  ) as Array<0 | 1>;
  for (const slotIndex of activeVerseIndexes) {
    const currentSoundiata = getSoundiataEnemy(current);
    if (!currentSoundiata) break;
    const verse = readVerse(currentSoundiata, slotIndex);
    const interruptThreshold = getInterruptThreshold(currentSoundiata);

    if (verse.interruptProgress >= interruptThreshold) {
      current = updateSoundiata(current, (enemy) => {
        let nextEnemy = setFlag(
          enemy,
          verse.chapterKey,
          nextChapter(verse.chapter)
        );
        nextEnemy = setFlag(nextEnemy, verse.progressKey, 0);
        return nextEnemy;
      });
      continue;
    }

    const nextProgress = verse.progress + 1;
    if (nextProgress >= CHAPTER_LENGTH) {
      current = applyChapterResolution(
        current,
        currentSoundiata,
        verse.chapter
      );
      current = updateSoundiata(current, (enemy) => {
        let nextEnemy = setFlag(
          enemy,
          verse.chapterKey,
          nextChapter(verse.chapter)
        );
        nextEnemy = setFlag(nextEnemy, verse.progressKey, 0);
        return nextEnemy;
      });
      continue;
    }

    current = updateSoundiata(current, (enemy) =>
      setFlag(enemy, verse.progressKey, nextProgress)
    );
  }

  current = updateSoundiata(current, (enemy) =>
    setFlag(
      setFlag(enemy, SLOT_ONE_INTERRUPT_PROGRESS_KEY, 0),
      SLOT_TWO_INTERRUPT_PROGRESS_KEY,
      0
    )
  );
  return synchronizeSoundiataCombatState(current);
}

export function getSoundiataUiState(
  enemy: EnemyState | null | undefined
): SoundiataUiState | null {
  if (!enemy || !isSoundiataEnemy(enemy)) return null;

  const normalizedEnemy = {
    ...enemy,
    mechanicFlags: withDefaultMechanicFlags(enemy.mechanicFlags),
  };
  const interruptThreshold = getInterruptThreshold(normalizedEnemy);
  const verses = [readVerse(normalizedEnemy, 0), readVerse(normalizedEnemy, 1)]
    .slice(0, getActiveVerseCount(normalizedEnemy))
    .map((verse) => ({
      chapter: getChapterUiLabel(verse.chapter),
      progress: verse.progress,
      length: CHAPTER_LENGTH,
      interruptProgress: verse.interruptProgress,
      interruptThreshold,
      value: getChapterValue(normalizedEnemy, verse.chapter),
    }));

  return {
    phaseTwo: isPhaseTwo(normalizedEnemy),
    verses,
  };
}

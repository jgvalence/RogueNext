import type { CardDefinition } from "../schemas/cards";
import { relicDefinitions, type RelicDefinitionData } from "../data/relics";
import { RELIC_UNLOCK_REQUIREMENTS_FROM_DOC } from "../data/relic-unlocks";
import { GAME_CONSTANTS } from "../constants";
import { characterDefinitions } from "../data/characters";

export const MAX_RUN_DIFFICULTY_LEVEL = 5;
const DIFFICULTY_UNLOCK_KEY = "__RUN_DIFFICULTY_UNLOCKED_MAX";
const BEST_GOLD_SINGLE_RUN_KEY = "__RUN_BEST_GOLD_SINGLE";
const BEST_INFINITE_FLOOR_KEY = "__RUN_INFINITE_BEST_FLOOR";
const CHARACTER_DIFFICULTY_WIN_KEY_PREFIX = "__RUN_CHARACTER_DIFFICULTY_WIN__";

function difficultyUnlockKeyForCharacter(characterId: string): string {
  return `${DIFFICULTY_UNLOCK_KEY}_${characterId}`;
}

/**
 * Retourne le max de difficulté débloqué pour un personnage donné.
 * Migration douce : le Scribe hérite aussi de l'ancienne clé globale.
 */
export function getUnlockedMaxDifficultyForCharacter(
  resources: Record<string, number>,
  characterId: string
): number {
  const charMax = resources[difficultyUnlockKeyForCharacter(characterId)] ?? 0;
  // Soft migration : le Scribe hérite de la clé globale pré-système de personnages
  const legacyMax =
    characterId === "scribe" ? (resources[DIFFICULTY_UNLOCK_KEY] ?? 0) : 0;
  return clampDifficulty(Math.max(charMax, legacyMax));
}

/**
 * Retourne la liste des niveaux de difficulté débloqués pour un personnage.
 */
export function getUnlockedDifficultyLevelsForCharacter(
  resources: Record<string, number>,
  characterId: string
): number[] {
  const maxUnlocked = getUnlockedMaxDifficultyForCharacter(
    resources,
    characterId
  );
  return Array.from({ length: maxUnlocked + 1 }, (_, idx) => idx);
}

export interface RelicUnlockRequirement {
  totalRuns?: number;
  wonRuns?: number;
  winsByDifficulty?: Record<string, number>;
  characterWinsByDifficulty?: {
    characterId: string;
    difficulty: number;
    count?: number;
  };
  bestGoldInSingleRun?: number;
  enemyKills?: {
    enemyId: string;
    count: number;
  };
}

type EnemyKillRequirement = NonNullable<RelicUnlockRequirement["enemyKills"]>;

const RELIC_UNLOCK_REQUIREMENTS: Record<string, RelicUnlockRequirement> =
  RELIC_UNLOCK_REQUIREMENTS_FROM_DOC;

export type RelicUnlockRequirementState =
  | {
      type: "TOTAL_RUNS";
      required: number;
      current: number;
    }
  | {
      type: "WON_RUNS";
      required: number;
      current: number;
    }
  | {
      type: "BEST_GOLD_IN_SINGLE_RUN";
      required: number;
      current: number;
    }
  | {
      type: "ENEMY_KILLS";
      enemyId: string;
      required: number;
      current: number;
    }
  | {
      type: "WINS_BY_DIFFICULTY";
      difficulty: number;
      required: number;
      current: number;
    }
  | {
      type: "CHARACTER_WINS_BY_DIFFICULTY";
      characterId: string;
      difficulty: number;
      required: number;
      current: number;
    };

export interface RelicUnlockDetail {
  unlocked: boolean;
  requirements: RelicUnlockRequirementState[];
  missingRequirement: RelicUnlockRequirementState | null;
}

export interface RelicUnlockProgress {
  totalRuns: number;
  wonRuns: number;
  unlockedDifficultyMax: number;
  winsByDifficulty?: Record<string, number>;
  characterWinsByDifficulty?: Record<string, Record<string, number>>;
  bestGoldInSingleRun?: number;
  enemyKillCounts?: Record<string, number>;
}

function getRelicUnlockRequirement(
  relicId: string
): RelicUnlockRequirement | undefined {
  const base = RELIC_UNLOCK_REQUIREMENTS[relicId];
  if (base) return base;

  const sourceBossId = relicDefinitions.find(
    (r) => r.id === relicId
  )?.sourceBossId;

  if (!sourceBossId) return undefined;

  return {
    enemyKills: {
      enemyId: sourceBossId,
      count: 3,
    },
  };
}

export function getEnemyKillRequirementForRelic(
  relicId: string
): EnemyKillRequirement | null {
  const fromDoc = RELIC_UNLOCK_REQUIREMENTS[relicId]?.enemyKills;
  if (fromDoc) return fromDoc;

  const sourceBossId = relicDefinitions.find(
    (r) => r.id === relicId
  )?.sourceBossId;
  if (!sourceBossId) return null;
  return {
    enemyId: sourceBossId,
    count: 3,
  };
}

export function computeEnemyKillUnlockedRelicIds(
  relicIds: string[],
  enemyKillCounts: Record<string, number> = {}
): string[] {
  return relicIds.filter((relicId) => {
    const requirement = getEnemyKillRequirementForRelic(relicId);
    if (!requirement) return false;
    const killCount = Math.max(0, enemyKillCounts[requirement.enemyId] ?? 0);
    return killCount >= requirement.count;
  });
}

function clampDifficulty(level: number): number {
  return Math.min(MAX_RUN_DIFFICULTY_LEVEL, Math.max(0, Math.floor(level)));
}

function characterDifficultyWinKey(
  characterId: string,
  difficultyLevel: number
): string {
  return `${CHARACTER_DIFFICULTY_WIN_KEY_PREFIX}${characterId}__${clampDifficulty(difficultyLevel)}`;
}

function parseCharacterDifficultyWinKey(key: string): {
  characterId: string;
  difficultyLevel: number;
} | null {
  if (!key.startsWith(CHARACTER_DIFFICULTY_WIN_KEY_PREFIX)) return null;

  const [characterId, difficultyRaw] = key
    .slice(CHARACTER_DIFFICULTY_WIN_KEY_PREFIX.length)
    .split("__");
  if (!characterId || difficultyRaw == null) return null;

  const difficultyLevel = Number(difficultyRaw);
  if (!Number.isInteger(difficultyLevel)) return null;

  return {
    characterId,
    difficultyLevel: clampDifficulty(difficultyLevel),
  };
}

export function readCharacterWinsByDifficultyFromResources(
  resources: Record<string, number>
): Record<string, Record<string, number>> {
  const result: Record<string, Record<string, number>> = {};

  for (const [key, rawWins] of Object.entries(resources)) {
    const parsed = parseCharacterDifficultyWinKey(key);
    if (!parsed) continue;
    const characterWins = result[parsed.characterId] ?? {};
    characterWins[String(parsed.difficultyLevel)] = Math.max(
      0,
      Math.floor(rawWins ?? 0)
    );
    result[parsed.characterId] = characterWins;
  }

  // Soft backfill: unlocked max difficulty proves prior clears up to max - 1.
  for (const character of characterDefinitions) {
    const maxUnlocked = getUnlockedMaxDifficultyForCharacter(
      resources,
      character.id
    );
    if (maxUnlocked <= 0) continue;
    const characterWins = result[character.id] ?? {};
    for (let difficulty = 0; difficulty < maxUnlocked; difficulty += 1) {
      characterWins[String(difficulty)] = Math.max(
        1,
        Math.floor(characterWins[String(difficulty)] ?? 0)
      );
    }
    result[character.id] = characterWins;
  }

  return result;
}

export function recordCharacterDifficultyVictory(
  resources: Record<string, number>,
  characterId: string,
  difficultyLevel: number
): Record<string, number> {
  const key = characterDifficultyWinKey(characterId, difficultyLevel);
  return {
    ...resources,
    [key]: Math.max(0, Math.floor(resources[key] ?? 0)) + 1,
  };
}

export function getUnlockedMaxDifficultyFromResources(
  resources: Record<string, number>
): number {
  return clampDifficulty(resources[DIFFICULTY_UNLOCK_KEY] ?? 0);
}

export function getUnlockedDifficultyLevels(
  resources: Record<string, number>
): number[] {
  const maxUnlocked = getUnlockedMaxDifficultyFromResources(resources);
  return Array.from({ length: maxUnlocked + 1 }, (_, idx) => idx);
}

export function getBestGoldInSingleRun(
  resources: Record<string, number>
): number {
  return Math.max(0, Math.floor(resources[BEST_GOLD_SINGLE_RUN_KEY] ?? 0));
}

export function updateBestGoldInSingleRun(
  resources: Record<string, number>,
  runBestGold: number
): Record<string, number> {
  const currentBest = getBestGoldInSingleRun(resources);
  const safeRunBest = Math.max(0, Math.floor(runBestGold));
  if (safeRunBest <= currentBest) return resources;
  return {
    ...resources,
    [BEST_GOLD_SINGLE_RUN_KEY]: safeRunBest,
  };
}

export function getBestInfiniteFloor(
  resources: Record<string, number>
): number {
  return Math.max(0, Math.floor(resources[BEST_INFINITE_FLOOR_KEY] ?? 0));
}

export function updateBestInfiniteFloor(
  resources: Record<string, number>,
  runFloor: number
): Record<string, number> {
  const currentBest = getBestInfiniteFloor(resources);
  const safeRunFloor = Math.max(0, Math.floor(runFloor));
  if (safeRunFloor <= currentBest) return resources;
  return {
    ...resources,
    [BEST_INFINITE_FLOOR_KEY]: safeRunFloor,
  };
}

export function getPostFloorFiveEscalation(
  floor: number,
  enabled: boolean
): {
  enemyHpMultiplier: number;
  enemyDamageMultiplier: number;
  eliteChanceBonus: number;
} {
  const safeFloor = Math.max(1, Math.floor(floor));
  if (!enabled || safeFloor <= GAME_CONSTANTS.MAX_FLOORS) {
    return {
      enemyHpMultiplier: 1,
      enemyDamageMultiplier: 1,
      eliteChanceBonus: 0,
    };
  }

  const extraFloors = safeFloor - GAME_CONSTANTS.MAX_FLOORS;
  return {
    // Infinite mode is meant to spike hard immediately after floor 5.
    // Floor 6 should feel dramatically harder, then keep ramping quickly.
    enemyHpMultiplier: Math.pow(1.85, extraFloors),
    enemyDamageMultiplier: Math.pow(1.6, extraFloors),
    eliteChanceBonus: Math.min(0.6, extraFloors * 0.18),
  };
}

export function unlockNextDifficultyOnVictory(
  resources: Record<string, number>,
  wonDifficultyLevel: number,
  characterId?: string
): Record<string, number> {
  if (characterId) {
    const currentMax = getUnlockedMaxDifficultyForCharacter(
      resources,
      characterId
    );
    const won = clampDifficulty(wonDifficultyLevel);
    if (won < currentMax) return resources;
    const nextMax = clampDifficulty(currentMax + 1);
    if (nextMax === currentMax) return resources;
    return {
      ...resources,
      [difficultyUnlockKeyForCharacter(characterId)]: nextMax,
    };
  }
  // Fallback global (rétrocompat)
  const currentMax = getUnlockedMaxDifficultyFromResources(resources);
  const won = clampDifficulty(wonDifficultyLevel);
  if (won < currentMax) return resources;
  const nextMax = clampDifficulty(currentMax + 1);
  if (nextMax === currentMax) return resources;
  return {
    ...resources,
    [DIFFICULTY_UNLOCK_KEY]: nextMax,
  };
}

export function getDifficultyModifiers(level: number): {
  enemyHpMultiplier: number;
  enemyDamageMultiplier: number;
  eliteChanceBonus: number;
  specialRoomHealWeightMultiplier: number;
  specialRoomEventWeightBonus: number;
  enemyPackSizeBonus: number;
  disruptionWeightBonus: number;
} {
  const l = clampDifficulty(level);
  const eliteChanceBonus = l >= 5 ? 0.24 : l >= 4 ? 0.08 : 0;
  const specialRoomHealWeightMultiplier = l >= 5 ? 0.25 : l >= 4 ? 0.5 : 1;
  const specialRoomEventWeightBonus = l >= 5 ? 0.2 : l >= 4 ? 0.12 : 0;
  const enemyPackSizeBonus = l >= 5 ? 1 : 0;
  // Boost the weight of enemy disruption abilities by difficulty
  // Diff 0: none, Diff 1: light, Diff 3+: marked
  const disruptionWeightBonus = ([0, 0.3, 0.6, 1.5, 2.0, 3.0] as const)[l] ?? 0;
  return {
    enemyHpMultiplier: 1 + l * 0.12,
    enemyDamageMultiplier: 1 + l * 0.1,
    eliteChanceBonus,
    specialRoomHealWeightMultiplier,
    specialRoomEventWeightBonus,
    enemyPackSizeBonus,
    disruptionWeightBonus,
  };
}

export function enemyDebuffsBypassBlock(
  level: number,
  source: { isBoss?: boolean; isElite?: boolean }
): boolean {
  const l = clampDifficulty(level);
  if (l >= 5) return true;
  if (l >= 4) return Boolean(source.isBoss || source.isElite);
  if (l >= 3) return Boolean(source.isBoss);
  return false;
}

export function shouldHideEnemyIntent(
  level: number,
  turnNumber: number,
  source: { isBoss?: boolean; isElite?: boolean }
): boolean {
  const l = clampDifficulty(level);
  if (l < 3) return false;
  if (!source.isBoss && !source.isElite) return false;
  return turnNumber % 3 === 0;
}

export function getEnemyStartingBlock(
  level: number,
  floor: number,
  source: { isBoss?: boolean; isElite?: boolean }
): number {
  const l = clampDifficulty(level);
  if (l < 3) return 0;
  if (source.isBoss) return Math.max(0, floor) * 5;
  if (l >= 4 && source.isElite) return Math.max(0, floor) * 5;
  return 0;
}

export function getBossDebuffBonus(level: number): number {
  const l = clampDifficulty(level);
  return l >= 4 ? 1 : 0;
}

export function eliteCanDropRelic(level: number, rngRoll: number): boolean {
  const l = clampDifficulty(level);
  if (l < 5) return true;
  return rngRoll >= 0.5;
}

export function isRelicUnlockedForDifficulty(
  _relicId: string,
  _unlockedDifficultyMax: number
): boolean {
  // No difficulty-based gating for relic availability.
  return true;
}

export function isRelicUnlocked(
  relicId: string,
  progress: RelicUnlockProgress
): boolean {
  if (!isRelicUnlockedForDifficulty(relicId, progress.unlockedDifficultyMax)) {
    return false;
  }

  const requirements = getRelicUnlockRequirement(relicId);
  if (!requirements) return true;

  const totalRunsRequired = Math.max(0, requirements.totalRuns ?? 0);
  const wonRunsRequired = Math.max(0, requirements.wonRuns ?? 0);
  const bestGoldRequired = Math.max(0, requirements.bestGoldInSingleRun ?? 0);
  if (progress.totalRuns < totalRunsRequired) return false;
  if (progress.wonRuns < wonRunsRequired) return false;
  if ((progress.bestGoldInSingleRun ?? 0) < bestGoldRequired) return false;

  const enemyKills = progress.enemyKillCounts ?? {};
  if (requirements.enemyKills) {
    const requiredEnemyKills = Math.max(0, requirements.enemyKills.count);
    if (
      (enemyKills[requirements.enemyKills.enemyId] ?? 0) < requiredEnemyKills
    ) {
      return false;
    }
  }

  const winsByDifficulty = progress.winsByDifficulty ?? {};
  for (const [difficulty, requiredWinsRaw] of Object.entries(
    requirements.winsByDifficulty ?? {}
  )) {
    const requiredWins = Math.max(0, Math.floor(requiredWinsRaw));
    if ((winsByDifficulty[difficulty] ?? 0) < requiredWins) {
      return false;
    }
  }

  if (requirements.characterWinsByDifficulty) {
    const {
      characterId,
      difficulty,
      count = 1,
    } = requirements.characterWinsByDifficulty;
    const characterWins =
      progress.characterWinsByDifficulty?.[characterId] ?? {};
    const requiredWins = Math.max(0, Math.floor(count));
    if (
      (characterWins[String(clampDifficulty(difficulty))] ?? 0) < requiredWins
    ) {
      return false;
    }
  }

  return true;
}

function buildRelicUnlockRequirementStates(
  relicId: string,
  progress: RelicUnlockProgress
): RelicUnlockRequirementState[] {
  const requirements = getRelicUnlockRequirement(relicId);
  if (!requirements) return [];

  const result: RelicUnlockRequirementState[] = [];

  const totalRunsRequired = Math.max(0, requirements.totalRuns ?? 0);
  if (totalRunsRequired > 0) {
    result.push({
      type: "TOTAL_RUNS",
      required: totalRunsRequired,
      current: Math.max(0, Math.floor(progress.totalRuns ?? 0)),
    });
  }

  const wonRunsRequired = Math.max(0, requirements.wonRuns ?? 0);
  if (wonRunsRequired > 0) {
    result.push({
      type: "WON_RUNS",
      required: wonRunsRequired,
      current: Math.max(0, Math.floor(progress.wonRuns ?? 0)),
    });
  }

  const bestGoldRequired = Math.max(0, requirements.bestGoldInSingleRun ?? 0);
  if (bestGoldRequired > 0) {
    result.push({
      type: "BEST_GOLD_IN_SINGLE_RUN",
      required: bestGoldRequired,
      current: Math.max(0, Math.floor(progress.bestGoldInSingleRun ?? 0)),
    });
  }

  if (requirements.enemyKills) {
    result.push({
      type: "ENEMY_KILLS",
      enemyId: requirements.enemyKills.enemyId,
      required: Math.max(0, Math.floor(requirements.enemyKills.count)),
      current: Math.max(
        0,
        Math.floor(
          progress.enemyKillCounts?.[requirements.enemyKills.enemyId] ?? 0
        )
      ),
    });
  }

  for (const [difficultyRaw, requiredWinsRaw] of Object.entries(
    requirements.winsByDifficulty ?? {}
  ).sort(([left], [right]) => Number(left) - Number(right))) {
    result.push({
      type: "WINS_BY_DIFFICULTY",
      difficulty: clampDifficulty(Number(difficultyRaw)),
      required: Math.max(0, Math.floor(requiredWinsRaw)),
      current: Math.max(
        0,
        Math.floor(progress.winsByDifficulty?.[difficultyRaw] ?? 0)
      ),
    });
  }

  if (requirements.characterWinsByDifficulty) {
    const {
      characterId,
      difficulty,
      count = 1,
    } = requirements.characterWinsByDifficulty;
    const normalizedDifficulty = clampDifficulty(difficulty);
    result.push({
      type: "CHARACTER_WINS_BY_DIFFICULTY",
      characterId,
      difficulty: normalizedDifficulty,
      required: Math.max(0, Math.floor(count)),
      current: Math.max(
        0,
        Math.floor(
          progress.characterWinsByDifficulty?.[characterId]?.[
            String(normalizedDifficulty)
          ] ?? 0
        )
      ),
    });
  }

  return result;
}

function isRelicUnlockRequirementMet(
  requirement: RelicUnlockRequirementState
): boolean {
  return requirement.current >= requirement.required;
}

export function getRelicUnlockDetails(
  relicIds: string[],
  progress: RelicUnlockProgress
): Record<string, RelicUnlockDetail> {
  const result: Record<string, RelicUnlockDetail> = {};

  for (const relicId of relicIds) {
    const requirements = buildRelicUnlockRequirementStates(relicId, progress);
    result[relicId] = {
      unlocked: isRelicUnlocked(relicId, progress),
      requirements,
      missingRequirement:
        requirements.find((requirement) => !isRelicUnlockRequirementMet(requirement)) ??
        null,
    };
  }

  return result;
}

export function computeUnlockedRelicIds(
  relicIds: string[],
  progress: RelicUnlockProgress
): string[] {
  return relicIds.filter((relicId) => isRelicUnlocked(relicId, progress));
}

export function filterCardIdsByDifficulty(
  cardIds: string[],
  _unlockedDifficultyMax: number
): string[] {
  // No difficulty-based gating for card availability.
  return cardIds;
}

export function filterCardsByDifficulty(
  cards: CardDefinition[],
  _unlockedDifficultyMax: number
): CardDefinition[] {
  // No difficulty-based gating for card availability.
  return cards;
}

export function filterRelicsByDifficulty(
  relics: RelicDefinitionData[],
  _unlockedDifficultyMax: number
): RelicDefinitionData[] {
  // No difficulty-based gating for relic availability.
  return relics;
}

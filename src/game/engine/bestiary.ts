export type EncounteredEnemyType = "NORMAL" | "ELITE" | "BOSS";

export const ENCOUNTERED_ENEMY_RESOURCE_PREFIX = "encounteredEnemies.";
export const ENEMY_KILL_COUNT_RESOURCE_PREFIX = "enemyKills.";

export const LORE_MILESTONES_BY_TYPE: Record<
  EncounteredEnemyType,
  [number, number, number]
> = {
  NORMAL: [1, 5, 15],
  ELITE: [1, 3, 5],
  BOSS: [1, 2, 3],
};

const ENCOUNTERED_TYPE_TO_CODE: Record<EncounteredEnemyType, number> = {
  NORMAL: 1,
  ELITE: 2,
  BOSS: 3,
};

const ENCOUNTERED_TYPE_PRIORITY: Record<EncounteredEnemyType, number> = {
  NORMAL: 1,
  ELITE: 2,
  BOSS: 3,
};

function decodeEncounteredEnemyType(
  value: number
): EncounteredEnemyType | null {
  if (value === ENCOUNTERED_TYPE_TO_CODE.BOSS) return "BOSS";
  if (value === ENCOUNTERED_TYPE_TO_CODE.ELITE) return "ELITE";
  if (value === ENCOUNTERED_TYPE_TO_CODE.NORMAL) return "NORMAL";
  return null;
}

function encodeEncounteredEnemyType(type: EncounteredEnemyType): number {
  return ENCOUNTERED_TYPE_TO_CODE[type] ?? ENCOUNTERED_TYPE_TO_CODE.NORMAL;
}

export function normalizeEncounteredEnemyType(
  value: unknown
): EncounteredEnemyType | null {
  if (typeof value === "string") {
    if (value === "BOSS" || value === "ELITE" || value === "NORMAL") {
      return value;
    }
    return null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return decodeEncounteredEnemyType(Math.round(value));
  }
  return null;
}

export function deriveEncounteredEnemyType(flags: {
  isBoss?: boolean;
  isElite?: boolean;
}): EncounteredEnemyType {
  if (flags.isBoss) return "BOSS";
  if (flags.isElite) return "ELITE";
  return "NORMAL";
}

export function mergeEncounteredEnemies(
  ...maps: Array<Record<string, EncounteredEnemyType>>
): Record<string, EncounteredEnemyType> {
  const merged: Record<string, EncounteredEnemyType> = {};

  for (const map of maps) {
    for (const [enemyId, type] of Object.entries(map)) {
      const normalized = normalizeEncounteredEnemyType(type);
      if (!normalized) continue;
      const previous = merged[enemyId];
      if (!previous) {
        merged[enemyId] = normalized;
        continue;
      }
      if (
        ENCOUNTERED_TYPE_PRIORITY[normalized] >
        ENCOUNTERED_TYPE_PRIORITY[previous]
      ) {
        merged[enemyId] = normalized;
      }
    }
  }

  return merged;
}

function normalizeKillCount(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.max(0, Math.floor(value));
}

export function mergeEnemyKillCounts(
  ...maps: Array<Record<string, number>>
): Record<string, number> {
  const merged: Record<string, number> = {};

  for (const map of maps) {
    for (const [enemyId, rawCount] of Object.entries(map)) {
      const count = normalizeKillCount(rawCount);
      if (count == null) continue;
      merged[enemyId] = Math.max(merged[enemyId] ?? 0, count);
    }
  }

  return merged;
}

export function readEncounteredEnemiesFromResources(
  resources: Record<string, number>
): Record<string, EncounteredEnemyType> {
  const encountered: Record<string, EncounteredEnemyType> = {};

  for (const [key, value] of Object.entries(resources)) {
    if (!key.startsWith(ENCOUNTERED_ENEMY_RESOURCE_PREFIX)) continue;
    const enemyId = key.slice(ENCOUNTERED_ENEMY_RESOURCE_PREFIX.length);
    if (!enemyId) continue;

    const type = normalizeEncounteredEnemyType(value);
    if (!type) continue;
    encountered[enemyId] = type;
  }

  return encountered;
}

export function writeEncounteredEnemiesToResources(
  resources: Record<string, number>,
  encounteredEnemies: Record<string, EncounteredEnemyType>
): Record<string, number> {
  const next = { ...resources };

  for (const key of Object.keys(next)) {
    if (key.startsWith(ENCOUNTERED_ENEMY_RESOURCE_PREFIX)) {
      delete next[key];
    }
  }

  for (const [enemyId, type] of Object.entries(encounteredEnemies)) {
    const normalized = normalizeEncounteredEnemyType(type);
    if (!normalized) continue;
    next[`${ENCOUNTERED_ENEMY_RESOURCE_PREFIX}${enemyId}`] =
      encodeEncounteredEnemyType(normalized);
  }

  return next;
}

export function readEnemyKillCountsFromResources(
  resources: Record<string, number>
): Record<string, number> {
  const killCounts: Record<string, number> = {};

  for (const [key, value] of Object.entries(resources)) {
    if (!key.startsWith(ENEMY_KILL_COUNT_RESOURCE_PREFIX)) continue;
    const enemyId = key.slice(ENEMY_KILL_COUNT_RESOURCE_PREFIX.length);
    if (!enemyId) continue;

    const count = normalizeKillCount(value);
    if (count == null) continue;
    killCounts[enemyId] = count;
  }

  return killCounts;
}

export function writeEnemyKillCountsToResources(
  resources: Record<string, number>,
  enemyKillCounts: Record<string, number>
): Record<string, number> {
  const next = { ...resources };

  for (const key of Object.keys(next)) {
    if (key.startsWith(ENEMY_KILL_COUNT_RESOURCE_PREFIX)) {
      delete next[key];
    }
  }

  for (const [enemyId, rawCount] of Object.entries(enemyKillCounts)) {
    const count = normalizeKillCount(rawCount);
    if (count == null) continue;
    next[`${ENEMY_KILL_COUNT_RESOURCE_PREFIX}${enemyId}`] = count;
  }

  return next;
}

export function getUnlockedLoreEntryCount(
  type: EncounteredEnemyType,
  killCount: number
): number {
  const normalizedCount = Math.max(0, Math.floor(killCount));
  const milestones = LORE_MILESTONES_BY_TYPE[type] ?? [1, 5, 15];
  return milestones.filter((threshold) => normalizedCount >= threshold).length;
}

export function getLoreEntryIndexForKillCount(
  type: EncounteredEnemyType,
  killCount: number
): number {
  const unlockedCount = getUnlockedLoreEntryCount(type, killCount);
  return Math.max(0, unlockedCount - 1);
}

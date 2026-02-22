import type { CardDefinition } from "../schemas/cards";
import type { RelicDefinitionData } from "../data/relics";

export const MAX_RUN_DIFFICULTY_LEVEL = 5;
const DIFFICULTY_UNLOCK_KEY = "__RUN_DIFFICULTY_UNLOCKED_MAX";

const CARD_DIFFICULTY_REQUIREMENTS: Record<string, number> = {
  final_chapter: 1,
  forbidden_appendix: 2,
  index_of_echoes: 3,
  redacted_blast: 4,
};

const RELIC_DIFFICULTY_REQUIREMENTS: Record<string, number> = {
  cursed_diacrit: 1,
  runic_bulwark: 2,
  eternal_hourglass: 3,
  blood_grimoire: 4,
};

function clampDifficulty(level: number): number {
  return Math.min(MAX_RUN_DIFFICULTY_LEVEL, Math.max(0, Math.floor(level)));
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

export function unlockNextDifficultyOnVictory(
  resources: Record<string, number>,
  wonDifficultyLevel: number
): Record<string, number> {
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
} {
  const l = clampDifficulty(level);
  const eliteChanceBonus = l >= 5 ? 0.16 : l >= 4 ? 0.08 : 0;
  const specialRoomHealWeightMultiplier = l >= 5 ? 0.25 : l >= 4 ? 0.5 : 1;
  const specialRoomEventWeightBonus = l >= 5 ? 0.2 : l >= 4 ? 0.12 : 0;
  const enemyPackSizeBonus = l >= 5 ? 1 : 0;
  return {
    enemyHpMultiplier: 1 + l * 0.12,
    enemyDamageMultiplier: 1 + l * 0.1,
    eliteChanceBonus,
    specialRoomHealWeightMultiplier,
    specialRoomEventWeightBonus,
    enemyPackSizeBonus,
  };
}

function getCardDifficultyRequirement(cardId: string): number {
  return CARD_DIFFICULTY_REQUIREMENTS[cardId] ?? 0;
}

function getRelicDifficultyRequirement(relicId: string): number {
  return RELIC_DIFFICULTY_REQUIREMENTS[relicId] ?? 0;
}

export function isRelicUnlockedForDifficulty(
  relicId: string,
  unlockedDifficultyMax: number
): boolean {
  return getRelicDifficultyRequirement(relicId) <= unlockedDifficultyMax;
}

export function filterCardIdsByDifficulty(
  cardIds: string[],
  unlockedDifficultyMax: number
): string[] {
  return cardIds.filter(
    (cardId) => getCardDifficultyRequirement(cardId) <= unlockedDifficultyMax
  );
}

export function filterCardsByDifficulty(
  cards: CardDefinition[],
  unlockedDifficultyMax: number
): CardDefinition[] {
  return cards.filter(
    (card) => getCardDifficultyRequirement(card.id) <= unlockedDifficultyMax
  );
}

export function filterRelicsByDifficulty(
  relics: RelicDefinitionData[],
  unlockedDifficultyMax: number
): RelicDefinitionData[] {
  return relics.filter(
    (relic) => getRelicDifficultyRequirement(relic.id) <= unlockedDifficultyMax
  );
}

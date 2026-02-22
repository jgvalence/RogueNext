import type { CardDefinition, CardInstance } from "../schemas/cards";
import type { RunState } from "../schemas/run-state";
import type { BiomeResource, BiomeType } from "../schemas/enums";
import { GAME_CONSTANTS } from "../constants";
import type { RNG } from "./rng";
import { nanoid } from "nanoid";
import { getResourcesForCombat } from "./meta";
import { relicDefinitions, type RelicDefinitionData } from "../data/relics";
import { allyDefinitions } from "../data/allies";
import type { AllyDefinition } from "../schemas/entities";
import {
  filterCardsByDifficulty,
  filterRelicsByDifficulty,
} from "./difficulty";

export interface CombatRewards {
  gold: number;
  cardChoices: CardDefinition[];
  biomeResources: Partial<Record<BiomeResource, number>>;
  relicChoices: RelicDefinitionData[];
  allyChoices: AllyDefinition[];
  bossMaxHpBonus: number | null;
}

/**
 * Generate rewards after winning a combat.
 * - Normal: gold + card choices (3 cards)
 * - Elite:  gold + 1 rare card + 1 relic (player picks one)
 *           fallback: if no relic remains, grant a 2nd rare card choice
 * - Boss:   gold + 3 relic choices (player picks one; no card choice)
 */
export function generateCombatRewards(
  floor: number,
  room: number,
  isBoss: boolean,
  isElite: boolean,
  enemyCount: number,
  allCards: CardDefinition[],
  rng: RNG,
  biome: BiomeType = "LIBRARY",
  currentRelicIds: string[] = [],
  unlockedCardIds?: string[],
  currentAllyIds: string[] = [],
  allySlotCount: number = 0,
  unlockedDifficultyLevelSnapshot = 0
): CombatRewards {
  // Gold reward
  const baseGold = GAME_CONSTANTS.GOLD_REWARD_BASE;
  const variance = rng.nextInt(0, GAME_CONSTANTS.GOLD_REWARD_VARIANCE);
  const floorBonus = (floor - 1) * 5;
  let gold = baseGold + variance + floorBonus + room;
  gold += (enemyCount - 1) * GAME_CONSTANTS.GOLD_PER_EXTRA_ENEMY;
  if (isElite) gold += GAME_CONSTANTS.ELITE_GOLD_BONUS;
  if (isBoss) gold *= GAME_CONSTANTS.BOSS_GOLD_MULTIPLIER;

  // Card reward
  const lootableCards = filterCardsByDifficulty(
    allCards,
    unlockedDifficultyLevelSnapshot
  ).filter(
    (c) =>
      !c.isStarterCard &&
      c.isCollectible !== false &&
      (c.biome === biome || c.biome === "LIBRARY") &&
      (unlockedCardIds ? unlockedCardIds.includes(c.id) : true)
  );
  const shuffledCards = rng.shuffle(lootableCards);

  let cardChoices: CardDefinition[];
  if (isBoss) {
    cardChoices = []; // Boss: no card choice
  } else if (isElite) {
    // Elite: 1 rare card option
    const rareCards = shuffledCards.filter((c) => c.rarity === "RARE");
    cardChoices =
      rareCards.length > 0 ? [rareCards[0]!] : shuffledCards.slice(0, 1);
  } else {
    cardChoices = shuffledCards.slice(0, GAME_CONSTANTS.CARD_REWARD_CHOICES);
  }

  // Biome resources (25% cross-biome chance via rng)
  const biomeResources = getResourcesForCombat(
    biome,
    isElite,
    isBoss,
    floor,
    rng
  );

  // Relic choices
  const availableRelics = filterRelicsByDifficulty(
    relicDefinitions,
    unlockedDifficultyLevelSnapshot
  ).filter((r) => !currentRelicIds.includes(r.id));
  let relicChoices: RelicDefinitionData[] = [];

  if (isBoss) {
    const pool = availableRelics.filter(
      (r) =>
        r.rarity === "UNCOMMON" || r.rarity === "RARE" || r.rarity === "BOSS"
    );
    relicChoices = rng
      .shuffle(pool.length >= 3 ? pool : availableRelics)
      .slice(0, 3);
  } else if (isElite) {
    const pool = availableRelics.filter((r) => r.rarity !== "BOSS");
    relicChoices = rng
      .shuffle(pool.length > 0 ? pool : availableRelics)
      .slice(0, 1);
    if (relicChoices.length === 0) {
      const rareCards = shuffledCards.filter((c) => c.rarity === "RARE");
      const existingCardIds = new Set(cardChoices.map((c) => c.id));
      const extraRare =
        rareCards.find((c) => !existingCardIds.has(c.id)) ??
        shuffledCards.find((c) => !existingCardIds.has(c.id));
      if (extraRare) {
        cardChoices = [...cardChoices, extraRare];
      }
    }
  }

  let allyChoices: AllyDefinition[] = [];
  const hasAllySlot = allySlotCount > currentAllyIds.length;
  if (isElite && hasAllySlot) {
    const availableAllies = allyDefinitions.filter(
      (a) => !currentAllyIds.includes(a.id)
    );
    allyChoices = rng.shuffle(availableAllies).slice(0, 2);
  }

  // Boss only: 50% chance to offer +15 max HP as an alternative to a relic
  const bossMaxHpBonus = isBoss && rng.next() < 0.5 ? 15 : null;

  return {
    gold,
    cardChoices,
    biomeResources,
    relicChoices,
    allyChoices,
    bossMaxHpBonus,
  };
}

/**
 * Add a card to the run's master deck.
 */
export function addCardToRunDeck(
  runState: RunState,
  definitionId: string
): RunState {
  const newCard: CardInstance = {
    instanceId: nanoid(),
    definitionId,
    upgraded: false,
  };

  return {
    ...runState,
    deck: [...runState.deck, newCard],
  };
}

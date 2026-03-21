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
import { matchesCardCharacter } from "./card-filters";
import { eliteCanDropRelic } from "./difficulty";
import {
  weightedSampleCardsForOffers,
  type CardOfferSource,
  type CardOfferContext,
} from "./card-offers";
import { pickRandomUsableItemDefinitionId } from "./items";
import { getTotalLootLuck, weightedSampleByRarity } from "./loot";
import { getRunConditionCardLootUnlockResourceKey } from "./run-conditions";
import { getDeckArchetypeCounts } from "./card-archetypes";

export interface CombatRewards {
  gold: number;
  cardChoices: CardDefinition[];
  biomeResources: Partial<Record<BiomeResource, number>>;
  relicChoices: RelicDefinitionData[];
  allyChoices: AllyDefinition[];
  bossMaxHpBonus: number | null;
  usableItemDropDefinitionId: string | null;
}

export function markCardAcquiredForRunConditionUnlock(
  runState: RunState,
  definitionId: string
): RunState {
  const resourceKey = getRunConditionCardLootUnlockResourceKey(definitionId);
  return {
    ...runState,
    earnedResources: {
      ...runState.earnedResources,
      [resourceKey]: (runState.earnedResources?.[resourceKey] ?? 0) + 1,
    },
  };
}

function filterRewardCards(
  allCards: CardDefinition[],
  unlockedCardIds?: string[],
  characterId?: string
): CardDefinition[] {
  return allCards.filter(
    (card) =>
      !card.isStarterCard &&
      card.isCollectible !== false &&
      matchesCardCharacter(card, characterId) &&
      (unlockedCardIds ? unlockedCardIds.includes(card.id) : true)
  );
}

function drawMixedCardChoices(
  cards: CardDefinition[],
  biome: BiomeType,
  count: number,
  rng: RNG,
  lootLuck: number,
  source: CardOfferSource,
  offerContext?: CardOfferContext
): CardDefinition[] {
  if (count <= 0 || cards.length === 0) return [];

  const sameBiomePool = cards.filter((card) => card.biome === biome);
  const offBiomePool = cards.filter((card) => card.biome !== biome);
  const picks: CardDefinition[] = [];
  const pickedIds = new Set<string>();

  const addPicks = (pool: CardDefinition[], amount: number) => {
    if (amount <= 0 || pool.length === 0) return;
    const sampled = weightedSampleCardsForOffers(
      pool,
      amount,
      rng,
      lootLuck,
      source,
      biome,
      offerContext
    );
    for (const card of sampled) {
      if (pickedIds.has(card.id)) continue;
      pickedIds.add(card.id);
      picks.push(card);
    }
  };

  addPicks(sameBiomePool, 1);
  addPicks(
    offBiomePool.filter((card) => !pickedIds.has(card.id)),
    count - picks.length
  );
  addPicks(
    cards.filter((card) => !pickedIds.has(card.id)),
    count - picks.length
  );

  return picks;
}

function drawBiomeFocusedCardChoices(
  cards: CardDefinition[],
  biome: BiomeType,
  count: number,
  rng: RNG,
  lootLuck: number,
  offerContext?: CardOfferContext
): CardDefinition[] {
  if (count <= 0 || cards.length === 0) return [];

  const sameBiomePool = cards.filter((card) => card.biome === biome);
  const offBiomePool = cards.filter((card) => card.biome !== biome);
  const picks: CardDefinition[] = [];
  const pickedIds = new Set<string>();

  const addPicks = (pool: CardDefinition[], amount: number) => {
    if (amount <= 0 || pool.length === 0) return;
    const sampled = weightedSampleCardsForOffers(
      pool,
      amount,
      rng,
      lootLuck,
      "NORMAL_REWARD",
      biome,
      offerContext
    );
    for (const card of sampled) {
      if (pickedIds.has(card.id)) continue;
      pickedIds.add(card.id);
      picks.push(card);
    }
  };

  addPicks(sameBiomePool, Math.min(1, count));
  addPicks(
    offBiomePool.filter((card) => !pickedIds.has(card.id)),
    count - picks.length
  );
  addPicks(
    cards.filter((card) => !pickedIds.has(card.id)),
    count - picks.length
  );

  return picks;
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
  _unlockedDifficultyLevelSnapshot = 0,
  defeatedBossId?: string,
  extraCardRewardChoices = 0,
  metaLootLuckBonus = 0,
  selectedDifficultyLevel = 0,
  unlockedRelicIds?: string[],
  combatRewardMultiplier = 1,
  disableBiomeResourceRewards = false,
  characterId?: string,
  currentDeck: CardInstance[] = [],
  playerCurrentHp?: number,
  playerMaxHp?: number
): CombatRewards {
  const lootLuck = getTotalLootLuck(currentRelicIds, metaLootLuckBonus);
  const hasOmensCompass = currentRelicIds.includes("omens_compass");
  const hasOracleDrachma = currentRelicIds.includes("greek_oracle_drachma");
  const hasVoidCompass = currentRelicIds.includes("love_void_compass");
  const hasGriotArchive = currentRelicIds.includes("african_griot_archive");
  const hasGoldenCanopic = currentRelicIds.includes("egypt_golden_canopic");
  // Gold reward
  const baseGold = GAME_CONSTANTS.GOLD_REWARD_BASE;
  const variance = rng.nextInt(0, GAME_CONSTANTS.GOLD_REWARD_VARIANCE);
  const floorBonus = (floor - 1) * 5;
  let gold = baseGold + variance + floorBonus + room;
  gold += (enemyCount - 1) * GAME_CONSTANTS.GOLD_PER_EXTRA_ENEMY;
  if (isElite) gold += GAME_CONSTANTS.ELITE_GOLD_BONUS;
  if (isBoss) gold *= GAME_CONSTANTS.BOSS_GOLD_MULTIPLIER;
  const relicGoldMultiplier = currentRelicIds.includes("gilded_ledger")
    ? 1.5
    : 1;
  const rewardMultiplier = Math.max(1, combatRewardMultiplier);
  gold = Math.max(0, Math.round(gold * relicGoldMultiplier * rewardMultiplier));

  // Card reward: keep one choice anchored in the current biome when possible,
  // then fill the rest from unlocked off-biome / neutral cards for variety.
  const rewardEligibleCards = filterRewardCards(
    allCards,
    unlockedCardIds,
    characterId
  );
  const allCardDefs = new Map(allCards.map((card) => [card.id, card]));
  const offerContext: CardOfferContext | undefined =
    currentDeck.length > 0 || playerCurrentHp != null || playerMaxHp != null
      ? {
          archetypeCounts: getDeckArchetypeCounts(currentDeck, allCardDefs),
          playerCurrentHp,
          playerMaxHp,
        }
      : undefined;
  const rareRewardCards = rewardEligibleCards.filter(
    (card) => card.rarity === "RARE"
  );

  const extraChoices =
    Math.max(0, Math.floor(extraCardRewardChoices)) +
    (hasOracleDrachma ? 1 : 0) +
    (hasVoidCompass ? 1 : 0) +
    (isElite && hasGriotArchive ? 1 : 0);
  let cardChoices: CardDefinition[];
  if (isBoss) {
    // Boss: 2 rare card choices
    cardChoices =
      rareRewardCards.length > 0
        ? drawMixedCardChoices(
            rareRewardCards,
            biome,
            2,
            rng,
            lootLuck,
            "NORMAL_REWARD",
            offerContext
          )
        : drawMixedCardChoices(
            rewardEligibleCards,
            biome,
            2,
            rng,
            lootLuck,
            "NORMAL_REWARD",
            offerContext
          );
  } else if (isElite) {
    cardChoices = drawMixedCardChoices(
      rewardEligibleCards,
      biome,
      Math.max(1, 1 + extraChoices),
      rng,
      lootLuck,
      "ELITE_REWARD",
      offerContext
    );
  } else {
    cardChoices = drawBiomeFocusedCardChoices(
      rewardEligibleCards,
      biome,
      GAME_CONSTANTS.CARD_REWARD_CHOICES + extraChoices,
      rng,
      lootLuck,
      offerContext
    );
  }

  // Biome resources (25% cross-biome chance via rng)
  const scaledBiomeResources: Partial<Record<BiomeResource, number>> = {};
  if (!disableBiomeResourceRewards) {
    const biomeResourceMultiplier = hasGoldenCanopic ? 1.2 : 1;
    const biomeResources = getResourcesForCombat(biome, isElite, isBoss, floor);
    for (const [resource, amount] of Object.entries(biomeResources)) {
      scaledBiomeResources[resource as BiomeResource] = Math.max(
        0,
        Math.round(
          (amount as number) * rewardMultiplier * biomeResourceMultiplier
        )
      );
    }
  }

  // Relic choices
  const availableRelics = relicDefinitions.filter(
    (r) =>
      !currentRelicIds.includes(r.id) &&
      (!unlockedRelicIds || unlockedRelicIds.includes(r.id))
  );
  let relicChoices: RelicDefinitionData[] = [];

  if (isBoss) {
    const nonBossRelics = availableRelics.filter((r) => r.rarity !== "BOSS");
    const bossRelics = availableRelics.filter((r) => r.rarity === "BOSS");
    const pool = nonBossRelics.filter(
      (r) => r.rarity === "UNCOMMON" || r.rarity === "RARE"
    );
    const nonBossChoices = weightedSampleByRarity(
      pool.length >= 3 ? pool : nonBossRelics,
      3,
      rng,
      lootLuck
    );

    // Guarantee the boss-specific relic as a choice if available and not owned
    const bossRelic = defeatedBossId
      ? availableRelics.find((r) => r.sourceBossId === defeatedBossId)
      : undefined;

    const bonusBossRelic =
      hasOmensCompass && bossRelics.length > 0
        ? (() => {
            const candidatePool = bossRelics.filter(
              (r) => r.id !== bossRelic?.id
            );
            return rng.pick(
              candidatePool.length > 0 ? candidatePool : bossRelics
            );
          })()
        : undefined;

    if (bossRelic) {
      const rest = nonBossChoices.filter((r) => r.id !== bossRelic.id);
      if (bonusBossRelic) {
        relicChoices = [bossRelic, bonusBossRelic, ...rest].slice(0, 3);
      } else {
        relicChoices = [bossRelic, ...rest].slice(0, 3);
      }
    } else if (bonusBossRelic) {
      relicChoices = [bonusBossRelic, ...nonBossChoices].slice(0, 3);
    } else {
      relicChoices = nonBossChoices.slice(0, 3);
    }
  } else if (isElite) {
    if (eliteCanDropRelic(selectedDifficultyLevel, rng.next())) {
      const pool = availableRelics.filter((r) => r.rarity !== "BOSS");
      relicChoices = weightedSampleByRarity(
        pool.length > 0 ? pool : availableRelics,
        1,
        rng,
        lootLuck
      );
    } else {
      relicChoices = [];
    }
    if (relicChoices.length === 0) {
      const existingCardIds = new Set(cardChoices.map((c) => c.id));
      const remainingRareRewardCards = rareRewardCards.filter(
        (card) => !existingCardIds.has(card.id)
      );
      const extraRarePool =
        remainingRareRewardCards.length > 0
          ? remainingRareRewardCards
          : rewardEligibleCards.filter((card) => !existingCardIds.has(card.id));
      const extraRare = drawMixedCardChoices(
        extraRarePool,
        biome,
        1,
        rng,
        lootLuck,
        "ELITE_REWARD",
        offerContext
      )[0];
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
  const usableItemDropChanceBase = isBoss ? 0.2 : isElite ? 0.15 : 0.08;
  const usableItemDropChance = Math.min(
    0.6,
    usableItemDropChanceBase * (1 + lootLuck * 0.08)
  );
  const usableItemDropDefinitionId =
    rng.next() < usableItemDropChance
      ? pickRandomUsableItemDefinitionId(rng)
      : null;

  return {
    gold,
    cardChoices,
    biomeResources: scaledBiomeResources,
    relicChoices,
    allyChoices,
    bossMaxHpBonus,
    usableItemDropDefinitionId,
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

  const hpPenalty = runState.relicIds.includes("love_void_compass") ? 2 : 0;
  const nextState = {
    ...runState,
    deck: [...runState.deck, newCard],
    playerCurrentHp: Math.max(1, runState.playerCurrentHp - hpPenalty),
  };
  return markCardAcquiredForRunConditionUnlock(nextState, definitionId);
}

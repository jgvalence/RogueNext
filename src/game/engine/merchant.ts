import type { RunState } from "../schemas/run-state";
import type { CardDefinition } from "../schemas/cards";
import type { AllyDefinition } from "../schemas/entities";
import type { BiomeResource } from "../schemas/enums";
import type {
  UsableItemDefinition,
  UsableItemInstance,
} from "../schemas/items";
import type { RNG } from "./rng";
import { nanoid } from "nanoid";
import { relicDefinitions } from "../data/relics";
import {
  filterCardsByDifficulty,
  isRelicUnlockedForDifficulty,
} from "./difficulty";
import { usableItemDefinitions, createUsableItemInstance } from "./items";
import { GAME_CONSTANTS } from "../constants";
import { getTotalLootLuck, weightedSampleByRarity } from "./loot";

const BIOME_RESOURCE_KEYS: BiomeResource[] = [
  "PAGES",
  "RUNES",
  "LAURIERS",
  "GLYPHES",
  "FRAGMENTS",
  "OBSIDIENNE",
  "AMBRE",
  "SCEAUX",
  "MASQUES",
];

const SHOP_PRICE_MULTIPLIER = 1.25;
const AUTO_RESTOCK_RELIC_ID = "haggler_satchel";
const EXTRA_PURGE_RELIC_ID = "surgeons_quill";
const SHOP_REROLL_GROWTH = 1.6;

function scaleShopPrice(price: number): number {
  return Math.max(1, Math.round(price * SHOP_PRICE_MULTIPLIER));
}

function getDifficultyShopPriceMultiplier(difficultyLevel: number): number {
  if (difficultyLevel >= 5) return 1.3;
  if (difficultyLevel >= 4) return 1.15;
  return 1;
}

function applyDifficultyShopPrice(
  price: number,
  difficultyLevel: number
): number {
  return Math.max(
    1,
    Math.round(price * getDifficultyShopPriceMultiplier(difficultyLevel))
  );
}

export function getMerchantAutoRestockCharges(relicIds: string[]): number {
  return relicIds.includes(AUTO_RESTOCK_RELIC_ID) ? 1 : 0;
}

export function getMerchantPurgeUsesPerVisit(relicIds: string[]): number {
  return relicIds.includes(EXTRA_PURGE_RELIC_ID) ? 3 : 1;
}

export function getShopRerollPrice(
  floor: number,
  rerollCount: number,
  difficultyLevel = 0
): number {
  const safeCount = Math.max(0, Math.floor(rerollCount));
  const base = applyDifficultyShopPrice(
    scaleShopPrice(30 + floor * 6),
    difficultyLevel
  );
  return Math.max(
    1,
    Math.round(base * Math.pow(SHOP_REROLL_GROWTH, safeCount))
  );
}

export function buyShopReroll(runState: RunState): RunState | null {
  const rerollCount = Math.max(0, runState.merchantRerollCount ?? 0);
  const price = getShopRerollPrice(
    runState.floor,
    rerollCount,
    runState.selectedDifficultyLevel ?? 0
  );
  if (runState.gold < price) return null;
  return {
    ...runState,
    gold: runState.gold - price,
    merchantRerollCount: rerollCount + 1,
  };
}

function sanitizeResourcePool(
  rawPool: Record<string, number>
): Record<BiomeResource, number> {
  const allowed = new Set(BIOME_RESOURCE_KEYS);
  const clean = {} as Record<BiomeResource, number>;
  for (const [key, value] of Object.entries(rawPool)) {
    if (!allowed.has(key as BiomeResource)) continue;
    if (!Number.isFinite(value) || value <= 0) continue;
    clean[key as BiomeResource] = Math.max(0, Math.floor(value));
  }
  return clean;
}

function getShopRelicRarity(
  relicId: string
): "COMMON" | "UNCOMMON" | "RARE" | "BOSS" {
  return (
    relicDefinitions.find((relic) => relic.id === relicId)?.rarity ?? "COMMON"
  );
}

export interface ShopItem {
  id: string;
  type: "card" | "relic" | "heal" | "max_hp" | "purge" | "usable_item";
  cardDef?: CardDefinition;
  usableItemDef?: UsableItemDefinition;
  relicId?: string;
  relicName?: string;
  relicDescription?: string;
  healAmount?: number;
  maxHpAmount?: number;
  price: number;
}

export type StartMerchantOfferType =
  | "CARD"
  | "RELIC"
  | "USABLE_ITEM"
  | "ALLY"
  | "BONUS_GOLD"
  | "BONUS_MAX_HP";

export interface StartMerchantOffer {
  id: string;
  type: StartMerchantOfferType;
  name: string;
  description: string;
  cost: Partial<Record<BiomeResource, number>>;
  cardId?: string;
  relicId?: string;
  usableItemId?: string;
  allyId?: string;
  goldAmount?: number;
  maxHpAmount?: number;
}

/**
 * Generate shop inventory for a merchant room.
 */
export function generateShopInventory(
  floor: number,
  allCards: CardDefinition[],
  ownedRelicIds: string[],
  rng: RNG,
  unlockedCardIds?: string[],
  unlockedDifficultyLevelSnapshot = 0,
  selectedDifficultyLevel = 0,
  relicDiscount = 0,
  usableItems?: UsableItemInstance[],
  usableItemCapacity: number = GAME_CONSTANTS.MAX_USABLE_ITEMS
): ShopItem[] {
  const items: ShopItem[] = [];
  const lootLuck = getTotalLootLuck(ownedRelicIds);
  const clampedRelicDiscount = Math.max(0, Math.min(95, relicDiscount));
  const applyRelicDiscount = (price: number) =>
    Math.max(0, Math.round(price * (1 - clampedRelicDiscount / 100)));

  // 3 random non-starter cards
  const lootable = weightedSampleByRarity(
    filterCardsByDifficulty(allCards, unlockedDifficultyLevelSnapshot).filter(
      (c) =>
        !c.isStarterCard &&
        c.isCollectible !== false &&
        (unlockedCardIds ? unlockedCardIds.includes(c.id) : true)
    ),
    3,
    rng,
    lootLuck
  );
  for (let i = 0; i < lootable.length; i++) {
    const card = lootable[i]!;
    const price = applyDifficultyShopPrice(
      getCardPrice(card.rarity, floor),
      selectedDifficultyLevel
    );
    items.push({
      id: nanoid(),
      type: "card",
      cardDef: card,
      price,
    });
  }

  // 1 relic (if any available)
  const availableRelics = ALL_SHOP_RELICS.filter(
    (r) =>
      !ownedRelicIds.includes(r.id) &&
      getShopRelicRarity(r.id) !== "BOSS" &&
      isRelicUnlockedForDifficulty(r.id, unlockedDifficultyLevelSnapshot)
  );
  if (availableRelics.length > 0) {
    const relic = weightedSampleByRarity(
      availableRelics.map((relic) => ({
        ...relic,
        rarity: getShopRelicRarity(relic.id),
      })),
      1,
      rng,
      lootLuck
    )[0];
    if (relic) {
      items.push({
        id: nanoid(),
        type: "relic",
        relicId: relic.id,
        relicName: relic.name,
        relicDescription: relic.description,
        price: applyDifficultyShopPrice(
          applyRelicDiscount(scaleShopPrice(relic.price)),
          selectedDifficultyLevel
        ),
      });
    }
  }

  // 1 heal option
  items.push({
    id: nanoid(),
    type: "heal",
    healAmount: 25,
    price: applyDifficultyShopPrice(
      scaleShopPrice(40 + floor * 6),
      selectedDifficultyLevel
    ),
  });

  // 1 max HP potion (always available)
  items.push({
    id: nanoid(),
    type: "max_hp",
    maxHpAmount: 10,
    price: applyDifficultyShopPrice(
      scaleShopPrice(95 + floor * 12),
      selectedDifficultyLevel
    ),
  });

  // 1 purge option (permanently remove a card from deck)
  items.push({
    id: nanoid(),
    type: "purge",
    price: applyDifficultyShopPrice(
      scaleShopPrice(95 + floor * 12),
      selectedDifficultyLevel
    ),
  });

  const hasUsableSlot = (usableItems?.length ?? 0) < usableItemCapacity;
  if (hasUsableSlot && usableItemDefinitions.length > 0) {
    const itemDef = rng.pick(usableItemDefinitions);
    items.push({
      id: nanoid(),
      type: "usable_item",
      usableItemDef: itemDef,
      price: applyDifficultyShopPrice(
        scaleShopPrice(45 + floor * 6),
        selectedDifficultyLevel
      ),
    });
  }

  return items;
}

function getCardPrice(rarity: string, floor: number): number {
  const base =
    {
      COMMON: 40,
      UNCOMMON: 65,
      RARE: 100,
    }[rarity] ?? 40;

  return scaleShopPrice(base + floor * 6);
}

export function buyShopItem(
  runState: RunState,
  item: ShopItem
): RunState | null {
  if (runState.gold < item.price) return null;

  let state = {
    ...runState,
    gold: runState.gold - item.price,
  };

  switch (item.type) {
    case "card": {
      if (!item.cardDef) return null;
      state = {
        ...state,
        deck: [
          ...state.deck,
          {
            instanceId: nanoid(),
            definitionId: item.cardDef.id,
            upgraded: false,
          },
        ],
      };
      break;
    }
    case "relic": {
      if (!item.relicId) return null;
      state = {
        ...state,
        relicIds: [...state.relicIds, item.relicId],
      };
      break;
    }
    case "heal": {
      const heal = item.healAmount ?? 25;
      state = {
        ...state,
        playerCurrentHp: Math.min(
          state.playerMaxHp,
          state.playerCurrentHp + heal
        ),
      };
      break;
    }
    case "max_hp": {
      const bonus = item.maxHpAmount ?? 10;
      state = {
        ...state,
        playerMaxHp: state.playerMaxHp + bonus,
        playerCurrentHp: state.playerCurrentHp + bonus,
      };
      break;
    }
    case "purge": {
      // Gold is deducted above. Card removal is handled by the UI
      // (opens CardPickerModal, then dispatches REMOVE_CARD_FROM_DECK).
      break;
    }
    case "usable_item": {
      if (!item.usableItemDef) return null;
      const capacity =
        state.usableItemCapacity ?? GAME_CONSTANTS.MAX_USABLE_ITEMS;
      if ((state.usableItems?.length ?? 0) >= capacity) return null;
      state = {
        ...state,
        usableItemCapacity: capacity,
        usableItems: [
          ...(state.usableItems ?? []),
          createUsableItemInstance(item.usableItemDef.id),
        ],
      };
      break;
    }
  }

  return state;
}

export function getRemainingStartMerchantResources(
  runState: RunState
): Record<string, number> {
  const pool = sanitizeResourcePool(runState.startMerchantResourcePool ?? {});
  const spent = sanitizeResourcePool(
    runState.startMerchantSpentResources ?? {}
  );
  const remaining: Record<string, number> = {};
  for (const key of BIOME_RESOURCE_KEYS) {
    const available = pool[key] ?? 0;
    const spentAmount = spent[key] ?? 0;
    remaining[key] = Math.max(0, available - spentAmount);
  }
  return remaining;
}

function canPayStartMerchantOffer(
  runState: RunState,
  offer: StartMerchantOffer
): boolean {
  const remaining = getRemainingStartMerchantResources(runState);
  return Object.entries(offer.cost).every(
    ([resource, cost]) => (remaining[resource] ?? 0) >= (cost ?? 0)
  );
}

function markSpentResources(
  runState: RunState,
  cost: Partial<Record<BiomeResource, number>>
): Record<string, number> {
  const spent = { ...(runState.startMerchantSpentResources ?? {}) };
  for (const [resource, amount] of Object.entries(cost)) {
    if ((amount ?? 0) <= 0) continue;
    spent[resource] = (spent[resource] ?? 0) + (amount ?? 0);
  }
  return spent;
}

export function applyStartMerchantOffer(
  runState: RunState,
  offer: StartMerchantOffer
): RunState {
  if (runState.startMerchantCompleted) return runState;
  const purchased = new Set(runState.startMerchantPurchasedOfferIds ?? []);
  if (purchased.has(offer.id)) return runState;
  if (!canPayStartMerchantOffer(runState, offer)) return runState;

  let next = runState;
  const spent = markSpentResources(runState, offer.cost);

  switch (offer.type) {
    case "CARD": {
      if (!offer.cardId) return runState;
      next = {
        ...next,
        deck: [
          ...next.deck,
          {
            instanceId: nanoid(),
            definitionId: offer.cardId,
            upgraded: false,
          },
        ],
      };
      break;
    }
    case "RELIC": {
      if (!offer.relicId || next.relicIds.includes(offer.relicId))
        return runState;
      next = {
        ...next,
        relicIds: [...next.relicIds, offer.relicId],
      };
      break;
    }
    case "USABLE_ITEM": {
      if (!offer.usableItemId) return runState;
      const capacity =
        next.usableItemCapacity ?? GAME_CONSTANTS.MAX_USABLE_ITEMS;
      if ((next.usableItems?.length ?? 0) >= capacity) return runState;
      next = {
        ...next,
        usableItemCapacity: capacity,
        usableItems: [
          ...(next.usableItems ?? []),
          createUsableItemInstance(offer.usableItemId),
        ],
      };
      break;
    }
    case "ALLY": {
      if (!offer.allyId || next.allyIds.includes(offer.allyId)) return runState;
      const maxAllies = Math.min(
        GAME_CONSTANTS.MAX_ALLIES,
        Math.max(0, next.metaBonuses?.allySlots ?? 0)
      );
      if (next.allyIds.length >= maxAllies) return runState;
      next = {
        ...next,
        allyIds: [...next.allyIds, offer.allyId],
      };
      break;
    }
    case "BONUS_GOLD": {
      const amount = offer.goldAmount ?? 0;
      next = {
        ...next,
        gold: next.gold + Math.max(0, amount),
      };
      break;
    }
    case "BONUS_MAX_HP": {
      const amount = offer.maxHpAmount ?? 0;
      const bonus = Math.max(0, amount);
      next = {
        ...next,
        playerMaxHp: next.playerMaxHp + bonus,
        playerCurrentHp: next.playerCurrentHp + bonus,
      };
      break;
    }
  }

  return {
    ...next,
    startMerchantSpentResources: spent,
    startMerchantPurchasedOfferIds: [
      ...(next.startMerchantPurchasedOfferIds ?? []),
      offer.id,
    ],
  };
}

export function completeStartMerchant(runState: RunState): RunState {
  return {
    ...runState,
    startMerchantCompleted: true,
  };
}

function buildSingleResourceCost(
  rng: RNG,
  resourcePool: Record<string, number>,
  minCost: number,
  maxCost: number
): Partial<Record<BiomeResource, number>> | null {
  const candidates = Object.entries(resourcePool)
    .filter(([, amount]) => amount > 0)
    .map(([resource]) => resource as BiomeResource);
  if (candidates.length === 0) return null;

  const resource = rng.pick(candidates);
  const available = resourcePool[resource] ?? 0;
  const target = rng.nextInt(minCost, maxCost);
  const amount = Math.max(1, Math.min(available, target));
  return { [resource]: amount };
}

export function generateStartMerchantOffers(
  runState: RunState,
  allCards: CardDefinition[],
  allAllies: AllyDefinition[],
  rng: RNG
): StartMerchantOffer[] {
  if (runState.startMerchantCompleted) return [];
  const resourcePool = sanitizeResourcePool(
    runState.startMerchantResourcePool ?? {}
  );
  const hasAnyResource = Object.values(resourcePool).some((value) => value > 0);
  if (!hasAnyResource) return [];

  const offers: StartMerchantOffer[] = [];
  const selectedDifficulty = runState.selectedDifficultyLevel ?? 0;
  const unlockedCardIds = new Set(runState.unlockedCardIds ?? []);
  const lootLuck = getTotalLootLuck(
    runState.relicIds,
    runState.metaBonuses?.lootLuck ?? 0
  );

  const cardPool = weightedSampleByRarity(
    filterCardsByDifficulty(
      allCards,
      runState.unlockedDifficultyLevelSnapshot ?? 0
    ).filter(
      (card) =>
        !card.isStarterCard &&
        card.isCollectible !== false &&
        (unlockedCardIds.size === 0 || unlockedCardIds.has(card.id))
    ),
    8,
    rng,
    lootLuck
  );
  for (let i = 0; i < 2 && i < cardPool.length; i++) {
    const cost = buildSingleResourceCost(rng, resourcePool, 4, 7);
    if (!cost) break;
    offers.push({
      id: `start-card-${cardPool[i]!.id}`,
      type: "CARD",
      name: cardPool[i]!.name,
      description: cardPool[i]!.description,
      cardId: cardPool[i]!.id,
      cost,
    });
  }

  const relicPool = ALL_SHOP_RELICS.filter(
    (r) =>
      !runState.relicIds.includes(r.id) &&
      getShopRelicRarity(r.id) !== "BOSS" &&
      isRelicUnlockedForDifficulty(r.id, selectedDifficulty)
  );
  if (relicPool.length > 0) {
    const relic = weightedSampleByRarity(
      relicPool.map((relic) => ({
        ...relic,
        rarity: getShopRelicRarity(relic.id),
      })),
      1,
      rng,
      lootLuck
    )[0];
    if (relic) {
      const cost = buildSingleResourceCost(rng, resourcePool, 8, 14);
      if (cost) {
        offers.push({
          id: `start-relic-${relic.id}`,
          type: "RELIC",
          name: relic.name,
          description: relic.description,
          relicId: relic.id,
          cost,
        });
      }
    }
  }

  const capacity =
    runState.usableItemCapacity ?? GAME_CONSTANTS.MAX_USABLE_ITEMS;
  if (
    (runState.usableItems?.length ?? 0) < capacity &&
    usableItemDefinitions.length
  ) {
    const usable = rng.pick(usableItemDefinitions);
    const cost = buildSingleResourceCost(rng, resourcePool, 5, 9);
    if (cost) {
      offers.push({
        id: `start-usable-${usable.id}`,
        type: "USABLE_ITEM",
        name: usable.name,
        description: usable.description,
        usableItemId: usable.id,
        cost,
      });
    }
  }

  const maxAllies = Math.min(
    GAME_CONSTANTS.MAX_ALLIES,
    Math.max(0, runState.metaBonuses?.allySlots ?? 0)
  );
  if (runState.allyIds.length < maxAllies) {
    const allyPool = allAllies.filter(
      (ally) => !runState.allyIds.includes(ally.id)
    );
    if (allyPool.length > 0) {
      const ally = rng.pick(allyPool);
      const cost = buildSingleResourceCost(rng, resourcePool, 9, 15);
      if (cost) {
        offers.push({
          id: `start-ally-${ally.id}`,
          type: "ALLY",
          name: ally.name,
          description: `${ally.maxHp} HP - ${ally.speed} SPD`,
          allyId: ally.id,
          cost,
        });
      }
    }
  }

  const goldCost = buildSingleResourceCost(rng, resourcePool, 4, 8);
  if (goldCost) {
    offers.push({
      id: "start-bonus-gold",
      type: "BONUS_GOLD",
      name: "Bourse d'eclaireur",
      description: "+45 or pour ce run",
      goldAmount: 45,
      cost: goldCost,
    });
  }

  const hpCost = buildSingleResourceCost(rng, resourcePool, 4, 8);
  if (hpCost) {
    offers.push({
      id: "start-bonus-hp",
      type: "BONUS_MAX_HP",
      name: "Benediction de cuir",
      description: "+12 PV max pour ce run",
      maxHpAmount: 12,
      cost: hpCost,
    });
  }

  return offers.slice(0, 7);
}

const ALL_SHOP_RELICS = [
  {
    id: "ancient_quill",
    name: "Ancient Quill",
    description: "+2 ink max",
    price: 80,
  },
  {
    id: "energy_crystal",
    name: "Energy Crystal",
    description: "+1 energy per turn",
    price: 120,
  },
  {
    id: "bookmark",
    name: "Bookmark",
    description: "Draw 1 extra card per turn",
    price: 100,
  },
  {
    id: "ink_stamp",
    name: "Ink Stamp",
    description: "Start combat with 3 ink",
    price: 70,
  },
  {
    id: "iron_binding",
    name: "Iron Binding",
    description: "+1 ink gained when ink-per-card triggers",
    price: 150,
  },
  {
    id: "blighted_compass",
    name: "Blighted Compass",
    description: "+1 draw per turn, but start combat with Weak.",
    price: 90,
  },
  {
    id: "cursed_diacrit",
    name: "Cursed Diacrit",
    description: "+1 energy per turn, but gain a curse each combat.",
    price: 100,
  },
  {
    id: "runic_bulwark",
    name: "Runic Bulwark",
    description: "Retain 50% of your remaining Block each turn.",
    price: 140,
  },
  {
    id: "eternal_hourglass",
    name: "Eternal Hourglass",
    description: "Unspent energy is conserved between turns.",
    price: 160,
  },
  {
    id: "briar_codex",
    name: "Briar Codex",
    description: "Start each combat with 2 Thorns.",
    price: 115,
  },
  {
    id: "warded_ribbon",
    name: "Warded Ribbon",
    description: "Start each combat with 6 Block.",
    price: 80,
  },
  {
    id: "inkwell_reservoir",
    name: "Inkwell Reservoir",
    description: "+1 max ink and start each combat with 1 ink.",
    price: 90,
  },
  {
    id: "battle_lexicon",
    name: "Battle Lexicon",
    description: "Start each combat with +1 Strength.",
    price: 120,
  },
  {
    id: "omens_compass",
    name: "Omen's Compass",
    description:
      "Boss rewards are more likely to include an additional Boss relic option.",
    price: 170,
  },
  {
    id: "lucky_charm",
    name: "Lucky Charm",
    description: "Increases loot luck for better rarity rolls.",
    price: 130,
  },
  {
    id: "haggler_satchel",
    name: "Haggler's Satchel",
    description: "First purchase in each shop refreshes the full stock.",
    price: 145,
  },
  {
    id: "surgeons_quill",
    name: "Surgeon's Quill",
    description: "You can Purge up to 3 times per merchant visit.",
    price: 155,
  },
];

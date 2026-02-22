import type { RunState } from "../schemas/run-state";
import type { CardDefinition } from "../schemas/cards";
import type { RNG } from "./rng";
import { nanoid } from "nanoid";
import {
  filterCardsByDifficulty,
  isRelicUnlockedForDifficulty,
} from "./difficulty";

export interface ShopItem {
  id: string;
  type: "card" | "relic" | "heal" | "max_hp" | "purge";
  cardDef?: CardDefinition;
  relicId?: string;
  relicName?: string;
  relicDescription?: string;
  healAmount?: number;
  maxHpAmount?: number;
  price: number;
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
  unlockedDifficultyLevelSnapshot = 0
): ShopItem[] {
  const items: ShopItem[] = [];

  // 3 random non-starter cards
  const lootable = rng.shuffle(
    filterCardsByDifficulty(allCards, unlockedDifficultyLevelSnapshot).filter(
      (c) =>
        !c.isStarterCard &&
        c.isCollectible !== false &&
        (unlockedCardIds ? unlockedCardIds.includes(c.id) : true)
    )
  );
  for (let i = 0; i < 3 && i < lootable.length; i++) {
    const card = lootable[i]!;
    const price = getCardPrice(card.rarity, floor);
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
      isRelicUnlockedForDifficulty(r.id, unlockedDifficultyLevelSnapshot)
  );
  if (availableRelics.length > 0) {
    const relic = rng.pick(availableRelics);
    items.push({
      id: nanoid(),
      type: "relic",
      relicId: relic.id,
      relicName: relic.name,
      relicDescription: relic.description,
      price: relic.price,
    });
  }

  // 1 heal option
  items.push({
    id: nanoid(),
    type: "heal",
    healAmount: 25,
    price: 30 + floor * 5,
  });

  // 1 max HP potion (always available)
  items.push({
    id: nanoid(),
    type: "max_hp",
    maxHpAmount: 10,
    price: 75 + floor * 10,
  });

  // 1 purge option (permanently remove a card from deck)
  items.push({
    id: nanoid(),
    type: "purge",
    price: 75 + floor * 10,
  });

  return items;
}

function getCardPrice(rarity: string, floor: number): number {
  const base =
    {
      COMMON: 30,
      UNCOMMON: 50,
      RARE: 80,
    }[rarity] ?? 40;

  return base + floor * 5;
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
  }

  return state;
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
];

import type { RunState } from "../schemas/run-state";
import type { CardDefinition } from "../schemas/cards";
import type { RNG } from "./rng";
import { nanoid } from "nanoid";

export interface ShopItem {
  id: string;
  type: "card" | "relic" | "heal";
  cardDef?: CardDefinition;
  relicId?: string;
  relicName?: string;
  relicDescription?: string;
  healAmount?: number;
  price: number;
}

/**
 * Generate shop inventory for a merchant room.
 */
export function generateShopInventory(
  floor: number,
  allCards: CardDefinition[],
  ownedRelicIds: string[],
  rng: RNG
): ShopItem[] {
  const items: ShopItem[] = [];

  // 3 random non-starter cards
  const lootable = rng.shuffle(allCards.filter((c) => !c.isStarterCard));
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
    (r) => !ownedRelicIds.includes(r.id)
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
    description: "+1 ink per card played",
    price: 150,
  },
];

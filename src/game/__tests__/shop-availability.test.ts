// @vitest-environment node
import { describe, expect, it } from "vitest";
import { buildCardDefsMap } from "@/game/data";
import { getCharacterById } from "@/game/data/characters";
import { createNewRun } from "@/game/engine/run";
import { createRNG } from "@/game/engine/rng";
import {
  buyShopItem,
  getShopUnavailableReason,
  type ShopItem,
} from "@/game/engine/merchant";
import { usableItemDefinitions } from "@/game/engine/items";

const cards = buildCardDefsMap();
function run() {
  const state = createNewRun(
    "shop-contract",
    "shop-contract",
    getCharacterById("scribe").starterDeckIds.map((id) => cards.get(id)!),
    createRNG("shop-contract")
  );
  return { ...state, gold: 100, playerCurrentHp: 20, playerMaxHp: 68 };
}
describe("shop availability contracts", () => {
  it.each([
    ["gold", { gold: 0 }, { type: "heal", price: 25 }],
    [
      "hp",
      { playerCurrentHp: 10 },
      { type: "blood_purge", price: 0, hpCost: 10 },
    ],
    ["fullHealth", { playerCurrentHp: 68 }, { type: "heal", price: 25 }],
    ["deck", { deck: [] }, { type: "purge", price: 25 }],
    ["allies", {}, { type: "ally", allyId: "ink_familiar", price: 25 }],
    [
      "owned",
      { relicIds: ["test-relic"] },
      { type: "relic", relicId: "test-relic", price: 25 },
    ],
    [
      "inventory",
      { usableItemCapacity: 0 },
      {
        type: "usable_item",
        usableItemDef: usableItemDefinitions[0],
        price: 25,
      },
    ],
    ["invalid", {}, { type: "heal", price: -25 }],
  ] as const)("rejects %s without taking payment", (reason, patch, offer) => {
    const state = { ...run(), ...patch } as ReturnType<typeof run>;
    const item = { id: "offer", ...offer } as ShopItem;
    const before = structuredClone(state);
    expect(
      getShopUnavailableReason(
        { ...state, allySlots: state.metaBonuses?.allySlots ?? 0 },
        item
      )
    ).toBe(reason);
    expect(buyShopItem(state, item)).toBeNull();
    expect(state).toEqual(before);
  });
  it("buys the final ally slot once and preserves the original state", () => {
    const base = run();
    const state = {
      ...base,
      metaBonuses: { ...base.metaBonuses!, allySlots: 1 },
    };
    const offer: ShopItem = {
      id: "ally",
      type: "ally",
      allyId: "ink_familiar",
      price: 25,
    };
    const next = buyShopItem(state, offer)!;
    expect(next.gold).toBe(75);
    expect(next.allyIds).toEqual(["ink_familiar"]);
    expect(state.allyIds).toEqual([]);
    expect(
      buyShopItem(next, { ...offer, allyId: "scribe_apprentice" })
    ).toBeNull();
  });
});

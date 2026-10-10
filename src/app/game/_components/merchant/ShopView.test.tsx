import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { buildCardDefsMap } from "@/game/data";
import { createRNG } from "@/game/engine/rng";
import type { ShopItem } from "@/game/engine/merchant";
import {
  generateShopInventory,
  getMerchantAutoRestockCharges,
  getShopRerollPrice,
} from "@/game/engine/merchant";
import { ShopView } from "./ShopView";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("../shared/CardPickerModal", () => ({
  CardPickerModal: ({
    cards,
    onPick,
  }: {
    cards: Array<{ instanceId: string; definitionId: string }>;
    onPick: (cardInstanceId: string) => void;
  }) => (
    <div data-testid="card-picker-modal">
      {cards.map((card) => (
        <button
          key={card.instanceId}
          type="button"
          onClick={() => onPick(card.instanceId)}
        >
          {card.definitionId}
        </button>
      ))}
    </div>
  ),
}));

vi.mock("@/game/engine/merchant", async () => {
  const actual = await vi.importActual<typeof import("@/game/engine/merchant")>(
    "@/game/engine/merchant"
  );
  return {
    ...actual,
    generateShopInventory: vi.fn(),
    getMerchantAutoRestockCharges: vi.fn(),
    getShopRerollPrice: vi.fn(),
  };
});

const cardDefs = buildCardDefsMap();
const strike = cardDefs.get("strike");
const defend = cardDefs.get("defend");

function buildInventory(cardItem: ShopItem): ShopItem[] {
  return [
    cardItem,
    {
      id: "purge-gold-1",
      type: "purge",
      price: 50,
    },
  ];
}

describe("ShopView", () => {
  it("restores a paid purge without charging again or regenerating inventory", () => {
    const onBuy = vi.fn(), onRemoveCard = vi.fn(), onCheckpointChange = vi.fn();
    render(<ShopView floor={1} gold={40} playerCurrentHp={60} relicIds={[]}
      unlockedCardIds={[]} unlockedRelicIds={[]} unlockedDifficultyLevelSnapshot={0}
      selectedDifficultyLevel={0} relicDiscount={0} characterId="scribe" cardDefs={cardDefs}
      rng={createRNG("resume-shop")} deck={[{instanceId:"strike-1",definitionId:"strike",upgraded:false},{instanceId:"defend-1",definitionId:"defend",upgraded:false}]}
      usableItems={[]} usableItemCapacity={3} rerollCount={1} allyIds={[]} allySlots={0}
      onBuy={onBuy} onReroll={vi.fn()} onRemoveCard={onRemoveCard} onLeave={vi.fn()}
      onCheckpointChange={onCheckpointChange}
      initialCheckpoint={{inventory:buildInventory({id:"card-a",type:"card",cardDef:strike!,price:20}),soldIds:["card-a"],autoRestockChargesLeft:0,pendingPurgeItemId:"purge-gold-1"}}
    />);
    expect(generateShopInventory).not.toHaveBeenCalled();
    expect(screen.getByTestId("card-picker-modal")).toBeInTheDocument();
    fireEvent.click(screen.getByText("strike"));
    expect(onRemoveCard).toHaveBeenCalledWith("strike-1");
    expect(onRemoveCard).toHaveBeenCalledTimes(1);
    expect(onBuy).not.toHaveBeenCalled();
    expect(onCheckpointChange).toHaveBeenLastCalledWith(expect.objectContaining({soldIds:["card-a","purge-gold-1"],pendingPurgeItemId:null,autoRestockChargesLeft:0}));
  });
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMerchantAutoRestockCharges).mockReturnValue(0);
    vi.mocked(getShopRerollPrice).mockReturnValue(10);
  });

  it("keeps purge offers sold after using the reroll button", () => {
    if (!strike || !defend) {
      throw new Error("Missing starter card definitions for ShopView test");
    }

    vi.mocked(generateShopInventory)
      .mockReturnValueOnce(
        buildInventory({
          id: "card-a",
          type: "card",
          cardDef: strike,
          price: 20,
        })
      )
      .mockReturnValueOnce(
        buildInventory({
          id: "card-b",
          type: "card",
          cardDef: defend,
          price: 20,
        })
      );

    const onBuy = vi.fn();
    const onReroll = vi.fn();
    const onRemoveCard = vi.fn();

    render(
      <ShopView
        floor={1}
        gold={999}
        playerCurrentHp={60}
        relicIds={[]}
        unlockedCardIds={[]}
        unlockedRelicIds={[]}
        unlockedDifficultyLevelSnapshot={0}
        selectedDifficultyLevel={0}
        relicDiscount={0}
        characterId="scribe"
        cardDefs={cardDefs}
        rng={createRNG("shop-view-purge")}
        deck={[
          { instanceId: "strike-1", definitionId: "strike", upgraded: false },
          { instanceId: "defend-1", definitionId: "defend", upgraded: false },
        ]}
        usableItems={[]}
        usableItemCapacity={3}
        rerollCount={0}
        allyIds={[]}
        allySlots={0}
        onBuy={onBuy}
        onReroll={onReroll}
        onRemoveCard={onRemoveCard}
        onLeave={vi.fn()}
      />
    );

    const purgeButton = screen
      .getAllByText("shop.itemName.purge")
      .map((element) => element.closest("button"))
      .find((button) => button !== null);
    expect(purgeButton).not.toBeNull();
    fireEvent.click(purgeButton!);

    expect(onBuy).toHaveBeenCalledWith(
      expect.objectContaining({ id: "purge-gold-1", type: "purge" })
    );

    fireEvent.click(screen.getByText("strike"));

    expect(onRemoveCard).toHaveBeenCalledWith("strike-1");
    expect(screen.getByText("shop.sold")).toBeInTheDocument();

    fireEvent.click(screen.getByText("shop.reroll"));

    expect(onReroll).toHaveBeenCalledTimes(1);
    expect(screen.getByText("shop.sold")).toBeInTheDocument();
  });
});

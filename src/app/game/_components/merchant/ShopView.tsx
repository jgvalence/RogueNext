"use client";

import { useState, useMemo } from "react";
import type { ShopItem } from "@/game/engine/merchant";
import {
  generateShopInventory,
  getMerchantAutoRestockCharges,
  getMerchantPurgeUsesPerVisit,
  getShopRerollPrice,
} from "@/game/engine/merchant";
import type { CardDefinition, CardInstance } from "@/game/schemas/cards";
import type { UsableItemInstance } from "@/game/schemas/items";
import type { RNG } from "@/game/engine/rng";
import { cn } from "@/lib/utils/cn";
import { CardPickerModal } from "../shared/CardPickerModal";

interface ShopViewProps {
  floor: number;
  gold: number;
  relicIds: string[];
  unlockedCardIds: string[];
  unlockedDifficultyLevelSnapshot: number;
  selectedDifficultyLevel: number;
  relicDiscount: number;
  cardDefs: Map<string, CardDefinition>;
  rng: RNG;
  deck: CardInstance[];
  usableItems: UsableItemInstance[];
  usableItemCapacity: number;
  rerollCount: number;
  onBuy: (item: ShopItem) => void;
  onReroll: () => void;
  onRemoveCard: (cardInstanceId: string) => void;
  onLeave: () => void;
}

const typeColors: Record<string, string> = {
  ATTACK: "border-red-500 bg-red-950/50",
  SKILL: "border-blue-500 bg-blue-950/50",
  POWER: "border-purple-500 bg-purple-950/50",
};

const rarityColors: Record<string, string> = {
  COMMON: "text-white",
  UNCOMMON: "text-blue-400",
  RARE: "text-yellow-400",
};

export function ShopView({
  floor,
  gold,
  relicIds,
  unlockedCardIds,
  unlockedDifficultyLevelSnapshot,
  selectedDifficultyLevel,
  relicDiscount,
  cardDefs,
  rng,
  deck,
  usableItems,
  usableItemCapacity,
  rerollCount,
  onBuy,
  onReroll,
  onRemoveCard,
  onLeave,
}: ShopViewProps) {
  const [soldIds, setSoldIds] = useState<Set<string>>(new Set());
  const [autoRestockChargesLeft, setAutoRestockChargesLeft] = useState(
    getMerchantAutoRestockCharges(relicIds)
  );
  const purgeUsesPerVisit = getMerchantPurgeUsesPerVisit(relicIds);
  const [purgeUses, setPurgeUses] = useState(0);
  const [pendingPurgeItemId, setPendingPurgeItemId] = useState<string | null>(
    null
  );

  const inventorySeed = useMemo(
    () =>
      generateShopInventory(
        floor,
        [...cardDefs.values()],
        relicIds,
        rng,
        unlockedCardIds,
        unlockedDifficultyLevelSnapshot,
        selectedDifficultyLevel,
        relicDiscount,
        usableItems,
        usableItemCapacity
      ),
    [
      floor,
      cardDefs,
      relicIds,
      rng,
      unlockedCardIds,
      unlockedDifficultyLevelSnapshot,
      selectedDifficultyLevel,
      relicDiscount,
      usableItems,
      usableItemCapacity,
    ]
  );
  const [inventory, setInventory] = useState<ShopItem[]>(inventorySeed);
  const rerollPrice = getShopRerollPrice(
    floor,
    rerollCount,
    selectedDifficultyLevel
  );
  const canReroll = gold >= rerollPrice;

  const handleBuy = (item: ShopItem) => {
    if (gold < item.price || soldIds.has(item.id)) return;
    if (item.type === "purge" && purgeUses >= purgeUsesPerVisit) return;
    onBuy(item);
    if (item.type === "purge") {
      // Gold deducted by onBuy; now open picker so player selects a card to remove
      setPendingPurgeItemId(item.id);
    } else {
      if (autoRestockChargesLeft > 0) {
        setInventory(
          generateShopInventory(
            floor,
            [...cardDefs.values()],
            relicIds,
            rng,
            unlockedCardIds,
            unlockedDifficultyLevelSnapshot,
            selectedDifficultyLevel,
            relicDiscount,
            usableItems,
            usableItemCapacity
          )
        );
        setSoldIds(new Set());
        setAutoRestockChargesLeft((prev) => Math.max(0, prev - 1));
      } else {
        setSoldIds((prev) => new Set(prev).add(item.id));
      }
    }
  };

  const handlePurgePick = (cardInstanceId: string) => {
    onRemoveCard(cardInstanceId);
    setPurgeUses((prev) => prev + 1);
    if (pendingPurgeItemId) {
      if (purgeUses + 1 >= purgeUsesPerVisit) {
        setSoldIds((prev) => new Set(prev).add(pendingPurgeItemId));
      }
    }
    setPendingPurgeItemId(null);
  };

  const handleReroll = () => {
    if (!canReroll) return;
    onReroll();
    setInventory(
      generateShopInventory(
        floor,
        [...cardDefs.values()],
        relicIds,
        rng,
        unlockedCardIds,
        unlockedDifficultyLevelSnapshot,
        selectedDifficultyLevel,
        relicDiscount,
        usableItems,
        usableItemCapacity
      )
    );
    setSoldIds(new Set());
  };

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <h2 className="text-2xl font-bold text-yellow-400">Merchant</h2>
      <p className="text-sm text-gray-400">
        Gold: <span className="font-bold text-yellow-300">{gold}</span>
      </p>

      <div className="flex flex-wrap justify-center gap-4">
        {inventory.map((item) => {
          const isSold = soldIds.has(item.id);
          const canAfford = gold >= item.price;
          const isPurge = item.type === "purge";
          const purgeSoldOut = isPurge && purgeUses >= purgeUsesPerVisit;
          const isMaxHp = item.type === "max_hp";
          const isUsableItem = item.type === "usable_item";
          const isUsableInventoryFull =
            usableItems.length >= usableItemCapacity;
          const canBuyItem = isUsableItem
            ? canAfford && !isUsableInventoryFull
            : canAfford;

          return (
            <button
              key={item.id}
              disabled={isSold || purgeSoldOut || !canBuyItem}
              onClick={() => handleBuy(item)}
              className={cn(
                "flex w-44 flex-col items-center gap-2 rounded-lg border-2 p-4 transition",
                isSold
                  ? "border-gray-700 bg-gray-900/30 opacity-40"
                  : purgeSoldOut
                    ? "border-gray-700 bg-gray-900/30 opacity-40"
                    : canBuyItem
                      ? "cursor-pointer hover:scale-105 hover:shadow-lg hover:shadow-yellow-500/10"
                      : "cursor-not-allowed opacity-60",
                item.type === "card" &&
                  item.cardDef &&
                  (typeColors[item.cardDef.type] ??
                    "border-gray-500 bg-gray-800"),
                item.type === "relic" && "border-amber-500 bg-amber-950/50",
                item.type === "heal" && "border-green-500 bg-green-950/50",
                isMaxHp && "border-red-500 bg-red-950/50",
                isPurge && "border-rose-600 bg-rose-950/50",
                isUsableItem && "border-orange-500 bg-orange-950/50"
              )}
            >
              <span className="text-2xl">
                {item.type === "card"
                  ? "C"
                  : item.type === "relic"
                    ? "R"
                    : item.type === "heal"
                      ? "H"
                      : item.type === "max_hp"
                        ? "M"
                        : item.type === "purge"
                          ? "P"
                          : "U"}
              </span>

              <span
                className={cn(
                  "text-sm font-bold",
                  item.type === "card" && item.cardDef
                    ? (rarityColors[item.cardDef.rarity] ?? "text-white")
                    : item.type === "relic"
                      ? "text-amber-300"
                      : item.type === "heal"
                        ? "text-green-300"
                        : item.type === "max_hp"
                          ? "text-red-300"
                          : item.type === "purge"
                            ? "text-rose-300"
                            : "text-orange-300"
                )}
              >
                {item.type === "card" && item.cardDef
                  ? item.cardDef.name
                  : item.type === "relic"
                    ? item.relicName
                    : item.type === "heal"
                      ? "Heal"
                      : item.type === "max_hp"
                        ? "Max HP"
                        : item.type === "purge"
                          ? "Purge"
                          : item.usableItemDef?.name}
              </span>

              <span className="text-center text-xs text-gray-400">
                {item.type === "card" && item.cardDef
                  ? item.cardDef.description
                  : item.type === "relic"
                    ? item.relicDescription
                    : item.type === "heal"
                      ? `Restore ${item.healAmount} HP`
                      : item.type === "max_hp"
                        ? `+${item.maxHpAmount ?? 10} Max HP`
                        : item.type === "purge"
                          ? "Remove 1 card from your deck permanently."
                          : item.usableItemDef?.description}
              </span>

              {item.type === "card" && item.cardDef && (
                <span className="rounded bg-gray-700 px-1.5 py-0.5 text-[10px] text-gray-300">
                  {item.cardDef.type} - {item.cardDef.energyCost} energy
                </span>
              )}

              <span
                className={cn(
                  "mt-auto text-sm font-bold",
                  canBuyItem && !isSold ? "text-yellow-300" : "text-gray-500"
                )}
              >
                {isSold
                  ? "SOLD"
                  : purgeSoldOut
                    ? "SOLD OUT"
                    : isUsableItem && isUsableInventoryFull
                      ? "Inventory full"
                      : `${item.price} gold`}
              </span>
              {isPurge && (
                <span className="text-[10px] text-rose-300/80">
                  Purges left: {Math.max(0, purgeUsesPerVisit - purgeUses)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <button
        className={cn(
          "rounded-lg border px-5 py-2 text-sm font-semibold transition",
          canReroll
            ? "border-amber-500 bg-amber-950/40 text-amber-300 hover:bg-amber-900/60"
            : "cursor-not-allowed border-slate-700 bg-slate-900 text-slate-500"
        )}
        disabled={!canReroll}
        onClick={handleReroll}
      >
        Reroll Shop ({rerollPrice} gold)
      </button>
      {autoRestockChargesLeft > 0 && (
        <p className="text-xs text-amber-300">
          Haggler&apos;s Satchel: auto-restock {autoRestockChargesLeft} charge
          left.
        </p>
      )}

      <button
        className="mt-4 rounded-lg bg-gray-700 px-8 py-2.5 font-medium text-white transition hover:bg-gray-600"
        onClick={onLeave}
      >
        Leave Shop
      </button>

      {pendingPurgeItemId && (
        <CardPickerModal
          title="Purge - Choisissez une carte a retirer"
          subtitle="Cette carte sera definitivement supprimee de votre deck."
          cards={deck}
          cardDefs={cardDefs}
          onPick={handlePurgePick}
        />
      )}
    </div>
  );
}

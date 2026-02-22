"use client";

import { useState, useMemo } from "react";
import type { ShopItem } from "@/game/engine/merchant";
import { generateShopInventory } from "@/game/engine/merchant";
import type { CardDefinition, CardInstance } from "@/game/schemas/cards";
import type { RNG } from "@/game/engine/rng";
import { cn } from "@/lib/utils/cn";
import { CardPickerModal } from "../shared/CardPickerModal";

interface ShopViewProps {
  floor: number;
  gold: number;
  relicIds: string[];
  unlockedCardIds: string[];
  cardDefs: Map<string, CardDefinition>;
  rng: RNG;
  deck: CardInstance[];
  onBuy: (item: ShopItem) => void;
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
  cardDefs,
  rng,
  deck,
  onBuy,
  onRemoveCard,
  onLeave,
}: ShopViewProps) {
  const [soldIds, setSoldIds] = useState<Set<string>>(new Set());
  const [pendingPurgeItemId, setPendingPurgeItemId] = useState<string | null>(
    null
  );

  const inventory = useMemo(
    () =>
      generateShopInventory(
        floor,
        [...cardDefs.values()],
        relicIds,
        rng,
        unlockedCardIds
      ),
    [floor, cardDefs, relicIds, rng, unlockedCardIds]
  );

  const handleBuy = (item: ShopItem) => {
    if (gold < item.price || soldIds.has(item.id)) return;
    onBuy(item);
    if (item.type === "purge") {
      // Gold deducted by onBuy; now open picker so player selects a card to remove
      setPendingPurgeItemId(item.id);
    } else {
      setSoldIds((prev) => new Set(prev).add(item.id));
    }
  };

  const handlePurgePick = (cardInstanceId: string) => {
    onRemoveCard(cardInstanceId);
    if (pendingPurgeItemId) {
      setSoldIds((prev) => new Set(prev).add(pendingPurgeItemId));
    }
    setPendingPurgeItemId(null);
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
          const isMaxHp = item.type === "max_hp";

          return (
            <button
              key={item.id}
              disabled={isSold || !canAfford}
              onClick={() => handleBuy(item)}
              className={cn(
                "flex w-44 flex-col items-center gap-2 rounded-lg border-2 p-4 transition",
                isSold
                  ? "border-gray-700 bg-gray-900/30 opacity-40"
                  : canAfford
                    ? "cursor-pointer hover:scale-105 hover:shadow-lg hover:shadow-yellow-500/10"
                    : "cursor-not-allowed opacity-60",
                item.type === "card" &&
                  item.cardDef &&
                  (typeColors[item.cardDef.type] ??
                    "border-gray-500 bg-gray-800"),
                item.type === "relic" && "border-amber-500 bg-amber-950/50",
                item.type === "heal" && "border-green-500 bg-green-950/50",
                isMaxHp && "border-red-500 bg-red-950/50",
                isPurge && "border-rose-600 bg-rose-950/50"
              )}
            >
              {/* Icon */}
              <span className="text-2xl">
                {item.type === "card"
                  ? "📜"
                  : item.type === "relic"
                    ? "💎"
                    : item.type === "heal"
                      ? "❤️"
                      : item.type === "max_hp"
                        ? "💗"
                        : "✂"}
              </span>

              {/* Name */}
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
                          : "text-rose-300"
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
                        : "Purge"}
              </span>

              {/* Description */}
              <span className="text-center text-xs text-gray-400">
                {item.type === "card" && item.cardDef
                  ? item.cardDef.description
                  : item.type === "relic"
                    ? item.relicDescription
                    : item.type === "heal"
                      ? `Restore ${item.healAmount} HP`
                      : item.type === "max_hp"
                        ? `+${item.maxHpAmount ?? 10} Max HP`
                        : "Remove 1 card from your deck permanently."}
              </span>

              {/* Card type badge */}
              {item.type === "card" && item.cardDef && (
                <span className="rounded bg-gray-700 px-1.5 py-0.5 text-[10px] text-gray-300">
                  {item.cardDef.type} · {item.cardDef.energyCost} energy
                </span>
              )}

              {/* Price */}
              <span
                className={cn(
                  "mt-auto text-sm font-bold",
                  canAfford && !isSold ? "text-yellow-300" : "text-gray-500"
                )}
              >
                {isSold ? "SOLD" : `${item.price} gold`}
              </span>
            </button>
          );
        })}
      </div>

      <button
        className="mt-4 rounded-lg bg-gray-700 px-8 py-2.5 font-medium text-white transition hover:bg-gray-600"
        onClick={onLeave}
      >
        Leave Shop
      </button>

      {pendingPurgeItemId && (
        <CardPickerModal
          title="Purge — Choisissez une carte à retirer"
          subtitle="Cette carte sera définitivement supprimée de votre deck."
          cards={deck}
          cardDefs={cardDefs}
          onPick={handlePurgePick}
        />
      )}
    </div>
  );
}

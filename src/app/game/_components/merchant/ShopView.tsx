"use client";

import { useState, useMemo } from "react";
import { RogueButton } from "@/components/ui/rogue";
import type { ShopItem } from "@/game/engine/merchant";
import {
  generateShopInventory,
  getMerchantAutoRestockCharges,
  getShopRerollPrice,
} from "@/game/engine/merchant";
import type { CardDefinition, CardInstance } from "@/game/schemas/cards";
import type { UsableItemInstance } from "@/game/schemas/items";
import type { RNG } from "@/game/engine/rng";
import { cn } from "@/lib/utils/cn";
import {
  localizeAllyAbilityName,
  localizeAllyName,
  localizeRelicDescription,
  localizeRelicName,
  localizeUsableItemDescription,
  localizeUsableItemName,
} from "@/lib/i18n/entity-text";
import { CardPickerModal } from "../shared/CardPickerModal";
import { GameCard } from "../combat/GameCard";
import { useTranslation } from "react-i18next";
import { allyDefinitions } from "@/game/data/allies";

interface ShopViewProps {
  floor: number;
  gold: number;
  playerCurrentHp: number;
  relicIds: string[];
  unlockedCardIds: string[];
  unlockedRelicIds: string[];
  unlockedDifficultyLevelSnapshot: number;
  selectedDifficultyLevel: number;
  relicDiscount: number;
  characterId: string;
  cardDefs: Map<string, CardDefinition>;
  rng: RNG;
  deck: CardInstance[];
  usableItems: UsableItemInstance[];
  usableItemCapacity: number;
  rerollCount: number;
  allyIds: string[];
  allySlots: number;
  onBuy: (item: ShopItem) => void;
  onReroll: () => void;
  onRemoveCard: (cardInstanceId: string) => void;
  onLeave: () => void;
}

function isPurgeItem(item: ShopItem): boolean {
  return item.type === "purge" || item.type === "blood_purge";
}

function getPersistentSoldIds(
  inventory: ShopItem[],
  soldIds: Set<string>
): Set<string> {
  return new Set(
    inventory
      .filter((item) => isPurgeItem(item) && soldIds.has(item.id))
      .map((item) => item.id)
  );
}

export function ShopView({
  floor,
  gold,
  playerCurrentHp,
  relicIds,
  unlockedCardIds,
  unlockedRelicIds,
  unlockedDifficultyLevelSnapshot,
  selectedDifficultyLevel,
  relicDiscount,
  characterId,
  cardDefs,
  rng,
  deck,
  usableItems,
  usableItemCapacity,
  rerollCount,
  allyIds,
  allySlots,
  onBuy,
  onReroll,
  onRemoveCard,
  onLeave,
}: ShopViewProps) {
  const { t } = useTranslation();
  const [soldIds, setSoldIds] = useState<Set<string>>(new Set());
  const [autoRestockChargesLeft, setAutoRestockChargesLeft] = useState(
    getMerchantAutoRestockCharges(relicIds)
  );
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
        usableItemCapacity,
        unlockedRelicIds,
        allyIds,
        allySlots,
        characterId
      ),
    [
      floor,
      cardDefs,
      relicIds,
      rng,
      unlockedCardIds,
      unlockedRelicIds,
      unlockedDifficultyLevelSnapshot,
      selectedDifficultyLevel,
      relicDiscount,
      characterId,
      usableItems,
      usableItemCapacity,
      allyIds,
      allySlots,
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
    const isPurge = isPurgeItem(item);
    if (isPurge && deck.length <= 1) return;
    if (gold < item.price || soldIds.has(item.id)) return;
    onBuy(item);
    if (isPurge) {
      // Gold deducted by onBuy; now open picker so player selects a card to remove
      setPendingPurgeItemId(item.id);
    } else {
      if (autoRestockChargesLeft > 0) {
        const nextInventory = generateShopInventory(
          floor,
          [...cardDefs.values()],
          relicIds,
          rng,
          unlockedCardIds,
          unlockedDifficultyLevelSnapshot,
          selectedDifficultyLevel,
          relicDiscount,
          usableItems,
          usableItemCapacity,
          unlockedRelicIds,
          allyIds,
          allySlots,
          characterId
        );
        setInventory(nextInventory);
        setSoldIds((prev) => getPersistentSoldIds(inventory, prev));
        setAutoRestockChargesLeft((prev) => Math.max(0, prev - 1));
      } else {
        setSoldIds((prev) => new Set(prev).add(item.id));
      }
    }
  };

  const handlePurgePick = (cardInstanceId: string) => {
    onRemoveCard(cardInstanceId);
    if (pendingPurgeItemId) {
      setSoldIds((prev) => new Set(prev).add(pendingPurgeItemId));
    }
    setPendingPurgeItemId(null);
  };

  const handleReroll = () => {
    if (!canReroll) return;
    onReroll();
    const nextInventory = generateShopInventory(
      floor,
      [...cardDefs.values()],
      relicIds,
      rng,
      unlockedCardIds,
      unlockedDifficultyLevelSnapshot,
      selectedDifficultyLevel,
      relicDiscount,
      usableItems,
      usableItemCapacity,
      unlockedRelicIds,
      allyIds,
      allySlots,
      characterId
    );
    setInventory(nextInventory);
    setSoldIds((prev) => getPersistentSoldIds(inventory, prev));
  };

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <h2 className="text-2xl font-bold text-yellow-400">{t("shop.title")}</h2>
      <p className="text-sm text-gray-400">
        {t("shop.gold")}:{" "}
        <span className="font-bold text-yellow-300">{gold}</span>
      </p>

      <div className="flex flex-wrap justify-center gap-4">
        {inventory.map((item) => {
          const isSold = soldIds.has(item.id);
          const canAfford = gold >= item.price;
          const isPurge = item.type === "purge" || item.type === "blood_purge";
          const isMaxHp = item.type === "max_hp";
          const isUsableItem = item.type === "usable_item";
          const isAlly = item.type === "ally";
          const canAffordBloodPurge =
            item.type !== "blood_purge" ||
            playerCurrentHp > Math.max(0, item.hpCost ?? 0);
          const allyDef = isAlly
            ? (allyDefinitions.find((a) => a.id === item.allyId) ?? null)
            : null;
          const localizedAllyName =
            isAlly && allyDef
              ? localizeAllyName(allyDef.id, item.allyName ?? allyDef.name)
              : isAlly
                ? localizeAllyName(item.allyId, item.allyName)
                : null;
          const localizedAllySummary =
            isAlly && allyDef
              ? `${allyDef.maxHp} ${t("combat.hp")} - ${allyDef.speed} ${t(
                  "combat.spd"
                )}`
              : (item.allyDescription ?? "");
          const isUsableInventoryFull =
            usableItems.length >= usableItemCapacity;
          const canPurgeDeck = deck.length > 1;
          const canBuyItem = isUsableItem
            ? canAfford && !isUsableInventoryFull
            : isPurge
              ? canAfford && canAffordBloodPurge && canPurgeDeck
              : canAfford && canAffordBloodPurge;

          // ── Card items: use GameCard with price badge ─────────────────────
          if (item.type === "card" && item.cardDef) {
            return (
              <div key={item.id} className="flex flex-col items-center gap-1.5">
                <GameCard
                  definition={item.cardDef}
                  canPlay={!isSold && canBuyItem}
                  size="sm"
                  onClick={
                    !isSold && canBuyItem ? () => handleBuy(item) : undefined
                  }
                />
                <span
                  className={cn(
                    "text-xs font-bold tabular-nums",
                    isSold
                      ? "text-gray-600"
                      : canBuyItem
                        ? "text-yellow-300"
                        : "text-gray-500"
                  )}
                >
                  {isSold
                    ? t("shop.sold")
                    : t("shop.priceGold", { price: item.price })}
                </span>
              </div>
            );
          }

          // ── Non-card items: card-like tile with art zone ──────────────────
          const tileAccent =
            item.type === "relic"
              ? {
                  border: "border-amber-500/50",
                  artGrad: "from-amber-900/70 via-amber-950/50 to-slate-950",
                  label: "text-amber-300",
                  iconColor: "text-amber-400/50",
                  icon: "✦",
                  typeKey: t("shop.itemName.relic", { defaultValue: "Relic" }),
                }
              : item.type === "heal"
                ? {
                    border: "border-emerald-500/50",
                    artGrad:
                      "from-emerald-900/70 via-emerald-950/50 to-slate-950",
                    label: "text-emerald-300",
                    iconColor: "text-emerald-400/50",
                    icon: "♥",
                    typeKey: t("shop.itemName.heal"),
                  }
                : isMaxHp
                  ? {
                      border: "border-red-500/50",
                      artGrad: "from-red-900/70 via-red-950/50 to-slate-950",
                      label: "text-red-300",
                      iconColor: "text-red-400/50",
                      icon: "▲",
                      typeKey: t("shop.itemName.maxHp"),
                    }
                  : item.type === "purge"
                    ? {
                        border: "border-rose-500/50",
                        artGrad:
                          "from-rose-900/70 via-rose-950/50 to-slate-950",
                        label: "text-rose-300",
                        iconColor: "text-rose-400/50",
                        icon: "✕",
                        typeKey: t("shop.itemName.purge"),
                      }
                    : item.type === "blood_purge"
                      ? {
                          border: "border-fuchsia-500/50",
                          artGrad:
                            "from-fuchsia-900/70 via-fuchsia-950/50 to-slate-950",
                          label: "text-fuchsia-300",
                          iconColor: "text-fuchsia-400/50",
                          icon: "✕",
                          typeKey: t("shop.itemName.bloodPurge"),
                        }
                      : isAlly
                        ? {
                            border: "border-teal-500/50",
                            artGrad:
                              "from-teal-900/70 via-teal-950/50 to-slate-950",
                            label: "text-teal-300",
                            iconColor: "text-teal-400/50",
                            icon: "⚔",
                            typeKey: t("shop.itemName.ally"),
                          }
                        : {
                            border: "border-orange-500/50",
                            artGrad:
                              "from-orange-900/70 via-orange-950/50 to-slate-950",
                            label: "text-orange-300",
                            iconColor: "text-orange-400/50",
                            icon: "◈",
                            typeKey: t("shop.itemName.item", {
                              defaultValue: "Item",
                            }),
                          };

          const tileName =
            item.type === "relic"
              ? localizeRelicName(item.relicId, item.relicName)
              : item.type === "heal"
                ? t("shop.itemName.heal")
                : isMaxHp
                  ? t("shop.itemName.maxHp")
                  : item.type === "purge"
                    ? t("shop.itemName.purge")
                    : item.type === "blood_purge"
                      ? t("shop.itemName.bloodPurge")
                      : isAlly
                        ? (localizedAllyName ?? t("shop.itemName.ally"))
                        : localizeUsableItemName(
                            item.usableItemDef?.id,
                            item.usableItemDef?.name
                          );

          const tileDesc =
            item.type === "relic"
              ? localizeRelicDescription(item.relicId, item.relicDescription)
              : item.type === "heal"
                ? t("shop.itemDescription.heal", { amount: item.healAmount })
                : isMaxHp
                  ? t("shop.itemDescription.maxHp", {
                      amount: item.maxHpAmount ?? 10,
                    })
                  : item.type === "purge"
                    ? t("shop.itemDescription.purge")
                    : item.type === "blood_purge"
                      ? t("shop.itemDescription.bloodPurge", {
                          amount: item.hpCost ?? 0,
                        })
                      : isAlly
                        ? localizedAllySummary
                        : localizeUsableItemDescription(
                            item.usableItemDef?.id,
                            item.usableItemDef?.description
                          );

          const tilePrice = isSold
            ? t("shop.sold")
            : isUsableItem && isUsableInventoryFull
              ? t("shop.inventoryFull")
              : item.type === "blood_purge"
                ? t("shop.priceHp", { price: item.hpCost ?? 0 })
                : t("shop.priceGold", { price: item.price });

          return (
            <button
              key={item.id}
              type="button"
              disabled={isSold || !canBuyItem}
              onClick={
                !isSold && canBuyItem ? () => handleBuy(item) : undefined
              }
              className={cn(
                "group relative flex w-36 flex-col overflow-hidden rounded-xl border bg-slate-950 text-left shadow-md transition-all duration-200",
                tileAccent.border,
                isSold
                  ? "opacity-35 grayscale"
                  : canBuyItem
                    ? "cursor-pointer hover:scale-[1.03] hover:shadow-xl hover:brightness-110"
                    : "cursor-not-allowed opacity-50"
              )}
            >
              {/* Art zone */}
              <div
                className={cn(
                  "relative flex h-[72px] shrink-0 items-center justify-center overflow-hidden bg-gradient-to-b",
                  tileAccent.artGrad
                )}
              >
                <span
                  className={cn(
                    "text-[52px] leading-none",
                    tileAccent.iconColor
                  )}
                >
                  {tileAccent.icon}
                </span>
                <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-slate-950 to-transparent" />
                <div className="absolute left-2 top-2">
                  <span
                    className={cn(
                      "text-[8px] font-black uppercase tracking-widest",
                      tileAccent.label
                    )}
                  >
                    {tileAccent.typeKey}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col gap-1 px-2.5 pb-2 pt-2">
                <p className="text-[11px] font-black leading-tight text-white [overflow-wrap:anywhere]">
                  {tileName}
                </p>
                <p className="text-[10px] leading-relaxed text-slate-400 [overflow-wrap:anywhere]">
                  {tileDesc}
                </p>
                {isAlly && allyDef && (
                  <div className="mt-1 space-y-1">
                    {allyDef.abilities.map((ability, i) => (
                      <div
                        key={i}
                        className="rounded border border-teal-800/60 bg-teal-900/20 px-1.5 py-0.5"
                      >
                        <span className="truncate text-[9px] font-semibold text-teal-100">
                          {localizeAllyAbilityName(allyDef.id, ability.name)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Price footer */}
              <div className="border-white/8 flex items-center justify-between gap-1 border-t bg-black/25 px-2.5 py-1.5">
                <span
                  className={cn(
                    "text-[11px] font-black tabular-nums",
                    isSold
                      ? "text-gray-600"
                      : canBuyItem
                        ? "text-yellow-300"
                        : "text-gray-500"
                  )}
                >
                  {tilePrice}
                </span>
                {item.type === "blood_purge" && !canAffordBloodPurge && (
                  <span className="text-[8px] text-fuchsia-300/70">
                    {t("shop.requiresMoreHp")}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <RogueButton
        className={cn(
          "!h-auto !rounded-lg !border !px-5 !py-2 !text-sm !font-semibold transition",
          canReroll
            ? "!border-amber-500 !bg-amber-950/40 !text-amber-300 hover:!bg-amber-900/60"
            : "!cursor-not-allowed !border-slate-700 !bg-slate-900 !text-slate-500"
        )}
        disabled={!canReroll}
        onClick={handleReroll}
      >
        {t("shop.reroll", { price: rerollPrice })}
      </RogueButton>
      {autoRestockChargesLeft > 0 && (
        <p className="text-xs text-amber-300">
          {t("shop.autoRestock", { count: autoRestockChargesLeft })}
        </p>
      )}

      <RogueButton
        className="!mt-4 !h-auto !rounded-lg !bg-gray-700 !px-8 !py-2.5 !font-medium !text-white transition hover:!bg-gray-600"
        onClick={onLeave}
      >
        {t("shop.leave")}
      </RogueButton>

      {pendingPurgeItemId && (
        <CardPickerModal
          title={t("shop.purgePickerTitle")}
          subtitle={t("shop.purgePickerSubtitle")}
          cards={deck}
          cardDefs={cardDefs}
          onPick={handlePurgePick}
        />
      )}
    </div>
  );
}

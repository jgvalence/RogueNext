"use client";

import { useState, useMemo, useEffect } from "react";
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
import { playSound } from "@/lib/sound";
import { RoomArtwork } from "../shared/RoomArtwork";

import type { MerchantVisit } from "@/game/schemas/merchant-checkpoint";

interface ShopViewProps {
  initialCheckpoint?: MerchantVisit;
  onCheckpointChange?: (snapshot: MerchantVisit) => void;
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
  initialCheckpoint,
  onCheckpointChange,
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
  const [soldIds, setSoldIds] = useState<Set<string>>(new Set(initialCheckpoint?.soldIds ?? []));
  const [autoRestockChargesLeft, setAutoRestockChargesLeft] = useState(
    initialCheckpoint?.autoRestockChargesLeft ?? getMerchantAutoRestockCharges(relicIds)
  );
  const [pendingPurgeItemId, setPendingPurgeItemId] = useState<string | null>(
    initialCheckpoint?.pendingPurgeItemId ?? null
  );
  const [merchantLineKey, setMerchantLineKey] = useState("welcome");
  const [recentlyPurchasedId, setRecentlyPurchasedId] = useState<string | null>(
    null
  );

  const inventorySeed = useMemo(
    () =>
      initialCheckpoint?.inventory ?? generateShopInventory(
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
      initialCheckpoint,
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
  useEffect(() => {
    onCheckpointChange?.({inventory, soldIds: [...soldIds], autoRestockChargesLeft, pendingPurgeItemId});
  }, [inventory, soldIds, autoRestockChargesLeft, pendingPurgeItemId, onCheckpointChange]);
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
    setMerchantLineKey("purchase");
    setRecentlyPurchasedId(item.id);
    playSound("SHOP_BUY", 0.65);
    window.setTimeout(() => setRecentlyPurchasedId(null), 650);
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
    setMerchantLineKey("reroll");
    playSound("SHOP_REROLL", 0.55);
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
    <div className="merchant-room relative min-h-full overflow-hidden bg-[radial-gradient(ellipse_at_20%_18%,rgba(180,83,9,0.2),transparent_38%),linear-gradient(180deg,#090b10,#120b08_72%,#050608)] px-4 py-6 sm:px-6 sm:py-10">
      <RoomArtwork scene="merchant" background className="pointer-events-none absolute inset-0 opacity-35" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/20 via-slate-950/50 to-slate-950/95" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(251,191,36,0.28)_1px,transparent_1px),linear-gradient(90deg,rgba(251,191,36,0.28)_1px,transparent_1px)] [background-size:52px_52px]" />
      <div className="relative mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[17rem_1fr] lg:items-start">
        <aside className="relative overflow-hidden rounded-[2rem] border border-amber-400/20 bg-gradient-to-b from-amber-950/45 to-slate-950/90 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.4)]">
          <p className="text-[0.6rem] font-bold uppercase tracking-[0.35em] text-amber-300/55">
            {t("shop.kicker")}
          </p>
          <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.08em] text-amber-100">
            {t("shop.title")}
          </h2>
          <RoomArtwork scene="merchant" className="merchant-painted-portrait mx-auto mt-5 block h-64 w-full overflow-hidden rounded-xl border border-amber-300/25" />
          <div className="relative mt-2 rounded-2xl border border-amber-300/15 bg-black/30 px-4 py-3">
            <span className="absolute -top-3 left-5 text-3xl text-amber-300/30">
              “
            </span>
            <p className="text-sm italic leading-relaxed text-amber-50/70">
              {t(`shop.merchantLines.${merchantLineKey}`)}
            </p>
          </div>
        </aside>

        <section className="bg-slate-950/72 relative rounded-[2rem] border border-amber-300/15 px-4 pb-6 pt-5 shadow-[0_28px_80px_rgba(0,0,0,0.42)] backdrop-blur-sm sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-300/10 pb-4">
            <div>
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.3em] text-amber-300/45">
                {t("shop.stall")}
              </p>
              <p className="mt-1 text-sm text-slate-400">{t("shop.hint")}</p>
            </div>
            <div className="rounded-full border border-amber-300/25 bg-amber-500/10 px-4 py-2 text-sm text-amber-100">
              {t("shop.gold")}:{" "}
              <span className="font-black tabular-nums text-yellow-300">
                {gold}
              </span>
            </div>
          </div>

          <div className="relative mt-5 flex min-h-64 flex-wrap items-stretch justify-center gap-4 rounded-2xl border border-amber-950/70 bg-[linear-gradient(180deg,rgba(69,26,3,0.15),rgba(15,8,5,0.72))] px-4 pb-10 pt-5 shadow-[inset_0_-18px_35px_rgba(0,0,0,0.35)]">
            {inventory.map((item) => {
              const isSold = soldIds.has(item.id);
              const canAfford = gold >= item.price;
              const isPurge =
                item.type === "purge" || item.type === "blood_purge";
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
                  <div
                    key={item.id}
                    className={cn(
                      "flex flex-col items-center gap-1.5 transition-all duration-300",
                      recentlyPurchasedId === item.id &&
                        "scale-105 drop-shadow-[0_0_20px_rgba(251,191,36,0.55)]"
                    )}
                  >
                    <GameCard
                      definition={item.cardDef}
                      canPlay
                      size="lg"
                      scrollable
                      className="!cursor-default"
                    />
                    <RogueButton
                      disabled={isSold || !canBuyItem}
                      onClick={() => handleBuy(item)}
                      className={cn(
                        "!min-h-11 !w-full !border-amber-300/35 !bg-amber-950/60 !text-sm !font-bold !text-amber-100 disabled:!text-slate-400",
                        isSold
                          ? "text-gray-600"
                          : canBuyItem
                            ? "text-yellow-300"
                            : "text-gray-500"
                      )}
                    >
                      {isSold
                        ? t("shop.sold")
                        : `${t("visual.buy")} · ${t("shop.priceGold", { price: item.price })}`}
                    </RogueButton>
                  </div>
                );
              }

              // ── Non-card items: card-like tile with art zone ──────────────────
              const tileAccent =
                item.type === "relic"
                  ? {
                      border: "border-amber-500/50",
                      artGrad:
                        "from-amber-900/70 via-amber-950/50 to-slate-950",
                      label: "text-amber-300",
                      iconColor: "text-amber-400/50",
                      icon: "✦",
                      typeKey: t("shop.itemName.relic", {
                        defaultValue: "Relic",
                      }),
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
                          artGrad:
                            "from-red-900/70 via-red-950/50 to-slate-950",
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
                  ? localizeRelicDescription(
                      item.relicId,
                      item.relicDescription
                    )
                  : item.type === "heal"
                    ? t("shop.itemDescription.heal", {
                        amount: item.healAmount,
                      })
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
                    recentlyPurchasedId === item.id &&
                      "scale-105 shadow-[0_0_28px_rgba(251,191,36,0.42)]",
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
                    <ShopItemIcon
                      type={item.type}
                      className={cn("h-12 w-12", tileAccent.iconColor)}
                    />
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
                              {localizeAllyAbilityName(
                                allyDef.id,
                                ability.name
                              )}
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
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-7 rounded-b-2xl border-t border-amber-700/20 bg-gradient-to-b from-amber-950/75 to-black/70" />
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <RogueButton
                className={cn(
                  "!h-auto !rounded-full !border !px-5 !py-2 !text-sm !font-semibold transition",
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
                <p className="mt-2 text-xs text-amber-300">
                  {t("shop.autoRestock", { count: autoRestockChargesLeft })}
                </p>
              )}
            </div>

            <RogueButton
              className="!h-auto !rounded-full !border !border-slate-600 !bg-slate-900/70 !px-7 !py-2.5 !font-medium !text-slate-200 transition hover:!border-slate-400 hover:!text-white"
              onClick={() => {
                setMerchantLineKey("leave");
                onLeave();
              }}
            >
              {t("shop.leave")}
            </RogueButton>
          </div>
        </section>
      </div>

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

function ShopItemIcon({
  type,
  className,
}: {
  type: ShopItem["type"];
  className?: string;
}) {
  if (type === "heal" || type === "max_hp") {
    return (
      <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
        <path
          d="M14 8h20v7l-4 5v17c0 3-2 5-5 5h-2c-3 0-5-2-5-5V20l-4-5V8Z"
          fill="currentColor"
          opacity=".35"
        />
        <path d="M18 28h12M24 22v12" stroke="currentColor" strokeWidth="3" />
      </svg>
    );
  }
  if (type === "purge" || type === "blood_purge") {
    return (
      <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
        <path d="M10 9h28v32H10z" fill="currentColor" opacity=".2" />
        <path
          d="m16 17 16 16M32 17 16 33"
          stroke="currentColor"
          strokeWidth="3"
        />
      </svg>
    );
  }
  if (type === "relic") {
    return (
      <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
        <path
          d="m24 4 6 13 14 7-14 7-6 13-6-13-14-7 14-7 6-13Z"
          fill="currentColor"
          opacity=".55"
        />
        <circle cx="24" cy="24" r="5" fill="currentColor" />
      </svg>
    );
  }
  if (type === "ally") {
    return (
      <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
        <circle cx="24" cy="15" r="8" fill="currentColor" opacity=".45" />
        <path
          d="M9 42c1-11 6-17 15-17s14 6 15 17"
          fill="currentColor"
          opacity=".35"
        />
        <path d="M34 8v24M29 13h10" stroke="currentColor" strokeWidth="2.5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path d="M12 10h24v28H12z" fill="currentColor" opacity=".25" />
      <path
        d="m16 31 8-16 8 16M18 27h12"
        stroke="currentColor"
        strokeWidth="2.5"
      />
    </svg>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Cinzel } from "next/font/google";
import type { CardDefinition } from "@/game/schemas/cards";
import type { CardInstance } from "@/game/schemas/cards";
import { createRNG, type RNG } from "@/game/engine/rng";
import type { RunState } from "@/game/schemas/run-state";
import {
  createGuaranteedRelicEvent,
  getHealRoomBloodPurgeHpCost,
  pickSpecialRoomTypeWithDifficulty,
  pickEvent,
  pickGuaranteedEventRelicId,
  isEventChoiceAvailable,
  type GameEvent,
} from "@/game/engine/run";
import { buildArchetypeEventCardChoices } from "@/game/engine/archetype-offers";
import { relicDefinitions, type RelicDefinitionData } from "@/game/data/relics";
import { weightedSampleByRarity } from "@/game/engine/loot";
import { GAME_CONSTANTS } from "@/game/constants";
import { cn } from "@/lib/utils/cn";
import { CardActionModal } from "../shared/CardActionModal";
import {
  UpgradePreviewPortal,
  type UpgradePreviewHoverInfo,
} from "../shared/UpgradePreviewPortal";
import { CardPickerModal } from "../shared/CardPickerModal";
import { useTranslation } from "react-i18next";
import {
  localizeRelicDescription,
  localizeRelicName,
} from "@/lib/i18n/entity-text";
import { RogueButton, RogueEmpty, RogueModal } from "@/components/ui/rogue";
import { GameCard } from "../combat/GameCard";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "600", "700"] });

interface SpecialRoomViewProps {
  playerCurrentHp: number;
  playerMaxHp: number;
  gold: number;
  deck: CardInstance[];
  cardDefs: Map<string, CardDefinition>;
  rng: RNG;
  difficultyLevel: number;
  forceEventWithRelic?: boolean;
  forcedRoomType?: "HEAL" | "UPGRADE" | "EVENT";
  runState?: RunState;
  onHeal: () => void;
  onUpgrade: (cardInstanceId: string) => void;
  onHealRoomBloodPurge: (cardInstanceId: string) => void;
  onPurgeCard: (cardInstanceId: string) => void;
  onEventChoice: (event: GameEvent, choiceIndex: number) => void;
  onPickCardReward: (definitionId: string) => void;
  onEventContinue: () => void;
  onEventRelicPick?: (relicId: string) => void;
  onRelicExchange: (giveRelicId: string, takeRelicId: string) => void;
  onSkip: () => void;
}

export function SpecialRoomView({
  playerCurrentHp,
  playerMaxHp,
  gold,
  deck,
  cardDefs,
  rng,
  difficultyLevel,
  forceEventWithRelic = false,
  forcedRoomType,
  runState,
  onHeal,
  onUpgrade,
  onHealRoomBloodPurge,
  onPurgeCard,
  onEventChoice,
  onPickCardReward,
  onEventContinue,
  onEventRelicPick,
  onRelicExchange,
  onSkip,
}: SpecialRoomViewProps) {
  const roomType = useMemo(() => {
    if (forceEventWithRelic) return "EVENT" as const;
    if (forcedRoomType) return forcedRoomType;
    return pickSpecialRoomTypeWithDifficulty(rng, difficultyLevel);
  }, [difficultyLevel, forceEventWithRelic, forcedRoomType, rng]);
  const forcedEvent = useMemo(
    () => (forceEventWithRelic ? createGuaranteedRelicEvent() : null),
    [forceEventWithRelic]
  );

  switch (roomType) {
    case "HEAL":
      return (
        <HealRoom
          playerCurrentHp={playerCurrentHp}
          playerMaxHp={playerMaxHp}
          deck={deck}
          cardDefs={cardDefs}
          onHeal={onHeal}
          onBloodPurge={onHealRoomBloodPurge}
        />
      );
    case "UPGRADE":
      return (
        <UpgradeRoom
          deck={deck}
          cardDefs={cardDefs}
          onUpgrade={onUpgrade}
          onSkip={onSkip}
        />
      );
    case "EVENT":
      return (
        <EventRoom
          rng={rng}
          difficultyLevel={difficultyLevel}
          forcedEvent={forcedEvent}
          runState={runState}
          gold={gold}
          playerCurrentHp={playerCurrentHp}
          playerMaxHp={playerMaxHp}
          deck={deck}
          cardDefs={cardDefs}
          onEventChoice={onEventChoice}
          onPickCardReward={onPickCardReward}
          onEventRelicPick={onEventRelicPick}
          onPurgeCard={onPurgeCard}
          onEventContinue={onEventContinue}
        />
      );
    case "RELIC_BAZAAR":
      return (
        <RelicBazaarRoom
          rng={rng}
          runState={runState}
          onExchange={onRelicExchange}
          onLeave={onSkip}
        />
      );
  }
}

// ── Shared decorative elements ────────────────────────────────────────────────

function Divider({ dim = false }: { dim?: boolean }) {
  return (
    <div
      className={cn(
        "h-px w-full max-w-md bg-gradient-to-r from-transparent to-transparent",
        dim ? "via-amber-500/20" : "via-amber-500/40"
      )}
    />
  );
}

function RoomLabel({ label }: { label: string }) {
  return (
    <p
      className={cn(
        cinzel.className,
        "max-w-[min(100%,22rem)] text-center text-[0.55rem] font-semibold uppercase leading-relaxed tracking-[0.35em] text-amber-400/50 [overflow-wrap:anywhere] sm:tracking-[0.55em]"
      )}
    >
      {label}
    </p>
  );
}

function RoomTitle({
  children,
  color = "amber",
}: {
  children: React.ReactNode;
  color?: "amber" | "green" | "blue";
}) {
  const colorClass = {
    amber: "text-amber-100",
    green: "text-amber-100",
    blue: "text-amber-100",
  }[color];
  return (
    <h2
      className={cn(
        cinzel.className,
        "max-w-[min(100%,24rem)] text-center text-2xl font-bold uppercase leading-snug tracking-[0.08em] [overflow-wrap:anywhere] sm:tracking-[0.1em]",
        colorClass
      )}
    >
      {children}
    </h2>
  );
}

// ── HealRoom ──────────────────────────────────────────────────────────────────

function HealRoom({
  playerCurrentHp,
  playerMaxHp,
  deck,
  cardDefs,
  onHeal,
  onBloodPurge,
}: {
  playerCurrentHp: number;
  playerMaxHp: number;
  deck: CardInstance[];
  cardDefs: Map<string, CardDefinition>;
  onHeal: () => void;
  onBloodPurge: (cardInstanceId: string) => void;
}) {
  const { t } = useTranslation();
  const healAmount = Math.floor(playerMaxHp * GAME_CONSTANTS.HEAL_ROOM_PERCENT);
  const newHp = Math.min(playerMaxHp, playerCurrentHp + healAmount);
  const bloodPurgeHpCost = getHealRoomBloodPurgeHpCost({ playerMaxHp });
  const hpAfterBloodPurge = playerCurrentHp - bloodPurgeHpCost;
  const [showBloodPurgePicker, setShowBloodPurgePicker] = useState(false);
  const hasPurgeableCard = deck.length > 1;
  const canBloodPurge = hasPurgeableCard && playerCurrentHp > bloodPurgeHpCost;

  return (
    <div className="flex flex-col items-center gap-5 px-4 py-10">
      <Divider />
      <RoomLabel label={t("special.healTitle")} />

      <RoomTitle>{t("special.healTitle")}</RoomTitle>

      <div className="h-px w-10 bg-gradient-to-r from-amber-500/60 to-transparent" />

      <p className="max-w-md text-center text-sm italic leading-relaxed text-amber-200/60">
        {t("special.healDesc")}
      </p>
      <p className="max-w-md text-center text-xs leading-relaxed text-amber-100/45">
        {t("special.healChoiceHint")}
      </p>

      {/* HP preview */}
      <div className="flex items-center gap-3 rounded border border-amber-500/20 bg-amber-950/20 px-6 py-3 text-sm">
        <span className="text-amber-100/50">{playerCurrentHp}</span>
        <span className="text-amber-400/40">→</span>
        <span className="font-semibold text-amber-300">{newHp}</span>
        <span className="text-amber-100/30">/ {playerMaxHp}</span>
      </div>

      <div className="flex items-center gap-3 rounded border border-rose-500/20 bg-rose-950/20 px-6 py-3 text-sm">
        <span className="text-rose-100/55">{playerCurrentHp}</span>
        <span className="text-rose-400/40">→</span>
        <span
          className={cn(
            "font-semibold",
            canBloodPurge ? "text-rose-300" : "text-rose-200/35"
          )}
        >
          {canBloodPurge ? hpAfterBloodPurge : "X"}
        </span>
        <span className="text-rose-100/30">/ {playerMaxHp}</span>
        <span className="text-rose-200/55">
          {t("shop.priceHp", { price: bloodPurgeHpCost })}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-4">
        <RogueButton
          onClick={onHeal}
          type="text"
          className={cn(
            cinzel.className,
            "!group !flex !h-auto !items-center !gap-3 !py-[0.42rem] !uppercase",
            "!text-[1.1rem] !font-semibold !tracking-[0.16em] !text-amber-100",
            "!outline-none !transition-all !duration-150"
          )}
        >
          <span className="inline-block h-[1.5px] w-8 shrink-0 rounded-full bg-gradient-to-r from-amber-400 to-amber-300/0 opacity-90" />
          {t("special.healAction")}
        </RogueButton>

        <RogueButton
          onClick={() => setShowBloodPurgePicker(true)}
          disabled={!canBloodPurge}
          type="text"
          className={cn(
            cinzel.className,
            "!group !flex !h-auto !items-center !gap-3 !py-[0.42rem] !uppercase",
            "!text-[1.05rem] !font-semibold !tracking-[0.16em] !outline-none !transition-all !duration-150",
            canBloodPurge
              ? "!text-rose-200"
              : "!cursor-not-allowed !text-rose-100/25"
          )}
        >
          <span className="inline-block h-[1.5px] w-8 shrink-0 rounded-full bg-gradient-to-r from-rose-400 to-rose-300/0 opacity-90" />
          {t("shop.itemName.bloodPurge")}
        </RogueButton>
      </div>

      {hasPurgeableCard && !canBloodPurge && (
        <p className="text-xs text-rose-300/75">{t("shop.requiresMoreHp")}</p>
      )}

      <Divider dim />
      {showBloodPurgePicker && (
        <CardPickerModal
          title={t("special.purgePickerTitle")}
          subtitle={t("shop.itemDescription.bloodPurge", {
            amount: bloodPurgeHpCost,
          })}
          cards={deck}
          cardDefs={cardDefs}
          onPick={(cardInstanceId) => {
            setShowBloodPurgePicker(false);
            onBloodPurge(cardInstanceId);
          }}
          onCancel={() => setShowBloodPurgePicker(false)}
        />
      )}
    </div>
  );
}

// ── UpgradeRoom ───────────────────────────────────────────────────────────────

function UpgradeRoom({
  deck,
  cardDefs,
  onUpgrade,
  onSkip,
}: {
  deck: CardInstance[];
  cardDefs: Map<string, CardDefinition>;
  onUpgrade: (cardInstanceId: string) => void;
  onSkip: () => void;
}) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const [hoverInfo, setHoverInfo] = useState<UpgradePreviewHoverInfo | null>(
    null
  );
  const [pinnedInfo, setPinnedInfo] = useState<UpgradePreviewHoverInfo | null>(
    null
  );
  const [pendingUpgrade, setPendingUpgrade] = useState<{
    instanceId: string;
    def: CardDefinition;
  } | null>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const cardElsRef = useRef<Map<string, HTMLElement>>(new Map());

  useEffect(() => {
    setIsTouchDevice(window.matchMedia("(hover: none)").matches);
  }, []);

  const handleCardMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLElement>, def: CardDefinition) => {
      setHoverInfo({ definition: def, anchorEl: e.currentTarget });
    },
    []
  );
  const handleCardMouseLeave = useCallback(() => {
    setHoverInfo(null);
  }, []);

  const handleCardClick = useCallback(
    (instanceId: string, def: CardDefinition) => {
      if (isTouchDevice) {
        setPendingUpgrade({ instanceId, def });
      } else {
        setSelected(instanceId);
        const el = cardElsRef.current.get(instanceId);
        if (el) setPinnedInfo({ definition: def, anchorEl: el });
      }
    },
    [isTouchDevice]
  );

  const upgradable = deck.filter((c) => {
    if (c.upgraded) return false;
    const def = cardDefs.get(c.definitionId);
    return def ? def.type !== "CURSE" && def.type !== "STATUS" : false;
  });

  return (
    <div className="flex flex-col items-center gap-5 px-4 py-10">
      <Divider />
      <RoomLabel label={t("special.upgradeTitle")} />

      <RoomTitle>{t("special.upgradeTitle")}</RoomTitle>

      <div className="h-px w-10 bg-gradient-to-r from-amber-500/60 to-transparent" />

      <p className="max-w-md text-center text-sm italic text-amber-200/50">
        {isTouchDevice
          ? t("special.upgradeHintTouch")
          : t("special.upgradeHint")}
      </p>

      <div className="flex max-w-4xl flex-wrap justify-center gap-3">
        {upgradable.map((card) => {
          const def = cardDefs.get(card.definitionId);
          if (!def) return null;
          const isSelected = selected === card.instanceId;
          return (
            <div
              key={card.instanceId}
              ref={(el) => {
                if (el) cardElsRef.current.set(card.instanceId, el);
                else cardElsRef.current.delete(card.instanceId);
              }}
              onMouseEnter={(e) => handleCardMouseEnter(e, def)}
              onMouseLeave={handleCardMouseLeave}
            >
              <GameCard
                definition={def}
                upgraded={card.upgraded}
                canPlay={true}
                isSelected={isSelected}
                size="sm"
                scrollable={true}
                onClick={() => handleCardClick(card.instanceId, def)}
              />
            </div>
          );
        })}
      </div>

      {!isTouchDevice && (
        <div className="mt-2 flex gap-4">
          <RogueButton
            disabled={!selected}
            onClick={() => selected && onUpgrade(selected)}
            type="text"
            className={cn(
              cinzel.className,
              "!group !flex !h-auto !items-center !gap-3 !py-[0.42rem] !text-[1.1rem] !font-semibold !uppercase !tracking-[0.16em] !outline-none !transition-all !duration-150",
              selected
                ? "!cursor-pointer !text-amber-100"
                : "!cursor-not-allowed !text-amber-100/20"
            )}
          >
            {selected && (
              <span className="inline-block h-[1.5px] w-8 shrink-0 rounded-full bg-gradient-to-r from-amber-400 to-amber-300/0 opacity-90" />
            )}
            {t("special.upgradeAction")}
          </RogueButton>

          <RogueButton
            onClick={onSkip}
            type="text"
            className={cn(
              cinzel.className,
              "!group !flex !h-auto !items-center !gap-2 !py-[0.42rem] !text-[1rem] !font-normal !uppercase !tracking-[0.14em]",
              "!cursor-pointer !text-amber-100/30 !transition-colors !duration-150 hover:!text-amber-100/70"
            )}
          >
            {t("reward.skip")}
          </RogueButton>
        </div>
      )}

      {isTouchDevice && (
        <RogueButton
          onClick={onSkip}
          type="text"
          className={cn(
            cinzel.className,
            "!group !flex !h-auto !items-center !gap-2 !py-[0.42rem] !text-[1rem] !font-normal !uppercase !tracking-[0.14em]",
            "!cursor-pointer !text-amber-100/30 !transition-colors !duration-150 hover:!text-amber-100/70"
          )}
        >
          {t("reward.skip")}
        </RogueButton>
      )}

      <Divider dim />
      <UpgradePreviewPortal info={hoverInfo ?? pinnedInfo} />

      {pendingUpgrade && (
        <CardActionModal
          card={pendingUpgrade.def}
          actionLabel={t("special.upgradeAction")}
          onAction={() => {
            onUpgrade(pendingUpgrade.instanceId);
            setPendingUpgrade(null);
          }}
          onCancel={() => setPendingUpgrade(null)}
        />
      )}
    </div>
  );
}

// ── RelicBazaarRoom ───────────────────────────────────────────────────────────

const BAZAAR_OFFER_COUNT = 3;

function generateBazaarOffers(
  runState: RunState | undefined,
  rng: RNG,
  excludeIds: string[]
): RelicDefinitionData[] {
  const ownedIds = new Set([...(runState?.relicIds ?? []), ...excludeIds]);
  const pool = relicDefinitions.filter(
    (r) =>
      !ownedIds.has(r.id) &&
      r.rarity !== "BOSS" &&
      (!runState?.unlockedRelicIds || runState.unlockedRelicIds.includes(r.id))
  );
  return weightedSampleByRarity(pool, BAZAAR_OFFER_COUNT, rng, 0);
}

function RelicBazaarRoom({
  rng,
  runState,
  onExchange,
  onLeave,
}: {
  rng: RNG;
  runState?: RunState;
  onExchange: (giveRelicId: string, takeRelicId: string) => void;
  onLeave: () => void;
}) {
  const { t } = useTranslation();
  const [offeredRelics, setOfferedRelics] = useState<RelicDefinitionData[]>(
    () => generateBazaarOffers(runState, rng, [])
  );
  const [selectedOffer, setSelectedOffer] = useState<string | null>(null);
  const [selectedOwned, setSelectedOwned] = useState<string | null>(null);

  const ownedRelics = useMemo(
    () =>
      (runState?.relicIds ?? [])
        .map((id) => relicDefinitions.find((r) => r.id === id))
        .filter((r): r is RelicDefinitionData => r !== undefined),
    [runState?.relicIds]
  );

  const canExchange = selectedOffer !== null && selectedOwned !== null;

  const handleConfirm = () => {
    if (!selectedOffer || !selectedOwned) return;
    onExchange(selectedOwned, selectedOffer);
    setOfferedRelics(generateBazaarOffers(runState, rng, [selectedOffer]));
    setSelectedOffer(null);
    setSelectedOwned(null);
  };

  return (
    <div className="flex flex-col items-center gap-5 px-4 py-10">
      <Divider />
      <RoomLabel label="Bazar des Reliques" />
      <RoomTitle>Le Marchand des Âmes</RoomTitle>
      <div className="h-px w-10 bg-gradient-to-r from-amber-500/60 to-transparent" />
      <p className="max-w-md text-center text-sm italic leading-relaxed text-amber-200/60">
        Un étrange marchand vous propose d&apos;échanger vos trésors. Les offres
        se renouvellent après chaque échange.
      </p>

      {/* Offered relics */}
      <div className="w-full max-w-lg">
        <p
          className={cn(
            cinzel.className,
            "mb-2 text-center text-[0.5rem] uppercase tracking-[0.4em] text-amber-400/50"
          )}
        >
          Offres du marchand
        </p>
        <div className="flex flex-col gap-2">
          {offeredRelics.map((relic) => {
            const rarityStyle = RARITY_STYLES[relic.rarity];
            const isSelected = selectedOffer === relic.id;
            return (
              <button
                key={relic.id}
                onClick={() => setSelectedOffer(isSelected ? null : relic.id)}
                disabled={offeredRelics.length === 0}
                className={cn(
                  "w-full rounded border px-4 py-3 text-left transition-all duration-150",
                  isSelected
                    ? "border-amber-400/60 bg-amber-900/40"
                    : cn(
                        rarityStyle?.border ?? "border-gray-500/20",
                        "bg-amber-950/10 hover:border-amber-500/35 hover:bg-amber-950/25"
                      ),
                  offeredRelics.length === 0 && "cursor-not-allowed opacity-40"
                )}
              >
                <p
                  className={cn(
                    cinzel.className,
                    "text-[0.45rem] uppercase tracking-[0.5em]",
                    rarityStyle?.badge ?? "text-gray-400/70"
                  )}
                >
                  {relic.rarity}
                </p>
                <p
                  className={cn(
                    cinzel.className,
                    "font-semibold tracking-wide text-amber-100"
                  )}
                >
                  {localizeRelicName(relic.id, relic.name)}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-amber-200/50">
                  {localizeRelicDescription(relic.id, relic.description)}
                </p>
              </button>
            );
          })}
          {offeredRelics.length === 0 && (
            <p className="text-center text-xs italic text-amber-100/30">
              Le marchand n&apos;a plus rien à offrir.
            </p>
          )}
        </div>
      </div>

      {/* Separator */}
      <div className="flex items-center gap-3 text-amber-500/30">
        <div className="h-px w-12 bg-amber-500/20" />
        <span className={cn(cinzel.className, "text-[0.6rem] tracking-widest")}>
          contre
        </span>
        <div className="h-px w-12 bg-amber-500/20" />
      </div>

      {/* Owned relics */}
      <div className="w-full max-w-lg">
        <p
          className={cn(
            cinzel.className,
            "mb-2 text-center text-[0.5rem] uppercase tracking-[0.4em] text-amber-400/50"
          )}
        >
          Vos reliques
        </p>
        <div className="flex flex-col gap-2">
          {ownedRelics.map((relic) => {
            const rarityStyle = RARITY_STYLES[relic.rarity];
            const isSelected = selectedOwned === relic.id;
            return (
              <button
                key={relic.id}
                onClick={() => setSelectedOwned(isSelected ? null : relic.id)}
                disabled={offeredRelics.length === 0}
                className={cn(
                  "w-full rounded border px-4 py-3 text-left transition-all duration-150",
                  isSelected
                    ? "border-rose-400/60 bg-rose-900/30"
                    : cn(
                        rarityStyle?.border ?? "border-gray-500/20",
                        "bg-amber-950/10 hover:border-rose-500/30 hover:bg-rose-950/15"
                      ),
                  offeredRelics.length === 0 && "cursor-not-allowed opacity-40"
                )}
              >
                <p
                  className={cn(
                    cinzel.className,
                    "text-[0.45rem] uppercase tracking-[0.5em]",
                    rarityStyle?.badge ?? "text-gray-400/70"
                  )}
                >
                  {relic.rarity}
                </p>
                <p
                  className={cn(
                    cinzel.className,
                    "font-semibold tracking-wide text-amber-100"
                  )}
                >
                  {localizeRelicName(relic.id, relic.name)}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-amber-200/50">
                  {localizeRelicDescription(relic.id, relic.description)}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-6">
        <RogueButton
          onClick={handleConfirm}
          disabled={!canExchange}
          type="text"
          className={cn(
            cinzel.className,
            "!group !flex !h-auto !items-center !gap-3 !py-[0.42rem] !uppercase",
            "!text-[1.05rem] !font-semibold !tracking-[0.16em] !outline-none !transition-all !duration-150",
            canExchange
              ? "!text-amber-100"
              : "!cursor-not-allowed !text-amber-100/20"
          )}
        >
          {canExchange && (
            <span className="inline-block h-[1.5px] w-8 shrink-0 rounded-full bg-gradient-to-r from-amber-400 to-amber-300/0 opacity-90" />
          )}
          Échanger
        </RogueButton>

        <RogueButton
          onClick={onLeave}
          type="text"
          className={cn(
            cinzel.className,
            "!group !flex !h-auto !items-center !gap-2 !py-[0.42rem] !text-[1rem] !font-normal !uppercase !tracking-[0.14em]",
            "!cursor-pointer !text-amber-100/30 !transition-colors !duration-150 hover:!text-amber-100/70"
          )}
        >
          {t("reward.skip")}
        </RogueButton>
      </div>

      <Divider dim />
    </div>
  );
}

// ── Relic rarity styling ──────────────────────────────────────────────────────

const RARITY_STYLES: Record<string, { badge: string; border: string }> = {
  COMMON: {
    badge: "text-gray-400/70",
    border: "border-gray-500/20",
  },
  UNCOMMON: {
    badge: "text-emerald-400/70",
    border: "border-emerald-500/20",
  },
  RARE: {
    badge: "text-blue-400/70",
    border: "border-blue-500/20",
  },
  BOSS: {
    badge: "text-amber-400/70",
    border: "border-amber-500/30",
  },
};

// ── EventRoom ─────────────────────────────────────────────────────────────────

function EventRoom({
  rng,
  difficultyLevel,
  forcedEvent,
  runState,
  gold,
  playerCurrentHp,
  playerMaxHp,
  deck,
  cardDefs,
  onEventChoice,
  onPickCardReward,
  onEventRelicPick,
  onPurgeCard,
  onEventContinue,
}: {
  rng: RNG;
  difficultyLevel: number;
  forcedEvent: GameEvent | null;
  runState?: RunState;
  gold: number;
  playerCurrentHp: number;
  playerMaxHp: number;
  deck: CardInstance[];
  cardDefs: Map<string, CardDefinition>;
  onEventChoice: (event: GameEvent, choiceIndex: number) => void;
  onPickCardReward: (definitionId: string) => void;
  onEventRelicPick?: (relicId: string) => void;
  onPurgeCard: (cardInstanceId: string) => void;
  onEventContinue: () => void;
}) {
  const { t } = useTranslation();
  // Pick the event once on mount — must not recompute when runState changes,
  // otherwise dispatching APPLY_EVENT causes a new event to be picked mid-flow.
  const [event] = useState(
    () => forcedEvent ?? pickEvent(rng, difficultyLevel, runState)
  );

  // Pre-compute the relic preview for sealed_reliquary
  const relicPreview = useMemo(() => {
    if (event.id !== "sealed_reliquary" || !runState) return null;
    const relicId = pickGuaranteedEventRelicId(runState);
    if (!relicId) return null;
    return relicDefinitions.find((r) => r.id === relicId) ?? null;
  }, [event.id, runState]);

  const [chosenIndex, setChosenIndex] = useState<number | null>(null);
  const [showPurgePicker, setShowPurgePicker] = useState(false);
  const [pendingArchetypeChoiceIndex, setPendingArchetypeChoiceIndex] =
    useState<number | null>(null);
  const [pendingRelicChoiceIndex, setPendingRelicChoiceIndex] = useState<
    number | null
  >(null);

  // Relics available for the "pick any relic" event choice.
  const availableRelicsForPick = useMemo(() => {
    if (!runState) return [] as RelicDefinitionData[];
    const ownedIds = new Set(runState.relicIds);
    return relicDefinitions.filter(
      (r) =>
        !ownedIds.has(r.id) &&
        r.rarity !== "BOSS" &&
        (!runState.unlockedRelicIds?.length ||
          runState.unlockedRelicIds.includes(r.id))
    );
  }, [runState]);

  const archetypeRewardChoicesByIndex = useMemo(() => {
    const choices = new Map<number, CardDefinition[]>();
    if (!runState) return choices;

    const allCards = [...cardDefs.values()];
    event.choices.forEach((choice, choiceIndex) => {
      if (choice.rewardAllCards) {
        const unlockedIds = new Set(runState.unlockedCardIds ?? []);
        const eligible = allCards.filter(
          (card) =>
            !card.isStarterCard &&
            card.isCollectible !== false &&
            (!card.characterId || card.characterId === runState.characterId) &&
            (unlockedIds.size === 0 || unlockedIds.has(card.id))
        );
        choices.set(choiceIndex, eligible);
        return;
      }
      if (!choice.rewardArchetypeTag) return;
      const choiceRng = createRNG(
        `${runState.seed}-event-archetype-${event.id}-${choiceIndex}-${runState.floor}-${runState.currentRoom}`
      );
      choices.set(
        choiceIndex,
        buildArchetypeEventCardChoices(
          allCards,
          runState,
          choice.rewardArchetypeTag,
          choiceRng,
          3,
          choice.minimumRewardChoices ?? 1
        )
      );
    });

    return choices;
  }, [cardDefs, event, runState]);

  const handleChoice = (choiceIndex: number) => {
    const choice = event.choices[choiceIndex];
    const cardChoices = archetypeRewardChoicesByIndex.get(choiceIndex);
    const isMissingArchetypeReward =
      Boolean(choice?.rewardArchetypeTag) && (cardChoices?.length ?? 0) === 0;
    const isMissingAllCardsReward =
      Boolean(choice?.rewardAllCards) && (cardChoices?.length ?? 0) === 0;
    if (!choice || isMissingArchetypeReward || isMissingAllCardsReward) {
      return;
    }
    if (!runState || !isEventChoiceAvailable(runState, choice)) {
      return;
    }
    if (choice?.requiresRelicChoice) {
      setPendingRelicChoiceIndex(choiceIndex);
      return;
    }
    if (
      (choice?.rewardArchetypeTag || choice?.rewardAllCards) &&
      (cardChoices?.length ?? 0) > 0
    ) {
      setPendingArchetypeChoiceIndex(choiceIndex);
      return;
    }

    onEventChoice(event, choiceIndex);
    setChosenIndex(choiceIndex);
  };

  const handleContinue = () => {
    const choice = chosenIndex !== null ? event.choices[chosenIndex] : null;
    if (choice?.requiresPurge) {
      setShowPurgePicker(true);
    } else {
      onEventContinue();
    }
  };

  const pendingArchetypeRewardCards =
    pendingArchetypeChoiceIndex !== null
      ? (archetypeRewardChoicesByIndex.get(pendingArchetypeChoiceIndex) ?? [])
      : [];
  const displayedChoices = event.choices.map((choice, index) => ({
    choice,
    index,
    isUnavailable:
      !runState ||
      !isEventChoiceAvailable(runState, choice) ||
      (Boolean(choice.rewardArchetypeTag) &&
        (archetypeRewardChoicesByIndex.get(index)?.length ?? 0) === 0) ||
      (Boolean(choice.rewardAllCards) &&
        (archetypeRewardChoicesByIndex.get(index)?.length ?? 0) === 0) ||
      (Boolean(choice.requiresRelicChoice) &&
        availableRelicsForPick.length === 0),
  }));

  // ── Phase OUTCOME ─────────────────────────────────────────────────────────
  if (chosenIndex !== null) {
    const choice = event.choices[chosenIndex];
    return (
      <div className="flex flex-col items-center gap-5 px-4 py-10">
        <Divider />
        <RoomLabel label={t("special.eventLabel")} />

        <RoomTitle>{t(event.title)}</RoomTitle>

        <div className="h-px w-10 bg-gradient-to-r from-amber-500/60 to-transparent" />

        {choice?.outcomeText && (
          <p className="max-w-lg border-l-2 border-amber-500/30 pl-5 text-center text-sm italic leading-relaxed text-amber-200/70">
            {t(choice.outcomeText)}
          </p>
        )}

        {!showPurgePicker && (
          <RogueButton
            onClick={handleContinue}
            type="text"
            className={cn(
              cinzel.className,
              "!group !mt-2 !flex !h-auto !items-center !gap-3 !py-[0.42rem] !uppercase",
              "!text-[1.1rem] !font-semibold !tracking-[0.16em] !text-amber-100",
              "!outline-none !transition-all !duration-150"
            )}
          >
            <span className="inline-block h-[1.5px] w-8 shrink-0 rounded-full bg-gradient-to-r from-amber-400 to-amber-300/0 opacity-90" />
            {choice?.requiresPurge
              ? t("special.eventPurgeAction")
              : t("special.eventContinue")}
          </RogueButton>
        )}

        {showPurgePicker && (
          <CardPickerModal
            title={t("special.purgePickerTitle")}
            subtitle={t("special.purgePickerSubtitle")}
            cards={deck}
            cardDefs={cardDefs}
            onPick={(cardInstanceId) => {
              setShowPurgePicker(false);
              onPurgeCard(cardInstanceId);
            }}
          />
        )}

        <Divider dim />
      </div>
    );
  }

  // ── Phase CHOOSING ────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center gap-5 px-4 py-10">
      <Divider />

      <RoomLabel label={t("special.eventLabel")} />

      <RoomTitle>{t(event.title)}</RoomTitle>

      <div className="h-px w-10 bg-gradient-to-r from-amber-500/60 to-transparent" />

      {event.flavorText && (
        <p className="max-w-lg text-center text-sm italic leading-relaxed text-amber-200/60">
          {t(event.flavorText)}
        </p>
      )}

      {event.description && (
        <p className="max-w-md text-center text-sm text-amber-100/35">
          {t(event.description)}
        </p>
      )}

      {/* Relic preview card (sealed_reliquary only) */}
      {relicPreview && (
        <div
          className={cn(
            "w-full max-w-md rounded border bg-amber-950/20 px-5 py-4",
            RARITY_STYLES[relicPreview.rarity]?.border ?? "border-amber-500/20"
          )}
        >
          <p
            className={cn(
              cinzel.className,
              "mb-2 text-[0.5rem] uppercase tracking-[0.5em]",
              RARITY_STYLES[relicPreview.rarity]?.badge ?? "text-amber-400/50"
            )}
          >
            {t("special.relicLabel")} — {relicPreview.rarity}
          </p>
          <p
            className={cn(
              cinzel.className,
              "font-semibold tracking-wide text-amber-100"
            )}
          >
            {localizeRelicName(relicPreview.id, relicPreview.name)}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-amber-200/55">
            {localizeRelicDescription(
              relicPreview.id,
              relicPreview.description
            )}
          </p>
        </div>
      )}

      {/* Stats */}
      <div
        className={cn(
          cinzel.className,
          "text-[0.55rem] uppercase tracking-[0.35em] text-amber-100/20"
        )}
      >
        {t("special.eventStats", {
          current: playerCurrentHp,
          max: playerMaxHp,
          gold,
        })}
      </div>

      {/* Choices */}
      <div className="flex w-full max-w-md flex-col gap-3">
        {displayedChoices.map(({ choice, index, isUnavailable }) => (
          <RogueButton
            key={index}
            disabled={isUnavailable}
            onClick={() => handleChoice(index)}
            type="text"
            className={cn(
              "!group !flex !h-auto !flex-col !items-start !gap-1.5 !rounded !border !border-amber-500/15",
              "!bg-amber-950/10 !px-6 !py-3 !text-left",
              "!transition-all !duration-150",
              isUnavailable
                ? "!cursor-not-allowed !opacity-45"
                : "hover:!border-amber-500/35 hover:!bg-amber-950/30"
            )}
          >
            <div className="flex items-center gap-3">
              <span className="inline-block h-[1.5px] w-0 shrink-0 rounded-full bg-gradient-to-r from-amber-400 to-amber-300/0 opacity-0 transition-all duration-200 group-hover:w-4 group-hover:opacity-70" />
              <span
                className={cn(
                  cinzel.className,
                  "text-sm font-semibold uppercase tracking-[0.1em] text-amber-100",
                  "transition-all duration-200 group-hover:translate-x-0"
                )}
              >
                {t(choice.label)}
              </span>
            </div>
            <span className="pl-0 text-xs text-amber-200/45 transition-all duration-200 group-hover:pl-7">
              {t(choice.description)}
            </span>
          </RogueButton>
        ))}
      </div>

      <Divider dim />

      {pendingArchetypeChoiceIndex !== null && (
        <CardPickerModal
          title={t("special.eventRewardPickerTitle")}
          subtitle={t("special.eventRewardPickerSubtitle")}
          cards={pendingArchetypeRewardCards.map((card) => ({
            instanceId: card.id,
            definitionId: card.id,
            upgraded: false,
          }))}
          cardDefs={cardDefs}
          onPick={(definitionId) => {
            onPickCardReward(definitionId);
            onEventChoice(event, pendingArchetypeChoiceIndex);
            setChosenIndex(pendingArchetypeChoiceIndex);
            setPendingArchetypeChoiceIndex(null);
          }}
          onCancel={() => setPendingArchetypeChoiceIndex(null)}
        />
      )}

      {pendingRelicChoiceIndex !== null && (
        <RelicPickerModal
          relics={availableRelicsForPick}
          onPick={(relicId) => {
            onEventRelicPick?.(relicId);
            onEventChoice(event, pendingRelicChoiceIndex);
            setChosenIndex(pendingRelicChoiceIndex);
            setPendingRelicChoiceIndex(null);
          }}
          onCancel={() => setPendingRelicChoiceIndex(null)}
        />
      )}
    </div>
  );
}

// ── RelicPickerModal ──────────────────────────────────────────────────────────

function RelicPickerModal({
  relics,
  onPick,
  onCancel,
}: {
  relics: RelicDefinitionData[];
  onPick: (relicId: string) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();

  return (
    <RogueModal
      open
      onCancel={onCancel}
      footer={null}
      centered
      destroyOnClose
      closable
      keyboard
      maskClosable
      width={680}
      title={
        <div className="pr-2">
          <h3 className="text-base font-bold text-slate-100">
            {t("special.relicPickerTitle")}
          </h3>
          <p className="mt-0.5 text-xs text-slate-400">
            {t("special.relicPickerSubtitle")}
          </p>
        </div>
      }
      className="[&_.ant-modal-content]:!max-h-[85vh] [&_.ant-modal-content]:!overflow-hidden [&_.ant-modal-content]:!rounded-xl [&_.ant-modal-content]:!border [&_.ant-modal-content]:!border-amber-700/50 [&_.ant-modal-content]:!bg-slate-900 [&_.ant-modal-header]:!border-b [&_.ant-modal-header]:!border-slate-700/60 [&_.ant-modal-header]:!bg-transparent"
    >
      <div className="max-h-[65vh] overflow-y-auto p-1">
        {relics.length === 0 ? (
          <RogueEmpty
            description={t("special.relicPickerEmpty")}
            className="py-8 [&_.ant-empty-description]:!text-sm [&_.ant-empty-description]:!text-slate-500"
          />
        ) : (
          <div className="flex flex-col gap-2">
            {relics.map((relic) => {
              const rs = RARITY_STYLES[relic.rarity];
              return (
                <button
                  key={relic.id}
                  onClick={() => onPick(relic.id)}
                  className={cn(
                    "w-full rounded border px-4 py-3 text-left transition-all duration-150",
                    rs?.border ?? "border-gray-500/20",
                    "bg-amber-950/10 hover:border-amber-500/35 hover:bg-amber-950/25"
                  )}
                >
                  <p
                    className={cn(
                      cinzel.className,
                      "text-[0.45rem] uppercase tracking-[0.5em]",
                      rs?.badge ?? "text-gray-400/70"
                    )}
                  >
                    {t(`gameCard.rarity.${relic.rarity}`, {
                      defaultValue: relic.rarity,
                    })}
                  </p>
                  <p
                    className={cn(
                      cinzel.className,
                      "font-semibold tracking-wide text-amber-100"
                    )}
                  >
                    {localizeRelicName(relic.id, relic.name)}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-amber-200/50">
                    {localizeRelicDescription(relic.id, relic.description)}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div className="mt-3 flex justify-end">
        <RogueButton
          onClick={onCancel}
          className="!rounded !border !border-slate-600 !bg-transparent !px-2.5 !py-1 !text-xs !font-semibold !text-slate-300 hover:!border-slate-400 hover:!text-white"
        >
          {t("cardPicker.cancel")}
        </RogueButton>
      </div>
    </RogueModal>
  );
}

"use client";

import { useCallback, useMemo, useState } from "react";
import { Cinzel } from "next/font/google";
import type { CardDefinition } from "@/game/schemas/cards";
import type { CardInstance } from "@/game/schemas/cards";
import type { RNG } from "@/game/engine/rng";
import type { RunState } from "@/game/schemas/run-state";
import {
  createGuaranteedRelicEvent,
  pickSpecialRoomTypeWithDifficulty,
  pickEvent,
  pickGuaranteedEventRelicId,
  type GameEvent,
} from "@/game/engine/run";
import { relicDefinitions } from "@/game/data/relics";
import { GAME_CONSTANTS } from "@/game/constants";
import { cn } from "@/lib/utils/cn";
import {
  UpgradePreviewPortal,
  type UpgradePreviewHoverInfo,
} from "../shared/UpgradePreviewPortal";
import { CardPickerModal } from "../shared/CardPickerModal";
import { useTranslation } from "react-i18next";
import {
  localizeCardDescription,
  localizeCardName,
  localizeCardType,
} from "@/lib/i18n/card-text";
import {
  localizeRelicDescription,
  localizeRelicName,
} from "@/lib/i18n/entity-text";
import { RogueButton } from "@/components/ui/rogue";

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
  runState?: RunState;
  onHeal: () => void;
  onUpgrade: (cardInstanceId: string) => void;
  onEventChoice: (event: GameEvent, choiceIndex: number) => void;
  onEventPurge: (cardInstanceId: string) => void;
  onEventContinue: () => void;
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
  runState,
  onHeal,
  onUpgrade,
  onEventChoice,
  onEventPurge,
  onEventContinue,
  onSkip,
}: SpecialRoomViewProps) {
  const roomType = useMemo(() => {
    if (forceEventWithRelic) return "EVENT" as const;
    return pickSpecialRoomTypeWithDifficulty(rng, difficultyLevel);
  }, [forceEventWithRelic, rng, difficultyLevel]);
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
          onHeal={onHeal}
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
          onEventPurge={onEventPurge}
          onEventContinue={onEventContinue}
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
  onHeal,
}: {
  playerCurrentHp: number;
  playerMaxHp: number;
  onHeal: () => void;
}) {
  const { t } = useTranslation();
  const healAmount = Math.floor(playerMaxHp * GAME_CONSTANTS.HEAL_ROOM_PERCENT);
  const newHp = Math.min(playerMaxHp, playerCurrentHp + healAmount);

  return (
    <div className="flex flex-col items-center gap-5 px-4 py-10">
      <Divider />
      <RoomLabel label={t("special.healTitle")} />

      <RoomTitle>{t("special.healTitle")}</RoomTitle>

      <div className="h-px w-10 bg-gradient-to-r from-amber-500/60 to-transparent" />

      <p className="max-w-md text-center text-sm italic leading-relaxed text-amber-200/60">
        {t("special.healDesc")}
      </p>

      {/* HP preview */}
      <div className="flex items-center gap-3 rounded border border-amber-500/20 bg-amber-950/20 px-6 py-3 text-sm">
        <span className="text-amber-100/50">{playerCurrentHp}</span>
        <span className="text-amber-400/40">→</span>
        <span className="font-semibold text-amber-300">{newHp}</span>
        <span className="text-amber-100/30">/ {playerMaxHp}</span>
      </div>

      <RogueButton
        onClick={onHeal}
        type="text"
        className={cn(
          cinzel.className,
          "!group !mt-2 !flex !h-auto !items-center !gap-3 !py-[0.42rem] !uppercase",
          "!text-[1.1rem] !font-semibold !tracking-[0.16em] !text-amber-100",
          "!outline-none !transition-all !duration-150"
        )}
      >
        <span className="inline-block h-[1.5px] w-8 shrink-0 rounded-full bg-gradient-to-r from-amber-400 to-amber-300/0 opacity-90" />
        {t("special.healAction")}
      </RogueButton>

      <Divider dim />
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
  const handleCardMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLElement>, def: CardDefinition) => {
      setHoverInfo({ definition: def, anchorEl: e.currentTarget });
    },
    []
  );
  const handleCardMouseLeave = useCallback(() => {
    setHoverInfo(null);
  }, []);

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
        {t("special.upgradeHint")}
      </p>

      <div className="flex max-w-2xl flex-wrap justify-center gap-3">
        {upgradable.map((card) => {
          const def = cardDefs.get(card.definitionId);
          if (!def) return null;

          const isSelected = selected === card.instanceId;

          return (
            <RogueButton
              key={card.instanceId}
              onClick={() => setSelected(card.instanceId)}
              onMouseEnter={(e) => handleCardMouseEnter(e, def)}
              onMouseLeave={handleCardMouseLeave}
              type="text"
              className={cn(
                "!relative !flex !h-auto !w-32 !min-w-0 !flex-col !items-center !gap-1 !whitespace-normal !rounded !border-2 !p-3 !text-center !transition-all !duration-150",
                isSelected
                  ? "!border-amber-400/60 !bg-amber-950/50 !ring-1 !ring-amber-400/30"
                  : "!border-amber-500/15 !bg-amber-950/10 hover:!border-amber-500/30 hover:!bg-amber-950/30"
              )}
            >
              <span className="block w-full whitespace-normal break-words text-xs font-bold leading-tight text-amber-100 [overflow-wrap:anywhere]">
                {localizeCardName(def, t)}
              </span>
              <span className="block w-full whitespace-normal break-words text-[10px] leading-tight text-amber-200/40 [overflow-wrap:anywhere]">
                {localizeCardType(def.type, t)} —{" "}
                {t(`gameCard.rarity.${def.rarity}`, {
                  defaultValue: def.rarity,
                })}
              </span>
              <span className="line-clamp-2 block w-full whitespace-normal break-words text-[10px] leading-tight text-amber-100/30 [overflow-wrap:anywhere]">
                {localizeCardDescription(def, t)}
              </span>
            </RogueButton>
          );
        })}
      </div>

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

      <Divider dim />
      <UpgradePreviewPortal info={hoverInfo} />
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
  onEventPurge,
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
  onEventPurge: (cardInstanceId: string) => void;
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

  const handleChoice = (choiceIndex: number) => {
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
              onEventPurge(cardInstanceId);
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
        {event.choices.map((choice, i) => (
          <RogueButton
            key={i}
            onClick={() => handleChoice(i)}
            type="text"
            className={cn(
              "!group !flex !h-auto !flex-col !items-start !gap-1.5 !rounded !border !border-amber-500/15",
              "!bg-amber-950/10 !px-6 !py-3 !text-left",
              "!transition-all !duration-150",
              "hover:!border-amber-500/35 hover:!bg-amber-950/30"
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
    </div>
  );
}

"use client";

import { useCallback, useMemo, useState } from "react";
import type { CardDefinition } from "@/game/schemas/cards";
import type { CardInstance } from "@/game/schemas/cards";
import type { RNG } from "@/game/engine/rng";
import {
  createGuaranteedRelicEvent,
  pickSpecialRoomTypeWithDifficulty,
  pickEvent,
  type GameEvent,
} from "@/game/engine/run";
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

interface SpecialRoomViewProps {
  playerCurrentHp: number;
  playerMaxHp: number;
  gold: number;
  deck: CardInstance[];
  cardDefs: Map<string, CardDefinition>;
  rng: RNG;
  difficultyLevel: number;
  forceEventWithRelic?: boolean;
  onHeal: () => void;
  onUpgrade: (cardInstanceId: string) => void;
  onEventChoice: (event: GameEvent, choiceIndex: number) => void;
  onEventPurge: (cardInstanceId: string) => void;
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
  onHeal,
  onUpgrade,
  onEventChoice,
  onEventPurge,
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
          gold={gold}
          playerCurrentHp={playerCurrentHp}
          playerMaxHp={playerMaxHp}
          deck={deck}
          cardDefs={cardDefs}
          onEventChoice={onEventChoice}
          onEventPurge={onEventPurge}
        />
      );
  }
}

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

  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <h2 className="text-2xl font-bold text-green-400">
        {t("special.healTitle")}
      </h2>
      <p className="text-gray-400">
        {t("special.healDesc", {
          percent: Math.floor(GAME_CONSTANTS.HEAL_ROOM_PERCENT * 100),
        })}
      </p>
      <p className="text-sm text-gray-500">
        {t("special.currentHp", { current: playerCurrentHp, max: playerMaxHp })}
      </p>
      <button
        className="rounded-lg bg-green-700 px-6 py-2 text-white hover:bg-green-600"
        onClick={onHeal}
      >
        {t("special.healAction")}
      </button>
    </div>
  );
}

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
    (e: React.MouseEvent<HTMLButtonElement>, def: CardDefinition) => {
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
    <div className="flex flex-col items-center gap-6 py-8">
      <h2 className="text-2xl font-bold text-blue-400">
        {t("special.upgradeTitle")}
      </h2>
      <p className="text-gray-400">{t("special.upgradeHint")}</p>

      <div className="flex max-w-2xl flex-wrap justify-center gap-3">
        {upgradable.map((card) => {
          const def = cardDefs.get(card.definitionId);
          if (!def) return null;

          const isSelected = selected === card.instanceId;

          return (
            <button
              key={card.instanceId}
              onClick={() => setSelected(card.instanceId)}
              onMouseEnter={(e) => handleCardMouseEnter(e, def)}
              onMouseLeave={handleCardMouseLeave}
              className={cn(
                "relative flex w-32 flex-col items-center gap-1 rounded-lg border-2 p-3 text-center transition",
                isSelected
                  ? "border-blue-400 bg-blue-950/60 ring-2 ring-blue-400"
                  : "border-gray-600 bg-gray-800/50 hover:border-gray-400"
              )}
            >
              <span className="text-xs font-bold text-white">
                {localizeCardName(def, t)}
              </span>
              <span className="text-[10px] text-gray-400">
                {localizeCardType(def.type, t)} -{" "}
                {t(`gameCard.rarity.${def.rarity}`, {
                  defaultValue: def.rarity,
                })}
              </span>
              <span className="line-clamp-2 text-[10px] text-gray-500">
                {localizeCardDescription(def, t)}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex gap-3">
        <button
          disabled={!selected}
          onClick={() => selected && onUpgrade(selected)}
          className={cn(
            "rounded-lg px-6 py-2 font-medium transition",
            selected
              ? "bg-blue-600 text-white hover:bg-blue-500"
              : "cursor-not-allowed bg-gray-700 text-gray-500"
          )}
        >
          {t("special.upgradeAction")}
        </button>
        <button
          className="rounded-lg bg-gray-700 px-6 py-2 text-white hover:bg-gray-600"
          onClick={onSkip}
        >
          {t("reward.skip")}
        </button>
      </div>
      <UpgradePreviewPortal info={hoverInfo} />
    </div>
  );
}

function EventRoom({
  rng,
  difficultyLevel,
  forcedEvent,
  gold,
  playerCurrentHp,
  playerMaxHp,
  deck,
  cardDefs,
  onEventChoice,
  onEventPurge,
}: {
  rng: RNG;
  difficultyLevel: number;
  forcedEvent: GameEvent | null;
  gold: number;
  playerCurrentHp: number;
  playerMaxHp: number;
  deck: CardInstance[];
  cardDefs: Map<string, CardDefinition>;
  onEventChoice: (event: GameEvent, choiceIndex: number) => void;
  onEventPurge: (cardInstanceId: string) => void;
}) {
  const { t } = useTranslation();
  const event = useMemo(
    () => forcedEvent ?? pickEvent(rng, difficultyLevel),
    [forcedEvent, rng, difficultyLevel]
  );
  const [showPurgePicker, setShowPurgePicker] = useState(false);

  const handleChoice = (choiceIndex: number) => {
    const choice = event.choices[choiceIndex];
    onEventChoice(event, choiceIndex);
    if (choice?.requiresPurge) {
      setShowPurgePicker(true);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <h2 className="text-2xl font-bold text-purple-400">{event.title}</h2>
      <p className="max-w-md text-center text-gray-400">{event.description}</p>

      <div className="text-xs text-gray-500">
        {t("special.eventStats", {
          current: playerCurrentHp,
          max: playerMaxHp,
          gold,
        })}
      </div>

      <div className="flex flex-col gap-3">
        {event.choices.map((choice, i) => (
          <button
            key={i}
            onClick={() => handleChoice(i)}
            className="flex flex-col items-start gap-1 rounded-lg border-2 border-purple-700 bg-purple-950/40 px-6 py-3 text-left transition hover:border-purple-500 hover:bg-purple-950/60"
          >
            <span className="font-medium text-white">{choice.label}</span>
            <span className="text-xs text-purple-300">
              {choice.description}
            </span>
          </button>
        ))}
      </div>

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
    </div>
  );
}

"use client";

import { useCallback, useMemo, useState } from "react";
import type { CardDefinition } from "@/game/schemas/cards";
import type { CardInstance } from "@/game/schemas/cards";
import type { RNG } from "@/game/engine/rng";
import {
  pickSpecialRoomType,
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

interface SpecialRoomViewProps {
  playerCurrentHp: number;
  playerMaxHp: number;
  gold: number;
  deck: CardInstance[];
  cardDefs: Map<string, CardDefinition>;
  rng: RNG;
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
  onHeal,
  onUpgrade,
  onEventChoice,
  onEventPurge,
  onSkip,
}: SpecialRoomViewProps) {
  const roomType = useMemo(() => pickSpecialRoomType(rng), [rng]);

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
  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <h2 className="text-2xl font-bold text-green-400">Healing Spring</h2>
      <p className="text-gray-400">
        Restore {Math.floor(GAME_CONSTANTS.HEAL_ROOM_PERCENT * 100)}% of your
        max HP
      </p>
      <p className="text-sm text-gray-500">
        Current: {playerCurrentHp}/{playerMaxHp}
      </p>
      <button
        className="rounded-lg bg-green-700 px-6 py-2 text-white hover:bg-green-600"
        onClick={onHeal}
      >
        Heal
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
      <h2 className="text-2xl font-bold text-blue-400">Enchanted Anvil</h2>
      <p className="text-gray-400">Hover a card to preview the upgrade</p>

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
              <span className="text-xs font-bold text-white">{def.name}</span>
              <span className="text-[10px] text-gray-400">
                {def.type} - {def.rarity}
              </span>
              <span className="line-clamp-2 text-[10px] text-gray-500">
                {def.description}
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
          Upgrade
        </button>
        <button
          className="rounded-lg bg-gray-700 px-6 py-2 text-white hover:bg-gray-600"
          onClick={onSkip}
        >
          Skip
        </button>
      </div>
      <UpgradePreviewPortal info={hoverInfo} />
    </div>
  );
}

function EventRoom({
  rng,
  gold,
  playerCurrentHp,
  playerMaxHp,
  deck,
  cardDefs,
  onEventChoice,
  onEventPurge,
}: {
  rng: RNG;
  gold: number;
  playerCurrentHp: number;
  playerMaxHp: number;
  deck: CardInstance[];
  cardDefs: Map<string, CardDefinition>;
  onEventChoice: (event: GameEvent, choiceIndex: number) => void;
  onEventPurge: (cardInstanceId: string) => void;
}) {
  const event = useMemo(() => pickEvent(rng), [rng]);
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
        HP: {playerCurrentHp}/{playerMaxHp} - Gold: {gold}
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
          title="Choisissez une carte à retirer"
          subtitle="Cette carte sera définitivement supprimée de votre deck."
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

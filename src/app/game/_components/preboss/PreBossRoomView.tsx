"use client";

import { useState, useCallback } from "react";
import type { TFunction } from "i18next";
import type { CardInstance, CardDefinition } from "@/game/schemas/cards";
import { GAME_CONSTANTS } from "@/game/constants";
import { cn } from "@/lib/utils/cn";
import {
  UpgradePreviewPortal,
  type UpgradePreviewHoverInfo,
} from "../shared/UpgradePreviewPortal";
import { useTranslation } from "react-i18next";
import { localizeCardName, localizeCardType } from "@/lib/i18n/card-text";

interface PreBossRoomViewProps {
  playerCurrentHp: number;
  playerMaxHp: number;
  deck: CardInstance[];
  cardDefs: Map<string, CardDefinition>;
  onHeal: () => void;
  onUpgrade: (cardInstanceId: string) => void;
  onFight: () => void;
}

export function PreBossRoomView({
  playerCurrentHp,
  playerMaxHp,
  deck,
  cardDefs,
  onHeal,
  onUpgrade,
  onFight,
}: PreBossRoomViewProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<"CHOOSE" | "UPGRADE">("CHOOSE");

  if (mode === "UPGRADE") {
    return (
      <UpgradeSubView
        deck={deck}
        cardDefs={cardDefs}
        onUpgrade={onUpgrade}
        onBack={() => setMode("CHOOSE")}
        t={t}
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <h2 className="text-2xl font-bold text-amber-400">
        {t("preBoss.title")}
      </h2>
      <p className="max-w-md text-center text-gray-400">
        {t("preBoss.subtitle")}
      </p>
      <p className="text-sm text-gray-500">
        {t("preBoss.hp", { current: playerCurrentHp, max: playerMaxHp })}
      </p>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <button
          onClick={onHeal}
          className="rounded-lg border-2 border-green-700 bg-green-950/40 px-6 py-4 text-left transition hover:border-green-500 hover:bg-green-950/60"
        >
          <p className="font-medium text-green-300">{t("preBoss.healTitle")}</p>
          <p className="text-sm text-green-600">
            {t("preBoss.healDesc", {
              percent: Math.floor(GAME_CONSTANTS.HEAL_ROOM_PERCENT * 100),
            })}
          </p>
        </button>

        <button
          onClick={() => setMode("UPGRADE")}
          className="rounded-lg border-2 border-blue-700 bg-blue-950/40 px-6 py-4 text-left transition hover:border-blue-500 hover:bg-blue-950/60"
        >
          <p className="font-medium text-blue-300">
            {t("preBoss.upgradeTitle")}
          </p>
          <p className="text-sm text-blue-600">{t("preBoss.upgradeDesc")}</p>
        </button>

        <button
          onClick={onFight}
          className="rounded-lg border-2 border-purple-700 bg-purple-950/40 px-6 py-4 text-left transition hover:border-purple-500 hover:bg-purple-950/60"
        >
          <p className="font-medium text-purple-300">
            {t("preBoss.huntTitle")}
          </p>
          <p className="text-sm text-purple-600">{t("preBoss.huntDesc")}</p>
        </button>
      </div>
    </div>
  );
}

function UpgradeSubView({
  deck,
  cardDefs,
  onUpgrade,
  onBack,
  t,
}: {
  deck: CardInstance[];
  cardDefs: Map<string, CardDefinition>;
  onUpgrade: (cardInstanceId: string) => void;
  onBack: () => void;
  t: TFunction;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [hoverInfo, setHoverInfo] = useState<UpgradePreviewHoverInfo | null>(
    null
  );

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>, def: CardDefinition) => {
      setHoverInfo({ definition: def, anchorEl: e.currentTarget });
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
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
        {t("preBoss.upgradeTitle")}
      </h2>
      <p className="text-gray-400">{t("preBoss.upgradeHint")}</p>

      <div className="flex max-w-2xl flex-wrap justify-center gap-3">
        {upgradable.map((card) => {
          const def = cardDefs.get(card.definitionId);
          if (!def) return null;
          const isSelected = selected === card.instanceId;
          return (
            <button
              key={card.instanceId}
              onClick={() => setSelected(card.instanceId)}
              onMouseEnter={(e) => handleMouseEnter(e, def)}
              onMouseLeave={handleMouseLeave}
              className={cn(
                "flex w-32 flex-col items-center gap-1 rounded-lg border-2 p-3 text-center transition",
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
          {t("preBoss.upgradeAction")}
        </button>
        <button
          className="rounded-lg bg-gray-700 px-6 py-2 text-white hover:bg-gray-600"
          onClick={onBack}
        >
          {t("common.back")}
        </button>
      </div>

      <UpgradePreviewPortal info={hoverInfo} />
    </div>
  );
}

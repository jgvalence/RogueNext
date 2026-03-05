"use client";

import { useState, useCallback } from "react";
import { Cinzel } from "next/font/google";
import type { CardInstance, CardDefinition } from "@/game/schemas/cards";
import { cn } from "@/lib/utils/cn";
import {
  UpgradePreviewPortal,
  type UpgradePreviewHoverInfo,
} from "../shared/UpgradePreviewPortal";
import { useTranslation } from "react-i18next";
import {
  localizeCardDescription,
  localizeCardName,
  localizeCardType,
} from "@/lib/i18n/card-text";
import { RogueButton } from "@/components/ui/rogue";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "600", "700"] });

interface PreBossRoomViewProps {
  playerCurrentHp: number;
  playerMaxHp: number;
  deck: CardInstance[];
  cardDefs: Map<string, CardDefinition>;
  onHeal: () => void;
  onUpgrade: (cardInstanceId: string) => void;
  onFight: () => void;
}

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
      />
    );
  }

  const choices = [
    {
      key: "heal",
      title: t("preBoss.healTitle"),
      desc: t("preBoss.healDesc"),
      onClick: onHeal,
    },
    {
      key: "upgrade",
      title: t("preBoss.upgradeTitle"),
      desc: t("preBoss.upgradeDesc"),
      onClick: () => setMode("UPGRADE"),
    },
    {
      key: "hunt",
      title: t("preBoss.huntTitle"),
      desc: t("preBoss.huntDesc"),
      onClick: onFight,
    },
  ];

  return (
    <div className="flex flex-col items-center gap-5 px-4 py-10">
      <Divider />

      <p
        className={cn(
          cinzel.className,
          "max-w-[min(100%,22rem)] text-center text-[0.55rem] font-semibold uppercase leading-relaxed tracking-[0.35em] text-amber-400/50 [overflow-wrap:anywhere] sm:tracking-[0.55em]"
        )}
      >
        {t("preBoss.label")}
      </p>

      <h2
        className={cn(
          cinzel.className,
          "max-w-[min(100%,24rem)] text-center text-2xl font-bold uppercase leading-snug tracking-[0.08em] text-amber-100 [overflow-wrap:anywhere] sm:tracking-[0.1em]"
        )}
      >
        {t("preBoss.title")}
      </h2>

      <div className="h-px w-10 bg-gradient-to-r from-amber-500/60 to-transparent" />

      <p className="max-w-lg text-center text-sm italic leading-relaxed text-amber-200/60">
        {t("preBoss.flavorText")}
      </p>

      <p className="max-w-md text-center text-sm text-amber-100/35">
        {t("preBoss.subtitle")}
      </p>

      <div
        className={cn(
          cinzel.className,
          "text-[0.55rem] uppercase tracking-[0.35em] text-amber-100/20"
        )}
      >
        {t("preBoss.hp", { current: playerCurrentHp, max: playerMaxHp })}
      </div>

      <div className="flex w-full max-w-md flex-col gap-3">
        {choices.map((choice) => (
          <RogueButton
            key={choice.key}
            onClick={choice.onClick}
            type="text"
            className={cn(
              "!group !flex !h-auto !flex-col !items-start !gap-1.5 !whitespace-normal !rounded !border !border-amber-500/15",
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
                  "whitespace-normal break-words text-sm font-semibold uppercase tracking-[0.08em] text-amber-100 [overflow-wrap:anywhere] sm:tracking-[0.1em]"
                )}
              >
                {choice.title}
              </span>
            </div>
            <p className="break-words pl-0 text-xs italic leading-relaxed text-amber-200/45 [overflow-wrap:anywhere]">
              {choice.desc}
            </p>
          </RogueButton>
        ))}
      </div>

      <Divider dim />
    </div>
  );
}

function UpgradeSubView({
  deck,
  cardDefs,
  onUpgrade,
  onBack,
}: {
  deck: CardInstance[];
  cardDefs: Map<string, CardDefinition>;
  onUpgrade: (cardInstanceId: string) => void;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const [hoverInfo, setHoverInfo] = useState<UpgradePreviewHoverInfo | null>(
    null
  );

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLElement>, def: CardDefinition) => {
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
    <div className="flex flex-col items-center gap-5 px-4 py-10">
      <Divider />

      <p
        className={cn(
          cinzel.className,
          "max-w-[min(100%,22rem)] text-center text-[0.55rem] font-semibold uppercase leading-relaxed tracking-[0.35em] text-amber-400/50 [overflow-wrap:anywhere] sm:tracking-[0.55em]"
        )}
      >
        {t("preBoss.label")}
      </p>

      <h2
        className={cn(
          cinzel.className,
          "max-w-[min(100%,24rem)] text-center text-2xl font-bold uppercase leading-snug tracking-[0.08em] text-amber-100 [overflow-wrap:anywhere] sm:tracking-[0.1em]"
        )}
      >
        {t("preBoss.upgradeTitle")}
      </h2>

      <div className="h-px w-10 bg-gradient-to-r from-amber-500/60 to-transparent" />

      <p className="max-w-md text-center text-sm italic text-amber-200/50">
        {t("preBoss.upgradeHint")}
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
              onMouseEnter={(e) => handleMouseEnter(e, def)}
              onMouseLeave={handleMouseLeave}
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
          {t("preBoss.upgradeAction")}
        </RogueButton>

        <RogueButton
          onClick={onBack}
          type="text"
          className={cn(
            cinzel.className,
            "!group !flex !h-auto !items-center !gap-2 !py-[0.42rem] !text-[1rem] !font-normal !uppercase !tracking-[0.14em]",
            "!cursor-pointer !text-amber-100/30 !transition-colors !duration-150 hover:!text-amber-100/70"
          )}
        >
          {t("common.back")}
        </RogueButton>
      </div>

      <Divider dim />
      <UpgradePreviewPortal info={hoverInfo} />
    </div>
  );
}

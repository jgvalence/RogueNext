"use client";

import { useState, useCallback } from "react";

import type {
  CardInstance,
  CardDefinition,
  CardUpgradeBranch,
} from "@/game/schemas/cards";
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
import { CardActionModal } from "../shared/CardActionModal";

const cinzel = { className: "font-serif" };

interface PreBossRoomViewProps {
  playerCurrentHp: number;
  playerMaxHp: number;
  deck: CardInstance[];
  cardDefs: Map<string, CardDefinition>;
  onHeal: () => void;
  onUpgrade: (cardInstanceId: string, branch: CardUpgradeBranch) => void;
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
      icon: "♥",
      title: t("preBoss.healTitle"),
      desc: t("preBoss.healDesc"),
      signal: t("preBoss.healSignal", {
        amount: Math.max(0, playerMaxHp - playerCurrentHp),
      }),
      tone: "border-emerald-400/25 from-emerald-950/45 hover:!border-emerald-300/55",
      iconTone: "text-emerald-200 border-emerald-300/25 bg-emerald-500/10",
      onClick: onHeal,
    },
    {
      key: "upgrade",
      icon: "✒",
      title: t("preBoss.upgradeTitle"),
      desc: t("preBoss.upgradeDesc"),
      signal: t("preBoss.upgradeSignal"),
      tone: "border-sky-400/25 from-sky-950/45 hover:!border-sky-300/55",
      iconTone: "text-sky-200 border-sky-300/25 bg-sky-500/10",
      onClick: () => setMode("UPGRADE"),
    },
    {
      key: "hunt",
      icon: "⚔",
      title: t("preBoss.huntTitle"),
      desc: t("preBoss.huntDesc"),
      signal: t("preBoss.huntSignal"),
      tone: "border-rose-400/30 from-rose-950/50 hover:!border-rose-300/60",
      iconTone: "text-rose-200 border-rose-300/30 bg-rose-500/12",
      onClick: onFight,
    },
  ];

  return (
    <div className="relative isolate flex min-h-full flex-col items-center gap-5 overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_18%,rgba(244,63,94,0.13),transparent_38%),linear-gradient(180deg,#080910,#12090d_68%,#050609)]" />
      <div className="from-rose-950/24 pointer-events-none absolute left-1/2 top-10 -z-10 h-[27rem] w-72 -translate-x-1/2 rounded-t-[9rem] border border-rose-300/10 bg-gradient-to-b to-black/60 shadow-[0_0_90px_rgba(136,19,55,0.16)]" />
      <div className="pointer-events-none absolute left-1/2 top-24 -z-10 h-72 w-px -translate-x-1/2 bg-rose-200/10" />
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

      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-rose-300/25 bg-rose-950/45 text-3xl text-rose-200 shadow-[0_0_35px_rgba(244,63,94,0.14)]">
        ⚔
      </div>

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

      <div className="grid w-full max-w-4xl gap-3 md:grid-cols-3">
        {choices.map((choice) => (
          <RogueButton
            key={choice.key}
            onClick={choice.onClick}
            type="text"
            className={cn(
              "!group !flex !h-auto !min-h-48 !flex-col !items-start !gap-3 !whitespace-normal !rounded-2xl !border",
              "!to-slate-950/92 !bg-gradient-to-b !px-5 !py-5 !text-left !shadow-[0_18px_45px_rgba(0,0,0,0.28)]",
              "!transition-all !duration-200 hover:!-translate-y-1",
              choice.tone
            )}
          >
            <span
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-xl border text-xl",
                choice.iconTone
              )}
            >
              {choice.icon}
            </span>
            <div className="flex items-center gap-3">
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
            <span
              className={cn(
                "mt-auto rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em]",
                choice.iconTone
              )}
            >
              {choice.signal}
            </span>
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
  onUpgrade: (cardInstanceId: string, branch: CardUpgradeBranch) => void;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const [pendingUpgrade, setPendingUpgrade] = useState<{
    instanceId: string;
    def: CardDefinition;
  } | null>(null);
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
    <div className="relative isolate flex min-h-full flex-col items-center gap-5 overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_18%,rgba(56,189,248,0.13),transparent_38%),linear-gradient(180deg,#070b12,#08111b_68%,#050609)]" />
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
                "!relative !flex !h-auto !w-32 !min-w-0 !cursor-pointer !flex-col !items-center !gap-1 !whitespace-normal !rounded !border-2 !p-3 !text-center !transition-all !duration-150",
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
          onClick={() => {
            if (!selected) return;
            const card = deck.find((entry) => entry.instanceId === selected);
            const def = card ? cardDefs.get(card.definitionId) : undefined;
            if (def) setPendingUpgrade({ instanceId: selected, def });
          }}
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
      {pendingUpgrade && (
        <CardActionModal
          card={pendingUpgrade.def}
          actionLabel={t("preBoss.upgradeAction")}
          onAction={(branch) => {
            onUpgrade(pendingUpgrade.instanceId, branch);
            setPendingUpgrade(null);
          }}
          onCancel={() => setPendingUpgrade(null)}
        />
      )}
    </div>
  );
}

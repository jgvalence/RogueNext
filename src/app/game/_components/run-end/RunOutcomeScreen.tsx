"use client";

import Link from "next/link";
import { Cinzel } from "next/font/google";
import { useTranslation } from "react-i18next";
import type { CardDefinition } from "@/game/schemas/cards";
import type { RelicDefinitionData } from "@/game/data/relics";
import { cn } from "@/lib/utils/cn";
import { localizeCardName, localizeCardType } from "@/lib/i18n/card-text";
import {
  localizeRelicDescription,
  localizeRelicName,
} from "@/lib/i18n/entity-text";
import { GameCard } from "../combat/GameCard";
import { Tooltip } from "../shared/Tooltip";

type RunOutcomeStatus = "VICTORY" | "DEFEAT" | "ABANDONED";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "600", "700"] });

interface RunOutcomeScreenProps {
  status: RunOutcomeStatus;
  floor: number;
  currentRoom: number;
  totalRooms: number;
  gold: number;
  deckSize: number;
  relicCount: number;
  difficultyLevel: number | null;
  earnedResourcesSummary: Array<[string, number]>;
  earnedResourceMultiplier: number;
  newlyUnlockedCards: CardDefinition[];
  newlyUnlockedRelics: RelicDefinitionData[];
  onBackToLibrary: () => Promise<void> | void;
}

export function RunOutcomeScreen({
  status,
  floor,
  currentRoom,
  totalRooms,
  gold,
  deckSize,
  relicCount,
  difficultyLevel,
  earnedResourcesSummary,
  earnedResourceMultiplier,
  newlyUnlockedCards,
  newlyUnlockedRelics,
  onBackToLibrary,
}: RunOutcomeScreenProps) {
  const { t } = useTranslation();
  const totalNewUnlocks =
    newlyUnlockedCards.length + newlyUnlockedRelics.length;

  const titleKey =
    status === "VICTORY"
      ? "run.victoryTitle"
      : status === "DEFEAT"
        ? "run.defeatTitle"
        : "run.abandonedTitle";

  const subtitle =
    status === "VICTORY"
      ? t("run.victorySubtitle", { floor })
      : status === "DEFEAT"
        ? t("run.defeatSubtitle")
        : t("run.abandonedSubtitle");

  const accentClass =
    status === "VICTORY"
      ? "text-emerald-300"
      : status === "DEFEAT"
        ? "text-rose-300"
        : "text-amber-300";

  const accentGlow =
    status === "VICTORY"
      ? "from-emerald-500/18 via-emerald-300/10 to-transparent"
      : status === "DEFEAT"
        ? "from-rose-500/18 via-rose-300/10 to-transparent"
        : "from-amber-500/18 via-amber-300/10 to-transparent";

  const badgeClass =
    status === "VICTORY"
      ? "border-emerald-400/35 bg-emerald-500/10 text-emerald-200"
      : status === "DEFEAT"
        ? "border-rose-400/35 bg-rose-500/10 text-rose-200"
        : "border-amber-400/35 bg-amber-500/10 text-amber-200";

  return (
    <div className="relative isolate px-4 py-4 sm:px-6 sm:py-8">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-x-8 top-0 h-64 rounded-full bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.16),transparent_68%)] blur-3xl" />
        <div
          className={cn(
            "absolute -left-12 top-10 h-56 w-56 rounded-full blur-[90px]",
            status === "VICTORY"
              ? "bg-emerald-500/18"
              : status === "DEFEAT"
                ? "bg-rose-500/18"
                : "bg-amber-500/18"
          )}
        />
        <div className="bg-sky-500/8 absolute bottom-0 right-0 h-64 w-64 rounded-full blur-[110px]" />
      </div>

      <section className="bg-[#071019]/88 relative overflow-hidden rounded-[28px] border border-amber-500/20 shadow-[0_22px_90px_rgba(0,0,0,0.42)]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(250,204,21,0.08),transparent_34%,rgba(56,189,248,0.08))]" />
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-r",
            accentGlow
          )}
        />
        <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(251,191,36,0.24)_1px,transparent_1px),linear-gradient(90deg,rgba(251,191,36,0.24)_1px,transparent_1px)] [background-size:34px_34px]" />

        <div className="relative flex flex-col gap-8 p-6 sm:p-8 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl space-y-4">
            <span
              className={cn(
                "inline-flex w-fit items-center rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.34em]",
                badgeClass
              )}
            >
              {t(titleKey)}
            </span>
            <div className="space-y-3">
              <h2
                className={cn(
                  cinzel.className,
                  "text-4xl font-semibold uppercase tracking-[0.08em] sm:text-5xl",
                  accentClass
                )}
              >
                {t(titleKey)}
              </h2>
              <p className="max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
                {subtitle}
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.26em] text-amber-100/40">
              <span>{t("map.floorLabel", { floor })}</span>
              <span>
                {t("run.reachedRoom", {
                  room: currentRoom,
                  total: totalRooms,
                })}
              </span>
              <span>{t("run.unlockCount", { count: totalNewUnlocks })}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:min-w-[32rem]">
            <OutcomeStatCard label={t("layout.gold")} value={`${gold}`} />
            <OutcomeStatCard
              label={t("layout.deck")}
              value={`${deckSize}`}
              detail={t("run.deckSize", { count: deckSize })}
            />
            <OutcomeStatCard
              label={t("layout.relics")}
              value={`${relicCount}`}
              detail={t("run.relicCount", { count: relicCount })}
            />
            <OutcomeStatCard
              label={t("map.floorLabel", { floor })}
              value={`${currentRoom}/${totalRooms}`}
              detail={t("run.reachedRoom", {
                room: currentRoom,
                total: totalRooms,
              })}
            />
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="bg-slate-950/78 rounded-[24px] border border-slate-800 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.3)]">
          <SectionTitle className={cinzel.className}>
            {t("run.resourcesGained")}
          </SectionTitle>
          {earnedResourceMultiplier !== 1 ? (
            <div
              className={cn(
                "mt-4 rounded-2xl border px-4 py-3 text-sm leading-relaxed",
                earnedResourceMultiplier < 1
                  ? "border-amber-400/20 bg-amber-500/10 text-amber-100"
                  : "border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
              )}
            >
              {earnedResourceMultiplier < 1
                ? t("run.resourceModifierReduced", {
                    level: difficultyLevel ?? 0,
                    percent: Math.round(earnedResourceMultiplier * 100),
                  })
                : t("run.resourceModifierBonus", {
                    level: difficultyLevel ?? 0,
                    percent: Math.round(earnedResourceMultiplier * 100),
                  })}
            </div>
          ) : null}
          {earnedResourcesSummary.length === 0 ? (
            <EmptyPanel>{t("run.none")}</EmptyPanel>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {earnedResourcesSummary.map(([resource, amount]) => (
                <div
                  key={resource}
                  className="border-amber-500/12 rounded-2xl border bg-gradient-to-br from-slate-900/90 to-slate-950 px-4 py-3"
                >
                  <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">
                    {t(`reward.resources.${resource}`, {
                      defaultValue: resource,
                    })}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-amber-100">
                    +{amount}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-slate-950/78 rounded-[24px] border border-slate-800 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.3)]">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-4">
              <SectionTitle className={cinzel.className}>
                {t("run.cardsUnlocked")}
              </SectionTitle>
              {newlyUnlockedCards.length === 0 ? (
                <EmptyPanel>{t("run.none")}</EmptyPanel>
              ) : (
                <div className="grid gap-3">
                  {newlyUnlockedCards.map((card) => (
                    <UnlockedCardTile key={card.id} definition={card} />
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <SectionTitle className={cinzel.className}>
                {t("run.relicsUnlocked", {
                  defaultValue: t("layout.relics"),
                })}
              </SectionTitle>
              {newlyUnlockedRelics.length === 0 ? (
                <EmptyPanel>{t("run.none")}</EmptyPanel>
              ) : (
                <div className="grid gap-3">
                  {newlyUnlockedRelics.map((relic) => (
                    <UnlockedRelicTile key={relic.id} relic={relic} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      <div className="mt-6 flex justify-center">
        <Link
          href="/library"
          className={cn(
            cinzel.className,
            "hover:bg-amber-500/16 inline-flex items-center rounded-full border border-amber-400/30 bg-amber-500/10 px-7 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-amber-100 transition hover:-translate-y-0.5 hover:border-amber-300/60"
          )}
          onClick={async (event) => {
            event.preventDefault();
            await onBackToLibrary();
          }}
        >
          {t("run.backToLibrary")}
        </Link>
      </div>
    </div>
  );
}

function OutcomeStatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="border-white/8 rounded-2xl border bg-black/20 p-4 backdrop-blur-sm">
      <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-amber-50">{value}</p>
      {detail ? (
        <p className="mt-1 text-xs leading-relaxed text-slate-400">{detail}</p>
      ) : null}
    </div>
  );
}

function SectionTitle({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <p
      className={cn(
        className,
        "text-sm font-semibold uppercase tracking-[0.22em] text-amber-100"
      )}
    >
      {children}
    </p>
  );
}

function EmptyPanel({ children }: { children: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/55 px-4 py-6 text-sm text-slate-500">
      {children}
    </div>
  );
}

function UnlockedCardTile({ definition }: { definition: CardDefinition }) {
  const { t } = useTranslation();
  const localizedName = localizeCardName(definition, t);
  const localizedType = localizeCardType(definition.type, t);

  return (
    <Tooltip
      content={
        <div className="p-1">
          <GameCard definition={definition} size="md" className="shadow-none" />
        </div>
      }
      className="block"
    >
      <div className="border-amber-500/14 hover:border-amber-300/28 group rounded-2xl border bg-gradient-to-br from-slate-900/95 to-slate-950 px-4 py-3 transition duration-150 hover:-translate-y-1 hover:shadow-[0_18px_30px_rgba(251,191,36,0.08)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.28em] text-amber-300/55">
              {definition.rarity}
            </p>
            <p className="mt-1 text-sm font-semibold text-amber-50">
              {localizedName}
            </p>
          </div>
          <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-200/80">
            {definition.energyCost}
          </span>
        </div>
        <p className="mt-2 text-xs text-slate-400">{localizedType}</p>
      </div>
    </Tooltip>
  );
}

function UnlockedRelicTile({ relic }: { relic: RelicDefinitionData }) {
  const localizedName = localizeRelicName(relic.id, relic.name);
  const localizedDescription = localizeRelicDescription(
    relic.id,
    relic.description
  );

  return (
    <Tooltip content={<RelicPreview relic={relic} />} className="block">
      <div className="border-sky-500/14 hover:border-sky-300/28 group rounded-2xl border bg-gradient-to-br from-slate-900/95 to-slate-950 px-4 py-3 transition duration-150 hover:-translate-y-1 hover:shadow-[0_18px_30px_rgba(56,189,248,0.08)]">
        <p className="text-[10px] uppercase tracking-[0.28em] text-sky-300/55">
          {relic.rarity}
        </p>
        <p className="mt-1 text-sm font-semibold text-slate-100">
          {localizedName}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-slate-400">
          {localizedDescription}
        </p>
      </div>
    </Tooltip>
  );
}

function RelicPreview({ relic }: { relic: RelicDefinitionData }) {
  const localizedName = localizeRelicName(relic.id, relic.name);
  const localizedDescription = localizeRelicDescription(
    relic.id,
    relic.description
  );

  return (
    <div className="w-[220px] rounded-2xl border border-sky-400/25 bg-slate-950/95 p-4">
      <p className="text-[10px] uppercase tracking-[0.3em] text-sky-300/60">
        {relic.rarity}
      </p>
      <p className={cn(cinzel.className, "mt-2 text-base text-slate-100")}>
        {localizedName}
      </p>
      <p className="mt-3 text-xs leading-relaxed text-slate-300">
        {localizedDescription}
      </p>
    </div>
  );
}

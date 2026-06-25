"use client";

import { useTranslation } from "react-i18next";
import {
  RogueAlert,
  RogueCard,
  RogueEmpty,
  RoguePageHeader,
  RogueTag,
} from "@/components/ui/rogue";
import type { RunHistoryEntry } from "@/server/actions/runs";

interface RunHistoryClientProps {
  entries: RunHistoryEntry[];
  loadError: string | null;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const isVictory = status === "VICTORY";
  return (
    <RogueTag
      bordered
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
        isVictory
          ? "border-emerald-400/55 bg-emerald-400/15 text-emerald-100"
          : "border-rose-400/55 bg-rose-400/15 text-rose-100"
      }`}
    >
      {t(`runs.status.${status}`, status)}
    </RogueTag>
  );
}

export function RunHistoryClient({
  entries,
  loadError,
}: RunHistoryClientProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-5">
      <RoguePageHeader
        title={t("runs.title")}
        subtitle={t("runs.subtitle")}
        backHref="/"
        backLabel={
          <>
            {"<-"} {t("runs.backHome")}
          </>
        }
        actions={
          <RogueTag
            bordered
            className="rounded-lg border border-amber-200/25 bg-amber-200/10 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-amber-100/80"
          >
            {t("runs.kicker")}
          </RogueTag>
        }
      />

      {loadError && (
        <RogueAlert
          type="error"
          showIcon
          message={t("runs.loadError", { message: loadError })}
          className="!rounded-xl !border !border-rose-400/35 !bg-rose-950/35 !text-rose-100"
        />
      )}

      {entries.length === 0 ? (
        <RogueCard
          className="rounded-2xl border border-amber-100/15 bg-[#0A1118]/80"
          styles={{ body: { padding: 32 } }}
        >
          <RogueEmpty
            description={t("runs.empty")}
            className="[&_.ant-empty-description]:!text-sm [&_.ant-empty-description]:!text-amber-100/65"
          />
        </RogueCard>
      ) : (
        <section className="space-y-3">
          {entries.map((entry) => (
            <RunCard key={entry.id} entry={entry} />
          ))}
        </section>
      )}
    </div>
  );
}

function RunCard({ entry }: { entry: RunHistoryEntry }) {
  const { t } = useTranslation();

  const characterName = t(`characters.${entry.characterId}.name`, {
    defaultValue: entry.characterId,
  });
  const biomeName = t(`biomeSelection.biomes.${entry.biome}.name`, {
    defaultValue: entry.biome,
  });

  return (
    <RogueCard
      className={`rounded-xl border ${
        entry.status === "VICTORY"
          ? "border-emerald-400/20 bg-[#0A1118]/85"
          : "border-rose-400/15 bg-[#0A1118]/85"
      }`}
      styles={{ body: { padding: "12px 16px" } }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: status + perso + biome */}
        <div className="flex min-w-0 items-center gap-3">
          <StatusBadge status={entry.status} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-amber-50">
              {characterName}
              <span className="mx-1.5 text-amber-100/30">·</span>
              <span className="font-normal text-amber-100/70">{biomeName}</span>
            </p>
            <p className="mt-0.5 text-[0.68rem] text-amber-100/45">
              {formatDate(entry.createdAt)}
            </p>
          </div>
        </div>

        {/* Right: stats */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-amber-100/70">
          <Stat label={t("runs.columns.floor")} value={String(entry.floor)} />
          <Stat
            label={t("runs.columns.difficulty")}
            value={`D${entry.difficultyLevel}`}
          />
          <Stat
            label={t("runs.columns.score")}
            value={String(entry.powerScore)}
            highlight
          />
          <Stat
            label={t("runs.columns.relics")}
            value={String(entry.relicCount)}
          />
          <Stat
            label={t("runs.columns.stories")}
            value={String(entry.unlockedStoryCount)}
          />
        </div>
      </div>
    </RogueCard>
  );
}

function Stat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-amber-100/40">
        {label}
      </span>
      <span
        className={`text-sm font-semibold ${highlight ? "text-amber-300" : "text-amber-50/90"}`}
      >
        {value}
      </span>
    </div>
  );
}

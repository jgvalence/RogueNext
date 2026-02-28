"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import type { LeaderboardEntry } from "@/server/actions/progression";

interface LeaderboardClientProps {
  entries: LeaderboardEntry[];
  currentUserId: string | null;
  loadError: string | null;
}

function formatPercent(value: number): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  return `${(safeValue * 100).toFixed(1)}%`;
}

function formatDurationMs(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
  }

  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

function getRankStyle(rank: number): string {
  if (rank === 1) return "border-amber-300/70 bg-amber-300/20 text-amber-100";
  if (rank === 2) return "border-slate-300/60 bg-slate-200/20 text-slate-100";
  if (rank === 3)
    return "border-orange-300/60 bg-orange-300/20 text-orange-100";
  return "border-amber-100/20 bg-amber-100/5 text-amber-100/80";
}

function DifficultyTimes({
  items,
  emptyLabel,
}: {
  items: LeaderboardEntry["bestTimesByDifficulty"];
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return <span className="text-amber-100/55">{emptyLabel}</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item.difficulty}
          className="rounded border border-amber-100/20 bg-amber-100/10 px-2 py-0.5 text-[0.68rem] font-semibold text-amber-100/90"
        >
          D{item.difficulty}: {formatDurationMs(item.timeMs)}
        </span>
      ))}
    </div>
  );
}

export function LeaderboardClient({
  entries,
  currentUserId,
  loadError,
}: LeaderboardClientProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-amber-100/15 bg-[#0A1118]/85 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <Link
            href="/"
            className="rounded-lg border border-amber-100/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-100/75 transition hover:border-amber-300/45 hover:text-amber-100"
          >
            {"<-"} {t("leaderboard.backHome")}
          </Link>
          <span className="rounded-lg border border-amber-200/25 bg-amber-200/10 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-amber-100/80">
            {t("leaderboard.kicker")}
          </span>
        </div>

        <h1 className="text-2xl font-black uppercase tracking-[0.08em] text-amber-100 sm:text-4xl">
          {t("leaderboard.title")}
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-amber-100/70 sm:text-base">
          {t("leaderboard.subtitle")}
        </p>
      </header>

      {loadError && (
        <div className="rounded-xl border border-rose-400/35 bg-rose-950/35 px-4 py-3 text-sm text-rose-100">
          {t("leaderboard.loadError", { message: loadError })}
        </div>
      )}

      {entries.length === 0 ? (
        <div className="rounded-2xl border border-amber-100/15 bg-[#0A1118]/80 p-8 text-center text-sm text-amber-100/65">
          {t("leaderboard.empty")}
        </div>
      ) : (
        <>
          <section className="hidden overflow-x-auto rounded-2xl border border-amber-100/15 bg-[#0A1118]/80 shadow-[0_16px_40px_rgba(0,0,0,0.3)] md:block">
            <table className="w-full min-w-[840px] border-collapse text-left">
              <thead>
                <tr className="border-b border-amber-100/10 text-xs uppercase tracking-[0.16em] text-amber-100/55">
                  <th className="px-4 py-3">{t("leaderboard.columns.rank")}</th>
                  <th className="px-4 py-3">
                    {t("leaderboard.columns.player")}
                  </th>
                  <th className="px-4 py-3">{t("leaderboard.columns.wins")}</th>
                  <th className="px-4 py-3">{t("leaderboard.columns.runs")}</th>
                  <th className="px-4 py-3">
                    {t("leaderboard.columns.winRate")}
                  </th>
                  <th className="px-4 py-3">
                    {t("leaderboard.columns.bestInfiniteFloor")}
                  </th>
                  <th className="px-4 py-3">
                    {t("leaderboard.columns.bestDifficulty")}
                  </th>
                  <th className="px-4 py-3">
                    {t("leaderboard.columns.bestTime")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const isCurrentUser = entry.userId === currentUserId;
                  const displayName =
                    entry.playerName ??
                    t("leaderboard.playerFallback", { id: entry.playerTag });

                  return (
                    <tr
                      key={entry.userId}
                      className={`border-amber-100/8 border-b text-sm text-amber-50/90 ${isCurrentUser ? "bg-amber-300/10" : "hover:bg-amber-100/5"}`}
                    >
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex min-w-12 items-center justify-center rounded-full border px-2 py-0.5 text-xs font-semibold ${getRankStyle(entry.rank)}`}
                        >
                          #{entry.rank}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-amber-50">
                        {displayName}
                        {isCurrentUser && (
                          <span className="ml-2 rounded border border-amber-200/45 bg-amber-200/20 px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-amber-100">
                            {t("leaderboard.you")}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {entry.wonRuns.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        {entry.totalRuns.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        {formatPercent(entry.winRate)}
                      </td>
                      <td className="px-4 py-3">
                        {entry.bestInfiniteFloor > 0
                          ? entry.bestInfiniteFloor
                          : t("leaderboard.none")}
                      </td>
                      <td className="px-4 py-3">
                        {entry.highestDifficulty == null
                          ? t("leaderboard.none")
                          : entry.highestDifficulty}
                      </td>
                      <td className="px-4 py-3">
                        <DifficultyTimes
                          items={entry.bestTimesByDifficulty}
                          emptyLabel={t("leaderboard.noTime")}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          <section className="space-y-3 md:hidden">
            {entries.map((entry) => {
              const isCurrentUser = entry.userId === currentUserId;
              const displayName =
                entry.playerName ??
                t("leaderboard.playerFallback", { id: entry.playerTag });

              return (
                <article
                  key={entry.userId}
                  className={`rounded-xl border p-4 ${isCurrentUser ? "border-amber-300/45 bg-amber-300/10" : "border-amber-100/15 bg-[#0A1118]/85"}`}
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${getRankStyle(entry.rank)}`}
                    >
                      #{entry.rank}
                    </span>
                    {isCurrentUser && (
                      <span className="rounded border border-amber-200/45 bg-amber-200/20 px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-amber-100">
                        {t("leaderboard.you")}
                      </span>
                    )}
                  </div>

                  <p className="text-base font-semibold text-amber-50">
                    {displayName}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-amber-100/75">
                    <div>
                      <p className="uppercase tracking-[0.14em] text-amber-100/50">
                        {t("leaderboard.columns.wins")}
                      </p>
                      <p className="mt-1 text-sm text-amber-50">
                        {entry.wonRuns.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="uppercase tracking-[0.14em] text-amber-100/50">
                        {t("leaderboard.columns.runs")}
                      </p>
                      <p className="mt-1 text-sm text-amber-50">
                        {entry.totalRuns.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="uppercase tracking-[0.14em] text-amber-100/50">
                        {t("leaderboard.columns.winRate")}
                      </p>
                      <p className="mt-1 text-sm text-amber-50">
                        {formatPercent(entry.winRate)}
                      </p>
                    </div>
                    <div>
                      <p className="uppercase tracking-[0.14em] text-amber-100/50">
                        {t("leaderboard.columns.bestDifficulty")}
                      </p>
                      <p className="mt-1 text-sm text-amber-50">
                        {entry.highestDifficulty == null
                          ? t("leaderboard.none")
                          : entry.highestDifficulty}
                      </p>
                    </div>
                    <div>
                      <p className="uppercase tracking-[0.14em] text-amber-100/50">
                        {t("leaderboard.columns.bestInfiniteFloor")}
                      </p>
                      <p className="mt-1 text-sm text-amber-50">
                        {entry.bestInfiniteFloor > 0
                          ? entry.bestInfiniteFloor
                          : t("leaderboard.none")}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="uppercase tracking-[0.14em] text-amber-100/50">
                        {t("leaderboard.columns.bestTime")}
                      </p>
                      <div className="mt-1">
                        <DifficultyTimes
                          items={entry.bestTimesByDifficulty}
                          emptyLabel={t("leaderboard.noTime")}
                        />
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        </>
      )}
    </div>
  );
}

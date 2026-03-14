"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  RogueAlert,
  RogueCard,
  RogueEmpty,
  RoguePageHeader,
  RogueSelect,
  RogueTable,
  RogueTag,
} from "@/components/ui/rogue";
import type {
  LeaderboardEntry,
  LeaderboardSortMode,
} from "@/server/actions/progression";

const LEADERBOARD_TIME_DIFFICULTIES = [0, 1, 2, 3, 4, 5] as const;

interface LeaderboardClientProps {
  entries: LeaderboardEntry[];
  currentUserId: string | null;
  loadError: string | null;
  entryLimit: number;
  sortMode: LeaderboardSortMode;
  timeDifficulty: number | null;
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

function getRankTagClass(rank: number): string {
  if (rank === 1)
    return "!border-amber-300/70 !bg-amber-300/20 !text-amber-100";
  if (rank === 2)
    return "!border-slate-300/60 !bg-slate-200/20 !text-slate-100";
  if (rank === 3)
    return "!border-orange-300/60 !bg-orange-300/20 !text-orange-100";
  return "!border-amber-100/20 !bg-amber-100/5 !text-amber-100/80";
}

function buildLeaderboardHref(
  pathname: string,
  searchParams: { toString(): string },
  sortMode: LeaderboardSortMode,
  timeDifficulty: number | null
): string {
  const params = new URLSearchParams(searchParams.toString());

  if (sortMode === "progression") {
    params.delete("sort");
    params.delete("difficulty");
  } else {
    params.set("sort", sortMode);
    if (timeDifficulty == null) {
      params.delete("difficulty");
    } else {
      params.set("difficulty", String(timeDifficulty));
    }
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function DifficultyTimes({
  items,
  emptyLabel,
  highlightDifficulty = null,
}: {
  items: LeaderboardEntry["bestTimesByDifficulty"];
  emptyLabel: string;
  highlightDifficulty?: number | null;
}) {
  if (items.length === 0) {
    return <span className="text-amber-100/55">{emptyLabel}</span>;
  }

  const orderedItems =
    highlightDifficulty == null
      ? items
      : [...items].sort((a, b) => {
          if (a.difficulty === highlightDifficulty) return -1;
          if (b.difficulty === highlightDifficulty) return 1;
          return a.difficulty - b.difficulty;
        });

  return (
    <div className="flex flex-wrap gap-1.5">
      {orderedItems.map((item) => (
        <RogueTag
          key={item.difficulty}
          bordered
          className={`rounded border px-2 py-0.5 text-[0.68rem] font-semibold ${
            item.difficulty === highlightDifficulty
              ? "border-sky-300/55 bg-sky-300/20 text-sky-50"
              : "border-amber-100/20 bg-amber-100/10 text-amber-100/90"
          }`}
        >
          D{item.difficulty}: {formatDurationMs(item.timeMs)}
        </RogueTag>
      ))}
    </div>
  );
}

export function LeaderboardClient({
  entries,
  currentUserId,
  loadError,
  entryLimit,
  sortMode,
  timeDifficulty,
}: LeaderboardClientProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sortOptions = useMemo(
    () => [
      {
        label: t("leaderboard.filters.sortOptions.progression"),
        value: "progression",
      },
      {
        label: t("leaderboard.filters.sortOptions.victoryTime"),
        value: "victory_time",
      },
    ],
    [t]
  );

  const difficultyOptions = useMemo(
    () => [
      {
        label: t("leaderboard.filters.allDifficulties"),
        value: "all",
      },
      ...LEADERBOARD_TIME_DIFFICULTIES.map((difficulty) => ({
        label: `D${difficulty}`,
        value: String(difficulty),
      })),
    ],
    [t]
  );

  const sortSummary =
    sortMode === "victory_time"
      ? timeDifficulty == null
        ? t("leaderboard.filters.summaryVictoryTimeAll")
        : t("leaderboard.filters.summaryVictoryTimeDifficulty", {
            difficulty: timeDifficulty,
          })
      : t("leaderboard.filters.summaryProgression");

  const bestTimeLabel =
    sortMode === "victory_time"
      ? timeDifficulty == null
        ? t("leaderboard.columns.bestTimeVictory")
        : t("leaderboard.columns.bestTimeDifficulty", {
            difficulty: timeDifficulty,
          })
      : t("leaderboard.columns.bestTime");

  const handleSortChange = (value: string) => {
    const nextSortMode =
      value === "victory_time" ? "victory_time" : "progression";
    router.replace(
      buildLeaderboardHref(pathname, searchParams, nextSortMode, timeDifficulty),
      { scroll: false }
    );
  };

  const handleDifficultyChange = (value: string) => {
    const nextDifficulty = value === "all" ? null : Number(value);
    router.replace(
      buildLeaderboardHref(
        pathname,
        searchParams,
        "victory_time",
        Number.isInteger(nextDifficulty) ? nextDifficulty : null
      ),
      { scroll: false }
    );
  };

  const columns = useMemo(
    () => {
      const rankColumn = {
        title: t("leaderboard.columns.rank"),
        key: "rank",
        width: 110,
        render: (_: unknown, entry: LeaderboardEntry) => (
          <RogueTag
            bordered
            className={`inline-flex min-w-12 items-center justify-center rounded-full border px-2 py-0.5 text-xs font-semibold ${getRankTagClass(entry.rank)}`}
          >
            #{entry.rank}
          </RogueTag>
        ),
      };

      const playerColumn = {
        title: t("leaderboard.columns.player"),
        key: "player",
        render: (_: unknown, entry: LeaderboardEntry) => {
          const isCurrentUser = entry.userId === currentUserId;
          const displayName =
            entry.playerName ??
            t("leaderboard.playerFallback", { id: entry.playerTag });

          return (
            <div className="font-semibold text-amber-50">
              {displayName}
              {isCurrentUser && (
                <RogueTag
                  bordered
                  className="ml-2 rounded border border-amber-200/45 bg-amber-200/20 px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-amber-100"
                >
                  {t("leaderboard.you")}
                </RogueTag>
              )}
            </div>
          );
        },
      };

      const winsColumn = {
        title: t("leaderboard.columns.wins"),
        key: "wins",
        dataIndex: "wonRuns" as const,
        render: (value: number) => value.toLocaleString(),
      };

      const bestInfiniteFloorColumn = {
        title: t("leaderboard.columns.bestInfiniteFloor"),
        key: "bestInfiniteFloor",
        dataIndex: "bestInfiniteFloor" as const,
        render: (value: number) => (value > 0 ? value : t("leaderboard.none")),
      };

      const bestDifficultyColumn = {
        title: t("leaderboard.columns.bestDifficulty"),
        key: "highestDifficulty",
        dataIndex: "highestDifficulty" as const,
        render: (value: number | null) =>
          value == null ? t("leaderboard.none") : value,
      };

      const bestTimeColumn = {
        title: bestTimeLabel,
        key: "bestTime",
        render: (_: unknown, entry: LeaderboardEntry) => (
          <DifficultyTimes
            items={entry.bestTimesByDifficulty}
            emptyLabel={t("leaderboard.noTime")}
            highlightDifficulty={
              sortMode === "victory_time" ? timeDifficulty : null
            }
          />
        ),
      };

      return sortMode === "victory_time"
        ? [
            rankColumn,
            playerColumn,
            bestTimeColumn,
            bestDifficultyColumn,
            bestInfiniteFloorColumn,
            winsColumn,
          ]
        : [
            rankColumn,
            playerColumn,
            winsColumn,
            bestInfiniteFloorColumn,
            bestDifficultyColumn,
            bestTimeColumn,
          ];
    },
    [bestTimeLabel, currentUserId, sortMode, t, timeDifficulty]
  );

  return (
    <div className="space-y-5">
      <RoguePageHeader
        title={t("leaderboard.title")}
        subtitle={t("leaderboard.subtitle")}
        backHref="/"
        backLabel={
          <>
            {"<-"} {t("leaderboard.backHome")}
          </>
        }
        actions={
          <RogueTag
            bordered
            className="rounded-lg border border-amber-200/25 bg-amber-200/10 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-amber-100/80"
          >
            {t("leaderboard.kicker")}
          </RogueTag>
        }
      />

      {loadError && (
        <RogueAlert
          type="error"
          showIcon
          message={t("leaderboard.loadError", { message: loadError })}
          className="!rounded-xl !border !border-rose-400/35 !bg-rose-950/35 !text-rose-100"
        />
      )}

      <RogueCard
        className="rounded-2xl border border-amber-100/15 bg-[#0A1118]/80"
        styles={{ body: { padding: 16 } }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-amber-100/55">
              {t("leaderboard.filters.kicker")}
            </p>
            <p className="text-sm text-amber-50/90">{sortSummary}</p>
            <p className="text-xs text-amber-100/55">
              {t("leaderboard.filters.limit", { count: entryLimit })}
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="min-w-[220px]">
              <p className="mb-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-amber-100/55">
                {t("leaderboard.filters.sortLabel")}
              </p>
              <RogueSelect
                value={sortMode}
                onChange={(value) => handleSortChange(String(value))}
                options={sortOptions}
                className="w-full"
              />
            </div>

            {sortMode === "victory_time" && (
              <div className="min-w-[220px]">
                <p className="mb-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-amber-100/55">
                  {t("leaderboard.filters.difficultyLabel")}
                </p>
                <RogueSelect
                  value={timeDifficulty == null ? "all" : String(timeDifficulty)}
                  onChange={(value) => handleDifficultyChange(String(value))}
                  options={difficultyOptions}
                  className="w-full"
                />
              </div>
            )}
          </div>
        </div>
      </RogueCard>

      {entries.length === 0 ? (
        <RogueCard
          className="rounded-2xl border border-amber-100/15 bg-[#0A1118]/80 p-8"
          styles={{ body: { padding: 32 } }}
        >
          <RogueEmpty
            description={t("leaderboard.empty")}
            className="[&_.ant-empty-description]:!text-sm [&_.ant-empty-description]:!text-amber-100/65"
          />
        </RogueCard>
      ) : (
        <>
          <RogueTable<LeaderboardEntry>
            className="hidden overflow-x-auto rounded-2xl border border-amber-100/15 bg-[#0A1118]/80 shadow-[0_16px_40px_rgba(0,0,0,0.3)] md:block [&_.ant-table-tbody>tr>td]:!border-b-amber-100/10 [&_.ant-table-tbody>tr>td]:!bg-transparent [&_.ant-table-tbody>tr>td]:!text-sm [&_.ant-table-tbody>tr>td]:!text-amber-50/90 [&_.ant-table-thead>tr>th]:!border-b-amber-100/10 [&_.ant-table-thead>tr>th]:!bg-transparent [&_.ant-table-thead>tr>th]:!text-xs [&_.ant-table-thead>tr>th]:!font-semibold [&_.ant-table-thead>tr>th]:!uppercase [&_.ant-table-thead>tr>th]:!tracking-[0.16em] [&_.ant-table-thead>tr>th]:!text-amber-100/55 [&_.ant-table]:!bg-transparent"
            dataSource={entries}
            columns={columns}
            rowKey={(entry) => entry.userId}
            pagination={false}
            scroll={{ x: 840 }}
            rowClassName={(entry) =>
              entry.userId === currentUserId
                ? "!bg-amber-300/10"
                : "hover:!bg-amber-100/5"
            }
          />

          <section className="space-y-3 md:hidden">
            {entries.map((entry) => {
              const isCurrentUser = entry.userId === currentUserId;
              const displayName =
                entry.playerName ??
                t("leaderboard.playerFallback", { id: entry.playerTag });

              return (
                <RogueCard
                  key={entry.userId}
                  className={`rounded-xl border ${
                    isCurrentUser
                      ? "border-amber-300/45 bg-amber-300/10"
                      : "border-amber-100/15 bg-[#0A1118]/85"
                  }`}
                  styles={{ body: { padding: 16 } }}
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <RogueTag
                      bordered
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${getRankTagClass(entry.rank)}`}
                    >
                      #{entry.rank}
                    </RogueTag>
                    {isCurrentUser && (
                      <RogueTag
                        bordered
                        className="rounded border border-amber-200/45 bg-amber-200/20 px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-amber-100"
                      >
                        {t("leaderboard.you")}
                      </RogueTag>
                    )}
                  </div>

                  <p className="text-base font-semibold text-amber-50">
                    {displayName}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-amber-100/75">
                    {sortMode === "victory_time" ? (
                      <>
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
                        <div>
                          <p className="uppercase tracking-[0.14em] text-amber-100/50">
                            {t("leaderboard.columns.wins")}
                          </p>
                          <p className="mt-1 text-sm text-amber-50">
                            {entry.wonRuns.toLocaleString()}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
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
                      </>
                    )}
                    <div className="col-span-2">
                      <p className="uppercase tracking-[0.14em] text-amber-100/50">
                        {bestTimeLabel}
                      </p>
                      <div className="mt-1">
                        <DifficultyTimes
                          items={entry.bestTimesByDifficulty}
                          emptyLabel={t("leaderboard.noTime")}
                          highlightDifficulty={
                            sortMode === "victory_time" ? timeDifficulty : null
                          }
                        />
                      </div>
                    </div>
                  </div>
                </RogueCard>
              );
            })}
          </section>
        </>
      )}
    </div>
  );
}

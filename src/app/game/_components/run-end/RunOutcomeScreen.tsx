"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { GAME_CONSTANTS } from "@/game/constants";

type RunOutcomeStatus = "VICTORY" | "DEFEAT" | "ABANDONED";

interface RunOutcomeScreenProps {
  status: RunOutcomeStatus;
  floor: number;
  currentRoom: number;
  gold: number;
  deckSize: number;
  relicCount: number;
  earnedResourcesSummary: Array<[string, number]>;
  newlyUnlockedCardNames: string[];
  onBackToLibrary: () => Promise<void> | void;
}

export function RunOutcomeScreen({
  status,
  floor,
  currentRoom,
  gold,
  deckSize,
  relicCount,
  earnedResourcesSummary,
  newlyUnlockedCardNames,
  onBackToLibrary,
}: RunOutcomeScreenProps) {
  const { t } = useTranslation();

  const titleClass =
    status === "VICTORY"
      ? "text-green-400"
      : status === "DEFEAT"
        ? "text-red-400"
        : "text-amber-400";

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

  return (
    <div className="flex flex-col items-center gap-4 py-4 sm:py-16">
      <h2 className={`text-4xl font-bold ${titleClass}`}>{t(titleKey)}</h2>
      <p className="text-gray-400">{subtitle}</p>
      {status === "VICTORY" ? (
        <div className="space-y-1 text-sm text-gray-500">
          <p>{t("run.goldEarned", { gold })}</p>
          <p>{t("run.deckSize", { count: deckSize })}</p>
          <p>{t("run.relicCount", { count: relicCount })}</p>
        </div>
      ) : (
        <div className="space-y-1 text-sm text-gray-500">
          <p>
            {t("run.reachedRoom", {
              room: currentRoom,
              total: GAME_CONSTANTS.ROOMS_PER_FLOOR,
            })}
          </p>
          <p>{t("run.goldSimple", { gold })}</p>
        </div>
      )}

      <div className="w-full max-w-2xl space-y-3 rounded-lg border border-gray-700 bg-gray-900/60 p-4 text-sm">
        <div>
          <p className="mb-1 font-semibold text-gray-300">
            {t("run.resourcesGained")}
          </p>
          {earnedResourcesSummary.length === 0 ? (
            <p className="text-gray-500">{t("run.none")}</p>
          ) : (
            <ul className="space-y-0.5 text-gray-400">
              {earnedResourcesSummary.map(([resource, amount]) => (
                <li key={resource}>
                  {resource}: +{amount}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <p className="mb-1 font-semibold text-gray-300">
            {t("run.cardsUnlocked")}
          </p>
          {newlyUnlockedCardNames.length === 0 ? (
            <p className="text-gray-500">{t("run.none")}</p>
          ) : (
            <ul className="space-y-0.5 text-gray-400">
              {newlyUnlockedCardNames.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="flex gap-3">
        <Link
          href="/library"
          className="rounded-lg border border-amber-700 px-6 py-3 font-bold text-amber-400 hover:border-amber-500 hover:text-amber-300"
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

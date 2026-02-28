"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import type { CardDefinition } from "@/game/schemas/cards";
import type { BiomeType, Rarity } from "@/game/schemas/enums";
import type { RunConditionCollectionRow } from "@/game/engine/run-conditions";
import {
  UpgradePreviewPortal,
  type UpgradePreviewHoverInfo,
} from "@/app/game/_components/shared/UpgradePreviewPortal";
import {
  localizeCardDescription,
  localizeCardName,
  localizeCardType,
} from "@/lib/i18n/card-text";

type CollectionTypeFilter = "ALL" | "ATTACK" | "DEFENSE" | "POWER";
type LockFilter = "ALL" | "UNLOCKED" | "LOCKED";

export interface CollectionCardRow {
  id: string;
  definition: CardDefinition;
  name: string;
  biome: BiomeType;
  type: "ATTACK" | "SKILL" | "POWER";
  rarity: Rarity;
  energyCost: number;
  description: string;
  unlocked: boolean;
  unlockCondition: string;
  missingCondition: string | null;
  unlockProgress: string | null;
}

interface CardCollectionClientProps {
  cards: CollectionCardRow[];
  runConditionRows: RunConditionCollectionRow[];
  runStats: {
    totalRuns: number;
    wonRuns: number;
  };
}

function matchesType(
  card: CollectionCardRow,
  filter: CollectionTypeFilter
): boolean {
  if (filter === "ALL") return true;
  if (filter === "ATTACK") return card.type === "ATTACK";
  if (filter === "POWER") return card.type === "POWER";
  return card.type === "SKILL";
}

function formatRunConditionFallback(conditionId: string): string {
  return conditionId
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function CardCollectionClient({
  cards,
  runConditionRows,
  runStats,
}: CardCollectionClientProps) {
  const { t } = useTranslation();
  const [biome, setBiome] = useState<BiomeType | "ALL">("ALL");
  const [type, setType] = useState<CollectionTypeFilter>("ALL");
  const [rarity, setRarity] = useState<Rarity | "ALL">("ALL");
  const [lock, setLock] = useState<LockFilter>("ALL");
  const [query, setQuery] = useState("");
  const [hoverInfo, setHoverInfo] = useState<UpgradePreviewHoverInfo | null>(
    null
  );

  const handleCardMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, definition: CardDefinition) => {
      setHoverInfo({ definition, anchorEl: e.currentTarget });
    },
    []
  );

  const handleCardMouseLeave = useCallback(() => {
    setHoverInfo(null);
  }, []);

  const filtered = useMemo(() => {
    return cards
      .filter((c) => (biome === "ALL" ? true : c.biome === biome))
      .filter((c) => matchesType(c, type))
      .filter((c) => (rarity === "ALL" ? true : c.rarity === rarity))
      .filter((c) =>
        lock === "ALL" ? true : lock === "UNLOCKED" ? c.unlocked : !c.unlocked
      )
      .filter((c) => {
        if (query.trim().length === 0) return true;
        const localizedName = localizeCardName(c.definition, t).toLowerCase();
        return localizedName.includes(query.trim().toLowerCase());
      });
  }, [cards, biome, type, rarity, lock, query, t]);

  const unlockedCount = cards.filter((c) => c.unlocked).length;

  return (
    <div className="min-h-screen bg-gray-950 px-6 py-6 text-white">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black">{t("collection.title")}</h1>
            <p className="text-sm text-gray-400">
              {t("collection.unlockedCount", {
                unlocked: unlockedCount,
                total: cards.length,
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/library"
              className="rounded border border-gray-700 px-3 py-2 text-sm text-gray-300 hover:border-gray-500 hover:text-white"
            >
              {t("collection.backToLibrary")}
            </Link>
            <Link
              href="/game"
              className="rounded bg-purple-600 px-4 py-2 text-sm font-bold text-white hover:bg-purple-500"
            >
              {t("collection.startRun")}
            </Link>
          </div>
        </div>

        <section className="rounded-lg border border-gray-800 bg-gray-900/60 p-4">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">
                {t("collection.runConditions.title")}
              </h2>
              <p className="text-xs text-gray-400">
                {t("collection.runConditions.summary", {
                  unlocked: runConditionRows.filter((row) => row.unlocked)
                    .length,
                  total: runConditionRows.length,
                  runs: runStats.totalRuns,
                  wins: runStats.wonRuns,
                })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {runConditionRows.map((row) => (
              <div
                key={row.id}
                className={`rounded-lg border p-3 ${
                  row.unlocked
                    ? "border-emerald-700/50 bg-emerald-950/20"
                    : "border-rose-800/50 bg-rose-950/20"
                }`}
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="font-bold text-white">
                    {t(`runCondition.definitions.${row.id}.name`, {
                      defaultValue: formatRunConditionFallback(row.id),
                    })}
                  </p>
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-semibold ${
                      row.unlocked
                        ? "bg-emerald-900 text-emerald-300"
                        : "bg-rose-900 text-rose-300"
                    }`}
                  >
                    {row.unlocked
                      ? t("collection.unlocked")
                      : t("collection.locked")}
                  </span>
                </div>

                <p className="text-xs text-gray-400">
                  {t(`runCondition.category.${row.category}`)}
                </p>
                <p className="mt-2 text-sm text-gray-300">
                  {t(`runCondition.definitions.${row.id}.description`, {
                    defaultValue: formatRunConditionFallback(row.id),
                  })}
                </p>

                {!row.unlocked && (
                  <div className="mt-3 rounded border border-rose-900 bg-rose-950/30 p-2 text-xs text-rose-200">
                    <p className="font-semibold">
                      {t("collection.runConditions.unlockCondition")}
                    </p>
                    <p>{formatRunConditionUnlock(row, t)}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-2 rounded-lg border border-gray-800 bg-gray-900/60 p-3 md:grid-cols-6">
          <select
            value={biome}
            onChange={(e) => setBiome(e.target.value as BiomeType | "ALL")}
            className="rounded border border-gray-700 bg-gray-950 px-2 py-1.5 text-sm"
          >
            <option value="ALL">{t("collection.allBiomes")}</option>
            <option value="LIBRARY">{t("biome.LIBRARY")}</option>
            <option value="VIKING">{t("biome.VIKING")}</option>
            <option value="GREEK">{t("biome.GREEK")}</option>
            <option value="EGYPTIAN">{t("biome.EGYPTIAN")}</option>
            <option value="LOVECRAFTIAN">{t("biome.LOVECRAFTIAN")}</option>
            <option value="AZTEC">{t("biome.AZTEC")}</option>
            <option value="CELTIC">{t("biome.CELTIC")}</option>
            <option value="RUSSIAN">{t("biome.RUSSIAN")}</option>
            <option value="AFRICAN">{t("biome.AFRICAN")}</option>
          </select>

          <select
            value={type}
            onChange={(e) => setType(e.target.value as CollectionTypeFilter)}
            className="rounded border border-gray-700 bg-gray-950 px-2 py-1.5 text-sm"
          >
            <option value="ALL">{t("collection.allTypes")}</option>
            <option value="ATTACK">{t("collection.attack")}</option>
            <option value="DEFENSE">{t("collection.defenseSkill")}</option>
            <option value="POWER">{t("collection.power")}</option>
          </select>

          <select
            value={rarity}
            onChange={(e) => setRarity(e.target.value as Rarity | "ALL")}
            className="rounded border border-gray-700 bg-gray-950 px-2 py-1.5 text-sm"
          >
            <option value="ALL">{t("collection.allRarities")}</option>
            <option value="COMMON">{t("gameCard.rarity.COMMON")}</option>
            <option value="UNCOMMON">{t("gameCard.rarity.UNCOMMON")}</option>
            <option value="RARE">{t("gameCard.rarity.RARE")}</option>
            <option value="STARTER">{t("gameCard.rarity.STARTER")}</option>
          </select>

          <select
            value={lock}
            onChange={(e) => setLock(e.target.value as LockFilter)}
            className="rounded border border-gray-700 bg-gray-950 px-2 py-1.5 text-sm"
          >
            <option value="ALL">{t("collection.allStates")}</option>
            <option value="UNLOCKED">{t("collection.unlocked")}</option>
            <option value="LOCKED">{t("collection.locked")}</option>
          </select>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("collection.searchPlaceholder")}
            className="rounded border border-gray-700 bg-gray-950 px-2 py-1.5 text-sm md:col-span-2"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((card) => {
            const localizedName = localizeCardName(card.definition, t);
            const localizedDescription = localizeCardDescription(
              card.definition,
              t
            );

            return (
              <div
                key={card.id}
                onMouseEnter={(e) => handleCardMouseEnter(e, card.definition)}
                onMouseLeave={handleCardMouseLeave}
                className={`relative rounded-lg border p-3 ${
                  card.unlocked
                    ? "border-emerald-700/50 bg-emerald-950/20"
                    : "border-rose-800/50 bg-rose-950/20"
                }`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <p className="font-bold">{localizedName}</p>
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-semibold ${
                      card.unlocked
                        ? "bg-emerald-900 text-emerald-300"
                        : "bg-rose-900 text-rose-300"
                    }`}
                  >
                    {card.unlocked
                      ? t("collection.unlocked")
                      : t("collection.locked")}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  {t(`biome.${card.biome}`)} - {localizeCardType(card.type, t)}{" "}
                  - {t(`gameCard.rarity.${card.rarity}`)} - {card.energyCost}{" "}
                  {t("collection.energy")}
                </p>
                <p className="mt-2 text-sm text-gray-300">
                  {localizedDescription}
                </p>

                {!card.unlocked && (
                  <div className="mt-3 rounded border border-rose-900 bg-rose-950/30 p-2 text-xs text-rose-200">
                    <p className="font-semibold">{t("collection.whyLocked")}</p>
                    <p>
                      {t("collection.missingCondition")}:{" "}
                      {card.missingCondition ??
                        (card.unlockCondition === "alwaysUnlocked"
                          ? t("collection.alwaysUnlocked")
                          : card.unlockCondition)}
                    </p>
                    {card.unlockProgress && (
                      <p className="mt-1 text-rose-300">
                        {t("collection.progress")}: {card.unlockProgress}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <UpgradePreviewPortal info={hoverInfo} />
      </div>
    </div>
  );
}

function formatRunConditionUnlock(
  row: RunConditionCollectionRow,
  t: TFunction
): string {
  const needsRuns = row.unlock.totalRuns ?? 0;
  const needsWins = row.unlock.wonRuns ?? 0;
  if (needsRuns === 0 && needsWins === 0) {
    return t("collection.alwaysUnlocked");
  }
  if (needsRuns > 0 && needsWins > 0) {
    return t("collection.runConditions.unlockRunsAndWins", {
      runs: needsRuns,
      wins: needsWins,
    });
  }
  if (needsRuns > 0) {
    return t("collection.runConditions.unlockRuns", { runs: needsRuns });
  }
  return t("collection.runConditions.unlockWins", { wins: needsWins });
}

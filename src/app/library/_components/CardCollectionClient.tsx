"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import {
  RogueButton,
  RogueEmpty,
  RogueInput,
  RogueSelect,
  RogueTabs,
  RogueTag,
} from "@/components/ui/rogue";
import type { CardDefinition } from "@/game/schemas/cards";
import type { BiomeType, Rarity, RelicRarity } from "@/game/schemas/enums";
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
import {
  localizeEnemyName,
  localizeRelicDescription,
  localizeRelicName,
} from "@/lib/i18n/entity-text";
import {
  localizeRunConditionDescription,
  localizeRunConditionName,
} from "@/lib/i18n/run-condition-text";
import type { RelicUnlockRequirementState } from "@/game/engine/difficulty";

type CollectionTab = "RUN_OPTIONS" | "CARDS" | "RELICS";
type CollectionTypeFilter = "ALL" | "ATTACK" | "DEFENSE" | "POWER";
type CardOwnershipFilter = "ALL" | "NEUTRAL" | "CHARACTER_TYPED";
type LockFilter = "ALL" | "UNLOCKED" | "LOCKED";
type RelicRarityFilter = "ALL" | RelicRarity;

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

export interface CollectionRelicRow {
  id: string;
  name: string;
  description: string;
  rarity: RelicRarity;
  sourceBossId?: string;
  unlocked: boolean;
  unlockRequirements: RelicUnlockRequirementState[];
  missingUnlockRequirement: RelicUnlockRequirementState | null;
}

interface CardCollectionClientProps {
  cards: CollectionCardRow[];
  relics: CollectionRelicRow[];
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

function matchesOwnership(
  card: CollectionCardRow,
  filter: CardOwnershipFilter
): boolean {
  if (filter === "ALL") return true;
  if (filter === "NEUTRAL") return !card.definition.characterId;
  return Boolean(card.definition.characterId);
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
  relics,
  runConditionRows,
  runStats,
}: CardCollectionClientProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [tab, setTab] = useState<CollectionTab>("CARDS");
  const [biome, setBiome] = useState<BiomeType | "ALL">("ALL");
  const [type, setType] = useState<CollectionTypeFilter>("ALL");
  const [ownership, setOwnership] = useState<CardOwnershipFilter>("ALL");
  const [rarity, setRarity] = useState<Rarity | "ALL">("ALL");
  const [lock, setLock] = useState<LockFilter>("ALL");
  const [query, setQuery] = useState("");
  const [relicRarity, setRelicRarity] = useState<RelicRarityFilter>("ALL");
  const [relicLock, setRelicLock] = useState<LockFilter>("ALL");
  const [relicQuery, setRelicQuery] = useState("");
  const [hoverInfo, setHoverInfo] = useState<UpgradePreviewHoverInfo | null>(
    null
  );
  const cardDefinitionById = new Map(
    cards.map((card) => [card.id, card.definition] as const)
  );

  const tabItems = useMemo(
    () => [
      { key: "RUN_OPTIONS", label: t("collection.tabs.runOptions") },
      { key: "CARDS", label: t("collection.tabs.cards") },
      { key: "RELICS", label: t("collection.tabs.relics") },
    ],
    [t]
  );
  const biomeOptions = useMemo(
    () => [
      { value: "ALL", label: t("collection.allBiomes") },
      { value: "LIBRARY", label: t("biome.LIBRARY") },
      { value: "VIKING", label: t("biome.VIKING") },
      { value: "GREEK", label: t("biome.GREEK") },
      { value: "EGYPTIAN", label: t("biome.EGYPTIAN") },
      { value: "LOVECRAFTIAN", label: t("biome.LOVECRAFTIAN") },
      { value: "AZTEC", label: t("biome.AZTEC") },
      { value: "CELTIC", label: t("biome.CELTIC") },
      { value: "RUSSIAN", label: t("biome.RUSSIAN") },
      { value: "AFRICAN", label: t("biome.AFRICAN") },
    ],
    [t]
  );
  const cardTypeOptions = useMemo(
    () => [
      { value: "ALL", label: t("collection.allTypes") },
      { value: "ATTACK", label: t("collection.attack") },
      { value: "DEFENSE", label: t("collection.defenseSkill") },
      { value: "POWER", label: t("collection.power") },
    ],
    [t]
  );
  const ownershipOptions = useMemo(
    () => [
      { value: "ALL", label: t("collection.allOwnerships") },
      { value: "NEUTRAL", label: t("collection.neutralOnly") },
      {
        value: "CHARACTER_TYPED",
        label: t("collection.characterTypedOnly"),
      },
    ],
    [t]
  );
  const rarityOptions = useMemo(
    () => [
      { value: "ALL", label: t("collection.allRarities") },
      { value: "COMMON", label: t("gameCard.rarity.COMMON") },
      { value: "UNCOMMON", label: t("gameCard.rarity.UNCOMMON") },
      { value: "RARE", label: t("gameCard.rarity.RARE") },
      { value: "STARTER", label: t("gameCard.rarity.STARTER") },
    ],
    [t]
  );
  const lockOptions = useMemo(
    () => [
      { value: "ALL", label: t("collection.allStates") },
      { value: "UNLOCKED", label: t("collection.unlocked") },
      { value: "LOCKED", label: t("collection.locked") },
    ],
    [t]
  );
  const relicRarityOptions = useMemo(
    () => [
      { value: "ALL", label: t("collection.allRarities") },
      { value: "COMMON", label: t("gameCard.rarity.COMMON") },
      { value: "UNCOMMON", label: t("gameCard.rarity.UNCOMMON") },
      { value: "RARE", label: t("gameCard.rarity.RARE") },
      { value: "BOSS", label: t("collection.bossRelicRarity") },
    ],
    [t]
  );

  useEffect(() => {
    if (tab !== "CARDS") {
      setHoverInfo(null);
    }
  }, [tab]);

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
      .filter((c) => matchesOwnership(c, ownership))
      .filter((c) => (rarity === "ALL" ? true : c.rarity === rarity))
      .filter((c) =>
        lock === "ALL" ? true : lock === "UNLOCKED" ? c.unlocked : !c.unlocked
      )
      .filter((c) => {
        if (query.trim().length === 0) return true;
        const localizedName = localizeCardName(c.definition, t).toLowerCase();
        return localizedName.includes(query.trim().toLowerCase());
      });
  }, [cards, biome, type, ownership, rarity, lock, query, t]);

  const filteredRelics = useMemo(() => {
    return relics
      .filter((r) => (relicRarity === "ALL" ? true : r.rarity === relicRarity))
      .filter((r) =>
        relicLock === "ALL"
          ? true
          : relicLock === "UNLOCKED"
            ? r.unlocked
            : !r.unlocked
      )
      .filter((r) => {
        if (relicQuery.trim().length === 0) return true;
        const normalizedQuery = relicQuery.trim().toLowerCase();
        const localizedName = localizeRelicName(r.id, r.name).toLowerCase();
        return localizedName.includes(normalizedQuery);
      });
  }, [relics, relicRarity, relicLock, relicQuery]);

  const unlockedCardCount = cards.filter((c) => c.unlocked).length;
  const lockedCardCount = cards.length - unlockedCardCount;
  const unlockedRelicCount = relics.filter((r) => r.unlocked).length;
  const lockedRelicCount = relics.length - unlockedRelicCount;
  const unlockedRunConditionCount = runConditionRows.filter(
    (row) => row.unlocked
  ).length;

  const summaryText = useMemo(() => {
    if (tab === "RUN_OPTIONS") {
      return t("collection.runConditions.summary", {
        unlocked: unlockedRunConditionCount,
        total: runConditionRows.length,
        runs: runStats.totalRuns,
        wins: runStats.wonRuns,
      });
    }
    if (tab === "RELICS") {
      return t("collection.relicSummary", {
        unlocked: unlockedRelicCount,
        locked: lockedRelicCount,
        total: relics.length,
      });
    }
    return t("collection.cardSummary", {
      unlocked: unlockedCardCount,
      locked: lockedCardCount,
      total: cards.length,
    });
  }, [
    tab,
    t,
    unlockedRunConditionCount,
    runConditionRows.length,
    runStats.totalRuns,
    runStats.wonRuns,
    unlockedRelicCount,
    lockedRelicCount,
    relics.length,
    unlockedCardCount,
    lockedCardCount,
    cards.length,
  ]);

  return (
    <div className="min-h-screen bg-gray-950 px-6 py-6 text-white">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black">{t("collection.title")}</h1>
            <p className="text-sm text-gray-400">{summaryText}</p>
          </div>
          <div className="flex items-center gap-2">
            <RogueButton
              onClick={() => router.push("/library")}
              className="!rounded !border !border-gray-700 !bg-transparent !text-sm !text-gray-300 hover:!border-gray-500 hover:!text-white"
            >
              {t("collection.backToLibrary")}
            </RogueButton>
            <RogueButton
              type="primary"
              onClick={() => router.push("/game")}
              className="!rounded !bg-purple-600 !text-sm !font-bold hover:!bg-purple-500"
            >
              {t("collection.startRun")}
            </RogueButton>
          </div>
        </div>

        <RogueTabs
          activeKey={tab}
          onChange={(value) => setTab(value as CollectionTab)}
          items={tabItems}
          className="rounded-lg border border-gray-800 bg-gray-900/60 px-3 pt-2"
        />

        {tab === "RUN_OPTIONS" && (
          <section className="rounded-lg border border-gray-800 bg-gray-900/60 p-4">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {t("collection.runConditions.title")}
                </h2>
                <p className="text-xs text-gray-400">
                  {t("collection.runConditions.summary", {
                    unlocked: unlockedRunConditionCount,
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
                      {localizeRunConditionName(row.id, t)}
                    </p>
                    <RogueTag
                      bordered={false}
                      className={`rounded px-2 py-0.5 text-xs font-semibold ${
                        row.unlocked
                          ? "bg-emerald-900 text-emerald-300"
                          : "bg-rose-900 text-rose-300"
                      }`}
                    >
                      {row.unlocked
                        ? t("collection.unlocked")
                        : t("collection.locked")}
                    </RogueTag>
                  </div>

                  <p className="text-xs text-gray-400">
                    {t(`runCondition.category.${row.category}`)}
                  </p>
                  <p className="mt-2 text-sm text-gray-300">
                    {localizeRunConditionDescription(row.id, t)}
                  </p>

                  {!row.unlocked && (
                    <div className="mt-3 rounded border border-rose-900 bg-rose-950/30 p-2 text-xs text-rose-200">
                      <p className="font-semibold">
                        {t("collection.runConditions.unlockCondition")}
                      </p>
                      <p>{formatRunConditionUnlock(row, t, cardDefinitionById)}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {tab === "CARDS" && (
          <>
            <div className="grid grid-cols-1 gap-2 rounded-lg border border-gray-800 bg-gray-900/60 p-3 md:grid-cols-7">
              <RogueSelect
                value={biome}
                onChange={(value) => setBiome(value as BiomeType | "ALL")}
                options={biomeOptions}
                className="w-full"
              />

              <RogueSelect
                value={type}
                onChange={(value) => setType(value as CollectionTypeFilter)}
                options={cardTypeOptions}
                className="w-full"
              />

              <RogueSelect
                value={ownership}
                onChange={(value) => setOwnership(value as CardOwnershipFilter)}
                options={ownershipOptions}
                className="w-full"
              />

              <RogueSelect
                value={rarity}
                onChange={(value) => setRarity(value as Rarity | "ALL")}
                options={rarityOptions}
                className="w-full"
              />

              <RogueSelect
                value={lock}
                onChange={(value) => setLock(value as LockFilter)}
                options={lockOptions}
                className="w-full"
              />

              <RogueInput
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("collection.searchPlaceholder")}
                allowClear
                className="md:col-span-2"
              />
            </div>

            {filtered.length === 0 && (
              <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-4">
                <RogueEmpty
                  description={t("collection.noCardsForFilters")}
                  className="[&_.ant-empty-description]:!text-sm [&_.ant-empty-description]:!text-gray-300"
                />
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((card) => {
                const localizedName = localizeCardName(card.definition, t);
                const localizedDescription = localizeCardDescription(
                  card.definition,
                  t
                );
                const characterTag = card.definition.characterId
                  ? t("collection.characterTypedBadge", {
                      character: t(
                        `characters.${card.definition.characterId}.name`,
                        card.definition.characterId
                      ),
                    })
                  : t("collection.neutralBadge");

                return (
                  <div
                    key={card.id}
                    onMouseEnter={(e) =>
                      handleCardMouseEnter(e, card.definition)
                    }
                    onMouseLeave={handleCardMouseLeave}
                    className={`relative rounded-lg border p-3 ${
                      card.unlocked
                        ? "border-emerald-700/50 bg-emerald-950/20"
                        : "border-rose-800/50 bg-rose-950/20"
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="font-bold">{localizedName}</p>
                      <RogueTag
                        bordered={false}
                        className={`rounded px-2 py-0.5 text-xs font-semibold ${
                          card.unlocked
                            ? "bg-emerald-900 text-emerald-300"
                            : "bg-rose-900 text-rose-300"
                        }`}
                      >
                        {card.unlocked
                          ? t("collection.unlocked")
                          : t("collection.locked")}
                      </RogueTag>
                    </div>
                    <p className="text-xs text-gray-400">
                      {t(`biome.${card.biome}`)} -{" "}
                      {localizeCardType(card.type, t)} -{" "}
                      {t(`gameCard.rarity.${card.rarity}`)} - {card.energyCost}{" "}
                      {t("collection.energy")} - {characterTag}
                    </p>
                    <p className="mt-2 text-sm text-gray-300">
                      {localizedDescription}
                    </p>

                    {!card.unlocked && (
                      <div className="mt-3 rounded border border-rose-900 bg-rose-950/30 p-2 text-xs text-rose-200">
                        <p className="font-semibold">
                          {t("collection.whyLocked")}
                        </p>
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
          </>
        )}

        {tab === "RELICS" && (
          <>
            <div className="grid grid-cols-1 gap-2 rounded-lg border border-gray-800 bg-gray-900/60 p-3 md:grid-cols-4">
              <RogueSelect
                value={relicRarity}
                onChange={(value) => setRelicRarity(value as RelicRarityFilter)}
                options={relicRarityOptions}
                className="w-full"
              />

              <RogueSelect
                value={relicLock}
                onChange={(value) => setRelicLock(value as LockFilter)}
                options={lockOptions}
                className="w-full"
              />

              <RogueInput
                value={relicQuery}
                onChange={(e) => setRelicQuery(e.target.value)}
                placeholder={t("collection.searchRelicPlaceholder")}
                allowClear
                className="md:col-span-2"
              />
            </div>

            {filteredRelics.length === 0 && (
              <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-4">
                <RogueEmpty
                  description={t("collection.noRelicsForFilters")}
                  className="[&_.ant-empty-description]:!text-sm [&_.ant-empty-description]:!text-gray-300"
                />
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filteredRelics.map((relic) => {
                const sourceText = relic.sourceBossId
                  ? t("collection.relicSourceBoss", {
                      boss: localizeEnemyName(
                        relic.sourceBossId,
                        relic.sourceBossId
                      ),
                    })
                  : t("collection.relicSourceGeneral");

                return (
                  <div
                    key={relic.id}
                    className={`rounded-lg border p-3 ${
                      relic.unlocked
                        ? "border-emerald-700/50 bg-emerald-950/20"
                        : "border-rose-800/50 bg-rose-950/20"
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="font-bold">
                        {localizeRelicName(relic.id, relic.name)}
                      </p>
                      <RogueTag
                        bordered={false}
                        className={`rounded px-2 py-0.5 text-xs font-semibold ${
                          relic.unlocked
                            ? "bg-emerald-900 text-emerald-300"
                            : "bg-rose-900 text-rose-300"
                        }`}
                      >
                        {relic.unlocked
                          ? t("collection.unlocked")
                          : t("collection.locked")}
                      </RogueTag>
                    </div>
                    <p className="text-xs text-gray-400">
                      {relic.rarity === "BOSS"
                        ? t("collection.bossRelicRarity")
                        : t(`gameCard.rarity.${relic.rarity}`)}{" "}
                      - {sourceText}
                    </p>
                    <p className="mt-2 text-sm text-gray-300">
                      {localizeRelicDescription(relic.id, relic.description)}
                    </p>

                    {!relic.unlocked && (
                      <div className="mt-3 rounded border border-rose-900 bg-rose-950/30 p-2 text-xs text-rose-200">
                        <p className="font-semibold">
                          {t("collection.whyRelicLocked")}
                        </p>
                        <p>
                          {t("collection.missingCondition")}:{" "}
                          {relic.missingUnlockRequirement
                            ? formatRelicUnlockRequirement(
                                relic.missingUnlockRequirement,
                                t
                              )
                            : formatRelicUnlockRequirements(
                                relic.unlockRequirements,
                                t
                              )}
                        </p>
                        {relic.missingUnlockRequirement && (
                          <p className="mt-1 text-rose-300">
                            {t("collection.progress")}:{" "}
                            {formatRelicUnlockProgress(
                              relic.missingUnlockRequirement
                            )}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function formatRunConditionUnlock(
  row: RunConditionCollectionRow,
  t: TFunction,
  cardDefinitionById: Map<string, CardDefinition>
): string {
  const needsRuns = Math.max(0, row.unlock.totalRuns ?? 0);
  const needsWins = Math.max(0, row.unlock.wonRuns ?? 0);
  const needsEnemyKills = row.unlock.enemyKills;
  const lootedCardId = row.unlock.lootedCardId;

  const parts: string[] = [];
  if (needsRuns > 0) {
    parts.push(t("collection.runConditions.unlockRuns", { runs: needsRuns }));
  }
  if (needsWins > 0) {
    parts.push(t("collection.runConditions.unlockWins", { wins: needsWins }));
  }
  if (needsEnemyKills) {
    parts.push(
      t("collection.runConditions.unlockEnemyKills", {
        kills: needsEnemyKills.count,
        enemy: localizeEnemyName(
          needsEnemyKills.enemyId,
          formatRunConditionFallback(needsEnemyKills.enemyId)
        ),
      })
    );
  }
  if (lootedCardId) {
    const cardDefinition = cardDefinitionById.get(lootedCardId);
    const cardName = cardDefinition
      ? localizeCardName(cardDefinition, t)
      : formatRunConditionFallback(lootedCardId);
    parts.push(
      t("collection.runConditions.unlockLootedCard", {
        card: cardName,
      })
    );
  }

  if (parts.length === 0) {
    return t("collection.alwaysUnlocked");
  }
  if (parts.length === 1) {
    return parts[0]!;
  }
  return parts.join(" + ");
}

function formatRelicUnlockRequirements(
  requirements: RelicUnlockRequirementState[],
  t: TFunction
): string {
  if (requirements.length === 0) {
    return t("collection.alwaysUnlocked");
  }
  if (requirements.length === 1) {
    return formatRelicUnlockRequirement(requirements[0]!, t);
  }
  return requirements
    .map((requirement) => formatRelicUnlockRequirement(requirement, t))
    .join(" + ");
}

function formatRelicUnlockRequirement(
  requirement: RelicUnlockRequirementState,
  t: TFunction
): string {
  switch (requirement.type) {
    case "TOTAL_RUNS":
      return t("collection.runConditions.unlockRuns", {
        runs: requirement.required,
      });
    case "WON_RUNS":
      return t("collection.runConditions.unlockWins", {
        wins: requirement.required,
      });
    case "BEST_GOLD_IN_SINGLE_RUN":
      return t("collection.relicUnlockBestGold", {
        gold: requirement.required,
      });
    case "ENEMY_KILLS":
      return t("collection.runConditions.unlockEnemyKills", {
        kills: requirement.required,
        enemy: localizeEnemyName(
          requirement.enemyId,
          formatRunConditionFallback(requirement.enemyId)
        ),
      });
    case "WINS_BY_DIFFICULTY":
      return t("collection.relicUnlockDifficultyWins", {
        wins: requirement.required,
        difficulty: requirement.difficulty,
      });
    case "CHARACTER_WINS_BY_DIFFICULTY":
      return t("collection.relicUnlockCharacterDifficultyWins", {
        wins: requirement.required,
        difficulty: requirement.difficulty,
        character: t(
          `characters.${requirement.characterId}.name`,
          formatRunConditionFallback(requirement.characterId)
        ),
      });
  }
}

function formatRelicUnlockProgress(
  requirement: RelicUnlockRequirementState
): string {
  return `${Math.min(requirement.current, requirement.required)}/${requirement.required}`;
}

"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  RogueButton,
  RogueCard,
  RogueEmpty,
  RogueSelect,
  RogueTag,
} from "@/components/ui/rogue";
import type { BiomeType } from "@/game/schemas/enums";
import type { EncounteredEnemyType } from "@/game/engine/bestiary";
import { BIOME_ORDER } from "./constants";
import {
  localizeEnemyLoreEntry,
  localizeEnemyName,
} from "@/lib/i18n/entity-text";
import {
  getLoreEntryIndexForKillCount,
  getUnlockedLoreEntryCount,
  LORE_MILESTONES_BY_TYPE,
} from "@/game/engine/bestiary";

type BestiaryFilterBiome = BiomeType | "ALL";
type BestiaryFilterType = EncounteredEnemyType | "ALL";

export interface BestiaryEnemyRow {
  id: string;
  name: string;
  loreEntries: string[];
  biome: BiomeType;
  type: EncounteredEnemyType;
  maxHp: number;
  speed: number;
  imageSrc: string | null;
  discovered: boolean;
  killCount: number;
}

interface BestiaryClientProps {
  enemies: BestiaryEnemyRow[];
}

export function BestiaryClient({ enemies }: BestiaryClientProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [biomeFilter, setBiomeFilter] = useState<BestiaryFilterBiome>("ALL");
  const [typeFilter, setTypeFilter] = useState<BestiaryFilterType>("ALL");

  const biomeOptions = useMemo(
    () => [
      { value: "ALL", label: t("bestiary.allBiomes") },
      ...BIOME_ORDER.map((biome) => ({
        value: biome,
        label: t(`biome.${biome}`),
      })),
    ],
    [t]
  );
  const typeOptions = useMemo(
    () => [
      { value: "ALL", label: t("bestiary.allTypes") },
      { value: "NORMAL", label: t("bestiary.type.NORMAL") },
      { value: "ELITE", label: t("bestiary.type.ELITE") },
      { value: "BOSS", label: t("bestiary.type.BOSS") },
    ],
    [t]
  );

  const filteredEnemies = useMemo(
    () =>
      enemies
        .filter((enemy) =>
          biomeFilter === "ALL" ? true : enemy.biome === biomeFilter
        )
        .filter((enemy) =>
          typeFilter === "ALL" ? true : enemy.type === typeFilter
        ),
    [enemies, biomeFilter, typeFilter]
  );

  const discoveredCount = useMemo(
    () => enemies.filter((enemy) => enemy.discovered).length,
    [enemies]
  );

  return (
    <div className="min-h-screen bg-gray-950 px-6 py-6 text-white">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black">{t("bestiary.title")}</h1>
            <p className="text-sm text-gray-400">
              {t("bestiary.discoveredCount", {
                discovered: discoveredCount,
                total: enemies.length,
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <RogueButton
              onClick={() => router.push("/library")}
              className="!rounded !border !border-gray-700 !bg-transparent !text-sm !text-gray-300 hover:!border-gray-500 hover:!text-white"
            >
              {t("bestiary.backToLibrary")}
            </RogueButton>
            <RogueButton
              type="primary"
              onClick={() => router.push("/game")}
              className="!rounded !bg-purple-600 !text-sm !font-bold hover:!bg-purple-500"
            >
              {t("bestiary.startRun")}
            </RogueButton>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 rounded-lg border border-gray-800 bg-gray-900/60 p-3 md:grid-cols-2">
          <RogueSelect
            value={biomeFilter}
            onChange={(value) => setBiomeFilter(value as BestiaryFilterBiome)}
            options={biomeOptions}
            className="w-full"
          />

          <RogueSelect
            value={typeFilter}
            onChange={(value) => setTypeFilter(value as BestiaryFilterType)}
            options={typeOptions}
            className="w-full"
          />
        </div>

        {filteredEnemies.length === 0 ? (
          <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-4">
            <RogueEmpty
              description={t("bestiary.noEntries")}
              className="[&_.ant-empty-description]:!text-sm [&_.ant-empty-description]:!text-gray-400"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filteredEnemies.map((enemy) => {
              const localizedName = localizeEnemyName(enemy.id, enemy.name);
              const isLocked = !enemy.discovered;
              const effectiveKillCount = isLocked
                ? 0
                : Math.max(enemy.killCount, 1);
              const unlockedLoreCount = getUnlockedLoreEntryCount(
                enemy.type,
                effectiveKillCount
              );
              const loreIndex = Math.min(
                Math.max(
                  0,
                  getLoreEntryIndexForKillCount(enemy.type, effectiveKillCount)
                ),
                Math.max(0, enemy.loreEntries.length - 1)
              );
              const selectedLoreFallback =
                enemy.loreEntries[loreIndex] ?? enemy.loreEntries[0] ?? "";
              const localizedLore = localizeEnemyLoreEntry(
                enemy.id,
                loreIndex,
                selectedLoreFallback
              );
              const nextLoreThreshold = (
                LORE_MILESTONES_BY_TYPE[enemy.type] ?? []
              ).find((threshold) => threshold > effectiveKillCount);

              return (
                <RogueCard
                  key={enemy.id}
                  className={`rounded-lg border p-3 ${
                    isLocked
                      ? "border-rose-800/50 bg-rose-950/20"
                      : "border-emerald-700/50 bg-emerald-950/20"
                  }`}
                  styles={{ body: { padding: 12 } }}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="font-bold">
                      {isLocked ? t("bestiary.lockedName") : localizedName}
                    </p>
                    <RogueTag
                      bordered={false}
                      className={`rounded px-2 py-0.5 text-xs font-semibold ${
                        isLocked
                          ? "bg-rose-900 text-rose-300"
                          : "bg-emerald-900 text-emerald-300"
                      }`}
                    >
                      {isLocked
                        ? t("bestiary.state.locked")
                        : t("bestiary.state.discovered")}
                    </RogueTag>
                  </div>

                  <p className="mb-3 text-xs text-gray-400">
                    {t(`biome.${enemy.biome}`)} -{" "}
                    {t(`bestiary.type.${enemy.type}`)}
                  </p>

                  <div className="relative mb-3 h-40 overflow-hidden rounded border border-gray-800 bg-gray-900/70">
                    {enemy.imageSrc ? (
                      <Image
                        src={enemy.imageSrc}
                        alt={
                          isLocked ? t("bestiary.lockedName") : localizedName
                        }
                        fill
                        className={`object-contain p-3 ${
                          isLocked ? "opacity-70 brightness-0 saturate-0" : ""
                        }`}
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-4xl text-gray-500">
                        ???
                      </div>
                    )}

                    {isLocked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 text-2xl font-black tracking-[0.35em] text-gray-300">
                        ???
                      </div>
                    )}
                  </div>

                  {isLocked ? (
                    <p className="text-sm text-gray-400">
                      {t("bestiary.lockedLore")}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-300">{localizedLore}</p>
                      <p className="text-xs text-gray-400">
                        {t("bestiary.stats")} - {t("bestiary.hp")}:{" "}
                        {enemy.maxHp} - {t("bestiary.speed")}: {enemy.speed}
                      </p>
                      <p className="text-xs text-gray-400">
                        {t("bestiary.kills")}: {effectiveKillCount} -{" "}
                        {t("bestiary.loreTier", {
                          current: Math.max(1, unlockedLoreCount),
                          total: 3,
                        })}
                        {nextLoreThreshold != null
                          ? ` - ${t("bestiary.nextLoreAt", {
                              count: nextLoreThreshold,
                            })}`
                          : ""}
                      </p>
                    </div>
                  )}
                </RogueCard>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

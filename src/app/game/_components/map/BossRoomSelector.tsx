"use client";

import type { ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import type { EnemyDefinition } from "@/game/schemas/entities";
import type { BiomeType } from "@/game/schemas/enums";
import { localizeEnemyName } from "@/lib/i18n/entity-text";

interface BossRoomSelectorProps {
  mode: "DEV" | "RELIC";
  currentBiome: BiomeType;
  selectedBiome: BiomeType;
  selectedBossId: string;
  plannedBoss?: EnemyDefinition;
  bossesByBiome: Map<BiomeType, EnemyDefinition[]>;
  allowBiomeChange?: boolean;
  onBiomeChange: (biome: BiomeType) => void;
  onBossChange: (bossId: string) => void;
}

export function BossRoomSelector({
  mode,
  currentBiome,
  selectedBiome,
  selectedBossId,
  plannedBoss,
  bossesByBiome,
  allowBiomeChange = true,
  onBiomeChange,
  onBossChange,
}: BossRoomSelectorProps) {
  const { t } = useTranslation();
  const copyKey =
    mode === "DEV" ? "map.devBossSelector" : "map.relicBossSelector";
  const biomeOptions = Array.from(bossesByBiome.entries()).filter(
    ([, bosses]) => bosses.length > 0
  );
  const bossOptions = bossesByBiome.get(selectedBiome) ?? [];
  const plannedBossName = plannedBoss
    ? localizeEnemyName(plannedBoss.id, plannedBoss.name)
    : null;

  const handleBiomeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onBiomeChange(event.target.value as BiomeType);
  };

  const handleBossChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onBossChange(event.target.value);
  };

  return (
    <div className="mx-auto mb-4 flex w-full max-w-5xl flex-col gap-3 rounded-xl border border-amber-500/25 bg-stone-950/85 px-4 py-3 shadow-lg shadow-black/30">
      <div className="flex flex-col gap-1">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-amber-400/65">
          {t(`${copyKey}.kicker`)}
        </p>
        <p className="text-sm text-amber-50">{t(`${copyKey}.subtitle`)}</p>
        <p className="text-xs text-amber-200/55">
          {t(`${copyKey}.plannedBoss`, {
            biome: t(`biome.${currentBiome}`),
            boss: plannedBossName ?? "-",
          })}
        </p>
      </div>

      <div
        className={`grid gap-3 ${allowBiomeChange ? "md:grid-cols-2" : "md:grid-cols-1"}`}
      >
        {allowBiomeChange && (
          <label className="flex flex-col gap-1 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-amber-200/75">
            <span>{t(`${copyKey}.biomeLabel`)}</span>
            <select
              value={selectedBiome}
              onChange={handleBiomeChange}
              className="rounded-lg border border-amber-500/20 bg-stone-900 px-3 py-2 text-sm font-medium normal-case tracking-normal text-amber-50 outline-none transition-colors focus:border-amber-400/60"
            >
              {biomeOptions.map(([biome]) => (
                <option key={biome} value={biome}>
                  {t(`biome.${biome}`)}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="flex flex-col gap-1 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-amber-200/75">
          <span>{t(`${copyKey}.bossLabel`)}</span>
          <select
            value={selectedBossId}
            onChange={handleBossChange}
            className="rounded-lg border border-amber-500/20 bg-stone-900 px-3 py-2 text-sm font-medium normal-case tracking-normal text-amber-50 outline-none transition-colors focus:border-amber-400/60"
          >
            {bossOptions.map((boss) => (
              <option key={boss.id} value={boss.id}>
                {localizeEnemyName(boss.id, boss.name)}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

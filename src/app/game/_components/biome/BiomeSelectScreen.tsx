"use client";

import type { BiomeType } from "@/game/schemas/enums";
import { BIOME_METADATA } from "@/game/data/biomes";
import { useTranslation } from "react-i18next";

interface BiomeSelectScreenProps {
  choices: [BiomeType, BiomeType];
  currentFloor: number;
  onChoose: (biome: BiomeType) => void;
}

export function BiomeSelectScreen({
  choices,
  currentFloor,
  onChoose,
}: BiomeSelectScreenProps) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col items-center justify-center gap-8 px-4 py-12">
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-amber-400/70">
          {t("biomeSelect.floorCleared", { floor: currentFloor })}
        </p>
        <h2 className="mt-1 text-3xl font-bold text-amber-100">
          {t("biomeSelect.title")}
        </h2>
        <p className="mt-2 text-sm text-gray-400">
          {t("biomeSelect.subtitle")}
        </p>
      </div>

      <div className="flex w-full max-w-2xl flex-col gap-4 sm:flex-row">
        {choices.map((biome) => {
          const meta = BIOME_METADATA[biome];
          const baseKey = `biomeSelect.biomes.${biome}`;
          return (
            <button
              key={biome}
              onClick={() => onChoose(biome)}
              className="flex flex-1 flex-col gap-3 rounded-xl border border-amber-800/40 bg-gray-900/80 p-6 text-left transition-all duration-200 hover:border-amber-500/70 hover:bg-gray-800/80 hover:shadow-lg hover:shadow-amber-900/20 active:scale-[0.98]"
            >
              <span className="text-5xl">{meta.icon}</span>

              <div>
                <h3 className="text-xl font-bold text-amber-200">
                  {t(`${baseKey}.name`, { defaultValue: meta.name })}
                </h3>
                <p className="mt-1 text-sm text-gray-400">
                  {t(`${baseKey}.description`, {
                    defaultValue: meta.description,
                  })}
                </p>
              </div>

              <div className="mt-auto rounded-md border border-gray-700/50 bg-gray-950/50 px-3 py-2">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  {t("biomeSelect.enemies")}
                </p>
                <p className="mt-0.5 text-sm text-gray-300">
                  {t(`${baseKey}.enemyPreview`, {
                    defaultValue: meta.enemyPreview,
                  })}
                </p>
              </div>

              <p className="text-xs italic text-gray-500">
                {t(`${baseKey}.flavor`, { defaultValue: meta.flavor })}
              </p>

              <div className="mt-1 rounded-lg bg-amber-800/30 px-4 py-2 text-center text-sm font-semibold text-amber-300 transition-colors hover:bg-amber-700/40">
                {t("biomeSelect.enterRealm")}
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-gray-600">
        {t("biomeSelect.floorProgress", { floor: currentFloor + 1, total: 3 })}
      </p>
    </div>
  );
}

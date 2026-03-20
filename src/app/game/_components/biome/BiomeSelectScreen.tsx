"use client";

import { RogueButton, RogueTag } from "@/components/ui/rogue";
import type { BiomeType } from "@/game/schemas/enums";
import { BIOME_METADATA } from "@/game/data/biomes";
import { GAME_CONSTANTS } from "@/game/constants";
import { useTranslation } from "react-i18next";

interface BiomeSelectScreenProps {
  choices: BiomeType[];
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
    <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col items-center justify-center gap-8 px-4 py-10 sm:py-12">
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

      <div
        data-testid="biome-select-grid"
        className="grid w-full max-w-6xl grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        {choices.map((biome) => {
          const meta = BIOME_METADATA[biome];
          const baseKey = `biomeSelect.biomes.${biome}`;
          return (
            <RogueButton
              key={biome}
              onClick={() => onChoose(biome)}
              type="text"
              className="!flex !h-full !min-h-[18rem] !w-full !min-w-0 !flex-col !items-start !justify-start !gap-3 !whitespace-normal !rounded-xl !border !border-amber-800/40 !bg-gray-900/80 !p-6 !text-left transition-all duration-200 hover:!border-amber-500/70 hover:!bg-gray-800/80 hover:!shadow-lg hover:!shadow-amber-900/20 active:!scale-[0.98]"
            >
              <span className="text-5xl">{meta.icon}</span>

              <div className="w-full min-w-0">
                <h3 className="break-words text-xl font-bold leading-snug text-amber-200 [overflow-wrap:anywhere]">
                  {t(`${baseKey}.name`, { defaultValue: meta.name })}
                </h3>
                <p className="mt-1 break-words text-sm text-gray-400 [overflow-wrap:anywhere]">
                  {t(`${baseKey}.description`, {
                    defaultValue: meta.description,
                  })}
                </p>
              </div>

              <div className="mt-auto w-full min-w-0 rounded-md border border-gray-700/50 bg-gray-950/50 px-3 py-2">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  {t("biomeSelect.enemies")}
                </p>
                <p className="mt-0.5 break-words text-sm text-gray-300 [overflow-wrap:anywhere]">
                  {t(`${baseKey}.enemyPreview`, {
                    defaultValue: meta.enemyPreview,
                  })}
                </p>
              </div>

              <p className="break-words text-xs italic text-gray-500 [overflow-wrap:anywhere]">
                {t(`${baseKey}.flavor`, { defaultValue: meta.flavor })}
              </p>

              <RogueTag
                bordered={false}
                className="mt-1 rounded-lg bg-amber-800/30 px-4 py-2 text-center text-sm font-semibold text-amber-300 transition-colors hover:bg-amber-700/40"
              >
                {t("biomeSelect.enterRealm")}
              </RogueTag>
            </RogueButton>
          );
        })}
      </div>

      <p className="text-xs text-gray-600">
        {t("biomeSelect.floorProgress", {
          floor: currentFloor + 1,
          total: GAME_CONSTANTS.MAX_FLOORS,
        })}
      </p>
    </div>
  );
}

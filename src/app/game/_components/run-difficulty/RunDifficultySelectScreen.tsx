"use client";

import { useTranslation } from "react-i18next";

interface RunDifficultySelectScreenProps {
  unlockedLevels: number[];
  onSelect: (difficultyLevel: number) => void;
}

export function RunDifficultySelectScreen({
  unlockedLevels,
  onSelect,
}: RunDifficultySelectScreenProps) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col items-center justify-center gap-8 px-4 py-12">
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-amber-400/70">
          {t("runDifficulty.select.kicker")}
        </p>
        <h2 className="mt-1 text-3xl font-bold text-amber-100">
          {t("runDifficulty.select.title")}
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          {t("runDifficulty.select.subtitle")}
        </p>
      </div>

      <div className="grid w-full max-w-5xl gap-4 md:grid-cols-3">
        {unlockedLevels.map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => onSelect(level)}
            className="flex h-full flex-col gap-3 rounded-xl border border-amber-800/40 bg-slate-900/85 p-5 text-left transition-all duration-200 hover:border-amber-500/70 hover:bg-slate-800/90 hover:shadow-lg hover:shadow-amber-900/20 active:scale-[0.99]"
          >
            <span className="w-fit rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
              {t("runDifficulty.levelLabel", { level })}
            </span>
            <h3 className="text-lg font-bold text-amber-100">
              {t(`runDifficulty.levels.${level}.name`)}
            </h3>
            <p className="text-sm text-slate-300">
              {t(`runDifficulty.levels.${level}.description`)}
            </p>
            <div className="mt-auto pt-2 text-xs font-semibold uppercase tracking-wide text-amber-400">
              {t("runDifficulty.select.pickAction")}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

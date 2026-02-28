"use client";

import { getRunConditionById } from "@/game/engine/run-conditions";
import { useTranslation } from "react-i18next";

interface RunConditionSelectScreenProps {
  conditionIds: string[];
  onSelect: (conditionId: string) => void;
}

function formatConditionFallback(conditionId: string): string {
  return conditionId
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function RunConditionSelectScreen({
  conditionIds,
  onSelect,
}: RunConditionSelectScreenProps) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col items-center justify-center gap-8 px-4 py-12">
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-cyan-400/70">
          {t("runCondition.select.kicker")}
        </p>
        <h2 className="mt-1 text-3xl font-bold text-cyan-100">
          {t("runCondition.select.title")}
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          {t("runCondition.select.subtitle")}
        </p>
      </div>

      <div className="grid w-full max-w-5xl gap-4 md:grid-cols-3">
        {conditionIds.map((conditionId) => {
          const condition = getRunConditionById(conditionId);
          if (!condition) return null;
          const fallbackName = formatConditionFallback(condition.id);
          const conditionName = t(
            `runCondition.definitions.${condition.id}.name`,
            {
              defaultValue: fallbackName,
            }
          );
          const conditionDescription = t(
            `runCondition.definitions.${condition.id}.description`,
            {
              defaultValue: conditionName,
            }
          );
          return (
            <button
              key={condition.id}
              type="button"
              onClick={() => onSelect(condition.id)}
              className="flex h-full flex-col gap-3 rounded-xl border border-cyan-800/40 bg-slate-900/85 p-5 text-left transition-all duration-200 hover:border-cyan-500/70 hover:bg-slate-800/90 hover:shadow-lg hover:shadow-cyan-900/20 active:scale-[0.99]"
            >
              <span className="w-fit rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
                {t(`runCondition.category.${condition.category}`)}
              </span>
              <h3 className="text-lg font-bold text-cyan-100">
                {conditionName}
              </h3>
              <p className="text-sm text-slate-300">{conditionDescription}</p>
              <div className="mt-auto pt-2 text-xs font-semibold uppercase tracking-wide text-cyan-400">
                {t("runCondition.select.pickAction")}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { RogueButton, RogueTag } from "@/components/ui/rogue";
import { getRunConditionById } from "@/game/engine/run-conditions";
import {
  localizeRunConditionDescription,
  localizeRunConditionName,
} from "@/lib/i18n/run-condition-text";
import { useTranslation } from "react-i18next";

interface RunConditionSelectScreenProps {
  conditionIds: string[];
  onSelect: (conditionId: string) => void;
}

export function RunConditionSelectScreen({
  conditionIds,
  onSelect,
}: RunConditionSelectScreenProps) {
  const { t } = useTranslation();

  return (
    <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col items-center justify-center gap-8 px-4 py-10 sm:py-12">
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
          const conditionName = localizeRunConditionName(condition.id, t);
          const conditionDescription = localizeRunConditionDescription(
            condition.id,
            t
          );
          return (
            <RogueButton
              key={condition.id}
              onClick={() => onSelect(condition.id)}
              type="text"
              className="!flex !h-full !flex-col !items-start !gap-3 !rounded-xl !border !border-cyan-800/40 !bg-slate-900/85 !p-5 !text-left transition-all duration-200 hover:!border-cyan-500/70 hover:!bg-slate-800/90 hover:!shadow-lg hover:!shadow-cyan-900/20 active:!scale-[0.99]"
            >
              <RogueTag
                bordered={false}
                className="w-fit rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-cyan-300"
              >
                {t(`runCondition.category.${condition.category}`)}
              </RogueTag>
              <h3 className="text-lg font-bold text-cyan-100">
                {conditionName}
              </h3>
              <p className="text-sm text-slate-300">{conditionDescription}</p>
              <div className="mt-auto pt-2 text-xs font-semibold uppercase tracking-wide text-cyan-400">
                {t("runCondition.select.pickAction")}
              </div>
            </RogueButton>
          );
        })}
      </div>
    </div>
  );
}

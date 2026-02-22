"use client";

import { useTranslation } from "react-i18next";
import { BIOME_THEMES } from "./constants";
import type { SlotState } from "./constants";
import { HistoireSlot } from "./HistoireSlot";
import type { Histoire, MetaProgress } from "@/game/schemas/meta";
import type { BiomeType } from "@/game/schemas/enums";

interface BiomeSectionProps {
  biome: BiomeType;
  histoires: Histoire[];
  progression: MetaProgress;
  onSelect: (histoire: Histoire) => void;
}

function getSlotState(
  histoire: Histoire,
  progression: MetaProgress
): SlotState {
  if (progression.unlockedStoryIds.includes(histoire.id)) return "UNLOCKED";

  const prereqsMet = histoire.prerequis.every((id) =>
    progression.unlockedStoryIds.includes(id)
  );
  if (!prereqsMet) return "LOCKED_PREREQS";

  const canAfford = Object.entries(histoire.cout).every(
    ([resource, cost]) =>
      (progression.resources[resource] ?? 0) >= (cost as number)
  );
  return canAfford ? "AVAILABLE" : "LOCKED_RESOURCES";
}

export function BiomeSection({
  biome,
  histoires,
  progression,
  onSelect,
}: BiomeSectionProps) {
  const { t } = useTranslation();
  const theme = BIOME_THEMES[biome];

  const t1s = histoires.filter((h) => h.tier === 1);
  const t2s = histoires.filter((h) => h.tier === 2);
  const t3 = histoires.find((h) => h.tier === 3);

  const t2A = t2s.find((h) => h.prerequis.includes(t1s[0]?.id ?? "")) ?? t2s[0];
  const t2B = t2s.find((h) => h !== t2A) ?? t2s[1];

  const unlockedCount = histoires.filter((h) =>
    progression.unlockedStoryIds.includes(h.id)
  ).length;

  return (
    <div
      className={`flex flex-col gap-2 rounded-xl border p-3 ${theme.bg} ${theme.border}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p
            className={`text-[10px] font-semibold uppercase tracking-widest ${theme.accent}`}
          >
            {t(`biome.${biome}`)}
          </p>
          <p className="text-[9px] text-slate-500">
            {theme.icon} {t(`reward.resources.${theme.resource}`)}
          </p>
        </div>
        <span className="text-[10px] text-slate-500">
          {unlockedCount}/{histoires.length}
        </span>
      </div>

      <div className="flex flex-col items-center gap-0.5">
        <div className="flex gap-2">
          {t1s[0] && (
            <HistoireSlot
              histoire={t1s[0]}
              state={getSlotState(t1s[0], progression)}
              onClick={onSelect}
            />
          )}
          {t1s[1] && (
            <HistoireSlot
              histoire={t1s[1]}
              state={getSlotState(t1s[1], progression)}
              onClick={onSelect}
            />
          )}
        </div>

        <div className="flex w-full justify-around px-7">
          <div className={`h-3 w-px border-l border-dashed ${theme.border}`} />
          <div className={`h-3 w-px border-l border-dashed ${theme.border}`} />
        </div>

        <div className="flex gap-2">
          {t2A && (
            <HistoireSlot
              histoire={t2A}
              state={getSlotState(t2A, progression)}
              onClick={onSelect}
            />
          )}
          {t2B && (
            <HistoireSlot
              histoire={t2B}
              state={getSlotState(t2B, progression)}
              onClick={onSelect}
            />
          )}
        </div>

        <div className={`h-3 w-px border-l border-dashed ${theme.border}`} />

        {t3 && (
          <HistoireSlot
            histoire={t3}
            state={getSlotState(t3, progression)}
            onClick={onSelect}
          />
        )}
      </div>
    </div>
  );
}

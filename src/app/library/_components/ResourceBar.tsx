"use client";

import { useTranslation } from "react-i18next";
import { BIOME_ORDER, BIOME_THEMES } from "./constants";
import type { MetaProgress } from "@/game/schemas/meta";

interface ResourceBarProps {
  resources: MetaProgress["resources"];
}

export function ResourceBar({ resources }: ResourceBarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5">
      {BIOME_ORDER.map((biome) => {
        const theme = BIOME_THEMES[biome];
        const amount = resources[theme.resource] ?? 0;
        const resourceLabel = t(
          `reward.resources.${theme.resource}`,
          theme.resource
        );
        const biomeLabel = t(`biome.${biome}`, biome);
        return (
          <div
            key={biome}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700/50 bg-slate-800/50 px-2.5 py-1"
            title={`${resourceLabel} (${biomeLabel})`}
          >
            <span className="text-base leading-none">{theme.icon}</span>
            <span
              className={amount > 0 ? theme.accent : "text-slate-600"}
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              <span className="text-xs font-semibold">{amount}</span>
            </span>
            <span className="text-[10px] text-slate-500">{resourceLabel}</span>
          </div>
        );
      })}
    </div>
  );
}

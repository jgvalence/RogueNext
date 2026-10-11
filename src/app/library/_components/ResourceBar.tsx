"use client";
import { useTranslation } from "react-i18next";
import { BIOME_ORDER, BIOME_THEMES } from "./constants";
import type { MetaProgress } from "@/game/schemas/meta";

export function ResourceBar({
  resources,
}: {
  resources: MetaProgress["resources"];
}) {
  const { t } = useTranslation();
  return (
    <dl className="library-resources">
      {BIOME_ORDER.map((biome) => {
        const theme = BIOME_THEMES[biome];
        return (
          <div key={biome} className="library-resource">
            <dt>
              <span>
                <span aria-hidden="true">{theme.icon} </span>
                {t("reward.resources." + theme.resource)}
              </span>
            </dt>
            <dd>
              <strong>{resources[theme.resource] ?? 0}</strong>
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

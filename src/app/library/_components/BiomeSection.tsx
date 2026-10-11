"use client";

import { useTranslation } from "react-i18next";
import { COMBAT_BACKGROUNDS } from "@/lib/assets";
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

  const unlockedCount = histoires.filter((h) =>
    progression.unlockedStoryIds.includes(h.id)
  ).length;
  return (
    <section className="library-chapter" aria-label={t("biome." + biome)}>
      <header
        className="library-chapter-header"
        style={{
          backgroundImage: `linear-gradient(90deg, #07101aed, #07101a40), url("${COMBAT_BACKGROUNDS[biome]}")`,
        }}
      >
        <span className="library-eyebrow">
          {theme.icon} {t("reward.resources." + theme.resource)}
        </span>
        <h2>{t("biome." + biome)}</h2>
        <p>
          {t("menu.chapterProgress", {
            count: unlockedCount,
            total: histoires.length,
          })}
        </p>
        <progress
          value={unlockedCount}
          max={Math.max(1, histoires.length)}
          aria-label={t("menu.restored")}
        />
      </header>
      <div className="library-tree">
        {[1, 2, 3].map((tier) => (
          <div
            key={tier}
            className="library-tier"
            aria-label={t("library.tier") + " " + tier}
          >
            {histoires
              .filter((h) => h.tier === tier)
              .map((histoire) => (
                <HistoireSlot
                  key={histoire.id}
                  histoire={histoire}
                  state={getSlotState(histoire, progression)}
                  onClick={onSelect}
                />
              ))}
          </div>
        ))}
      </div>
    </section>
  );
}

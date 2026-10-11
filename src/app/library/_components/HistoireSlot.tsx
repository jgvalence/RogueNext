"use client";
import { useTranslation } from "react-i18next";
import { TIER_LABELS } from "./constants";
import type { SlotState } from "./constants";
import type { Histoire } from "@/game/schemas/meta";
import { localizeStoryTitle } from "@/lib/i18n/stories";

interface HistoireSlotProps {
  histoire: Histoire;
  state: SlotState;
  onClick: (histoire: Histoire) => void;
}
export function HistoireSlot({ histoire, state, onClick }: HistoireSlotProps) {
  const { t } = useTranslation();
  const labels = {
    UNLOCKED: "restoredState",
    AVAILABLE: "availableState",
    LOCKED_RESOURCES: "resourceState",
    LOCKED_PREREQS: "prerequisiteState",
  };
  const marks = {
    UNLOCKED: "✓",
    AVAILABLE: "+",
    LOCKED_RESOURCES: "◇",
    LOCKED_PREREQS: "⊡",
  };
  return (
    <button
      id={"story-" + histoire.id}
      className="story-tome"
      data-state={state}
      onClick={() => onClick(histoire)}
    >
      <span className="library-eyebrow">
        {t("library.tier")} {TIER_LABELS[histoire.tier]}
      </span>
      <strong className="story-tome-title">
        {localizeStoryTitle(histoire, t)}
      </strong>
      <span className="story-tome-state">
        <span aria-hidden="true">{marks[state]} </span>
        {t("menu." + labels[state])}
      </span>
      <span className="story-tome-cost">
        {state === "UNLOCKED"
          ? t("menu.inspect")
          : Object.entries(histoire.cout)
              .map(([key, cost]) => cost + " " + t("reward.resources." + key))
              .join(" · ")}
      </span>
    </button>
  );
}

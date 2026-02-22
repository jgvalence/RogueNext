"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { BIOME_THEMES, VISUEL_ICONS, TIER_LABELS } from "./constants";
import type { SlotState } from "./constants";
import type { Histoire, MetaBonus, MetaProgress } from "@/game/schemas/meta";
import { unlockStoryAction } from "@/server/actions/progression";
import {
  localizeStoryAuthor,
  localizeStoryDescription,
  localizeStoryTitle,
} from "@/lib/i18n/stories";

interface HistoireModalProps {
  histoire: Histoire;
  progression: MetaProgress;
  slotState: SlotState;
  onClose: () => void;
  onUnlocked: (updatedProgression: MetaProgress) => void;
}

function formatBonus(bonus: MetaBonus): string {
  switch (bonus.type) {
    case "EXTRA_DRAW":
      return `+${bonus.value} draw each turn`;
    case "EXTRA_ENERGY_MAX":
      return `+${bonus.value} max energy`;
    case "EXTRA_INK_MAX":
      return `+${bonus.value} max ink`;
    case "INK_PER_CARD_CHANCE":
      return `+${bonus.value}% chance to gain ink on card play`;
    case "INK_PER_CARD_VALUE":
      return `+${bonus.value} ink when proc triggers`;
    case "STARTING_INK":
      return `Start combat with +${bonus.value} ink`;
    case "STARTING_BLOCK":
      return `+${bonus.value} block at combat start`;
    case "STARTING_STRENGTH":
      return `+${bonus.value} strength at combat start`;
    case "STARTING_REGEN":
      return `Recover +${bonus.value} HP at turn start`;
    case "FIRST_HIT_DAMAGE_REDUCTION":
      return `First hit taken: -${bonus.value}% damage`;
    case "EXTRA_HP":
      return `+${bonus.value} max HP`;
    case "EXTRA_HAND_AT_START":
      return `+${bonus.value} cards in opening hand`;
    case "ATTACK_BONUS":
      return `+${bonus.value} attack card damage`;
    case "ALLY_SLOTS":
      return `+${bonus.value} ally slot(s)`;
    case "STARTING_GOLD":
      return `+${bonus.value} starting gold each run`;
    case "EXTRA_CARD_REWARD_CHOICES":
      return `+${bonus.value} card reward choices`;
    case "RELIC_DISCOUNT":
      return `${bonus.value}% relic discount`;
    case "UNLOCK_INK_POWER":
      return `Unlock ink power ${bonus.power}`;
    case "HEAL_AFTER_COMBAT":
      return `Recover ${bonus.value}% max HP after combat`;
    case "EXHAUST_KEEP_CHANCE":
      return `${bonus.value}% chance to not exhaust a card`;
    case "SURVIVAL_ONCE":
      return "Survive at 1 HP once per run";
    case "FREE_UPGRADE_PER_RUN":
      return "Upgrade one card for free each run";
    case "STARTING_RARE_CARD":
      return "Start each run with a random rare card";
    default:
      return "Permanent bonus";
  }
}

export function HistoireModal({
  histoire,
  progression,
  slotState,
  onClose,
  onUnlocked,
}: HistoireModalProps) {
  const { t } = useTranslation();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const theme = BIOME_THEMES[histoire.biome];
  const storyTitle = localizeStoryTitle(histoire, t);
  const storyAuthor = localizeStoryAuthor(histoire, t);
  const storyDescription = localizeStoryDescription(histoire, t);

  async function handleUnlock() {
    setIsPending(true);
    setError(null);
    try {
      const result = await unlockStoryAction({ storyId: histoire.id });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      const updatedResources = { ...progression.resources };
      for (const [resource, cost] of Object.entries(histoire.cout)) {
        updatedResources[resource] =
          (updatedResources[resource] ?? 0) - (cost as number);
      }
      onUnlocked({
        resources: updatedResources,
        unlockedStoryIds: [...progression.unlockedStoryIds, histoire.id],
      });
      onClose();
    } catch {
      setError(t("library.genericError"));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md rounded-2xl border bg-slate-950 shadow-2xl ${theme.border}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`rounded-t-2xl border-b px-5 py-4 ${theme.border} ${theme.bg}`}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">
                  {VISUEL_ICONS[histoire.visuel]}
                </span>
                <span
                  className={`rounded-sm border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${theme.accent} ${theme.border}`}
                >
                  {t(`biome.${histoire.biome}`)} - {t("library.tier")}{" "}
                  {TIER_LABELS[histoire.tier]}
                </span>
              </div>
              <h2 className="mt-1.5 text-lg font-bold leading-tight text-white">
                {storyTitle}
              </h2>
              {storyAuthor && (
                <p className={`text-xs ${theme.accent} opacity-80`}>
                  - {storyAuthor}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="ml-3 flex-shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            >
              x
            </button>
          </div>
        </div>

        <div className="space-y-4 px-5 py-4">
          <p className="text-sm leading-relaxed text-slate-300">
            {storyDescription}
          </p>

          <div className={`rounded-lg border p-3 ${theme.border} ${theme.bg}`}>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              {t("library.permanentBonus")}
            </p>
            <p className={`text-sm font-semibold ${theme.accent}`}>
              {formatBonus(histoire.bonus)}
            </p>
          </div>

          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              {t("library.cost")}
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(histoire.cout).map(([resource, cost]) => {
                const resTheme = Object.values(BIOME_THEMES).find(
                  (entry) => entry.resource === resource
                );
                const available = progression.resources[resource] ?? 0;
                const canAfford = available >= (cost as number);
                return (
                  <div
                    key={resource}
                    className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-sm font-semibold ${
                      canAfford
                        ? "border-slate-600 text-white"
                        : "border-red-800 text-red-400"
                    }`}
                  >
                    <span>{resTheme?.icon ?? resource}</span>
                    <span>
                      {cost as number}{" "}
                      <span
                        className={`text-xs font-normal ${canAfford ? "text-slate-400" : "text-red-500"}`}
                      >
                        ({available} {t("library.availableAmount")})
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {histoire.prerequis.length > 0 && (
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                {t("library.prerequisites")}
              </p>
              <div className="flex flex-col gap-1">
                {histoire.prerequis.map((prereqId) => {
                  const unlocked =
                    progression.unlockedStoryIds.includes(prereqId);
                  return (
                    <div
                      key={prereqId}
                      className={`flex items-center gap-2 text-xs ${
                        unlocked ? "text-slate-400" : "text-red-400"
                      }`}
                    >
                      <span>{unlocked ? "v" : "x"}</span>
                      <span className="capitalize">
                        {prereqId.replace(/_/g, " ")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {error && (
            <p className="rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          {slotState === "UNLOCKED" ? (
            <div
              className={`rounded-lg border p-3 text-center text-sm font-semibold ${theme.border} ${theme.accent}`}
            >
              {t("library.ownedStory")}
            </div>
          ) : slotState === "AVAILABLE" ? (
            <button
              onClick={handleUnlock}
              disabled={isPending}
              className={`w-full rounded-lg border py-3 text-sm font-bold transition ${theme.border} ${theme.bg} ${theme.accent} hover:brightness-125 disabled:opacity-50`}
            >
              {isPending ? t("library.unlocking") : t("library.unlock")}
            </button>
          ) : (
            <div className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-3 text-center text-sm text-slate-500">
              {slotState === "LOCKED_PREREQS"
                ? t("library.missingPrereqs")
                : t("library.insufficientResources")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

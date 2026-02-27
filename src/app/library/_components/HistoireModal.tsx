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
  histoires: Histoire[];
  progression: MetaProgress;
  slotState: SlotState;
  onClose: () => void;
  onUnlocked: (updatedProgression: MetaProgress) => void;
}

function formatBonus(
  bonus: MetaBonus,
  t: (key: string, options?: Record<string, unknown>) => string
): string {
  switch (bonus.type) {
    case "EXTRA_DRAW":
      return t("library.bonus.extraDraw", { value: bonus.value });
    case "EXTRA_ENERGY_MAX":
      return t("library.bonus.extraEnergyMax", { value: bonus.value });
    case "EXTRA_INK_MAX":
      return t("library.bonus.extraInkMax", { value: bonus.value });
    case "INK_PER_CARD_CHANCE":
      return t("library.bonus.inkPerCardChance", { value: bonus.value });
    case "INK_PER_CARD_VALUE":
      return t("library.bonus.inkPerCardValue", { value: bonus.value });
    case "STARTING_INK":
      return t("library.bonus.startingInk", { value: bonus.value });
    case "STARTING_BLOCK":
      return t("library.bonus.startingBlock", { value: bonus.value });
    case "STARTING_STRENGTH":
      return t("library.bonus.startingStrength", { value: bonus.value });
    case "STARTING_REGEN":
      return t("library.bonus.startingRegen", { value: bonus.value });
    case "FIRST_HIT_DAMAGE_REDUCTION":
      return t("library.bonus.firstHitDamageReduction", { value: bonus.value });
    case "EXTRA_HP":
      return t("library.bonus.extraHp", { value: bonus.value });
    case "EXTRA_HAND_AT_START":
      return t("library.bonus.extraHandAtStart", { value: bonus.value });
    case "ATTACK_BONUS":
      return t("library.bonus.attackBonus", { value: bonus.value });
    case "ALLY_SLOTS":
      return t("library.bonus.allySlots", { value: bonus.value });
    case "STARTING_GOLD":
      return t("library.bonus.startingGold", { value: bonus.value });
    case "EXTRA_CARD_REWARD_CHOICES":
      return t("library.bonus.extraCardRewardChoices", { value: bonus.value });
    case "RELIC_DISCOUNT":
      return t("library.bonus.relicDiscount", { value: bonus.value });
    case "UNLOCK_INK_POWER":
      return t("library.bonus.unlockInkPower", {
        power: t(`inkGauge.powers.${bonus.power}.label`, {
          defaultValue: bonus.power,
        }),
      });
    case "HEAL_AFTER_COMBAT":
      return t("library.bonus.healAfterCombat", { value: bonus.value });
    case "HEAL_AFTER_COMBAT_FLAT":
      return t("library.bonus.healAfterCombatFlat", { value: bonus.value });
    case "EXHAUST_KEEP_CHANCE":
      return t("library.bonus.exhaustKeepChance", { value: bonus.value });
    case "SURVIVAL_ONCE":
      return t("library.bonus.survivalOnce");
    case "FREE_UPGRADE_PER_RUN":
      return t("library.bonus.freeUpgradePerRun");
    case "STARTING_RARE_CARD":
      return t("library.bonus.startingRareCard");
    default:
      return t("library.permanentBonus");
  }
}

export function HistoireModal({
  histoire,
  histoires,
  progression,
  slotState,
  onClose,
  onUnlocked,
}: HistoireModalProps) {
  const { t } = useTranslation();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const theme = BIOME_THEMES[histoire.biome];
  const storyById = new Map(histoires.map((h) => [h.id, h]));
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
              {formatBonus(histoire.bonus, t)}
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
                  const prereqStory = storyById.get(prereqId);
                  const prereqLabel = prereqStory
                    ? localizeStoryTitle(prereqStory, t)
                    : prereqId.replace(/_/g, " ");
                  return (
                    <div
                      key={prereqId}
                      className={`flex items-center gap-2 text-xs ${
                        unlocked ? "text-slate-400" : "text-red-400"
                      }`}
                    >
                      <span>{unlocked ? "v" : "x"}</span>
                      <span>{prereqLabel}</span>
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

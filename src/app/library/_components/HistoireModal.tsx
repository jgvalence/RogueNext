"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  RogueAlert,
  RogueButton,
  RogueModal,
  RogueTag,
} from "@/components/ui/rogue";
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
    case "UNLOCK_POWER_SLOT":
      return t("library.bonus.unlockPowerSlot", { slot: bonus.slot });
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
    <RogueModal
      open
      onCancel={onClose}
      footer={null}
      centered
      destroyOnClose
      width={640}
      title={
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{VISUEL_ICONS[histoire.visuel]}</span>
            <RogueTag
              bordered
              className={`rounded-sm border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${theme.accent} ${theme.border}`}
            >
              {t(`biome.${histoire.biome}`)} - {t("library.tier")}{" "}
              {TIER_LABELS[histoire.tier]}
            </RogueTag>
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
      }
      className="[&_.ant-modal-content]:!rounded-2xl [&_.ant-modal-content]:!border [&_.ant-modal-content]:!border-slate-800 [&_.ant-modal-content]:!bg-slate-950 [&_.ant-modal-header]:!bg-transparent [&_.ant-modal-title]:!text-white"
    >
      <div className="space-y-4">
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
                <RogueTag
                  key={resource}
                  bordered
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
                </RogueTag>
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
                    <span>{unlocked ? "\u2713" : "x"}</span>
                    <span>{prereqLabel}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {error && (
          <RogueAlert
            showIcon
            type="error"
            message={error}
            className="!rounded-lg !border !border-red-800 !bg-red-950/50"
          />
        )}

        {slotState === "UNLOCKED" ? (
          <RogueAlert
            type="success"
            showIcon
            message={t("library.ownedStory")}
            className={`!rounded-lg !border ${theme.border} !bg-transparent ${theme.accent}`}
          />
        ) : slotState === "AVAILABLE" ? (
          <RogueButton
            type="primary"
            block
            onClick={handleUnlock}
            loading={isPending}
            className={`!h-auto !rounded-lg !border !py-3 !text-sm !font-bold ${theme.border} ${theme.bg} ${theme.accent} hover:!brightness-125`}
          >
            {isPending ? t("library.unlocking") : t("library.unlock")}
          </RogueButton>
        ) : (
          <RogueAlert
            type="warning"
            showIcon
            message={
              slotState === "LOCKED_PREREQS"
                ? t("library.missingPrereqs")
                : t("library.insufficientResources")
            }
            className="!rounded-lg !border !border-slate-700 !bg-slate-900 !text-slate-300"
          />
        )}
      </div>
    </RogueModal>
  );
}

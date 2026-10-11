"use client";

import { computeMetaBonuses } from "@/game/engine/meta";
import { useRef, useState } from "react";
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
  showFirstRunGuidedStoryTutorial?: boolean;
  onClose: () => void;
  onSelectStory: (story: Histoire) => void;
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
    case "STARTING_FOCUS":
      return t("library.bonus.startingFocus", { value: bonus.value });
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
    case "LOOT_LUCK":
      return t("library.bonus.lootLuck", { value: bonus.value });
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
    case "STARTING_UNCOMMON_CARD_CHOICE":
      return t("library.bonus.startingUncommonCardChoice");
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
  showFirstRunGuidedStoryTutorial = false,
  onClose,
  onSelectStory,
  onUnlocked,
}: HistoireModalProps) {
  const { t } = useTranslation();
  const [isPending, setIsPending] = useState(false);
  const unlocking = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const theme = BIOME_THEMES[histoire.biome];
  const storyById = new Map(histoires.map((h) => [h.id, h]));
  const storyTitle = localizeStoryTitle(histoire, t);
  const storyAuthor = localizeStoryAuthor(histoire, t);
  const storyDescription = localizeStoryDescription(histoire, t);
  const alreadyOwned = progression.unlockedStoryIds.includes(histoire.id);
  const before = computeMetaBonuses(progression.unlockedStoryIds);
  const after = computeMetaBonuses([
    ...progression.unlockedStoryIds,
    histoire.id,
  ]);
  const key = histoire.bonus.type
    .toLowerCase()
    .replace(/_([a-z])/g, (_, letter: string) =>
      letter.toUpperCase()
    ) as keyof typeof before;
  const previousValue = before[key];
  const nextValue = after[key];
  const marginalValue =
    !alreadyOwned &&
    "value" in histoire.bonus &&
    typeof previousValue === "number" &&
    typeof nextValue === "number"
      ? nextValue - previousValue
      : null;
  const effectiveBonus =
    marginalValue === null
      ? histoire.bonus
      : ({ ...histoire.bonus, value: marginalValue } as MetaBonus);

  async function handleUnlock() {
    if (unlocking.current || slotState !== "AVAILABLE") return;
    unlocking.current = true;
    setIsPending(true);
    setError(null);
    try {
      const result = await unlockStoryAction({ storyId: histoire.id });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      onUnlocked({
        ...progression,
        resources: result.data.resources,
        unlockedStoryIds: result.data.unlockedStoryIds,
      });
    } catch {
      setError(t("library.genericError"));
    } finally {
      unlocking.current = false;
      setIsPending(false);
    }
  }

  return (
    <RogueModal
      open
      onCancel={() => {
        if (!isPending) onClose();
      }}
      closable={!isPending}
      maskClosable={!isPending}
      keyboard={!isPending}
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
      className="story-modal"
    >
      <div className="space-y-4">
        {showFirstRunGuidedStoryTutorial && (
          <div className="rounded-lg border border-cyan-500/45 bg-cyan-950/35 p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-200/90">
              {t("library.guidedStoryTutorial.kicker")}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-cyan-50">
              {t("library.guidedStoryTutorial.description")}
            </p>
          </div>
        )}

        <p className="text-sm leading-relaxed text-slate-300">
          {storyDescription}
        </p>

        <div className={`rounded-lg border p-3 ${theme.border} ${theme.bg}`}>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            {t("menu.effectiveBonus")}
          </p>
          <p className={`text-sm font-semibold ${theme.accent}`}>
            {formatBonus(effectiveBonus, t)}
          </p>
        </div>

        {marginalValue === 0 && (
          <p className="text-sm text-amber-200">
            {t("library.bonusCapReached")}
          </p>
        )}

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
                  <span>
                    {resTheme?.icon}{" "}
                    {t(`reward.resources.${resource}`, resource)}
                  </span>
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
                  <button
                    key={prereqId}
                    className="story-prerequisite"
                    disabled={!prereqStory || isPending}
                    onClick={() => {
                      if (prereqStory) onSelectStory(prereqStory);
                    }}
                    aria-label={`${prereqLabel} — ${t("menu.viewPrerequisite")}`}
                  >
                    <span aria-hidden="true">{unlocked ? "\u2713" : "⊡"}</span>
                    <span>{prereqLabel}</span>
                    <span aria-hidden="true">↗</span>
                  </button>
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

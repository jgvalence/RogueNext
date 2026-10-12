"use client";

import { useTranslation } from "react-i18next";
import { RogueButton } from "@/components/ui/rogue";

interface FirstCombatTutorialOverlayProps {
  isVisible: boolean;
  currentStep: string;
  stepIndex: number;
  totalSteps: number;
  isLastStep: boolean;
  isNextDisabled?: boolean;
  explanationValues?: Record<string, string | number>;
  actionLabel?: string;
  onAction?: () => void;
  onSkip: () => void;
  onPrevious: () => void;
  onNext: () => void;
}

export function FirstCombatTutorialOverlay({
  isVisible,
  currentStep,
  stepIndex,
  totalSteps,
  isLastStep,
  isNextDisabled = false,
  explanationValues,
  actionLabel,
  onAction,
  onSkip,
  onPrevious,
  onNext,
}: FirstCombatTutorialOverlayProps) {
  const { t } = useTranslation();
  if (!isVisible) return null;

  return (
    <aside
      data-keep-selection="true"
      className="first-combat-guide"
      aria-label={t("combat.firstCombatTutorial.kicker")}
    >
      <div
        className="first-combat-guide-copy"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="first-combat-guide-heading">
          <span>{t("combat.firstCombatTutorial.kicker")}</span>
          <span>
            {stepIndex + 1}/{totalSteps}
          </span>
        </div>
        <h3>{t(`combat.firstCombatTutorial.steps.${currentStep}.title`)}</h3>
        <p>
          {t(
            `combat.firstCombatTutorial.steps.${currentStep}.description`,
            explanationValues
          )}
        </p>
        {isNextDisabled && (
          <p className="first-combat-guide-task">
            <strong>{t("combat.firstCombatTutorial.actionRequired")} : </strong>
            {t(
              `combat.firstCombatTutorial.steps.${currentStep}.action`,
              explanationValues
            )}
          </p>
        )}
      </div>
      <div className="first-combat-guide-actions">
        <RogueButton type="text" onClick={onSkip}>
          {t("combat.firstCombatTutorial.skip")}
        </RogueButton>
        {stepIndex > 0 && !isNextDisabled && (
          <RogueButton
            type="text"
            onClick={onPrevious}
            aria-label={t("combat.firstCombatTutorial.previous")}
          >
            ←
          </RogueButton>
        )}
        {onAction && (
          <RogueButton className="first-combat-guide-action" onClick={onAction}>
            {actionLabel}
          </RogueButton>
        )}
        {!isNextDisabled && (
          <RogueButton onClick={onNext}>
            {t(
              isLastStep
                ? "combat.firstCombatTutorial.done"
                : "combat.firstCombatTutorial.next"
            )}
          </RogueButton>
        )}
      </div>
    </aside>
  );
}

"use client";

import { useCallback, useState } from "react";

const FIRST_COMBAT_TUTORIAL_STEPS = [
  "cards",
  "energy",
  "armor",
  "incomingDamage",
  "ink",
  "inkPowers",
  "deckCycle",
  "endTurn",
] as const;

type FirstCombatTutorialStep = (typeof FIRST_COMBAT_TUTORIAL_STEPS)[number];

interface UseFirstCombatTutorialParams {
  showFirstCombatTutorial: boolean;
  onDismissFirstCombatTutorial?: () => void;
}

export function useFirstCombatTutorial({
  showFirstCombatTutorial,
  onDismissFirstCombatTutorial,
}: UseFirstCombatTutorialParams) {
  const [firstCombatTutorialStepIndex, setFirstCombatTutorialStepIndex] =
    useState(0);
  const [firstCombatTutorialHidden, setFirstCombatTutorialHidden] =
    useState(false);

  const isFirstCombatTutorialVisible =
    showFirstCombatTutorial && !firstCombatTutorialHidden;
  const firstCombatTutorialCurrentStep: FirstCombatTutorialStep =
    FIRST_COMBAT_TUTORIAL_STEPS[
      Math.min(
        firstCombatTutorialStepIndex,
        FIRST_COMBAT_TUTORIAL_STEPS.length - 1
      )
    ] ?? "armor";

  const isArmorTutorialStep =
    isFirstCombatTutorialVisible && firstCombatTutorialCurrentStep === "armor";
  const isCardsTutorialStep =
    isFirstCombatTutorialVisible && firstCombatTutorialCurrentStep === "cards";
  const isEnergyTutorialStep =
    isFirstCombatTutorialVisible && firstCombatTutorialCurrentStep === "energy";
  const isIncomingDamageTutorialStep =
    isFirstCombatTutorialVisible &&
    firstCombatTutorialCurrentStep === "incomingDamage";
  const isInkTutorialStep =
    isFirstCombatTutorialVisible && firstCombatTutorialCurrentStep === "ink";
  const isInkPowersTutorialStep =
    isFirstCombatTutorialVisible &&
    firstCombatTutorialCurrentStep === "inkPowers";
  const isDeckCycleTutorialStep =
    isFirstCombatTutorialVisible &&
    firstCombatTutorialCurrentStep === "deckCycle";
  const isEndTurnTutorialStep =
    isFirstCombatTutorialVisible &&
    firstCombatTutorialCurrentStep === "endTurn";
  const isLastFirstCombatTutorialStep =
    firstCombatTutorialStepIndex >= FIRST_COMBAT_TUTORIAL_STEPS.length - 1;

  const dismissFirstCombatTutorial = useCallback(() => {
    if (firstCombatTutorialHidden) return;
    setFirstCombatTutorialHidden(true);
    onDismissFirstCombatTutorial?.();
  }, [firstCombatTutorialHidden, onDismissFirstCombatTutorial]);

  const handleFirstCombatTutorialNext = useCallback(() => {
    if (isLastFirstCombatTutorialStep) {
      dismissFirstCombatTutorial();
      return;
    }
    setFirstCombatTutorialStepIndex((prev) =>
      Math.min(FIRST_COMBAT_TUTORIAL_STEPS.length - 1, prev + 1)
    );
  }, [dismissFirstCombatTutorial, isLastFirstCombatTutorialStep]);

  const handleFirstCombatTutorialPrevious = useCallback(() => {
    setFirstCombatTutorialStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

  return {
    firstCombatTutorialStepIndex,
    firstCombatTutorialCurrentStep,
    firstCombatTutorialTotalSteps: FIRST_COMBAT_TUTORIAL_STEPS.length,
    isFirstCombatTutorialVisible,
    isLastFirstCombatTutorialStep,
    isArmorTutorialStep,
    isCardsTutorialStep,
    isEnergyTutorialStep,
    isIncomingDamageTutorialStep,
    isInkTutorialStep,
    isInkPowersTutorialStep,
    isDeckCycleTutorialStep,
    isEndTurnTutorialStep,
    dismissFirstCombatTutorial,
    handleFirstCombatTutorialNext,
    handleFirstCombatTutorialPrevious,
  };
}

"use client";

import { useCallback, useState } from "react";

const FIRST_COMBAT_TUTORIAL_STEPS = [
  "cards",
  "energy",
  "incomingDamage",
  "ink",
  "inkPowers",
  "inkedCard",
  "endTurn",
] as const;

type FirstCombatTutorialStep = (typeof FIRST_COMBAT_TUTORIAL_STEPS)[number];

interface UseFirstCombatTutorialParams {
  showFirstCombatTutorial: boolean;
  onDismissFirstCombatTutorial?: () => void;
  completedPower?: boolean;
  completedInkedCard?: boolean;
  completedTurn?: boolean;
}

export function useFirstCombatTutorial({
  showFirstCombatTutorial,
  onDismissFirstCombatTutorial,
  completedPower = false,
  completedInkedCard = false,
  completedTurn = false,
}: UseFirstCombatTutorialParams) {
  // The saved combat is the source of truth after a reload, including old runs.
  const initialStep = completedInkedCard
    ? FIRST_COMBAT_TUTORIAL_STEPS.indexOf("endTurn")
    : completedPower
      ? FIRST_COMBAT_TUTORIAL_STEPS.indexOf("inkedCard")
      : 0;
  const [firstCombatTutorialStepIndex, setFirstCombatTutorialStepIndex] =
    useState(initialStep);
  const [
    furthestFirstCombatTutorialStepIndex,
    setFurthestFirstCombatTutorialStepIndex,
  ] = useState(initialStep);
  const [firstCombatTutorialHidden, setFirstCombatTutorialHidden] =
    useState(completedTurn);

  const isFirstCombatTutorialVisible =
    showFirstCombatTutorial && !firstCombatTutorialHidden;
  const firstCombatTutorialCurrentStep: FirstCombatTutorialStep =
    FIRST_COMBAT_TUTORIAL_STEPS[
      Math.min(
        firstCombatTutorialStepIndex,
        FIRST_COMBAT_TUTORIAL_STEPS.length - 1
      )
    ] ?? "cards";

  const isArmorTutorialStep =
    isFirstCombatTutorialVisible &&
    firstCombatTutorialCurrentStep === "incomingDamage";
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
  const isInkedCardTutorialStep =
    isFirstCombatTutorialVisible &&
    firstCombatTutorialCurrentStep === "inkedCard";
  const isDeckCycleTutorialStep =
    isFirstCombatTutorialVisible &&
    firstCombatTutorialCurrentStep === "endTurn";
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
    const nextStepIndex = Math.min(
      FIRST_COMBAT_TUTORIAL_STEPS.length - 1,
      firstCombatTutorialStepIndex + 1
    );
    setFirstCombatTutorialStepIndex(nextStepIndex);
    setFurthestFirstCombatTutorialStepIndex((current) =>
      Math.max(current, nextStepIndex)
    );
  }, [
    dismissFirstCombatTutorial,
    firstCombatTutorialStepIndex,
    isLastFirstCombatTutorialStep,
  ]);

  const handleFirstCombatTutorialPrevious = useCallback(() => {
    setFirstCombatTutorialStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

  return {
    firstCombatTutorialStepIndex,
    furthestFirstCombatTutorialStepIndex,
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
    isInkedCardTutorialStep,
    isDeckCycleTutorialStep,
    isEndTurnTutorialStep,
    dismissFirstCombatTutorial,
    handleFirstCombatTutorialNext,
    handleFirstCombatTutorialPrevious,
  };
}

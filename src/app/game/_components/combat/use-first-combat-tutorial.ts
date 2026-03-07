"use client";

import { useCallback, useState } from "react";

const FIRST_COMBAT_TUTORIAL_STEPS = [
  "cards",
  "energy",
  "armor",
  "incomingDamage",
  "ink",
  "inkPowers",
  "inkedCard",
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
  const [
    furthestFirstCombatTutorialStepIndex,
    setFurthestFirstCombatTutorialStepIndex,
  ] = useState(0);
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
  const isInkedCardTutorialStep =
    isFirstCombatTutorialVisible &&
    firstCombatTutorialCurrentStep === "inkedCard";
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

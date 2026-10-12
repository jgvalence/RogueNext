import { fireEvent, render, renderHook, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FirstCombatTutorialOverlay } from "./first-combat-tutorial";
import { useFirstCombatTutorial } from "./use-first-combat-tutorial";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("FirstCombatTutorialOverlay", () => {
  it("resumes after an already used power instead of requiring it twice", () => {
    const { result } = renderHook(() =>
      useFirstCombatTutorial({
        showFirstCombatTutorial: true,
        completedPower: true,
      })
    );
    expect(result.current.firstCombatTutorialCurrentStep).toBe("inkedCard");
  });

  it("resumes at end turn after the inked card was saved", () => {
    const { result } = renderHook(() =>
      useFirstCombatTutorial({
        showFirstCombatTutorial: true,
        completedPower: true,
        completedInkedCard: true,
      })
    );
    expect(result.current.firstCombatTutorialCurrentStep).toBe("endTurn");
  });

  it("keeps the guide dismissed when reloading after the first turn", () => {
    const { result } = renderHook(() =>
      useFirstCombatTutorial({
        showFirstCombatTutorial: true,
        completedTurn: true,
      })
    );
    expect(result.current.isFirstCombatTutorialVisible).toBe(false);
  });
  it("shows progress and an explicit action when the player must interact", () => {
    const onAction = vi.fn();
    const onNext = vi.fn();
    render(
      <FirstCombatTutorialOverlay
        isVisible
        currentStep="inkPowers"
        stepIndex={4}
        totalSteps={7}
        isLastStep={false}
        isNextDisabled
        onAction={onAction}
        actionLabel="Open powers"
        onSkip={vi.fn()}
        onPrevious={vi.fn()}
        onNext={onNext}
      />
    );

    expect(screen.getByText("5/7")).toBeInTheDocument();
    expect(
      screen.getByText(/combat.firstCombatTutorial.actionRequired/)
    ).toBeInTheDocument();
    expect(
      screen.getByText("combat.firstCombatTutorial.steps.inkPowers.action")
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: "combat.firstCombatTutorial.next",
      })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Open powers" }));
    expect(onAction).toHaveBeenCalledOnce();
    expect(onNext).not.toHaveBeenCalled();
  });

  it("does not render outside the guided combat", () => {
    const { container } = render(
      <FirstCombatTutorialOverlay
        isVisible={false}
        currentStep="cards"
        stepIndex={0}
        totalSteps={9}
        isLastStep={false}
        onSkip={vi.fn()}
        onPrevious={vi.fn()}
        onNext={vi.fn()}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });
});

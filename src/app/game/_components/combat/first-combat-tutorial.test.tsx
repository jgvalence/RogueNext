import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FirstCombatTutorialOverlay } from "./first-combat-tutorial";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("FirstCombatTutorialOverlay", () => {
  it("shows progress and an explicit action when the player must interact", () => {
    render(
      <FirstCombatTutorialOverlay
        isVisible
        currentStep="inkPowers"
        stepIndex={5}
        totalSteps={9}
        isLastStep={false}
        isNextDisabled
        onSkip={vi.fn()}
        onPrevious={vi.fn()}
        onNext={vi.fn()}
      />
    );

    expect(screen.getByText("6/9")).toBeInTheDocument();
    expect(
      screen.getByText("combat.firstCombatTutorial.actionRequired")
    ).toBeInTheDocument();
    expect(
      screen.getByText("combat.firstCombatTutorial.steps.inkPowers.action")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "combat.firstCombatTutorial.next",
      })
    ).toBeDisabled();
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

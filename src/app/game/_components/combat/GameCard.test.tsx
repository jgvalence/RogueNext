import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CardDefinition } from "@/game/schemas/cards";
import { GameCard } from "./GameCard";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (
      key: string,
      options?: {
        defaultValue?: string;
      }
    ) => options?.defaultValue ?? key,
  }),
}));

function buildDefinition(
  overrides: Partial<CardDefinition> = {}
): CardDefinition {
  return {
    id: "test_card",
    name: "Test Card",
    type: "ATTACK",
    energyCost: 1,
    inkCost: 0,
    targeting: "SINGLE_ENEMY",
    rarity: "COMMON",
    description: "Deal 5 damage.",
    effects: [{ type: "DAMAGE", value: 5 }],
    onRandomDiscardEffects: [],
    inkedVariant: null,
    upgrade: null,
    isStarterCard: false,
    isCollectible: true,
    isStatusCard: false,
    isCurseCard: false,
    biome: "LIBRARY",
    archetypeTags: [],
    ...overrides,
  };
}

describe("GameCard", () => {
  it("renders compact rarity and origin badges plus a clearer no-ink label", () => {
    render(
      <GameCard
        definition={buildDefinition({
          rarity: "RARE",
          characterId: "scribe",
        })}
      />
    );

    expect(screen.getByLabelText("RARE")).toHaveTextContent("✦");
    expect(screen.getByLabelText("scribe")).toHaveTextContent("S");
    expect(screen.getAllByLabelText("LIBRARY")[0]).toHaveTextContent("✒");
    expect(screen.getByText("No Ink")).toBeInTheDocument();
  });

  it("marks neutral cards with an N badge", () => {
    render(<GameCard definition={buildDefinition()} size="lg" />);

    expect(screen.getByLabelText("Neutral")).toHaveTextContent("N");
  });
});

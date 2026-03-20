import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GAME_CONSTANTS } from "@/game/constants";
import { BiomeSelectScreen } from "./BiomeSelectScreen";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (
      key: string,
      options?: {
        defaultValue?: string;
        floor?: number;
        total?: number;
      }
    ) => options?.defaultValue ?? key,
  }),
}));

describe("BiomeSelectScreen", () => {
  it("renders the full biome list in a readable responsive grid", () => {
    const onChoose = vi.fn();
    const { getByTestId } = render(
      <BiomeSelectScreen
        choices={GAME_CONSTANTS.ALL_BIOMES}
        currentFloor={1}
        onChoose={onChoose}
      />
    );

    expect(screen.getByText("The Forbidden Library")).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(
      GAME_CONSTANTS.ALL_BIOMES.length
    );

    const grid = getByTestId("biome-select-grid");
    expect(grid.className).toContain("md:grid-cols-2");
    expect(grid.className).toContain("xl:grid-cols-3");
  });
});

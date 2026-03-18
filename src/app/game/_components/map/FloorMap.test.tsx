import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { RoomNode } from "@/game/schemas/run-state";
import { FloorMap } from "./FloorMap";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

function renderMap(map: RoomNode[][], currentRoom: number) {
  return render(
    <FloorMap
      map={map}
      currentRoom={currentRoom}
      floor={1}
      currentBiome="LIBRARY"
      enemyDefs={new Map()}
      onSelectRoom={vi.fn()}
    />
  );
}

describe("FloorMap connections", () => {
  it("keeps the full route structure visible without projecting active highlights from current choices", () => {
    const map: RoomNode[][] = [
      [{ index: 0, type: "COMBAT", completed: true, isElite: false }],
      [{ index: 1, type: "COMBAT", completed: false, isElite: false }],
      [{ index: 2, type: "COMBAT", completed: false, isElite: false }],
    ];

    const { container } = renderMap(map, 1);

    expect(
      container.querySelectorAll('[data-connection-layer="structure"]')
    ).toHaveLength(2);
    expect(
      container.querySelectorAll(
        '[data-connection-layer="status"][data-connection-state="active"]'
      )
    ).toHaveLength(1);
  });

  it("only highlights the first projection when the run starts", () => {
    const map: RoomNode[][] = [
      [{ index: 0, type: "COMBAT", completed: false, isElite: false }],
      [{ index: 1, type: "COMBAT", completed: false, isElite: false }],
      [{ index: 2, type: "COMBAT", completed: false, isElite: false }],
    ];

    const { container } = renderMap(map, 0);

    expect(
      container.querySelectorAll('[data-connection-layer="structure"]')
    ).toHaveLength(2);
    expect(
      container.querySelectorAll(
        '[data-connection-layer="status"][data-connection-state="active"]'
      )
    ).toHaveLength(1);
  });
});

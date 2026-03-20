import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: vi.fn(),
    writable: true,
  });
});

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

describe("FloorMap auto-scroll", () => {
  it("recenters the view on the current map depth", () => {
    const map: RoomNode[][] = [
      [{ index: 0, type: "COMBAT", completed: true, isElite: false }],
      [
        { index: 1, type: "COMBAT", completed: false, isElite: false },
        { index: 1, type: "MERCHANT", completed: false, isElite: false },
      ],
      [{ index: 2, type: "COMBAT", completed: false, isElite: false }],
    ];

    renderMap(map, 1);

    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({
      block: "center",
      inline: "center",
      behavior: "auto",
    });
  });
});

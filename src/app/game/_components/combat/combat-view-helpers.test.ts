import { beforeEach, describe, expect, it } from "vitest";
import { i18n } from "@/lib/i18n";
import type { TurnDisruption } from "@/game/schemas/combat-state";
import type { PlayerState } from "@/game/schemas/entities";
import { buildPlayerStatusMarkers } from "./combat-view-helpers";

const emptyDisruption = (): TurnDisruption => ({
  extraCardCost: 0,
  drawPenalty: 0,
  drawsToDiscardRemaining: 0,
  freezeNextDrawsRemaining: 0,
  frozenHandCardIds: [],
  disabledInkPowers: [],
});

const basePlayer = (): PlayerState => ({
  currentHp: 40,
  maxHp: 40,
  block: 0,
  energyCurrent: 3,
  energyMax: 3,
  inkCurrent: 0,
  inkMax: 10,
  inkPerCardChance: 100,
  inkPerCardValue: 1,
  regenPerTurn: 0,
  firstHitDamageReductionPercent: 0,
  drawCount: 5,
  speed: 0,
  strength: 0,
  focus: 0,
  buffs: [],
});

describe("buildPlayerStatusMarkers", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("fr");
  });

  it("prioritizes current and pending disruptions before player buffs", () => {
    const markers = buildPlayerStatusMarkers(
      {
        ...basePlayer(),
        buffs: [{ type: "BLEED", stacks: 3, duration: 4 }],
      },
      {
        ...emptyDisruption(),
        extraCardCost: 1,
      },
      {
        ...emptyDisruption(),
        extraCardCost: 2,
        drawPenalty: 1,
      }
    );

    expect(markers[0]?.compactLabel).toBe("+1C");
    expect(markers[1]?.compactLabel).toBe(">+2C");
    expect(markers[1]?.pending).toBe(true);
    expect(markers[2]?.compactLabel).toBe(">-1D");
    expect(markers.some((marker) => marker.compactLabel === "SA 3/4t")).toBe(
      true
    );
  });

  it("includes bleed duration in compact and detailed markers", () => {
    const markers = buildPlayerStatusMarkers({
      ...basePlayer(),
      buffs: [{ type: "BLEED", stacks: 3, duration: 4 }],
    });

    const bleedMarker = markers.find((marker) =>
      marker.detailLabel.startsWith("Saignement")
    );

    expect(bleedMarker).toBeDefined();
    expect(bleedMarker?.compactLabel).toBe("SA 3/4t");
    expect(bleedMarker?.symbolLabel).toBe("\uD83E\uDE783/4");
    expect(bleedMarker?.detailLabel).toContain("(4t)");
    expect(bleedMarker?.detailText).toContain("Dure 4 tours");
  });
});

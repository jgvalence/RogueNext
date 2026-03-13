import { beforeEach, describe, expect, it } from "vitest";
import { i18n } from "@/lib/i18n";
import { buildEnemyDefsMap } from "@/game/data";
import type {
  CombatState,
  TurnDisruption,
} from "@/game/schemas/combat-state";
import type { EnemyState, PlayerState } from "@/game/schemas/entities";
import {
  buildMobileEnemyIntentChips,
  buildPlayerStatusMarkers,
  computeEnemyEffectDamagePreview,
} from "./combat-view-helpers";

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

const enemyDefs = buildEnemyDefsMap();

function buildEnemyState(
  definitionId: string,
  intentIndex = 0,
  overrides: Partial<EnemyState> = {}
): EnemyState {
  const definition = enemyDefs.get(definitionId);
  if (!definition) {
    throw new Error(`Missing enemy definition ${definitionId}`);
  }

  return {
    instanceId: `${definitionId}-1`,
    definitionId,
    name: definition.name,
    isBoss: definition.isBoss,
    isElite: definition.isElite,
    currentHp: definition.maxHp,
    maxHp: definition.maxHp,
    block: 0,
    mechanicFlags: {},
    speed: definition.speed,
    buffs: [],
    intentIndex,
    ...overrides,
  };
}

function buildCombatState(
  enemy: EnemyState,
  overrides: Partial<CombatState> = {}
): CombatState {
  return {
    floor: 1,
    difficultyLevel: 0,
    enemyDamageScale: 1,
    turnNumber: 1,
    phase: "PLAYER_TURN",
    player: basePlayer(),
    allies: [],
    enemies: [enemy],
    drawPile: [],
    hand: [],
    discardPile: [],
    exhaustPile: [],
    pendingHandOverflowExhaust: 0,
    drawDebugHistory: [],
    inkPowerUsedThisTurn: false,
    firstHitReductionUsed: false,
    playerDisruption: emptyDisruption(),
    nextPlayerDisruption: emptyDisruption(),
    ...overrides,
  };
}

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
    expect(markers[0]?.detailLabel).toBe("les cartes coutent +1 ce tour");
    expect(markers[1]?.compactLabel).toBe(">+2C");
    expect(markers[1]?.pending).toBe(true);
    expect(markers[1]?.detailLabel).toBe("les cartes coutent +2 au prochain tour");
    expect(markers[2]?.compactLabel).toBe(">-1D");
    expect(markers[2]?.detailLabel).toBe("pioche -1 au prochain tour");
    expect(markers.some((marker) => marker.compactLabel === "SA 3/4t")).toBe(
      true
    );
  });

  it("localizes draw-to-discard disruptions", () => {
    const markers = buildPlayerStatusMarkers(basePlayer(), {
      ...emptyDisruption(),
      drawsToDiscardRemaining: 1,
    });

    expect(markers[0]?.compactLabel).toBe("D>DIS");
    expect(markers[0]?.detailLabel).toBe(
      "votre prochaine pioche va en defausse ce tour"
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

  it("includes attack bonus in player markers when active", () => {
    const markers = buildPlayerStatusMarkers(
      basePlayer(),
      undefined,
      undefined,
      2
    );

    const attackBonusMarker = markers.find(
      (marker) => marker.key === "player-attack-bonus"
    );

    expect(attackBonusMarker).toBeDefined();
    expect(attackBonusMarker?.compactLabel).toBe("ATQ +2");
    expect(attackBonusMarker?.symbolLabel).toBe("A+2");
    expect(attackBonusMarker?.detailLabel).toBe(
      "+2 degats des cartes Attaque"
    );
    expect(attackBonusMarker?.detailText).toContain("2");
  });
});

describe("enemy intent previews", () => {
  it("includes hidden flat bonus damage in boss damage previews", async () => {
    await i18n.changeLanguage("en");

    const enemy = buildEnemyState("tezcatlipoca_echo", 0);
    const ability = enemyDefs.get("tezcatlipoca_echo")?.abilities[0];
    const combat = buildCombatState(enemy);

    expect(ability).toBeDefined();
    expect(
      computeEnemyEffectDamagePreview(
        combat,
        enemy,
        "player",
        ability!.effects[0]!,
        ability
      )
    ).toBe(27);
  });

  it("shows named hidden status injections in boss intent chips", async () => {
    await i18n.changeLanguage("en");

    const enemy = buildEnemyState("baba_yaga_hut", 1);
    const ability = enemyDefs.get("baba_yaga_hut")?.abilities[1];
    const combat = buildCombatState(enemy);

    expect(ability).toBeDefined();

    const chips = buildMobileEnemyIntentChips(
      combat,
      enemy,
      "player",
      ability,
      false,
      i18n.t.bind(i18n)
    );

    expect(chips.some((chip) => chip.includes("Smudged Lens"))).toBe(true);
  });

  it("shows curse-scaling bonuses in boss intent chips", async () => {
    await i18n.changeLanguage("en");

    const enemy = buildEnemyState("chapter_guardian", 3);
    const ability = enemyDefs.get("chapter_guardian")?.abilities[3];
    const combat = buildCombatState(enemy, {
      hand: [
        { instanceId: "c1", definitionId: "haunting_regret", upgraded: false },
      ],
      discardPile: [
        { instanceId: "c2", definitionId: "binding_curse", upgraded: false },
      ],
    });

    expect(ability).toBeDefined();

    const chips = buildMobileEnemyIntentChips(
      combat,
      enemy,
      "player",
      ability,
      false,
      i18n.t.bind(i18n)
    );

    expect(chips.some((chip) => chip.includes("+2/curse"))).toBe(true);
    expect(chips.some((chip) => chip.includes("now +4"))).toBe(true);
  });

  it("surfaces pending phase-two extras in boss intent chips", async () => {
    await i18n.changeLanguage("en");

    const enemy = buildEnemyState("chapter_guardian", 0, { currentHp: 70 });
    const ability = enemyDefs.get("chapter_guardian")?.abilities[0];
    const combat = buildCombatState(enemy);

    expect(ability).toBeDefined();

    const chips = buildMobileEnemyIntentChips(
      combat,
      enemy,
      "player",
      ability,
      false,
      i18n.t.bind(i18n)
    );

    expect(chips.some((chip) => chip.startsWith("P2 "))).toBe(true);
    expect(chips.some((chip) => chip.includes("Binding Curse"))).toBe(true);
  });
});

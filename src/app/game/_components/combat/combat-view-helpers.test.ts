import { beforeEach, describe, expect, it } from "vitest";
import { i18n } from "@/lib/i18n";
import { buildEnemyDefsMap } from "@/game/data";
import type { CombatState, TurnDisruption } from "@/game/schemas/combat-state";
import type { EnemyState, PlayerState } from "@/game/schemas/entities";
import {
  buildEnemyStatusMarkers,
  buildMobileEnemyIntentChips,
  buildPlayerStatusMarkers,
  computeEnemyEffectDamagePreview,
  summarizeEnemyIntentLabels,
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
    expect(markers[1]?.detailLabel).toBe(
      "les cartes coutent +2 au prochain tour"
    );
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
    expect(attackBonusMarker?.detailLabel).toBe("+2 degats des cartes Attaque");
    expect(attackBonusMarker?.detailText).toContain("2");
  });
});

describe("enemy intent previews", () => {
  it("summarizes overflowing intent labels for compact cards", () => {
    const summary = summarizeEnemyIntentLabels(
      ["DMG 10", "Binding Curse", "Restores Black Inkwell", "Redact +1 cost"],
      3
    );

    expect(summary.visibleLabels).toEqual([
      "DMG 10",
      "Binding Curse",
      "Restores Black Inkwell",
    ]);
    expect(summary.remaining).toBe(1);
  });

  it("shows tezcatlipoca mirror markers and mirror echo chips", async () => {
    await i18n.changeLanguage("en");

    const enemy = buildEnemyState("tezcatlipoca_echo", 0, {
      mechanicFlags: {
        tezcatlipoca_echo_phase2: 1,
        tezcatlipoca_echo_slot_1_family: 3,
        tezcatlipoca_echo_slot_1_value: 9,
        tezcatlipoca_echo_slot_2_family: 1,
        tezcatlipoca_echo_slot_2_value: 6,
      },
    });
    const ability = enemyDefs.get("tezcatlipoca_echo")?.abilities[0];
    const combat = buildCombatState(enemy);

    expect(ability).toBeDefined();

    const markers = buildEnemyStatusMarkers(enemy);
    const chips = buildMobileEnemyIntentChips(
      combat,
      enemy,
      "player",
      ability,
      false,
      i18n.t.bind(i18n)
    );

    expect(
      computeEnemyEffectDamagePreview(
        combat,
        enemy,
        "player",
        ability!.effects[0]!,
        ability
      )
    ).toBe(19);
    expect(markers.map((marker) => marker.compactLabel)).toContain(
      "MIRROR INK 9"
    );
    expect(markers.map((marker) => marker.compactLabel)).toContain(
      "MIRROR ATK 6"
    );
    expect(chips.some((chip) => chip.includes("mirror damage"))).toBe(true);
    expect(chips.some((chip) => chip.includes("Ink Burn"))).toBe(true);
  });

  it("shows dagda brew markers and cauldron resolve chips", async () => {
    await i18n.changeLanguage("en");

    const enemy = buildEnemyState("dagda_shadow", 0, {
      mechanicFlags: {
        dagda_shadow_brew_type: 0,
        dagda_shadow_brew_progress: 1,
        dagda_shadow_cauldron_present: 1,
      },
    });
    const cauldron = buildEnemyState("dagda_cauldron", 0, {
      instanceId: "dagda-cauldron-1",
      mechanicFlags: {
        dagda_cauldron_brew_type: 0,
        dagda_cauldron_brew_progress: 1,
      },
    });
    const ability = enemyDefs.get("dagda_shadow")?.abilities[0];
    const combat = buildCombatState(enemy, {
      enemies: [enemy, cauldron],
    });

    expect(ability).toBeDefined();

    const markers = buildEnemyStatusMarkers(enemy);
    const chips = buildMobileEnemyIntentChips(
      combat,
      enemy,
      "player",
      ability!,
      false,
      i18n.t.bind(i18n)
    );

    expect(markers.map((marker) => marker.compactLabel)).toContain(
      "BREW FEAST 1/2"
    );
    expect(chips.some((chip) => chip.includes("heal 14"))).toBe(true);
    expect(chips.some((chip) => chip.includes("Strength +2"))).toBe(true);
  });

  it("shows cernunnos crown markers and antler-scaled wrath chips", async () => {
    await i18n.changeLanguage("en");

    const enemy = buildEnemyState("cernunnos_shade", 4, {
      mechanicFlags: {
        cernunnos_shade_antler_layers: 2,
      },
    });
    const ability = enemyDefs.get("cernunnos_shade")?.abilities[4];
    const combat = buildCombatState(enemy);

    expect(ability).toBeDefined();

    const markers = buildEnemyStatusMarkers(enemy);
    const chips = buildMobileEnemyIntentChips(
      combat,
      enemy,
      "player",
      ability!,
      false,
      i18n.t.bind(i18n)
    );

    expect(
      computeEnemyEffectDamagePreview(
        combat,
        enemy,
        "player",
        ability!.effects[0]!,
        ability
      )
    ).toBe(29);
    expect(markers.map((marker) => marker.compactLabel)).toContain("CROWN 2/3");
    expect(chips.some((chip) => chip.includes("+4/antler"))).toBe(true);
    expect(chips.some((chip) => chip.includes("now +8"))).toBe(true);
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

  it("shows fenrir hunt markers and hunt-based intent chips", async () => {
    await i18n.changeLanguage("en");

    const enemy = buildEnemyState("fenrir", 1, {
      mechanicFlags: {
        fenrir_hunt_remaining: 2,
      },
    });
    const ability = enemyDefs.get("fenrir")?.abilities[1];
    const combat = buildCombatState(enemy);

    expect(ability).toBeDefined();

    const markers = buildEnemyStatusMarkers(enemy);
    const chips = buildMobileEnemyIntentChips(
      combat,
      enemy,
      "player",
      ability,
      false,
      i18n.t.bind(i18n)
    );

    expect(markers.map((marker) => marker.compactLabel)).toContain("HUNT 2/3");
    expect(
      markers.find((marker) => marker.detailLabel === "The Hunt")?.detailText
    ).toContain("+4 damage");
    expect(chips.some((chip) => chip.includes("+2/hunt"))).toBe(true);
    expect(chips.some((chip) => chip.includes("now +4"))).toBe(true);
    expect(chips.some((chip) => chip.includes("Summon Draugr"))).toBe(true);
  });

  it("shows hel queen death stance markers and cash-out intent chips", async () => {
    await i18n.changeLanguage("en");

    const enemy = buildEnemyState("hel_queen", 3, {
      mechanicFlags: {
        hel_queen_phase2: 1,
        hel_queen_stance: 1,
        hel_queen_turns_until_swap: 1,
      },
    });
    const deadDraugr = buildEnemyState("draugr", 0, {
      instanceId: "draugr-dead",
      currentHp: 0,
    });
    const ability = enemyDefs.get("hel_queen")?.abilities[3];
    const combat = buildCombatState(enemy, {
      player: {
        ...basePlayer(),
        buffs: [{ type: "BLEED", stacks: 3, duration: 4 }],
      },
      enemies: [enemy, deadDraugr],
    });

    expect(ability).toBeDefined();

    const markers = buildEnemyStatusMarkers(enemy);
    const chips = buildMobileEnemyIntentChips(
      combat,
      enemy,
      "player",
      ability,
      false,
      i18n.t.bind(i18n)
    );

    expect(markers.map((marker) => marker.compactLabel)).toContain("DEATH 1");
    expect(
      markers.find((marker) => marker.detailLabel === "DEATH")?.detailText
    ).toContain("applies 1 Weak");
    expect(chips.some((chip) => chip.includes("Cash out Bleed x3"))).toBe(true);
    expect(chips.some((chip) => chip.includes("Restores Draugr"))).toBe(true);
    expect(chips.some((chip) => chip.includes("Weak"))).toBe(true);
    expect(
      chips.some((chip) => chip.includes("P2 Switches stance every turn"))
    ).toBe(false);
  });

  it("shows baba yaga face markers and face-specific punish chips", async () => {
    await i18n.changeLanguage("en");

    const enemy = buildEnemyState("baba_yaga_hut", 1, {
      mechanicFlags: {
        baba_yaga_hut_face: 2,
        baba_yaga_hut_turns_until_rotate: 1,
        baba_yaga_hut_turn_ink_spent: 1,
      },
    });
    const ability = enemyDefs.get("baba_yaga_hut")?.abilities[1];
    const combat = buildCombatState(enemy);

    expect(ability).toBeDefined();

    const markers = buildEnemyStatusMarkers(enemy);
    const chips = buildMobileEnemyIntentChips(
      combat,
      enemy,
      "player",
      ability,
      false,
      i18n.t.bind(i18n)
    );

    expect(markers.map((marker) => marker.compactLabel)).toContain(
      "HEARTH 1/2"
    );
    expect(
      markers.find((marker) => marker.detailLabel === "HEARTH")?.detailText
    ).toContain("Turns to TEETH in 1 turn");
    expect(chips.some((chip) => chip.includes("Smudged Lens"))).toBe(true);
    expect(chips.some((chip) => chip.toLowerCase().includes("freeze 1"))).toBe(
      true
    );
  });

  it("shows medusa gaze markers and phase 2 pattern chips", async () => {
    await i18n.changeLanguage("en");

    const phaseTwoEnemy = buildEnemyState("medusa", 0, {
      mechanicFlags: {
        medusa_phase2: 1,
        medusa_gaze_initialized: 1,
        medusa_gaze_slot_1_pattern: 1,
        medusa_gaze_slot_2_pattern: 0,
        medusa_gaze_slot_1_progress: 1,
        medusa_gaze_slot_2_progress: 0,
      },
    });
    const ability = enemyDefs.get("medusa")?.abilities[0];
    const previewEnemy = buildEnemyState("medusa", 0, {
      currentHp: 70,
      mechanicFlags: {
        medusa_gaze_initialized: 1,
        medusa_gaze_slot_1_pattern: 1,
        medusa_gaze_slot_1_progress: 1,
      },
    });
    const previewCombat = buildCombatState(previewEnemy);

    expect(ability).toBeDefined();

    const markers = buildEnemyStatusMarkers(phaseTwoEnemy);
    const chips = buildMobileEnemyIntentChips(
      previewCombat,
      previewEnemy,
      "player",
      ability,
      false,
      i18n.t.bind(i18n)
    );

    expect(markers.map((marker) => marker.compactLabel)).toContain(
      "GAZE SKL > ATK 1/2"
    );
    expect(markers.map((marker) => marker.compactLabel)).toContain(
      "GAZE ATK > ATK 0/2"
    );
    expect(
      chips.some((chip) => chip.includes("reveals a second forbidden pattern"))
    ).toBe(true);
  });

  it("shows ra sun markers and Solar Barrier eclipse chips", async () => {
    await i18n.changeLanguage("en");

    const enemy = buildEnemyState("ra_avatar", 2, {
      block: 18,
      mechanicFlags: {
        ra_avatar_sun_charge: 2,
      },
    });
    const ability = enemyDefs.get("ra_avatar")?.abilities[2];
    const combat = buildCombatState(enemy);

    expect(ability).toBeDefined();

    const markers = buildEnemyStatusMarkers(enemy);
    const chips = buildMobileEnemyIntentChips(
      combat,
      enemy,
      { type: "enemy", instanceId: enemy.instanceId },
      ability,
      false,
      i18n.t.bind(i18n)
    );

    expect(markers.map((marker) => marker.compactLabel)).toContain("SUN 2/3");
    expect(markers.map((marker) => marker.compactLabel)).toContain("ECLIPSE");
    expect(
      chips.some((chip) => chip.includes("End turn with ink: +1 SUN"))
    ).toBe(true);
    expect(chips.some((chip) => chip.includes("Break Solar Barrier"))).toBe(
      true
    );
  });

  it("shows ra judgment-ready damage bonus and drain chips", async () => {
    await i18n.changeLanguage("en");

    const enemy = buildEnemyState("ra_avatar", 3, {
      mechanicFlags: {
        ra_avatar_sun_charge: 3,
      },
    });
    const ability = enemyDefs.get("ra_avatar")?.abilities[3];
    const combat = buildCombatState(enemy, {
      player: {
        ...basePlayer(),
        inkCurrent: 5,
      },
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

    expect(
      computeEnemyEffectDamagePreview(
        combat,
        enemy,
        "player",
        ability!.effects[0]!,
        ability
      )
    ).toBe(32);
    expect(chips.some((chip) => chip.includes("+10 bonus"))).toBe(true);
    expect(chips.some((chip) => chip.includes("Drain all ink"))).toBe(true);
  });

  it("shows osiris scales markers and attack-verdict intent chips", async () => {
    await i18n.changeLanguage("en");

    const enemy = buildEnemyState("osiris_judgment", 0, {
      mechanicFlags: {
        osiris_judgment_turn_damage: 10,
        osiris_judgment_turn_block: 1,
      },
    });
    const ability = enemyDefs.get("osiris_judgment")?.abilities[0];
    const combat = buildCombatState(enemy);

    expect(ability).toBeDefined();

    const markers = buildEnemyStatusMarkers(enemy);
    const chips = buildMobileEnemyIntentChips(
      combat,
      enemy,
      "player",
      ability,
      false,
      i18n.t.bind(i18n)
    );

    expect(markers.map((marker) => marker.compactLabel)).toContain("MAAT 10/1");
    expect(markers.map((marker) => marker.compactLabel)).toContain(
      "VERDICT ATK"
    );
    expect(chips.some((chip) => chip.includes("+8 bonus"))).toBe(true);
    expect(chips.some((chip) => chip.includes("Weak"))).toBe(true);
  });

  it("shows osiris phase-two threshold preview chips", async () => {
    await i18n.changeLanguage("en");

    const enemy = buildEnemyState("osiris_judgment", 0, {
      currentHp: 80,
    });
    const ability = enemyDefs.get("osiris_judgment")?.abilities[0];
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
    expect(chips.some((chip) => chip.includes("threshold falls to 5"))).toBe(
      true
    );
  });

  it("shows soundiata verse markers and verse-resolution chips", async () => {
    await i18n.changeLanguage("en");

    const enemy = buildEnemyState("soundiata_spirit", 0, {
      mechanicFlags: {
        soundiata_spirit_phase2: 1,
        soundiata_spirit_slot_1_chapter: 0,
        soundiata_spirit_slot_1_progress: 1,
        soundiata_spirit_slot_2_chapter: 2,
        soundiata_spirit_slot_2_progress: 0,
        soundiata_spirit_slot_1_interrupt_progress: 6,
        soundiata_spirit_slot_2_interrupt_progress: 0,
      },
    });
    const ability = enemyDefs.get("soundiata_spirit")?.abilities[0];
    const combat = buildCombatState(enemy, {
      enemies: [enemy, buildEnemyState("mask_hunter")],
    });

    expect(ability).toBeDefined();

    const markers = buildEnemyStatusMarkers(enemy);
    const chips = buildMobileEnemyIntentChips(
      combat,
      enemy,
      "player",
      ability,
      false,
      i18n.t.bind(i18n)
    );

    expect(markers.map((marker) => marker.compactLabel)).toContain("RALLY 1/2");
    expect(markers.map((marker) => marker.compactLabel)).toContain("WAR 0/2");
    expect(chips.some((chip) => chip.includes("Allies +2 Strength"))).toBe(
      true
    );
  });

  it("shows nyarlathotep prophecy markers and prophecy chips", async () => {
    await i18n.changeLanguage("en");

    const enemy = buildEnemyState("nyarlathotep_shard", 0, {
      mechanicFlags: {
        nyarlathotep_shard_phase2: 1,
        nyarlathotep_shard_slot_1_omen: 0,
        nyarlathotep_shard_slot_1_consumed: 0,
        nyarlathotep_shard_slot_2_omen: 3,
        nyarlathotep_shard_slot_2_consumed: 1,
      },
    });
    const ability = enemyDefs.get("nyarlathotep_shard")?.abilities[0];
    const combat = buildCombatState(enemy);

    expect(ability).toBeDefined();

    const markers = buildEnemyStatusMarkers(enemy);
    const chips = buildMobileEnemyIntentChips(
      combat,
      enemy,
      "player",
      ability,
      false,
      i18n.t.bind(i18n)
    );

    expect(markers.map((marker) => marker.compactLabel)).toContain("OMEN DRW");
    expect(markers.map((marker) => marker.compactLabel)).toContain(
      "OMEN SKL X"
    );
    expect(chips.some((chip) => chip.includes("Prophecy DRAW"))).toBe(true);
    expect(chips.some((chip) => chip.includes("Haunting Regret"))).toBe(true);
  });

  it("shows shub brood markers, nest timers, and brood intent chips", async () => {
    await i18n.changeLanguage("en");

    const enemy = buildEnemyState("shub_spawn", 2, {
      mechanicFlags: {
        shub_spawn_phase2: 1,
        shub_spawn_nest_count: 1,
        shub_spawn_next_hatch: 1,
      },
    });
    const nest = buildEnemyState("shub_brood_nest", 0, {
      mechanicFlags: {
        shub_brood_nest_timer: 1,
      },
    });
    const ability = enemyDefs
      .get("shub_spawn")
      ?.abilities.find((entry) => entry.name === "Spawn Eruption");
    const combat = buildCombatState(enemy, {
      enemies: [enemy, nest],
    });

    expect(ability).toBeDefined();

    const bossMarkers = buildEnemyStatusMarkers(enemy);
    const nestMarkers = buildEnemyStatusMarkers(nest);
    const chips = buildMobileEnemyIntentChips(
      combat,
      enemy,
      "player",
      ability,
      false,
      i18n.t.bind(i18n)
    );

    expect(bossMarkers.map((marker) => marker.compactLabel)).toContain(
      "BROOD 1/2"
    );
    expect(nestMarkers.map((marker) => marker.compactLabel)).toContain(
      "HATCH 1/2"
    );
    expect(chips.some((chip) => chip.includes("Brood Nest"))).toBe(true);
    expect(chips.some((chip) => chip.includes("Shoggoth Spawn"))).toBe(true);
  });

  it("shows anansi loom markers and web-on-complete chips", async () => {
    await i18n.changeLanguage("en");

    const enemy = buildEnemyState("anansi_weaver", 0, {
      mechanicFlags: {
        anansi_weaver_phase2: 1,
        anansi_weaver_pattern: 3,
        anansi_weaver_progress: 1,
        anansi_weaver_stalled: 0,
        anansi_weaver_webbed_count: 1,
      },
    });
    const ability = enemyDefs.get("anansi_weaver")?.abilities[0];
    const combat = buildCombatState(enemy);

    expect(ability).toBeDefined();

    const markers = buildEnemyStatusMarkers(enemy);
    const chips = buildMobileEnemyIntentChips(
      combat,
      enemy,
      "player",
      ability,
      false,
      i18n.t.bind(i18n)
    );

    expect(markers.map((marker) => marker.compactLabel)).toContain(
      "LOOM ATK + SKL + INK 1/3"
    );
    expect(markers.map((marker) => marker.compactLabel)).toContain("WEB 1");
    expect(chips.some((chip) => chip.includes("web last card"))).toBe(true);
    expect(chips.some((chip) => chip.includes("Binding Curse"))).toBe(true);
  });

  it("shows hydra head state markers and regrow preview chips", async () => {
    await i18n.changeLanguage("en");

    const enemy = buildEnemyState("hydra_aspect", 0, {
      mechanicFlags: {
        hydra_heads_left: 1,
        hydra_heads_right: 0,
        hydra_heads_center: 3,
      },
    });
    const rightHead = buildEnemyState("hydra_head_right");
    const ability = enemyDefs.get("hydra_aspect")?.abilities[0];
    const combat = buildCombatState(enemy, {
      enemies: [enemy, rightHead],
    });

    expect(ability).toBeDefined();

    const markers = buildEnemyStatusMarkers(enemy);
    const chips = buildMobileEnemyIntentChips(
      combat,
      enemy,
      "player",
      ability,
      false,
      i18n.t.bind(i18n)
    );

    expect(markers.map((marker) => marker.compactLabel)).toContain("HEAD 1/2");
    expect(markers.map((marker) => marker.compactLabel)).toContain("REGROW 1");
    expect(chips.some((chip) => chip.includes("Hydra Head"))).toBe(true);
  });

  it("shows quetzalcoatl stance markers and phase 2 skyfall chips", async () => {
    await i18n.changeLanguage("en");

    const phaseTwoEnemy = buildEnemyState("quetzalcoatl_wrath", 0, {
      mechanicFlags: {
        quetzalcoatl_wrath_phase2: 1,
        quetzalcoatl_wrath_stance: 0,
        quetzalcoatl_wrath_hit_count: 1,
      },
    });
    const ability = enemyDefs.get("quetzalcoatl_wrath")?.abilities[0];
    const previewEnemy = buildEnemyState("quetzalcoatl_wrath", 0, {
      currentHp: 70,
      mechanicFlags: {
        quetzalcoatl_wrath_stance: 0,
        quetzalcoatl_wrath_hit_count: 1,
      },
    });
    const previewCombat = buildCombatState(previewEnemy);

    expect(ability).toBeDefined();

    const markers = buildEnemyStatusMarkers(phaseTwoEnemy);
    const chips = buildMobileEnemyIntentChips(
      previewCombat,
      previewEnemy,
      "player",
      ability,
      false,
      i18n.t.bind(i18n)
    );

    expect(markers.map((marker) => marker.compactLabel)).toContain("AIR");
    expect(markers.map((marker) => marker.compactLabel)).toContain("DOWN 1/2");
    expect(
      chips.some((chip) => chip.includes("knockdown threshold falls to 2"))
    ).toBe(true);
    expect(chips.some((chip) => chip.includes("adds 2 Bleed"))).toBe(true);
  });

  it("shows koschei immortality markers and reseal intent chips", async () => {
    await i18n.changeLanguage("en");

    const enemy = buildEnemyState("koschei_deathless", 2, {
      mechanicFlags: {
        koschei_deathless_phase2: 1,
        koschei_deathless_stage: 1,
        koschei_deathless_reseal_pending: 1,
        koschei_deathless_reseal_used: 1,
      },
    });
    const ability = enemyDefs.get("koschei_deathless")?.abilities[2];
    const combat = buildCombatState(enemy);

    expect(ability).toBeDefined();

    const markers = buildEnemyStatusMarkers(enemy);
    const chips = buildMobileEnemyIntentChips(
      combat,
      enemy,
      "player",
      ability,
      false,
      i18n.t.bind(i18n)
    );

    expect(markers.map((marker) => marker.compactLabel)).toContain("IMM EGG");
    expect(
      markers.find((marker) => marker.detailLabel === "Hidden Death")
        ?.detailText
    ).toContain("resealing");
    expect(chips.some((chip) => chip.includes("Restores Black Egg"))).toBe(
      true
    );
    expect(chips.some((chip) => chip.includes("heal 12"))).toBe(true);
  });

  it("shows chapter guardian bindings and their progress as enemy status markers", async () => {
    await i18n.changeLanguage("en");

    const enemy = buildEnemyState("chapter_guardian", 0, {
      mechanicFlags: {
        chapter_guardian_binding_martial_active: 1,
        chapter_guardian_binding_script_active: 1,
        chapter_guardian_binding_ink_active: 1,
        chapter_guardian_turn_attacks: 2,
        chapter_guardian_turn_block_gained: 7,
        chapter_guardian_turn_ink_spent: 1,
      },
    });

    const markers = buildEnemyStatusMarkers(enemy);

    expect(markers.map((marker) => marker.compactLabel)).toEqual(
      expect.arrayContaining(["ATK 2/3", "BLK 7/12", "INK 1/3"])
    );
    expect(
      markers.find((marker) => marker.detailLabel === "Martial Binding")
        ?.detailText
    ).toContain("capped at 8 damage");
    expect(
      markers.find((marker) => marker.detailLabel === "Ink Binding")?.detailText
    ).toContain("Haunting Regret");
  });

  it("updates chapter guardian status markers for open chapter and phase 2", async () => {
    await i18n.changeLanguage("en");

    const openEnemy = buildEnemyState("chapter_guardian", 0, {
      mechanicFlags: {
        chapter_guardian_open_chapter: 1,
        chapter_guardian_binding_martial_active: 0,
        chapter_guardian_binding_script_active: 0,
        chapter_guardian_binding_ink_active: 0,
      },
    });
    const phaseTwoEnemy = buildEnemyState("chapter_guardian", 0, {
      mechanicFlags: {
        chapter_guardian_phase2: 1,
        chapter_guardian_binding_martial_active: 1,
        chapter_guardian_binding_script_active: 1,
        chapter_guardian_binding_ink_active: 1,
      },
    });

    const openMarkers = buildEnemyStatusMarkers(openEnemy);
    const phaseTwoMarkers = buildEnemyStatusMarkers(phaseTwoEnemy);

    expect(openMarkers.map((marker) => marker.compactLabel)).toContain("OPEN");
    expect(
      phaseTwoMarkers.find((marker) => marker.detailLabel === "Martial Binding")
        ?.detailText
    ).toContain("capped at 6 damage");
    expect(
      phaseTwoMarkers.find((marker) => marker.detailLabel === "Script Binding")
        ?.detailText
    ).toContain("boss +8 block");
    expect(
      phaseTwoMarkers.find((marker) => marker.detailLabel === "Ink Binding")
        ?.detailText
    ).toContain("Binding Curse");
  });

  it("shows archivist cost redactions in intent chips when the black inkwell lives", async () => {
    await i18n.changeLanguage("en");

    const archivist = buildEnemyState("the_archivist", 1);
    const blackInkwell = buildEnemyState("archivist_black_inkwell", 0);
    const paleInkwell = buildEnemyState("archivist_pale_inkwell", 0);
    const ability = enemyDefs.get("the_archivist")?.abilities[1];
    const combat = buildCombatState(archivist, {
      enemies: [archivist, blackInkwell, paleInkwell],
    });

    expect(ability).toBeDefined();

    const chips = buildMobileEnemyIntentChips(
      combat,
      archivist,
      "player",
      ability,
      false,
      i18n.t.bind(i18n)
    );

    expect(chips.some((chip) => chip.includes("+1 cost"))).toBe(true);
  });

  it("shows inkwell restore info in intent chips", async () => {
    await i18n.changeLanguage("en");

    const blackInkwell = buildEnemyState("archivist_black_inkwell", 0);
    const ability = enemyDefs.get("archivist_black_inkwell")?.abilities[0];
    const combat = buildCombatState(blackInkwell);

    expect(ability).toBeDefined();

    const chips = buildMobileEnemyIntentChips(
      combat,
      blackInkwell,
      "player",
      ability,
      false,
      i18n.t.bind(i18n)
    );

    expect(
      chips.some((chip) => chip.includes("restore cost-redacted cards"))
    ).toBe(true);
  });

  it("shows archivist reinvokes in phase-two previews when an inkwell is missing", async () => {
    await i18n.changeLanguage("en");

    const archivist = buildEnemyState("the_archivist", 0, { currentHp: 70 });
    const blackInkwell = buildEnemyState("archivist_black_inkwell", 0);
    const paleInkwell = buildEnemyState("archivist_pale_inkwell", 0, {
      currentHp: 0,
    });
    const ability = enemyDefs.get("the_archivist")?.abilities[0];
    const combat = buildCombatState(archivist, {
      enemies: [archivist, blackInkwell, paleInkwell],
    });

    expect(ability).toBeDefined();

    const chips = buildMobileEnemyIntentChips(
      combat,
      archivist,
      "player",
      ability,
      false,
      i18n.t.bind(i18n)
    );

    expect(chips.some((chip) => chip.includes("P2"))).toBe(true);
    expect(chips.some((chip) => chip.includes("Restores Pale Inkwell"))).toBe(
      true
    );
    expect(chips.some((chip) => chip.includes("+1 cost"))).toBe(true);
    expect(chips.some((chip) => chip.includes("upgrade/inked disabled"))).toBe(
      true
    );
  });

  it("shows Corrupted Index restoring a missing inkwell before redacting", async () => {
    await i18n.changeLanguage("en");

    const archivist = buildEnemyState("the_archivist", 2);
    const blackInkwell = buildEnemyState("archivist_black_inkwell", 0, {
      currentHp: 0,
    });
    const paleInkwell = buildEnemyState("archivist_pale_inkwell", 0);
    const ability = enemyDefs.get("the_archivist")?.abilities[2];
    const combat = buildCombatState(archivist, {
      enemies: [archivist, blackInkwell, paleInkwell],
    });

    expect(ability).toBeDefined();

    const chips = buildMobileEnemyIntentChips(
      combat,
      archivist,
      "player",
      ability,
      false,
      i18n.t.bind(i18n)
    );

    expect(chips.some((chip) => chip.includes("Restores Black Inkwell"))).toBe(
      true
    );
    expect(chips.some((chip) => chip.includes("Binding Curse"))).toBe(true);
  });
});

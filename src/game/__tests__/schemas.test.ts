import { describe, it, expect } from "vitest";
import {
  CardDefinitionSchema,
  CardInstanceSchema,
  EffectSchema,
  PlayerStateSchema,
  EnemyStateSchema,
  EnemyDefinitionSchema,
  BuffInstanceSchema,
  CombatStateSchema,
  RunStateSchema,
  RoomNodeSchema,
} from "../schemas";

describe("EffectSchema", () => {
  it("parses a valid damage effect", () => {
    const result = EffectSchema.parse({
      type: "DAMAGE",
      value: 6,
    });
    expect(result.type).toBe("DAMAGE");
    expect(result.value).toBe(6);
  });

  it("parses a buff effect with duration", () => {
    const result = EffectSchema.parse({
      type: "APPLY_DEBUFF",
      value: 2,
      buff: "VULNERABLE",
      duration: 2,
    });
    expect(result.buff).toBe("VULNERABLE");
    expect(result.duration).toBe(2);
  });

  it("rejects invalid effect type", () => {
    expect(() => EffectSchema.parse({ type: "INVALID", value: 5 })).toThrow();
  });

  it("parses add-card effect with cardId", () => {
    const result = EffectSchema.parse({
      type: "ADD_CARD_TO_DISCARD",
      value: 1,
      cardId: "hexed_parchment",
    });
    expect(result.cardId).toBe("hexed_parchment");
  });
});

describe("CardDefinitionSchema", () => {
  const validCard = {
    id: "strike",
    name: "Strike",
    type: "ATTACK",
    energyCost: 1,
    targeting: "SINGLE_ENEMY",
    rarity: "STARTER",
    description: "Deal 6 damage.",
    effects: [{ type: "DAMAGE", value: 6 }],
    isStarterCard: true,
  };

  it("parses a valid card definition", () => {
    const result = CardDefinitionSchema.parse(validCard);
    expect(result.id).toBe("strike");
    expect(result.inkCost).toBe(0);
    expect(result.inkedVariant).toBeNull();
  });

  it("parses a card with inked variant", () => {
    const result = CardDefinitionSchema.parse({
      ...validCard,
      inkedVariant: {
        description: "Deal 10 damage.",
        effects: [{ type: "DAMAGE", value: 10 }],
        inkMarkCost: 2,
      },
    });
    expect(result.inkedVariant?.inkMarkCost).toBe(2);
    expect(result.inkedVariant?.effects[0]?.value).toBe(10);
  });

  it("rejects negative energy cost", () => {
    expect(() =>
      CardDefinitionSchema.parse({ ...validCard, energyCost: -1 })
    ).toThrow();
  });

  it("rejects invalid card type", () => {
    expect(() =>
      CardDefinitionSchema.parse({ ...validCard, type: "SPELL" })
    ).toThrow();
  });
});

describe("CardInstanceSchema", () => {
  it("parses a valid card instance", () => {
    const result = CardInstanceSchema.parse({
      instanceId: "abc123",
      definitionId: "strike",
    });
    expect(result.instanceId).toBe("abc123");
  });
});

describe("BuffInstanceSchema", () => {
  it("parses a buff with stacks", () => {
    const result = BuffInstanceSchema.parse({
      type: "POISON",
      stacks: 3,
    });
    expect(result.stacks).toBe(3);
    expect(result.duration).toBeUndefined();
  });

  it("parses a buff with duration", () => {
    const result = BuffInstanceSchema.parse({
      type: "VULNERABLE",
      stacks: 1,
      duration: 2,
    });
    expect(result.duration).toBe(2);
  });
});

describe("PlayerStateSchema", () => {
  it("parses valid player state with defaults", () => {
    const result = PlayerStateSchema.parse({
      currentHp: 80,
      maxHp: 80,
      energyCurrent: 3,
      energyMax: 3,
      inkMax: 10,
    });
    expect(result.block).toBe(0);
    expect(result.inkCurrent).toBe(0);
    expect(result.inkPerCardChance).toBe(0);
    expect(result.inkPerCardValue).toBe(1);
    expect(result.regenPerTurn).toBe(0);
    expect(result.firstHitDamageReductionPercent).toBe(0);
    expect(result.drawCount).toBe(5);
    expect(result.strength).toBe(0);
    expect(result.buffs).toEqual([]);
  });
});

describe("EnemyDefinitionSchema", () => {
  it("parses a valid enemy definition", () => {
    const result = EnemyDefinitionSchema.parse({
      id: "goblin",
      name: "Goblin",
      maxHp: 20,
      speed: 5,
      abilities: [{ name: "Slash", effects: [{ type: "DAMAGE", value: 6 }] }],
    });
    expect(result.isBoss).toBe(false);
    expect(result.tier).toBe(1);
  });

  it("rejects zero HP enemy", () => {
    expect(() =>
      EnemyDefinitionSchema.parse({
        id: "ghost",
        name: "Ghost",
        maxHp: 0,
        speed: 3,
        abilities: [],
      })
    ).toThrow();
  });
});

describe("EnemyStateSchema", () => {
  it("parses valid enemy state with defaults", () => {
    const result = EnemyStateSchema.parse({
      instanceId: "enemy-1",
      definitionId: "goblin",
      name: "Goblin",
      currentHp: 20,
      maxHp: 20,
      speed: 5,
    });
    expect(result.block).toBe(0);
    expect(result.buffs).toEqual([]);
    expect(result.intentIndex).toBe(0);
  });
});

describe("RoomNodeSchema", () => {
  it("parses a combat room", () => {
    const result = RoomNodeSchema.parse({
      index: 0,
      type: "COMBAT",
      enemyIds: ["goblin", "goblin"],
    });
    expect(result.completed).toBe(false);
    expect(result.enemyIds).toHaveLength(2);
  });

  it("parses a merchant room without enemies", () => {
    const result = RoomNodeSchema.parse({
      index: 3,
      type: "MERCHANT",
    });
    expect(result.enemyIds).toBeUndefined();
  });
});

describe("CombatStateSchema", () => {
  it("parses a minimal combat state", () => {
    const result = CombatStateSchema.parse({
      player: {
        currentHp: 80,
        maxHp: 80,
        energyCurrent: 3,
        energyMax: 3,
        inkMax: 10,
      },
      enemies: [
        {
          instanceId: "e1",
          definitionId: "goblin",
          name: "Goblin",
          currentHp: 20,
          maxHp: 20,
          speed: 5,
        },
      ],
      drawPile: [{ instanceId: "c1", definitionId: "strike" }],
      hand: [],
      discardPile: [],
    });
    expect(result.turnNumber).toBe(1);
    expect(result.phase).toBe("PLAYER_TURN");
    expect(result.allies).toEqual([]);
    expect(result.exhaustPile).toEqual([]);
    expect(result.firstHitReductionUsed).toBe(false);
  });
});

describe("RunStateSchema", () => {
  it("parses a minimal run state", () => {
    const result = RunStateSchema.parse({
      runId: "run-1",
      seed: "test-seed",
      status: "IN_PROGRESS",
      playerMaxHp: 80,
      playerCurrentHp: 80,
      deck: [{ instanceId: "c1", definitionId: "strike" }],
      map: [[{ index: 0, type: "COMBAT", enemyIds: ["goblin"] }]],
    });
    expect(result.floor).toBe(1);
    expect(result.currentRoom).toBe(0);
    expect(result.gold).toBe(0);
    expect(result.allyIds).toEqual([]);
    expect(result.relicIds).toEqual([]);
    expect(result.combat).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import { createGameReducer } from "./game-reducer";
import {
  createNewRun,
  getBossRoomIndexForMap,
  getReachableRoomChoiceIndexes,
} from "@/game/engine/run";
import type { CardDefinition } from "@/game/schemas/cards";
import { DEFAULT_META_BONUSES } from "@/game/schemas/meta";
import { createRNG } from "@/game/engine/rng";
import {
  buildAllyDefsMap,
  buildCardDefsMap,
  buildEnemyDefsMap,
} from "@/game/data";
import { getCharacterById } from "@/game/data/characters";

function makeDeterministicRng(seed: string) {
  return {
    seed,
    next: () => 0,
    nextInt: (min: number, _max: number) => min,
    shuffle: <T>(arr: readonly T[]) => [...arr],
    pick: <T>(arr: readonly T[]) => arr[0]!,
  };
}

function getStarterCards(
  allCards: Map<string, CardDefinition>,
  characterId: string
): CardDefinition[] {
  return getCharacterById(characterId)
    .starterDeckIds.map((id) => allCards.get(id))
    .filter((card): card is NonNullable<typeof card> => card != null);
}

describe("gameReducer", () => {
  it("adds the selected starting uncommon card only when it matches the current character choice", () => {
    const allCards = buildCardDefsMap();
    const bibliStarterCards = getStarterCards(allCards, "bibliothecaire");
    const scribeUncommon = allCards.get("starborn_omen");
    const bibliUncommon = allCards.get("sphinx_riddle");
    expect(scribeUncommon).toBeDefined();
    expect(bibliUncommon).toBeDefined();
    if (!scribeUncommon || !bibliUncommon) return;

    const reducerCardDefs = new Map<string, CardDefinition>([
      [scribeUncommon.id, scribeUncommon],
      [bibliUncommon.id, bibliUncommon],
      ...bibliStarterCards.map((card) => [card.id, card] as const),
    ]);

    const reducer = createGameReducer({
      cardDefs: reducerCardDefs,
      enemyDefs: buildEnemyDefsMap(),
      allyDefs: buildAllyDefsMap(),
      rng: makeDeterministicRng("starting-uncommon-choice"),
    });

    const state = {
      ...createNewRun(
        "run-starting-uncommon",
        "run-starting-uncommon",
        bibliStarterCards,
        createRNG("run-starting-uncommon-base")
      ),
      metaBonuses: {
        ...DEFAULT_META_BONUSES,
        startingUncommonCardChoice: true,
      },
      unlockedCardIds: [scribeUncommon.id, bibliUncommon.id],
    };

    const invalid = reducer(state, {
      type: "ADD_STARTING_BONUS_CARD",
      payload: { definitionId: scribeUncommon.id },
    });
    expect(invalid.deck).toHaveLength(state.deck.length);
    expect(invalid.startingBonusCardApplied).toBe(false);

    const valid = reducer(state, {
      type: "ADD_STARTING_BONUS_CARD",
      payload: { definitionId: bibliUncommon.id },
    });
    expect(
      valid.deck.some((card) => card.definitionId === bibliUncommon.id)
    ).toBe(true);
    expect(valid.startingBonusCardApplied).toBe(true);

    const duplicate = reducer(valid, {
      type: "ADD_STARTING_BONUS_CARD",
      payload: { definitionId: bibliUncommon.id },
    });
    expect(duplicate.deck).toHaveLength(valid.deck.length);
  });

  it("filters starting rare card to the chosen character", () => {
    const allCards = buildCardDefsMap();
    const scribeStarterCards = getStarterCards(allCards, "scribe");
    const bibliStarterCards = getStarterCards(allCards, "bibliothecaire");
    const scribeRare = allCards.get("mythic_blow");
    const bibliRare = allCards.get("saga_keeper");
    expect(scribeRare).toBeDefined();
    expect(bibliRare).toBeDefined();
    if (!scribeRare || !bibliRare) return;

    const reducerCardDefs = new Map<string, CardDefinition>([
      [scribeRare.id, scribeRare],
      [bibliRare.id, bibliRare],
      ...scribeStarterCards.map((card) => [card.id, card] as const),
      ...bibliStarterCards.map((card) => [card.id, card] as const),
    ]);

    const reducer = createGameReducer({
      cardDefs: reducerCardDefs,
      enemyDefs: buildEnemyDefsMap(),
      allyDefs: buildAllyDefsMap(),
      rng: makeDeterministicRng("choose-character-starting-rare"),
    });

    const state = {
      ...createNewRun(
        "run-character-filter",
        "run-character-filter",
        scribeStarterCards,
        createRNG("run-character-filter-base")
      ),
      metaBonuses: {
        ...DEFAULT_META_BONUSES,
        startingRareCard: true,
      },
    };

    const next = reducer(state, {
      type: "CHOOSE_CHARACTER",
      payload: { characterId: "bibliothecaire" },
    });

    expect(next.characterId).toBe("bibliothecaire");
    expect(next.deck.some((card) => card.definitionId === bibliRare.id)).toBe(
      true
    );
    expect(next.deck.some((card) => card.definitionId === scribeRare.id)).toBe(
      false
    );
  });

  it("records biome unlock progress for the chosen character", () => {
    const allCards = buildCardDefsMap();
    const scribeStarterCards = getStarterCards(allCards, "scribe");
    const reducer = createGameReducer({
      cardDefs: allCards,
      enemyDefs: buildEnemyDefsMap(),
      allyDefs: buildAllyDefsMap(),
      rng: makeDeterministicRng("choose-character-unlock-progress"),
    });

    const state = createNewRun(
      "run-character-progress",
      "run-character-progress",
      scribeStarterCards,
      createRNG("run-character-progress-base"),
      undefined,
      [],
      undefined,
      undefined,
      [],
      [0],
      0,
      null,
      {},
      {},
      undefined,
      {},
      ["scribe", "bibliothecaire"],
      { scribe: 0, bibliothecaire: 0 }
    );

    expect(state.cardUnlockProgress.byCharacter).toEqual({});

    const next = reducer(state, {
      type: "CHOOSE_CHARACTER",
      payload: { characterId: "bibliothecaire" },
    });

    expect(
      next.cardUnlockProgress.byCharacter?.bibliothecaire?.enteredBiomes.LIBRARY
    ).toBe(1);
    expect(next.cardUnlockProgress.enteredBiomes.LIBRARY).toBe(1);
  });

  it("dev skip to boss room moves the cursor and keeps the boss node reachable", () => {
    const allCards = buildCardDefsMap();
    const scribeStarterCards = getStarterCards(allCards, "scribe");
    const reducer = createGameReducer({
      cardDefs: allCards,
      enemyDefs: buildEnemyDefsMap(),
      allyDefs: buildAllyDefsMap(),
      rng: makeDeterministicRng("dev-skip-to-boss-room"),
    });

    const state = createNewRun(
      "run-dev-skip",
      "run-dev-skip",
      scribeStarterCards,
      createRNG("run-dev-skip-base")
    );
    const bossRoomIndex = getBossRoomIndexForMap(state.map);

    expect(state.currentRoom).toBeLessThan(bossRoomIndex);

    const next = reducer(state, {
      type: "DEV_SKIP_TO_BOSS_ROOM",
    });

    expect(next.currentRoom).toBe(bossRoomIndex);
    expect(getReachableRoomChoiceIndexes(next.map, next.currentRoom)).toContain(
      0
    );
  });
});

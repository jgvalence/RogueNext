import { describe, expect, it } from "vitest";
import { createGameReducer } from "./game-reducer";
import { createNewRun } from "@/game/engine/run";
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
});

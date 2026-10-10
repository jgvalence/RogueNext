import { describe, expect, it } from "vitest";
import { getAvailableCharacters } from "../data/characters";

describe("Character unlock cadence", () => {
  it("offers two starting styles, then spaces the advanced characters", () => {
    expect(getAvailableCharacters(0).map((character) => character.id)).toEqual([
      "scribe",
      "bibliothecaire",
    ]);
    expect(getAvailableCharacters(2).map((character) => character.id)).toEqual([
      "scribe",
      "bibliothecaire",
    ]);
    expect(getAvailableCharacters(3).map((character) => character.id)).toEqual([
      "scribe",
      "bibliothecaire",
      "griot",
    ]);
    expect(getAvailableCharacters(6).map((character) => character.id)).toEqual([
      "scribe",
      "bibliothecaire",
      "griot",
      "fou",
    ]);
  });
});

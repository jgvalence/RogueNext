/** Reproducible catalogue snapshot. No database or account mutations. */
import fs from "node:fs";
import { allCardDefinitions } from "../src/game/data";
import { getCardUpgradeBranches } from "../src/game/engine/card-upgrades";
import { buildEffectPatternSignature } from "../src/game/engine/card-audit";
import { BUILD_PATHS, getBuildProfile } from "../src/game/engine/build-profile";
import {
  addInitialCharacterCardUnlocks,
  computeUnlockedCardIds,
} from "../src/game/engine/card-unlocks";

const cards = allCardDefinitions.filter(
  (card) =>
    card.isCollectible !== false &&
    !card.isStarterCard &&
    card.type !== "STATUS" &&
    card.type !== "CURSE"
);
const manual = cards.filter((card) => !card.id.startsWith("bestiary_"));
const details = cards.map((card) => {
  const branches = getCardUpgradeBranches(card);
  const missingFromA = card.effects.filter(
    (effect) =>
      !branches[0].effects.some(
        (other) =>
          effect.type === other.type &&
          effect.buff === other.buff &&
          effect.scalingBuff === other.scalingBuff
      )
  );
  const badBranches = branches.flatMap((branch, index) =>
    branch.effects
      .filter(
        (effect) =>
          effect.type.startsWith("DAMAGE") &&
          !card.effects.some((base) => base.type === effect.type) &&
          ["SELF", "SINGLE_ALLY", "ALL_ALLIES"].includes(card.targeting)
      )
      .map((effect) => ({
        branch: index === 0 ? "A" : "B",
        effect: effect.type,
      }))
  );
  const inkTarget = card.inkedVariant?.targeting ?? card.targeting;
  const badInk = (card.inkedVariant?.effects ?? []).filter(
    (effect) =>
      effect.type.startsWith("DAMAGE") &&
      !card.effects.some((base) => base.type === effect.type) &&
      ["SELF", "SINGLE_ALLY", "ALL_ALLIES"].includes(inkTarget)
  );
  return { ...card, branches, missingFromA, badBranches, badInk };
});
const groups = new Map<string, string[]>();
for (const card of manual) {
  const key = `${card.type}:${card.targeting}:${buildEffectPatternSignature(card.effects)}`;
  groups.set(key, [...(groups.get(key) ?? []), card.id]);
}
const summary = {
  total: allCardDefinitions.length,
  active: cards.length,
  manual: manual.length,
  owned: Object.fromEntries(
    ["scribe", "bibliothecaire", "griot", "fou"].map((id) => [
      id,
      manual.filter((c) => c.characterId === id).length,
    ])
  ),
  totalAccessible: Object.fromEntries(
    ["scribe", "bibliothecaire", "griot", "fou"].map((id) => [
      id,
      cards.filter((c) => !c.characterId || c.characterId === id).length,
    ])
  ),
  masteryOwned: Object.fromEntries(
    ["scribe", "bibliothecaire", "griot", "fou"].map((id) => [
      id,
      cards.filter((c) => c.id.startsWith("bestiary_") && c.characterId === id)
        .length,
    ])
  ),
  lostMechanicsA: details
    .filter((c) => c.missingFromA.length)
    .map((c) => ({ id: c.id, missing: c.missingFromA.map((e) => e.type) })),
  harmfulGeneratedBranches: details
    .filter((c) => c.badBranches.length)
    .map((c) => ({ id: c.id, branches: c.badBranches })),
  harmfulInkedAdditions: details
    .filter((card) => card.badInk.length)
    .map((card) => ({ id: card.id, effects: card.badInk })),
  repeatedBasePatterns: [...groups.values()].filter((ids) => ids.length > 1),
  effects: Object.fromEntries(
    [...new Set(manual.flatMap((c) => c.effects.map((e) => e.type)))]
      .sort()
      .map((type) => [
        type,
        manual.filter((c) => c.effects.some((e) => e.type === type)).length,
      ])
  ),
  coverage: ["scribe", "bibliothecaire", "griot", "fou"].map((character) => {
    const pool = manual.filter(
      (card) => !card.characterId || card.characterId === character
    );
    const unlocked = new Set(
      addInitialCharacterCardUnlocks(
        computeUnlockedCardIds(
          allCardDefinitions,
          {
            enteredBiomes: { LIBRARY: 1 },
            biomeRunsCompleted: {},
            eliteKillsByBiome: {},
            bossKillsByBiome: {},
            byCharacter: {},
          },
          []
        ),
        character
      )
    );
    const opening = pool.filter((card) => unlocked.has(card.id));
    return {
      character,
      accessible: pool.length,
      opening: opening.map((c) => c.id),
      paths: BUILD_PATHS.map((path) => ({
        path,
        enablers: pool
          .filter((card) => getBuildProfile(card)[path]?.includes("enabler"))
          .map((c) => c.id),
        payoffs: pool
          .filter((card) => getBuildProfile(card)[path]?.includes("payoff"))
          .map((c) => c.id),
        openingEnablers: opening
          .filter((card) => getBuildProfile(card)[path]?.includes("enabler"))
          .map((c) => c.id),
        openingPayoffs: opening
          .filter((card) => getBuildProfile(card)[path]?.includes("payoff"))
          .map((c) => c.id),
      })),
    };
  }),
};
const output = process.argv[2];
if (output)
  fs.writeFileSync(
    output,
    JSON.stringify({ summary, cards: details }, null, 2)
  );
console.log(JSON.stringify(summary, null, 2));
if (
  summary.harmfulGeneratedBranches.length ||
  summary.harmfulInkedAdditions.length ||
  new Set(Object.values(summary.totalAccessible)).size !== 1
)
  process.exitCode = 1;

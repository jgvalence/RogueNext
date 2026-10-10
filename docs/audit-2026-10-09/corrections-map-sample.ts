import fs from "node:fs";
import { generateFloorMap, isValidFloorMapCandidate } from "../../src/game/engine/run";
import { getRunConditionMapRules, runConditionDefinitions } from "../../src/game/engine/run-conditions";
import { createRNG } from "../../src/game/engine/rng";
import { GAME_CONSTANTS } from "../../src/game/constants";
const conditions = [undefined, ...runConditionDefinitions.filter((c) => c.effects.mapRules).map((c) => c.id)];
const results = [];
for (const condition of conditions) {
  let fallbacks = 0, attempts = 0;
  for (let seed = 0; seed < 500; seed++) {
    const map = generateFloorMap(seed % 3 + 1, createRNG(`audit-corrections-map-${seed}`), GAME_CONSTANTS.ALL_BIOMES[seed % GAME_CONSTANTS.ALL_BIOMES.length]!, condition, seed % 6, {
      onGenerated: (fallback, count) => { fallbacks += Number(fallback); attempts += count; },
    });
    if (!isValidFloorMapCandidate(map, getRunConditionMapRules(condition))) throw new Error(`Invalid ${condition}:${seed}`);
  }
  results.push({ condition: condition ?? "standard", maps: 500, fallbacks, averageAttempts: attempts / 500 });
}
fs.writeFileSync("docs/audit-2026-10-09/corrections-map-sample.json", JSON.stringify(results, null, 2));
console.log(JSON.stringify(results));

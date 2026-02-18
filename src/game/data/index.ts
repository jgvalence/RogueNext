import type { CardDefinition } from "../schemas/cards";
import type { EnemyDefinition } from "../schemas/entities";
import { starterCardDefinitions, starterDeckComposition } from "./starter-deck";
import { lootableCardDefinitions } from "./cards";
import { enemyDefinitions } from "./enemies";
import { relicDefinitions } from "./relics";
import { allyDefinitions } from "./allies";

export {
  starterCardDefinitions,
  starterDeckComposition,
  lootableCardDefinitions,
  enemyDefinitions,
  relicDefinitions,
  allyDefinitions,
};

/** All card definitions (starter + lootable) */
export const allCardDefinitions: CardDefinition[] = [
  ...starterCardDefinitions,
  ...lootableCardDefinitions,
];

/** Card definitions as a Map for O(1) lookup */
export function buildCardDefsMap(
  cards: CardDefinition[] = allCardDefinitions
): Map<string, CardDefinition> {
  return new Map(cards.map((c) => [c.id, c]));
}

/** Enemy definitions as a Map for O(1) lookup */
export function buildEnemyDefsMap(
  enemies: EnemyDefinition[] = enemyDefinitions
): Map<string, EnemyDefinition> {
  return new Map(enemies.map((e) => [e.id, e]));
}

/** Relic definitions as a Map */
export function buildRelicDefsMap() {
  return new Map(relicDefinitions.map((r) => [r.id, r]));
}

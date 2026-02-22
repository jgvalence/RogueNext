import type { CardDefinition } from "../schemas/cards";
import type { EnemyDefinition, AllyDefinition } from "../schemas/entities";
import { starterCardDefinitions, starterDeckComposition } from "./starter-deck";
import { lootableCardDefinitions } from "./cards";
import { enemyDefinitions } from "./enemies";
import { relicDefinitions } from "./relics";
import { allyDefinitions } from "./allies";
import { BIOME_METADATA } from "./biomes";
import {
  biomeCombatDoctrines,
  enemyRolePrinciples,
  disruptionEffectCatalog,
} from "./combat-doctrine";
import { histoireDefinitions, buildHistoireDefsMap } from "./histoires";

export {
  starterCardDefinitions,
  starterDeckComposition,
  lootableCardDefinitions,
  enemyDefinitions,
  relicDefinitions,
  allyDefinitions,
  BIOME_METADATA,
  biomeCombatDoctrines,
  enemyRolePrinciples,
  disruptionEffectCatalog,
  histoireDefinitions,
  buildHistoireDefsMap,
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

/** Ally definitions as a Map for O(1) lookup */
export function buildAllyDefsMap(
  allies: AllyDefinition[] = allyDefinitions
): Map<string, AllyDefinition> {
  return new Map(allies.map((a) => [a.id, a]));
}

/** Relic definitions as a Map */
export function buildRelicDefsMap() {
  return new Map(relicDefinitions.map((r) => [r.id, r]));
}

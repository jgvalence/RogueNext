import {
  applyArchivistAbilityMechanics,
  triggerArchivistPhaseTwo,
} from "../archivist";

import {
  addCardsToDrawPile,
  applyBonusDamageFromCurseCount,
  applyFlatBonusDamage,
  applyNextTurnCardCostIncrease,
  grantEnemyStrength,
  healEnemy,
  summonEnemyIfPossible,
} from "./shared";
import type { BossMechanics, BossMechanicsById } from "./types";

const chapterGuardianBossMechanics: BossMechanics = {
  // Core encounter logic stays in chapter-guardian.ts.
  onPhaseThreshold: ({ state, enemy }) => {
    let current = healEnemy(state, enemy.instanceId, 16);
    current = grantEnemyStrength(current, enemy.instanceId, 2);
    current = addCardsToDrawPile(current, "haunting_regret", 1);
    current = addCardsToDrawPile(current, "binding_curse", 1);
    return applyNextTurnCardCostIncrease(current, 1);
  },
  onAbilityResolved: ({ state, enemy, ability, target, enemyDefs, rng }) => {
    let current = state;

    if (ability.name === "Page Storm") {
      current = summonEnemyIfPossible(current, "ink_slime", enemyDefs);
    }
    if (ability.name === "Ink Devour") {
      current = applyBonusDamageFromCurseCount(
        current,
        enemy.instanceId,
        target,
        rng,
        2
      );
    }

    return current;
  },
};

const archivistBossMechanics: BossMechanics = {
  // Core encounter logic stays in archivist.ts.
  onPhaseThreshold: ({ state, enemy }) => {
    let current = healEnemy(state, enemy.instanceId, 12);
    current = grantEnemyStrength(current, enemy.instanceId, 2);
    current = addCardsToDrawPile(current, "binding_curse", 1);
    return triggerArchivistPhaseTwo(current);
  },
  onAbilityResolved: ({ state, enemy, ability, target, rng }) => {
    let current = state;

    if (ability.name === "Corrupted Index") {
      current = addCardsToDrawPile(current, "binding_curse", 1);
    }
    if (ability.name === "Void Library" && current.player.inkCurrent <= 1) {
      current = applyFlatBonusDamage(current, enemy.instanceId, target, rng, 6);
    }

    return applyArchivistAbilityMechanics(current, ability.name, rng);
  },
};

export const libraryBossMechanicsById: BossMechanicsById = {
  chapter_guardian: chapterGuardianBossMechanics,
  the_archivist: archivistBossMechanics,
};

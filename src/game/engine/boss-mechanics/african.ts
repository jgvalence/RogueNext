import { addCardsToDrawPile, applyBonusDamageIfPlayerDebuffed } from "./shared";
import type { BossMechanics, BossMechanicsById } from "./types";
import {
  resolveSoundiataPostAbility,
  triggerSoundiataPhaseTwo,
} from "../soundiata-spirit";

const soundiataSpiritBossMechanics: BossMechanics = {
  onPhaseThreshold: ({ state, enemy, enemyDefs }) =>
    triggerSoundiataPhaseTwo(state, enemy.instanceId, enemyDefs),
  onAbilityResolved: ({ state, enemy }) =>
    resolveSoundiataPostAbility(state, enemy.instanceId),
};

const anansiWeaverBossMechanics: BossMechanics = {
  onPhaseThreshold: ({ state }) => state,
  onAbilityResolved: ({ state, ability, enemy, target, rng }) => {
    let current = state;

    if (ability.name === "Web Trap") {
      current = addCardsToDrawPile(current, "hexed_parchment", 1);
    }
    if (ability.name === "Story's End") {
      current = applyBonusDamageIfPlayerDebuffed(
        current,
        enemy.instanceId,
        target,
        rng,
        8
      );
    }

    return current;
  },
};

export const africanBossMechanicsById: BossMechanicsById = {
  soundiata_spirit: soundiataSpiritBossMechanics,
  anansi_weaver: anansiWeaverBossMechanics,
};

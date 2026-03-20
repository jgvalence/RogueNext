import { applyFenrirAbilityMechanics } from "../fenrir";
import {
  applyHelQueenAbilityMechanics,
  triggerHelQueenPhaseShift,
} from "../hel-queen";
import type { BossMechanics, BossMechanicsById } from "./types";

const fenrirBossMechanics: BossMechanics = {
  onPhaseThreshold: ({ state }) => state,
  onAbilityResolved: ({ state, enemy, ability, target, enemyDefs, rng }) =>
    applyFenrirAbilityMechanics(
      state,
      enemy.instanceId,
      ability,
      target,
      enemyDefs,
      rng
    ),
};

const helQueenBossMechanics: BossMechanics = {
  onPhaseThreshold: ({ state, enemy, enemyDefs }) => {
    void enemyDefs;
    return triggerHelQueenPhaseShift(state, enemy.instanceId);
  },
  onAbilityResolved: ({ state, enemy, rng }) =>
    applyHelQueenAbilityMechanics(state, enemy.instanceId, rng),
};

export const vikingBossMechanicsById: BossMechanicsById = {
  fenrir: fenrirBossMechanics,
  hel_queen: helQueenBossMechanics,
};

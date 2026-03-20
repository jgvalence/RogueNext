import { applyBonusDamageIfPlayerDebuffed } from "./shared";
import type { BossMechanics, BossMechanicsById } from "./types";
import { triggerNyarlathotepPhaseTwo } from "../nyarlathotep";
import {
  resolveShubPostAbility,
  triggerShubSpawnPhaseTwo,
} from "../shub-spawn";

const nyarlathotepShardBossMechanics: BossMechanics = {
  onPhaseThreshold: ({ state, enemy, enemyDefs }) =>
    triggerNyarlathotepPhaseTwo(state, enemy.instanceId, enemyDefs),
  onAbilityResolved: ({ state }) => state,
};

const shubSpawnBossMechanics: BossMechanics = {
  onPhaseThreshold: ({ state, enemy, enemyDefs }) =>
    triggerShubSpawnPhaseTwo(state, enemy.instanceId, enemyDefs),
  onAbilityResolved: ({ state, ability, enemy, target, enemyDefs, rng }) => {
    let current = resolveShubPostAbility(
      state,
      enemy.instanceId,
      ability.name,
      enemyDefs
    );

    if (ability.name === "Dark Young Stomp") {
      current = applyBonusDamageIfPlayerDebuffed(
        current,
        enemy.instanceId,
        target,
        rng,
        6
      );
    }

    return current;
  },
};

export const lovecraftianBossMechanicsById: BossMechanicsById = {
  nyarlathotep_shard: nyarlathotepShardBossMechanics,
  shub_spawn: shubSpawnBossMechanics,
};

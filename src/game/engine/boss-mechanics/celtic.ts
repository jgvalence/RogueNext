import { applyFlatBonusDamage } from "./shared";
import type { BossMechanics, BossMechanicsById } from "./types";
import { resolveDagdaPostAbility, triggerDagdaPhaseTwo } from "../dagda-shadow";
import {
  getCernunnosAncientWrathBonus,
  resolveCernunnosPostAbility,
  triggerCernunnosPhaseTwo,
} from "../cernunnos-shade";

const dagdaShadowBossMechanics: BossMechanics = {
  onPhaseThreshold: ({ state, enemy, enemyDefs }) =>
    triggerDagdaPhaseTwo(state, enemy.instanceId, enemyDefs),
  onAbilityResolved: ({ state, ability, enemy, enemyDefs }) =>
    resolveDagdaPostAbility(state, enemy.instanceId, ability.name, enemyDefs),
};

const cernunnosShadeBossMechanics: BossMechanics = {
  onPhaseThreshold: ({ state, enemy, enemyDefs }) =>
    triggerCernunnosPhaseTwo(state, enemy.instanceId, enemyDefs),
  onAbilityResolved: ({ state, ability, enemy, target, rng }) => {
    let current = state;
    if (ability.name === "Ancient Wrath") {
      current = applyFlatBonusDamage(
        current,
        enemy.instanceId,
        target,
        rng,
        getCernunnosAncientWrathBonus(enemy)
      );
    }
    return resolveCernunnosPostAbility(current, enemy.instanceId);
  },
};

export const celticBossMechanicsById: BossMechanicsById = {
  dagda_shadow: dagdaShadowBossMechanics,
  cernunnos_shade: cernunnosShadeBossMechanics,
};

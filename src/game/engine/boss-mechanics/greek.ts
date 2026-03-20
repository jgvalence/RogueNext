import { applyBonusDamageIfPlayerDebuffed } from "./shared";
import { synchronizeMedusaCombatState } from "../medusa";
import { triggerHydraPhaseShift } from "../hydra";
import type { BossMechanics, BossMechanicsById } from "./types";

const medusaBossMechanics: BossMechanics = {
  onPhaseThreshold: ({ state }) => synchronizeMedusaCombatState(state),
  onAbilityResolved: ({ state, ability, enemy, target, rng }) => {
    if (ability.name !== "Stone Crush")
      return synchronizeMedusaCombatState(state);

    return synchronizeMedusaCombatState(
      applyBonusDamageIfPlayerDebuffed(state, enemy.instanceId, target, rng, 8)
    );
  },
};

const hydraAspectBossMechanics: BossMechanics = {
  onPhaseThreshold: ({ state }) => triggerHydraPhaseShift(state),
};

export const greekBossMechanicsById: BossMechanicsById = {
  medusa: medusaBossMechanics,
  hydra_aspect: hydraAspectBossMechanics,
};

import { resolveQuetzalcoatlPostAbility } from "../quetzalcoatl";
import {
  applyTezcatlipocaMirrorEchoes,
  synchronizeTezcatlipocaCombatState,
} from "../tezcatlipoca";
import type { BossMechanics, BossMechanicsById } from "./types";

const tezcatlipocaEchoBossMechanics: BossMechanics = {
  onPhaseThreshold: ({ state }) => synchronizeTezcatlipocaCombatState(state),
  onAbilityResolved: ({ state, enemy, rng }) =>
    applyTezcatlipocaMirrorEchoes(state, enemy.instanceId, rng),
};

const quetzalcoatlWrathBossMechanics: BossMechanics = {
  onAbilityResolved: ({ state, enemy }) =>
    resolveQuetzalcoatlPostAbility(state, enemy.instanceId),
};

export const aztecBossMechanicsById: BossMechanicsById = {
  tezcatlipoca_echo: tezcatlipocaEchoBossMechanics,
  quetzalcoatl_wrath: quetzalcoatlWrathBossMechanics,
};

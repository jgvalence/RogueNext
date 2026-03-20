import {
  applyOsirisVerdict,
  synchronizeOsirisCombatState,
} from "../osiris-judgment";
import { applyRaSolarJudgment, synchronizeRaCombatState } from "../ra-avatar";
import type { BossMechanics, BossMechanicsById } from "./types";

const raAvatarBossMechanics: BossMechanics = {
  onPhaseThreshold: ({ state }) => synchronizeRaCombatState(state),
  onAbilityResolved: ({ state, ability, enemy, target, rng }) =>
    applyRaSolarJudgment(state, enemy.instanceId, ability, target, rng),
};

const osirisJudgmentBossMechanics: BossMechanics = {
  onPhaseThreshold: ({ state }) => synchronizeOsirisCombatState(state),
  onAbilityResolved: ({ state, ability, enemy, target, rng }) =>
    applyOsirisVerdict(state, enemy.instanceId, ability, target, rng),
};

export const egyptianBossMechanicsById: BossMechanicsById = {
  ra_avatar: raAvatarBossMechanics,
  osiris_judgment: osirisJudgmentBossMechanics,
};

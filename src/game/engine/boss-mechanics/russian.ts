import {
  applyBabaYagaAbilityMechanics,
  triggerBabaYagaPhaseShift,
} from "../baba-yaga";
import {
  applyKoscheiAbilityMechanics,
  triggerKoscheiPhaseShift,
} from "../koschei";
import type { BossMechanics, BossMechanicsById } from "./types";

const babaYagaHutBossMechanics: BossMechanics = {
  onPhaseThreshold: ({ state, enemy, enemyDefs }) =>
    triggerBabaYagaPhaseShift(state, enemy.instanceId, enemyDefs),
  onAbilityResolved: ({ state, enemy }) =>
    applyBabaYagaAbilityMechanics(state, enemy.instanceId),
};

const koscheiDeathlessBossMechanics: BossMechanics = {
  onPhaseThreshold: ({ state, enemyDefs }) =>
    triggerKoscheiPhaseShift(state, enemyDefs),
  onAbilityResolved: ({ state, ability, enemy, target, rng }) => {
    return applyKoscheiAbilityMechanics(
      state,
      enemy.instanceId,
      ability.name,
      target,
      rng
    );
  },
};

export const russianBossMechanicsById: BossMechanicsById = {
  baba_yaga_hut: babaYagaHutBossMechanics,
  koschei_deathless: koscheiDeathlessBossMechanics,
};

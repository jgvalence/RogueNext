import { GAME_CONSTANTS } from "@/game/constants";
import { createRNG } from "@/game/engine/rng";
import type { BiomeType } from "@/game/schemas/enums";
import type { RunState } from "@/game/schemas/run-state";

export function normalizeRunHpFromMetaBonuses(
  state: RunState,
  nextExtraHpBonus: number
): Pick<RunState, "playerMaxHp" | "playerCurrentHp"> {
  const previousExtraHpBonus = state.metaBonuses?.extraHp ?? 0;
  const extraHpDelta = nextExtraHpBonus - previousExtraHpBonus;
  const nextPlayerMaxHp = Math.max(1, state.playerMaxHp + extraHpDelta);
  const nextPlayerCurrentHp = Math.max(
    0,
    Math.min(nextPlayerMaxHp, state.playerCurrentHp + extraHpDelta)
  );

  return {
    playerMaxHp: nextPlayerMaxHp,
    playerCurrentHp: nextPlayerCurrentHp,
  };
}

export function recoverPendingBiomeChoices(
  state: RunState,
  normalizedCurrentRoom: number,
  isInfiniteRun: boolean
): RunState["pendingBiomeChoices"] {
  const needsBiomeChoicesRecovery =
    state.pendingBiomeChoices === null &&
    state.combat === null &&
    normalizedCurrentRoom >= GAME_CONSTANTS.ROOMS_PER_FLOOR &&
    (isInfiniteRun || state.floor < GAME_CONSTANTS.MAX_FLOORS);

  if (!needsBiomeChoicesRecovery) {
    return state.pendingBiomeChoices ?? null;
  }

  const shuffledBiomes = createRNG(
    `${state.seed}-recover-biomes-floor-${state.floor}`
  ).shuffle([...GAME_CONSTANTS.AVAILABLE_BIOMES]);

  return state.floor === 1
    ? (["LIBRARY", shuffledBiomes[0]!] as [BiomeType, BiomeType])
    : ([shuffledBiomes[0]!, shuffledBiomes[1]!] as [BiomeType, BiomeType]);
}

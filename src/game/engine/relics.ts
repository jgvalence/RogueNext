import type { CombatState } from "../schemas/combat-state";
import type { RunState } from "../schemas/run-state";

/**
 * Apply relic effects at combat start.
 * Called after initCombat to modify the initial combat state.
 */
export function applyRelicsOnCombatStart(
  state: CombatState,
  relicIds: string[]
): CombatState {
  let current = state;

  for (const relicId of relicIds) {
    switch (relicId) {
      case "ancient_quill":
        // +2 ink max
        current = {
          ...current,
          player: {
            ...current.player,
            inkMax: current.player.inkMax + 2,
          },
        };
        break;

      case "energy_crystal":
        // +1 energy max
        current = {
          ...current,
          player: {
            ...current.player,
            energyMax: current.player.energyMax + 1,
            energyCurrent: current.player.energyCurrent + 1,
          },
        };
        break;

      case "bookmark":
        // +1 draw per turn
        current = {
          ...current,
          player: {
            ...current.player,
            drawCount: current.player.drawCount + 1,
          },
        };
        break;

      case "ink_stamp":
        // Start combat with 3 ink
        current = {
          ...current,
          player: {
            ...current.player,
            inkCurrent: current.player.inkCurrent + 3,
          },
        };
        break;

      case "iron_binding":
        // +1 ink per card played
        current = {
          ...current,
          player: {
            ...current.player,
            inkPerCardPlayed: current.player.inkPerCardPlayed + 1,
          },
        };
        break;
    }
  }

  return current;
}

/**
 * Apply relic effects on run state (passive, non-combat).
 */
export function applyRelicsOnRun(runState: RunState): RunState {
  // MVP: no run-level relic effects yet
  return runState;
}

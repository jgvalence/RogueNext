import { isRunConditionCardLootUnlockResourceKey } from "@/game/engine/run-conditions";
import { z } from "zod";
import { BiomeResource } from "@/game/schemas/enums";
import { RunStateSchema, type RunState } from "@/game/schemas/run-state";
import { buildCardDefsMap, buildEnemyDefsMap } from "@/game/data";

// Validation protects storage and invariants. Client simulations remain unranked.
export const saveRunStateSchema = z
  .object({
    runId: z.string().min(1).max(128),
    state: RunStateSchema.strict(),
  })
  .strict();

export function validateRunSnapshot(state: RunState, previous: RunState): void {
  if (JSON.stringify(state).length > 2_000_000)
    throw new Error("Snapshot too large");
  if (
    state.runId !== previous.runId ||
    state.seed !== previous.seed ||
    state.runStartedAtMs !== previous.runStartedAtMs
  )
    throw new Error("Run identity mismatch");
  if (
    state.floor < previous.floor ||
    state.floor < 1 ||
    state.floor > 100_000 ||
    state.currentRoom < 0 ||
    state.currentRoom > state.map.length ||
    state.gold < 0 ||
    state.gold > 1_000_000 ||
    state.deck.length > 500 ||
    state.playerMaxHp < 1 ||
    state.playerMaxHp > 100_000 ||
    state.playerCurrentHp < 0 ||
    state.playerCurrentHp > state.playerMaxHp ||
    (state.selectedDifficultyLevel ?? 0) > 5
  )
    throw new Error("Invalid run bounds");
  if (
    previous.pendingCharacterChoices === null &&
    state.characterId !== previous.characterId
  )
    throw new Error("Character cannot change during a run");
  if (
    previous.selectedDifficultyLevel != null &&
    state.selectedDifficultyLevel !== previous.selectedDifficultyLevel
  )
    throw new Error("Difficulty cannot change during a run");
  const cards = buildCardDefsMap();
  const enemies = buildEnemyDefsMap();
  if (
    state.deck.some((card) => !cards.has(card.definitionId)) ||
    new Set(state.deck.map((card) => card.instanceId)).size !==
      state.deck.length ||
    state.combat?.enemies.some((enemy) => !enemies.has(enemy.definitionId))
  )
    throw new Error("Unknown or duplicate entity");
  const resourceKeys = new Set<string>(BiomeResource.options);
  for (const resources of [
    state.earnedResources,
    state.startMerchantSpentResources ?? {},
  ]) {
    if (
      Object.entries(resources).some(
        ([key, value]) =>
          (!resourceKeys.has(key) &&
            !isRunConditionCardLootUnlockResourceKey(key)) ||
          value < 0 ||
          value > 1_000_000
      )
    )
      throw new Error("Invalid resources");
  }
}

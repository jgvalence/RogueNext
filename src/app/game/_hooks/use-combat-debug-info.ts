"use client";

import { useMemo } from "react";
import { GAME_CONSTANTS } from "@/game/constants";
import type { EnemyDefinition } from "@/game/schemas/entities";
import type { RunState } from "@/game/schemas/run-state";

interface UseCombatDebugInfoParams {
  isDevBuild: boolean;
  isAdmin: boolean;
  state: RunState;
  enemyDefs: Map<string, EnemyDefinition>;
}

export function useCombatDebugInfo({
  isDevBuild,
  isAdmin,
  state,
  enemyDefs,
}: UseCombatDebugInfoParams) {
  const debugEnemySelection = useMemo(() => {
    if (!isDevBuild || !isAdmin || !state.combat) return null;

    const roomChoices = state.map[state.currentRoom];
    const selectedRoom =
      roomChoices?.find((room) => room.completed) ?? roomChoices?.[0];
    const plannedEnemyIds = selectedRoom?.enemyIds ?? [];
    const activeEnemies = state.combat.enemies.map((enemy) => {
      const def = enemyDefs.get(enemy.definitionId);
      const hasDisruption =
        def?.abilities.some((ability) =>
          ability.effects.some((effect) =>
            [
              "FREEZE_HAND_CARDS",
              "NEXT_DRAW_TO_DISCARD_THIS_TURN",
              "DISABLE_INK_POWER_THIS_TURN",
              "INCREASE_CARD_COST_THIS_TURN",
              "INCREASE_CARD_COST_NEXT_TURN",
              "REDUCE_DRAW_THIS_TURN",
              "REDUCE_DRAW_NEXT_TURN",
              "FORCE_DISCARD_RANDOM",
            ].includes(effect.type)
          )
        ) ?? false;
      return {
        instanceId: enemy.instanceId,
        definitionId: enemy.definitionId,
        biome: def?.biome ?? "UNKNOWN",
        role: def?.role ?? "UNKNOWN",
        hasDisruption,
      };
    });
    const hasThematicUnit = activeEnemies.some(
      (enemy) =>
        enemy.hasDisruption ||
        enemy.role === "SUPPORT" ||
        enemy.role === "CONTROL" ||
        enemy.role === "TANK"
    );
    return {
      floor: state.floor,
      room: state.currentRoom,
      biome: state.currentBiome,
      plannedEnemyIds,
      activeEnemies,
      hasThematicUnit,
    };
  }, [
    isAdmin,
    isDevBuild,
    enemyDefs,
    state.combat,
    state.currentBiome,
    state.currentRoom,
    state.floor,
    state.map,
  ]);

  const debugDrawInfo = useMemo(() => {
    if (!isDevBuild || !isAdmin || !state.combat) return null;
    return {
      drawCount: state.combat.player.drawCount,
      handSize: state.combat.hand.length,
      maxHandSize: GAME_CONSTANTS.MAX_HAND_SIZE,
      pendingOverflow: state.combat.pendingHandOverflowExhaust ?? 0,
      history: [...(state.combat.drawDebugHistory ?? [])].slice(-12).reverse(),
    };
  }, [isAdmin, isDevBuild, state.combat]);

  return {
    debugEnemySelection,
    debugDrawInfo,
  };
}

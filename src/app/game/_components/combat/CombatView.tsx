"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils/cn";
import type { CombatState } from "@/game/schemas/combat-state";
import type { CardDefinition } from "@/game/schemas/cards";
import type { EnemyDefinition } from "@/game/schemas/entities";
import type { InkPowerType } from "@/game/schemas/enums";
import { EnemyCard } from "./EnemyCard";
import { HandArea } from "./HandArea";
import { PlayerStats } from "./PlayerStats";
import { InkGauge } from "./InkGauge";

interface CombatViewProps {
  combat: CombatState;
  cardDefs: Map<string, CardDefinition>;
  enemyDefs: Map<string, EnemyDefinition>;
  onPlayCard: (
    instanceId: string,
    targetId: string | null,
    useInked: boolean
  ) => void;
  onEndTurn: () => void;
  onUseInkPower: (power: InkPowerType, targetId: string | null) => void;
}

export function CombatView({
  combat,
  cardDefs,
  enemyDefs,
  onPlayCard,
  onEndTurn,
  onUseInkPower,
}: CombatViewProps) {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [pendingInked, setPendingInked] = useState(false);

  const selectedCard = selectedCardId
    ? combat.hand.find((c) => c.instanceId === selectedCardId)
    : null;
  const selectedDef = selectedCard
    ? cardDefs.get(selectedCard.definitionId)
    : null;
  const needsTarget =
    selectedDef?.targeting === "SINGLE_ENEMY" ||
    selectedDef?.targeting === "SINGLE_ALLY";

  const handleEnemyClick = useCallback(
    (enemyInstanceId: string) => {
      if (selectedCardId && needsTarget) {
        onPlayCard(selectedCardId, enemyInstanceId, pendingInked);
        setSelectedCardId(null);
        setPendingInked(false);
      }
    },
    [selectedCardId, needsTarget, pendingInked, onPlayCard]
  );

  const handlePlayCard = useCallback(
    (instanceId: string, useInked: boolean) => {
      const card = combat.hand.find((c) => c.instanceId === instanceId);
      if (!card) return;
      const def = cardDefs.get(card.definitionId);
      if (!def) return;

      if (def.targeting === "SINGLE_ENEMY" || def.targeting === "SINGLE_ALLY") {
        setSelectedCardId(instanceId);
        setPendingInked(useInked);
        return;
      }

      onPlayCard(instanceId, null, useInked);
      setSelectedCardId(null);
      setPendingInked(false);
    },
    [combat.hand, cardDefs, onPlayCard]
  );

  const isPlayerTurn = combat.phase === "PLAYER_TURN";

  return (
    <div className="flex h-full flex-col">
      {/* Turn indicator */}
      <div className="flex items-center justify-center py-2">
        <span
          className={cn(
            "rounded px-3 py-1 text-sm font-medium transition-all duration-300",
            isPlayerTurn
              ? "bg-green-800/80 text-green-300"
              : combat.phase === "COMBAT_WON"
                ? "bg-yellow-800/80 text-yellow-300"
                : combat.phase === "COMBAT_LOST"
                  ? "bg-red-800/80 text-red-300"
                  : "bg-gray-700 text-gray-300"
          )}
        >
          Turn {combat.turnNumber} —{" "}
          {isPlayerTurn ? "Your Turn" : combat.phase.replace(/_/g, " ")}
        </span>
      </div>

      {/* Enemies area */}
      <div className="flex flex-1 items-start justify-center gap-4 px-4 pt-4">
        {combat.enemies.map((enemy) => {
          const def = enemyDefs.get(enemy.definitionId);
          if (!def) return null;
          return (
            <EnemyCard
              key={enemy.instanceId}
              enemy={enemy}
              definition={def}
              isTargeted={needsTarget && selectedCardId !== null}
              onClick={() => handleEnemyClick(enemy.instanceId)}
            />
          );
        })}
      </div>

      {/* Target hint */}
      {needsTarget && selectedCardId && (
        <div className="py-2 text-center text-sm text-yellow-400">
          Select a target for {selectedDef?.name}
        </div>
      )}

      {/* Player area */}
      <div className="space-y-2 border-t border-gray-700 bg-gray-900 px-4 pb-4 pt-3">
        {/* Player stats + Ink gauge + End turn */}
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <PlayerStats player={combat.player} />
          </div>
          <div className="w-64">
            <InkGauge
              player={combat.player}
              combatState={combat}
              onUsePower={(power) => onUseInkPower(power, null)}
            />
          </div>
          <button
            className="rounded-lg bg-green-700 px-4 py-3 font-bold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!isPlayerTurn}
            onClick={onEndTurn}
          >
            End Turn
          </button>
        </div>

        {/* Hand */}
        <HandArea
          hand={combat.hand}
          combatState={combat}
          cardDefs={cardDefs}
          selectedCardId={selectedCardId}
          onSelectCard={setSelectedCardId}
          onPlayCard={handlePlayCard}
        />

        {/* Pile counts */}
        <div className="flex justify-center gap-4 text-xs text-gray-500">
          <span>Draw: {combat.drawPile.length}</span>
          <span>Discard: {combat.discardPile.length}</span>
          <span>Exhaust: {combat.exhaustPile.length}</span>
        </div>
      </div>
    </div>
  );
}

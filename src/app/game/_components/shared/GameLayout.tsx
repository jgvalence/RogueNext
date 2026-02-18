"use client";

import { type ReactNode } from "react";
import { useGame } from "../../_providers/game-provider";

interface GameLayoutProps {
  children: ReactNode;
}

export function GameLayout({ children }: GameLayoutProps) {
  const { state } = useGame();

  return (
    <div className="flex min-h-screen flex-col bg-gray-900 text-white">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-gray-700 bg-gray-800 px-4 py-2">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">
            Floor {state.floor} — Room {state.currentRoom + 1}/
            {state.map.length}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-yellow-400">
            {state.gold} Gold
          </span>
          <span className="text-sm text-gray-400">
            Deck: {state.deck.length} cards
          </span>
          {state.relicIds.length > 0 && (
            <span className="text-sm text-purple-400">
              {state.relicIds.length} relics
            </span>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1">{children}</div>
    </div>
  );
}

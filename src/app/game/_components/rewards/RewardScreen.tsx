"use client";

import type { CardDefinition } from "@/game/schemas/cards";
import { GameCard } from "../combat/GameCard";

interface RewardScreenProps {
  gold: number;
  cardChoices: CardDefinition[];
  onPickCard: (definitionId: string) => void;
  onSkip: () => void;
}

export function RewardScreen({
  gold,
  cardChoices,
  onPickCard,
  onSkip,
}: RewardScreenProps) {
  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <h2 className="text-2xl font-bold text-green-400">Victory!</h2>

      <div className="text-lg text-yellow-400">+{gold} Gold</div>

      <p className="text-sm text-gray-400">
        Choose a card to add to your deck:
      </p>

      <div className="flex gap-4">
        {cardChoices.map((card) => (
          <GameCard
            key={card.id}
            definition={card}
            canPlay={true}
            onClick={() => onPickCard(card.id)}
            size="md"
          />
        ))}
      </div>

      <button
        className="rounded-lg border border-gray-600 px-6 py-2 text-sm text-gray-400 transition hover:bg-gray-800"
        onClick={onSkip}
      >
        Skip
      </button>
    </div>
  );
}

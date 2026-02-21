"use client";

import type { CardDefinition } from "@/game/schemas/cards";
import type { BiomeResource } from "@/game/schemas/enums";
import type { RelicDefinitionData } from "@/game/data/relics";
import type { AllyDefinition } from "@/game/schemas/entities";
import { GameCard } from "../combat/GameCard";

const RESOURCE_LABELS: Record<string, string> = {
  PAGES: "Pages",
  RUNES: "Runes",
  LAURIERS: "Lauriers",
  GLYPHES: "Glyphes",
  FRAGMENTS: "Fragments",
  OBSIDIENNE: "Obsidienne",
  AMBRE: "Ambre",
  SCEAUX: "Sceaux",
  MASQUES: "Masques",
};

interface RewardScreenProps {
  gold: number;
  cardChoices: CardDefinition[];
  biomeResources: Partial<Record<BiomeResource, number>>;
  relicChoices: RelicDefinitionData[];
  allyChoices: AllyDefinition[];
  isBoss?: boolean;
  isElite?: boolean;
  onPickCard: (definitionId: string) => void;
  onPickRelic: (relicId: string) => void;
  onPickAlly: (allyId: string) => void;
  onSkip: () => void;
}

export function RewardScreen({
  gold,
  cardChoices,
  biomeResources,
  relicChoices,
  allyChoices,
  isBoss,
  isElite,
  onPickCard,
  onPickRelic,
  onPickAlly,
  onSkip,
}: RewardScreenProps) {
  const resourceEntries = Object.entries(biomeResources).filter(
    ([, v]) => (v ?? 0) > 0
  );
  const hasCardChoices = cardChoices.length > 0;
  const hasRelicChoices = relicChoices.length > 0;
  const hasAllyChoices = allyChoices.length > 0;
  const hasAnyEliteChoice = hasCardChoices || hasRelicChoices || hasAllyChoices;

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <h2 className="text-2xl font-bold text-green-400">Victory!</h2>

      {/* Gold */}
      <div className="text-lg text-yellow-400">+{gold} Gold</div>

      {/* Resources earned */}
      {resourceEntries.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {resourceEntries.map(([key, val]) => (
            <span
              key={key}
              className="rounded border border-amber-700/50 bg-amber-950/60 px-2.5 py-1 text-xs font-semibold text-amber-300"
            >
              +{val} {RESOURCE_LABELS[key] ?? key}
            </span>
          ))}
        </div>
      )}

      {/* Boss: must pick one of 3 relics */}
      {isBoss && relicChoices.length > 0 && (
        <>
          <p className="text-sm font-medium text-purple-400">Choose a relic:</p>
          <div className="flex flex-wrap justify-center gap-3">
            {relicChoices.map((relic) => (
              <RelicCard key={relic.id} relic={relic} onPick={onPickRelic} />
            ))}
            {allyChoices.map((ally) => (
              <AllyCard key={ally.id} ally={ally} onPick={onPickAlly} />
            ))}
          </div>
        </>
      )}

      {/* Elite: pick a rare card OR a relic */}
      {isElite && !isBoss && (
        <>
          <p className="text-sm text-gray-400">
            {hasCardChoices && hasRelicChoices
              ? "Choose your reward - card or relic:"
              : hasCardChoices
                ? "Choose your reward - card:"
                : hasRelicChoices
                  ? "Choose your reward - relic:"
                  : hasAllyChoices
                    ? "Choose your reward - ally:"
                    : "No reward choices available."}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {cardChoices.map((card) => (
              <GameCard
                key={card.id}
                definition={card}
                canPlay={true}
                onClick={() => onPickCard(card.id)}
                size="md"
              />
            ))}
            {relicChoices.map((relic) => (
              <RelicCard key={relic.id} relic={relic} onPick={onPickRelic} />
            ))}
            {allyChoices.map((ally) => (
              <AllyCard key={ally.id} ally={ally} onPick={onPickAlly} />
            ))}
          </div>
          {!hasAnyEliteChoice && (
            <button
              className="rounded-lg border border-gray-600 px-6 py-2 text-sm text-gray-400 transition hover:bg-gray-800"
              onClick={onSkip}
            >
              Continue
            </button>
          )}
        </>
      )}

      {/* Normal: pick a card or skip */}
      {!isBoss && !isElite && (
        <>
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
        </>
      )}
    </div>
  );
}

function AllyCard({
  ally,
  onPick,
}: {
  ally: AllyDefinition;
  onPick: (allyId: string) => void;
}) {
  return (
    <button
      onClick={() => onPick(ally.id)}
      className="flex w-40 flex-col items-center gap-2 rounded-xl border-2 border-cyan-700 bg-cyan-950/40 p-4 text-center transition hover:border-cyan-500 hover:bg-cyan-950/60"
    >
      <span className="text-xs font-semibold uppercase tracking-widest text-cyan-300">
        Ally
      </span>
      <span className="text-sm font-bold text-white">{ally.name}</span>
      <span className="text-xs text-cyan-200">
        {ally.maxHp} HP · {ally.speed} SPD
      </span>
    </button>
  );
}

function RelicCard({
  relic,
  onPick,
}: {
  relic: RelicDefinitionData;
  onPick: (relicId: string) => void;
}) {
  return (
    <button
      onClick={() => onPick(relic.id)}
      className="flex w-36 flex-col items-center gap-2 rounded-xl border-2 border-purple-700 bg-purple-950/40 p-4 text-center transition hover:border-purple-500 hover:bg-purple-950/60"
    >
      <span className="text-xs font-semibold uppercase tracking-widest text-purple-400">
        {relic.rarity}
      </span>
      <span className="text-sm font-bold text-white">{relic.name}</span>
      <span className="text-xs text-purple-200">{relic.description}</span>
    </button>
  );
}

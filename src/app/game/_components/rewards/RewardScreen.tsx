"use client";

"use client";

import { useCallback, useState } from "react";
import type { CardDefinition } from "@/game/schemas/cards";
import type { BiomeResource } from "@/game/schemas/enums";
import type { RelicDefinitionData } from "@/game/data/relics";
import type { AllyDefinition } from "@/game/schemas/entities";
import type { Effect } from "@/game/schemas/effects";
import { GameCard } from "../combat/GameCard";
import {
  UpgradePreviewPortal,
  type UpgradePreviewHoverInfo,
} from "../shared/UpgradePreviewPortal";

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
  bossMaxHpBonus?: number | null;
  isBoss?: boolean;
  isElite?: boolean;
  onPickCard: (definitionId: string) => void;
  onPickRelic: (relicId: string) => void;
  onPickAlly: (allyId: string) => void;
  onPickMaxHp?: (amount: number) => void;
  onSkip: () => void;
}

export function RewardScreen({
  gold,
  cardChoices,
  biomeResources,
  relicChoices,
  allyChoices,
  bossMaxHpBonus,
  isBoss,
  isElite,
  onPickCard,
  onPickRelic,
  onPickAlly,
  onPickMaxHp,
  onSkip,
}: RewardScreenProps) {
  const [hoverInfo, setHoverInfo] = useState<UpgradePreviewHoverInfo | null>(
    null
  );
  const handleCardMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, card: CardDefinition) => {
      setHoverInfo({ definition: card, anchorEl: e.currentTarget });
    },
    []
  );
  const handleCardMouseLeave = useCallback(() => {
    setHoverInfo(null);
  }, []);

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

      <div className="text-lg text-yellow-400">+{gold} Gold</div>

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

      {isBoss && (relicChoices.length > 0 || bossMaxHpBonus) && (
        <>
          <p className="text-sm font-medium text-purple-400">
            Choose a reward:
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {relicChoices.map((relic) => (
              <RelicCard key={relic.id} relic={relic} onPick={onPickRelic} />
            ))}
            {allyChoices.map((ally) => (
              <AllyCard key={ally.id} ally={ally} onPick={onPickAlly} />
            ))}
            {bossMaxHpBonus && onPickMaxHp && (
              <button
                onClick={() => onPickMaxHp(bossMaxHpBonus)}
                className="flex w-36 flex-col items-center gap-2 rounded-xl border-2 border-red-700 bg-red-950/40 p-4 text-center transition hover:border-red-500 hover:bg-red-950/60"
              >
                <span className="text-xs font-semibold uppercase tracking-widest text-red-400">
                  Vitality
                </span>
                <span className="text-sm font-bold text-white">
                  +{bossMaxHpBonus} Max HP
                </span>
                <span className="text-xs text-red-200">
                  Increase your maximum health permanently
                </span>
              </button>
            )}
          </div>
        </>
      )}

      {isElite && !isBoss && (
        <>
          <p className="text-sm text-gray-400">
            {hasCardChoices && hasRelicChoices
              ? "Choose your reward: card or relic"
              : hasCardChoices
                ? "Choose your reward: card"
                : hasRelicChoices
                  ? "Choose your reward: relic"
                  : hasAllyChoices
                    ? "Choose your reward: ally"
                    : "No reward choices available."}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {cardChoices.map((card) => (
              <div
                key={card.id}
                onMouseEnter={(e) => handleCardMouseEnter(e, card)}
                onMouseLeave={handleCardMouseLeave}
              >
                <GameCard
                  definition={card}
                  canPlay={true}
                  onClick={() => onPickCard(card.id)}
                  size="md"
                />
              </div>
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

      {!isBoss && !isElite && (
        <>
          <p className="text-sm text-gray-400">
            Choose a card to add to your deck:
          </p>
          <div className="flex gap-4">
            {cardChoices.map((card) => (
              <div
                key={card.id}
                onMouseEnter={(e) => handleCardMouseEnter(e, card)}
                onMouseLeave={handleCardMouseLeave}
              >
                <GameCard
                  definition={card}
                  canPlay={true}
                  onClick={() => onPickCard(card.id)}
                  size="md"
                />
              </div>
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
      <UpgradePreviewPortal info={hoverInfo} />
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
        {ally.maxHp} HP - {ally.speed} SPD
      </span>
      <div className="mt-1 w-full space-y-1 text-left">
        {ally.abilities.map((ability, i) => (
          <div
            key={`${ally.id}-ability-${i}`}
            className="rounded border border-cyan-800/70 bg-cyan-900/40 px-2 py-1"
          >
            <div className="truncate text-[11px] font-semibold text-cyan-100">
              {ability.name}
            </div>
            <div className="text-[10px] text-cyan-300">
              {formatTarget(ability.target)} - {formatEffects(ability.effects)}
            </div>
          </div>
        ))}
      </div>
    </button>
  );
}

function formatTarget(target?: string): string {
  switch (target) {
    case "ALL_ENEMIES":
      return "all enemies";
    case "LOWEST_HP_ENEMY":
      return "lowest HP enemy";
    case "ALLY_PRIORITY":
      return "ally priority";
    case "SELF":
      return "self";
    case "PLAYER":
    default:
      return "player";
  }
}

function formatEffects(effects: Effect[]): string {
  return effects.map(formatEffect).join(", ");
}

function formatEffect(effect: Effect): string {
  switch (effect.type) {
    case "DAMAGE":
      return `damage ${effect.value}`;
    case "HEAL":
      return `heal ${effect.value}`;
    case "BLOCK":
      return `block ${effect.value}`;
    case "DRAW_CARDS":
      return `draw ${effect.value}`;
    case "GAIN_INK":
      return `gain ${effect.value} ink`;
    case "GAIN_ENERGY":
      return `gain ${effect.value} energy`;
    case "GAIN_FOCUS":
      return `gain ${effect.value} focus`;
    case "GAIN_STRENGTH":
      return `gain ${effect.value} strength`;
    case "APPLY_BUFF":
      return `buff ${effect.buff ?? "status"} ${effect.value}`;
    case "APPLY_DEBUFF":
      return `debuff ${effect.buff ?? "status"} ${effect.value}`;
    case "DRAIN_INK":
      return `drain ${effect.value} ink`;
    default:
      return `${effect.type.toLowerCase()} ${effect.value}`;
  }
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

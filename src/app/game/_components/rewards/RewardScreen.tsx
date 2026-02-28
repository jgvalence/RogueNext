"use client";

import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import type { CardDefinition } from "@/game/schemas/cards";
import type { BiomeResource } from "@/game/schemas/enums";
import type { RelicDefinitionData } from "@/game/data/relics";
import type { AllyDefinition } from "@/game/schemas/entities";
import type { Effect } from "@/game/schemas/effects";
import {
  localizeRelicDescription,
  localizeRelicName,
} from "@/lib/i18n/entity-text";
import { GameCard } from "../combat/GameCard";
import {
  UpgradePreviewPortal,
  type UpgradePreviewHoverInfo,
} from "../shared/UpgradePreviewPortal";

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
  const { t } = useTranslation();
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
    <div className="flex flex-col items-center gap-6 py-4 sm:py-8">
      <h2 className="text-2xl font-bold text-green-400">
        {t("reward.victory")}
      </h2>

      <div className="text-lg text-yellow-400">
        +{gold} {t("reward.gold")}
      </div>

      {resourceEntries.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {resourceEntries.map(([key, val]) => (
            <span
              key={key}
              className="rounded border border-amber-700/50 bg-amber-950/60 px-2.5 py-1 text-xs font-semibold text-amber-300"
            >
              +{val} {t(`reward.resources.${key}`, key)}
            </span>
          ))}
        </div>
      )}

      {isBoss && (relicChoices.length > 0 || bossMaxHpBonus) && (
        <>
          <p className="text-sm font-medium text-purple-400">
            {t("reward.chooseReward")}
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
                  {t("reward.vitality")}
                </span>
                <span className="text-sm font-bold text-white">
                  +{bossMaxHpBonus} {t("reward.maxHp")}
                </span>
                <span className="text-xs text-red-200">
                  {t("reward.maxHpDescription")}
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
              ? t("reward.chooseRewardCardOrRelic")
              : hasCardChoices
                ? t("reward.chooseRewardCard")
                : hasRelicChoices
                  ? t("reward.chooseRewardRelic")
                  : hasAllyChoices
                    ? t("reward.chooseRewardAlly")
                    : t("reward.noRewardChoices")}
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
              {t("reward.continue")}
            </button>
          )}
        </>
      )}

      {!isBoss && !isElite && (
        <>
          <p className="text-sm text-gray-400">{t("reward.chooseCardToAdd")}</p>
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
            {t("reward.skip")}
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
  const { t } = useTranslation();

  return (
    <button
      onClick={() => onPick(ally.id)}
      className="flex w-40 flex-col items-center gap-2 rounded-xl border-2 border-cyan-700 bg-cyan-950/40 p-4 text-center transition hover:border-cyan-500 hover:bg-cyan-950/60"
    >
      <span className="text-xs font-semibold uppercase tracking-widest text-cyan-300">
        {t("reward.ally")}
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
              {formatTarget(ability.target, t)} -{" "}
              {formatEffects(ability.effects, t)}
            </div>
          </div>
        ))}
      </div>
    </button>
  );
}

function formatTarget(target: string | undefined, t: TFunction): string {
  switch (target) {
    case "ALL_ENEMIES":
      return t("reward.target.allEnemies");
    case "LOWEST_HP_ENEMY":
      return t("reward.target.lowestHpEnemy");
    case "ALLY_PRIORITY":
      return t("reward.target.allyPriority");
    case "SELF":
      return t("reward.target.self");
    case "PLAYER":
    default:
      return t("reward.target.player");
  }
}

function formatEffects(effects: Effect[], t: TFunction): string {
  return effects.map((effect) => formatEffect(effect, t)).join(", ");
}

function formatEffect(effect: Effect, t: TFunction): string {
  switch (effect.type) {
    case "DAMAGE":
      return t("reward.effect.damage", { value: effect.value });
    case "DAMAGE_EQUAL_BLOCK":
      return t("reward.effect.damageEqualBlock");
    case "HEAL":
      return t("reward.effect.heal", { value: effect.value });
    case "BLOCK":
      return t("reward.effect.block", { value: effect.value });
    case "DRAW_CARDS":
      return t("reward.effect.drawCards", { value: effect.value });
    case "DOUBLE_POISON":
      return t("reward.effect.doublePoison");
    case "GAIN_INK":
      return t("reward.effect.gainInk", { value: effect.value });
    case "GAIN_ENERGY":
      return t("reward.effect.gainEnergy", { value: effect.value });
    case "GAIN_FOCUS":
      return t("reward.effect.gainFocus", { value: effect.value });
    case "GAIN_STRENGTH":
      return t("reward.effect.gainStrength", { value: effect.value });
    case "APPLY_BUFF":
      return t("reward.effect.applyBuff", {
        buff: effect.buff ?? "status",
        value: effect.value,
      });
    case "APPLY_DEBUFF":
      return t("reward.effect.applyDebuff", {
        buff: effect.buff ?? "status",
        value: effect.value,
      });
    case "DRAIN_INK":
      return t("reward.effect.drainInk", { value: effect.value });
    default:
      return t("reward.effect.fallback", {
        type: effect.type.toLowerCase(),
        value: effect.value,
      });
  }
}

function RelicCard({
  relic,
  onPick,
}: {
  relic: RelicDefinitionData;
  onPick: (relicId: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <button
      onClick={() => onPick(relic.id)}
      className="flex w-36 flex-col items-center gap-2 rounded-xl border-2 border-purple-700 bg-purple-950/40 p-4 text-center transition hover:border-purple-500 hover:bg-purple-950/60"
    >
      <span className="text-xs font-semibold uppercase tracking-widest text-purple-400">
        {t(`gameCard.rarity.${relic.rarity}`, relic.rarity)}
      </span>
      <span className="text-sm font-bold text-white">
        {localizeRelicName(relic.id, relic.name)}
      </span>
      <span className="text-xs text-purple-200">
        {localizeRelicDescription(relic.id, relic.description)}
      </span>
    </button>
  );
}

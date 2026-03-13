"use client";

import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import type { CardDefinition } from "@/game/schemas/cards";
import type { BiomeResource } from "@/game/schemas/enums";
import type { RelicDefinitionData } from "@/game/data/relics";
import type { AllyDefinition } from "@/game/schemas/entities";
import type { Effect } from "@/game/schemas/effects";
import { RogueButton, RogueTag } from "@/components/ui/rogue";
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
  showFirstRewardTutorial?: boolean;
  onDismissFirstRewardTutorial?: () => void;
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
  showFirstRewardTutorial = false,
  onDismissFirstRewardTutorial,
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
            <RogueTag
              key={key}
              bordered
              className="rounded border-amber-700/50 bg-amber-950/60 px-2.5 py-1 text-xs font-semibold text-amber-300"
            >
              +{val} {t(`reward.resources.${key}`, key)}
            </RogueTag>
          ))}
        </div>
      )}

      {showFirstRewardTutorial && (
        <div className="w-full max-w-3xl rounded-xl border border-cyan-400/45 bg-slate-950/90 p-4 shadow-[0_16px_50px_rgba(8,145,178,0.2)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-300/85">
            {t("reward.firstRewardTutorial.kicker")}
          </p>
          <h3 className="mt-1 text-sm font-black uppercase tracking-[0.08em] text-cyan-100">
            {t("reward.firstRewardTutorial.title")}
          </h3>
          <p className="mt-1.5 text-xs text-slate-200/90">
            {t("reward.firstRewardTutorial.description")}
          </p>
          <p className="mt-1.5 text-xs text-cyan-100/85">
            {t("reward.firstRewardTutorial.tip")}
          </p>
          <div className="mt-3 flex justify-end">
            <RogueButton
              type="text"
              className="!h-auto !rounded-md !border !border-cyan-500/65 !bg-cyan-700/25 !px-3 !py-1.5 !text-[10px] !font-bold !uppercase !tracking-[0.1em] !text-cyan-100 hover:!bg-cyan-600/35"
              onClick={() => onDismissFirstRewardTutorial?.()}
            >
              {t("reward.firstRewardTutorial.gotIt")}
            </RogueButton>
          </div>
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
              <RogueButton
                onClick={() => onPickMaxHp(bossMaxHpBonus)}
                type="text"
                className="!flex !h-auto !w-36 !flex-col !items-center !gap-2 !rounded-xl !border-2 !border-red-700 !bg-red-950/40 !p-4 !text-center !transition hover:!border-red-500 hover:!bg-red-950/60"
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
              </RogueButton>
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
            <RogueButton
              type="text"
              className="!h-auto !rounded-lg !border !border-gray-600 !px-6 !py-2 !text-sm !text-gray-400 !transition hover:!bg-gray-800"
              onClick={onSkip}
            >
              {t("reward.continue")}
            </RogueButton>
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
          <RogueButton
            type="text"
            className="!h-auto !rounded-lg !border !border-gray-600 !px-6 !py-2 !text-sm !text-gray-400 !transition hover:!bg-gray-800"
            onClick={onSkip}
          >
            {t("reward.skip")}
          </RogueButton>
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
    <RogueButton
      onClick={() => onPick(ally.id)}
      type="text"
      className="!flex !h-auto !w-40 !min-w-0 !flex-col !items-center !gap-2 !whitespace-normal !rounded-xl !border-2 !border-cyan-700 !bg-cyan-950/40 !p-4 !text-center !transition hover:!border-cyan-500 hover:!bg-cyan-950/60"
    >
      <span className="text-xs font-semibold uppercase tracking-widest text-cyan-300">
        {t("reward.ally")}
      </span>
      <span className="block w-full whitespace-normal break-words text-sm font-bold leading-tight text-white [overflow-wrap:anywhere]">
        {ally.name}
      </span>
      <span className="text-xs text-cyan-200">
        {ally.maxHp} HP - {ally.speed} SPD
      </span>
      <div className="mt-1 w-full space-y-1 text-left">
        {ally.abilities.map((ability, i) => (
          <div
            key={`${ally.id}-ability-${i}`}
            className="rounded border border-cyan-800/70 bg-cyan-900/40 px-2 py-1"
          >
            <div className="whitespace-normal break-words text-[11px] font-semibold leading-tight text-cyan-100 [overflow-wrap:anywhere]">
              {ability.name}
            </div>
            <div className="whitespace-normal break-words text-[10px] leading-relaxed text-cyan-300 [overflow-wrap:anywhere]">
              {formatTarget(ability.target, t)} -{" "}
              {formatEffects(ability.effects, t)}
            </div>
          </div>
        ))}
      </div>
    </RogueButton>
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
    case "DAMAGE_PER_DEBUFF":
      return t("reward.effect.damagePerDebuff", {
        value: effect.value,
        buff: effect.buff ?? "status",
      });
    case "DAMAGE_PER_CURRENT_INK":
      return t("reward.effect.damagePerCurrentInk", {
        value: effect.value,
      });
    case "DAMAGE_PER_CLOG_IN_DISCARD":
      return t("reward.effect.damagePerClogInDiscard", {
        value: effect.value,
      });
    case "DAMAGE_PER_EXHAUSTED_CARD":
      return t("reward.effect.damagePerExhaustedCard", {
        value: effect.value,
      });
    case "DAMAGE_PER_DRAWN_THIS_TURN":
      return t("reward.effect.damagePerDrawnThisTurn", {
        value: effect.value,
      });
    case "DAMAGE_BONUS_IF_UPGRADED_IN_HAND":
      return t("reward.effect.damageBonusIfUpgradedInHand", {
        value: effect.value,
      });
    case "HEAL":
      return t("reward.effect.heal", { value: effect.value });
    case "BLOCK":
      return t("reward.effect.block", { value: effect.value });
    case "BLOCK_PER_CURRENT_INK":
      return t("reward.effect.blockPerCurrentInk", {
        value: effect.value,
      });
    case "BLOCK_PER_DEBUFF":
      return t("reward.effect.blockPerDebuff", {
        value: effect.value,
        buff: effect.buff ?? "status",
      });
    case "BLOCK_PER_EXHAUSTED_CARD":
      return t("reward.effect.blockPerExhaustedCard", {
        value: effect.value,
      });
    case "APPLY_BUFF_PER_EXHAUSTED_CARD":
      return t("reward.effect.applyBuffPerExhaustedCard", {
        value: effect.value,
        buff: effect.buff ?? "status",
      });
    case "RETRIGGER_THORNS_ON_WEAK_ATTACK":
      return t("reward.effect.retriggerThornsOnWeakAttack", {
        value: effect.value,
      });
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
    case "EXHAUST":
      return t("reward.effect.exhaust");
    case "ADD_CARD_TO_DRAW":
      return t("gameCard.effect.addToDraw");
    case "ADD_CARD_TO_DISCARD":
      return t("gameCard.effect.addToDiscard");
    case "MOVE_RANDOM_NON_CLOG_DISCARD_TO_HAND":
      return t("reward.effect.moveRandomNonClogDiscardToHand", {
        value: effect.value,
      });
    case "FREEZE_HAND_CARDS":
      return t("reward.effect.freezeHandCards", { value: effect.value });
    case "NEXT_DRAW_TO_DISCARD_THIS_TURN":
      return t("reward.effect.nextDrawToDiscardThisTurn");
    case "INCREASE_CARD_COST_THIS_TURN":
      return t("reward.effect.increaseCardCostThisTurn", {
        value: effect.value,
      });
    case "INCREASE_CARD_COST_NEXT_TURN":
      return t("reward.effect.increaseCardCostNextTurn", {
        value: effect.value,
      });
    case "REDUCE_DRAW_THIS_TURN":
      return t("reward.effect.reduceDrawThisTurn", { value: effect.value });
    case "REDUCE_DRAW_NEXT_TURN":
      return t("reward.effect.reduceDrawNextTurn", { value: effect.value });
    case "FORCE_DISCARD_RANDOM":
      return t("reward.effect.forceDiscardRandom", { value: effect.value });
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
    <RogueButton
      onClick={() => onPick(relic.id)}
      type="text"
      className="!flex !h-auto !w-36 !min-w-0 !flex-col !items-center !gap-2 !whitespace-normal !rounded-xl !border-2 !border-purple-700 !bg-purple-950/40 !p-4 !text-center !transition hover:!border-purple-500 hover:!bg-purple-950/60"
    >
      <span className="text-xs font-semibold uppercase tracking-widest text-purple-400">
        {t(`gameCard.rarity.${relic.rarity}`, relic.rarity)}
      </span>
      <span className="block w-full whitespace-normal break-words text-sm font-bold leading-tight text-white [overflow-wrap:anywhere]">
        {localizeRelicName(relic.id, relic.name)}
      </span>
      <span className="block w-full whitespace-normal break-words text-xs leading-relaxed text-purple-200 [overflow-wrap:anywhere]">
        {localizeRelicDescription(relic.id, relic.description)}
      </span>
    </RogueButton>
  );
}

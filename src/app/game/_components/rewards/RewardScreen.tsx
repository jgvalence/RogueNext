"use client";

import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import type { CardDefinition } from "@/game/schemas/cards";
import type { BiomeResource } from "@/game/schemas/enums";
import type { RelicDefinitionData } from "@/game/data/relics";
import type { AllyDefinition } from "@/game/schemas/entities";
import type { Effect } from "@/game/schemas/effects";
import { cn } from "@/lib/utils/cn";
import { RogueButton, RogueTag } from "@/components/ui/rogue";
import {
  localizeAllyAbilityName,
  localizeAllyName,
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
  bossCardPicked?: boolean;
  isElite?: boolean;
  onPickCard: (definitionId: string) => void;
  onPickRelic: (relicId: string) => void;
  onPickAlly: (allyId: string) => void;
  onPickMaxHp?: (amount: number) => void;
  onSkip: () => void;
  rerollsRemaining?: number;
  onRerollCards?: () => void;
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
  bossCardPicked,
  isElite,
  onPickCard,
  onPickRelic,
  onPickAlly,
  onPickMaxHp,
  onSkip,
  rerollsRemaining,
  onRerollCards,
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
    <div className="relative flex flex-col items-center gap-6 py-4 sm:py-8">
      {/* Atmospheric background glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_40%_at_50%_0%,rgba(34,197,94,0.08),transparent)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_30%_at_50%_15%,rgba(250,204,21,0.05),transparent)]" />

      <h2
        className="animate-reward-enter text-2xl font-bold text-green-400"
        style={{ animationDelay: "0ms" }}
      >
        {t("reward.victory")}
      </h2>

      <div
        className="animate-reward-enter text-lg text-yellow-400"
        style={{ animationDelay: "60ms" }}
      >
        +{gold} {t("reward.gold")}
      </div>

      {resourceEntries.length > 0 && (
        <div
          className="flex animate-reward-enter flex-wrap justify-center gap-2"
          style={{ animationDelay: "110ms" }}
        >
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

      {isBoss && (
        <>
          {hasCardChoices && !bossCardPicked && (
            <>
              <p
                className="animate-reward-enter text-sm font-medium text-yellow-400"
                style={{ animationDelay: "160ms" }}
              >
                {t("reward.chooseRareCard")}
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                {cardChoices.map((card, i) => (
                  <div
                    key={card.id}
                    className="animate-reward-enter"
                    style={{ animationDelay: `${200 + i * 55}ms` }}
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
            </>
          )}
          {bossCardPicked && (
            <p className="text-sm text-green-500">{t("reward.cardPicked")}</p>
          )}
          {(relicChoices.length > 0 || bossMaxHpBonus) && (
            <>
              <p
                className="animate-reward-enter text-sm font-medium text-purple-400"
                style={{ animationDelay: "280ms" }}
              >
                {t("reward.chooseReward")}
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {relicChoices.map((relic, i) => (
                  <div
                    key={relic.id}
                    className="animate-reward-enter"
                    style={{ animationDelay: `${320 + i * 55}ms` }}
                  >
                    <RelicCard relic={relic} onPick={onPickRelic} />
                  </div>
                ))}
                {allyChoices.map((ally, i) => (
                  <div
                    key={ally.id}
                    className="animate-reward-enter"
                    style={{
                      animationDelay: `${320 + (relicChoices.length + i) * 55}ms`,
                    }}
                  >
                    <AllyCard ally={ally} onPick={onPickAlly} />
                  </div>
                ))}
                {bossMaxHpBonus && onPickMaxHp && (
                  <div
                    className="animate-reward-enter"
                    style={{
                      animationDelay: `${320 + (relicChoices.length + allyChoices.length) * 55}ms`,
                    }}
                  >
                    <RogueButton
                      onClick={() => onPickMaxHp(bossMaxHpBonus)}
                      type="text"
                      className="!flex !h-auto !w-40 !min-w-0 !flex-col !items-center !gap-2 !whitespace-normal !rounded-xl !border-2 !border-red-700 !bg-red-950/40 !p-4 !text-center !transition hover:!border-red-500 hover:!bg-red-950/60"
                    >
                      <span className="text-xs font-semibold uppercase tracking-widest text-red-400">
                        {t("reward.vitality")}
                      </span>
                      <span className="block w-full whitespace-normal break-words text-sm font-bold leading-tight text-white [overflow-wrap:anywhere]">
                        +{bossMaxHpBonus} {t("reward.maxHp")}
                      </span>
                      <span className="block w-full whitespace-normal break-words text-xs leading-relaxed text-red-200 [overflow-wrap:anywhere]">
                        {t("reward.maxHpDescription")}
                      </span>
                    </RogueButton>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {isElite && !isBoss && (
        <>
          <p
            className="animate-reward-enter text-sm text-gray-400"
            style={{ animationDelay: "160ms" }}
          >
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
            {cardChoices.map((card, i) => (
              <div
                key={card.id}
                className="animate-reward-enter"
                style={{ animationDelay: `${200 + i * 55}ms` }}
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
            {relicChoices.map((relic, i) => (
              <div
                key={relic.id}
                className="animate-reward-enter"
                style={{
                  animationDelay: `${200 + (cardChoices.length + i) * 55}ms`,
                }}
              >
                <RelicCard relic={relic} onPick={onPickRelic} />
              </div>
            ))}
            {allyChoices.map((ally, i) => (
              <div
                key={ally.id}
                className="animate-reward-enter"
                style={{
                  animationDelay: `${200 + (cardChoices.length + relicChoices.length + i) * 55}ms`,
                }}
              >
                <AllyCard ally={ally} onPick={onPickAlly} />
              </div>
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
          <p
            className="animate-reward-enter text-sm text-gray-400"
            style={{ animationDelay: "160ms" }}
          >
            {t("reward.chooseCardToAdd")}
          </p>
          <div className="flex gap-4">
            {cardChoices.map((card, i) => (
              <div
                key={card.id}
                className="animate-reward-enter"
                style={{ animationDelay: `${200 + i * 55}ms` }}
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
          <div
            className="flex animate-reward-enter items-center gap-3"
            style={{ animationDelay: `${200 + cardChoices.length * 55}ms` }}
          >
            {rerollsRemaining !== undefined &&
              rerollsRemaining > 0 &&
              onRerollCards && (
                <RogueButton
                  type="text"
                  className="!h-auto !rounded-lg !border !border-indigo-600/60 !px-4 !py-2 !text-sm !text-indigo-300 !transition hover:!border-indigo-400 hover:!bg-indigo-950/40"
                  onClick={onRerollCards}
                >
                  {t("reward.reroll")} ({rerollsRemaining})
                </RogueButton>
              )}
            <RogueButton
              type="text"
              className="!h-auto !rounded-lg !border !border-gray-600 !px-6 !py-2 !text-sm !text-gray-400 !transition hover:!bg-gray-800"
              onClick={onSkip}
            >
              {t("reward.skip")}
            </RogueButton>
          </div>
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
  const localizedAllyName = localizeAllyName(ally.id, ally.name);

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
        {localizedAllyName}
      </span>
      <span className="text-xs text-cyan-200">
        {ally.maxHp} {t("combat.hp")} - {ally.speed} {t("combat.spd")}
      </span>
      <div className="mt-1 w-full space-y-1 text-left">
        {ally.abilities.map((ability, i) => (
          <div
            key={`${ally.id}-ability-${i}`}
            className="rounded border border-cyan-800/70 bg-cyan-900/40 px-2 py-1"
          >
            <div className="whitespace-normal break-words text-[11px] font-semibold leading-tight text-cyan-100 [overflow-wrap:anywhere]">
              {localizeAllyAbilityName(ally.id, ability.name)}
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
    case "DAMAGE_IF_TARGET_HAS_DEBUFF":
      return t("reward.effect.damageIfTargetHasDebuff", {
        value: effect.value,
        buff: effect.buff ?? "status",
      });
    case "DAMAGE_PER_THIS_CARD_PLAYED":
      return t("reward.effect.damagePerThisCardPlayed", {
        value: effect.value,
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

const ARCHETYPE_TAG_STYLES: Record<string, string> = {
  BLEED: "border-rose-500/50 bg-rose-500/15 text-rose-200",
  BLOCK: "border-slate-400/50 bg-slate-400/15 text-slate-200",
  DRAW: "border-sky-400/50 bg-sky-400/15 text-sky-200",
  EXHAUST: "border-violet-400/50 bg-violet-400/15 text-violet-200",
  HEAL: "border-emerald-400/50 bg-emerald-400/15 text-emerald-200",
  INK: "border-cyan-400/50 bg-cyan-400/15 text-cyan-200",
  POISON: "border-lime-400/50 bg-lime-400/15 text-lime-200",
  STRENGTH: "border-orange-400/50 bg-orange-400/15 text-orange-200",
};

const RELIC_RARITY_STYLES: Record<
  string,
  { border: string; bg: string; glow: string; label: string; icon: string }
> = {
  COMMON: {
    border: "!border-slate-500/60",
    bg: "!bg-slate-900/80",
    glow: "shadow-none",
    label: "text-slate-400",
    icon: "•",
  },
  UNCOMMON: {
    border: "!border-emerald-500/60",
    bg: "!bg-[radial-gradient(ellipse_at_top,rgba(6,78,59,0.55),rgba(2,6,23,0.95))]",
    glow: "hover:!shadow-[0_0_28px_rgba(52,211,153,0.18)]",
    label: "text-emerald-400",
    icon: "◆",
  },
  RARE: {
    border: "!border-amber-400/65",
    bg: "!bg-[radial-gradient(ellipse_at_top,rgba(120,53,15,0.55),rgba(2,6,23,0.95))]",
    glow: "hover:!shadow-[0_0_28px_rgba(251,191,36,0.22)]",
    label: "text-amber-300",
    icon: "✦",
  },
  BOSS: {
    border: "!border-orange-400/65",
    bg: "!bg-[radial-gradient(ellipse_at_top,rgba(124,45,18,0.55),rgba(2,6,23,0.95))]",
    glow: "hover:!shadow-[0_0_28px_rgba(251,146,60,0.22)]",
    label: "text-orange-300",
    icon: "★",
  },
};

function RelicCard({
  relic,
  onPick,
}: {
  relic: RelicDefinitionData;
  onPick: (relicId: string) => void;
}) {
  const { t } = useTranslation();
  const rs = RELIC_RARITY_STYLES[relic.rarity] ?? RELIC_RARITY_STYLES.COMMON!;

  return (
    <RogueButton
      onClick={() => onPick(relic.id)}
      type="text"
      className={cn(
        "!flex !h-auto !w-44 !min-w-0 !flex-col !items-center !gap-2.5 !whitespace-normal !rounded-xl !border-2 !p-4 !text-center !transition-all !duration-150",
        rs.border,
        rs.bg,
        rs.glow,
        "hover:!scale-[1.04] hover:!brightness-110"
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className={cn("text-base font-black", rs.label)}>{rs.icon}</span>
        <span
          className={cn(
            "text-[10px] font-bold uppercase tracking-widest",
            rs.label
          )}
        >
          {t(`gameCard.rarity.${relic.rarity}`, { defaultValue: relic.rarity })}
        </span>
      </div>
      <span className="block w-full whitespace-normal text-sm font-bold leading-snug text-white [overflow-wrap:anywhere]">
        {localizeRelicName(relic.id, relic.name)}
      </span>
      <span className="block w-full whitespace-normal text-xs leading-relaxed text-gray-300/80 [overflow-wrap:anywhere]">
        {localizeRelicDescription(relic.id, relic.description)}
      </span>
      {relic.archetypeTags && relic.archetypeTags.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1">
          {relic.archetypeTags.map((tag) => (
            <span
              key={tag}
              className={cn(
                "rounded-full border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.14em]",
                ARCHETYPE_TAG_STYLES[tag] ??
                  "border-slate-500/40 bg-slate-500/10 text-slate-300"
              )}
            >
              {t(`relicArchetype.${tag}`, { defaultValue: tag })}
            </span>
          ))}
        </div>
      )}
    </RogueButton>
  );
}

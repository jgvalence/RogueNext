import type { TFunction } from "i18next";
import type { CardDefinition } from "@/game/schemas/cards";
import type { BuffType, EffectType, Targeting } from "@/game/schemas/enums";
import type { Effect } from "@/game/schemas/effects";
import { getCurrentLocale, i18n } from "@/lib/i18n";

function effectHasAllEnemyTarget(targeting: Targeting): boolean {
  return targeting === "ALL_ENEMIES";
}

export function localizeCardType(type: string, t: TFunction): string {
  return t(`gameCard.type.${type}`, type);
}

export function localizeBuffName(
  buff: BuffType | string | undefined,
  t: TFunction
): string {
  if (!buff) return "status";
  return t(`buff.${buff}.label`, buff);
}

function formatEffect(
  effect: Effect,
  targeting: Targeting,
  t: TFunction
): string {
  const allEnemies = effectHasAllEnemyTarget(targeting);
  const buffLabel = localizeBuffName(effect.buff, t);
  const scalingBuffLabel = localizeBuffName(effect.scalingBuff, t);

  switch (effect.type) {
    case "DAMAGE":
      return allEnemies
        ? t("gameCard.effect.damageAll", { value: effect.value })
        : t("gameCard.effect.damage", { value: effect.value });
    case "DAMAGE_EQUAL_BLOCK":
      return t("gameCard.effect.damageEqualBlock");
    case "DAMAGE_PER_DEBUFF":
      return t("gameCard.effect.damagePerDebuff", {
        value: effect.value,
        buff: buffLabel,
      });
    case "DAMAGE_IF_TARGET_HAS_DEBUFF":
      return t("gameCard.effect.damageIfTargetHasDebuff", {
        value: effect.value,
        buff: buffLabel,
      });
    case "DAMAGE_PER_THIS_CARD_PLAYED":
      return t("gameCard.effect.damagePerThisCardPlayed", {
        value: effect.value,
      });
    case "DAMAGE_PER_CURRENT_INK":
      return t("gameCard.effect.damagePerCurrentInk", {
        value: effect.value,
      });
    case "DAMAGE_PER_CLOG_IN_DISCARD":
      return t("gameCard.effect.damagePerClogInDiscard", {
        value: effect.value,
      });
    case "DAMAGE_PER_EXHAUSTED_CARD":
      return t("gameCard.effect.damagePerExhaustedCard", {
        value: effect.value,
      });
    case "DAMAGE_PER_DRAWN_THIS_TURN":
      return t("gameCard.effect.damagePerDrawnThisTurn", {
        value: effect.value,
      });
    case "DAMAGE_BONUS_IF_UPGRADED_IN_HAND":
      return t("gameCard.effect.damageBonusIfUpgradedInHand", {
        value: effect.value,
      });
    case "BLOCK":
      return t("gameCard.effect.block", { value: effect.value });
    case "BLOCK_PER_CURRENT_INK":
      return t("gameCard.effect.blockPerCurrentInk", {
        value: effect.value,
      });
    case "BLOCK_PER_DEBUFF":
      return t("gameCard.effect.blockPerDebuff", {
        value: effect.value,
        buff: buffLabel,
      });
    case "BLOCK_PER_EXHAUSTED_CARD":
      return t("gameCard.effect.blockPerExhaustedCard", {
        value: effect.value,
      });
    case "APPLY_BUFF_PER_EXHAUSTED_CARD":
      return t("gameCard.effect.applyBuffPerExhaustedCard", {
        value: effect.value,
        buff: buffLabel,
      });
    case "APPLY_BUFF_PER_DEBUFF":
      return t("gameCard.effect.applyBuffPerDebuff", {
        value: effect.value,
        buff: buffLabel,
        scalingBuff: scalingBuffLabel,
      });
    case "RETRIGGER_THORNS_ON_WEAK_ATTACK":
      return t("gameCard.effect.retriggerThornsOnWeakAttack", {
        value: effect.value,
      });
    case "HEAL":
      return t("gameCard.effect.heal", { value: effect.value });
    case "DRAW_CARDS":
      return t("gameCard.effect.draw", { value: effect.value });
    case "DOUBLE_POISON":
      if (effect.value >= 3) {
        return t("gameCard.effect.triplePoison");
      }
      return t("gameCard.effect.doublePoison");
    case "GAIN_ENERGY":
      return t("gameCard.effect.gainEnergy", { value: effect.value });
    case "GAIN_INK":
      return t("gameCard.effect.gainInk", { value: effect.value });
    case "GAIN_STRENGTH":
      return t("gameCard.effect.gainStrength", { value: effect.value });
    case "GAIN_FOCUS":
      return t("gameCard.effect.gainFocus", { value: effect.value });
    case "APPLY_DEBUFF":
      return allEnemies
        ? t("gameCard.effect.applyDebuffAll", {
            value: effect.value,
            buff: buffLabel,
          })
        : t("gameCard.effect.applyDebuff", {
            value: effect.value,
            buff: buffLabel,
          });
    case "APPLY_BUFF":
      return t("gameCard.effect.applyBuff", {
        value: effect.value,
        buff: buffLabel,
      });
    case "DRAIN_INK":
      return t("gameCard.effect.drainInk", { value: effect.value });
    case "EXHAUST":
      return t("gameCard.effect.exhaust");
    case "ADD_CARD_TO_DRAW":
      return t("gameCard.effect.addToDraw");
    case "ADD_CARD_TO_DISCARD":
      return t("gameCard.effect.addToDiscard");
    case "MOVE_RANDOM_NON_CLOG_DISCARD_TO_HAND":
      return t("gameCard.effect.moveRandomNonClogDiscardToHand", {
        value: effect.value,
      });
    case "FREEZE_HAND_CARDS":
      return t("gameCard.effect.freezeHandCards", { value: effect.value });
    case "NEXT_DRAW_TO_DISCARD_THIS_TURN":
      return t("gameCard.effect.nextDrawToDiscardThisTurn");
    case "DISABLE_INK_POWER_THIS_TURN":
      return t("gameCard.effect.disableInkPowerThisTurn", {
        power: effect.inkPower ?? "ALL",
      });
    case "INCREASE_CARD_COST_THIS_TURN":
      return t("gameCard.effect.increaseCardCostThisTurn", {
        value: effect.value,
      });
    case "INCREASE_CARD_COST_NEXT_TURN":
      return t("gameCard.effect.increaseCardCostNextTurn", {
        value: effect.value,
      });
    case "REDUCE_DRAW_THIS_TURN":
      return t("gameCard.effect.reduceDrawThisTurn", { value: effect.value });
    case "REDUCE_DRAW_NEXT_TURN":
      return t("gameCard.effect.reduceDrawNextTurn", { value: effect.value });
    case "FORCE_DISCARD_RANDOM":
      return t("gameCard.effect.forceDiscardRandom", { value: effect.value });
    case "UPGRADE_RANDOM_CARD_IN_HAND":
      return t("gameCard.effect.upgradeRandomCardInHand");
    default:
      return `${effect.type as EffectType} ${effect.value}`;
  }
}

function buildFromEffects(
  effects: Effect[],
  targeting: Targeting,
  baseDescription: string,
  onRandomDiscardEffects: Effect[],
  t: TFunction
): string {
  const parts = effects.map((effect) => formatEffect(effect, targeting, t));

  // Keep gameplay flags present in legacy text when missing in effect array.
  if (/unplayable/i.test(baseDescription)) {
    parts.push(t("gameCard.effect.unplayable"));
  }
  if (
    /exhaust/i.test(baseDescription) &&
    !parts.includes(t("gameCard.effect.exhaust"))
  ) {
    parts.push(t("gameCard.effect.exhaust"));
  }

  if (parts.length === 0) {
    return baseDescription;
  }

  const baseText = `${parts.join(". ")}.`;
  if (onRandomDiscardEffects.length === 0) {
    return baseText;
  }
  const onRandomDiscardText = onRandomDiscardEffects
    .map((effect) => formatEffect(effect, "SELF", t))
    .join(". ");
  return `${baseText} ${t("gameCard.effect.whenRandomlyDiscarded", {
    effects: onRandomDiscardText,
  })}.`;
}

function applyAttackBonusToEffects(
  effects: Effect[],
  attackBonus: number
): Effect[] {
  if (attackBonus <= 0) return effects;

  return effects.map((effect) =>
    effect.type === "DAMAGE"
      ? { ...effect, value: effect.value + attackBonus }
      : effect
  );
}

function cardDefinitionHasDirectDamage(definition: CardDefinition): boolean {
  return (
    definition.effects.some((effect) => effect.type === "DAMAGE") ||
    Boolean(
      definition.inkedVariant?.effects.some((effect) => effect.type === "DAMAGE")
    )
  );
}

export function applyAttackBonusToCardDefinition(
  definition: CardDefinition,
  attackBonus: number
): CardDefinition {
  if (
    definition.type !== "ATTACK" ||
    attackBonus <= 0 ||
    !cardDefinitionHasDirectDamage(definition)
  ) {
    return definition;
  }

  return {
    ...definition,
    effects: applyAttackBonusToEffects(definition.effects, attackBonus),
    inkedVariant: definition.inkedVariant
      ? {
          ...definition.inkedVariant,
          effects: applyAttackBonusToEffects(
            definition.inkedVariant.effects,
            attackBonus
          ),
        }
      : definition.inkedVariant,
  };
}

export function localizeCardName(
  definition: CardDefinition,
  _t: TFunction
): string {
  const locale = getCurrentLocale();
  const localizedName = i18n.getResource(
    locale,
    "translation",
    `cards.${definition.id}.name`
  );
  if (typeof localizedName === "string" && localizedName.trim().length > 0) {
    return localizedName;
  }
  return definition.name;
}

export function localizeCardDescription(
  definition: CardDefinition,
  t: TFunction
): string {
  return buildFromEffects(
    definition.effects,
    definition.targeting,
    definition.description,
    definition.onRandomDiscardEffects ?? [],
    t
  );
}

export function localizeInkedDescription(
  definition: CardDefinition,
  t: TFunction
): string | null {
  if (!definition.inkedVariant) {
    return null;
  }
  return buildFromEffects(
    definition.inkedVariant.effects,
    definition.targeting,
    definition.inkedVariant.description,
    definition.onRandomDiscardEffects ?? [],
    t
  );
}

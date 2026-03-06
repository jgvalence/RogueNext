import { type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import type { CombatState } from "@/game/schemas/combat-state";
import type { CardDefinition } from "@/game/schemas/cards";
import type {
  EnemyAbility,
  BuffInstance,
  PlayerState,
} from "@/game/schemas/entities";
import type { Effect } from "@/game/schemas/effects";
import { buffMeta } from "../shared/buff-meta";
import { boostEffectsForUpgrade } from "@/game/engine/card-upgrades";
import { calculateDamage } from "@/game/engine/damage";
import { applyBuff } from "@/game/engine/buffs";
import {
  getBonusDamageIfPlayerDebuffed,
  hasPlayerDebuffForEnemyBonus,
} from "@/game/engine/enemy-intent-preview";
import { localizeEnemyName } from "@/lib/i18n/entity-text";

export function renderCompactBuffs(buffs: BuffInstance[]): ReactNode {
  if (buffs.length === 0) return null;

  const visible = buffs.slice(0, 3);
  const remaining = buffs.length - visible.length;

  return (
    <>
      {visible.map((buff, index) => {
        const meta = buffMeta[buff.type];
        const label = (meta?.label() ?? buff.type).slice(0, 2).toUpperCase();
        return (
          <span
            key={`${buff.type}-${index}`}
            className={cn(
              "rounded border border-slate-950/60 px-1 py-0.5 text-[9px] font-bold",
              meta?.color ?? "bg-slate-700 text-slate-200"
            )}
          >
            {label}
            {buff.stacks > 1 ? ` ${buff.stacks}` : ""}
          </span>
        );
      })}
      {remaining > 0 && (
        <span className="rounded bg-slate-900/80 px-1 py-0.5 text-[9px] font-bold text-slate-200">
          +{remaining}
        </span>
      )}
    </>
  );
}

export function renderBuffSymbols(buffs: BuffInstance[]): ReactNode {
  if (buffs.length === 0) return null;

  const visible = buffs.slice(0, 4);
  const remaining = buffs.length - visible.length;

  return (
    <>
      {visible.map((buff, index) => {
        const meta = buffMeta[buff.type];
        return (
          <span
            key={`${buff.type}-symbol-${index}`}
            className={cn(
              "inline-flex h-4 min-w-4 items-center justify-center rounded-full border border-slate-950/70 px-1 text-[9px] font-black leading-none",
              meta?.color ?? "bg-slate-700 text-slate-200"
            )}
          >
            {getBuffSymbol(buff.type)}
            {buff.stacks > 1 ? buff.stacks : ""}
          </span>
        );
      })}
      {remaining > 0 && (
        <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full border border-slate-900/70 bg-slate-900/85 px-1 text-[9px] font-black text-slate-200">
          +{remaining}
        </span>
      )}
    </>
  );
}

function getBuffSymbol(buffType: string): string {
  switch (buffType) {
    case "POISON":
      return "\u2620";
    case "WEAK":
      return "\u2304";
    case "VULNERABLE":
      return "\u25C9";
    case "STRENGTH":
      return "\u2694";
    case "FOCUS":
      return "\u2726";
    case "THORNS":
      return "\u2736";
    case "BLEED":
      return "\uD83E\uDE78";
    default:
      return "\u2022";
  }
}

export function renderBuffTooltipDetails(buffs: BuffInstance[]): ReactNode {
  return (
    <div className="space-y-0.5">
      {buffs.map((buff, index) => {
        const meta = buffMeta[buff.type];
        const label = meta?.label() ?? buff.type;
        const description = meta?.description(buff.stacks) ?? "";
        return (
          <p
            key={`${buff.type}-${index}`}
            className="text-[11px] text-slate-200"
          >
            <span
              className={cn("font-semibold", meta?.color ?? "text-slate-200")}
            >
              {label}
              {buff.stacks > 1 ? ` x${buff.stacks}` : ""}
            </span>
            {description ? ` - ${description}` : ""}
          </p>
        );
      })}
    </div>
  );
}

export function buildPlayerMarkerBuffs(player: PlayerState): BuffInstance[] {
  const markers: BuffInstance[] = [...player.buffs];
  if (player.strength > 0) {
    markers.push({ type: "STRENGTH", stacks: player.strength });
  }
  if (player.focus > 0) {
    markers.push({ type: "FOCUS", stacks: player.focus });
  }
  return markers;
}

export function renderEnemyIntentEffects(
  effects: Effect[],
  t: (key: string, options?: Record<string, unknown>) => string,
  combat: CombatState,
  enemy: CombatState["enemies"][number],
  ability: EnemyAbility | undefined,
  resolvedTarget:
    | "player"
    | "all_enemies"
    | "all_allies"
    | { type: "enemy"; instanceId: string }
    | { type: "ally"; instanceId: string }
): ReactNode[] {
  return effects.map((effect, index) => {
    let label = "";
    let colorClass = "bg-slate-700 text-slate-100";

    switch (effect.type) {
      case "DAMAGE":
        label = `${t("enemyCard.dmg")} ${computeEnemyDamagePreview(
          combat,
          enemy,
          resolvedTarget,
          effect.value,
          ability
        )}`;
        colorClass = "bg-red-900/70 text-red-200";
        break;
      case "DAMAGE_BONUS_IF_UPGRADED_IN_HAND":
        label = t("reward.effect.damageBonusIfUpgradedInHand", {
          value: effect.value,
        });
        colorClass = "bg-red-900/70 text-red-200";
        break;
      case "HEAL":
        label = `${t("reward.effect.heal", { value: effect.value })}`;
        colorClass = "bg-emerald-900/70 text-emerald-200";
        break;
      case "BLOCK":
        label = `${t("reward.effect.block", { value: effect.value })}`;
        colorClass = "bg-blue-900/70 text-blue-200";
        break;
      case "DRAW_CARDS":
        label = t("reward.effect.drawCards", { value: effect.value });
        colorClass = "bg-indigo-900/70 text-indigo-200";
        break;
      case "GAIN_INK":
        label = t("reward.effect.gainInk", { value: effect.value });
        colorClass = "bg-cyan-900/70 text-cyan-200";
        break;
      case "APPLY_BUFF":
        label = t("reward.effect.applyBuff", {
          buff: effect.buff ?? "status",
          value: effect.value,
        });
        colorClass = "bg-amber-900/70 text-amber-200";
        break;
      case "APPLY_DEBUFF":
        label = t("reward.effect.applyDebuff", {
          buff: effect.buff ?? "status",
          value: effect.value,
        });
        colorClass = "bg-purple-900/70 text-purple-200";
        break;
      default:
        label = t("reward.effect.fallback", {
          type: effect.type.toLowerCase(),
          value: effect.value,
        });
        colorClass = "bg-slate-700 text-slate-100";
        break;
    }

    return (
      <span
        key={`${effect.type}-${index}`}
        className={cn(
          "rounded px-1.5 py-0.5 text-[10px] font-bold",
          colorClass
        )}
      >
        {label}
      </span>
    );
  });
}

export function formatAllyIntent(
  ability: EnemyAbility,
  t: (key: string, options?: Record<string, unknown>) => string
): string {
  const effects = ability.effects.map((effect) => {
    switch (effect.type) {
      case "DAMAGE":
        return t("reward.effect.damage", { value: effect.value });
      case "DAMAGE_BONUS_IF_UPGRADED_IN_HAND":
        return t("reward.effect.damageBonusIfUpgradedInHand", {
          value: effect.value,
        });
      case "HEAL":
        return t("reward.effect.heal", { value: effect.value });
      case "BLOCK":
        return t("reward.effect.block", { value: effect.value });
      case "DRAW_CARDS":
        return t("reward.effect.drawCards", { value: effect.value });
      case "GAIN_INK":
        return t("reward.effect.gainInk", { value: effect.value });
      case "GAIN_FOCUS":
        return t("reward.effect.gainFocus", { value: effect.value });
      case "GAIN_STRENGTH":
        return t("reward.effect.gainStrength", { value: effect.value });
      case "GAIN_ENERGY":
        return t("reward.effect.gainEnergy", { value: effect.value });
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
  });

  const targetLabel =
    ability.target === "ALL_ENEMIES"
      ? t("reward.target.allEnemies")
      : ability.target === "LOWEST_HP_ENEMY"
        ? t("reward.target.lowestHpEnemy")
        : ability.target === "ALLY_PRIORITY"
          ? t("reward.target.allyPriority")
          : ability.target === "SELF"
            ? t("reward.target.self")
            : t("reward.target.player");

  return `${targetLabel}: ${effects.join(", ")}`;
}

export function buildMobileEnemyIntentChips(
  combat: CombatState,
  enemy: CombatState["enemies"][number],
  resolvedTarget:
    | "player"
    | "all_enemies"
    | "all_allies"
    | { type: "enemy"; instanceId: string }
    | { type: "ally"; instanceId: string },
  ability: EnemyAbility | undefined,
  hideIntent: boolean,
  t?: (key: string, options?: Record<string, unknown>) => string
): string[] {
  const translate = typeof t === "function" ? t : (key: string) => key;
  if (!ability || hideIntent) return [translate("enemyCard.intentHidden")];

  const chips = ability.effects.map((effect) => {
    switch (effect.type) {
      case "DAMAGE":
        return `${translate("enemyCard.dmg")} ${computeEnemyDamagePreview(
          combat,
          enemy,
          resolvedTarget,
          effect.value,
          ability
        )}`;
      case "DAMAGE_BONUS_IF_UPGRADED_IN_HAND":
        return `DMG+${effect.value}`;
      case "BLOCK":
        return `${translate("enemyCard.blk")} ${effect.value}`;
      case "HEAL":
        return `HEAL ${effect.value}`;
      case "APPLY_DEBUFF":
        return `DEB ${effect.value}`;
      case "APPLY_BUFF":
        return `BUF ${effect.value}`;
      case "DRAIN_INK":
        return `INK-${effect.value}`;
      default:
        return `${effect.type.slice(0, 3)} ${effect.value}`;
    }
  });

  const bonusIfPlayerDebuffed = getBonusDamageIfPlayerDebuffed(
    enemy.definitionId,
    ability.name
  );
  if (bonusIfPlayerDebuffed) {
    chips.push(
      translate("enemyCard.conditionalBonusVsDebuffed", {
        bonus: bonusIfPlayerDebuffed,
      })
    );
  }

  return chips;
}

export function computeEnemyDamagePreview(
  combat: CombatState,
  enemy: CombatState["enemies"][number],
  resolvedTarget:
    | "player"
    | "all_enemies"
    | "all_allies"
    | { type: "enemy"; instanceId: string }
    | { type: "ally"; instanceId: string },
  baseDamage: number,
  ability?: EnemyAbility
): number {
  let effectiveBaseDamage = baseDamage;
  if (ability && resolvedTarget === "player") {
    const bonusIfPlayerDebuffed = getBonusDamageIfPlayerDebuffed(
      enemy.definitionId,
      ability.name
    );
    if (
      bonusIfPlayerDebuffed &&
      hasPlayerDebuffForEnemyBonus(combat.player.buffs)
    ) {
      effectiveBaseDamage += bonusIfPlayerDebuffed;
    }
  }

  const scaledBaseDamage = Math.max(
    1,
    Math.round(effectiveBaseDamage * (combat.enemyDamageScale ?? 1))
  );
  const targetBuffs = resolveEnemyIntentTargetBuffs(combat, resolvedTarget);
  return calculateDamage(
    scaledBaseDamage,
    { strength: getStrengthFromBuffs(enemy.buffs), buffs: enemy.buffs },
    { buffs: targetBuffs }
  );
}

function resolveEnemyIntentTargetBuffs(
  combat: CombatState,
  resolvedTarget:
    | "player"
    | "all_enemies"
    | "all_allies"
    | { type: "enemy"; instanceId: string }
    | { type: "ally"; instanceId: string }
): BuffInstance[] {
  if (resolvedTarget === "player") return combat.player.buffs;

  if (resolvedTarget === "all_enemies") {
    return combat.player.buffs;
  }

  if (resolvedTarget === "all_allies") {
    return combat.enemies.find((entry) => entry.currentHp > 0)?.buffs ?? [];
  }

  if (resolvedTarget.type === "ally") {
    return (
      combat.allies.find(
        (entry) => entry.instanceId === resolvedTarget.instanceId
      )?.buffs ?? []
    );
  }

  return (
    combat.enemies.find(
      (entry) => entry.instanceId === resolvedTarget.instanceId
    )?.buffs ?? []
  );
}

function getStrengthFromBuffs(buffs: BuffInstance[]): number {
  return buffs
    .filter((buff) => buff.type === "STRENGTH")
    .reduce((total, buff) => total + buff.stacks, 0);
}

export function getPreviewEffectsForSelectedCard(
  definition: CardDefinition,
  upgraded: boolean,
  useInked: boolean,
  attackBonus: number
): Effect[] {
  const isUsingInkedVariant = Boolean(useInked && definition.inkedVariant);
  let effects = isUsingInkedVariant
    ? definition.inkedVariant!.effects
    : definition.effects;

  if (upgraded) {
    if (isUsingInkedVariant) {
      effects = boostEffectsForUpgrade(effects);
    } else if (definition.upgrade) {
      effects = definition.upgrade.effects;
    } else {
      effects = boostEffectsForUpgrade(effects);
    }
  }

  const effectiveAttackBonus = definition.type === "ATTACK" ? attackBonus : 0;
  if (effectiveAttackBonus <= 0) {
    return effects;
  }

  return effects.map((effect) =>
    effect.type === "DAMAGE"
      ? { ...effect, value: effect.value + effectiveAttackBonus }
      : effect
  );
}

export function buildIncomingDamagePreviewMap(
  combat: CombatState,
  definition: CardDefinition | null,
  effects: Effect[],
  selectedCardId: string | null
): Map<string, number> {
  const result = new Map<string, number>();
  if (!selectedCardId || !definition) return result;
  if (
    definition.targeting !== "SINGLE_ENEMY" &&
    definition.targeting !== "ALL_ENEMIES"
  ) {
    return result;
  }
  if (!effects.some((e) => e.type === "DAMAGE")) return result;

  for (const enemy of combat.enemies) {
    if (enemy.currentHp <= 0) continue;
    result.set(
      enemy.instanceId,
      computeIncomingDamageAgainstEnemy(
        effects,
        combat.player.strength,
        combat.player.buffs,
        enemy.block,
        enemy.buffs
      )
    );
  }

  return result;
}

function computeIncomingDamageAgainstEnemy(
  effects: Effect[],
  attackerStrength: number,
  attackerBuffs: CombatState["player"]["buffs"],
  targetBlock: number,
  targetBuffs: CombatState["enemies"][number]["buffs"]
): number {
  let totalHpLoss = 0;
  let tempBlock = Math.max(0, targetBlock);
  let tempStrength = attackerStrength;
  let tempTargetBuffs = targetBuffs;

  for (const effect of effects) {
    if (effect.type === "GAIN_STRENGTH") {
      tempStrength += effect.value;
      continue;
    }

    if (
      (effect.type === "APPLY_DEBUFF" || effect.type === "APPLY_BUFF") &&
      effect.buff
    ) {
      tempTargetBuffs = applyBuff(
        tempTargetBuffs,
        effect.buff,
        effect.value,
        effect.duration
      );
      continue;
    }

    if (effect.type === "DAMAGE") {
      const rawDamage = calculateDamage(
        effect.value,
        { strength: tempStrength, buffs: attackerBuffs },
        { buffs: tempTargetBuffs }
      );
      const blocked = Math.min(tempBlock, rawDamage);
      tempBlock -= blocked;
      totalHpLoss += Math.max(0, rawDamage - blocked);
    }
  }

  return Math.max(0, totalHpLoss);
}

export function resolveEnemyIntentTargetLabel(
  combat: CombatState,
  target:
    | "player"
    | "all_enemies"
    | "all_allies"
    | { type: "enemy"; instanceId: string }
    | { type: "ally"; instanceId: string },
  t: (key: string, options?: Record<string, unknown>) => string
): string | null {
  if (target === "player") return t("combat.you");
  if (target === "all_enemies") return t("combat.allEnemies");
  if (target === "all_allies") return t("combat.allAllies");
  if (target.type === "ally") {
    return (
      combat.allies.find((a) => a.instanceId === target.instanceId)?.name ??
      t("combat.ally")
    );
  }
  if (target.type === "enemy") {
    const enemy = combat.enemies.find(
      (e) => e.instanceId === target.instanceId
    );
    return enemy
      ? localizeEnemyName(enemy.definitionId, enemy.name)
      : t("combat.enemy");
  }
  return t("combat.you");
}

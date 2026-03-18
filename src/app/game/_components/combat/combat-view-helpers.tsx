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
import {
  calculateDamage,
  computeDamageFromTargetBlock,
} from "@/game/engine/damage";
import { applyBuff } from "@/game/engine/buffs";
import {
  getEnemyIntentAbilityExtraEffects,
  getEnemyIntentActiveDamageBonusTotal,
  getEnemyIntentDamageBonuses,
  getEnemyIntentPendingPhaseExtraEffects,
  type EnemyIntentDamageBonus,
  type EnemyIntentExtraEffect,
} from "@/game/engine/enemy-intent-preview";
import { getChapterGuardianUiState } from "@/game/engine/chapter-guardian";
import { getCardDefinitionById } from "@/game/data";
import { localizeCardName } from "@/lib/i18n/card-text";
import { localizeEnemyName } from "@/lib/i18n/entity-text";
import { i18n } from "@/lib/i18n";

export interface StatusMarker {
  key: string;
  colorClass: string;
  compactLabel: string;
  symbolLabel: string;
  detailLabel: string;
  detailText?: string;
  pending?: boolean;
}

function renderCompactStatusMarkers(markers: StatusMarker[]): ReactNode {
  if (markers.length === 0) return null;

  const visible = markers.slice(0, 3);
  const remaining = markers.length - visible.length;

  return (
    <>
      {visible.map((marker) => (
        <span
          key={marker.key}
          className={cn(
            "rounded border border-slate-950/60 px-1 py-0.5 text-[9px] font-bold",
            marker.colorClass,
            marker.pending && "border-dashed"
          )}
        >
          {marker.compactLabel}
        </span>
      ))}
      {remaining > 0 && (
        <span className="rounded bg-slate-900/80 px-1 py-0.5 text-[9px] font-bold text-slate-200">
          +{remaining}
        </span>
      )}
    </>
  );
}

function renderStatusMarkerSymbols(markers: StatusMarker[]): ReactNode {
  if (markers.length === 0) return null;

  const visible = markers.slice(0, 4);
  const remaining = markers.length - visible.length;

  return (
    <>
      {visible.map((marker) => (
        <span
          key={`${marker.key}-symbol`}
          className={cn(
            "inline-flex h-4 min-w-4 items-center justify-center rounded-full border border-slate-950/70 px-1 text-[9px] font-black leading-none",
            marker.colorClass,
            marker.pending && "border-dashed"
          )}
        >
          {marker.symbolLabel}
        </span>
      ))}
      {remaining > 0 && (
        <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full border border-slate-900/70 bg-slate-900/85 px-1 text-[9px] font-black text-slate-200">
          +{remaining}
        </span>
      )}
    </>
  );
}

function renderStatusMarkerDetails(markers: StatusMarker[]): ReactNode {
  if (markers.length === 0) return null;

  return (
    <div className="space-y-0.5">
      {markers.map((marker) => (
        <p key={`${marker.key}-detail`} className="text-[11px] text-slate-200">
          <span
            className={cn(
              "rounded px-1 py-px font-semibold",
              marker.colorClass
            )}
          >
            {marker.detailLabel}
          </span>
          {marker.detailText ? ` - ${marker.detailText}` : ""}
        </p>
      ))}
    </div>
  );
}

function formatTurnCounter(duration?: number): string | null {
  if (duration === undefined || duration <= 0) return null;
  return `${duration}t`;
}

function usesDurationAsPrimaryCounter(buff: BuffInstance): boolean {
  return (
    buff.type === "WEAK" ||
    buff.type === "VULNERABLE" ||
    buff.type === "STUN" ||
    buff.type === "STUN_IMMUNITY"
  );
}

function formatCompactBuffCounter(buff: BuffInstance): string | null {
  const turnCounter = formatTurnCounter(buff.duration);

  if (usesDurationAsPrimaryCounter(buff)) {
    return turnCounter ?? (buff.stacks > 1 ? `${buff.stacks}` : null);
  }

  if (turnCounter) {
    return `${buff.stacks}/${turnCounter}`;
  }

  return buff.stacks > 1 ? `${buff.stacks}` : null;
}

function formatSymbolBuffCounter(buff: BuffInstance): string {
  if (usesDurationAsPrimaryCounter(buff)) {
    return buff.duration !== undefined && buff.duration > 0
      ? `${buff.duration}`
      : buff.stacks > 1
        ? `${buff.stacks}`
        : "";
  }

  if (buff.duration !== undefined && buff.duration > 0) {
    return `${buff.stacks}/${buff.duration}`;
  }

  return buff.stacks > 1 ? `${buff.stacks}` : "";
}

function buildBuffStatusMarker(buff: BuffInstance, key: string): StatusMarker {
  const meta = buffMeta[buff.type];
  const label = meta?.label() ?? buff.type;
  const description = meta?.description(buff.stacks) ?? "";
  const shortLabel = label.slice(0, 2).toUpperCase();
  const compactCounter = formatCompactBuffCounter(buff);
  const compactLabel = compactCounter
    ? `${shortLabel} ${compactCounter}`
    : shortLabel;
  const symbolCounter = formatSymbolBuffCounter(buff);
  const symbolLabel = `${getBuffSymbol(buff.type)}${symbolCounter}`;
  const durationLabel = formatTurnCounter(buff.duration);
  const detailParts: string[] = [];

  if (buff.stacks > 1) {
    detailParts.push(`x${buff.stacks}`);
  }
  if (durationLabel) {
    detailParts.push(`(${durationLabel})`);
  }

  const detailLabel = [label, ...detailParts].join(" ");
  const durationNote =
    buff.duration !== undefined && buff.duration > 0
      ? i18n.t("buff.durationNote", { count: buff.duration })
      : "";

  return {
    key,
    colorClass: meta?.color ?? "bg-slate-700 text-slate-200",
    compactLabel,
    symbolLabel,
    detailLabel,
    detailText: [description, durationNote].filter(Boolean).join(" "),
  };
}

function buildBuffStatusMarkers(buffs: BuffInstance[]): StatusMarker[] {
  return buffs.map((buff, index) =>
    buildBuffStatusMarker(buff, `${buff.type}-${index}`)
  );
}

function buildChapterGuardianStatusMarkers(
  enemy: CombatState["enemies"][number]
): StatusMarker[] {
  const guardianState = getChapterGuardianUiState(enemy);
  if (!guardianState) return [];

  const t = i18n.t.bind(i18n);
  const markers: StatusMarker[] = [];

  if (guardianState.open) {
    markers.push({
      key: "chapter-guardian-open",
      colorClass: "bg-emerald-950/85 text-emerald-100",
      compactLabel: "OPEN",
      symbolLabel: "OP",
      detailLabel: t("enemyCard.chapterGuardian.openLabel"),
      detailText: t("enemyCard.chapterGuardian.openDetail", {
        multiplier: guardianState.openChapterDamageMultiplier,
      }),
    });
  }

  if (guardianState.rebindPending) {
    markers.push({
      key: "chapter-guardian-rebind",
      colorClass: "bg-amber-950/85 text-amber-100",
      compactLabel: "REBIND",
      symbolLabel: "RB",
      detailLabel: t("enemyCard.chapterGuardian.rebindLabel"),
      detailText: t("enemyCard.chapterGuardian.rebindDetail"),
    });
  }

  if (guardianState.martialActive) {
    markers.push({
      key: "chapter-guardian-martial",
      colorClass: "bg-rose-950/85 text-rose-100",
      compactLabel: `ATK ${guardianState.martialProgress}/${guardianState.martialThreshold}`,
      symbolLabel: `A${guardianState.martialProgress}/${guardianState.martialThreshold}`,
      detailLabel: t("enemyCard.chapterGuardian.martialLabel"),
      detailText: t("enemyCard.chapterGuardian.martialDetail", {
        progress: guardianState.martialProgress,
        threshold: guardianState.martialThreshold,
        cap: guardianState.damageCap ?? 0,
      }),
    });
  }

  if (guardianState.scriptActive) {
    markers.push({
      key: "chapter-guardian-script",
      colorClass: "bg-blue-950/85 text-blue-100",
      compactLabel: `BLK ${guardianState.scriptProgress}/${guardianState.scriptThreshold}`,
      symbolLabel: `B${guardianState.scriptProgress}/${guardianState.scriptThreshold}`,
      detailLabel: t("enemyCard.chapterGuardian.scriptLabel"),
      detailText: t("enemyCard.chapterGuardian.scriptDetail", {
        progress: guardianState.scriptProgress,
        threshold: guardianState.scriptThreshold,
        punish: guardianState.scriptPunishBlock,
      }),
    });
  }

  if (guardianState.inkActive) {
    const punishCardDefinition = getCardDefinitionById(
      guardianState.inkPunishCardId
    );
    markers.push({
      key: "chapter-guardian-ink",
      colorClass: "bg-cyan-950/85 text-cyan-100",
      compactLabel: `INK ${guardianState.inkProgress}/${guardianState.inkThreshold}`,
      symbolLabel: `I${guardianState.inkProgress}/${guardianState.inkThreshold}`,
      detailLabel: t("enemyCard.chapterGuardian.inkLabel"),
      detailText: t("enemyCard.chapterGuardian.inkDetail", {
        progress: guardianState.inkProgress,
        threshold: guardianState.inkThreshold,
        card: punishCardDefinition
          ? localizeCardName(punishCardDefinition, t as never)
          : guardianState.inkPunishCardId,
      }),
    });
  }

  return markers;
}

function buildPlayerDisruptionMarkers(
  disruption:
    | CombatState["playerDisruption"]
    | CombatState["nextPlayerDisruption"]
    | undefined,
  scope: "current" | "next"
): StatusMarker[] {
  if (!disruption) return [];

  const pending = scope === "next";
  const prefix = pending ? ">" : "";
  const markers: StatusMarker[] = [];

  if ((disruption.extraCardCost ?? 0) > 0) {
    const value = disruption.extraCardCost;
    markers.push({
      key: `${scope}-extra-card-cost`,
      colorClass: pending
        ? "bg-amber-950/85 text-amber-200"
        : "bg-amber-900/85 text-amber-100",
      compactLabel: `${prefix}+${value}C`,
      symbolLabel: `${prefix}+${value}C`,
      detailLabel: pending
        ? i18n.t("reward.effect.increaseCardCostNextTurn", { value })
        : i18n.t("reward.effect.increaseCardCostThisTurn", { value }),
      pending,
    });
  }

  if ((disruption.drawPenalty ?? 0) > 0) {
    const value = disruption.drawPenalty;
    markers.push({
      key: `${scope}-draw-penalty`,
      colorClass: pending
        ? "bg-slate-800/90 text-slate-200"
        : "bg-slate-700 text-slate-100",
      compactLabel: `${prefix}-${value}D`,
      symbolLabel: `${prefix}-${value}D`,
      detailLabel: pending
        ? i18n.t("reward.effect.reduceDrawNextTurn", { value })
        : i18n.t("reward.effect.reduceDrawThisTurn", { value }),
      pending,
    });
  }

  if (!pending && (disruption.drawsToDiscardRemaining ?? 0) > 0) {
    markers.push({
      key: `${scope}-draw-to-discard`,
      colorClass: "bg-purple-900/85 text-purple-100",
      compactLabel: "D>DIS",
      symbolLabel: "D>",
      detailLabel: i18n.t("reward.effect.nextDrawToDiscardThisTurn"),
    });
  }

  if (!pending && (disruption.disabledInkPowers ?? []).length > 0) {
    markers.push({
      key: `${scope}-ink-power-locked`,
      colorClass: "bg-cyan-900/85 text-cyan-100",
      compactLabel: "INK X",
      symbolLabel: "IX",
      detailLabel: i18n.t("playerStats.inkPowerLocked"),
    });
  }

  return markers;
}

export function renderCompactBuffs(buffs: BuffInstance[]): ReactNode {
  return renderCompactStatusMarkers(buildBuffStatusMarkers(buffs));
}

export function renderBuffSymbols(buffs: BuffInstance[]): ReactNode {
  return renderStatusMarkerSymbols(buildBuffStatusMarkers(buffs));
}

function getBuffSymbol(buffType: string): string {
  switch (buffType) {
    case "POISON":
      return "\u2620";
    case "WEAK":
      return "\u2304";
    case "VULNERABLE":
      return "\u25C9";
    case "STUN":
      return "Z";
    case "STUN_IMMUNITY":
      return "R";
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
  return renderStatusMarkerDetails(buildBuffStatusMarkers(buffs));
}

export function buildEnemyStatusMarkers(
  enemy: CombatState["enemies"][number]
): StatusMarker[] {
  return [
    ...buildChapterGuardianStatusMarkers(enemy),
    ...buildBuffStatusMarkers(enemy.buffs),
  ];
}

export function renderCompactEnemyStatusMarkers(
  markers: StatusMarker[]
): ReactNode {
  return renderCompactStatusMarkers(markers);
}

export function renderEnemyStatusMarkerDetails(
  markers: StatusMarker[]
): ReactNode {
  return renderStatusMarkerDetails(markers);
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

export function buildPlayerStatusMarkers(
  player: PlayerState,
  disruption?: CombatState["playerDisruption"],
  nextDisruption?: CombatState["nextPlayerDisruption"],
  attackBonus = 0
): StatusMarker[] {
  const markers: StatusMarker[] = [
    ...buildPlayerDisruptionMarkers(disruption, "current"),
    ...buildPlayerDisruptionMarkers(nextDisruption, "next"),
    ...buildBuffStatusMarkers(player.buffs),
  ];

  if (player.strength > 0) {
    markers.push(
      buildBuffStatusMarker(
        { type: "STRENGTH", stacks: player.strength },
        "player-strength"
      )
    );
  }
  if (player.focus > 0) {
    markers.push(
      buildBuffStatusMarker(
        { type: "FOCUS", stacks: player.focus },
        "player-focus"
      )
    );
  }
  if (attackBonus > 0) {
    markers.push({
      key: "player-attack-bonus",
      colorClass: "bg-red-950/85 text-red-100",
      compactLabel: i18n.t("playerStats.attackBonusBadge", {
        value: attackBonus,
      }),
      symbolLabel: `A+${attackBonus}`,
      detailLabel: i18n.t("library.bonus.attackBonus", { value: attackBonus }),
      detailText: i18n.t("playerStats.attackBonusTooltip", {
        value: attackBonus,
      }),
    });
  }

  return markers;
}

export function renderCompactStatusMarkersForPlayer(
  markers: StatusMarker[]
): ReactNode {
  return renderCompactStatusMarkers(markers);
}

export function renderStatusMarkerSymbolsForPlayer(
  markers: StatusMarker[]
): ReactNode {
  return renderStatusMarkerSymbols(markers);
}

export function renderStatusMarkerDetailsForPlayer(
  markers: StatusMarker[]
): ReactNode {
  return renderStatusMarkerDetails(markers);
}

type EnemyIntentEntry = {
  key: string;
  label: string;
  colorClass: string;
};

function formatIntentFallbackLabel(id: string): string {
  return id
    .split("_")
    .map((chunk) =>
      chunk.length > 0 ? chunk[0]!.toUpperCase() + chunk.slice(1) : chunk
    )
    .join(" ");
}

function getLocalizedIntentCardName(
  cardId: string,
  t: (key: string, options?: Record<string, unknown>) => string
): string {
  const definition = getCardDefinitionById(cardId);
  return definition
    ? localizeCardName(definition, t as never)
    : formatIntentFallbackLabel(cardId);
}

function getLocalizedIntentEnemyName(enemyId: string): string {
  return localizeEnemyName(enemyId, formatIntentFallbackLabel(enemyId));
}

function applyPhasePrefix(
  label: string,
  source: EnemyIntentExtraEffect["source"],
  t: (key: string, options?: Record<string, unknown>) => string
): string {
  if (source !== "phase2") return label;
  return `${t("enemyCard.phase2Badge")} ${label}`;
}

function buildEffectIntentEntry(
  effect: Effect,
  index: number,
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
): EnemyIntentEntry {
  let label = "";
  let colorClass = "bg-slate-700 text-slate-100";

  switch (effect.type) {
    case "DAMAGE":
    case "DAMAGE_PER_TARGET_BLOCK":
      label = `${t("enemyCard.dmg")} ${computeEnemyEffectDamagePreview(
        combat,
        enemy,
        resolvedTarget,
        effect,
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
    case "DAMAGE_PER_DEBUFF":
      label = t("reward.effect.damagePerDebuff", {
        buff: buffMeta[effect.buff ?? ""]?.label() ?? effect.buff ?? "status",
        value: effect.value,
      });
      colorClass = "bg-red-900/70 text-red-200";
      break;
    case "DAMAGE_PER_CURRENT_INK":
      label = t("reward.effect.damagePerCurrentInk", { value: effect.value });
      colorClass = "bg-cyan-950/80 text-cyan-200";
      break;
    case "DAMAGE_PER_CLOG_IN_DISCARD":
      label = t("reward.effect.damagePerClogInDiscard", {
        value: effect.value,
      });
      colorClass = "bg-purple-950/80 text-purple-200";
      break;
    case "DAMAGE_PER_EXHAUSTED_CARD":
      label = t("reward.effect.damagePerExhaustedCard", {
        value: effect.value,
      });
      colorClass = "bg-amber-950/80 text-amber-200";
      break;
    case "DAMAGE_PER_DRAWN_THIS_TURN":
      label = t("reward.effect.damagePerDrawnThisTurn", {
        value: effect.value,
      });
      colorClass = "bg-indigo-950/80 text-indigo-200";
      break;
    case "HEAL":
      label = t("reward.effect.heal", { value: effect.value });
      colorClass = "bg-emerald-900/70 text-emerald-200";
      break;
    case "BLOCK":
      label = t("reward.effect.block", { value: effect.value });
      colorClass = "bg-blue-900/70 text-blue-200";
      break;
    case "BLOCK_PER_CURRENT_INK":
      label = t("reward.effect.blockPerCurrentInk", { value: effect.value });
      colorClass = "bg-cyan-950/80 text-cyan-200";
      break;
    case "BLOCK_PER_DEBUFF":
      label = t("reward.effect.blockPerDebuff", {
        buff: buffMeta[effect.buff ?? ""]?.label() ?? effect.buff ?? "status",
        value: effect.value,
      });
      colorClass = "bg-blue-900/70 text-blue-200";
      break;
    case "BLOCK_PER_EXHAUSTED_CARD":
      label = t("reward.effect.blockPerExhaustedCard", {
        value: effect.value,
      });
      colorClass = "bg-blue-950/80 text-blue-200";
      break;
    case "APPLY_BUFF_PER_EXHAUSTED_CARD":
      label = t("reward.effect.applyBuffPerExhaustedCard", {
        buff: buffMeta[effect.buff ?? ""]?.label() ?? effect.buff ?? "status",
        value: effect.value,
      });
      colorClass = "bg-amber-950/80 text-amber-200";
      break;
    case "RETRIGGER_THORNS_ON_WEAK_ATTACK":
      label = t("reward.effect.retriggerThornsOnWeakAttack", {
        value: effect.value,
      });
      colorClass = "bg-amber-900/70 text-amber-200";
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
        buff: buffMeta[effect.buff ?? ""]?.label() ?? effect.buff ?? "status",
        value: effect.value,
      });
      colorClass = "bg-amber-900/70 text-amber-200";
      break;
    case "APPLY_DEBUFF":
      label = t("reward.effect.applyDebuff", {
        buff: buffMeta[effect.buff ?? ""]?.label() ?? effect.buff ?? "status",
        value: effect.value,
      });
      colorClass = "bg-purple-900/70 text-purple-200";
      break;
    case "DRAIN_INK":
      label = t("reward.effect.drainInk", { value: effect.value });
      colorClass = "bg-cyan-900/70 text-cyan-200";
      break;
    case "ADD_CARD_TO_DRAW":
      label = effect.cardId
        ? t("enemyCard.addCardToDrawNamed", {
            value: effect.value,
            card: getLocalizedIntentCardName(effect.cardId, t),
          })
        : t("gameCard.effect.addToDraw");
      colorClass = "bg-indigo-950/80 text-indigo-200";
      break;
    case "ADD_CARD_TO_DISCARD":
      label = effect.cardId
        ? t("enemyCard.addCardToDiscardNamed", {
            value: effect.value,
            card: getLocalizedIntentCardName(effect.cardId, t),
          })
        : t("gameCard.effect.addToDiscard");
      colorClass = "bg-slate-800 text-slate-100";
      break;
    case "MOVE_RANDOM_NON_CLOG_DISCARD_TO_HAND":
      label = t("reward.effect.moveRandomNonClogDiscardToHand", {
        value: effect.value,
      });
      colorClass = "bg-purple-950/80 text-purple-200";
      break;
    case "FREEZE_HAND_CARDS":
      label = t("reward.effect.freezeHandCards", { value: effect.value });
      colorClass = "bg-cyan-950/80 text-cyan-200";
      break;
    case "NEXT_DRAW_TO_DISCARD_THIS_TURN":
      label = t("reward.effect.nextDrawToDiscardThisTurn");
      colorClass = "bg-purple-950/80 text-purple-200";
      break;
    case "DISABLE_INK_POWER_THIS_TURN":
      label = t("enemyCard.lockInk", { power: effect.inkPower ?? "all" });
      colorClass = "bg-cyan-900/80 text-cyan-100";
      break;
    case "INCREASE_CARD_COST_THIS_TURN":
      label = t("reward.effect.increaseCardCostThisTurn", {
        value: effect.value,
      });
      colorClass = "bg-amber-900/80 text-amber-100";
      break;
    case "INCREASE_CARD_COST_NEXT_TURN":
      label = t("reward.effect.increaseCardCostNextTurn", {
        value: effect.value,
      });
      colorClass = "bg-amber-900/80 text-amber-100";
      break;
    case "REDUCE_DRAW_THIS_TURN":
      label = t("reward.effect.reduceDrawThisTurn", { value: effect.value });
      colorClass = "bg-slate-700 text-slate-100";
      break;
    case "REDUCE_DRAW_NEXT_TURN":
      label = t("reward.effect.reduceDrawNextTurn", { value: effect.value });
      colorClass = "bg-slate-700 text-slate-100";
      break;
    case "FORCE_DISCARD_RANDOM":
      label = t("enemyCard.randomDiscard", { value: effect.value });
      colorClass = "bg-rose-900/80 text-rose-100";
      break;
    default:
      label = t("reward.effect.fallback", {
        type: effect.type.toLowerCase(),
        value: effect.value,
      });
      colorClass = "bg-slate-700 text-slate-100";
      break;
  }

  return {
    key: `${effect.type}-${index}`,
    label,
    colorClass,
  };
}

function buildDamageBonusIntentEntry(
  bonus: EnemyIntentDamageBonus,
  index: number,
  t: (key: string, options?: Record<string, unknown>) => string
): EnemyIntentEntry {
  switch (bonus.type) {
    case "FLAT":
      return {
        key: `bonus-flat-${index}`,
        label: t("enemyCard.bonusDamageFlat", { bonus: bonus.value }),
        colorClass: "bg-amber-900/70 text-amber-100",
      };
    case "PLAYER_DEBUFFED":
      return {
        key: `bonus-debuff-${index}`,
        label: t("enemyCard.conditionalBonusVsDebuffed", {
          bonus: bonus.value,
        }),
        colorClass: bonus.active
          ? "bg-amber-800/70 text-amber-100 ring-1 ring-amber-300/50"
          : "bg-gray-700/80 text-gray-200",
      };
    case "PLAYER_INK_BELOW":
      return {
        key: `bonus-low-ink-${index}`,
        label: t("enemyCard.conditionalBonusVsLowInk", {
          bonus: bonus.value,
          threshold: bonus.threshold,
        }),
        colorClass: bonus.active
          ? "bg-cyan-900/75 text-cyan-100 ring-1 ring-cyan-300/40"
          : "bg-slate-700/80 text-slate-200",
      };
    case "PER_CURSE_CARD":
      return {
        key: `bonus-curse-${index}`,
        label: t("enemyCard.conditionalBonusPerCurse", {
          perCurse: bonus.valuePerCurse,
          total: bonus.totalBonus,
        }),
        colorClass:
          bonus.totalBonus > 0
            ? "bg-purple-900/75 text-purple-100 ring-1 ring-purple-300/40"
            : "bg-slate-700/80 text-slate-200",
      };
    default:
      return {
        key: `bonus-fallback-${index}`,
        label: "",
        colorClass: "bg-slate-700 text-slate-100",
      };
  }
}

function buildExtraIntentEntry(
  extra: EnemyIntentExtraEffect,
  index: number,
  t: (key: string, options?: Record<string, unknown>) => string
): EnemyIntentEntry {
  let label = "";
  let colorClass = "bg-slate-700 text-slate-100";

  switch (extra.type) {
    case "SUMMON_ENEMY":
      label = `${t("enemyCard.summon")} ${getLocalizedIntentEnemyName(
        extra.enemyId
      )}`;
      colorClass = "bg-orange-900/70 text-orange-200";
      break;
    case "REINVOKE_ENEMY":
      label = t("enemyCard.reinvokeEnemy", {
        enemy: getLocalizedIntentEnemyName(extra.enemyId),
      });
      colorClass = "bg-orange-950/80 text-amber-100";
      break;
    case "ADD_CARD_TO_DRAW":
      label = t("enemyCard.addCardToDrawNamed", {
        value: extra.value,
        card: getLocalizedIntentCardName(extra.cardId, t),
      });
      colorClass = "bg-indigo-950/80 text-indigo-200";
      break;
    case "ADD_CARD_TO_DISCARD":
      label = t("enemyCard.addCardToDiscardNamed", {
        value: extra.value,
        card: getLocalizedIntentCardName(extra.cardId, t),
      });
      colorClass = "bg-slate-800 text-slate-100";
      break;
    case "HEAL_SELF":
      label = t("reward.effect.heal", { value: extra.value });
      colorClass = "bg-emerald-900/70 text-emerald-200";
      break;
    case "GAIN_STRENGTH_SELF":
      label = `${buffMeta.STRENGTH?.label() ?? "Strength"} +${extra.value}`;
      colorClass = "bg-red-900/70 text-red-200";
      break;
    case "GAIN_THORNS_SELF":
      label = `${buffMeta.THORNS?.label() ?? "Thorns"} +${extra.value}`;
      colorClass = "bg-rose-900/70 text-rose-200";
      break;
    case "APPLY_DEBUFF_TO_PLAYER": {
      const buffLabel = buffMeta[extra.buff]?.label() ?? extra.buff;
      const durationText =
        typeof extra.duration === "number" && extra.duration > 0
          ? ` (${extra.duration}t)`
          : "";
      label = `${t("reward.effect.applyDebuff", {
        buff: buffLabel,
        value: extra.value,
      })}${durationText}`;
      colorClass = "bg-purple-900/70 text-purple-200";
      break;
    }
    case "FREEZE_HAND":
      label = t("reward.effect.freezeHandCards", { value: extra.value });
      colorClass = "bg-cyan-950/80 text-cyan-200";
      break;
    case "INCREASE_CARD_COST_NEXT_TURN":
      label = t("reward.effect.increaseCardCostNextTurn", {
        value: extra.value,
      });
      colorClass = "bg-amber-900/80 text-amber-100";
      break;
    case "DRAIN_ALL_INK":
      label = t("enemyCard.drainAllInk");
      colorClass = "bg-cyan-900/80 text-cyan-100";
      break;
    case "SELF_DAMAGE":
      label = t("enemyCard.selfDamage", { value: extra.value });
      colorClass = "bg-rose-950/80 text-rose-100";
      break;
    case "GAIN_STRENGTH_ALL_ENEMIES":
      label = t("enemyCard.alliesGainBuff", {
        buff: buffMeta.STRENGTH?.label() ?? "Strength",
        value: extra.value,
      });
      colorClass = "bg-red-950/80 text-red-100";
      break;
    case "GAIN_BLOCK_ALL_ENEMIES":
      label = t("enemyCard.alliesGainBlock", { value: extra.value });
      colorClass = "bg-blue-950/80 text-blue-100";
      break;
    case "REDACT_CARD":
      label =
        extra.redaction === "COST"
          ? t("enemyCard.redactCardCost", { value: extra.value })
          : extra.redaction === "TEXT"
            ? t("enemyCard.redactCardText", { value: extra.value })
            : t("enemyCard.redactCardFlexible", { value: extra.value });
      colorClass =
        extra.redaction === "COST"
          ? "bg-amber-950/80 text-amber-100"
          : extra.redaction === "TEXT"
            ? "bg-slate-700 text-slate-100"
            : "bg-stone-800 text-stone-100";
      break;
    case "RESTORE_REDACTIONS_ON_DEFEAT":
      label =
        extra.redaction === "COST"
          ? t("enemyCard.restoreCostRedactionsOnDefeat")
          : t("enemyCard.restoreTextRedactionsOnDefeat");
      colorClass =
        extra.redaction === "COST"
          ? "bg-emerald-950/80 text-emerald-100"
          : "bg-teal-950/80 text-teal-100";
      break;
    default:
      break;
  }

  return {
    key: `extra-${extra.type}-${index}`,
    label: applyPhasePrefix(label, extra.source, t),
    colorClass,
  };
}

function buildEnemyIntentEntries(
  combat: CombatState,
  enemy: CombatState["enemies"][number],
  resolvedTarget:
    | "player"
    | "all_enemies"
    | "all_allies"
    | { type: "enemy"; instanceId: string }
    | { type: "ally"; instanceId: string },
  ability: EnemyAbility,
  t: (key: string, options?: Record<string, unknown>) => string
): EnemyIntentEntry[] {
  const baseEntries = ability.effects.map((effect, index) =>
    buildEffectIntentEntry(
      effect,
      index,
      t,
      combat,
      enemy,
      ability,
      resolvedTarget
    )
  );
  const bonusEntries = getEnemyIntentDamageBonuses(combat, enemy, ability).map(
    (bonus, index) => buildDamageBonusIntentEntry(bonus, index, t)
  );
  const extraEntries = [
    ...getEnemyIntentAbilityExtraEffects(combat, enemy, ability),
    ...getEnemyIntentPendingPhaseExtraEffects(combat, enemy),
  ].map((extra, index) => buildExtraIntentEntry(extra, index, t));

  return [...baseEntries, ...bonusEntries, ...extraEntries].filter(
    (entry) => entry.label.length > 0
  );
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
  const effectiveAbility = ability ?? {
    name: "",
    weight: 1,
    effects,
  };

  return buildEnemyIntentEntries(
    combat,
    enemy,
    resolvedTarget,
    effectiveAbility,
    t
  ).map((entry) => (
    <span
      key={entry.key}
      className={cn(
        "rounded px-1.5 py-0.5 text-[10px] font-bold",
        entry.colorClass
      )}
    >
      {entry.label}
    </span>
  ));
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
      case "HEAL":
        return t("reward.effect.heal", { value: effect.value });
      case "BLOCK":
        return t("reward.effect.block", { value: effect.value });
      case "BLOCK_PER_CURRENT_INK":
        return t("reward.effect.blockPerCurrentInk", {
          value: effect.value,
        });
      case "BLOCK_PER_EXHAUSTED_CARD":
        return t("reward.effect.blockPerExhaustedCard", {
          value: effect.value,
        });
      case "APPLY_BUFF_PER_EXHAUSTED_CARD":
        return t("reward.effect.applyBuffPerExhaustedCard", {
          buff: effect.buff ?? "status",
          value: effect.value,
        });
      case "RETRIGGER_THORNS_ON_WEAK_ATTACK":
        return t("reward.effect.retriggerThornsOnWeakAttack", {
          value: effect.value,
        });
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
      case "FORCE_DISCARD_RANDOM":
        return t("reward.effect.forceDiscardRandom", { value: effect.value });
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

  return buildEnemyIntentEntries(
    combat,
    enemy,
    resolvedTarget,
    ability,
    translate
  ).map((entry) => entry.label);
}

export function summarizeEnemyIntentLabels(
  labels: string[],
  maxVisible: number
): {
  visibleLabels: string[];
  remaining: number;
} {
  const safeMaxVisible = Math.max(1, Math.floor(maxVisible));

  return {
    visibleLabels: labels.slice(0, safeMaxVisible),
    remaining: Math.max(0, labels.length - safeMaxVisible),
  };
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
    effectiveBaseDamage += getEnemyIntentActiveDamageBonusTotal(
      combat,
      enemy,
      ability
    );
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

function resolveEnemyIntentTargetBlock(
  combat: CombatState,
  resolvedTarget:
    | "player"
    | "all_enemies"
    | "all_allies"
    | { type: "enemy"; instanceId: string }
    | { type: "ally"; instanceId: string }
): number {
  if (resolvedTarget === "player") return combat.player.block;

  if (resolvedTarget === "all_enemies") {
    return combat.enemies.find((entry) => entry.currentHp > 0)?.block ?? 0;
  }

  if (resolvedTarget === "all_allies") {
    return combat.allies.find((entry) => entry.currentHp > 0)?.block ?? 0;
  }

  if (resolvedTarget.type === "ally") {
    return (
      combat.allies.find(
        (entry) => entry.instanceId === resolvedTarget.instanceId
      )?.block ?? 0
    );
  }

  return (
    combat.enemies.find(
      (entry) => entry.instanceId === resolvedTarget.instanceId
    )?.block ?? 0
  );
}

export function computeEnemyEffectDamagePreview(
  combat: CombatState,
  enemy: CombatState["enemies"][number],
  resolvedTarget:
    | "player"
    | "all_enemies"
    | "all_allies"
    | { type: "enemy"; instanceId: string }
    | { type: "ally"; instanceId: string },
  effect: Effect,
  ability?: EnemyAbility
): number {
  if (effect.type === "DAMAGE") {
    return computeEnemyDamagePreview(
      combat,
      enemy,
      resolvedTarget,
      effect.value,
      ability
    );
  }

  if (effect.type !== "DAMAGE_PER_TARGET_BLOCK") {
    return 0;
  }

  const targetBlock = resolveEnemyIntentTargetBlock(combat, resolvedTarget);
  const targetBuffs = resolveEnemyIntentTargetBuffs(combat, resolvedTarget);
  return calculateDamage(
    computeDamageFromTargetBlock(targetBlock, effect.value),
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

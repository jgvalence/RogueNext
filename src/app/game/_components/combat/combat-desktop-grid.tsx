"use client";

import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils/cn";
import type { CombatState } from "@/game/schemas/combat-state";
import type { AllyDefinition, EnemyDefinition } from "@/game/schemas/entities";
import { Tooltip } from "../shared/Tooltip";
import { HpBar } from "../shared/HpBar";
import { ArmorBadge, IncomingDamageBadge } from "./combat-badges";
import {
  buildMobileEnemyIntentChips,
  buildPlayerStatusMarkers,
  formatAllyIntent,
  renderBuffTooltipDetails,
  renderCompactBuffs,
  renderEnemyIntentEffects,
  renderCompactStatusMarkersForPlayer,
  renderStatusMarkerDetailsForPlayer,
  resolveEnemyIntentTargetLabel,
} from "./combat-view-helpers";
import { resolveEnemyAbilityTarget } from "@/game/engine/enemies";
import { shouldHideEnemyIntent } from "@/game/engine/difficulty";
import { getEnemyImageSrc, PLAYER_AVATAR } from "@/lib/assets";
import { localizeEnemyAbilityName } from "@/lib/i18n/entity-text";

interface CombatDesktopGridProps {
  combat: CombatState;
  allySlots: Array<CombatState["allies"][number] | null>;
  enemySlots: Array<CombatState["enemies"][number] | null>;
  allyDefs: Map<string, AllyDefinition>;
  enemyDefs: Map<string, EnemyDefinition>;
  selectingEnemyTarget: boolean;
  selectingAllyTarget: boolean;
  selfCanRetargetToAlly: boolean;
  selectedCardId: string | null;
  actingEnemyId: string | null;
  attackingEnemyId: string | null;
  isSelectingCheatKillTarget: boolean;
  newlySummonedIds: Set<string>;
  enemyArtFailures: Set<string>;
  incomingDamage: {
    player: number;
    allies: Record<string, number>;
  };
  incomingDamageByEnemyId: Map<string, number>;
  attackBonus: number;
  playerHit: boolean;
  avatarFailed: boolean;
  onAvatarError: () => void;
  markEnemyArtFailure: (enemyDefinitionId: string) => void;
  getEnemyDisplayName: (enemy: CombatState["enemies"][number]) => string;
  onAllyClick: (allyInstanceId: string) => void;
  onEnemyClick: (enemyInstanceId: string) => void;
  isArmorTutorialStep: boolean;
  isIncomingDamageTutorialStep: boolean;
}

export function CombatDesktopGrid({
  combat,
  allySlots,
  enemySlots,
  allyDefs,
  enemyDefs,
  selectingEnemyTarget,
  selectingAllyTarget,
  selfCanRetargetToAlly,
  selectedCardId,
  actingEnemyId,
  attackingEnemyId,
  isSelectingCheatKillTarget,
  newlySummonedIds,
  enemyArtFailures,
  incomingDamage,
  incomingDamageByEnemyId,
  attackBonus,
  playerHit,
  avatarFailed,
  onAvatarError,
  markEnemyArtFailure,
  getEnemyDisplayName,
  onAllyClick,
  onEnemyClick,
  isArmorTutorialStep,
  isIncomingDamageTutorialStep,
}: CombatDesktopGridProps) {
  const { t } = useTranslation();
  const playerStatusMarkers = buildPlayerStatusMarkers(
    combat.player,
    combat.playerDisruption,
    combat.nextPlayerDisruption,
    attackBonus
  );

  return (
    <div className="hidden w-full max-w-[1500px] grid-cols-4 gap-1.5 lg:grid lg:grid-cols-8 lg:gap-3">
      {allySlots.map((ally, index) => {
        if (!ally) {
          return (
            <div
              key={`ally-empty-${index}`}
              className="h-28 rounded-xl border border-cyan-900/50 bg-cyan-950/20 sm:h-32 lg:h-56"
            />
          );
        }

        const def = allyDefs.get(ally.definitionId);
        const intent = def?.abilities[ally.intentIndex];
        const canTarget =
          (selectingAllyTarget || selfCanRetargetToAlly) &&
          ally.currentHp > 0 &&
          !actingEnemyId;
        const isDead = ally.currentHp <= 0;

        return (
          <Tooltip
            key={ally.instanceId}
            content={
              <div className="space-y-1.5">
                <p className="font-semibold text-cyan-200">{ally.name}</p>
                <p>
                  {t("combat.hp")} {Math.max(0, ally.currentHp)}/{ally.maxHp}
                </p>
                <p>
                  {t("combat.block")} {ally.block}
                </p>
                <p>
                  {t("combat.spd")} {ally.speed}
                </p>
                {intent ? (
                  <p className="text-cyan-100">
                    {intent.name}: {formatAllyIntent(intent, t)}
                  </p>
                ) : (
                  <p className="text-slate-300">{t("combat.noAbility")}</p>
                )}
                {ally.buffs.length > 0 && (
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-100">
                      {t("combat.activeEffects")}
                    </p>
                    {renderBuffTooltipDetails(ally.buffs)}
                  </div>
                )}
              </div>
            }
          >
            <button
              type="button"
              data-keep-selection="true"
              onClick={
                canTarget ? () => onAllyClick(ally.instanceId) : undefined
              }
              className={cn(
                "relative h-28 w-full rounded-xl border bg-cyan-950/40 p-1.5 text-left sm:h-32 sm:p-2 lg:h-56 lg:p-2.5",
                isDead
                  ? "border-slate-800 opacity-45 grayscale"
                  : "border-cyan-700/80",
                canTarget &&
                  "cursor-pointer border-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.35)] hover:-translate-y-1",
                !canTarget && "cursor-default"
              )}
            >
              <div className="absolute -top-2 left-2 flex max-w-[90%] items-center gap-1 overflow-hidden">
                {renderCompactBuffs(ally.buffs)}
              </div>
              {isDead && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl">
                  <span className="text-center text-[10px] font-bold text-red-400">
                    {t("combat.deadInCombat")}
                  </span>
                </div>
              )}
              {!isDead && (incomingDamage.allies[ally.instanceId] ?? 0) > 0 && (
                <IncomingDamageBadge
                  damage={incomingDamage.allies[ally.instanceId]!}
                  block={ally.block}
                  highlight={isIncomingDamageTutorialStep}
                />
              )}
              <div className="mb-1 flex h-14 items-center justify-center rounded-lg border border-cyan-900/60 bg-cyan-950/70 text-2xl sm:h-16 lg:h-28">
                *
              </div>
              <p className="truncate text-[11px] font-bold text-cyan-100 lg:text-xs">
                {ally.name}
              </p>
              <HpBar
                current={Math.max(0, ally.currentHp)}
                max={ally.maxHp}
                showText={false}
                color="green"
                className="mt-1 h-2 bg-slate-700"
              />
              <p className="mt-1 pr-10 text-[10px] font-semibold text-slate-200 lg:text-[11px]">
                {Math.max(0, ally.currentHp)}/{ally.maxHp}
                {ally.block > 0 ? ` | ${t("combat.block")} ${ally.block}` : ""}
              </p>
              <ArmorBadge block={ally.block} highlight={isArmorTutorialStep} />
            </button>
          </Tooltip>
        );
      })}

      <Tooltip
        content={
          <div className="space-y-1.5">
            <p className="font-semibold text-slate-100">{t("combat.player")}</p>
            <p>
              {t("combat.hp")} {combat.player.currentHp}/{combat.player.maxHp}
            </p>
            <p>
              {t("combat.block")} {combat.player.block}
            </p>
            <p>
              Energy {combat.player.energyCurrent}/{combat.player.energyMax}
            </p>
            <div className="space-y-1">
              <p className="font-semibold text-slate-100">
                {t("combat.activeEffects")}
              </p>
              {renderStatusMarkerDetailsForPlayer(playerStatusMarkers)}
            </div>
          </div>
        }
      >
        <div
          className={cn(
            "relative h-28 rounded-xl border bg-indigo-950/35 p-1.5 sm:h-32 sm:p-2 lg:h-56 lg:p-2.5",
            isArmorTutorialStep &&
              "ring-2 ring-cyan-300/80 ring-offset-2 ring-offset-slate-950",
            isIncomingDamageTutorialStep &&
              "ring-2 ring-rose-300/70 ring-offset-2 ring-offset-slate-950",
            playerHit
              ? "border-red-400 shadow-[0_0_22px_rgba(248,113,113,0.4)]"
              : "border-indigo-500/70"
          )}
        >
          <div className="absolute -top-2 left-2 flex max-w-[90%] items-center gap-1 overflow-hidden">
            {renderCompactStatusMarkersForPlayer(playerStatusMarkers)}
          </div>
          {incomingDamage.player > 0 && (
            <IncomingDamageBadge
              damage={incomingDamage.player}
              block={combat.player.block}
              highlight={isIncomingDamageTutorialStep}
            />
          )}
          <div className="mb-1 flex h-14 items-center justify-center overflow-hidden rounded-lg border border-indigo-800/70 bg-indigo-950/75 sm:h-16 lg:h-28">
            {!avatarFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={PLAYER_AVATAR}
                alt={t("combat.player")}
                className="h-full w-full object-cover"
                onError={onAvatarError}
              />
            ) : (
              <span className="text-2xl">*</span>
            )}
          </div>
          <p className="truncate text-[11px] font-bold text-indigo-100 lg:text-xs">
            {t("combat.player")}
          </p>
          <HpBar
            current={Math.max(0, combat.player.currentHp)}
            max={combat.player.maxHp}
            showText={false}
            className="mt-1 h-2 bg-slate-700"
          />
          <p className="mt-1 pr-10 text-[10px] font-semibold text-slate-200 lg:text-[11px]">
            {Math.max(0, combat.player.currentHp)}/{combat.player.maxHp}
            {combat.player.block > 0
              ? ` | ${t("combat.block")} ${combat.player.block}`
              : ""}
          </p>
          <ArmorBadge
            block={combat.player.block}
            highlight={isArmorTutorialStep}
          />
        </div>
      </Tooltip>

      {enemySlots.map((enemy, index) => {
        if (!enemy) {
          return (
            <div
              key={`enemy-empty-${index}`}
              className="h-28 rounded-xl border border-rose-900/50 bg-rose-950/20 sm:h-32 lg:h-56"
            />
          );
        }

        const def = enemyDefs.get(enemy.definitionId);
        if (!def) return null;
        const isDead = enemy.currentHp <= 0;
        const ability = def.abilities[enemy.intentIndex];
        const resolvedTarget = ability
          ? resolveEnemyAbilityTarget(combat, enemy, ability)
          : "player";
        const hideIntent = shouldHideEnemyIntent(
          combat.difficultyLevel ?? 0,
          combat.turnNumber,
          enemy,
          { playerHand: combat.hand }
        );
        const isTargetable =
          selectingEnemyTarget &&
          selectedCardId !== null &&
          enemy.currentHp > 0 &&
          !actingEnemyId;
        const isCheatSelectable =
          isSelectingCheatKillTarget && enemy.currentHp > 0;
        const isActing = actingEnemyId === enemy.instanceId;
        const enemyArtSrc = getEnemyImageSrc(enemy.definitionId);
        const enemyArtFailed = enemyArtFailures.has(enemy.definitionId);

        return (
          <Tooltip
            key={enemy.instanceId}
            content={
              <div className="space-y-1.5">
                <p className="font-semibold text-rose-200">
                  {getEnemyDisplayName(enemy)}
                </p>
                <p>
                  {t("combat.hp")} {Math.max(0, enemy.currentHp)}/{enemy.maxHp}
                </p>
                <p>
                  {t("combat.block")} {enemy.block}
                </p>
                {ability && !hideIntent ? (
                  <div>
                    <p className="text-amber-200">
                      {localizeEnemyAbilityName(
                        enemy.definitionId,
                        ability.name
                      )}
                      {" -> "}
                      {resolveEnemyIntentTargetLabel(combat, resolvedTarget, t)}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {renderEnemyIntentEffects(
                        ability.effects,
                        t,
                        combat,
                        enemy,
                        ability,
                        resolvedTarget
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-300">
                    {hideIntent ? t("enemyCard.intentHidden") : "-"}
                  </p>
                )}
                {enemy.buffs.length > 0 && (
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-100">
                      {t("combat.activeEffects")}
                    </p>
                    {renderBuffTooltipDetails(enemy.buffs)}
                  </div>
                )}
              </div>
            }
          >
            <button
              type="button"
              data-keep-selection="true"
              onClick={() => onEnemyClick(enemy.instanceId)}
              className={cn(
                "relative h-28 w-full rounded-xl border bg-rose-950/35 p-1.5 text-left transition-all sm:h-32 sm:p-2 lg:h-56 lg:p-2.5",
                isIncomingDamageTutorialStep &&
                  "ring-2 ring-rose-300/80 ring-offset-2 ring-offset-slate-950",
                isDead
                  ? "border-slate-800 opacity-45 grayscale"
                  : "border-rose-700/80",
                (isTargetable || isCheatSelectable) &&
                  "border-red-400 shadow-[0_0_20px_rgba(248,113,113,0.45)]",
                !isDead && !isActing && "cursor-pointer hover:-translate-y-1",
                isActing && "animate-enemy-acting",
                attackingEnemyId === enemy.instanceId && "animate-enemy-attack",
                newlySummonedIds.has(enemy.instanceId) &&
                  "animate-enemy-summon-enter"
              )}
            >
              <div className="absolute -top-2 left-2 flex max-w-[90%] items-center gap-1 overflow-hidden">
                {renderCompactBuffs(enemy.buffs)}
              </div>
              <div className="mb-1 flex h-14 items-center justify-center overflow-hidden rounded-lg border border-rose-900/60 bg-slate-900 sm:h-16 lg:h-28">
                {!enemyArtFailed ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={enemyArtSrc}
                      alt={getEnemyDisplayName(enemy)}
                      className="h-full w-full object-cover object-top"
                      onError={() => markEnemyArtFailure(enemy.definitionId)}
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-900/15 to-transparent" />
                  </>
                ) : (
                  <span className="text-2xl text-rose-200">*</span>
                )}
                <span className="absolute left-2 top-1 text-[9px] font-bold uppercase tracking-wider text-amber-300/90">
                  {hideIntent
                    ? "???"
                    : ability
                      ? localizeEnemyAbilityName(
                          enemy.definitionId,
                          ability.name
                        )
                      : "-"}
                </span>
              </div>
              <p className="truncate text-[11px] font-bold text-rose-100 lg:text-xs">
                {getEnemyDisplayName(enemy)}
              </p>
              <div className="mt-1 flex min-h-5 flex-wrap gap-0.5">
                {buildMobileEnemyIntentChips(
                  combat,
                  enemy,
                  resolvedTarget,
                  ability,
                  hideIntent,
                  t
                ).map((chip, chipIndex) => (
                  <span
                    key={`${enemy.instanceId}-desktop-intent-${chipIndex}`}
                    className={cn(
                      "rounded border border-rose-800/70 bg-rose-950/70 px-1 py-0.5 text-[8px] font-semibold text-rose-100",
                      isIncomingDamageTutorialStep &&
                        "border-rose-300/80 bg-rose-800/70 text-rose-50"
                    )}
                  >
                    {chip}
                  </span>
                ))}
              </div>
              <HpBar
                current={Math.max(0, enemy.currentHp)}
                max={enemy.maxHp}
                showText={false}
                className="mt-1 h-2 bg-slate-700"
              />
              <p className="mt-1 pr-10 text-[10px] font-semibold text-slate-200 lg:text-[11px]">
                {Math.max(0, enemy.currentHp)}/{enemy.maxHp}
                {enemy.block > 0
                  ? ` | ${t("combat.block")} ${enemy.block}`
                  : ""}
              </p>
              <ArmorBadge block={enemy.block} highlight={isArmorTutorialStep} />
              {!isDead && incomingDamageByEnemyId.get(enemy.instanceId) ? (
                <p className="mt-1 text-[10px] font-semibold text-red-300">
                  {t("enemyCard.incoming")}{" "}
                  {incomingDamageByEnemyId.get(enemy.instanceId)}
                </p>
              ) : null}
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
}

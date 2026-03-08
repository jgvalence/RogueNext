"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils/cn";
import type { CombatState } from "@/game/schemas/combat-state";
import type { AllyDefinition, EnemyDefinition } from "@/game/schemas/entities";
import {
  buildPlayerStatusMarkers,
  computeEnemyDamagePreview,
  renderBuffSymbols,
  renderStatusMarkerSymbolsForPlayer,
} from "./combat-view-helpers";
import { resolveEnemyAbilityTarget } from "@/game/engine/enemies";
import { shouldHideEnemyIntent } from "@/game/engine/difficulty";
import { getEnemyImageSrc, PLAYER_AVATAR } from "@/lib/assets";
import { ArmorBadge } from "./combat-badges";

interface CombatMobileGridProps {
  combat: CombatState;
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
  playerHit: boolean;
  avatarFailed: boolean;
  onAvatarError: () => void;
  onMobileAllyPress: (allyInstanceId: string) => void;
  onMobileEnemyPress: (enemyInstanceId: string) => void;
  onOpenPlayerInfo: () => void;
  getEnemyDisplayName: (enemy: CombatState["enemies"][number]) => string;
  markEnemyArtFailure: (enemyDefinitionId: string) => void;
  isArmorTutorialStep: boolean;
}

export function CombatMobileGrid({
  combat,
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
  playerHit,
  avatarFailed,
  onAvatarError,
  onMobileAllyPress,
  onMobileEnemyPress,
  onOpenPlayerInfo,
  getEnemyDisplayName,
  markEnemyArtFailure,
  isArmorTutorialStep,
}: CombatMobileGridProps) {
  const { t } = useTranslation();
  const playerStatusMarkers = useMemo(
    () =>
      buildPlayerStatusMarkers(
        combat.player,
        combat.playerDisruption,
        combat.nextPlayerDisruption
      ),
    [combat.nextPlayerDisruption, combat.player, combat.playerDisruption]
  );

  const mobileOccupiedSlots = useMemo<
    Array<
      | { type: "ally"; ally: CombatState["allies"][number] }
      | { type: "player" }
      | { type: "enemy"; enemy: CombatState["enemies"][number] }
    >
  >(
    () => [
      ...combat.allies.map((ally) => ({ type: "ally" as const, ally })),
      { type: "player" as const },
      ...combat.enemies.map((enemy) => ({ type: "enemy" as const, enemy })),
    ],
    [combat.allies, combat.enemies]
  );

  const isSingleRowMobileSlots = mobileOccupiedSlots.length <= 4;
  const mobileSlotHeightClass = isSingleRowMobileSlots
    ? "h-[140px] [@media(max-height:540px)]:h-[124px]"
    : "h-[104px] [@media(max-height:540px)]:h-[96px]";
  const mobileSlotArtHeightClass = isSingleRowMobileSlots
    ? "h-20 [@media(max-height:540px)]:h-16"
    : "h-14 [@media(max-height:540px)]:h-12";

  return (
    <div className="w-full lg:hidden">
      <div
        className={cn("grid gap-1.5", !isSingleRowMobileSlots && "grid-cols-4")}
        style={
          isSingleRowMobileSlots
            ? {
                gridTemplateColumns: `repeat(${Math.max(
                  1,
                  mobileOccupiedSlots.length
                )}, minmax(0, 1fr))`,
              }
            : undefined
        }
      >
        {mobileOccupiedSlots.map((entry, index) => {
          if (entry.type === "ally") {
            const ally = entry.ally;
            const def = allyDefs.get(ally.definitionId);
            const intent = def?.abilities[ally.intentIndex];
            const intentDamage =
              intent?.effects.find((effect) => effect.type === "DAMAGE")
                ?.value ?? null;
            const canTarget =
              (selectingAllyTarget || selfCanRetargetToAlly) &&
              ally.currentHp > 0 &&
              !actingEnemyId;
            const isDead = ally.currentHp <= 0;

            return (
              <button
                key={`mobile-ally-${ally.instanceId}`}
                type="button"
                data-keep-selection="true"
                onClick={() => onMobileAllyPress(ally.instanceId)}
                className={cn(
                  "relative rounded-lg border bg-cyan-950/35 px-1.5 py-1 text-left",
                  mobileSlotHeightClass,
                  isDead
                    ? "border-slate-800 opacity-45 grayscale"
                    : "border-cyan-700/80",
                  canTarget && "border-cyan-300 ring-1 ring-cyan-300/70"
                )}
              >
                <div className="absolute -top-1 left-1 flex max-w-[90%] items-center gap-1 overflow-hidden">
                  {renderBuffSymbols(ally.buffs)}
                </div>
                <div
                  className={cn(
                    "mb-1 mt-1 flex items-center justify-center overflow-hidden rounded-md border border-cyan-900/60 bg-cyan-950/65",
                    mobileSlotArtHeightClass
                  )}
                >
                  <span className="text-xl text-cyan-200/85">*</span>
                </div>
                <p className="truncate text-[9px] font-bold text-cyan-100">
                  {ally.name}
                </p>
                <p className="mt-0.5 text-[10px] font-semibold text-slate-200">
                  {Math.max(0, ally.currentHp)}/{ally.maxHp}
                </p>
                <p className="pr-10 text-[9px] font-bold text-cyan-200">
                  {isDead ? "KO" : `? ${intentDamage ?? "-"}`}
                </p>
                <ArmorBadge
                  block={ally.block}
                  compact
                  highlight={isArmorTutorialStep}
                />
              </button>
            );
          }

          if (entry.type === "player") {
            return (
              <button
                key={`mobile-player-${index}`}
                type="button"
                data-keep-selection="true"
                onClick={onOpenPlayerInfo}
                className={cn(
                  "relative rounded-lg border bg-indigo-950/40 px-1.5 py-1 text-left",
                  mobileSlotHeightClass,
                  playerHit
                    ? "border-red-400 shadow-[0_0_14px_rgba(248,113,113,0.4)]"
                    : "border-indigo-500/70"
                )}
              >
                <div className="absolute -top-1 left-1 flex max-w-[90%] items-center gap-1 overflow-hidden">
                  {renderStatusMarkerSymbolsForPlayer(playerStatusMarkers)}
                </div>
                <div
                  className={cn(
                    "mb-1 mt-1 flex items-center justify-center overflow-hidden rounded-md border border-indigo-800/70 bg-indigo-950/70",
                    mobileSlotArtHeightClass
                  )}
                >
                  {!avatarFailed ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={PLAYER_AVATAR}
                      alt={t("combat.player")}
                      className="h-full w-full object-contain p-1"
                      onError={onAvatarError}
                    />
                  ) : (
                    <span className="text-xl text-indigo-100">*</span>
                  )}
                </div>
                <p className="truncate text-[9px] font-bold text-indigo-100">
                  {t("combat.player")}
                </p>
                <p className="mt-0.5 text-[10px] font-semibold text-slate-200">
                  {Math.max(0, combat.player.currentHp)}/{combat.player.maxHp}
                </p>
                <p className="text-[9px] font-bold text-indigo-200">
                  {t("combat.energyShort")} {combat.player.energyCurrent}
                </p>
                <ArmorBadge
                  block={combat.player.block}
                  compact
                  highlight={isArmorTutorialStep}
                />
              </button>
            );
          }

          const enemy = entry.enemy;
          const def = enemyDefs.get(enemy.definitionId);
          if (!def) return null;
          const ability = def.abilities[enemy.intentIndex];
          const resolvedTarget = ability
            ? resolveEnemyAbilityTarget(combat, enemy, ability)
            : "player";
          const hideIntent = shouldHideEnemyIntent(
            combat.difficultyLevel ?? 0,
            combat.turnNumber,
            enemy
          );
          const intentDamageEffect = ability?.effects.find(
            (effect) => effect.type === "DAMAGE"
          );
          const intentDamageLabel = hideIntent
            ? "?"
            : intentDamageEffect
              ? `${computeEnemyDamagePreview(
                  combat,
                  enemy,
                  resolvedTarget,
                  intentDamageEffect.value,
                  ability
                )}`
              : "-";
          const isDead = enemy.currentHp <= 0;
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
            <button
              key={`mobile-enemy-${enemy.instanceId}`}
              type="button"
              data-keep-selection="true"
              onClick={() => onMobileEnemyPress(enemy.instanceId)}
              className={cn(
                "relative rounded-lg border bg-rose-950/35 px-1.5 py-1 text-left transition-all",
                mobileSlotHeightClass,
                isDead
                  ? "border-slate-800 opacity-45 grayscale"
                  : "border-rose-700/80",
                (isTargetable || isCheatSelectable) &&
                  "border-red-400 ring-1 ring-red-300/70",
                isActing && "animate-enemy-acting",
                attackingEnemyId === enemy.instanceId && "animate-enemy-attack",
                newlySummonedIds.has(enemy.instanceId) &&
                  "animate-enemy-summon-enter"
              )}
            >
              <div className="absolute -top-1 left-1 flex max-w-[90%] items-center gap-1 overflow-hidden">
                {renderBuffSymbols(enemy.buffs)}
              </div>
              <div
                className={cn(
                  "mb-1 mt-1 flex items-center justify-center overflow-hidden rounded-md border border-rose-900/60 bg-slate-900",
                  mobileSlotArtHeightClass
                )}
              >
                {!enemyArtFailed ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={enemyArtSrc}
                      alt={getEnemyDisplayName(enemy)}
                      className="h-full w-full object-contain object-center p-1"
                      onError={() => markEnemyArtFailure(enemy.definitionId)}
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/55 via-slate-900/5 to-transparent" />
                  </>
                ) : (
                  <span className="text-xl text-rose-200">*</span>
                )}
              </div>
              <p className="truncate text-[9px] font-bold text-rose-100">
                {getEnemyDisplayName(enemy)}
              </p>
              <p className="mt-0.5 text-[10px] font-semibold text-slate-200">
                {Math.max(0, enemy.currentHp)}/{enemy.maxHp}
              </p>
              <p className="pr-10 text-[9px] font-bold text-amber-200">
                {isDead ? "KO" : `? ${intentDamageLabel}`}
              </p>
              <ArmorBadge
                block={enemy.block}
                compact
                highlight={isArmorTutorialStep}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

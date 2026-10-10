"use client";

import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils/cn";
import type { CombatState } from "@/game/schemas/combat-state";
import type { AllyDefinition, EnemyDefinition } from "@/game/schemas/entities";
import { Tooltip } from "../shared/Tooltip";
import { HpBar } from "../shared/HpBar";
import { ArmorBadge, IncomingDamageBadge } from "./combat-badges";
import {
  buildEnemyStatusMarkers,
  buildMobileEnemyIntentChips,
  buildPlayerStatusMarkers,
  formatAllyIntent,
  renderBuffTooltipDetails,
  renderCompactEnemyStatusMarkers,
  renderCompactBuffs,
  renderEnemyStatusMarkerDetails,
  renderEnemyIntentEffects,
  renderCompactStatusMarkersForPlayer,
  renderStatusMarkerDetailsForPlayer,
  resolveEnemyIntentTargetLabel,
  summarizeEnemyIntentLabels,
} from "./combat-view-helpers";
import { resolveEnemyAbilityTarget } from "@/game/engine/enemies";
import { shouldHideEnemyIntent } from "@/game/engine/difficulty";
import { getEnemyImageSrc } from "@/lib/assets";
import { EnemyArtwork } from "../shared/EnemyArtwork";
import { CharacterPortrait, AllyPortrait } from "../shared/CharacterPortrait";
import {
  localizeAllyAbilityName,
  localizeAllyName,
  localizeEnemyAbilityName,
} from "@/lib/i18n/entity-text";

interface CombatDesktopGridProps {
  characterId?: string;
  contactShadowClass: string;
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
    player: {
      total: number;
      hpLoss: number;
    };
    allies: Record<
      string,
      {
        total: number;
        hpLoss: number;
      }
    >;
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
  aoeFlashMap: Map<string, { delay: number; color: string }>;
}

export function CombatDesktopGrid({
  characterId = "scribe",
  contactShadowClass,
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
  markEnemyArtFailure,
  getEnemyDisplayName,
  onAllyClick,
  onEnemyClick,
  isArmorTutorialStep,
  isIncomingDamageTutorialStep,
  aoeFlashMap,
}: CombatDesktopGridProps) {
  const { t } = useTranslation();
  const playerStatusMarkers = buildPlayerStatusMarkers(
    combat.player,
    combat.playerDisruption,
    combat.nextPlayerDisruption,
    attackBonus
  );

  return (
    <div className="combat-desktop-grid hidden w-full max-w-[1500px] items-end justify-center gap-5 px-4 lg:flex xl:gap-8">
      {allySlots.map((ally) => {
        if (!ally) {
          return null;
        }

        const def = allyDefs.get(ally.definitionId);
        const intent = def?.abilities[ally.intentIndex];
        const localizedAllyName = localizeAllyName(
          ally.definitionId,
          ally.name
        );
        const localizedAllyIntentName = intent
          ? localizeAllyAbilityName(ally.definitionId, intent.name)
          : null;
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
                <p className="font-semibold text-cyan-200">
                  {localizedAllyName}
                </p>
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
                    {localizedAllyIntentName}: {formatAllyIntent(intent, t)}
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
                "to-slate-950/92 relative h-72 min-w-0 max-w-[220px] flex-1 rounded-[2rem_2rem_1rem_1rem] border bg-gradient-to-b from-cyan-950/5 via-cyan-950/20 p-2 text-left shadow-[0_22px_45px_rgba(2,6,23,0.34)] transition-all before:pointer-events-none before:absolute before:-bottom-4 before:left-[8%] before:h-5 before:w-[84%] before:rounded-[50%] before:opacity-80 before:blur-md xl:h-80",
                contactShadowClass,
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
              {!isDead &&
                (incomingDamage.allies[ally.instanceId]?.total ?? 0) > 0 && (
                  <IncomingDamageBadge
                    incoming={incomingDamage.allies[ally.instanceId]!}
                    highlight={isIncomingDamageTutorialStep}
                  />
                )}
              <div className="mb-2 flex h-40 items-center justify-center rounded-[1.75rem_1.75rem_0.65rem_0.65rem] border border-cyan-700/20 bg-[radial-gradient(ellipse_at_bottom,rgba(8,145,178,0.24),transparent_68%)] text-5xl text-cyan-200/70 xl:h-44">
                <AllyPortrait
                  identity={ally.definitionId}
                  className="h-full w-full object-contain"
                />
              </div>
              <p className="truncate px-1 text-sm font-bold text-cyan-100">
                {localizedAllyName}
              </p>
              <HpBar
                current={Math.max(0, ally.currentHp)}
                max={ally.maxHp}
                showText={false}
                color="green"
                className="mx-1 mt-2 h-2.5 bg-slate-800"
              />
              <p className="mt-1 px-1 pr-10 text-xs font-semibold text-slate-200">
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
            "to-slate-950/92 relative h-72 min-w-0 max-w-[230px] flex-1 rounded-[2rem_2rem_1rem_1rem] border bg-gradient-to-b from-indigo-950/5 via-indigo-950/20 p-2 shadow-[0_22px_48px_rgba(30,27,75,0.28)] before:pointer-events-none before:absolute before:-bottom-4 before:left-[8%] before:h-5 before:w-[84%] before:rounded-[50%] before:opacity-80 before:blur-md xl:h-80",
            contactShadowClass,
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
          {incomingDamage.player.total > 0 && (
            <IncomingDamageBadge
              incoming={incomingDamage.player}
              highlight={isIncomingDamageTutorialStep}
            />
          )}
          <div className="mb-2 flex h-40 items-end justify-center overflow-hidden rounded-[1.75rem_1.75rem_0.65rem_0.65rem] border border-indigo-500/20 bg-[radial-gradient(ellipse_at_bottom,rgba(79,70,229,0.3),transparent_70%)] xl:h-44">
            <CharacterPortrait
              identity={characterId}
              className="h-full w-full drop-shadow-[0_16px_14px_rgba(0,0,0,0.5)]"
            />
          </div>
          <p className="truncate px-1 text-sm font-bold text-indigo-100">
            {t("combat.player")}
          </p>
          <HpBar
            current={Math.max(0, combat.player.currentHp)}
            max={combat.player.maxHp}
            showText={false}
            className="mx-1 mt-2 h-2.5 bg-slate-800"
          />
          <p className="mt-1 px-1 pr-10 text-xs font-semibold text-slate-200">
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

      {enemySlots.map((enemy) => {
        if (!enemy) {
          return null;
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
        const enemyStatusMarkers = buildEnemyStatusMarkers(enemy);
        const intentChips = buildMobileEnemyIntentChips(
          combat,
          enemy,
          resolvedTarget,
          ability,
          hideIntent,
          t
        );
        const { visibleLabels, remaining } = summarizeEnemyIntentLabels(
          intentChips,
          def.isBoss ? 3 : 2
        );

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
                {enemyStatusMarkers.length > 0 && (
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-100">
                      {t("combat.activeEffects")}
                    </p>
                    {renderEnemyStatusMarkerDetails(enemyStatusMarkers)}
                  </div>
                )}
              </div>
            }
          >
            <button
              type="button"
              data-keep-selection="true"
              onClick={() => {
                if (!isDead) onEnemyClick(enemy.instanceId);
              }}
              className={cn(
                "via-rose-950/18 to-slate-950/94 relative h-72 min-w-0 max-w-[230px] flex-1 rounded-[2rem_2rem_1rem_1rem] border bg-gradient-to-b from-rose-950/5 p-2 text-left shadow-[0_22px_48px_rgba(76,5,25,0.25)] transition-all before:pointer-events-none before:absolute before:-bottom-4 before:left-[8%] before:h-5 before:w-[84%] before:rounded-[50%] before:opacity-80 before:blur-md xl:h-80",
                contactShadowClass,
                isIncomingDamageTutorialStep &&
                  "ring-2 ring-rose-300/80 ring-offset-2 ring-offset-slate-950",
                isDead
                  ? "border-slate-800 opacity-45 grayscale"
                  : "border-rose-700/80",
                (isTargetable || isCheatSelectable) &&
                  "border-red-400 shadow-[0_0_20px_rgba(248,113,113,0.45)]",
                !isDead && !isActing && "cursor-pointer hover:-translate-y-1",
                !isDead &&
                  !isActing &&
                  attackingEnemyId !== enemy.instanceId &&
                  !newlySummonedIds.has(enemy.instanceId) &&
                  "animate-enemy-idle",
                isActing && "animate-enemy-acting",
                attackingEnemyId === enemy.instanceId && "animate-enemy-attack",
                newlySummonedIds.has(enemy.instanceId) &&
                  "animate-enemy-summon-enter"
              )}
            >
              <div className="absolute -top-2 left-2 flex max-w-[90%] items-center gap-1 overflow-hidden">
                {renderCompactEnemyStatusMarkers(enemyStatusMarkers)}
              </div>
              <div className="relative mb-2 flex h-40 items-end justify-center overflow-hidden rounded-[1.75rem_1.75rem_0.65rem_0.65rem] border border-rose-700/20 bg-[radial-gradient(ellipse_at_bottom,rgba(190,24,93,0.25),transparent_70%)] xl:h-44">
                {!enemyArtFailed ? (
                  <>
                    <EnemyArtwork
                      enemyId={enemy.definitionId}
                      src={enemyArtSrc}
                      alt={getEnemyDisplayName(enemy)}
                      className="h-full w-full object-cover object-center"
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
              <p className="truncate px-1 text-sm font-bold text-rose-100">
                {getEnemyDisplayName(enemy)}
              </p>
              <div className="mt-1 flex max-h-[3.2rem] min-h-[2.4rem] flex-wrap content-start gap-1 overflow-hidden px-1">
                {visibleLabels.map((chip, chipIndex) => (
                  <span
                    key={`${enemy.instanceId}-desktop-intent-${chipIndex}`}
                    className={cn(
                      "block max-w-full rounded border border-rose-700/60 bg-rose-950/65 px-1.5 py-0.5 text-[9px] font-semibold leading-tight text-rose-100",
                      isIncomingDamageTutorialStep &&
                        "border-rose-300/80 bg-rose-800/70 text-rose-50"
                    )}
                    style={{
                      display: "-webkit-box",
                      WebkitBoxOrient: "vertical",
                      WebkitLineClamp: 2,
                      overflow: "hidden",
                    }}
                  >
                    {chip}
                  </span>
                ))}
                {remaining > 0 && (
                  <span className="inline-flex items-center rounded border border-slate-600/80 bg-slate-900/80 px-1 py-0.5 text-[8px] font-black text-slate-100">
                    +{remaining}
                  </span>
                )}
              </div>
              <HpBar
                current={Math.max(0, enemy.currentHp)}
                max={enemy.maxHp}
                showText={false}
                className="mx-1 mt-1 h-2.5 bg-slate-800"
              />
              <p className="mt-1 px-1 pr-10 text-xs font-semibold text-slate-200">
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
              {aoeFlashMap.has(enemy.instanceId) && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 animate-aoe-hit rounded-xl"
                  style={{
                    animationDelay: `${aoeFlashMap.get(enemy.instanceId)!.delay}ms`,
                    backgroundColor: aoeFlashMap.get(enemy.instanceId)!.color,
                  }}
                />
              )}
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
}

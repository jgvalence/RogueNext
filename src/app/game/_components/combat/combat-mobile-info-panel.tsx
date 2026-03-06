"use client";

import { cn } from "@/lib/utils/cn";
import type { CombatState } from "@/game/schemas/combat-state";
import type { EnemyDefinition, AllyDefinition } from "@/game/schemas/entities";
import { useTranslation } from "react-i18next";
import { RogueButton } from "@/components/ui/rogue";
import {
  buildPlayerMarkerBuffs,
  formatAllyIntent,
  renderBuffTooltipDetails,
  renderEnemyIntentEffects,
  resolveEnemyIntentTargetLabel,
} from "./combat-view-helpers";
import type { MobileInfoPanelState } from "./combat-view-types";
import { resolveEnemyAbilityTarget } from "@/game/engine/enemies";
import { shouldHideEnemyIntent } from "@/game/engine/difficulty";
import { localizeEnemyAbilityName } from "@/lib/i18n/entity-text";

interface CombatMobileInfoPanelProps {
  mobileInfoPanel: MobileInfoPanelState;
  combat: CombatState;
  enemyDefs: Map<string, EnemyDefinition>;
  allyDefs: Map<string, AllyDefinition>;
  selectingEnemyTarget: boolean;
  selectingAllyTarget: boolean;
  selfCanRetargetToAlly: boolean;
  selectedCardId: string | null;
  actingEnemyId: string | null;
  getEnemyDisplayName: (enemy: CombatState["enemies"][number]) => string;
  onEnemyTarget: (enemyInstanceId: string) => void;
  onAllyTarget: (allyInstanceId: string) => void;
  onClose: () => void;
}

export function CombatMobileInfoPanel({
  mobileInfoPanel,
  combat,
  enemyDefs,
  allyDefs,
  selectingEnemyTarget,
  selectingAllyTarget,
  selfCanRetargetToAlly,
  selectedCardId,
  actingEnemyId,
  getEnemyDisplayName,
  onEnemyTarget,
  onAllyTarget,
  onClose,
}: CombatMobileInfoPanelProps) {
  const { t } = useTranslation();

  if (!mobileInfoPanel) return null;

  const mobileInfoEnemy =
    mobileInfoPanel.type === "enemy"
      ? (combat.enemies.find(
          (entry) => entry.instanceId === mobileInfoPanel.instanceId
        ) ?? null)
      : null;
  const mobileInfoAlly =
    mobileInfoPanel.type === "ally"
      ? (combat.allies.find(
          (entry) => entry.instanceId === mobileInfoPanel.instanceId
        ) ?? null)
      : null;

  return (
    <div
      data-keep-selection="true"
      className="fixed inset-0 z-[90] flex items-end lg:hidden"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        data-keep-selection="true"
        className="w-full overflow-hidden rounded-t-3xl bg-slate-950 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex justify-center pb-1 pt-2.5">
          <div className="h-1 w-10 rounded-full bg-slate-700" />
        </div>

        {mobileInfoPanel.type === "enemy" &&
          mobileInfoEnemy &&
          (() => {
            const enemy = mobileInfoEnemy;
            const def = enemyDefs.get(enemy.definitionId);
            const ability = def?.abilities[enemy.intentIndex];
            const resolvedTarget = ability
              ? resolveEnemyAbilityTarget(combat, enemy, ability)
              : "player";
            const hideIntent = shouldHideEnemyIntent(
              combat.difficultyLevel ?? 0,
              combat.turnNumber,
              enemy
            );
            const hpRatio =
              enemy.maxHp > 0 ? Math.max(0, enemy.currentHp) / enemy.maxHp : 0;
            const canTargetNow =
              selectingEnemyTarget &&
              selectedCardId !== null &&
              !actingEnemyId &&
              enemy.currentHp > 0;

            return (
              <>
                <div className="relative overflow-hidden bg-gradient-to-b from-rose-950/90 to-slate-950 px-5 pb-5 pt-3">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(220,38,38,0.2),transparent_60%)]" />
                  <div className="relative flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-rose-400/70">
                        Ennemi
                      </p>
                      <h2 className="mt-0.5 truncate text-2xl font-black text-white">
                        {getEnemyDisplayName(enemy)}
                      </h2>
                      <div className="mt-3">
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="text-slate-400">PV</span>
                          <span className="font-bold text-slate-200">
                            {Math.max(0, enemy.currentHp)}/{enemy.maxHp}
                          </span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              hpRatio > 0.5
                                ? "bg-gradient-to-r from-emerald-500 to-green-400"
                                : hpRatio > 0.25
                                  ? "bg-gradient-to-r from-amber-500 to-yellow-400"
                                  : "bg-gradient-to-r from-red-600 to-rose-400"
                            )}
                            style={{ width: `${hpRatio * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    {enemy.block > 0 && (
                      <div className="flex flex-shrink-0 flex-col items-center rounded-2xl border border-blue-500/40 bg-blue-950/80 px-4 py-2">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-blue-400">
                          Armure
                        </p>
                        <p className="text-2xl font-black text-blue-200">
                          {enemy.block}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="max-h-[40vh] space-y-3 overflow-y-auto px-5 py-3">
                  <div>
                    <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
                      Prochain coup
                    </p>
                    {ability && !hideIntent ? (
                      <div className="rounded-2xl border border-rose-800/50 bg-rose-950/30 px-4 py-3">
                        <p className="text-sm font-bold text-rose-200">
                          {localizeEnemyAbilityName(
                            enemy.definitionId,
                            ability.name
                          )}
                          <span className="ml-2 text-xs font-normal text-slate-400">
                            -&gt;{" "}
                            {resolveEnemyIntentTargetLabel(
                              combat,
                              resolvedTarget,
                              t
                            )}
                          </span>
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
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
                      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 px-4 py-3">
                        <p className="text-sm text-slate-500">
                          {hideIntent ? t("enemyCard.intentHidden") : "-"}
                        </p>
                      </div>
                    )}
                  </div>

                  {enemy.buffs.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
                        Effets actifs
                      </p>
                      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 px-4 py-3">
                        {renderBuffTooltipDetails(enemy.buffs)}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2.5 px-5 pb-8 pt-2">
                  {canTargetNow && (
                    <RogueButton
                      type="primary"
                      data-keep-selection="true"
                      className="!h-auto !flex-1 !rounded-2xl !border !border-red-400/30 !bg-gradient-to-r !from-red-700 !to-rose-600 !py-3.5 !text-sm !font-black !uppercase !tracking-wide !text-white !shadow-[0_0_18px_rgba(239,68,68,0.35)]"
                      onClick={() => {
                        onEnemyTarget(enemy.instanceId);
                        onClose();
                      }}
                    >
                      {t("combat.chooseTargetCta")}
                    </RogueButton>
                  )}
                  <RogueButton
                    type="text"
                    data-keep-selection="true"
                    className="!h-auto !flex-1 !rounded-2xl !border !border-slate-700 !bg-slate-800 !py-3.5 !text-sm !font-semibold !text-slate-300"
                    onClick={onClose}
                  >
                    {t("common.close")}
                  </RogueButton>
                </div>
              </>
            );
          })()}

        {mobileInfoPanel.type === "player" &&
          (() => {
            const player = combat.player;
            const hpRatio =
              player.maxHp > 0
                ? Math.max(0, player.currentHp) / player.maxHp
                : 0;
            const playerBuffs = buildPlayerMarkerBuffs(player);

            return (
              <>
                <div className="relative overflow-hidden bg-gradient-to-b from-indigo-950/90 to-slate-950 px-5 pb-5 pt-3">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.2),transparent_60%)]" />
                  <div className="relative flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-400/70">
                        Joueur
                      </p>
                      <h2 className="mt-0.5 text-2xl font-black text-white">
                        {t("combat.player")}
                      </h2>
                      <div className="mt-3">
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="text-slate-400">PV</span>
                          <span className="font-bold text-slate-200">
                            {Math.max(0, player.currentHp)}/{player.maxHp}
                          </span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              hpRatio > 0.5
                                ? "bg-gradient-to-r from-emerald-500 to-green-400"
                                : hpRatio > 0.25
                                  ? "bg-gradient-to-r from-amber-500 to-yellow-400"
                                  : "bg-gradient-to-r from-red-600 to-rose-400"
                            )}
                            style={{ width: `${hpRatio * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    {player.block > 0 && (
                      <div className="flex flex-shrink-0 flex-col items-center rounded-2xl border border-blue-500/40 bg-blue-950/80 px-4 py-2">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-blue-400">
                          Armure
                        </p>
                        <p className="text-2xl font-black text-blue-200">
                          {player.block}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="max-h-[40vh] space-y-3 overflow-y-auto px-5 py-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-2xl border border-yellow-800/40 bg-yellow-950/20 px-4 py-2.5">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-yellow-500">
                        Energie
                      </p>
                      <p className="text-xl font-black text-yellow-200">
                        {player.energyCurrent}
                        <span className="text-sm font-normal text-slate-500">
                          /{player.energyMax}
                        </span>
                      </p>
                    </div>
                    <div className="rounded-2xl border border-cyan-800/40 bg-cyan-950/20 px-4 py-2.5">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-cyan-500">
                        Ink
                      </p>
                      <p className="text-xl font-black text-cyan-200">
                        {player.inkCurrent}
                        <span className="text-sm font-normal text-slate-500">
                          /{player.inkMax}
                        </span>
                      </p>
                    </div>
                  </div>

                  {playerBuffs.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
                        Effets actifs
                      </p>
                      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 px-4 py-3">
                        {renderBuffTooltipDetails(playerBuffs)}
                      </div>
                    </div>
                  )}
                </div>

                <div className="px-5 pb-8 pt-2">
                  <RogueButton
                    type="text"
                    data-keep-selection="true"
                    className="!h-auto !w-full !rounded-2xl !border !border-slate-700 !bg-slate-800 !py-3.5 !text-sm !font-semibold !text-slate-300"
                    onClick={onClose}
                  >
                    {t("common.close")}
                  </RogueButton>
                </div>
              </>
            );
          })()}

        {mobileInfoPanel.type === "ally" &&
          mobileInfoAlly &&
          (() => {
            const ally = mobileInfoAlly;
            const def = allyDefs.get(ally.definitionId);
            const intent = def?.abilities[ally.intentIndex];
            const hpRatio =
              ally.maxHp > 0 ? Math.max(0, ally.currentHp) / ally.maxHp : 0;
            const canTargetAlly =
              (selectingAllyTarget || selfCanRetargetToAlly) &&
              selectedCardId !== null &&
              ally.currentHp > 0;

            return (
              <>
                <div className="relative overflow-hidden bg-gradient-to-b from-cyan-950/90 to-slate-950 px-5 pb-5 pt-3">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(6,182,212,0.2),transparent_60%)]" />
                  <div className="relative flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-400/70">
                        Allie
                      </p>
                      <h2 className="mt-0.5 truncate text-2xl font-black text-white">
                        {ally.name}
                      </h2>
                      <div className="mt-3">
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="text-slate-400">PV</span>
                          <span className="font-bold text-slate-200">
                            {Math.max(0, ally.currentHp)}/{ally.maxHp}
                          </span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              hpRatio > 0.5
                                ? "bg-gradient-to-r from-emerald-500 to-green-400"
                                : hpRatio > 0.25
                                  ? "bg-gradient-to-r from-amber-500 to-yellow-400"
                                  : "bg-gradient-to-r from-red-600 to-rose-400"
                            )}
                            style={{ width: `${hpRatio * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    {ally.block > 0 && (
                      <div className="flex flex-shrink-0 flex-col items-center rounded-2xl border border-blue-500/40 bg-blue-950/80 px-4 py-2">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-blue-400">
                          Armure
                        </p>
                        <p className="text-2xl font-black text-blue-200">
                          {ally.block}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="max-h-[40vh] space-y-3 overflow-y-auto px-5 py-3">
                  {intent && (
                    <div>
                      <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
                        Prochain coup
                      </p>
                      <div className="rounded-2xl border border-cyan-800/50 bg-cyan-950/30 px-4 py-3">
                        <p className="text-sm font-bold text-cyan-200">
                          {intent.name}
                          <span className="ml-2 text-xs font-normal text-slate-300">
                            {formatAllyIntent(intent, t)}
                          </span>
                        </p>
                      </div>
                    </div>
                  )}

                  {ally.buffs.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
                        Effets actifs
                      </p>
                      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 px-4 py-3">
                        {renderBuffTooltipDetails(ally.buffs)}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2.5 px-5 pb-8 pt-2">
                  {canTargetAlly && (
                    <RogueButton
                      type="primary"
                      data-keep-selection="true"
                      className="!h-auto !flex-1 !rounded-2xl !border !border-cyan-400/30 !bg-gradient-to-r !from-cyan-700 !to-teal-600 !py-3.5 !text-sm !font-black !uppercase !tracking-wide !text-white !shadow-[0_0_18px_rgba(6,182,212,0.35)]"
                      onClick={() => {
                        onAllyTarget(ally.instanceId);
                        onClose();
                      }}
                    >
                      {t("combat.chooseTargetCta")}
                    </RogueButton>
                  )}
                  <RogueButton
                    type="text"
                    data-keep-selection="true"
                    className="!h-auto !flex-1 !rounded-2xl !border !border-slate-700 !bg-slate-800 !py-3.5 !text-sm !font-semibold !text-slate-300"
                    onClick={onClose}
                  >
                    {t("common.close")}
                  </RogueButton>
                </div>
              </>
            );
          })()}
      </div>
    </div>
  );
}

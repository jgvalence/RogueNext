"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils/cn";
import type { CombatState } from "@/game/schemas/combat-state";
import type { AllyDefinition, EnemyDefinition } from "@/game/schemas/entities";
import {
  buildEnemyStatusMarkers,
  buildMobileEnemyIntentChips,
  buildPlayerStatusMarkers,
  formatAllyIntent,
  renderCompactEnemyStatusMarkers,
  renderCompactBuffs,
  renderCompactStatusMarkersForPlayer,
  summarizeEnemyIntentLabels,
} from "./combat-view-helpers";
import { resolveEnemyAbilityTarget } from "@/game/engine/enemies";
import { shouldHideEnemyIntent } from "@/game/engine/difficulty";
import { getEnemyImageSrc, PLAYER_AVATAR } from "@/lib/assets";
import { HpBar } from "../shared/HpBar";
import { localizeAllyName } from "@/lib/i18n/entity-text";

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
  attackBonus: number;
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

type MobileOccupiedSlot =
  | { type: "ally"; ally: CombatState["allies"][number] }
  | { type: "player" }
  | { type: "enemy"; enemy: CombatState["enemies"][number] };

function getMonogram(label: string, fallback: string): string {
  const parts = label
    .trim()
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const letters = parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return letters || fallback;
}

function MobileValuePill({
  label,
  value,
  className,
  highlight = false,
}: {
  label: string;
  value: string | number;
  className: string;
  highlight?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.1em]",
        highlight &&
          "ring-1 ring-cyan-200/80 ring-offset-1 ring-offset-slate-950",
        className
      )}
    >
      <span className="opacity-70">{label}</span>
      <span className="text-[10px] leading-none">{value}</span>
    </span>
  );
}

function MobileIntentPreview({
  labels,
  className,
  maxVisible = 2,
}: {
  labels: string[];
  className: string;
  maxVisible?: number;
}) {
  const { visibleLabels, remaining } = summarizeEnemyIntentLabels(
    labels,
    maxVisible
  );

  return (
    <div className="mt-1.5 flex min-h-[34px] flex-wrap gap-1">
      {visibleLabels.map((label, index) => (
        <span
          key={`${label}-${index}`}
          className={cn(
            "block max-w-full rounded-xl border px-2 py-1 text-[10px] font-semibold leading-tight",
            className
          )}
          style={{
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 2,
            overflow: "hidden",
          }}
        >
          {label}
        </span>
      ))}
      {remaining > 0 && (
        <span className="inline-flex items-center rounded-xl border border-slate-600/80 bg-slate-900/80 px-2 py-1 text-[9px] font-black text-slate-100">
          +{remaining}
        </span>
      )}
    </div>
  );
}

function buildMobileRows(
  occupiedSlots: MobileOccupiedSlot[],
  allyCount: number
): MobileOccupiedSlot[][] {
  const alliedRow = occupiedSlots.slice(0, allyCount + 1);
  const enemyRow = occupiedSlots.slice(allyCount + 1);
  return [alliedRow, enemyRow].filter((row) => row.length > 0);
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
  attackBonus,
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
        combat.nextPlayerDisruption,
        attackBonus
      ),
    [
      attackBonus,
      combat.nextPlayerDisruption,
      combat.player,
      combat.playerDisruption,
    ]
  );

  const mobileOccupiedSlots = useMemo<MobileOccupiedSlot[]>(
    () => [
      ...combat.allies.map((ally) => ({ type: "ally" as const, ally })),
      { type: "player" as const },
      ...combat.enemies.map((enemy) => ({ type: "enemy" as const, enemy })),
    ],
    [combat.allies, combat.enemies]
  );
  const mobileRows = useMemo(
    () => buildMobileRows(mobileOccupiedSlots, combat.allies.length),
    [mobileOccupiedSlots, combat.allies.length]
  );

  const isDuelMobileSlots = mobileOccupiedSlots.length <= 2;
  const isSingleRowMobileSlots = mobileRows.length === 1;
  const isDenseMobileLayout = mobileRows.length >= 2;
  const mobileSlotHeightClass = isDuelMobileSlots
    ? "h-[148px] [@media(max-height:540px)]:h-[134px]"
    : isSingleRowMobileSlots
      ? "h-[142px] [@media(max-height:540px)]:h-[128px]"
      : "h-[128px] [@media(max-height:540px)]:h-[114px]";
  const mobileSlotWidthClass = isDuelMobileSlots
    ? "w-[82vw] min-w-[15rem] max-w-[19rem]"
    : isSingleRowMobileSlots
      ? "w-[68vw] min-w-[13rem] max-w-[17rem]"
      : "w-[70vw] min-w-[12.5rem] max-w-[16.5rem]";
  const mobileArtSizeClass = isDuelMobileSlots
    ? "h-[62px] w-[62px] [@media(max-height:540px)]:h-[56px] [@media(max-height:540px)]:w-[56px]"
    : isSingleRowMobileSlots
      ? "h-[64px] w-[64px] [@media(max-height:540px)]:h-[56px] [@media(max-height:540px)]:w-[56px]"
      : "h-[52px] w-[52px] [@media(max-height:540px)]:h-[46px] [@media(max-height:540px)]:w-[46px]";

  return (
    <div className="w-full lg:hidden">
      <div
        className={cn(
          "flex flex-col",
          isDenseMobileLayout ? "gap-2.5" : "gap-2"
        )}
      >
        {mobileRows.map((row, rowIndex) => (
          <div
            key={`mobile-row-${rowIndex}`}
            data-mobile-row={row.length}
            data-mobile-rail={
              row.some((entry) => entry.type === "enemy") ? "enemy" : "friendly"
            }
            className="space-y-1.5"
          >
            <div className="flex items-center justify-between px-1">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400/80">
                {row.some((entry) => entry.type === "enemy")
                  ? t("combat.enemy", { defaultValue: "Ennemis" })
                  : combat.allies.length > 0
                    ? `${t("combat.ally", { defaultValue: "Allie" })} + ${t(
                        "combat.player",
                        {
                          defaultValue: "Joueur",
                        }
                      )}`
                    : t("combat.player", { defaultValue: "Joueur" })}
              </p>
              <span className="text-[10px] font-semibold text-slate-500">
                {row.length}
              </span>
            </div>
            <div className="flex gap-2 overflow-x-auto overflow-y-visible pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {row.map((entry, index) => {
                const slotIndex =
                  mobileRows
                    .slice(0, rowIndex)
                    .reduce(
                      (total, currentRow) => total + currentRow.length,
                      0
                    ) + index;
                if (entry.type === "ally") {
                  const ally = entry.ally;
                  const def = allyDefs.get(ally.definitionId);
                  const intent = def?.abilities[ally.intentIndex];
                  const localizedAllyName = localizeAllyName(
                    ally.definitionId,
                    ally.name
                  );
                  const canTarget =
                    (selectingAllyTarget || selfCanRetargetToAlly) &&
                    ally.currentHp > 0 &&
                    !actingEnemyId;
                  const isDead = ally.currentHp <= 0;
                  const allyIntentSummary = intent
                    ? formatAllyIntent(intent, t)
                    : t("combat.noAbility", { defaultValue: "Aucune action" });

                  return (
                    <button
                      key={`mobile-ally-${ally.instanceId}`}
                      type="button"
                      data-keep-selection="true"
                      onClick={() => onMobileAllyPress(ally.instanceId)}
                      className={cn(
                        "relative shrink-0 overflow-hidden border text-left shadow-[0_18px_36px_rgba(2,6,23,0.34)] transition-all duration-200",
                        isDenseMobileLayout
                          ? "rounded-[18px] px-2 py-1.5"
                          : "rounded-[22px] px-2.5 py-2",
                        mobileSlotWidthClass,
                        mobileSlotHeightClass,
                        isDead
                          ? "border-slate-800/80 bg-slate-950/70 opacity-45 grayscale"
                          : "border-cyan-500/45 bg-[linear-gradient(180deg,rgba(8,145,178,0.22),rgba(2,6,23,0.88))]",
                        canTarget &&
                          "border-cyan-300 shadow-[0_0_22px_rgba(34,211,238,0.3)] ring-2 ring-cyan-300/70"
                      )}
                    >
                      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_55%)]" />
                      <div className="bg-white/12 pointer-events-none absolute inset-x-0 top-0 h-px" />

                      <div className="relative flex h-full flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-200/65">
                              {t("combat.ally", { defaultValue: "Allie" })}
                            </p>
                            <p className="truncate text-[13px] font-black text-cyan-50">
                              {localizedAllyName}
                            </p>
                          </div>
                          <MobileValuePill
                            label="ARM"
                            value={Math.max(0, ally.block)}
                            className={
                              ally.block > 0
                                ? "border-cyan-400/30 bg-cyan-950/80 text-cyan-100"
                                : "border-slate-700/70 bg-slate-900/70 text-slate-400"
                            }
                            highlight={isArmorTutorialStep}
                          />
                        </div>

                        <div
                          className={cn(
                            "flex min-h-0 flex-1 gap-2",
                            isDenseMobileLayout ? "mt-1.5" : "mt-2"
                          )}
                        >
                          <div
                            className={cn(
                              "relative shrink-0 overflow-hidden rounded-[18px] border border-cyan-400/15 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1),transparent_55%),linear-gradient(180deg,rgba(8,145,178,0.28),rgba(8,47,73,0.72))]",
                              mobileArtSizeClass
                            )}
                          >
                            <div className="flex h-full w-full items-center justify-center text-lg font-black uppercase tracking-[0.18em] text-cyan-50/90">
                              {getMonogram(localizedAllyName, "AL")}
                            </div>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex min-h-[20px] flex-wrap gap-1 overflow-hidden">
                              {renderCompactBuffs(ally.buffs)}
                            </div>

                            <div
                              className={cn(
                                "rounded-2xl border border-cyan-400/15 bg-black/20 px-2",
                                isDenseMobileLayout
                                  ? "mt-1 py-1.5"
                                  : "mt-1.5 py-2"
                              )}
                            >
                              <p
                                className="text-[10px] font-semibold leading-tight text-cyan-100/85"
                                style={{
                                  display: "-webkit-box",
                                  WebkitBoxOrient: "vertical",
                                  WebkitLineClamp: 2,
                                  overflow: "hidden",
                                }}
                              >
                                {isDead ? "KO" : allyIntentSummary}
                              </p>
                              <HpBar
                                current={Math.max(0, ally.currentHp)}
                                max={ally.maxHp}
                                showText={false}
                                color="green"
                                className="mt-2 h-1.5 rounded-full bg-slate-800"
                              />
                              <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] font-semibold text-slate-200">
                                <span className="tabular-nums">
                                  {Math.max(0, ally.currentHp)}/{ally.maxHp}
                                </span>
                                {isDead && (
                                  <span className="rounded-full border border-slate-700/80 bg-slate-900/80 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-slate-300">
                                    KO
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                }

                if (entry.type === "player") {
                  return (
                    <button
                      key={`mobile-player-${slotIndex}`}
                      type="button"
                      data-keep-selection="true"
                      onClick={onOpenPlayerInfo}
                      className={cn(
                        "relative shrink-0 overflow-hidden border text-left shadow-[0_18px_36px_rgba(2,6,23,0.36)] transition-all duration-200",
                        isDenseMobileLayout
                          ? "rounded-[18px] px-2 py-1.5"
                          : "rounded-[22px] px-2.5 py-2",
                        mobileSlotWidthClass,
                        mobileSlotHeightClass,
                        playerHit
                          ? "border-red-400 bg-[linear-gradient(180deg,rgba(127,29,29,0.2),rgba(30,41,59,0.92))] shadow-[0_0_24px_rgba(248,113,113,0.35)]"
                          : "border-indigo-400/45 bg-[linear-gradient(180deg,rgba(79,70,229,0.22),rgba(15,23,42,0.92))]",
                        isArmorTutorialStep &&
                          "ring-1 ring-cyan-300/75 ring-offset-1 ring-offset-slate-950"
                      )}
                    >
                      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(129,140,248,0.16),transparent_58%)]" />
                      <div className="bg-white/12 pointer-events-none absolute inset-x-0 top-0 h-px" />

                      <div className="relative flex h-full flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-indigo-200/65">
                              {t("combat.player")}
                            </p>
                            <p className="truncate text-[13px] font-black text-indigo-50">
                              {t("combat.player")}
                            </p>
                          </div>
                          <div className="flex flex-wrap justify-end gap-1">
                            <MobileValuePill
                              label={t("combat.energyShort", {
                                defaultValue: "EN",
                              })}
                              value={combat.player.energyCurrent}
                              className="border-amber-400/30 bg-amber-950/75 text-amber-100"
                            />
                            <MobileValuePill
                              label="INK"
                              value={combat.player.inkCurrent}
                              className="border-cyan-400/30 bg-cyan-950/75 text-cyan-100"
                            />
                            <MobileValuePill
                              label="ARM"
                              value={Math.max(0, combat.player.block)}
                              className={
                                combat.player.block > 0
                                  ? "border-cyan-400/30 bg-cyan-950/80 text-cyan-100"
                                  : "border-slate-700/70 bg-slate-900/70 text-slate-400"
                              }
                              highlight={isArmorTutorialStep}
                            />
                          </div>
                        </div>

                        <div
                          className={cn(
                            "flex min-h-0 flex-1 gap-2",
                            isDenseMobileLayout ? "mt-1.5" : "mt-2"
                          )}
                        >
                          <div
                            className={cn(
                              "relative shrink-0 overflow-hidden rounded-[18px] border border-indigo-300/20 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.12),transparent_52%),linear-gradient(180deg,rgba(99,102,241,0.2),rgba(30,41,59,0.82))]",
                              mobileArtSizeClass
                            )}
                          >
                            {!avatarFailed ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={PLAYER_AVATAR}
                                alt={t("combat.player")}
                                className="h-full w-full object-contain p-1.5"
                                onError={onAvatarError}
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-lg font-black uppercase tracking-[0.18em] text-indigo-50/90">
                                J
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex min-h-[20px] flex-wrap gap-1 overflow-hidden">
                              {renderCompactStatusMarkersForPlayer(
                                playerStatusMarkers
                              )}
                            </div>

                            <div
                              className={cn(
                                "rounded-2xl border border-indigo-300/15 bg-black/20 px-2",
                                isDenseMobileLayout
                                  ? "mt-1 py-1.5"
                                  : "mt-1.5 py-2"
                              )}
                            >
                              <HpBar
                                current={Math.max(0, combat.player.currentHp)}
                                max={combat.player.maxHp}
                                showText={false}
                                color="green"
                                className="h-1.5 rounded-full bg-slate-800"
                              />
                              <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] font-semibold text-slate-200">
                                <span className="tabular-nums">
                                  {Math.max(0, combat.player.currentHp)}/
                                  {combat.player.maxHp}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
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
                  enemy,
                  { playerHand: combat.hand }
                );
                const enemyIntentLabels = buildMobileEnemyIntentChips(
                  combat,
                  enemy,
                  resolvedTarget,
                  ability,
                  hideIntent,
                  t
                );
                const enemyStatusMarkers = buildEnemyStatusMarkers(enemy);
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
                const roleLabel = def.isBoss
                  ? t("enemyCard.boss")
                  : def.isElite
                    ? t("enemyCard.elite")
                    : t("combat.enemy", { defaultValue: "Ennemi" });

                return (
                  <button
                    key={`mobile-enemy-${enemy.instanceId}`}
                    type="button"
                    data-keep-selection="true"
                    onClick={() => onMobileEnemyPress(enemy.instanceId)}
                    className={cn(
                      "relative shrink-0 overflow-hidden border text-left shadow-[0_18px_36px_rgba(2,6,23,0.36)] transition-all duration-200",
                      isDenseMobileLayout
                        ? "rounded-[18px] px-2 py-1.5"
                        : "rounded-[22px] px-2.5 py-2",
                      mobileSlotWidthClass,
                      mobileSlotHeightClass,
                      isDead
                        ? "border-slate-800/80 bg-slate-950/70 opacity-45 grayscale"
                        : "border-rose-500/45 bg-[linear-gradient(180deg,rgba(159,18,57,0.22),rgba(15,23,42,0.92))]",
                      (isTargetable || isCheatSelectable) &&
                        "border-red-300 shadow-[0_0_24px_rgba(248,113,113,0.36)] ring-2 ring-red-300/70",
                      isActing && "animate-enemy-acting",
                      attackingEnemyId === enemy.instanceId &&
                        "animate-enemy-attack",
                      newlySummonedIds.has(enemy.instanceId) &&
                        "animate-enemy-summon-enter"
                    )}
                  >
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,113,133,0.15),transparent_56%)]" />
                    <div className="bg-white/12 pointer-events-none absolute inset-x-0 top-0 h-px" />

                    <div className="relative flex h-full flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-rose-200/65">
                            {roleLabel}
                          </p>
                          <p className="truncate text-[13px] font-black text-rose-50">
                            {getEnemyDisplayName(enemy)}
                          </p>
                        </div>
                        <MobileValuePill
                          label="ARM"
                          value={Math.max(0, enemy.block)}
                          className={
                            enemy.block > 0
                              ? "border-cyan-400/30 bg-cyan-950/80 text-cyan-100"
                              : "border-slate-700/70 bg-slate-900/70 text-slate-400"
                          }
                          highlight={isArmorTutorialStep}
                        />
                      </div>

                      <div
                        className={cn(
                          "flex min-h-0 flex-1 gap-2",
                          isDenseMobileLayout ? "mt-1.5" : "mt-2"
                        )}
                      >
                        <div
                          className={cn(
                            "relative shrink-0 overflow-hidden rounded-[18px] border border-rose-400/15 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1),transparent_52%),linear-gradient(180deg,rgba(190,24,93,0.18),rgba(15,23,42,0.84))]",
                            mobileArtSizeClass
                          )}
                        >
                          {!enemyArtFailed ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={enemyArtSrc}
                              alt={getEnemyDisplayName(enemy)}
                              className="h-full w-full object-contain object-center p-1.5"
                              onError={() =>
                                markEnemyArtFailure(enemy.definitionId)
                              }
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-lg font-black uppercase tracking-[0.18em] text-rose-50/90">
                              {getMonogram(getEnemyDisplayName(enemy), "EN")}
                            </div>
                          )}
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/45 to-transparent" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex min-h-[20px] flex-wrap gap-1 overflow-hidden">
                            {renderCompactEnemyStatusMarkers(
                              enemyStatusMarkers
                            )}
                          </div>

                          <MobileIntentPreview
                            labels={
                              isDead
                                ? ["KO"]
                                : enemyIntentLabels.length > 0
                                  ? enemyIntentLabels
                                  : ["-"]
                            }
                            className="border-rose-400/18 bg-black/20 text-rose-50"
                            maxVisible={2}
                          />

                          <div
                            className={cn(
                              "rounded-2xl border border-rose-400/15 bg-black/20 px-2",
                              isDenseMobileLayout
                                ? "mt-1 py-1.5"
                                : "mt-1.5 py-2"
                            )}
                          >
                            <HpBar
                              current={Math.max(0, enemy.currentHp)}
                              max={enemy.maxHp}
                              showText={false}
                              className="h-1.5 rounded-full bg-slate-800"
                            />
                            <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] font-semibold text-slate-200">
                              <span className="tabular-nums">
                                {Math.max(0, enemy.currentHp)}/{enemy.maxHp}
                              </span>
                              {isDead && (
                                <span className="rounded-full border border-slate-700/80 bg-slate-900/80 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-slate-300">
                                  KO
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

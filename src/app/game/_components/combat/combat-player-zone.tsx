"use client";

import type { RefObject } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils/cn";
import type { CombatState } from "@/game/schemas/combat-state";
import type { CardDefinition } from "@/game/schemas/cards";
import type { InkPowerType } from "@/game/schemas/enums";
import type {
  UsableItemDefinition,
  UsableItemInstance,
} from "@/game/schemas/items";
import {
  localizeUsableItemDescription,
  localizeUsableItemName,
} from "@/lib/i18n/entity-text";
import { HandArea } from "./HandArea";
import { InkGauge } from "./InkGauge";
import { EnergyOrb } from "../shared/EnergyOrb";
import { Tooltip } from "../shared/Tooltip";
import { RogueButton } from "@/components/ui/rogue";

interface CombatPlayerZoneProps {
  combat: CombatState;
  cardDefs: Map<string, CardDefinition>;
  selectedCardId: string | null;
  pendingInked: boolean;
  onPlayCard: (instanceId: string, useInked: boolean) => void;
  isDiscarding: boolean;
  playingCardId: string | null;
  drawBtnRef: RefObject<HTMLButtonElement | null>;
  discardBtnRef: RefObject<HTMLButtonElement | null>;
  enemyRowRef: RefObject<HTMLDivElement | null>;
  isInkTutorialStep: boolean;
  isInkPowersTutorialStep: boolean;
  isEnergyTutorialStep: boolean;
  isCardsTutorialStep: boolean;
  isEndTurnTutorialStep: boolean;
  isDeckCycleTutorialStep: boolean;
  reshuffleFx: boolean;
  unlockedInkPowers?: InkPowerType[];
  onUseInkPower: (power: InkPowerType) => void;
  onOpenDrawPile: () => void;
  onOpenDiscardPile: () => void;
  onOpenExhaustPile: () => void;
  usableItems: UsableItemInstance[];
  usableItemDefs: Map<string, UsableItemDefinition>;
  selectedUsableItemId: string | null;
  canAct: boolean;
  onUseItemClick: (itemInstanceId: string) => void;
  onEndTurn: () => void;
  endTurnClass: string;
  showCheatKillButton: boolean;
  isSelectingCheatKillTarget: boolean;
  onToggleCheatKill: () => void;
}

export function CombatPlayerZone({
  combat,
  cardDefs,
  selectedCardId,
  pendingInked,
  onPlayCard,
  isDiscarding,
  playingCardId,
  drawBtnRef,
  discardBtnRef,
  enemyRowRef,
  isInkTutorialStep,
  isInkPowersTutorialStep,
  isEnergyTutorialStep,
  isCardsTutorialStep,
  isEndTurnTutorialStep,
  isDeckCycleTutorialStep,
  reshuffleFx,
  unlockedInkPowers,
  onUseInkPower,
  onOpenDrawPile,
  onOpenDiscardPile,
  onOpenExhaustPile,
  usableItems,
  usableItemDefs,
  selectedUsableItemId,
  canAct,
  onUseItemClick,
  onEndTurn,
  endTurnClass,
  showCheatKillButton,
  isSelectingCheatKillTarget,
  onToggleCheatKill,
}: CombatPlayerZoneProps) {
  const { t } = useTranslation();

  return (
    <div className="relative z-20 shrink-0 border-t border-cyan-500/20 bg-slate-950/95 backdrop-blur-sm [@media(max-height:540px)]:border-t-slate-800/70">
      <div className="relative border-t border-cyan-500/10 px-2 pb-1 pt-1 lg:px-4 lg:pb-3 lg:pt-2.5 [@media(max-height:540px)]:px-1.5 [@media(max-height:540px)]:pb-0.5 [@media(max-height:540px)]:pt-0.5">
        <div className="flex items-start gap-2 lg:gap-4">
          <div
            className={cn(
              "hidden w-40 flex-shrink-0 flex-col gap-2 lg:flex",
              (isInkTutorialStep || isInkPowersTutorialStep) &&
                "rounded-2xl border border-cyan-400/60 bg-cyan-950/15 p-1"
            )}
          >
            <div
              className={cn(
                "rounded-xl border border-yellow-500/40 bg-gradient-to-b from-yellow-900/30 to-slate-900/80 p-2 shadow-[0_0_16px_rgba(250,204,21,0.12)]",
                isEnergyTutorialStep &&
                  "ring-2 ring-yellow-300/85 ring-offset-2 ring-offset-slate-950"
              )}
            >
              <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.16em] text-yellow-300/80">
                Energie
              </p>
              <EnergyOrb
                current={combat.player.energyCurrent}
                max={combat.player.energyMax}
                className="h-12 w-12 border-yellow-300 bg-yellow-950/80 text-sm text-yellow-200"
              />
            </div>

            <div
              className={cn(
                "rounded-xl",
                isInkTutorialStep &&
                  "ring-2 ring-cyan-300/85 ring-offset-2 ring-offset-slate-950",
                isInkPowersTutorialStep &&
                  "ring-2 ring-violet-300/85 ring-offset-2 ring-offset-slate-950"
              )}
            >
              <InkGauge
                player={combat.player}
                combatState={combat}
                onUsePower={onUseInkPower}
                unlockedPowers={unlockedInkPowers}
              />
            </div>

            <button
              ref={drawBtnRef}
              style={{
                boxShadow: "2px 2px 0 1px #334155, 4px 4px 0 1px #1e293b",
              }}
              className={cn(
                "flex h-12 flex-col items-center justify-center gap-0.5 rounded-lg border border-slate-500/70 bg-slate-800 transition hover:border-slate-300",
                isDeckCycleTutorialStep &&
                  "ring-2 ring-indigo-300/85 ring-offset-2 ring-offset-slate-950",
                reshuffleFx &&
                  "animate-pulse border-cyan-300 shadow-[0_0_22px_rgba(34,211,238,0.45)]"
              )}
              onClick={onOpenDrawPile}
              type="button"
            >
              <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                {t("combat.draw")}
              </span>
              <span className="text-xl font-black text-slate-100">
                {combat.drawPile.length}
              </span>
            </button>

            {reshuffleFx && (
              <div className="pointer-events-none flex animate-bounce items-center justify-center text-lg font-black text-cyan-300">
                ?
              </div>
            )}
          </div>

          <div
            className={cn(
              "min-w-0 flex-1",
              isCardsTutorialStep &&
                "rounded-2xl border border-cyan-300/65 bg-cyan-950/10 p-1 ring-2 ring-cyan-300/85 ring-offset-2 ring-offset-slate-950"
            )}
          >
            <HandArea
              hand={combat.hand}
              combatState={combat}
              cardDefs={cardDefs}
              selectedCardId={selectedCardId}
              pendingInked={pendingInked}
              onPlayCard={onPlayCard}
              isDiscarding={isDiscarding}
              discardBtnRef={discardBtnRef}
              playingCardId={playingCardId}
              enemyRowRef={enemyRowRef}
            />
          </div>

          <div className="hidden w-56 flex-shrink-0 flex-col gap-2 lg:flex">
            <div className="rounded-xl border border-amber-500/40 bg-gradient-to-b from-amber-900/30 to-slate-900/80 px-2 py-1.5 shadow-[0_0_16px_rgba(251,191,36,0.15)]">
              <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.16em] text-amber-300/80">
                Inventaire
              </p>
              <div data-keep-selection="true" className="flex flex-wrap gap-1">
                {usableItems.length === 0 ? (
                  <div className="h-9 w-full rounded-lg border border-amber-900/60 bg-slate-900/70 px-2 py-2 text-[9px] font-semibold uppercase tracking-wide text-amber-200/60">
                    Vide
                  </div>
                ) : (
                  usableItems.map((item) => {
                    const def = usableItemDefs.get(item.definitionId);
                    if (!def) return null;
                    const isSelected = selectedUsableItemId === item.instanceId;
                    return (
                      <Tooltip
                        key={item.instanceId}
                        content={localizeUsableItemDescription(
                          def.id,
                          def.description
                        )}
                      >
                        <RogueButton
                          type="text"
                          onClick={() => onUseItemClick(item.instanceId)}
                          className={cn(
                            "!h-9 !min-w-24 !rounded-lg !border !px-2 !text-[9px] !font-semibold !uppercase !tracking-wide !transition",
                            isSelected
                              ? "!border-amber-300 !bg-amber-700/50 !text-amber-50"
                              : "!border-amber-700/70 !bg-slate-900/80 !text-amber-200 hover:!border-amber-400 hover:!bg-amber-950/60",
                            !canAct && "!cursor-not-allowed !opacity-50"
                          )}
                          disabled={!canAct}
                        >
                          {localizeUsableItemName(def.id, def.name)}
                        </RogueButton>
                      </Tooltip>
                    );
                  })
                )}
              </div>
            </div>

            <RogueButton
              type="text"
              className={cn(
                "!h-12 !rounded-lg !px-3 !py-2 !text-[10px] !font-black !uppercase !tracking-wide !transition-all lg:!text-sm",
                isEndTurnTutorialStep &&
                  "!ring-2 !ring-emerald-300/85 !ring-offset-2 !ring-offset-slate-950",
                endTurnClass
              )}
              disabled={!canAct}
              onClick={onEndTurn}
            >
              {t("combat.endTurn")}
            </RogueButton>

            <button
              ref={discardBtnRef}
              style={{
                boxShadow: "2px 2px 0 1px #7f1d1d, 4px 4px 0 1px #450a0a",
              }}
              className={cn(
                "flex h-12 flex-col items-center justify-center gap-0.5 rounded-lg border border-red-700/60 bg-slate-800 transition hover:border-red-400",
                isDeckCycleTutorialStep &&
                  "ring-2 ring-indigo-300/85 ring-offset-2 ring-offset-slate-950",
                reshuffleFx &&
                  "animate-pulse border-cyan-300 shadow-[0_0_22px_rgba(34,211,238,0.45)]"
              )}
              onClick={onOpenDiscardPile}
              type="button"
            >
              <span className="text-[9px] font-semibold uppercase tracking-wider text-red-400/80">
                Defausse
              </span>
              <span className="text-xl font-black text-slate-100">
                {combat.discardPile.length}
              </span>
            </button>

            {combat.exhaustPile.length > 0 && (
              <RogueButton
                type="text"
                style={{
                  boxShadow: "2px 2px 0 1px #4c1d95, 4px 4px 0 1px #2e1065",
                }}
                className={cn(
                  "!flex !h-12 !flex-col !items-center !justify-center !gap-0.5 !rounded-lg !border !border-purple-700/60 !bg-slate-800 !transition hover:!border-purple-400",
                  isDeckCycleTutorialStep &&
                    "!ring-2 !ring-indigo-300/85 !ring-offset-2 !ring-offset-slate-950"
                )}
                onClick={onOpenExhaustPile}
              >
                <span className="text-[9px] font-semibold uppercase tracking-wider text-purple-400/80">
                  Epuise
                </span>
                <span className="text-xl font-black text-slate-100">
                  {combat.exhaustPile.length}
                </span>
              </RogueButton>
            )}

            {showCheatKillButton && (
              <RogueButton
                type="text"
                className={cn(
                  "!h-auto !rounded-lg !border !px-2 !py-1.5 !text-[10px] !font-bold !uppercase !tracking-wide !transition-all lg:!px-3 lg:!py-2 lg:!text-xs",
                  isSelectingCheatKillTarget
                    ? "!border-rose-500 !bg-rose-900/60 !text-rose-200"
                    : "!border-rose-700 !bg-rose-950/60 !text-rose-300 hover:!border-rose-500"
                )}
                onClick={onToggleCheatKill}
              >
                {isSelectingCheatKillTarget
                  ? t("combat.cancelKill")
                  : t("combat.devKill")}
              </RogueButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

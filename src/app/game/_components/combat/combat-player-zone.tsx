"use client";

import type { RefObject } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils/cn";
import type { CombatState } from "@/game/schemas/combat-state";
import type { CardDefinition } from "@/game/schemas/cards";
import type { InkPowerType, BiomeType } from "@/game/schemas/enums";
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
import { getCombatBiomeTheme } from "./combat-biome-theme";

interface CombatPlayerZoneProps {
  combat: CombatState;
  cardDefs: Map<string, CardDefinition>;
  biome: BiomeType;
  selectedCardId: string | null;
  pendingInked: boolean;
  attackBonus?: number;
  onPlayCard: (instanceId: string, useInked: boolean) => void;
  onDoublePlayCard: (instanceId: string, useInked: boolean) => void;
  isDiscarding: boolean;
  playingCardId: string | null;
  drawBtnRef: RefObject<HTMLButtonElement | null>;
  discardBtnRef: RefObject<HTMLButtonElement | null>;
  enemyRowRef: RefObject<HTMLDivElement | null>;
  isInkTutorialStep: boolean;
  isInkPowersTutorialStep: boolean;
  isInkedCardTutorialStep: boolean;
  isEnergyTutorialStep: boolean;
  isCardsTutorialStep: boolean;
  isEndTurnTutorialStep: boolean;
  isDeckCycleTutorialStep: boolean;
  reshuffleFx: boolean;
  unlockedInkPowers?: InkPowerType[];
  allowedInkPowers?: InkPowerType[] | null;
  onUseInkPower: (power: InkPowerType) => void;
  onOpenDrawPile: () => void;
  onOpenDiscardPile: () => void;
  onOpenExhaustPile: () => void;
  usableItems: UsableItemInstance[];
  usableItemDefs: Map<string, UsableItemDefinition>;
  selectedUsableItemId: string | null;
  disableCardInteractions?: boolean;
  tutorialPlayableInkedCardId?: string | null;
  canUseItems: boolean;
  canEndTurn: boolean;
  onUseItemClick: (itemInstanceId: string) => void;
  onEndTurn: () => void;
  showCheatKillButton: boolean;
  isSelectingCheatKillTarget: boolean;
  onToggleCheatKill: () => void;
}

export function CombatPlayerZone({
  combat,
  cardDefs,
  biome,
  selectedCardId,
  pendingInked,
  attackBonus = 0,
  onPlayCard,
  onDoublePlayCard,
  isDiscarding,
  playingCardId,
  drawBtnRef,
  discardBtnRef,
  enemyRowRef,
  isInkTutorialStep,
  isInkPowersTutorialStep,
  isInkedCardTutorialStep,
  isEnergyTutorialStep,
  isCardsTutorialStep,
  isEndTurnTutorialStep,
  isDeckCycleTutorialStep,
  reshuffleFx,
  unlockedInkPowers,
  allowedInkPowers = null,
  onUseInkPower,
  onOpenDrawPile,
  onOpenDiscardPile,
  onOpenExhaustPile,
  usableItems,
  usableItemDefs,
  selectedUsableItemId,
  disableCardInteractions = false,
  tutorialPlayableInkedCardId = null,
  canUseItems,
  canEndTurn,
  onUseItemClick,
  onEndTurn,
  showCheatKillButton,
  isSelectingCheatKillTarget,
  onToggleCheatKill,
}: CombatPlayerZoneProps) {
  const { t } = useTranslation();
  const theme = getCombatBiomeTheme(biome);
  const endTurnClass = canEndTurn
    ? theme.endTurnReady
    : theme.endTurnDisabled;

  return (
    <div
      className={cn(
        "relative z-20 shrink-0 backdrop-blur-sm [@media(max-height:540px)]:border-t-slate-800/70",
        theme.playerZoneShell
      )}
    >
      <div
        className={cn(
          "relative border-t px-1.5 pb-0.75 pt-0.75 lg:px-4 lg:pb-3 lg:pt-2.5 [@media(max-height:540px)]:px-1.25 [@media(max-height:540px)]:pb-0.5 [@media(max-height:540px)]:pt-0.5",
          theme.playerZoneRule
        )}
      >
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
                "rounded-xl p-2",
                theme.sidePanelShell,
                isEnergyTutorialStep &&
                  "ring-2 ring-yellow-300/85 ring-offset-2 ring-offset-slate-950"
              )}
            >
              <p
                className={cn(
                  "mb-1 text-[9px] font-bold uppercase tracking-[0.16em]",
                  theme.sidePanelTitle
                )}
              >
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
                allowedPowers={allowedInkPowers}
                shellClassName={theme.inkGaugeShell}
                labelClassName={theme.inkGaugeLabel}
                fillClassName={theme.inkGaugeFill}
                readyPowerClassName={theme.inkPowerReady}
              />
            </div>

            <button
              ref={drawBtnRef}
              className={cn(
                "flex h-12 flex-col items-center justify-center gap-0.5 rounded-lg border transition",
                theme.pileButton,
                isDeckCycleTutorialStep &&
                  "ring-2 ring-indigo-300/85 ring-offset-2 ring-offset-slate-950",
                reshuffleFx &&
                  "animate-pulse border-cyan-300 shadow-[0_0_22px_rgba(34,211,238,0.45)]"
              )}
              onClick={onOpenDrawPile}
              type="button"
            >
              <span
                className={cn(
                  "text-[9px] font-semibold uppercase tracking-wider",
                  theme.sidePanelTitle
                )}
              >
                {t("combat.draw")}
              </span>
              <span className={cn("text-xl font-black", theme.pileButtonValue)}>
                {combat.drawPile.length}
              </span>
            </button>

            {reshuffleFx && (
              <div className="pointer-events-none flex animate-bounce items-center justify-center">
                <span className="rounded-full border border-cyan-300/45 bg-cyan-950/85 px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.18)]">
                  {t("combat.reshuffle", { defaultValue: "Melange" })}
                </span>
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
              attackBonus={attackBonus}
              onPlayCard={onPlayCard}
              onDoublePlayCard={onDoublePlayCard}
              disableCardInteractions={disableCardInteractions}
              tutorialPlayableInkedCardId={tutorialPlayableInkedCardId}
              isDiscarding={isDiscarding}
              discardBtnRef={discardBtnRef}
              playingCardId={playingCardId}
              enemyRowRef={enemyRowRef}
            />
          </div>

          <div className="hidden w-56 flex-shrink-0 flex-col gap-2 lg:flex">
            <div className={cn("rounded-xl px-2 py-1.5", theme.sidePanelShell)}>
              <p
                className={cn(
                  "mb-1 text-[9px] font-bold uppercase tracking-[0.16em]",
                  theme.sidePanelTitle
                )}
              >
                Inventaire
              </p>
              <div data-keep-selection="true" className="flex flex-wrap gap-1">
                {usableItems.length === 0 ? (
                  <div
                    className={cn(
                      "h-9 w-full rounded-lg border px-2 py-2 text-[9px] font-semibold uppercase tracking-wide",
                      theme.inventoryButton
                    )}
                  >
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
                              ? theme.inventoryButtonSelected
                              : theme.inventoryButton,
                            !canUseItems && "!cursor-not-allowed !opacity-50"
                          )}
                          disabled={!canUseItems}
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
                isInkedCardTutorialStep &&
                  "!opacity-60 !ring-1 !ring-slate-700 !ring-offset-2 !ring-offset-slate-950",
                endTurnClass
              )}
              disabled={!canEndTurn}
              onClick={onEndTurn}
            >
              {t("combat.endTurn")}
            </RogueButton>

            <button
              ref={discardBtnRef}
              className={cn(
                "flex h-12 flex-col items-center justify-center gap-0.5 rounded-lg border transition",
                theme.pileButton,
                isDeckCycleTutorialStep &&
                  "ring-2 ring-indigo-300/85 ring-offset-2 ring-offset-slate-950",
                reshuffleFx &&
                  "animate-pulse border-cyan-300 shadow-[0_0_22px_rgba(34,211,238,0.45)]"
              )}
              onClick={onOpenDiscardPile}
              type="button"
            >
              <span
                className={cn(
                  "text-[9px] font-semibold uppercase tracking-wider",
                  theme.sidePanelTitle
                )}
              >
                Defausse
              </span>
              <span className={cn("text-xl font-black", theme.pileButtonValue)}>
                {combat.discardPile.length}
              </span>
            </button>

            {combat.exhaustPile.length > 0 && (
              <RogueButton
                type="text"
                className={cn(
                  "!flex !h-12 !flex-col !items-center !justify-center !gap-0.5 !rounded-lg !border !transition",
                  theme.pileButton,
                  isDeckCycleTutorialStep &&
                    "!ring-2 !ring-indigo-300/85 !ring-offset-2 !ring-offset-slate-950"
                )}
                onClick={onOpenExhaustPile}
              >
                <span
                  className={cn(
                    "text-[9px] font-semibold uppercase tracking-wider",
                    theme.sidePanelTitle
                  )}
                >
                  Epuise
                </span>
                <span className={cn("text-xl font-black", theme.pileButtonValue)}>
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

"use client";

import { useRef, useLayoutEffect, useMemo, useState, useEffect } from "react";
import type { PointerEvent as ReactPointerEvent, RefObject } from "react";
import type { CardInstance, CardDefinition } from "@/game/schemas/cards";
import type { CombatState } from "@/game/schemas/combat-state";
import { canPlayCard, canPlayCardInked } from "@/game/engine/cards";
import {
  getArchivistCardCostModifier,
  getArchivistEffectiveCardDefinition,
  getArchivistEffectiveUpgradeState,
} from "@/game/engine/archivist";
import { GameCard } from "./GameCard";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils/cn";
import { localizeCardName } from "@/lib/i18n/card-text";

interface HandAreaProps {
  hand: CardInstance[];
  combatState: CombatState;
  cardDefs: Map<string, CardDefinition>;
  selectedCardId: string | null;
  pendingInked: boolean;
  attackBonus?: number;
  onPlayCard: (instanceId: string, useInked: boolean) => void;
  onDoublePlayCard?: (instanceId: string, useInked: boolean) => void;
  disableCardInteractions?: boolean;
  tutorialPlayableInkedCardId?: string | null;
  isDiscarding?: boolean;
  discardBtnRef?: RefObject<HTMLButtonElement | null>;
  playingCardId?: string | null;
  enemyRowRef?: RefObject<HTMLDivElement | null>;
}

const MOBILE_HAND_STYLES: Record<
  CardDefinition["type"],
  {
    border: string;
    shell: string;
    inkButton: string;
    inkButtonDisabled: string;
  }
> = {
  ATTACK: {
    border: "border-red-500/75",
    shell: "from-[#2b0f15] via-[#14090d] to-[#09070a]",
    inkButton:
      "border-cyan-300/40 bg-gradient-to-r from-cyan-900/70 to-red-950/65 text-cyan-50",
    inkButtonDisabled: "border-red-500/20 bg-red-950/35 text-red-100/70",
  },
  SKILL: {
    border: "border-sky-500/75",
    shell: "from-[#0c1b2a] via-[#08111b] to-[#07090d]",
    inkButton:
      "border-cyan-300/40 bg-gradient-to-r from-cyan-900/70 to-sky-950/65 text-cyan-50",
    inkButtonDisabled: "border-sky-500/20 bg-sky-950/35 text-sky-100/70",
  },
  POWER: {
    border: "border-violet-500/75",
    shell: "from-[#231233] via-[#100918] to-[#09070c]",
    inkButton:
      "border-cyan-300/40 bg-gradient-to-r from-cyan-900/70 to-violet-950/65 text-cyan-50",
    inkButtonDisabled:
      "border-violet-500/20 bg-violet-950/35 text-violet-100/70",
  },
  STATUS: {
    border: "border-slate-500/75",
    shell: "from-[#1f2732] via-[#0f141c] to-[#090a0e]",
    inkButton:
      "border-cyan-300/35 bg-gradient-to-r from-cyan-900/70 to-slate-900/65 text-cyan-50",
    inkButtonDisabled: "border-slate-500/20 bg-slate-900/35 text-slate-100/65",
  },
  CURSE: {
    border: "border-rose-600/75",
    shell: "from-[#2a101c] via-[#140911] to-[#09070b]",
    inkButton:
      "border-cyan-300/35 bg-gradient-to-r from-cyan-900/70 to-rose-950/65 text-cyan-50",
    inkButtonDisabled: "border-rose-500/20 bg-rose-950/35 text-rose-100/70",
  },
};

interface MobileHandCardProps {
  definition: CardDefinition;
  upgraded: boolean;
  costModifier: number;
  isSelected: boolean;
  isPendingInked: boolean;
  isFrozen: boolean;
  canPlay: boolean;
  canPlayInked: boolean;
  onOpenPreview: () => void;
  onPlay: () => void;
  onPlayInked: () => void;
}

const MOBILE_CARD_LONG_PRESS_MS = 420;
const MOBILE_CARD_LONG_PRESS_MOVE_TOLERANCE_PX = 12;

function getDisplayedCardState(
  combatState: CombatState,
  card: CardInstance,
  definition: CardDefinition
) {
  return {
    definition: getArchivistEffectiveCardDefinition(
      combatState,
      card.instanceId,
      definition
    ),
    upgraded: getArchivistEffectiveUpgradeState(
      combatState,
      card.instanceId,
      card.upgraded
    ),
    archivistCostModifier: getArchivistCardCostModifier(
      combatState,
      card.instanceId
    ),
  };
}

function MobileHandCard({
  definition,
  upgraded,
  costModifier,
  isSelected,
  isPendingInked,
  isFrozen,
  canPlay,
  canPlayInked,
  onOpenPreview,
  onPlay,
  onPlayInked,
}: MobileHandCardProps) {
  const { t } = useTranslation();
  const style = MOBILE_HAND_STYLES[definition.type];
  const localizedName = localizeCardName(definition, t);
  const displayedEnergyCost = Math.max(0, definition.energyCost + costModifier);
  const hasInkedVariant = Boolean(definition.inkedVariant);
  const inkMarkCost = definition.inkedVariant?.inkMarkCost ?? 0;
  const longPressTimeoutRef = useRef<number | null>(null);
  const longPressOriginRef = useRef<{ x: number; y: number } | null>(null);
  const suppressNextClickRef = useRef(false);
  const suppressInkedClickRef = useRef(false);

  const clearLongPress = () => {
    if (longPressTimeoutRef.current !== null) {
      window.clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
    longPressOriginRef.current = null;
  };

  useEffect(() => {
    return () => {
      if (longPressTimeoutRef.current !== null) {
        window.clearTimeout(longPressTimeoutRef.current);
        longPressTimeoutRef.current = null;
      }
      longPressOriginRef.current = null;
    };
  }, []);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse") return;

    const target = event.target as HTMLElement | null;
    if (target?.closest("button")) return;

    clearLongPress();
    suppressNextClickRef.current = false;
    longPressOriginRef.current = {
      x: event.clientX,
      y: event.clientY,
    };
    longPressTimeoutRef.current = window.setTimeout(() => {
      suppressNextClickRef.current = true;
      onOpenPreview();
      longPressTimeoutRef.current = null;
      longPressOriginRef.current = null;
    }, MOBILE_CARD_LONG_PRESS_MS);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (longPressTimeoutRef.current === null || !longPressOriginRef.current) {
      return;
    }

    const movedX = Math.abs(event.clientX - longPressOriginRef.current.x);
    const movedY = Math.abs(event.clientY - longPressOriginRef.current.y);
    if (
      movedX > MOBILE_CARD_LONG_PRESS_MOVE_TOLERANCE_PX ||
      movedY > MOBILE_CARD_LONG_PRESS_MOVE_TOLERANCE_PX
    ) {
      clearLongPress();
    }
  };

  const handlePointerEnd = () => {
    clearLongPress();
  };

  const triggerInkedPlay = () => {
    if (canPlayInked) onPlayInked();
  };

  return (
    <div
      data-keep-selection="true"
      onClick={() => {
        if (suppressNextClickRef.current) {
          suppressNextClickRef.current = false;
          return;
        }
        if (canPlay) onPlay();
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onPointerLeave={handlePointerEnd}
      className={cn(
        "bg-slate-950/96 relative flex h-[136px] w-[94px] shrink-0 cursor-pointer flex-col overflow-hidden rounded-[18px] border p-2 text-left shadow-[0_10px_18px_rgba(2,6,23,0.45)] transition-all duration-200 [@media(max-height:540px)]:h-[124px] [@media(max-height:540px)]:w-[86px]",
        style.border,
        isSelected &&
          (isPendingInked
            ? "shadow-[0_0_18px_rgba(34,211,238,0.24)] ring-2 ring-cyan-300/90 ring-offset-2 ring-offset-slate-950"
            : "ring-2 ring-amber-200/90 ring-offset-2 ring-offset-slate-950"),
        upgraded &&
          "shadow-[0_0_18px_rgba(251,191,36,0.24)] before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:bg-gradient-to-r before:from-amber-400 before:via-yellow-200 before:to-amber-400",
        isFrozen && "ring-2 ring-cyan-300/85"
      )}
    >
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-b opacity-95",
          style.shell
        )}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent_18%,transparent_82%,rgba(255,255,255,0.03))]" />

      <div className="relative z-10 flex h-full flex-col">
        <div className="pointer-events-none absolute left-1 top-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/30 text-[13px] font-black text-slate-50 shadow-[0_8px_18px_rgba(0,0,0,0.35)]">
          {displayedEnergyCost}
        </div>
        {upgraded && (
          <span className="bg-amber-300/24 pointer-events-none absolute right-1 top-1 rounded-full border border-amber-200/70 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-amber-50 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
            +
          </span>
        )}

        <div className="flex-1 px-0.5 pt-0.5">
          <p
            className={cn(
              "pl-8 pr-4 font-black leading-[1.02] text-slate-50 [text-wrap:balance]",
              hasInkedVariant ? "text-[13px]" : "text-[14px]"
            )}
            style={{
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: hasInkedVariant ? 3 : 4,
              overflow: "hidden",
            }}
          >
            {localizedName}
          </p>
          {isFrozen && (
            <span className="bg-cyan-300/12 mt-1.5 inline-flex rounded-full border border-cyan-200/45 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-[0.14em] text-cyan-50">
              Frozen
            </span>
          )}
          {!isFrozen && upgraded && (
            <div className="mt-1.5 h-1.5 w-9 rounded-full bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.26)]" />
          )}
          {!isFrozen && !upgraded && <div className="mt-1.5 h-1.5" />}
        </div>

        {hasInkedVariant ? (
          <button
            type="button"
            data-keep-selection="true"
            className={cn(
              "relative z-20 mt-1 flex h-9 touch-manipulation items-center justify-center gap-1.5 rounded-[11px] border px-2.5 text-[10px] font-black uppercase tracking-[0.08em] shadow-[0_10px_18px_rgba(2,6,23,0.24)]",
              canPlayInked ? style.inkButton : style.inkButtonDisabled,
              isPendingInked && "ring-1 ring-cyan-200/70"
            )}
            onPointerDown={(event) => {
              event.stopPropagation();
              suppressInkedClickRef.current = false;
            }}
            onPointerUp={(event) => {
              event.stopPropagation();
              suppressInkedClickRef.current = true;
              triggerInkedPlay();
            }}
            onPointerCancel={() => {
              suppressInkedClickRef.current = false;
            }}
            onClick={(event) => {
              event.stopPropagation();
              if (suppressInkedClickRef.current) {
                suppressInkedClickRef.current = false;
                return;
              }
              triggerInkedPlay();
            }}
          >
            <span>Encre</span>
            <span className="inline-flex min-w-[22px] items-center justify-center rounded-full border border-cyan-100/20 bg-black/20 px-1.5 py-0.5 text-[10px] leading-none text-cyan-50">
              {inkMarkCost}
            </span>
          </button>
        ) : (
          <div className="mt-2 h-9" />
        )}
      </div>
    </div>
  );
}

export function HandArea({
  hand,
  combatState,
  cardDefs,
  selectedCardId,
  pendingInked,
  attackBonus = 0,
  onPlayCard,
  onDoublePlayCard,
  disableCardInteractions = false,
  tutorialPlayableInkedCardId = null,
  isDiscarding = false,
  discardBtnRef,
  playingCardId = null,
  enemyRowRef,
}: HandAreaProps) {
  const { t } = useTranslation();
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [mobilePreviewCardId, setMobilePreviewCardId] = useState<string | null>(
    null
  );
  const hoveredIndex = useMemo(
    () => hand.findIndex((c) => c.instanceId === hoveredCardId),
    [hand, hoveredCardId]
  );
  const globalCostModifier = combatState.playerDisruption?.extraCardCost ?? 0;
  const desktopOverlapPx =
    hand.length <= 3
      ? 0
      : hand.length <= 5
        ? 66
        : hand.length <= 7
          ? 92
          : hand.length <= 9
            ? 110
            : 122;
  const desktopHoverSpreadPx = hand.length >= 8 ? 38 : 32;
  const mobileOverlapPx = hand.length <= 5 ? 14 : hand.length <= 7 ? 18 : 21;
  const mobileFanRotationDeg =
    hand.length <= 5 ? 1.4 : hand.length <= 7 ? 1.8 : 2.2;

  const wrapperRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mobilePreviewRef = useRef<HTMLDivElement | null>(null);
  const mobilePreviewCard = useMemo(
    () => hand.find((card) => card.instanceId === mobilePreviewCardId) ?? null,
    [hand, mobilePreviewCardId]
  );
  const mobilePreviewDef = mobilePreviewCard
    ? (cardDefs.get(mobilePreviewCard.definitionId) ?? null)
    : null;
  const mobilePreviewDisplay =
    mobilePreviewCard && mobilePreviewDef
      ? getDisplayedCardState(combatState, mobilePreviewCard, mobilePreviewDef)
      : null;
  const mobilePreviewCanInked = mobilePreviewCard
    ? canPlayCardInked(combatState, mobilePreviewCard.instanceId, cardDefs)
    : false;

  useEffect(() => {
    if (
      mobilePreviewCardId &&
      !hand.some((card) => card.instanceId === mobilePreviewCardId)
    ) {
      setMobilePreviewCardId(null);
    }
  }, [hand, mobilePreviewCardId]);

  useEffect(() => {
    if (!mobilePreviewCardId) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (mobilePreviewRef.current?.contains(target)) return;
      setMobilePreviewCardId(null);
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
    };
  }, [mobilePreviewCardId]);

  useLayoutEffect(() => {
    if (!isDiscarding || !discardBtnRef?.current) return;

    const discardRect = discardBtnRef.current.getBoundingClientRect();
    const discardCx = discardRect.left + discardRect.width / 2;
    const discardCy = discardRect.top + discardRect.height / 2;

    wrapperRefs.current.forEach((el) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cardCx = rect.left + rect.width / 2;
      const cardCy = rect.top + rect.height / 2;
      el.style.setProperty("--tx", `${discardCx - cardCx}px`);
      el.style.setProperty("--ty", `${discardCy - cardCy}px`);
    });
  }, [isDiscarding, discardBtnRef]);

  useLayoutEffect(() => {
    if (!playingCardId || !enemyRowRef?.current) return;

    const enemyRect = enemyRowRef.current.getBoundingClientRect();
    const enemyCx = enemyRect.left + enemyRect.width / 2;
    const enemyCy = enemyRect.top + enemyRect.height / 2;

    const idx = hand.findIndex((c) => c.instanceId === playingCardId);
    const el = wrapperRefs.current[idx];
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const cardCx = rect.left + rect.width / 2;
    const cardCy = rect.top + rect.height / 2;
    el.style.setProperty("--tx", `${enemyCx - cardCx}px`);
    el.style.setProperty("--ty", `${enemyCy - cardCy}px`);
  }, [playingCardId, enemyRowRef, hand]);

  return (
    <>
      <div
        data-keep-selection="true"
        className="relative z-30 w-full lg:hidden"
      >
        {mobilePreviewCard && mobilePreviewDef && (
          <div
            data-keep-selection="true"
            ref={mobilePreviewRef}
            className="fixed bottom-[3.75rem] left-1/2 z-[140] -translate-x-1/2 [@media(max-height:540px)]:bottom-[3.15rem]"
          >
            <GameCard
              definition={mobilePreviewDisplay?.definition ?? mobilePreviewDef}
              upgraded={
                mobilePreviewDisplay?.upgraded ?? mobilePreviewCard.upgraded
              }
              costModifier={
                globalCostModifier +
                (mobilePreviewDisplay?.archivistCostModifier ?? 0)
              }
              attackBonus={attackBonus}
              canPlay
              canPlayInked={mobilePreviewCanInked}
              isSelected={selectedCardId === mobilePreviewCard.instanceId}
              isPendingInked={
                selectedCardId === mobilePreviewCard.instanceId && pendingInked
              }
              onInkedClick={() =>
                onPlayCard(mobilePreviewCard.instanceId, true)
              }
              size="lg"
              className="!h-[288px] !w-[176px] !cursor-default !opacity-100 shadow-[0_26px_54px_rgba(2,6,23,0.82)] !saturate-100"
            />
            {(mobilePreviewDef.targeting === "SINGLE_ENEMY" ||
              mobilePreviewDef.targeting === "SINGLE_ALLY") && (
              <p className="mt-2 text-center text-[11px] font-semibold leading-tight text-slate-100">
                {t("combat.mobileCardPreviewTargetHint", {
                  defaultValue: "Choisis ensuite une cible.",
                })}
              </p>
            )}
          </div>
        )}
        <div className="flex h-[168px] w-full min-w-0 touch-pan-x items-end gap-0 overflow-x-auto overflow-y-hidden overscroll-x-contain px-1.5 pb-1 pr-1.5 [-webkit-overflow-scrolling:touch] [@media(max-height:540px)]:h-[154px]">
          <div className="mx-auto flex h-full w-max min-w-full items-end justify-center">
            {hand.map((card, index) => {
              const def = cardDefs.get(card.definitionId);
              if (!def) return null;
              const display = getDisplayedCardState(combatState, card, def);

              const canPlay = canPlayCard(
                combatState,
                card.instanceId,
                cardDefs
              );
              const canInked = canPlayCardInked(
                combatState,
                card.instanceId,
                cardDefs
              );
              const isTutorialPlayableInkedCard =
                tutorialPlayableInkedCardId === card.instanceId;
              const cardInteractionsBlocked =
                disableCardInteractions ||
                (tutorialPlayableInkedCardId !== null &&
                  !isTutorialPlayableInkedCard);
              const displayedCanPlay =
                tutorialPlayableInkedCardId !== null
                  ? false
                  : !cardInteractionsBlocked && canPlay;
              const displayedCanPlayInked =
                !cardInteractionsBlocked && canInked;
              const isFrozen = (
                combatState.playerDisruption?.frozenHandCardIds ?? []
              ).includes(card.instanceId);
              const isSelected = selectedCardId === card.instanceId;
              const fanOffset = index - (hand.length - 1) / 2;
              const fanRotateDeg = fanOffset * mobileFanRotationDeg;
              const fanLiftPx = Math.max(0, 3.5 - Math.abs(fanOffset) * 0.9);
              const selectedLiftPx = isSelected ? 9 : fanLiftPx;

              return (
                <div
                  key={`mobile-card-${card.instanceId}`}
                  className="relative shrink-0 origin-bottom snap-start transition-all duration-200 ease-out"
                  style={{
                    marginLeft: index === 0 ? 0 : -mobileOverlapPx,
                    transform: `translateY(-${selectedLiftPx}px) rotate(${fanRotateDeg}deg) scale(${isSelected ? 1.04 : 1})`,
                    zIndex: isSelected ? 90 : 30 + index,
                  }}
                >
                  <MobileHandCard
                    definition={display.definition}
                    upgraded={display.upgraded}
                    costModifier={
                      globalCostModifier + display.archivistCostModifier
                    }
                    isSelected={isSelected}
                    isPendingInked={isSelected && pendingInked}
                    isFrozen={isFrozen}
                    canPlay={displayedCanPlay}
                    canPlayInked={displayedCanPlayInked}
                    onOpenPreview={() => {
                      setMobilePreviewCardId(card.instanceId);
                    }}
                    onPlay={() => onPlayCard(card.instanceId, false)}
                    onPlayInked={() => onPlayCard(card.instanceId, true)}
                  />
                  {isTutorialPlayableInkedCard && (
                    <div className="pointer-events-none absolute inset-0 rounded-[18px] ring-2 ring-cyan-300/85 ring-offset-2 ring-offset-slate-950" />
                  )}
                </div>
              );
            })}

            {hand.length === 0 && (
              <p className="self-center text-xs text-gray-500">
                {t("combat.noCardsInHand")}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="hidden h-auto w-full items-end justify-center gap-0 overflow-visible px-2 pb-3 pt-2 lg:flex">
        {hand.map((card, index) => {
          const def = cardDefs.get(card.definitionId);
          if (!def) return null;
          const display = getDisplayedCardState(combatState, card, def);

          const canPlay = canPlayCard(combatState, card.instanceId, cardDefs);
          const canInked = canPlayCardInked(
            combatState,
            card.instanceId,
            cardDefs
          );
          const isTutorialPlayableInkedCard =
            tutorialPlayableInkedCardId === card.instanceId;
          const cardInteractionsBlocked =
            disableCardInteractions ||
            (tutorialPlayableInkedCardId !== null &&
              !isTutorialPlayableInkedCard);
          const displayedCanPlay =
            tutorialPlayableInkedCardId !== null
              ? false
              : !cardInteractionsBlocked && canPlay;
          const displayedCanPlayInked = !cardInteractionsBlocked && canInked;
          const isFrozen = (
            combatState.playerDisruption?.frozenHandCardIds ?? []
          ).includes(card.instanceId);

          const isPlaying = playingCardId === card.instanceId;
          const isSelected = selectedCardId === card.instanceId;
          const isHovered = hoveredCardId === card.instanceId;
          const fanOffset = index - (hand.length - 1) / 2;
          const baseFanRotateDeg = fanOffset * 3.2;
          const baseFanLiftPx = Math.max(0, 14 - Math.abs(fanOffset) * 2.6);
          const hoverShiftPx =
            hoveredIndex === -1 || isDiscarding || isPlaying
              ? 0
              : index < hoveredIndex
                ? -desktopHoverSpreadPx
                : index > hoveredIndex
                  ? desktopHoverSpreadPx
                  : 0;
          const translateYPx = isSelected
            ? -(baseFanLiftPx + 24)
            : isHovered
              ? -(baseFanLiftPx + 42)
              : -baseFanLiftPx;
          const rotateDeg = isHovered || isSelected ? 0 : baseFanRotateDeg;
          const scale = isSelected ? 1.06 : isHovered ? 1.03 : 1;
          const stackZ = isSelected ? 120 : isHovered ? 110 : 40 + index;

          const animationClass = isPlaying
            ? "animate-card-play"
            : isDiscarding
              ? "animate-card-discard"
              : "";

          return (
            <div
              key={card.instanceId}
              ref={(el) => {
                wrapperRefs.current[index] = el;
              }}
              className={[
                "relative shrink-0 origin-bottom transition-all duration-200 ease-out",
                animationClass,
              ]
                .filter(Boolean)
                .join(" ")}
              style={{
                marginLeft: index === 0 ? 0 : -desktopOverlapPx,
                zIndex: stackZ,
                transform:
                  isPlaying || isDiscarding
                    ? undefined
                    : `translateX(${hoverShiftPx}px) translateY(${translateYPx}px) rotate(${rotateDeg}deg) scale(${scale})`,
              }}
              onMouseEnter={() => setHoveredCardId(card.instanceId)}
              onMouseLeave={() =>
                setHoveredCardId((current) =>
                  current === card.instanceId ? null : current
                )
              }
            >
              <GameCard
                instanceId={card.instanceId}
                definition={display.definition}
                costModifier={
                  globalCostModifier + display.archivistCostModifier
                }
                attackBonus={attackBonus}
                canPlay={displayedCanPlay}
                canPlayInked={displayedCanPlayInked}
                isSelected={isSelected}
                isPendingInked={isSelected && pendingInked}
                isFrozen={isFrozen}
                upgraded={display.upgraded}
                detailMode={isHovered || isSelected ? "full" : "condensed"}
                className={
                  isTutorialPlayableInkedCard
                    ? "ring-2 ring-cyan-300/85 ring-offset-2 ring-offset-slate-950"
                    : undefined
                }
                onClick={() => onPlayCard(card.instanceId, false)}
                onDoubleClick={() => onDoublePlayCard?.(card.instanceId, false)}
                onInkedClick={() => onPlayCard(card.instanceId, true)}
                onInkedDoubleClick={() =>
                  onDoublePlayCard?.(card.instanceId, true)
                }
              />
            </div>
          );
        })}
        {hand.length === 0 && (
          <p className="text-sm text-gray-500">{t("combat.noCardsInHand")}</p>
        )}
      </div>
    </>
  );
}

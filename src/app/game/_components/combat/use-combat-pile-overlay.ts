"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { CombatState } from "@/game/schemas/combat-state";
import type { CardDefinition } from "@/game/schemas/cards";
import type { PileType } from "./combat-view-types";

interface UseCombatPileOverlayParams {
  combat: CombatState;
  cardDefs: Map<string, CardDefinition>;
}

export function useCombatPileOverlay({
  combat,
  cardDefs,
}: UseCombatPileOverlayParams) {
  const { t } = useTranslation();
  const [openPile, setOpenPile] = useState<PileType | null>(null);

  const openPileByType = useCallback((pile: PileType) => {
    setOpenPile(pile);
  }, []);

  const closePile = useCallback(() => {
    setOpenPile(null);
  }, []);

  const pileTitle = useMemo(
    () =>
      openPile === "draw"
        ? (combat.revealedDrawCards ?? 0) > 0
          ? t("combat.drawPileRevealed", {
              count: Math.min(
                combat.revealedDrawCards ?? 0,
                combat.drawPile.length
              ),
            })
          : t("combat.drawPile")
        : openPile === "discard"
          ? t("combat.discardPile")
          : openPile === "exhaust"
            ? t("combat.exhaustPile")
            : null,
    [openPile, t, combat.revealedDrawCards, combat.drawPile.length]
  );

  const pileCards = useMemo(() => {
    if (!openPile) return [];
    if (openPile === "discard") return combat.discardPile;
    if (openPile === "exhaust") return combat.exhaustPile;

    const sortHiddenCards = (cards: CombatState["drawPile"]) =>
      [...cards].sort((a, b) => {
        const aName = cardDefs.get(a.definitionId)?.name ?? a.definitionId;
        const bName = cardDefs.get(b.definitionId)?.name ?? b.definitionId;
        const byName = aName.localeCompare(bName);
        if (byName !== 0) return byName;
        return a.instanceId.localeCompare(b.instanceId);
      });
    const revealedCount = Math.min(
      combat.revealedDrawCards ?? 0,
      combat.drawPile.length
    );
    // Preserve the real order only for cards explicitly revealed by an effect.
    return [
      ...combat.drawPile.slice(0, revealedCount),
      ...sortHiddenCards(combat.drawPile.slice(revealedCount)),
    ];
  }, [
    openPile,
    combat.discardPile,
    combat.exhaustPile,
    combat.drawPile,
    combat.revealedDrawCards,
    cardDefs,
  ]);

  return {
    openPile,
    pileTitle,
    pileCards,
    openPileByType,
    closePile,
  };
}

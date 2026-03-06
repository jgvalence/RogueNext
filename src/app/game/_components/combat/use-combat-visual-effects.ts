"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { useTranslation } from "react-i18next";
import { playSound } from "@/lib/sound";
import type { CombatState } from "@/game/schemas/combat-state";
import type { ReshuffleCardFx } from "./combat-view-types";

interface UseCombatVisualEffectsParams {
  combat: CombatState;
  actingEnemyId: string | null;
  drawBtnRef: RefObject<HTMLButtonElement | null>;
  discardBtnRef: RefObject<HTMLButtonElement | null>;
  getEnemyDisplayName: (enemy: CombatState["enemies"][number]) => string;
}

export function useCombatVisualEffects({
  combat,
  actingEnemyId,
  drawBtnRef,
  discardBtnRef,
  getEnemyDisplayName,
}: UseCombatVisualEffectsParams) {
  const { t } = useTranslation();

  const [newlySummonedIds, setNewlySummonedIds] = useState<Set<string>>(
    new Set()
  );
  const [summonAnnouncement, setSummonAnnouncement] = useState<string | null>(
    null
  );
  const [reshuffleFx, setReshuffleFx] = useState(false);
  const [reshuffleCards, setReshuffleCards] = useState<ReshuffleCardFx[]>([]);
  const [playerHit, setPlayerHit] = useState(false);
  const [bgFailed, setBgFailed] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [enemyArtFailures, setEnemyArtFailures] = useState<Set<string>>(
    new Set()
  );

  const prevEnemyIdsRef = useRef<string[]>(
    combat.enemies.map((enemy) => enemy.instanceId)
  );
  const prevPlayerHp = useRef(combat.player.currentHp);
  const prevDrawCountRef = useRef(combat.drawPile.length);
  const prevDiscardCountRef = useRef(combat.discardPile.length);
  const reshuffleFxIdRef = useRef(0);
  const summonHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spawnClearTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const markEnemyArtFailure = useCallback((definitionId: string) => {
    setEnemyArtFailures((prev) => {
      if (prev.has(definitionId)) return prev;
      const next = new Set(prev);
      next.add(definitionId);
      return next;
    });
  }, []);

  useEffect(() => {
    const prev = prevPlayerHp.current;
    prevPlayerHp.current = combat.player.currentHp;
    if (combat.player.currentHp >= prev) return undefined;
    setPlayerHit(true);
    playSound("PLAYER_HIT", 0.7);
    const timer = setTimeout(() => setPlayerHit(false), 500);
    return () => clearTimeout(timer);
  }, [combat.player.currentHp]);

  useEffect(() => {
    const prevIds = new Set(prevEnemyIdsRef.current);
    const spawned = combat.enemies.filter(
      (enemy) => !prevIds.has(enemy.instanceId)
    );
    prevEnemyIdsRef.current = combat.enemies.map((enemy) => enemy.instanceId);
    if (spawned.length === 0) return;

    setNewlySummonedIds((prev) => {
      const next = new Set(prev);
      for (const enemy of spawned) next.add(enemy.instanceId);
      return next;
    });

    for (const enemy of spawned) {
      const timer = setTimeout(() => {
        setNewlySummonedIds((prev) => {
          const next = new Set(prev);
          next.delete(enemy.instanceId);
          return next;
        });
      }, 650);
      spawnClearTimersRef.current.push(timer);
    }

    if (summonHideTimerRef.current) clearTimeout(summonHideTimerRef.current);
    const summoner = actingEnemyId
      ? combat.enemies.find((enemy) => enemy.instanceId === actingEnemyId)
      : null;
    const summonerName = summoner
      ? getEnemyDisplayName(summoner)
      : t("combat.enemy");
    const spawnedNames = spawned.map((enemy) => getEnemyDisplayName(enemy));
    const announcement =
      spawnedNames.length === 1
        ? t("combat.summonOne", {
            summoner: summonerName,
            target: spawnedNames[0],
          })
        : t("combat.summonMany", { summoner: summonerName });
    setSummonAnnouncement(announcement);
    summonHideTimerRef.current = setTimeout(
      () => setSummonAnnouncement(null),
      1200
    );
  }, [combat.enemies, actingEnemyId, t, getEnemyDisplayName]);

  useEffect(() => {
    const spawnTimers = spawnClearTimersRef.current;
    return () => {
      if (summonHideTimerRef.current) clearTimeout(summonHideTimerRef.current);
      for (const timer of spawnTimers) clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const prevDraw = prevDrawCountRef.current;
    const prevDiscard = prevDiscardCountRef.current;
    const drawNow = combat.drawPile.length;
    const discardNow = combat.discardPile.length;

    const recycledDiscardToDraw =
      prevDraw === 0 &&
      prevDiscard > 0 &&
      drawNow > 0 &&
      discardNow < prevDiscard;

    if (recycledDiscardToDraw) {
      setReshuffleFx(true);
      const fromRect = discardBtnRef.current?.getBoundingClientRect();
      const toRect = drawBtnRef.current?.getBoundingClientRect();
      if (fromRect && toRect) {
        const fromX = fromRect.left + fromRect.width / 2;
        const fromY = fromRect.top + fromRect.height / 2;
        const toX = toRect.left + toRect.width / 2;
        const toY = toRect.top + toRect.height / 2;
        const cardsCount = Math.min(7, Math.max(4, prevDiscard));
        const batchIdBase = reshuffleFxIdRef.current;
        reshuffleFxIdRef.current += cardsCount;
        const burst: ReshuffleCardFx[] = Array.from(
          { length: cardsCount },
          (_, index) => ({
            id: batchIdBase + index,
            x: fromX + (Math.random() - 0.5) * 18,
            y: fromY + (Math.random() - 0.5) * 14,
            tx: toX - fromX + (Math.random() - 0.5) * 20,
            ty: toY - fromY + (Math.random() - 0.5) * 12,
            rot: (Math.random() - 0.5) * 26,
            delay: index * 55,
          })
        );
        setReshuffleCards(burst);
      }

      const timer = setTimeout(() => {
        setReshuffleFx(false);
        setReshuffleCards([]);
      }, 980);
      prevDrawCountRef.current = drawNow;
      prevDiscardCountRef.current = discardNow;
      return () => clearTimeout(timer);
    }

    prevDrawCountRef.current = drawNow;
    prevDiscardCountRef.current = discardNow;
    return undefined;
  }, [
    combat.drawPile.length,
    combat.discardPile.length,
    discardBtnRef,
    drawBtnRef,
  ]);

  return {
    newlySummonedIds,
    summonAnnouncement,
    reshuffleFx,
    reshuffleCards,
    playerHit,
    bgFailed,
    setBgFailed,
    avatarFailed,
    setAvatarFailed,
    enemyArtFailures,
    markEnemyArtFailure,
  };
}

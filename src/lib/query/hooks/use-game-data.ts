"use client";

import { useQuery } from "@tanstack/react-query";
import { gameKeys } from "../game-keys";
import {
  getAllyDefinitionsAction,
  getCardDefinitionsAction,
  getEnemyDefinitionsAction,
  getRelicDefinitionsAction,
} from "@/server/actions/game-data";
import { getActiveRunAction } from "@/server/actions/run";
import type { CardDefinition } from "@/game/schemas/cards";
import { useMemo } from "react";

export function useCardDefinitions() {
  return useQuery({
    queryKey: gameKeys.cardDefinitions,
    queryFn: async () => {
      const result = await getCardDefinitionsAction();
      if (!result.success) throw new Error(result.error.message);
      return result.data;
    },
    staleTime: Infinity,
  });
}

export function useCardDefsMap() {
  const { data: cards, ...rest } = useCardDefinitions();

  const cardDefsMap = useMemo(() => {
    if (!cards) return new Map<string, CardDefinition>();
    return new Map(cards.map((c) => [c.id, c]));
  }, [cards]);

  return { data: cardDefsMap, ...rest };
}

export function useEnemyDefinitions() {
  return useQuery({
    queryKey: gameKeys.enemyDefinitions,
    queryFn: async () => {
      const result = await getEnemyDefinitionsAction();
      if (!result.success) throw new Error(result.error.message);
      return result.data;
    },
    staleTime: Infinity,
  });
}

export function useAllyDefinitions() {
  return useQuery({
    queryKey: gameKeys.allyDefinitions,
    queryFn: async () => {
      const result = await getAllyDefinitionsAction();
      if (!result.success) throw new Error(result.error.message);
      return result.data;
    },
    staleTime: Infinity,
  });
}

export function useRelicDefinitions() {
  return useQuery({
    queryKey: gameKeys.relicDefinitions,
    queryFn: async () => {
      const result = await getRelicDefinitionsAction();
      if (!result.success) throw new Error(result.error.message);
      return result.data;
    },
    staleTime: Infinity,
  });
}

export function useActiveRun() {
  return useQuery({
    queryKey: gameKeys.activeRun,
    queryFn: async () => {
      const result = await getActiveRunAction();
      if (!result.success) throw new Error(result.error.message);
      return result.data.run;
    },
  });
}

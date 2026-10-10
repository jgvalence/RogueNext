import type { RunState } from "@/game/schemas/run-state";
import type { CardDefinition } from "@/game/schemas/cards";
import type { PendingRewards } from "@/game/schemas/pending-rewards";
import type { CombatRewards } from "@/game/engine/rewards";
import { relicDefinitions } from "@/game/data/relics";
import { allyDefinitions } from "@/game/data/allies";

export function getPendingRewards(state: RunState): PendingRewards | undefined {
  const pending = state.pendingRewards;
  return pending &&
    pending.floor === state.floor &&
    pending.room === state.currentRoom &&
    state.combat === null &&
    ["IN_PROGRESS", "VICTORY"].includes(state.status)
    ? pending
    : undefined;
}

export function restoreCombatRewards(
  pending: PendingRewards | undefined,
  cards: Map<string, CardDefinition>
): CombatRewards | null {
  if (!pending) return null;
  return {
    gold: pending.gold,
    biomeResources: pending.biomeResources,
    cardChoices: pending.cardIds.flatMap((id) =>
      cards.has(id) ? [cards.get(id)!] : []
    ),
    relicChoices: pending.relicIds.flatMap((id) =>
      relicDefinitions.filter((relic) => relic.id === id)
    ),
    allyChoices: pending.allyIds.flatMap((id) =>
      allyDefinitions.filter((ally) => ally.id === id)
    ),
    bossMaxHpBonus: pending.bossMaxHpBonus,
    usableItemDropDefinitionId: pending.usableItemDropDefinitionId,
  };
}

export function checkpointRewards(
  state: RunState,
  rewards: CombatRewards,
  isBoss: boolean,
  isElite: boolean,
  rerollsRemaining: number,
  rerollCounter: number,
  generator: ((index: number) => CardDefinition[]) | null
): PendingRewards {
  return {
    floor: state.floor,
    room: state.currentRoom,
    isBoss,
    isElite,
    gold: rewards.gold,
    biomeResources: rewards.biomeResources,
    cardIds: rewards.cardChoices.map((card) => card.id),
    relicIds: rewards.relicChoices.map((relic) => relic.id),
    allyIds: rewards.allyChoices.map((ally) => ally.id),
    bossMaxHpBonus: rewards.bossMaxHpBonus,
    usableItemDropDefinitionId: rewards.usableItemDropDefinitionId,
    rerollsRemaining,
    rerollCounter,
    rerollCardIds: Array.from(
      { length: rerollCounter + rerollsRemaining + 1 },
      (_, index) => generator?.(index).map((card) => card.id) ?? []
    ),
  };
}

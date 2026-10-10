import type { CombatState } from "../src/game/schemas/combat-state";
import type { CardDefinition } from "../src/game/schemas/cards";
import type { InkPowerType } from "../src/game/schemas/enums";
import { applyInkPower, canUseInkPower } from "../src/game/engine/ink";
import type { EnemyDefinition } from "../src/game/schemas/entities";
import {
  canPlayCard,
  canPlayCardInked,
  playCard,
} from "../src/game/engine/cards";
import { checkCombatEnd } from "../src/game/engine/combat";
import { computeIncomingDamage } from "../src/game/engine/incoming-damage";
import { shouldHideEnemyIntent } from "../src/game/engine/difficulty";
import { createRNG } from "../src/game/engine/rng";
import { buildUpgradedCardDefinition } from "../src/game/engine/card-upgrades";
import { getBuildProfile } from "../src/game/engine/build-profile";

export function hasArmorPayoff(card: CardDefinition): boolean {
  return getBuildProfile(card).armor?.includes("payoff") ?? false;
}

/** Only player-visible information may influence a simulated decision. */
export function getObservedCombat(
  state: CombatState,
  enemies: Map<string, EnemyDefinition>
): CombatState {
  return {
    ...state,
    enemies: state.enemies.map((enemy) => {
      const def = enemies.get(enemy.definitionId);
      if (
        !def ||
        !shouldHideEnemyIntent(
          state.difficultyLevel ?? 0,
          state.turnNumber,
          def,
          { playerHand: state.hand }
        )
      )
        return enemy;
      const intentIndex = def.abilities.reduce(
        (best, ability, i) =>
          ability.weight > def.abilities[best]!.weight ? i : best,
        0
      );
      return { ...enemy, intentIndex };
    }),
  };
}

export function estimateIncomingDamage(
  state: CombatState,
  enemies: Map<string, EnemyDefinition>
) {
  return computeIncomingDamage(getObservedCombat(state, enemies), enemies)
    .player.hpLoss;
}

export function chooseInkPower(
  state: CombatState,
  cards: Map<string, CardDefinition>,
  enemies: Map<string, EnemyDefinition>,
  powers: InkPowerType[]
) {
  const observed = getObservedCombat(state, enemies);
  const hpWeight = state.player.currentHp < state.player.maxHp * 0.4 ? 3 : 1.8;
  const incoming = computeIncomingDamage(observed, enemies).player.hpLoss;
  let best: {
    power: InkPowerType;
    targetId: string | null;
    score: number;
  } | null = null;
  for (const power of powers) {
    if (!canUseInkPower(observed, power)) continue;
    if (
      power === "PACTE_SANG" &&
      observed.player.currentHp <= observed.player.maxHp * 0.5
    )
      continue;
    if (
      power === "DOUBLE_MISE" &&
      !observed.hand.some(
        (card) =>
          cards.get(card.definitionId)?.type === "ATTACK" &&
          canPlayCard(observed, card.instanceId, cards)
      )
    )
      continue;
    const targets =
      power === "INDEX" || power === "REWRITE"
        ? observed.discardPile.map((card) => card.instanceId)
        : ["SAIGNEMENT", "GRISGRIS", "SILENCE"].includes(power)
          ? observed.enemies
              .filter((enemy) => enemy.currentHp > 0)
              .map((enemy) => enemy.instanceId)
          : [null];
    for (const targetId of targets) {
      const after = checkCombatEnd(
        applyInkPower(
          structuredClone(observed),
          power,
          targetId,
          cards,
          createRNG(`power-preview-${observed.turnNumber}-${power}`)
        )
      );
      if (after.phase === "COMBAT_LOST") continue;
      let score = after.phase === "COMBAT_WON" ? 10000 : 0;
      score +=
        (incoming - computeIncomingDamage(after, enemies).player.hpLoss) *
        hpWeight;
      score += (after.player.currentHp - observed.player.currentHp) * hpWeight;
      for (const enemy of observed.enemies.filter(
        (enemy) => enemy.currentHp > 0
      )) {
        const next = after.enemies.find(
          (next) => next.instanceId === enemy.instanceId
        );
        score += Math.max(
          0,
          enemy.currentHp - Math.max(0, next?.currentHp ?? 0)
        );
        if (!next || next.currentHp <= 0) {
          score += 10;
          continue;
        }
        for (const buff of ["POISON", "BLEED"] as const) {
          score += Math.min(
            next.currentHp,
            Math.max(
              0,
              (next.buffs.find((b) => b.type === buff)?.stacks ?? 0) -
                (enemy.buffs.find((b) => b.type === buff)?.stacks ?? 0)
            ) * 2.2
          );
        }
      }
      score += (after.player.inkCurrent - observed.player.inkCurrent) * 1.7;
      score +=
        Math.max(0, after.hand.length - observed.hand.length) *
        (after.player.energyCurrent > 0 ? 3 : 0.5);
      score +=
        (after.hand.filter((card) => card.upgraded).length -
          observed.hand.filter((card) => card.upgraded).length) *
        3;
      if (after.nextCardDoubleDamage && !observed.nextCardDoubleDamage)
        score += 10;
      if (!best || score > best.score) best = { power, targetId, score };
    }
  }
  return best && best.score > 0 ? best : null;
}

/** One-step heuristic using isolated engine previews, not the run's random stream.
 * Hidden intents use the most common ability as an estimate. This is not optimal play.
 */
export function chooseCombatCard(
  state: CombatState,
  cards: Map<string, CardDefinition>,
  enemies: Map<string, EnemyDefinition>,
  noArmorPayoffs = false
) {
  const observed = getObservedCombat(state, enemies);
  const beforeIncoming = computeIncomingDamage(observed, enemies).player.hpLoss;
  const hpWeight = state.player.currentHp < state.player.maxHp * 0.4 ? 3 : 1.8;
  let best: {
    instanceId: string;
    targetId: string | null;
    useInked: boolean;
    score: number;
  } | null = null;
  for (const card of observed.hand) {
    const def = cards.get(card.definitionId);
    if (!def || !canPlayCard(observed, card.instanceId, cards)) continue;
    const targets =
      def.targeting === "SINGLE_ENEMY"
        ? observed.enemies
            .filter((e) => e.currentHp > 0)
            .map((e) => e.instanceId)
        : def.targeting === "SINGLE_ALLY"
          ? observed.allies
              .filter((e) => e.currentHp > 0)
              .map((e) => e.instanceId)
          : [null];
    for (const useInked of [false, true]) {
      if (useInked && !canPlayCardInked(observed, card.instanceId, cards))
        continue;
      if (noArmorPayoffs) {
        const effective = card.upgraded
          ? buildUpgradedCardDefinition(def, card.upgradeBranch ?? "A")
          : def;
        const effects = useInked
          ? (effective.inkedVariant?.effects ?? effective.effects)
          : effective.effects;
        if (hasArmorPayoff({ ...effective, effects })) continue;
      }
      for (const targetId of targets) {
        const after = checkCombatEnd(
          playCard(
            structuredClone(observed),
            card.instanceId,
            targetId,
            useInked,
            cards,
            createRNG(`preview-${state.turnNumber}-${card.definitionId}`)
          )
        );
        if (after.phase === "COMBAT_LOST") continue;
        let score = after.phase === "COMBAT_WON" ? 10000 : 0;
        score +=
          (beforeIncoming -
            computeIncomingDamage(after, enemies).player.hpLoss) *
          hpWeight;
        score +=
          (after.player.currentHp - observed.player.currentHp) * hpWeight;
        for (const enemy of observed.enemies.filter((e) => e.currentHp > 0)) {
          const next = after.enemies.find(
            (e) => e.instanceId === enemy.instanceId
          );
          score += Math.max(
            0,
            enemy.currentHp - Math.max(0, next?.currentHp ?? 0)
          );
          if (!next || next.currentHp <= 0) {
            score += 10;
            continue;
          }
          for (const buff of ["POISON", "BLEED"] as const) {
            const previous =
              enemy.buffs.find((b) => b.type === buff)?.stacks ?? 0;
            const current =
              next.buffs.find((b) => b.type === buff)?.stacks ?? 0;
            score += Math.min(
              next.currentHp,
              Math.max(0, current - previous) * 2.2
            );
          }
        }
        score += (after.player.strength - observed.player.strength) * 5;
        score += (after.player.focus - observed.player.focus) * 4;
        score += (after.player.inkCurrent - observed.player.inkCurrent) * 1.7;
        score +=
          (after.player.energyCurrent - observed.player.energyCurrent) * 3;
        score +=
          Math.max(0, after.hand.length - observed.hand.length + 1) *
          (after.player.energyCurrent > 0 ? 3 : 0.5);
        score -=
          Math.max(
            0,
            (after.pendingEnergyDebt ?? 0) - (observed.pendingEnergyDebt ?? 0)
          ) * 2;
        // Persistent engines have value beyond their immediate turn.
        if (def.type === "POWER") score += 6;
        if (!best || score > best.score)
          best = { instanceId: card.instanceId, targetId, useInked, score };
      }
    }
  }
  return best && best.score > 0 ? best : null;
}

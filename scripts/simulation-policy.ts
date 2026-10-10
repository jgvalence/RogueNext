import type {
  CardDefinition,
  CardInstance,
  CardUpgradeBranch,
} from "../src/game/schemas/cards";
import {
  getBuildProfile,
  type BuildPath,
} from "../src/game/engine/build-profile";
import { buildUpgradedCardDefinition } from "../src/game/engine/card-upgrades";

export type BuildType = "mixed" | BuildPath;

/** A transparent draft heuristic, not an estimate of a human win probability. */
export function scoreCardForBuild(
  card: CardDefinition | undefined,
  build: BuildType
): number {
  // Temporary boss-generated status cards can be absent from the static catalogue.
  if (!card || card.type === "STATUS" || card.type === "CURSE") return -1000;
  let utility = 0;
  for (const effect of card.effects) {
    switch (effect.type) {
      case "DAMAGE":
        utility += effect.value * (card.targeting === "ALL_ENEMIES" ? 1.6 : 1);
        break;
      case "BLOCK":
        utility += effect.value * 0.8;
        break;
      case "HEAL":
        utility += effect.value * 1.2;
        break;
      case "DRAW_CARDS":
        utility += effect.value * 4;
        break;
      case "GAIN_ENERGY":
        utility += effect.value * 6;
        break;
      case "GAIN_INK":
        utility += effect.value * 2.5;
        break;
      case "GAIN_STRENGTH":
      case "GAIN_FOCUS":
        utility += effect.value * 4;
        break;
      case "APPLY_DEBUFF":
        utility +=
          effect.value *
          (effect.buff === "POISON" || effect.buff === "BLEED" ? 2 : 3);
        break;
      case "EXHAUST":
        break;
      case "ADD_CARD_TO_DISCARD":
      case "ADD_CARD_TO_DRAW":
        utility -= 2;
        break;
      default:
        utility += 4;
    }
  }
  const roles = build === "mixed" ? [] : (getBuildProfile(card)[build] ?? []);
  // Both setup and payoff matter; raw rarity and name have no privileged score.
  return (
    utility / Math.max(1, card.energyCost + card.inkCost / 3) +
    roles.length * 10
  );
}

const upgradeCache = new WeakMap<
  CardDefinition,
  Partial<Record<BuildType, { branch: CardUpgradeBranch; gain: number }>>
>();
function upgradeChoice(card: CardDefinition, build: BuildType) {
  const cache = upgradeCache.get(card) ?? {};
  upgradeCache.set(card, cache);
  if (!cache[build]) {
    const a = scoreCardForBuild(buildUpgradedCardDefinition(card, "A"), build);
    const b = scoreCardForBuild(buildUpgradedCardDefinition(card, "B"), build);
    cache[build] = {
      branch: b > a ? "B" : "A",
      gain: Math.max(a, b) - scoreCardForBuild(card, build),
    };
  }
  return cache[build]!;
}
export function chooseUpgradeBranch(
  card: CardDefinition,
  build: BuildType
): CardUpgradeBranch {
  return upgradeChoice(card, build).branch;
}

export function chooseUpgradeCard(
  deck: CardInstance[],
  defs: Map<string, CardDefinition>,
  build: BuildType
): CardInstance | undefined {
  return deck
    .filter((card) => !card.upgraded && defs.has(card.definitionId))
    .sort((a, b) => {
      const gain = (card: CardInstance) => {
        const def = defs.get(card.definitionId)!;
        return upgradeChoice(def, build).gain;
      };
      return gain(b) - gain(a);
    })[0];
}

import type { BiomeType, BiomeResource } from "../schemas/enums";
import type { ComputedMetaBonuses, MetaBonus } from "../schemas/meta";
import { DEFAULT_META_BONUSES } from "../schemas/meta";
import type { CombatState } from "../schemas/combat-state";
import { histoireDefinitions } from "../data/histoires";
import type { RNG } from "./rng";

/**
 * Biome → ressource principale produite par ce biome.
 */
export const BIOME_RESOURCE: Record<BiomeType, BiomeResource> = {
  LIBRARY: "PAGES",
  VIKING: "RUNES",
  GREEK: "LAURIERS",
  EGYPTIAN: "GLYPHES",
  LOVECRAFTIAN: "FRAGMENTS",
  AZTEC: "OBSIDIENNE",
  CELTIC: "AMBRE",
  RUSSIAN: "SCEAUX",
  AFRICAN: "MASQUES",
};

// All biome resource keys for cross-biome drop logic
const ALL_RESOURCES = Object.values(BIOME_RESOURCE) as BiomeResource[];

/**
 * Calcule les ressources gagnées pour un combat donné.
 * - Normal : base faible
 * - Élite  : ×2
 * - Boss   : ×4
 * - 25% de chance de gagner 1 ressource d'un biome aléatoire différent
 */
export function getResourcesForCombat(
  biome: BiomeType,
  isElite: boolean,
  isBoss: boolean,
  floor: number,
  rng?: RNG
): Partial<Record<BiomeResource, number>> {
  const base = 2 + (floor - 1);
  let amount = base;
  if (isBoss) {
    amount = Math.round(base * 4);
  } else if (isElite) {
    amount = Math.round(base * 2);
  }

  const primaryResource = BIOME_RESOURCE[biome];
  const result: Partial<Record<BiomeResource, number>> = {
    [primaryResource]: amount,
  };

  // 25% chance d'obtenir 1 ressource d'un biome aléatoire différent
  if (rng && rng.next() < 0.25) {
    const otherResources = ALL_RESOURCES.filter((r) => r !== primaryResource);
    const bonus = rng.pick(otherResources);
    result[bonus] = (result[bonus] ?? 0) + 1;
  }

  return result;
}

/**
 * Agrège les bonus de toutes les histoires débloquées en un objet plat.
 * REWRITE est toujours présent dans unlockedInkPowers.
 */
export function computeMetaBonuses(
  unlockedStoryIds: string[]
): ComputedMetaBonuses {
  const result = { ...DEFAULT_META_BONUSES };
  // Always unlock REWRITE
  const inkPowers = new Set<"REWRITE" | "LOST_CHAPTER" | "SEAL">(["REWRITE"]);

  const storyMap = new Map(histoireDefinitions.map((h) => [h.id, h]));

  for (const id of unlockedStoryIds) {
    const histoire = storyMap.get(id);
    if (!histoire) continue;
    applyBonusToComputed(result, histoire.bonus, inkPowers);
  }

  result.unlockedInkPowers = Array.from(inkPowers);
  return result;
}

function applyBonusToComputed(
  result: ComputedMetaBonuses,
  bonus: MetaBonus,
  inkPowers: Set<"REWRITE" | "LOST_CHAPTER" | "SEAL">
): void {
  switch (bonus.type) {
    case "EXTRA_DRAW":
      result.extraDraw += bonus.value;
      break;
    case "EXTRA_ENERGY_MAX":
      result.extraEnergyMax += bonus.value;
      break;
    case "EXTRA_INK_MAX":
      result.extraInkMax += bonus.value;
      break;
    case "INK_PER_CARD_CHANCE":
      result.inkPerCardChance += bonus.value;
      break;
    case "INK_PER_CARD_VALUE":
      result.inkPerCardValue += bonus.value;
      break;
    case "STARTING_INK":
      result.startingInk += bonus.value;
      break;
    case "STARTING_BLOCK":
      result.startingBlock += bonus.value;
      break;
    case "STARTING_STRENGTH":
      result.startingStrength += bonus.value;
      break;
    case "STARTING_REGEN":
      result.startingRegen += bonus.value;
      break;
    case "FIRST_HIT_DAMAGE_REDUCTION":
      result.firstHitDamageReduction += bonus.value;
      break;
    case "EXTRA_HP":
      result.extraHp += bonus.value;
      break;
    case "EXTRA_HAND_AT_START":
      result.extraHandAtStart += bonus.value;
      break;
    case "ATTACK_BONUS":
      result.attackBonus += bonus.value;
      break;
    case "ALLY_SLOTS":
      result.allySlots += bonus.value;
      break;
    case "STARTING_GOLD":
      result.startingGold += bonus.value;
      break;
    case "EXTRA_CARD_REWARD_CHOICES":
      result.extraCardRewardChoices += bonus.value;
      break;
    case "RELIC_DISCOUNT":
      result.relicDiscount += bonus.value;
      break;
    case "UNLOCK_INK_POWER":
      inkPowers.add(bonus.power);
      break;
    case "HEAL_AFTER_COMBAT":
      result.healAfterCombat += bonus.value;
      break;
    case "EXHAUST_KEEP_CHANCE":
      result.exhaustKeepChance = Math.min(
        100,
        result.exhaustKeepChance + bonus.value
      );
      break;
    case "SURVIVAL_ONCE":
      result.survivalOnce = true;
      break;
    case "FREE_UPGRADE_PER_RUN":
      result.freeUpgradePerRun = true;
      break;
    case "STARTING_RARE_CARD":
      result.startingRareCard = true;
      break;
  }
}

/**
 * Applique les MetaBonuses au PlayerState au début d'un combat.
 * Seuls les bonus "combat init" sont appliqués ici.
 * Les bonus complexes (HEAL_AFTER_COMBAT, etc.) sont gérés ailleurs.
 */
export function applyMetaBonusesToCombat(
  state: CombatState,
  bonuses: ComputedMetaBonuses
): CombatState {
  const p = state.player;
  return {
    ...state,
    player: {
      ...p,
      energyMax: p.energyMax + bonuses.extraEnergyMax,
      energyCurrent: p.energyCurrent + bonuses.extraEnergyMax,
      inkMax: p.inkMax + bonuses.extraInkMax,
      inkCurrent: Math.min(
        p.inkMax + bonuses.extraInkMax,
        p.inkCurrent + bonuses.startingInk
      ),
      inkPerCardChance: Math.min(
        100,
        p.inkPerCardChance + bonuses.inkPerCardChance
      ),
      inkPerCardValue: Math.max(0, p.inkPerCardValue + bonuses.inkPerCardValue),
      regenPerTurn: Math.max(0, p.regenPerTurn + bonuses.startingRegen),
      firstHitDamageReductionPercent: Math.min(
        100,
        p.firstHitDamageReductionPercent + bonuses.firstHitDamageReduction
      ),
      drawCount: p.drawCount + bonuses.extraDraw,
      strength: p.strength + bonuses.startingStrength,
      block: p.block + bonuses.startingBlock,
      maxHp: p.maxHp + bonuses.extraHp,
      currentHp: Math.min(
        p.maxHp + bonuses.extraHp,
        p.currentHp + bonuses.extraHp
      ),
    },
  };
}

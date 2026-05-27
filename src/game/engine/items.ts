import { nanoid } from "nanoid";
import type { RunState } from "../schemas/run-state";
import type {
  UsableItemDefinition,
  UsableItemInstance,
} from "../schemas/items";
import { resolveEffects } from "./effects";
import { checkCombatEnd } from "./combat";
import type { RNG } from "./rng";
import { GAME_CONSTANTS } from "../constants";
import { POTION_DOUBLE_RELIC_ID } from "./relics";

const POTION_EFFECT_MULTIPLIER = 2;

export const usableItemDefinitions: UsableItemDefinition[] = [
  {
    id: "potion_damage",
    name: "Potion de degats",
    description: "Inflige 14 degats a un ennemi.",
    targeting: "SINGLE_ENEMY",
    effects: [{ type: "DAMAGE", value: 14 }],
  },
  {
    id: "potion_block",
    name: "Potion de bouclier",
    description: "Gagne 12 bouclier.",
    targeting: "SELF",
    effects: [{ type: "BLOCK", value: 12 }],
  },
  {
    id: "potion_ink",
    name: "Fiole d'encre claire",
    description: "Gagne 3 Encre.",
    targeting: "SELF",
    effects: [{ type: "GAIN_INK", value: 3 }],
  },
  {
    id: "potion_focus",
    name: "Tonique de concentration",
    description: "Gagne 2 Concentration.",
    targeting: "SELF",
    effects: [{ type: "GAIN_FOCUS", value: 2 }],
  },
  {
    id: "potion_strength",
    name: "Philtre de vigueur",
    description: "Gagne 2 Force.",
    targeting: "SELF",
    effects: [{ type: "GAIN_STRENGTH", value: 2 }],
  },
  {
    id: "potion_draw",
    name: "Infusion de notes",
    description: "Pioche 3 cartes.",
    targeting: "SELF",
    effects: [{ type: "DRAW_CARDS", value: 3 }],
  },
  {
    id: "potion_energy",
    name: "Elixir d'elan",
    description: "Gagne 1 Energie.",
    targeting: "SELF",
    effects: [{ type: "GAIN_ENERGY", value: 1 }],
  },
  {
    id: "potion_poison",
    name: "Fiole de venin",
    description: "Applique 8 Poison a un ennemi.",
    targeting: "SINGLE_ENEMY",
    effects: [{ type: "APPLY_DEBUFF", value: 8, buff: "POISON" }],
  },
  {
    id: "potion_bleed",
    name: "Ampoule ecarlate",
    description: "Applique 8 Saignement a un ennemi.",
    targeting: "SINGLE_ENEMY",
    effects: [{ type: "APPLY_DEBUFF", value: 8, buff: "BLEED" }],
  },
  {
    id: "potion_weakness",
    name: "Brume pale",
    description: "Applique 2 Faiblesse a un ennemi.",
    targeting: "SINGLE_ENEMY",
    effects: [{ type: "APPLY_DEBUFF", value: 2, buff: "WEAK" }],
  },
  {
    id: "potion_vulnerable",
    name: "Solvant de marge",
    description: "Applique 2 Vulnerable a un ennemi.",
    targeting: "SINGLE_ENEMY",
    effects: [{ type: "APPLY_DEBUFF", value: 2, buff: "VULNERABLE" }],
  },
  {
    id: "potion_guardian",
    name: "Baume de garde",
    description: "Gagne 8 Armure et 1 Epine.",
    targeting: "SELF",
    effects: [
      { type: "BLOCK", value: 8 },
      { type: "APPLY_BUFF", value: 1, buff: "THORNS" },
    ],
  },
];

const usableItemDefsById = new Map(
  usableItemDefinitions.map((item) => [item.id, item])
);

export function getUsableItemDefinitionsMap(): Map<
  string,
  UsableItemDefinition
> {
  return new Map(usableItemDefsById);
}

export function createUsableItemInstance(
  definitionId: string
): UsableItemInstance {
  return { instanceId: nanoid(), definitionId };
}

export function canGainUsableItem(state: RunState): boolean {
  const capacity = state.usableItemCapacity ?? GAME_CONSTANTS.MAX_USABLE_ITEMS;
  return (state.usableItems?.length ?? 0) < capacity;
}

export function pickRandomUsableItemDefinitionId(rng: RNG): string {
  return rng.pick(usableItemDefinitions).id;
}

function getEffectiveItemEffects(state: RunState, def: UsableItemDefinition) {
  if (!state.relicIds.includes(POTION_DOUBLE_RELIC_ID)) {
    return def.effects;
  }

  return def.effects.map((effect) => ({
    ...effect,
    value: effect.value * POTION_EFFECT_MULTIPLIER,
  }));
}

export function applyUsableItem(
  state: RunState,
  itemInstanceId: string,
  targetId: string | null,
  rng: RNG
): RunState {
  if (!state.combat || state.combat.phase !== "PLAYER_TURN") return state;

  const item = (state.usableItems ?? []).find(
    (i) => i.instanceId === itemInstanceId
  );
  if (!item) return state;

  const def = usableItemDefsById.get(item.definitionId);
  if (!def) return state;

  if (def.targeting === "SINGLE_ENEMY") {
    if (!targetId) return state;
    const targetEnemy = state.combat.enemies.find(
      (enemy) => enemy.instanceId === targetId
    );
    if (!targetEnemy || targetEnemy.currentHp <= 0) return state;

    const combatAfterEffects = resolveEffects(
      state.combat,
      getEffectiveItemEffects(state, def),
      { source: "player", target: { type: "enemy", instanceId: targetId } },
      rng
    );
    return {
      ...state,
      combat: checkCombatEnd(combatAfterEffects),
      usableItems: (state.usableItems ?? []).filter(
        (current) => current.instanceId !== itemInstanceId
      ),
    };
  }

  const combatAfterEffects = resolveEffects(
    state.combat,
    getEffectiveItemEffects(state, def),
    { source: "player", target: "player" },
    rng
  );
  return {
    ...state,
    combat: checkCombatEnd(combatAfterEffects),
    usableItems: (state.usableItems ?? []).filter(
      (current) => current.instanceId !== itemInstanceId
    ),
  };
}

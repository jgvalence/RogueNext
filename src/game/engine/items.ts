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
      def.effects,
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
    def.effects,
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

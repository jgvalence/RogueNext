import type { CardInstance, CardDefinition } from "../schemas/cards";

export type RunBuildArchetype =
  | "ink"
  | "armor"
  | "draw"
  | "bleed"
  | "poison"
  | "mixed";

const TAG_TO_ARCHETYPE: Record<string, RunBuildArchetype> = {
  INK: "ink",
  BLOCK: "armor",
  DRAW: "draw",
  BLEED: "bleed",
  POISON: "poison",
};

export function deriveRunBuildArchetype(
  deck: CardInstance[],
  cardDefs: Map<string, CardDefinition>
): RunBuildArchetype {
  const counts: Partial<Record<RunBuildArchetype, number>> = {};

  for (const card of deck) {
    const def = cardDefs.get(card.definitionId);
    if (!def) continue;
    for (const tag of def.archetypeTags ?? []) {
      const archetype = TAG_TO_ARCHETYPE[tag];
      if (archetype) {
        counts[archetype] = (counts[archetype] ?? 0) + 1;
      }
    }
  }

  const entries = Object.entries(counts) as [RunBuildArchetype, number][];
  if (entries.length === 0) return "mixed";

  entries.sort((a, b) => b[1] - a[1]);
  const [[top, topCount], second] = [entries[0]!, entries[1]];

  // Dominant si le top a au moins 3 cartes ET représente >40% des cartes taggées,
  // ET au moins 1.5× le second archétype (sinon c'est un build mixte).
  const total = entries.reduce((s, [, n]) => s + n, 0);
  if (topCount < 3) return "mixed";
  if (topCount / total < 0.4) return "mixed";
  if (second && topCount < second[1] * 1.5) return "mixed";

  return top;
}

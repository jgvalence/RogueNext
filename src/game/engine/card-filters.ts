import type { CardDefinition } from "../schemas/cards";

export function matchesCardCharacter(
  card: Pick<CardDefinition, "characterId">,
  characterId?: string
): boolean {
  return !card.characterId || !characterId || card.characterId === characterId;
}

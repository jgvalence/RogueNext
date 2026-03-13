import type { RNG } from "./rng";
import {
  curseCardDefinitionIds,
  getCardDefinitionById,
  statusCardDefinitionIds,
} from "../data";

const END_OF_TURN_EXHAUST_CARD_IDS = new Set(["dazed"]);

export function isStatusCardDefinitionId(definitionId: string): boolean {
  const definition = getCardDefinitionById(definitionId);
  return definition?.type === "STATUS";
}

export function isCurseCardDefinitionId(definitionId: string): boolean {
  const definition = getCardDefinitionById(definitionId);
  return definition?.type === "CURSE";
}

export function isClogCardDefinitionId(definitionId: string): boolean {
  const definition = getCardDefinitionById(definitionId);
  return definition?.type === "STATUS" || definition?.type === "CURSE";
}

export function shouldExhaustAtEndOfTurn(definitionId: string): boolean {
  return END_OF_TURN_EXHAUST_CARD_IDS.has(definitionId);
}

export function pickRandomStatusCardDefinitionId(rng: RNG): string {
  return rng.pick(statusCardDefinitionIds);
}

export function pickRandomCurseCardDefinitionId(rng: RNG): string {
  return rng.pick(curseCardDefinitionIds);
}

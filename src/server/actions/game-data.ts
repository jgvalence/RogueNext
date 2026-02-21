"use server";

import { handleServerActionError, success } from "@/lib/errors/handlers";
import {
  allCardDefinitions,
  allyDefinitions,
  buildCardDefsMap,
  enemyDefinitions,
  relicDefinitions,
} from "@/game/data";

export async function getCardDefinitionsAction() {
  try {
    // MVP: return from static data (no DB round-trip needed)
    return success(allCardDefinitions);
  } catch (error) {
    return handleServerActionError(error);
  }
}

export async function getCardDefsMapAction() {
  try {
    const map = buildCardDefsMap();
    return success(Object.fromEntries(map));
  } catch (error) {
    return handleServerActionError(error);
  }
}

export async function getEnemyDefinitionsAction() {
  try {
    return success(enemyDefinitions);
  } catch (error) {
    return handleServerActionError(error);
  }
}

export async function getAllyDefinitionsAction() {
  try {
    return success(allyDefinitions);
  } catch (error) {
    return handleServerActionError(error);
  }
}

export async function getRelicDefinitionsAction() {
  try {
    return success(relicDefinitions);
  } catch (error) {
    return handleServerActionError(error);
  }
}

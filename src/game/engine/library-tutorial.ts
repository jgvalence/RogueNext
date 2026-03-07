export const LIBRARY_INTRO_TUTORIAL_RESOURCE_KEY = "__LIBRARY_INTRO_SEEN";
export const FIRST_RUN_ENERGY_STORY_TUTORIAL_RESOURCE_KEY =
  "__FIRST_RUN_ENERGY_STORY_TUTORIAL";

export function hasSeenLibraryIntroTutorial(
  resources: Record<string, number>
): boolean {
  return (resources[LIBRARY_INTRO_TUTORIAL_RESOURCE_KEY] ?? 0) > 0;
}

export function markLibraryIntroTutorialSeen(
  resources: Record<string, number>
): Record<string, number> {
  return {
    ...resources,
    [LIBRARY_INTRO_TUTORIAL_RESOURCE_KEY]: 1,
  };
}

export function hasPendingFirstRunEnergyStoryTutorial(
  resources: Record<string, number>
): boolean {
  return (resources[FIRST_RUN_ENERGY_STORY_TUTORIAL_RESOURCE_KEY] ?? 0) > 0;
}

export function markFirstRunEnergyStoryTutorialPending(
  resources: Record<string, number>
): Record<string, number> {
  return {
    ...resources,
    [FIRST_RUN_ENERGY_STORY_TUTORIAL_RESOURCE_KEY]: 1,
  };
}

export function clearFirstRunEnergyStoryTutorial(
  resources: Record<string, number>
): Record<string, number> {
  return {
    ...resources,
    [FIRST_RUN_ENERGY_STORY_TUTORIAL_RESOURCE_KEY]: 0,
  };
}

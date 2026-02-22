import type { TFunction } from "i18next";
import type { Histoire } from "@/game/schemas/meta";

export function localizeStoryTitle(story: Histoire, t: TFunction): string {
  return t(`stories.${story.id}.title`, { defaultValue: story.titre });
}

export function localizeStoryAuthor(
  story: Histoire,
  t: TFunction
): string | undefined {
  if (!story.auteur) return undefined;
  const localized = t(`stories.${story.id}.author`, {
    defaultValue: story.auteur,
  });
  return localized || undefined;
}

export function localizeStoryDescription(
  story: Histoire,
  t: TFunction
): string {
  return t(`stories.${story.id}.description`, {
    defaultValue: story.description,
  });
}

import type { TFunction } from "i18next";
import { enemyDefinitions } from "@/game/data/enemies";
import {
  BOSS_START_OPTION_CONDITION_PREFIX,
  getRunConditionById,
} from "@/game/engine/run-conditions";
import { localizeEnemyName } from "@/lib/i18n/entity-text";

function formatFallback(value: string): string {
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function extractBossId(conditionId: string): string | null {
  if (!conditionId.startsWith(BOSS_START_OPTION_CONDITION_PREFIX)) {
    return null;
  }
  const bossId = conditionId.slice(BOSS_START_OPTION_CONDITION_PREFIX.length);
  return bossId.length > 0 ? bossId : null;
}

function buildBossBonusDescription(conditionId: string, t: TFunction): string {
  const condition = getRunConditionById(conditionId);
  const entries = Object.entries(
    condition?.effects.addMetaBonuses ?? {}
  ).filter(([, value]) => typeof value === "number" && Number.isFinite(value));

  if (entries.length === 0) {
    return t("runCondition.bossStart.bonusFallback");
  }

  const parts = entries.map(([bonusKey, value]) =>
    t(`library.bonus.${bonusKey}`, {
      value,
      defaultValue: `${formatFallback(bonusKey)} ${value}`,
    })
  );

  return parts.join(" | ");
}

export function localizeRunConditionName(
  conditionId: string,
  t: TFunction
): string {
  const translated = t(`runCondition.definitions.${conditionId}.name`, {
    defaultValue: "",
  });
  if (translated.trim().length > 0) {
    return translated;
  }

  const bossId = extractBossId(conditionId);
  if (!bossId) {
    return formatFallback(conditionId);
  }

  const bossFallback =
    enemyDefinitions.find((enemy) => enemy.id === bossId)?.name ??
    formatFallback(bossId);
  const bossName = localizeEnemyName(bossId, bossFallback);
  return t("runCondition.bossStart.name", {
    boss: bossName,
    defaultValue: `Boss Start Option ${bossName}`,
  });
}

export function localizeRunConditionDescription(
  conditionId: string,
  t: TFunction
): string {
  const translated = t(`runCondition.definitions.${conditionId}.description`, {
    defaultValue: "",
  });
  if (translated.trim().length > 0) {
    return translated;
  }

  const bossId = extractBossId(conditionId);
  if (!bossId) {
    return localizeRunConditionName(conditionId, t);
  }

  return t("runCondition.bossStart.description", {
    bonus: buildBossBonusDescription(conditionId, t),
    defaultValue: localizeRunConditionName(conditionId, t),
  });
}

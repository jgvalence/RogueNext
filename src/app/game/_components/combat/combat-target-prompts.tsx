"use client";

import { useTranslation } from "react-i18next";
import type { CardDefinition } from "@/game/schemas/cards";
import type { UsableItemDefinition } from "@/game/schemas/items";
import type { InkPowerType } from "@/game/schemas/enums";
import { localizeCardName } from "@/lib/i18n/card-text";
import { localizeUsableItemName } from "@/lib/i18n/entity-text";

interface CombatTargetPromptsProps {
  needsTarget: boolean;
  selectedCardId: string | null;
  selectingAllyTarget: boolean;
  selectedDef: CardDefinition | null;
  selfCanRetargetToAlly: boolean;
  needsItemEnemyTarget: boolean;
  selectedUsableItemDef: UsableItemDefinition | null | undefined;
  pendingEnemyTargetInkPower: InkPowerType | null;
  isSelectingCheatKillTarget: boolean;
}

export function CombatTargetPrompts({
  needsTarget,
  selectedCardId,
  selectingAllyTarget,
  selectedDef,
  selfCanRetargetToAlly,
  needsItemEnemyTarget,
  selectedUsableItemDef,
  pendingEnemyTargetInkPower,
  isSelectingCheatKillTarget,
}: CombatTargetPromptsProps) {
  const { t } = useTranslation();

  return (
    <>
      {needsTarget && selectedCardId && (
        <div className="relative z-10 hidden animate-bounce pb-1 text-xs font-semibold text-yellow-300 lg:block lg:text-sm">
          {selectingAllyTarget
            ? t("combat.chooseAllyFor")
            : t("combat.chooseTargetFor")}
          <span className="text-white">
            {selectedDef ? localizeCardName(selectedDef, t) : ""}
          </span>
        </div>
      )}
      {!needsTarget && selectedCardId && (
        <div className="relative z-10 hidden pb-1 text-[10px] font-semibold text-cyan-300 lg:block lg:text-xs">
          {selfCanRetargetToAlly
            ? t("combat.tapSelfOrAlly")
            : t("combat.tapToPlay")}
        </div>
      )}
      {needsItemEnemyTarget && selectedUsableItemDef && (
        <div className="relative z-10 hidden animate-bounce pb-1 text-xs font-semibold text-orange-300 lg:block lg:text-sm">
          {t("combat.chooseEnemyFor")}{" "}
          <span className="text-white">
            {localizeUsableItemName(
              selectedUsableItemDef.id,
              selectedUsableItemDef.name
            )}
          </span>
        </div>
      )}
      {pendingEnemyTargetInkPower && (
        <div className="relative z-10 hidden animate-bounce pb-1 text-xs font-semibold text-cyan-300 lg:block lg:text-sm">
          {t("combat.chooseEnemyFor")}{" "}
          <span className="text-white">
            {t(
              `inkGauge.powers.${pendingEnemyTargetInkPower}.label`,
              pendingEnemyTargetInkPower
            )}
          </span>
        </div>
      )}
      {isSelectingCheatKillTarget && (
        <div className="relative z-10 hidden animate-bounce pb-1 text-xs font-semibold text-rose-300 lg:block lg:text-sm">
          {t("combat.devChooseEnemy")}
        </div>
      )}
    </>
  );
}

"use client";

import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils/cn";
import type { CombatState } from "@/game/schemas/combat-state";
import type { InkPowerType } from "@/game/schemas/enums";
import type {
  UsableItemDefinition,
  UsableItemInstance,
} from "@/game/schemas/items";
import { localizeUsableItemName } from "@/lib/i18n/entity-text";
import { RogueButton } from "@/components/ui/rogue";
import { InkGauge } from "./InkGauge";

interface MobileInkPanelOverlayProps {
  isOpen: boolean;
  combat: CombatState;
  unlockedInkPowers?: InkPowerType[];
  allowedInkPowers?: InkPowerType[] | null;
  onUsePower: (power: InkPowerType) => void;
  onClose: () => void;
}

export function MobileInkPanelOverlay({
  isOpen,
  combat,
  unlockedInkPowers,
  allowedInkPowers = null,
  onUsePower,
  onClose,
}: MobileInkPanelOverlayProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div
      data-keep-selection="true"
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/65 p-3 lg:hidden"
      onClick={onClose}
    >
      <div
        data-keep-selection="true"
        className="w-full max-w-sm rounded-xl border border-cyan-700/60 bg-slate-950/95 p-3 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <InkGauge
          player={combat.player}
          combatState={combat}
          onUsePower={onUsePower}
          unlockedPowers={unlockedInkPowers}
          allowedPowers={allowedInkPowers}
        />
        <RogueButton
          type="text"
          data-keep-selection="true"
          className="!mt-2 !h-auto !w-full !rounded !border !border-slate-600 !px-2 !py-1.5 !text-xs !font-semibold !text-slate-200 hover:!border-slate-400"
          onClick={onClose}
        >
          {t("common.close")}
        </RogueButton>
      </div>
    </div>
  );
}

interface MobileInventoryPanelOverlayProps {
  isOpen: boolean;
  usableItems: UsableItemInstance[];
  usableItemDefs: Map<string, UsableItemDefinition>;
  selectedUsableItemId: string | null;
  canAct: boolean;
  onUseItem: (itemInstanceId: string) => void;
  onClose: () => void;
}

export function MobileInventoryPanelOverlay({
  isOpen,
  usableItems,
  usableItemDefs,
  selectedUsableItemId,
  canAct,
  onUseItem,
  onClose,
}: MobileInventoryPanelOverlayProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div
      data-keep-selection="true"
      className="fixed inset-0 z-[90] flex items-end lg:hidden"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        data-keep-selection="true"
        className="w-full rounded-t-3xl border-t border-amber-700/60 bg-slate-950 px-4 pb-6 pt-3 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-700" />
        {usableItems.length === 0 ? (
          <div className="rounded-xl border border-amber-900/60 bg-slate-900/70 px-3 py-2 text-sm font-semibold text-amber-200/60">
            {t("combat.inventoryEmpty")}
          </div>
        ) : (
          <div className="max-h-[45vh] space-y-2 overflow-y-auto pr-1">
            {usableItems.map((item) => {
              const def = usableItemDefs.get(item.definitionId);
              if (!def) return null;
              const isSelected = selectedUsableItemId === item.instanceId;
              return (
                <RogueButton
                  key={item.instanceId}
                  type="text"
                  data-keep-selection="true"
                  onClick={() => onUseItem(item.instanceId)}
                  className={cn(
                    "!h-auto !w-full !rounded-xl !border !px-3 !py-2 !text-left !text-xs !font-semibold !uppercase !tracking-wide",
                    isSelected
                      ? "!border-amber-300 !bg-amber-700/50 !text-amber-100"
                      : "!border-amber-700/70 !bg-slate-900/80 !text-amber-200",
                    !canAct && "!cursor-not-allowed !opacity-50"
                  )}
                  disabled={!canAct}
                >
                  {localizeUsableItemName(def.id, def.name)}
                </RogueButton>
              );
            })}
          </div>
        )}
        <RogueButton
          type="text"
          data-keep-selection="true"
          className="!mt-3 !h-auto !w-full !rounded-xl !border !border-slate-600 !bg-slate-800 !px-2 !py-2 !text-sm !font-semibold !text-slate-200"
          onClick={onClose}
        >
          {t("common.close")}
        </RogueButton>
      </div>
    </div>
  );
}

"use client";

import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils/cn";
import type { CombatState } from "@/game/schemas/combat-state";
import type { InkPowerType, BiomeType } from "@/game/schemas/enums";
import type {
  UsableItemDefinition,
  UsableItemInstance,
} from "@/game/schemas/items";
import { localizeUsableItemName } from "@/lib/i18n/entity-text";
import { RogueButton } from "@/components/ui/rogue";
import { InkGauge } from "./InkGauge";
import { getCombatBiomeTheme } from "./combat-biome-theme";

interface MobileInkPanelOverlayProps {
  isOpen: boolean;
  combat: CombatState;
  biome?: BiomeType;
  unlockedInkPowers?: InkPowerType[];
  allowedInkPowers?: InkPowerType[] | null;
  onUsePower: (power: InkPowerType) => void;
  onClose: () => void;
}

export function MobileInkPanelOverlay({
  isOpen,
  combat,
  biome = "LIBRARY",
  unlockedInkPowers,
  allowedInkPowers = null,
  onUsePower,
  onClose,
}: MobileInkPanelOverlayProps) {
  const { t } = useTranslation();
  const theme = getCombatBiomeTheme(biome);

  if (!isOpen) return null;

  return (
    <div
      data-keep-selection="true"
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/65 p-3 lg:hidden"
      onClick={onClose}
    >
      <div
        data-keep-selection="true"
        className={cn(
          "w-full max-w-sm rounded-xl border p-3 shadow-2xl",
          theme.drawerShell
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className={cn("mx-auto mb-3 h-1.5 w-12 rounded-full", theme.drawerHandle)}
        />
        <InkGauge
          player={combat.player}
          combatState={combat}
          onUsePower={onUsePower}
          unlockedPowers={unlockedInkPowers}
          allowedPowers={allowedInkPowers}
          shellClassName={theme.inkGaugeShell}
          labelClassName={theme.inkGaugeLabel}
          fillClassName={theme.inkGaugeFill}
          readyPowerClassName={theme.inkPowerReady}
        />
        <RogueButton
          type="text"
          data-keep-selection="true"
          className={cn(
            "!mt-2 !h-auto !w-full !rounded !border !px-2 !py-1.5 !text-xs !font-semibold",
            theme.drawerClose
          )}
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
  biome?: BiomeType;
  usableItems: UsableItemInstance[];
  usableItemDefs: Map<string, UsableItemDefinition>;
  selectedUsableItemId: string | null;
  canAct: boolean;
  onUseItem: (itemInstanceId: string) => void;
  onClose: () => void;
}

export function MobileInventoryPanelOverlay({
  isOpen,
  biome = "LIBRARY",
  usableItems,
  usableItemDefs,
  selectedUsableItemId,
  canAct,
  onUseItem,
  onClose,
}: MobileInventoryPanelOverlayProps) {
  const { t } = useTranslation();
  const theme = getCombatBiomeTheme(biome);

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
        className={cn(
          "w-full rounded-t-3xl border-t px-4 pb-6 pt-3 shadow-2xl",
          theme.drawerShell
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={cn("mx-auto mb-3 h-1 w-10 rounded-full", theme.drawerHandle)} />
        {usableItems.length === 0 ? (
          <div
            className={cn(
              "rounded-xl border px-3 py-2 text-sm font-semibold",
              theme.inventoryButton
            )}
          >
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
                      ? theme.inventoryButtonSelected
                      : theme.inventoryButton,
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
          className={cn(
            "!mt-3 !h-auto !w-full !rounded-xl !border !px-2 !py-2 !text-sm !font-semibold",
            theme.drawerClose
          )}
          onClick={onClose}
        >
          {t("common.close")}
        </RogueButton>
      </div>
    </div>
  );
}

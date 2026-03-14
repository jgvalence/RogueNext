"use client";

import type { ReactNode, RefObject } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils/cn";
import type { CombatState } from "@/game/schemas/combat-state";
import type { AllyDefinition, EnemyDefinition } from "@/game/schemas/entities";
import type { BiomeType } from "@/game/schemas/enums";
import { COMBAT_BACKGROUNDS } from "@/lib/assets";
import { FirstCombatTutorialOverlay } from "./first-combat-tutorial";
import { CombatMobileGrid } from "./combat-mobile-grid";
import { CombatDesktopGrid } from "./combat-desktop-grid";
import { getCombatBiomeTheme } from "./combat-biome-theme";

interface CombatBattlefieldProps {
  biome: BiomeType;
  bgFailed: boolean;
  onBackgroundError: () => void;
  turnNumber: number;
  turnBadgeClass: string;
  turnLabel: string;
  isFirstCombatTutorialVisible: boolean;
  firstCombatTutorialCurrentStep: string;
  firstCombatTutorialStepIndex: number;
  firstCombatTutorialTotalSteps: number;
  isLastFirstCombatTutorialStep: boolean;
  isNextFirstCombatTutorialDisabled?: boolean;
  onDismissFirstCombatTutorial: () => void;
  onPreviousFirstCombatTutorial: () => void;
  onNextFirstCombatTutorial: () => void;
  summonAnnouncement: string | null;
  enemyRowRef: RefObject<HTMLDivElement | null>;
  combat: CombatState;
  allyDefs: Map<string, AllyDefinition>;
  enemyDefs: Map<string, EnemyDefinition>;
  selectingEnemyTarget: boolean;
  selectingAllyTarget: boolean;
  selfCanRetargetToAlly: boolean;
  selectedCardId: string | null;
  actingEnemyId: string | null;
  attackingEnemyId: string | null;
  isSelectingCheatKillTarget: boolean;
  newlySummonedIds: Set<string>;
  enemyArtFailures: Set<string>;
  attackBonus: number;
  playerHit: boolean;
  avatarFailed: boolean;
  onAvatarError: () => void;
  onMobileAllyPress: (allyInstanceId: string) => void;
  onMobileEnemyPress: (enemyInstanceId: string) => void;
  onOpenPlayerInfo: () => void;
  getEnemyDisplayName: (enemy: CombatState["enemies"][number]) => string;
  markEnemyArtFailure: (enemyDefinitionId: string) => void;
  isArmorTutorialStep: boolean;
  allySlots: Array<CombatState["allies"][number] | null>;
  enemySlots: Array<CombatState["enemies"][number] | null>;
  incomingDamage: {
    player: {
      total: number;
      hpLoss: number;
    };
    allies: Record<
      string,
      {
        total: number;
        hpLoss: number;
      }
    >;
  };
  incomingDamageByEnemyId: Map<string, number>;
  onAllyClick: (allyInstanceId: string) => void;
  onEnemyClick: (enemyInstanceId: string) => void;
  isIncomingDamageTutorialStep: boolean;
  children?: ReactNode;
}

export function CombatBattlefield({
  biome,
  bgFailed,
  onBackgroundError,
  turnNumber,
  turnBadgeClass,
  turnLabel,
  isFirstCombatTutorialVisible,
  firstCombatTutorialCurrentStep,
  firstCombatTutorialStepIndex,
  firstCombatTutorialTotalSteps,
  isLastFirstCombatTutorialStep,
  isNextFirstCombatTutorialDisabled = false,
  onDismissFirstCombatTutorial,
  onPreviousFirstCombatTutorial,
  onNextFirstCombatTutorial,
  summonAnnouncement,
  enemyRowRef,
  combat,
  allyDefs,
  enemyDefs,
  selectingEnemyTarget,
  selectingAllyTarget,
  selfCanRetargetToAlly,
  selectedCardId,
  actingEnemyId,
  attackingEnemyId,
  isSelectingCheatKillTarget,
  newlySummonedIds,
  enemyArtFailures,
  attackBonus,
  playerHit,
  avatarFailed,
  onAvatarError,
  onMobileAllyPress,
  onMobileEnemyPress,
  onOpenPlayerInfo,
  getEnemyDisplayName,
  markEnemyArtFailure,
  isArmorTutorialStep,
  allySlots,
  enemySlots,
  incomingDamage,
  incomingDamageByEnemyId,
  onAllyClick,
  onEnemyClick,
  isIncomingDamageTutorialStep,
  children,
}: CombatBattlefieldProps) {
  const { t } = useTranslation();
  const theme = getCombatBiomeTheme(biome);

  return (
    <div
      className={cn(
        "relative flex min-h-0 flex-1 flex-col items-center justify-between overflow-hidden px-1.5 py-2 lg:px-6 lg:py-4 [@media(max-height:540px)]:px-1 [@media(max-height:540px)]:py-0.75",
        theme.sceneBase
      )}
    >
      {!bgFailed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={COMBAT_BACKGROUNDS[biome]}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-30 mix-blend-screen"
          onError={onBackgroundError}
        />
      )}
      <div
        className={cn("pointer-events-none absolute inset-0", theme.sceneAtmosphere)}
      />
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b",
          theme.sceneTopGlow
        )}
      />
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t",
          theme.sceneBottomGlow
        )}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/8" />

      <div className="relative z-10 flex items-center gap-1.5 self-start lg:gap-2 [@media(max-height:540px)]:hidden">
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[10px] font-medium lg:px-2 lg:text-xs",
            theme.turnChip,
            theme.turnFrame
          )}
        >
          {t("combat.turn")} {turnNumber}
        </span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition-colors lg:px-3 lg:text-xs lg:tracking-widest",
            theme.turnFrame,
            turnBadgeClass
          )}
        >
          {turnLabel}
        </span>
      </div>

      <FirstCombatTutorialOverlay
        isVisible={isFirstCombatTutorialVisible}
        currentStep={firstCombatTutorialCurrentStep}
        stepIndex={firstCombatTutorialStepIndex}
        totalSteps={firstCombatTutorialTotalSteps}
        isLastStep={isLastFirstCombatTutorialStep}
        isNextDisabled={isNextFirstCombatTutorialDisabled}
        onSkip={onDismissFirstCombatTutorial}
        onPrevious={onPreviousFirstCombatTutorial}
        onNext={onNextFirstCombatTutorial}
      />

      {summonAnnouncement && (
        <div
          className={cn(
            "pointer-events-none absolute left-1/2 top-2 z-20 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-semibold",
            theme.summonBanner
          )}
        >
          {summonAnnouncement}
        </div>
      )}

      <div
        ref={enemyRowRef}
        className="relative z-10 flex min-h-[176px] w-full flex-1 items-center justify-center py-1 lg:min-h-0 lg:py-4 [@media(max-height:540px)]:min-h-[150px]"
      >
        <CombatMobileGrid
          combat={combat}
          allyDefs={allyDefs}
          enemyDefs={enemyDefs}
          selectingEnemyTarget={selectingEnemyTarget}
          selectingAllyTarget={selectingAllyTarget}
          selfCanRetargetToAlly={selfCanRetargetToAlly}
          selectedCardId={selectedCardId}
          actingEnemyId={actingEnemyId}
          attackingEnemyId={attackingEnemyId}
          isSelectingCheatKillTarget={isSelectingCheatKillTarget}
          newlySummonedIds={newlySummonedIds}
          enemyArtFailures={enemyArtFailures}
          attackBonus={attackBonus}
          playerHit={playerHit}
          avatarFailed={avatarFailed}
          onAvatarError={onAvatarError}
          onMobileAllyPress={onMobileAllyPress}
          onMobileEnemyPress={onMobileEnemyPress}
          onOpenPlayerInfo={onOpenPlayerInfo}
          getEnemyDisplayName={getEnemyDisplayName}
          markEnemyArtFailure={markEnemyArtFailure}
          isArmorTutorialStep={isArmorTutorialStep}
        />

        <CombatDesktopGrid
          combat={combat}
          allySlots={allySlots}
          enemySlots={enemySlots}
          allyDefs={allyDefs}
          enemyDefs={enemyDefs}
          selectingEnemyTarget={selectingEnemyTarget}
          selectingAllyTarget={selectingAllyTarget}
          selfCanRetargetToAlly={selfCanRetargetToAlly}
          selectedCardId={selectedCardId}
          actingEnemyId={actingEnemyId}
          attackingEnemyId={attackingEnemyId}
          isSelectingCheatKillTarget={isSelectingCheatKillTarget}
          newlySummonedIds={newlySummonedIds}
          enemyArtFailures={enemyArtFailures}
          incomingDamage={incomingDamage}
          incomingDamageByEnemyId={incomingDamageByEnemyId}
          attackBonus={attackBonus}
          playerHit={playerHit}
          avatarFailed={avatarFailed}
          onAvatarError={onAvatarError}
          markEnemyArtFailure={markEnemyArtFailure}
          getEnemyDisplayName={getEnemyDisplayName}
          onAllyClick={onAllyClick}
          onEnemyClick={onEnemyClick}
          isArmorTutorialStep={isArmorTutorialStep}
          isIncomingDamageTutorialStep={isIncomingDamageTutorialStep}
        />
      </div>

      {children}
    </div>
  );
}

"use client";

import type { ReactNode, RefObject } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils/cn";
import type { CombatState } from "@/game/schemas/combat-state";
import type { AllyDefinition, EnemyDefinition } from "@/game/schemas/entities";
import type { BiomeType } from "@/game/schemas/enums";
import { COMBAT_BACKGROUNDS, COMBAT_BACKGROUND_FALLBACKS } from "@/lib/assets";

import { BossMechanicsPanel } from "./BossMechanicsPanel";
import { BiomeSceneSilhouette } from "./BiomeSceneSilhouette";
import { CombatMobileGrid } from "./combat-mobile-grid";
import { CombatDesktopGrid } from "./combat-desktop-grid";
import {
  getCombatBiomeTheme,
  getCombatSceneDepthTheme,
} from "./combat-biome-theme";

interface CombatBattlefieldProps {
  characterId?: string;
  biome: BiomeType;
  bgFailed: boolean;
  onBackgroundError: () => void;
  turnNumber: number;
  turnBadgeClass: string;
  turnLabel: string;
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
  aoeFlashMap: Map<string, { delay: number; color: string }>;
  children?: ReactNode;
}

export function CombatBattlefield({
  characterId,
  biome,
  bgFailed,
  onBackgroundError,
  turnNumber,
  turnBadgeClass,
  turnLabel,
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
  aoeFlashMap,
  children,
}: CombatBattlefieldProps) {
  const { t } = useTranslation();
  const theme = getCombatBiomeTheme(biome);
  const depthTheme = getCombatSceneDepthTheme(biome);

  return (
    <div
      data-battlefield={biome}
      className={cn(
        "[@media(max-height:540px)]:py-0.75 relative flex min-h-0 flex-1 flex-col items-center justify-between overflow-hidden px-1.5 py-2 lg:px-6 lg:py-4 [@media(max-height:540px)]:px-1",
        theme.sceneBase
      )}
    >
      <picture>
        {!bgFailed && (
          <source
            media="(max-width: 1023px)"
            srcSet={COMBAT_BACKGROUNDS[biome].replace(
              "-v2.webp",
              "-mobile-v2.webp"
            )}
          />
        )}
        <img
          src={
            bgFailed
              ? COMBAT_BACKGROUND_FALLBACKS[biome]
              : COMBAT_BACKGROUNDS[biome]
          }
          alt=""
          aria-hidden
          className="combat-scene-art pointer-events-none absolute inset-0 h-full w-full object-cover"
          onError={onBackgroundError}
        />
      </picture>
      <div
        className={cn(
          "combat-scene-atmosphere pointer-events-none absolute inset-0",
          theme.sceneAtmosphere
        )}
      />
      {bgFailed && <BiomeSceneSilhouette biome={biome} />}
      <div
        aria-hidden="true"
        data-testid="combat-horizon"
        className={cn(
          "pointer-events-none absolute inset-x-0 top-[38%] h-24 bg-gradient-to-b",
          depthTheme.horizon
        )}
      />
      <div
        aria-hidden="true"
        data-testid="combat-ground"
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 h-[48%] bg-gradient-to-b",
          depthTheme.ground
        )}
      >
        <div
          className={cn(
            "absolute inset-x-[8%] top-0 h-px bg-gradient-to-r",
            depthTheme.groundLight
          )}
        />
        <div className="absolute inset-x-[5%] top-[18%] h-[70%] rounded-[50%] border-t border-white/[0.035] bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.035),transparent_68%)] [transform:perspective(420px)_rotateX(58deg)]" />
      </div>
      <div
        aria-hidden="true"
        data-testid="combat-atmosphere-motes"
        className="pointer-events-none absolute inset-0 overflow-hidden motion-reduce:hidden"
      >
        {[
          ["18%", "23%", "2px", "0s"],
          ["34%", "14%", "1px", "1.7s"],
          ["57%", "26%", "2px", "3.1s"],
          ["76%", "17%", "1px", "0.8s"],
          ["86%", "34%", "2px", "2.4s"],
        ].map(([left, top, size, delay]) => (
          <span
            key={`${left}-${top}`}
            className={cn(
              "absolute animate-pulse rounded-full opacity-30 blur-[0.5px]",
              depthTheme.motes
            )}
            style={{
              left,
              top,
              width: size,
              height: size,
              animationDelay: delay,
            }}
          />
        ))}
      </div>
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
      <div className="bg-white/8 pointer-events-none absolute inset-x-0 top-0 h-px" />

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

      <BossMechanicsPanel combat={combat} />

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
        className="relative z-10 flex min-h-0 w-full flex-1 overflow-hidden lg:items-center lg:justify-center lg:overflow-visible lg:py-4"
      >
        <CombatMobileGrid
          characterId={characterId}
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
          aoeFlashMap={aoeFlashMap}
          incomingDamageByEnemyId={incomingDamageByEnemyId}
        />

        <CombatDesktopGrid
          characterId={characterId}
          contactShadowClass={depthTheme.contactShadow}
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
          aoeFlashMap={aoeFlashMap}
        />
      </div>

      {children}
    </div>
  );
}

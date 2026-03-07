"use client";

import { useTranslation } from "react-i18next";
import type { RoomNode } from "@/game/schemas/run-state";
import type { BiomeType } from "@/game/schemas/enums";
import type { EnemyDefinition } from "@/game/schemas/entities";
import { cn } from "@/lib/utils/cn";
import { GAME_CONSTANTS } from "@/game/constants";
import { BIOME_RESOURCE } from "@/game/engine/meta";
import { RogueButton, RogueTag, RogueTooltip } from "@/components/ui/rogue";

interface FloorMapProps {
  map: RoomNode[][];
  currentRoom: number;
  floor: number;
  currentBiome: BiomeType;
  enemyDefs: Map<string, EnemyDefinition>;
  onSelectRoom: (choiceIndex: number) => void;
  showFirstMapTutorial?: boolean;
  forcedChoiceIndex?: number | null;
  onDismissFirstMapTutorial?: () => void;
}

// === Config visuel pour les cartes de choix ===
const roomCardConfig: Record<
  string,
  {
    icon: string;
    accentBar: string;
    iconRing: string;
    iconText: string;
    hoverBorder: string;
    hoverBg: string;
    hoverShadow: string;
  }
> = {
  COMBAT: {
    icon: "⚔",
    accentBar: "bg-red-400/50",
    iconRing: "border-red-500/35 bg-red-950/60",
    iconText: "text-red-300",
    hoverBorder: "hover:border-red-500/30",
    hoverBg: "hover:bg-red-950/15",
    hoverShadow: "hover:shadow-[0_0_24px_rgba(239,68,68,0.07)]",
  },
  COMBAT_BOSS: {
    icon: "☠",
    accentBar: "bg-red-300/70",
    iconRing: "border-red-400/55 bg-red-900/70",
    iconText: "text-red-200",
    hoverBorder: "hover:border-red-400/50",
    hoverBg: "hover:bg-red-900/20",
    hoverShadow: "hover:shadow-[0_0_36px_rgba(239,68,68,0.14)]",
  },
  MERCHANT: {
    icon: "◉",
    accentBar: "bg-yellow-400/50",
    iconRing: "border-yellow-500/35 bg-yellow-950/60",
    iconText: "text-yellow-300",
    hoverBorder: "hover:border-yellow-500/30",
    hoverBg: "hover:bg-yellow-950/15",
    hoverShadow: "hover:shadow-[0_0_24px_rgba(234,179,8,0.07)]",
  },
  SPECIAL: {
    icon: "✦",
    accentBar: "bg-purple-400/50",
    iconRing: "border-purple-500/35 bg-purple-950/60",
    iconText: "text-purple-300",
    hoverBorder: "hover:border-purple-500/30",
    hoverBg: "hover:bg-purple-950/15",
    hoverShadow: "hover:shadow-[0_0_24px_rgba(168,85,247,0.07)]",
  },
  PRE_BOSS: {
    icon: "◈",
    accentBar: "bg-amber-400/50",
    iconRing: "border-amber-500/35 bg-amber-950/60",
    iconText: "text-amber-300",
    hoverBorder: "hover:border-amber-500/30",
    hoverBg: "hover:bg-amber-950/15",
    hoverShadow: "hover:shadow-[0_0_24px_rgba(245,158,11,0.07)]",
  },
};

// === Style des badges d'historique (barre de progression) ===
function getHistoryBadge(room: RoomNode, isBossSlot: boolean) {
  if (room.type === "COMBAT" && isBossSlot) {
    return {
      icon: "☠",
      style: "border-red-400/45 bg-red-950/70 text-red-200",
    };
  }
  if (room.type === "COMBAT" && room.isElite) {
    return {
      icon: "★",
      style: "border-orange-400/45 bg-orange-950/70 text-orange-300",
    };
  }
  if (room.type === "COMBAT") {
    return {
      icon: "⚔",
      style: "border-red-500/25 bg-red-950/50 text-red-400/80",
    };
  }
  if (room.type === "MERCHANT") {
    return {
      icon: "◉",
      style: "border-yellow-500/25 bg-yellow-950/50 text-yellow-400/80",
    };
  }
  if (room.type === "SPECIAL") {
    return {
      icon: "✦",
      style: "border-purple-500/25 bg-purple-950/50 text-purple-400/80",
    };
  }
  if (room.type === "PRE_BOSS") {
    return {
      icon: "◈",
      style: "border-amber-500/25 bg-amber-950/50 text-amber-400/80",
    };
  }
  return {
    icon: "·",
    style: "border-amber-100/10 bg-transparent text-amber-100/20",
  };
}

export function FloorMap({
  map,
  currentRoom,
  floor,
  currentBiome,
  enemyDefs,
  onSelectRoom,
  showFirstMapTutorial = false,
  forcedChoiceIndex = null,
  onDismissFirstMapTutorial,
}: FloorMapProps) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center gap-10 px-6 py-12">
      {/* ── En-tête ── */}
      <div className="flex w-full max-w-2xl flex-col items-center gap-4">
        <div className="inline-flex items-center rounded border border-amber-200/20 bg-amber-200/10 px-4 py-1.5">
          <span className="font-[family-name:var(--font-cinzel)] text-xs font-semibold uppercase tracking-[0.55em] text-amber-400/70">
            {t("map.floorLabel", { floor })}
          </span>
        </div>

        <div className="h-px w-32 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

        <h2 className="font-[family-name:var(--font-cinzel)] text-4xl font-bold uppercase tracking-[0.08em] text-amber-100">
          {t("map.choosePath")}
        </h2>

        {showFirstMapTutorial && (
          <div className="w-full max-w-3xl rounded-xl border border-cyan-400/45 bg-slate-950/90 p-4 text-left shadow-[0_16px_50px_rgba(8,145,178,0.2)]">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-300/85">
              {t("map.firstMapTutorial.kicker")}
            </p>
            <h3 className="mt-1 text-sm font-black uppercase tracking-[0.08em] text-cyan-100">
              {t("map.firstMapTutorial.title")}
            </h3>
            <p className="mt-1.5 text-xs text-slate-200/90">
              {t("map.firstMapTutorial.description")}
            </p>
            <p className="mt-1.5 text-xs text-cyan-100/85">
              {t("map.firstMapTutorial.tip")}
            </p>
            {forcedChoiceIndex == null ? (
              <div className="mt-3 flex justify-end">
                <RogueButton
                  type="text"
                  className="!h-auto !rounded-md !border !border-cyan-500/65 !bg-cyan-700/25 !px-3 !py-1.5 !text-[10px] !font-bold !uppercase !tracking-[0.1em] !text-cyan-100 hover:!bg-cyan-600/35"
                  onClick={() => onDismissFirstMapTutorial?.()}
                >
                  {t("map.firstMapTutorial.gotIt")}
                </RogueButton>
              </div>
            ) : (
              <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-200/90">
                {t("map.firstMapTutorial.forcedChoice")}
              </p>
            )}
          </div>
        )}

        {currentRoom < map.length && (
          <p className="text-xs uppercase tracking-[0.4em] text-amber-100/30">
            {t("map.roomOf", {
              current: currentRoom + 1,
              total: GAME_CONSTANTS.ROOMS_PER_FLOOR,
            })}
            {currentRoom === GAME_CONSTANTS.BOSS_ROOM_INDEX &&
              ` — ${t("map.bossSuffix")}`}
          </p>
        )}
      </div>

      {/* ── Cartes de choix ── */}
      {currentRoom < map.length ? (
        <div className="flex flex-wrap justify-center gap-5">
          {(() => {
            const rawRooms = map[currentRoom] ?? [];
            const seen = new Set<string>();
            const rooms = rawRooms
              .map((room, originalIndex) => ({ room, originalIndex }))
              .filter(({ room }) => {
                if (room.type !== "COMBAT") return true;
                const key = `${room.enemyIds?.length ?? 0}-${room.isElite ? "elite" : "normal"}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
              });

            return rooms.map(({ room, originalIndex: i }) => {
              const isBossRoom = currentRoom === GAME_CONSTANTS.BOSS_ROOM_INDEX;
              const isForcedChoice =
                forcedChoiceIndex !== null && i === forcedChoiceIndex;
              const isChoiceLocked =
                forcedChoiceIndex !== null && i !== forcedChoiceIndex;
              const enemyCount = room.enemyIds?.length ?? 0;
              const baseResourceAmount = 1 + (floor - 1);
              const guaranteedResourceAmount = isBossRoom
                ? Math.round(baseResourceAmount * 3)
                : room.isElite
                  ? Math.round(baseResourceAmount * 1.5)
                  : baseResourceAmount;
              const primaryResource = BIOME_RESOURCE[currentBiome];
              const enemyGoldBonus =
                Math.max(0, enemyCount - 1) *
                GAME_CONSTANTS.GOLD_PER_EXTRA_ENEMY;
              const eliteGoldBonus = room.isElite
                ? GAME_CONSTANTS.ELITE_GOLD_BONUS
                : 0;
              const displayedGoldBonus = enemyGoldBonus + eliteGoldBonus;

              // Boss: resolve name from enemyDefs
              const bossEnemyId = isBossRoom
                ? (room.enemyIds?.[0] ?? null)
                : null;
              const bossName = bossEnemyId
                ? (enemyDefs.get(bossEnemyId)?.name ?? null)
                : null;

              const cfgKey = isBossRoom ? "COMBAT_BOSS" : room.type;
              const cfg = (roomCardConfig[cfgKey] ?? roomCardConfig.COMBAT)!;

              // Room title & subtitle
              let roomTitle: string;
              let roomSubtitle: string | null = null;
              if (isBossRoom) {
                roomTitle = bossName ?? t("map.bossSuffix");
                roomSubtitle = t("map.bossSuffix");
              } else if (room.type === "COMBAT" && room.isElite) {
                roomTitle = t("map.roomType.COMBAT_ELITE");
              } else {
                roomTitle = t(`map.roomType.${room.type}`, room.type);
              }

              return (
                <RogueButton
                  key={`${room.index}-${i}`}
                  type="text"
                  className={cn(
                    "!group !flex !h-auto !w-72 !flex-col !gap-4 !whitespace-normal !rounded-xl !border !bg-[#0A1118]/80 !p-7 !text-left !transition-all !duration-150",
                    isBossRoom ? "border-red-500/20" : "border-amber-100/12",
                    isForcedChoice &&
                      "!border-cyan-300/70 !ring-2 !ring-cyan-300/85 !ring-offset-2 !ring-offset-slate-950",
                    isChoiceLocked && "!cursor-not-allowed !opacity-45",
                    cfg.hoverBorder,
                    cfg.hoverBg,
                    cfg.hoverShadow
                  )}
                  disabled={isChoiceLocked}
                  onClick={() => onSelectRoom(i)}
                >
                  {/* Barre d'accent animée */}
                  <div
                    className={cn(
                      "h-1 w-8 rounded-full transition-all duration-200 group-hover:w-16",
                      isChoiceLocked && "group-hover:w-8",
                      cfg.accentBar
                    )}
                  />

                  {/* Icône + nom */}
                  <div className="flex w-full flex-col items-start gap-3 sm:flex-row sm:items-start sm:gap-4">
                    <div
                      className={cn(
                        "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border text-xl sm:h-14 sm:w-14 sm:text-2xl",
                        cfg.iconRing,
                        cfg.iconText
                      )}
                    >
                      {cfg.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="break-normal font-[family-name:var(--font-cinzel)] text-base font-semibold uppercase leading-snug tracking-[0.03em] text-amber-100 sm:tracking-[0.08em]">
                        {roomTitle}
                      </div>
                      {roomSubtitle && (
                        <div className="mt-0.5 break-normal text-[0.55rem] font-semibold uppercase leading-snug tracking-[0.2em] text-red-400/60 sm:tracking-[0.5em]">
                          {roomSubtitle}
                        </div>
                      )}
                      {!isBossRoom &&
                        room.type === "COMBAT" &&
                        !room.isElite &&
                        enemyCount > 0 && (
                          <div className="mt-0.5 break-words text-[0.6rem] uppercase tracking-[0.2em] text-amber-100/25 sm:tracking-[0.35em]">
                            {t("map.enemyCount", { count: enemyCount })}
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Détails pour les salles de combat */}
                  {room.type === "COMBAT" && (
                    <div className="border-amber-100/8 flex flex-col gap-2 border-t pt-3">
                      <div className="flex flex-wrap gap-1.5">
                        <RogueTag
                          bordered
                          className="rounded border-emerald-400/20 bg-emerald-950/40 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-emerald-300/80"
                        >
                          +{guaranteedResourceAmount}{" "}
                          {t(
                            `reward.resources.${primaryResource}`,
                            primaryResource
                          )}
                        </RogueTag>
                        {displayedGoldBonus > 0 && (
                          <RogueTag
                            bordered
                            className="rounded border-amber-300/20 bg-amber-950/40 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-amber-300/80"
                          >
                            +{displayedGoldBonus} {t("reward.gold")}
                          </RogueTag>
                        )}
                        <RogueTooltip
                          title={t("map.combatPreview.resourcesBonusHint")}
                        >
                          <RogueTag
                            bordered
                            className="rounded border-cyan-300/15 bg-cyan-950/30 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-cyan-300/55"
                          >
                            {t("map.combatPreview.resourcesBonusShort")}
                          </RogueTag>
                        </RogueTooltip>
                      </div>
                      <div className="flex items-center gap-1.5 text-base text-amber-100/30">
                        {isBossRoom ? (
                          <>
                            <span title={t("map.reward.relic")}>💎</span>
                            <span title={t("map.reward.ally")}>👤</span>
                            <span title={t("map.reward.maxHp")}>❤️</span>
                          </>
                        ) : room.isElite ? (
                          <>
                            <span title={t("map.reward.card")}>🃏</span>
                            <span title={t("map.reward.relic")}>💎</span>
                            <span title={t("map.reward.ally")}>👤</span>
                          </>
                        ) : (
                          <span title={t("map.reward.card")}>🃏</span>
                        )}
                      </div>
                    </div>
                  )}
                </RogueButton>
              );
            });
          })()}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="h-px w-32 bg-gradient-to-r from-transparent via-amber-500/25 to-transparent" />
          <p className="font-[family-name:var(--font-cinzel)] text-base uppercase tracking-[0.3em] text-amber-100/40">
            {t("map.floorComplete")}
          </p>
        </div>
      )}

      {/* ── Barre de progression ── */}
      <div className="flex items-center">
        {map.map((roomSlot, i) => {
          const isCompleted = i < currentRoom;
          const isCurrent = i === currentRoom;
          const completedRoom = isCompleted
            ? (roomSlot.find((r) => r.completed) ?? null)
            : null;
          const isBossSlot = i === GAME_CONSTANTS.BOSS_ROOM_INDEX;
          const badge = completedRoom
            ? getHistoryBadge(completedRoom, isBossSlot)
            : null;

          return (
            <div key={i} className="flex items-center">
              {i > 0 && (
                <div
                  className={cn(
                    "h-px w-4 sm:w-6",
                    isCompleted || isCurrent
                      ? "bg-amber-500/25"
                      : "bg-amber-100/8"
                  )}
                />
              )}
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition-all duration-200",
                  badge && badge.style,
                  isCurrent &&
                    "animate-pulse border-amber-400/60 bg-amber-950/60 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.35)]",
                  !isCompleted &&
                    !isCurrent &&
                    "border-amber-100/10 bg-transparent text-amber-100/15"
                )}
              >
                {badge ? badge.icon : isCurrent ? "◆" : "·"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

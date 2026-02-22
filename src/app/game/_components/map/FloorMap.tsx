"use client";

import { useTranslation } from "react-i18next";
import type { RoomNode } from "@/game/schemas/run-state";
import { cn } from "@/lib/utils/cn";
import { GAME_CONSTANTS } from "@/game/constants";

interface FloorMapProps {
  map: RoomNode[][];
  currentRoom: number;
  onSelectRoom: (choiceIndex: number) => void;
}

const roomEmojis: Record<string, string> = {
  COMBAT: "⚔",
  MERCHANT: "🏪",
  SPECIAL: "✨",
  PRE_BOSS: "🛡",
};

const roomColors: Record<string, string> = {
  COMBAT: "border-red-500 bg-red-950/50 text-red-400",
  MERCHANT: "border-yellow-500 bg-yellow-950/50 text-yellow-400",
  SPECIAL: "border-purple-500 bg-purple-950/50 text-purple-400",
  PRE_BOSS: "border-amber-500 bg-amber-950/50 text-amber-400",
};

export function FloorMap({ map, currentRoom, onSelectRoom }: FloorMapProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <h2 className="text-xl font-bold text-white">{t("map.choosePath")}</h2>

      {currentRoom < map.length ? (
        <div className="space-y-4">
          <p className="text-center text-sm text-gray-400">
            {t("map.roomOf", {
              current: currentRoom + 1,
              total: GAME_CONSTANTS.ROOMS_PER_FLOOR,
            })}
            {currentRoom === GAME_CONSTANTS.BOSS_ROOM_INDEX &&
              ` - ${t("map.bossSuffix")}`}
          </p>

          <div className="flex gap-4">
            {map[currentRoom]?.map((room, i) => {
              const isBossRoom = currentRoom === GAME_CONSTANTS.BOSS_ROOM_INDEX;
              const enemyCount = room.enemyIds?.length ?? 0;

              return (
                <button
                  key={`${room.index}-${i}`}
                  className={cn(
                    "flex w-40 flex-col items-center gap-2 rounded-lg border-2 p-4 transition hover:scale-105",
                    roomColors[room.type] ?? "border-gray-500 bg-gray-800"
                  )}
                  onClick={() => onSelectRoom(i)}
                >
                  <span className="text-2xl">
                    {roomEmojis[room.type] ?? "✨"}
                  </span>
                  <span className="text-sm font-medium">
                    {t(`map.roomType.${room.type}`, room.type)}
                  </span>

                  {room.type === "COMBAT" && room.isElite && (
                    <span className="rounded bg-orange-700/80 px-2 py-0.5 text-xs font-bold text-orange-100">
                      {t("map.elite")}
                    </span>
                  )}

                  {room.type === "COMBAT" &&
                    !room.isElite &&
                    enemyCount > 0 && (
                      <span className="text-xs text-gray-400">
                        {t("map.enemyCount", { count: enemyCount })}
                      </span>
                    )}

                  {room.type === "COMBAT" && (
                    <div className="flex items-center gap-1.5 rounded bg-black/20 px-2 py-1 text-sm">
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
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-gray-400">{t("map.floorComplete")}</p>
      )}

      <div className="mt-8 flex gap-2">
        {map.map((_, i) => {
          const isCompleted = i < currentRoom;
          const isCurrent = i === currentRoom;

          return (
            <div
              key={i}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded text-xs font-bold",
                isCompleted && "bg-green-800 text-green-300",
                isCurrent && "bg-white text-gray-900",
                !isCompleted && !isCurrent && "bg-gray-700 text-gray-400"
              )}
            >
              {i + 1}
            </div>
          );
        })}
      </div>
    </div>
  );
}

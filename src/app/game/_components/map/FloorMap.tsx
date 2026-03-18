"use client";

import { useTranslation } from "react-i18next";
import type { RoomNode } from "@/game/schemas/run-state";
import type { BiomeType } from "@/game/schemas/enums";
import type { EnemyDefinition } from "@/game/schemas/entities";
import {
  getBossRoomIndexForMap,
  getReachableRoomChoiceIndexes,
} from "@/game/engine/run";
import { GAME_CONSTANTS } from "@/game/constants";
import { BIOME_RESOURCE } from "@/game/engine/meta";
import { cn } from "@/lib/utils/cn";
import { RogueButton, RogueTag } from "@/components/ui/rogue";

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

type PositionedRoom = {
  room: RoomNode;
  choiceIndex: number;
  depthIndex: number;
  nodeId: string;
  lane: number;
  x: number;
  y: number;
};

type PositionedConnection = {
  key: string;
  path: string;
  isActive: boolean;
  isCompleted: boolean;
  isReachableBranch: boolean;
  isFutureBranch: boolean;
};

type LegendEntry = {
  key: string;
  label: string;
  room: RoomNode;
  isBossRoom?: boolean;
};

const LANE_WIDTH = 132;
const DEPTH_HEIGHT = 74;
const NODE_SIZE = 52;
const MAP_PADDING_X = 64;
const MAP_PADDING_Y = 40;

function getFallbackLane(choiceIndex: number, slotLength: number): number {
  if (slotLength <= 1) return 2;
  if (slotLength === 2) return choiceIndex === 0 ? 1 : 3;
  if (slotLength === 3) return [0, 2, 4][choiceIndex] ?? 2;
  if (slotLength === 4) return [0, 1, 3, 4][choiceIndex] ?? 2;
  return Math.min(GAME_CONSTANTS.MAP_LANES - 1, choiceIndex);
}

function getNodeId(room: RoomNode, choiceIndex: number): string {
  return room.nodeId ?? `${room.index}-${choiceIndex}`;
}

function getNodeLane(
  room: RoomNode,
  choiceIndex: number,
  slot: RoomNode[]
): number {
  if (
    room.nodeId ||
    (room.nextNodeIds?.length ?? 0) > 0 ||
    (room.lane ?? 0) > 0
  ) {
    return room.lane ?? 0;
  }
  return getFallbackLane(choiceIndex, slot.length);
}

function getNodeTone(room: RoomNode, isBossRoom: boolean) {
  if (isBossRoom) {
    return {
      border: "border-red-300/60",
      bg: "bg-[radial-gradient(circle_at_top,_rgba(248,113,113,0.22),_rgba(69,10,10,0.96)_72%)]",
      text: "text-red-100",
      glow: "shadow-[0_0_34px_rgba(248,113,113,0.22)]",
    };
  }
  if (room.type === "PRE_BOSS") {
    return {
      border: "border-amber-300/60",
      bg: "bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.18),_rgba(68,39,5,0.96)_74%)]",
      text: "text-amber-100",
      glow: "shadow-[0_0_28px_rgba(245,158,11,0.18)]",
    };
  }
  if (room.type === "MERCHANT") {
    return {
      border: "border-yellow-300/55",
      bg: "bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.18),_rgba(66,32,6,0.95)_74%)]",
      text: "text-yellow-100",
      glow: "shadow-[0_0_24px_rgba(250,204,21,0.15)]",
    };
  }
  if (room.type === "SPECIAL") {
    if (room.specialType === "HEAL") {
      return {
        border: "border-emerald-300/55",
        bg: "bg-[radial-gradient(circle_at_top,_rgba(74,222,128,0.18),_rgba(6,46,32,0.96)_74%)]",
        text: "text-emerald-100",
        glow: "shadow-[0_0_24px_rgba(74,222,128,0.16)]",
      };
    }
    if (room.specialType === "UPGRADE") {
      return {
        border: "border-indigo-300/55",
        bg: "bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.2),_rgba(30,27,75,0.96)_74%)]",
        text: "text-indigo-100",
        glow: "shadow-[0_0_24px_rgba(129,140,248,0.17)]",
      };
    }
    return {
      border: "border-cyan-300/55",
      bg: "bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.2),_rgba(8,47,73,0.96)_74%)]",
      text: "text-cyan-100",
      glow: "shadow-[0_0_24px_rgba(34,211,238,0.16)]",
    };
  }
  if (room.isElite) {
    return {
      border: "border-orange-300/60",
      bg: "bg-[radial-gradient(circle_at_top,_rgba(251,146,60,0.2),_rgba(67,20,7,0.96)_74%)]",
      text: "text-orange-100",
      glow: "shadow-[0_0_26px_rgba(251,146,60,0.18)]",
    };
  }
  return {
    border: "border-slate-300/35",
    bg: "bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.14),_rgba(15,23,42,0.96)_74%)]",
    text: "text-slate-100",
    glow: "shadow-[0_0_18px_rgba(148,163,184,0.1)]",
  };
}

function getRoomTitle(
  room: RoomNode,
  isBossRoom: boolean,
  enemyDefs: Map<string, EnemyDefinition>,
  t: ReturnType<typeof useTranslation>["t"]
): string {
  if (isBossRoom) {
    const bossEnemyId = room.enemyIds?.[0];
    return bossEnemyId
      ? (enemyDefs.get(bossEnemyId)?.name ?? t("map.bossSuffix"))
      : t("map.bossSuffix");
  }
  if (room.type === "COMBAT" && room.isElite) {
    return t("map.roomType.COMBAT_ELITE");
  }
  if (room.type === "SPECIAL") {
    if (room.specialType === "HEAL") {
      return t("map.roomType.SPECIAL_HEAL");
    }
    if (room.specialType === "UPGRADE") {
      return t("map.roomType.SPECIAL_UPGRADE");
    }
    return t("map.roomType.SPECIAL_EVENT");
  }
  return t(`map.roomType.${room.type}`, room.type);
}

function getRoomShortLabel(room: RoomNode, isBossRoom: boolean): string {
  if (isBossRoom) return "BOSS";
  if (room.type === "PRE_BOSS") return "GATE";
  if (room.type === "MERCHANT") return "SHOP";
  if (room.type === "SPECIAL") {
    if (room.specialType === "HEAL") return "REST";
    if (room.specialType === "UPGRADE") return "FORGE";
    return "EVENT";
  }
  if (room.isElite) return "ELITE";
  return room.index === 0 ? "START" : "FIGHT";
}

function getRoomChoiceTag(room: RoomNode): string {
  if (room.type === "MERCHANT") return "Purge / Buy";
  if (room.type === "SPECIAL") {
    if (room.specialType === "HEAL") return "Recover / Purge";
    if (room.specialType === "UPGRADE") return "Upgrade / Polish";
    return "Build / Pivot";
  }
  return "Build / Pivot";
}

function NodeGlyph({
  room,
  isBossRoom,
  className = "h-5 w-5",
}: {
  room: RoomNode;
  isBossRoom: boolean;
  className?: string;
}) {
  const commonProps = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (isBossRoom) {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path
          d="M12 3 14.8 8.2 20 9l-3.8 3.7.9 5.3L12 15.4 6.9 18l.9-5.3L4 9l5.2-.8L12 3Z"
          {...commonProps}
        />
      </svg>
    );
  }

  if (room.type === "PRE_BOSS") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path
          d="M7 20V9.5A5 5 0 0 1 12 5a5 5 0 0 1 5 4.5V20"
          {...commonProps}
        />
        <path d="M9.5 20v-6h5v6" {...commonProps} />
      </svg>
    );
  }

  if (room.type === "MERCHANT") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <ellipse cx="12" cy="7" rx="5.5" ry="2.5" {...commonProps} />
        <path
          d="M6.5 7v4c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5V7"
          {...commonProps}
        />
        <path
          d="M8.5 13.2V17c0 .9 1.6 1.7 3.5 1.7s3.5-.8 3.5-1.7v-3.8"
          {...commonProps}
        />
      </svg>
    );
  }

  if (room.type === "SPECIAL") {
    if (room.specialType === "HEAL") {
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path d="M12 6v12M6 12h12" {...commonProps} />
        </svg>
      );
    }

    if (room.specialType === "UPGRADE") {
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path d="m7 15 5-6 5 6" {...commonProps} />
          <path d="M12 9v9" {...commonProps} />
        </svg>
      );
    }

    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path
          d="M12 4.5 14 9l4.5 2-4.5 2-2 4.5-2-4.5-4.5-2L10 9l2-4.5Z"
          {...commonProps}
        />
      </svg>
    );
  }

  if (room.isElite) {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path
          d="M12 4.2 14 9l5.2.6-3.9 3.5 1.1 5-4.4-2.7-4.4 2.7 1.1-5L4.8 9.6 10 9l2-4.8Z"
          {...commonProps}
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M8 7 16 17" {...commonProps} />
      <path d="M16 7 8 17" {...commonProps} />
    </svg>
  );
}

function buildReachableForwardNodeIds(
  positionedRooms: PositionedRoom[],
  positionedRoomById: Map<string, PositionedRoom>,
  positionedRoomsByDepth: Map<number, PositionedRoom[]>,
  currentRoom: number,
  currentReachableIndexSet: Set<number>
): Set<string> {
  const reachable = new Set<string>();
  const queue: PositionedRoom[] = positionedRooms.filter(
    (pr) =>
      pr.depthIndex === currentRoom &&
      currentReachableIndexSet.has(pr.choiceIndex)
  );
  let i = 0;
  while (i < queue.length) {
    const node = queue[i++]!;
    if (reachable.has(node.nodeId)) continue;
    reachable.add(node.nodeId);
    const nextIds =
      (node.room.nextNodeIds?.length ?? 0) > 0
        ? (node.room.nextNodeIds ?? [])
        : getLegacyNextNodeIds(node, positionedRoomsByDepth);
    for (const nextId of nextIds) {
      const nextNode = positionedRoomById.get(nextId);
      if (nextNode && !reachable.has(nextId)) {
        queue.push(nextNode);
      }
    }
  }
  return reachable;
}

function buildPositionedRooms(map: RoomNode[][]): PositionedRoom[] {
  const rooms: PositionedRoom[] = [];
  const maxDepthIndex = Math.max(0, map.length - 1);

  map.forEach((slot, depthIndex) => {
    slot.forEach((room, choiceIndex) => {
      const lane = getNodeLane(room, choiceIndex, slot);
      rooms.push({
        room,
        choiceIndex,
        depthIndex,
        nodeId: getNodeId(room, choiceIndex),
        lane,
        x: MAP_PADDING_X + lane * LANE_WIDTH,
        y: MAP_PADDING_Y + (maxDepthIndex - depthIndex) * DEPTH_HEIGHT,
      });
    });
  });

  return rooms;
}

function createLegendRoom(
  type: RoomNode["type"],
  overrides: Partial<RoomNode> = {}
): RoomNode {
  return {
    index: 0,
    type,
    completed: false,
    isElite: false,
    ...overrides,
  };
}

function getLegacyNextNodeIds(
  source: PositionedRoom,
  positionedRoomsByDepth: Map<number, PositionedRoom[]>
): string[] {
  const nextDepthRooms =
    positionedRoomsByDepth.get(source.depthIndex + 1) ?? [];
  if (nextDepthRooms.length === 0) return [];

  const sortedCandidates = [...nextDepthRooms].sort((left, right) => {
    const laneDelta =
      Math.abs(left.lane - source.lane) - Math.abs(right.lane - source.lane);
    if (laneDelta !== 0) return laneDelta;
    return left.lane - right.lane;
  });

  const nodeIds = new Set<string>();
  const primary = sortedCandidates[0];
  if (primary) {
    nodeIds.add(primary.nodeId);
  }

  const adjacent = sortedCandidates.find(
    (candidate) =>
      candidate.nodeId !== primary?.nodeId &&
      Math.abs(candidate.lane - source.lane) <= 1
  );
  if (adjacent) {
    nodeIds.add(adjacent.nodeId);
  }

  if (nodeIds.size === 1 && sortedCandidates[1]) {
    nodeIds.add(sortedCandidates[1].nodeId);
  }

  return [...nodeIds];
}

function buildConnectionPath(
  source: PositionedRoom,
  target: PositionedRoom
): string {
  const startX = source.x + NODE_SIZE / 2;
  const startY = source.y + NODE_SIZE / 2;
  const endX = target.x + NODE_SIZE / 2;
  const endY = target.y + NODE_SIZE / 2;
  const verticalPull = Math.max(18, Math.abs(endY - startY) * 0.35);

  return [
    `M ${startX} ${startY}`,
    `C ${startX} ${startY - verticalPull}`,
    `${endX} ${endY + verticalPull}`,
    `${endX} ${endY}`,
  ].join(" ");
}

function buildPositionedConnections(
  positionedRooms: PositionedRoom[],
  positionedRoomById: Map<string, PositionedRoom>,
  positionedRoomsByDepth: Map<number, PositionedRoom[]>,
  currentRoom: number,
  currentReachableIndexSet: Set<number>,
  reachableForwardNodeIds: Set<string>
): PositionedConnection[] {
  return positionedRooms.flatMap((source) => {
    const nextNodeIds =
      (source.room.nextNodeIds?.length ?? 0) > 0
        ? (source.room.nextNodeIds ?? [])
        : getLegacyNextNodeIds(source, positionedRoomsByDepth);

    return nextNodeIds.flatMap((nextNodeId) => {
      const target = positionedRoomById.get(nextNodeId);
      if (!target) return [];

      const isCompletedPath = source.room.completed && target.room.completed;
      const isLeadingToCurrent =
        source.depthIndex === currentRoom - 1 &&
        currentReachableIndexSet.has(target.choiceIndex);
      const isStartProjection =
        currentRoom === 0 &&
        source.depthIndex === 0 &&
        currentReachableIndexSet.has(target.choiceIndex);

      return [
        {
          key: `${source.nodeId}-${nextNodeId}`,
          path: buildConnectionPath(source, target),
          isActive: isLeadingToCurrent || isStartProjection,
          isCompleted: isCompletedPath,
          isReachableBranch:
            reachableForwardNodeIds.has(source.nodeId) &&
            reachableForwardNodeIds.has(target.nodeId),
          isFutureBranch:
            source.depthIndex >= currentRoom && target.depthIndex > currentRoom,
        },
      ];
    });
  });
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
  const totalRooms = Math.max(1, map.length);
  const bossRoomIndex = getBossRoomIndexForMap(map);
  const currentReachableIndexes = getReachableRoomChoiceIndexes(
    map,
    currentRoom
  );
  const currentReachableIndexSet = new Set(currentReachableIndexes);
  const currentSlot = map[currentRoom] ?? [];
  const positionedRooms = buildPositionedRooms(map);
  const positionedRoomById = new Map(
    positionedRooms.map((room) => [room.nodeId, room] as const)
  );
  const positionedRoomsByDepth = new Map<number, PositionedRoom[]>();
  for (const room of positionedRooms) {
    const depthRooms = positionedRoomsByDepth.get(room.depthIndex) ?? [];
    depthRooms.push(room);
    positionedRoomsByDepth.set(room.depthIndex, depthRooms);
  }
  const reachableForwardNodeIds = buildReachableForwardNodeIds(
    positionedRooms,
    positionedRoomById,
    positionedRoomsByDepth,
    currentRoom,
    currentReachableIndexSet
  );
  const positionedConnections = buildPositionedConnections(
    positionedRooms,
    positionedRoomById,
    positionedRoomsByDepth,
    currentRoom,
    currentReachableIndexSet,
    reachableForwardNodeIds
  );

  const mapWidth =
    MAP_PADDING_X * 2 +
    Math.max(0, GAME_CONSTANTS.MAP_LANES - 1) * LANE_WIDTH +
    NODE_SIZE;
  const mapHeight =
    MAP_PADDING_Y * 2 + Math.max(0, totalRooms - 1) * DEPTH_HEIGHT + NODE_SIZE;

  const currentChoices = currentSlot
    .map((room, choiceIndex) => ({ room, choiceIndex }))
    .filter(({ choiceIndex }) => currentReachableIndexSet.has(choiceIndex));
  const legendEntries: LegendEntry[] = [
    {
      key: "combat",
      label: t("map.roomType.COMBAT"),
      room: createLegendRoom("COMBAT"),
    },
    positionedRooms.some((room) => room.room.isElite)
      ? {
          key: "elite",
          label: t("map.roomType.COMBAT_ELITE"),
          room: createLegendRoom("COMBAT", { isElite: true }),
        }
      : null,
    positionedRooms.some((room) => room.room.type === "MERCHANT")
      ? {
          key: "merchant",
          label: t("map.roomType.MERCHANT"),
          room: createLegendRoom("MERCHANT"),
        }
      : null,
    positionedRooms.some(
      (room) =>
        room.room.type === "SPECIAL" && room.room.specialType === "EVENT"
    )
      ? {
          key: "event",
          label: t("map.roomType.SPECIAL_EVENT"),
          room: createLegendRoom("SPECIAL", { specialType: "EVENT" }),
        }
      : null,
    positionedRooms.some(
      (room) => room.room.type === "SPECIAL" && room.room.specialType === "HEAL"
    )
      ? {
          key: "heal",
          label: t("map.roomType.SPECIAL_HEAL"),
          room: createLegendRoom("SPECIAL", { specialType: "HEAL" }),
        }
      : null,
    positionedRooms.some(
      (room) =>
        room.room.type === "SPECIAL" && room.room.specialType === "UPGRADE"
    )
      ? {
          key: "upgrade",
          label: t("map.roomType.SPECIAL_UPGRADE"),
          room: createLegendRoom("SPECIAL", { specialType: "UPGRADE" }),
        }
      : null,
    positionedRooms.some((room) => room.room.type === "PRE_BOSS")
      ? {
          key: "preboss",
          label: t("map.roomType.PRE_BOSS"),
          room: createLegendRoom("PRE_BOSS"),
        }
      : null,
    {
      key: "boss",
      label: t("map.bossSuffix"),
      room: createLegendRoom("COMBAT"),
      isBossRoom: true,
    },
  ].filter((entry): entry is LegendEntry => entry !== null);

  return (
    <div className="flex min-h-[80vh] flex-col items-center gap-8 px-4 py-10 sm:px-6">
      <div className="flex w-full max-w-5xl flex-col items-center gap-4">
        <div className="inline-flex items-center rounded border border-amber-200/20 bg-amber-200/10 px-4 py-1.5">
          <span className="font-[family-name:var(--font-cinzel)] text-xs font-semibold uppercase tracking-[0.55em] text-amber-400/70">
            {t("map.floorLabel", { floor })}
          </span>
        </div>

        <div className="h-px w-32 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

        <h2 className="text-center font-[family-name:var(--font-cinzel)] text-3xl font-bold uppercase tracking-[0.08em] text-amber-100 sm:text-4xl">
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

        <p className="text-center text-xs uppercase tracking-[0.35em] text-amber-100/35">
          {t("map.roomOf", {
            current: Math.min(currentRoom + 1, totalRooms),
            total: totalRooms,
          })}
          {currentRoom === bossRoomIndex ? ` - ${t("map.bossSuffix")}` : ""}
        </p>

        <div className="flex max-w-4xl flex-wrap justify-center gap-2">
          {legendEntries.map(({ key, label, room, isBossRoom = false }) => {
            const tone = getNodeTone(room, isBossRoom);
            return (
              <div
                key={key}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.18em]",
                  tone.border,
                  tone.bg,
                  tone.text
                )}
              >
                <NodeGlyph
                  room={room}
                  isBossRoom={isBossRoom}
                  className="h-4 w-4"
                />
                <span>{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="w-full max-w-[60rem] overflow-x-auto pb-4 sm:overflow-visible">
        <div
          className="border-amber-100/14 relative mx-auto overflow-hidden rounded-[36px] border bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.96),_rgba(2,6,23,0.97)_58%,_rgba(1,3,10,1)_100%)] px-6 py-6 shadow-[0_30px_90px_rgba(0,0,0,0.42)]"
          style={{ width: `${mapWidth + 48}px` }}
        >
          <div className="pointer-events-none absolute inset-6 rounded-[28px] border border-white/5 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.05),_transparent_34%),radial-gradient(circle_at_bottom,_rgba(251,191,36,0.06),_transparent_40%)]" />
          <div className="pointer-events-none absolute inset-6">
            {Array.from({ length: GAME_CONSTANTS.MAP_LANES }).map((_, lane) => {
              const centerX = MAP_PADDING_X + lane * LANE_WIDTH + NODE_SIZE / 2;
              return (
                <div
                  key={`lane-${lane}`}
                  className="absolute top-0 h-full -translate-x-1/2 rounded-[999px] border border-white/[0.04] bg-gradient-to-b from-cyan-300/[0.06] via-white/[0.02] to-amber-300/[0.05]"
                  style={{
                    left: `${centerX}px`,
                    width: `${Math.max(74, LANE_WIDTH - 38)}px`,
                  }}
                />
              );
            })}
          </div>
          <svg
            className="absolute left-6 top-6"
            width={mapWidth}
            height={mapHeight}
            aria-hidden="true"
          >
            {positionedConnections.map((connection) => {
              const structureStroke = connection.isReachableBranch
                ? connection.isFutureBranch
                  ? "rgba(125,211,252,0.34)"
                  : "rgba(148,163,184,0.3)"
                : connection.isFutureBranch
                  ? "rgba(71,85,105,0.26)"
                  : "rgba(100,116,139,0.24)";

              return (
                <g key={connection.key}>
                  <path
                    d={connection.path}
                    fill="none"
                    stroke="rgba(2,6,23,0.88)"
                    strokeWidth={5.4}
                    strokeLinecap="round"
                  />
                  <path
                    d={connection.path}
                    fill="none"
                    stroke={structureStroke}
                    strokeWidth={connection.isReachableBranch ? 2.8 : 2.2}
                    strokeLinecap="round"
                    data-connection-layer="structure"
                  />
                  {connection.isCompleted || connection.isActive ? (
                    <path
                      d={connection.path}
                      fill="none"
                      stroke={
                        connection.isActive
                          ? "rgba(94,234,212,0.96)"
                          : "rgba(245,158,11,0.82)"
                      }
                      strokeWidth={connection.isActive ? 4.2 : 3.3}
                      strokeLinecap="round"
                      data-connection-layer="status"
                      data-connection-state={
                        connection.isActive ? "active" : "completed"
                      }
                    />
                  ) : null}
                </g>
              );
            })}
          </svg>

          <div
            className="relative"
            style={{ width: `${mapWidth}px`, height: `${mapHeight}px` }}
          >
            {positionedRooms.map((positioned) => {
              const { room, choiceIndex, depthIndex, nodeId, x, y } =
                positioned;
              const isBossRoom = depthIndex === bossRoomIndex;
              const isCurrentDepth = depthIndex === currentRoom;
              const isReachable = currentReachableIndexSet.has(choiceIndex);
              const isForcedChoice =
                forcedChoiceIndex !== null &&
                depthIndex === currentRoom &&
                choiceIndex === forcedChoiceIndex;
              const isLockedByTutorial =
                forcedChoiceIndex !== null &&
                depthIndex === currentRoom &&
                choiceIndex !== forcedChoiceIndex;
              const tone = getNodeTone(room, isBossRoom);
              const isFutureInaccessible =
                depthIndex > currentRoom &&
                !reachableForwardNodeIds.has(nodeId);
              const isClickable =
                isCurrentDepth && isReachable && !isLockedByTutorial;

              return (
                <div
                  key={nodeId}
                  className="absolute"
                  style={{ left: `${x}px`, top: `${y}px` }}
                >
                  <button
                    type="button"
                    disabled={!isClickable}
                    onClick={() => onSelectRoom(choiceIndex)}
                    title={getRoomTitle(room, isBossRoom, enemyDefs, t)}
                    className={cn(
                      "flex items-center justify-center rounded-full border transition-all duration-150",
                      tone.border,
                      tone.bg,
                      tone.text,
                      tone.glow,
                      room.completed && "ring-2 ring-amber-300/55",
                      isCurrentDepth &&
                        isReachable &&
                        "scale-[1.18] shadow-[0_0_44px_rgba(94,234,212,0.42)] ring-2 ring-teal-300/90",
                      isForcedChoice &&
                        "shadow-[0_0_30px_rgba(34,211,238,0.28)] ring-2 ring-cyan-300/90",
                      isLockedByTutorial && "cursor-not-allowed opacity-35",
                      isFutureInaccessible
                        ? "cursor-default opacity-20 grayscale"
                        : !room.completed &&
                            !isCurrentDepth &&
                            "opacity-85 saturate-[0.92]",
                      isClickable &&
                        "hover:scale-[1.1] hover:border-amber-300/55"
                    )}
                    aria-label={getRoomTitle(room, isBossRoom, enemyDefs, t)}
                    style={{
                      width: `${NODE_SIZE}px`,
                      height: `${NODE_SIZE}px`,
                    }}
                  >
                    <NodeGlyph
                      room={room}
                      isBossRoom={isBossRoom}
                      className="h-5 w-5"
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {currentRoom < map.length ? (
        <div className="flex w-full max-w-5xl flex-wrap justify-center gap-4">
          {currentChoices.map(({ room, choiceIndex }) => {
            const isBossRoom = currentRoom === bossRoomIndex;
            const roomTitle = getRoomTitle(room, isBossRoom, enemyDefs, t);
            const enemyCount = room.enemyIds?.length ?? 0;
            const baseResourceAmount = 1 + (floor - 1);
            const guaranteedResourceAmount = isBossRoom
              ? Math.round(baseResourceAmount * 3)
              : room.isElite
                ? Math.round(baseResourceAmount * 1.5)
                : baseResourceAmount;
            const primaryResource = BIOME_RESOURCE[currentBiome];
            const enemyGoldBonus =
              Math.max(0, enemyCount - 1) * GAME_CONSTANTS.GOLD_PER_EXTRA_ENEMY;
            const eliteGoldBonus = room.isElite
              ? GAME_CONSTANTS.ELITE_GOLD_BONUS
              : 0;
            const displayedGoldBonus = enemyGoldBonus + eliteGoldBonus;
            const isForcedChoice =
              forcedChoiceIndex !== null && choiceIndex === forcedChoiceIndex;

            return (
              <RogueButton
                key={getNodeId(room, choiceIndex)}
                type="text"
                className={cn(
                  "!border-amber-100/12 !bg-slate-950/82 !flex !h-auto !w-[19rem] !flex-col !items-start !gap-4 !rounded-2xl !border !p-5 !text-left !transition-all !duration-150",
                  isForcedChoice &&
                    "!border-cyan-300/75 !ring-2 !ring-cyan-300/75 !ring-offset-2 !ring-offset-slate-950",
                  "hover:!bg-slate-900/92 hover:!border-amber-300/35"
                )}
                onClick={() => onSelectRoom(choiceIndex)}
              >
                <div className="h-1 w-10 rounded-full bg-gradient-to-r from-amber-300/80 to-transparent" />

                <div className="flex w-full items-start justify-between gap-4">
                  <div>
                    <div className="font-[family-name:var(--font-cinzel)] text-base font-semibold uppercase tracking-[0.08em] text-amber-100">
                      {roomTitle}
                    </div>
                    <div className="mt-1 text-[0.65rem] uppercase tracking-[0.26em] text-slate-300/45">
                      {room.type === "COMBAT" && !isBossRoom && enemyCount > 0
                        ? t("map.enemyCount", { count: enemyCount })
                        : room.type}
                    </div>
                  </div>
                  <div className="rounded-full border border-amber-400/25 bg-amber-950/60 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-amber-200/80">
                    {getRoomShortLabel(room, isBossRoom)}
                  </div>
                </div>

                {room.type === "COMBAT" || room.type === "PRE_BOSS" ? (
                  <div className="flex flex-wrap gap-2">
                    {!isBossRoom && (
                      <RogueTag
                        bordered
                        className="rounded border-emerald-400/20 bg-emerald-950/40 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-emerald-300/80"
                      >
                        +{guaranteedResourceAmount}{" "}
                        {t(
                          `reward.resources.${primaryResource}`,
                          primaryResource
                        )}
                      </RogueTag>
                    )}
                    {displayedGoldBonus > 0 && (
                      <RogueTag
                        bordered
                        className="rounded border-amber-300/20 bg-amber-950/40 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-amber-300/80"
                      >
                        +{displayedGoldBonus} {t("reward.gold")}
                      </RogueTag>
                    )}
                    {isBossRoom && (
                      <>
                        <RogueTag
                          bordered
                          className="rounded border-red-300/20 bg-red-950/40 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-red-200/85"
                        >
                          {t("map.reward.relic")}
                        </RogueTag>
                        <RogueTag
                          bordered
                          className="rounded border-indigo-300/20 bg-indigo-950/40 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-indigo-200/85"
                        >
                          {t("map.reward.ally")}
                        </RogueTag>
                        <RogueTag
                          bordered
                          className="rounded border-rose-300/20 bg-rose-950/40 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-rose-200/85"
                        >
                          {t("map.reward.maxHp")}
                        </RogueTag>
                      </>
                    )}
                    {!isBossRoom && room.type === "COMBAT" && (
                      <RogueTag
                        bordered
                        className="rounded border-slate-300/15 bg-slate-900/65 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-slate-300/70"
                      >
                        {t("map.reward.card")}
                      </RogueTag>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <RogueTag
                      bordered
                      className="rounded border-cyan-300/15 bg-cyan-950/35 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-cyan-200/80"
                    >
                      {getRoomChoiceTag(room)}
                    </RogueTag>
                  </div>
                )}
              </RogueButton>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="h-px w-32 bg-gradient-to-r from-transparent via-amber-500/25 to-transparent" />
          <p className="font-[family-name:var(--font-cinzel)] text-base uppercase tracking-[0.3em] text-amber-100/40">
            {t("map.floorComplete")}
          </p>
        </div>
      )}
    </div>
  );
}

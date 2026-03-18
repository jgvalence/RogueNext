import { describe, expect, it } from "vitest";
import { generateFloorMap } from "@/game/engine/run";
import { createRNG } from "@/game/engine/rng";
import type { RoomNode } from "@/game/schemas/run-state";

const PRE_BOSS_INDEX = 14;

function getNodeId(node: RoomNode, choiceIndex: number): string {
  return node.nodeId ?? `${node.index}-${choiceIndex}`;
}

function enumeratePaths(map: RoomNode[][]): RoomNode[][] {
  const nodesById = new Map(
    map.flatMap((depth) =>
      depth.map(
        (node, choiceIndex) => [getNodeId(node, choiceIndex), node] as const
      )
    )
  );
  const start = map[0]?.[0];
  if (!start) return [];

  const results: RoomNode[][] = [];
  const visit = (node: RoomNode, path: RoomNode[]) => {
    const nextPath = [...path, node];
    if (node.index >= map.length - 1 || (node.nextNodeIds?.length ?? 0) === 0) {
      results.push(nextPath);
      return;
    }

    for (const nextNodeId of node.nextNodeIds ?? []) {
      const nextNode = nodesById.get(nextNodeId);
      if (nextNode) {
        visit(nextNode, nextPath);
      }
    }
  };

  visit(start, []);
  return results;
}

describe("map balance", () => {
  it("keeps 16-room runs meaningfully richer in support rooms instead of mostly adding combats", () => {
    let totalPaths = 0;
    let totalCombats = 0;
    let totalSupports = 0;

    for (let i = 0; i < 24; i += 1) {
      const map = generateFloorMap(
        1,
        createRNG(`map-support-density-${i}`),
        "LIBRARY"
      );
      const paths = enumeratePaths(map).map((path) =>
        path.filter((node) => node.index < PRE_BOSS_INDEX)
      );

      for (const path of paths) {
        const merchantCount = path.filter(
          (node) => node.type === "MERCHANT"
        ).length;
        const merchantIndexes = path
          .filter((node) => node.type === "MERCHANT")
          .map((node) => node.index);
        totalPaths += 1;
        totalCombats += path.filter((node) => node.type === "COMBAT").length;
        totalSupports += path.filter(
          (node) => node.type === "MERCHANT" || node.type === "SPECIAL"
        ).length;
        expect(merchantCount).toBeGreaterThanOrEqual(1);
        expect(merchantCount).toBeLessThanOrEqual(2);
        expect(merchantIndexes[0]).toBeLessThanOrEqual(8);
        for (let index = 1; index < merchantIndexes.length; index += 1) {
          expect(
            merchantIndexes[index]! - merchantIndexes[index - 1]!
          ).toBeGreaterThan(1);
        }
      }
    }

    expect(totalSupports / totalPaths).toBeGreaterThanOrEqual(5.1);
    expect(totalCombats / totalPaths).toBeLessThanOrEqual(8.9);
  });
});

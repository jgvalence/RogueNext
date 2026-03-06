export type PileType = "draw" | "discard" | "exhaust";

export type MobileInfoPanelState =
  | { type: "player" }
  | { type: "ally"; instanceId: string }
  | { type: "enemy"; instanceId: string }
  | null;

export type ReshuffleCardFx = {
  id: number;
  x: number;
  y: number;
  tx: number;
  ty: number;
  rot: number;
  delay: number;
};

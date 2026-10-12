"use client";

import { useState } from "react";
import { getRoomArtSrc } from "@/lib/room-art";

export function RoomArtwork({ scene, className = "", background = false }: { scene: string; className?: string; background?: boolean }) {
  const [failed, setFailed] = useState<string | null>(null);
  const fallback = "/images/backgrounds/combat.svg";
  return (
    <picture className={className} data-room-art={scene}>
      {failed !== scene && <source media="(max-width: 1023px)" srcSet={getRoomArtSrc(scene, background ? "scene" : "small")} />}
      <img src={failed === scene ? fallback : getRoomArtSrc(scene, background ? "full" : "scene")}
        alt="" width={1536} height={1024} decoding="async"
        className="h-full w-full object-cover object-center"
        onError={() => setFailed(scene)} />
    </picture>
  );
}

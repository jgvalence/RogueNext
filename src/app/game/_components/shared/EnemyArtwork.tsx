"use client";

import { useState, type ImgHTMLAttributes } from "react";
import { getEnemyImageSrc, getEnemyFallbackSrc } from "@/lib/assets";

/** Keep the enemy recognizable even if its painted image cannot load. */
export function EnemyArtwork({
  enemyId,
  src,
  alt = "",
  onError,
  ...props
}: Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  enemyId: string;
  src?: string;
}) {
  const primary = src ?? getEnemyImageSrc(enemyId);
  const fallback = getEnemyFallbackSrc(enemyId);
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const resolved = failedSource === primary ? fallback : primary;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...props}
      src={resolved}
      data-enemy-art={enemyId}
      alt={alt}
      decoding="async"
      onError={(event) => {
        if (resolved !== fallback) setFailedSource(primary);
        else onError?.(event);
      }}
    />
  );
}

"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CardDefinition } from "@/game/schemas/cards";
import { CardUpgradePreview } from "./CardUpgradePreview";

const VIEWPORT_PADDING = 8;
const ANCHOR_OFFSET = 12;

export interface UpgradePreviewHoverInfo {
  definition: CardDefinition;
  anchorEl: HTMLElement;
}

interface UpgradePreviewPortalProps {
  info: UpgradePreviewHoverInfo | null;
}

export function UpgradePreviewPortal({ info }: UpgradePreviewPortalProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(
    null
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    if (!info || !panelRef.current) return;

    const rect = info.anchorEl.getBoundingClientRect();
    const width = panelRef.current.offsetWidth;
    const height = panelRef.current.offsetHeight;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = rect.right + ANCHOR_OFFSET;
    if (left + width > viewportWidth - VIEWPORT_PADDING) {
      left = rect.left - width - ANCHOR_OFFSET;
    }
    left = Math.max(
      VIEWPORT_PADDING,
      Math.min(left, viewportWidth - width - VIEWPORT_PADDING)
    );

    let top = rect.top + rect.height / 2 - height / 2;
    top = Math.max(
      VIEWPORT_PADDING,
      Math.min(top, viewportHeight - height - VIEWPORT_PADDING)
    );

    setPosition({ left, top });
  }, [info]);

  useLayoutEffect(() => {
    updatePosition();
  }, [updatePosition]);

  useEffect(() => {
    if (!info) return;
    const handleResize = () => updatePosition();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [info, updatePosition]);

  if (!mounted || !info) return null;

  return createPortal(
    <div
      ref={panelRef}
      className="pointer-events-none fixed z-[9999]"
      style={
        position
          ? { left: position.left, top: position.top }
          : { left: -9999, top: -9999 }
      }
    >
      <CardUpgradePreview definition={info.definition} size="sm" />
    </div>,
    document.body
  );
}

"use client";

import {
  type ReactNode,
  useState,
  useRef,
  useCallback,
  useEffect,
  useLayoutEffect,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils/cn";

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Tooltip({ content, children, className }: TooltipProps) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [placement, setPlacement] = useState<"top" | "bottom">("top");
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setAnchorRect(rect);
      setPlacement("top");
      setPos({ x: rect.left + rect.width / 2, y: rect.top - 8 });
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setPos(null);
    setAnchorRect(null);
  }, []);

  useLayoutEffect(() => {
    if (!pos || !anchorRect || !tooltipRef.current) return;

    const margin = 8;
    const gap = 8;
    const tipRect = tooltipRef.current.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    const halfW = tipRect.width / 2;
    const minX = margin + halfW;
    const maxX = viewportW - margin - halfW;
    const clampedX = Math.min(
      maxX,
      Math.max(minX, anchorRect.left + anchorRect.width / 2)
    );

    const canShowTop = anchorRect.top - gap - tipRect.height >= margin;
    const nextPlacement: "top" | "bottom" = canShowTop ? "top" : "bottom";
    const nextY = canShowTop
      ? anchorRect.top - gap
      : Math.min(viewportH - margin, anchorRect.bottom + gap);

    if (placement !== nextPlacement) setPlacement(nextPlacement);
    if (Math.abs(pos.x - clampedX) > 0.5 || Math.abs(pos.y - nextY) > 0.5) {
      setPos({ x: clampedX, y: nextY });
    }
  }, [pos, anchorRect, placement]);

  return (
    <div
      ref={ref}
      className={cn("inline-block", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {mounted &&
        pos &&
        createPortal(
          <div
            ref={tooltipRef}
            className={cn(
              "pointer-events-none fixed z-[9999] w-max max-w-[220px] -translate-x-1/2 rounded-lg border border-gray-600 bg-gray-950 px-3 py-2 text-xs leading-snug text-gray-200 shadow-xl",
              placement === "top" ? "-translate-y-full" : "translate-y-0"
            )}
            style={{ left: pos.x, top: pos.y }}
          >
            {content}
            <div
              className={cn(
                "absolute left-1/2 -translate-x-1/2 border-4 border-transparent",
                placement === "top"
                  ? "top-full border-t-gray-600"
                  : "bottom-full border-b-gray-600"
              )}
            />
          </div>,
          document.body
        )}
    </div>
  );
}

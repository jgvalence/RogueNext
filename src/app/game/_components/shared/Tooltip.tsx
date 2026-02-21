"use client";

import { type ReactNode, useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils/cn";

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Tooltip({ content, children, className }: TooltipProps) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  const handleMouseEnter = useCallback(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPos({ x: rect.left + rect.width / 2, y: rect.top - 8 });
    }
  }, []);

  const handleMouseLeave = useCallback(() => setPos(null), []);

  return (
    <div
      ref={ref}
      className={cn("inline-block", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {mounted && pos && createPortal(
        <div
          className="pointer-events-none fixed z-[9999] w-max max-w-[220px] -translate-x-1/2 -translate-y-full rounded-lg border border-gray-600 bg-gray-950 px-3 py-2 text-xs leading-snug text-gray-200 shadow-xl"
          style={{ left: pos.x, top: pos.y }}
        >
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-600" />
        </div>,
        document.body
      )}
    </div>
  );
}

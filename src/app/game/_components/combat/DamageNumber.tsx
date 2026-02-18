"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";

interface DamageNumberProps {
  value: number;
  type: "damage" | "heal" | "block";
  onDone: () => void;
}

export function DamageNumber({ value, type, onDone }: DamageNumberProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDone();
    }, 800);
    return () => clearTimeout(timer);
  }, [onDone]);

  if (!visible) return null;

  return (
    <span
      className={cn(
        "pointer-events-none absolute -top-2 left-1/2 z-50 -translate-x-1/2 animate-float-up text-lg font-black drop-shadow-lg",
        type === "damage" && "text-red-400",
        type === "heal" && "text-green-400",
        type === "block" && "text-blue-400"
      )}
    >
      {type === "damage" ? `-${value}` : `+${value}`}
    </span>
  );
}

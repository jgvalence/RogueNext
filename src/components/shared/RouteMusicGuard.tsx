"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { startMusic } from "@/lib/music";

function isActiveRunRoute(pathname: string | null): boolean {
  return /^\/game\/[^/]+$/.test(pathname ?? "");
}

export function RouteMusicGuard() {
  const pathname = usePathname();

  useEffect(() => {
    if (isActiveRunRoute(pathname)) return;
    startMusic("menu");
  }, [pathname]);

  return null;
}

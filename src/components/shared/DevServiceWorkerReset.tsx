"use client";

import { useEffect } from "react";

const DEV_RESET_KEY = "panlibrarium-dev-pwa-reset";

export function DevServiceWorkerReset() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "development" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    void (async () => {
      const registrations = await navigator.serviceWorker.getRegistrations();
      const hadRegistrations = registrations.length > 0;

      await Promise.all(
        registrations.map((registration) => registration.unregister())
      );

      if ("caches" in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      }

      if (hadRegistrations && !sessionStorage.getItem(DEV_RESET_KEY)) {
        sessionStorage.setItem(DEV_RESET_KEY, "done");
        window.location.reload();
      }
    })();
  }, []);

  return null;
}

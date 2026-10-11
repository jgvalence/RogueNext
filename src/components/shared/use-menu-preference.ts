"use client";
import { useCallback, useEffect, useState, type SetStateAction } from "react";

// Preferences are per tab and contain only UI filters, never player progress.
export function useMenuPreference<T extends string>(key: string, initial: T) {
  const storageKey = "panlibrarium:menu:" + key;
  const [value, setValue] = useState<T>(initial);
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved !== null) setValue(saved as T);
    } catch {
      /* Storage can be unavailable in private browsing. */
    }
  }, [storageKey]);
  const update = useCallback(
    (next: SetStateAction<T>) => {
      setValue((previous) => {
        const updated = typeof next === "function" ? next(previous) : next;
        try {
          sessionStorage.setItem(storageKey, updated);
        } catch {
          /* Keep UI usable. */
        }
        return updated;
      });
    },
    [storageKey]
  );
  return [value, update] as const;
}

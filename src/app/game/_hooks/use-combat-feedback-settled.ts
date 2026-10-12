import { useEffect, useRef, useState } from "react";
import type { CombatState } from "@/game/schemas/combat-state";
import {
  combatFeedbackDuration,
  combatFeedbackStagger,
} from "@/lib/combat-feedback-timing";

/** Let the final effects finish before leaving combat. Saved history is never replayed. */
export function useCombatFeedbackSettled(
  combat: CombatState | null | undefined,
  encounterKey: string
) {
  const terminal =
    combat?.phase === "COMBAT_WON" || combat?.phase === "COMBAT_LOST";
  const key = terminal ? `${encounterKey}:${combat.phase}` : null;
  const sequence = combat?.feedback?.sequence ?? 0;
  const seen = useRef(sequence);
  const [settledKey, setSettledKey] = useState(key);
  useEffect(() => {
    const previous = seen.current;
    seen.current = sequence;
    if (!key) {
      setSettledKey(null);
      return;
    }
    const counts = new Map<string, number>();
    for (const event of combat?.feedback?.events ?? []) {
      if (event.id > previous)
        counts.set(event.target, (counts.get(event.target) ?? 0) + 1);
    }
    const count = Math.max(0, ...counts.values());
    if (!count) {
      setSettledKey(key);
      return;
    }
    const timer = setTimeout(
      () => setSettledKey(key),
      combatFeedbackDuration() + combatFeedbackStagger(count - 1) + 40
    );
    return () => clearTimeout(timer);
  }, [key, sequence, combat?.feedback]);
  return !terminal || settledKey === key;
}

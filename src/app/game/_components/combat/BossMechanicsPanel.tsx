"use client";
import { useTranslation } from "react-i18next";
import type { CombatState } from "@/game/schemas/combat-state";
import { bossGuides } from "@/game/data/boss-guides";
import { localizeEnemyName } from "@/lib/i18n/entity-text";
import {
  buildEnemyStatusMarkers,
  renderEnemyStatusMarkerDetails,
} from "./combat-view-helpers";

export function BossMechanicsPanel({ combat }: { combat: CombatState }) {
  const { i18n } = useTranslation();
  const french = i18n.language.startsWith("fr");
  const bosses = combat.enemies.filter(
    (enemy) => enemy.currentHp > 0 && bossGuides[enemy.definitionId]
  );
  if (!bosses.length) return null;
  return (
    <div className="relative z-20 w-full shrink-0 space-y-1 text-xs">
      {bosses.map((enemy) => (
        <details
          key={enemy.instanceId}
          className="rounded-lg border border-amber-300/30 bg-slate-950/95 p-2 text-amber-50"
        >
          <summary className="cursor-pointer font-semibold focus-visible:outline focus-visible:outline-2">
            {localizeEnemyName(enemy.definitionId, enemy.definitionId)} —{" "}
            {french ? "Objectif et progression" : "Goal and progress"}
          </summary>
          <div className="max-h-44 space-y-2 overflow-y-auto py-2 text-sm leading-relaxed">
            <p>{bossGuides[enemy.definitionId]![french ? "fr" : "en"]}</p>
            {renderEnemyStatusMarkerDetails(buildEnemyStatusMarkers(enemy))}
          </div>
        </details>
      ))}
    </div>
  );
}

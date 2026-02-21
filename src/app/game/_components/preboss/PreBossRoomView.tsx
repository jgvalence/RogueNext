"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import type { CardInstance, CardDefinition } from "@/game/schemas/cards";
import { GAME_CONSTANTS } from "@/game/constants";
import { cn } from "@/lib/utils/cn";
import { GameCard } from "../combat/GameCard";

interface PreBossRoomViewProps {
  playerCurrentHp: number;
  playerMaxHp: number;
  deck: CardInstance[];
  cardDefs: Map<string, CardDefinition>;
  onHeal: () => void;
  onUpgrade: (cardInstanceId: string) => void;
  onFight: () => void;
}

export function PreBossRoomView({
  playerCurrentHp,
  playerMaxHp,
  deck,
  cardDefs,
  onHeal,
  onUpgrade,
  onFight,
}: PreBossRoomViewProps) {
  const [mode, setMode] = useState<"CHOOSE" | "UPGRADE">("CHOOSE");

  if (mode === "UPGRADE") {
    return (
      <UpgradeSubView
        deck={deck}
        cardDefs={cardDefs}
        onUpgrade={onUpgrade}
        onBack={() => setMode("CHOOSE")}
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <h2 className="text-2xl font-bold text-amber-400">Room Before The Boss</h2>
      <p className="max-w-md text-center text-gray-400">
        A moment of respite before the final challenge. Choose how to prepare.
      </p>
      <p className="text-sm text-gray-500">
        HP: {playerCurrentHp}/{playerMaxHp}
      </p>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <button
          onClick={onHeal}
          className="rounded-lg border-2 border-green-700 bg-green-950/40 px-6 py-4 text-left transition hover:border-green-500 hover:bg-green-950/60"
        >
          <p className="font-medium text-green-300">Healing Shrine</p>
          <p className="text-sm text-green-600">
            Restore {Math.floor(GAME_CONSTANTS.HEAL_ROOM_PERCENT * 100)}% of your max HP
          </p>
        </button>

        <button
          onClick={() => setMode("UPGRADE")}
          className="rounded-lg border-2 border-blue-700 bg-blue-950/40 px-6 py-4 text-left transition hover:border-blue-500 hover:bg-blue-950/60"
        >
          <p className="font-medium text-blue-300">Enchanted Anvil</p>
          <p className="text-sm text-blue-600">Upgrade a card in your deck</p>
        </button>

        <button
          onClick={onFight}
          className="rounded-lg border-2 border-purple-700 bg-purple-950/40 px-6 py-4 text-left transition hover:border-purple-500 hover:bg-purple-950/60"
        >
          <p className="font-medium text-purple-300">Hunt for a Relic</p>
          <p className="text-sm text-purple-600">
            Defeat a guardian — win a relic or a rare card
          </p>
        </button>
      </div>
    </div>
  );
}

// ─── Upgrade helpers — must stay in sync with boostEffects() in engine/cards.ts

/** ×1.5 (floor), min +1 */
const MULTIPLICATIVE_BOOST = new Set(["DAMAGE", "BLOCK", "HEAL", "GAIN_INK"]);
/** +1 */
const ADDITIVE_BOOST = new Set([
  "DRAW_CARDS", "GAIN_ENERGY", "GAIN_STRENGTH", "GAIN_FOCUS",
  "APPLY_BUFF", "APPLY_DEBUFF",
]);

function computeUpgradedValue(effectType: string, value: number): number {
  if (MULTIPLICATIVE_BOOST.has(effectType))
    return Math.max(Math.floor(value * 1.5), value + 1);
  if (ADDITIVE_BOOST.has(effectType))
    return value + 1;
  return value;
}

/**
 * Returns the upgraded description for a card.
 * Uses card-specific upgrade.description if defined; otherwise falls back to
 * regex-substitution on the base description (mirrors boostEffects() in the engine).
 */
function buildUpgradedDescription(def: CardDefinition): string {
  if (def.upgrade) return def.upgrade.description;

  const boostableEffects = def.effects.filter(
    (e) => MULTIPLICATIVE_BOOST.has(e.type) || ADDITIVE_BOOST.has(e.type),
  );
  if (boostableEffects.length === 0) return def.description;

  let desc = def.description;
  for (const effect of boostableEffects) {
    const boosted = computeUpgradedValue(effect.type, effect.value);
    // Replace the first occurrence of this exact integer (word-boundary safe)
    desc = desc.replace(new RegExp(`\\b${effect.value}\\b`), String(boosted));
  }
  return desc;
}

// ─── Hover preview panel ──────────────────────────────────────────────────────

type HoverInfo = { def: CardDefinition; x: number; y: number } | null;

function UpgradePreviewPanel({ info }: { info: HoverInfo }) {
  if (!info) return null;
  const { def, x, y } = info;

  const upgradedDesc = buildUpgradedDescription(def);
  const upgradedEnergyCost =
    def.upgrade?.energyCost !== undefined ? def.upgrade.energyCost : def.energyCost;
  const upgradedDef: CardDefinition = {
    ...def,
    description: upgradedDesc,
    energyCost: upgradedEnergyCost,
  };

  return createPortal(
    <div
      className="pointer-events-none fixed z-[9999] flex items-start gap-3 rounded-xl border border-gray-600 bg-gray-950/95 p-3 shadow-2xl"
      style={{ left: x + 12, top: y, transform: "translateY(-50%)" }}
    >
      {/* Current card */}
      <div className="flex flex-col items-center gap-1.5">
        <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">
          Actuel
        </p>
        <GameCard definition={def} size="sm" />
      </div>

      <div className="flex items-center self-center text-lg text-amber-400">→</div>

      {/* Upgraded card */}
      <div className="flex flex-col items-center gap-1.5">
        <p className="text-[9px] font-semibold uppercase tracking-wide text-yellow-400">
          ★ Amélioré
        </p>
        <GameCard definition={upgradedDef} upgraded size="sm" />
      </div>
    </div>,
    document.body,
  );
}

// ─── Upgrade sub-view ─────────────────────────────────────────────────────────

function UpgradeSubView({
  deck,
  cardDefs,
  onUpgrade,
  onBack,
}: {
  deck: CardInstance[];
  cardDefs: Map<string, CardDefinition>;
  onUpgrade: (cardInstanceId: string) => void;
  onBack: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>, def: CardDefinition) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setHoverInfo({ def, x: rect.right, y: rect.top + rect.height / 2 });
    },
    [],
  );

  const handleMouseLeave = useCallback(() => {
    setHoverInfo(null);
  }, []);

  const upgradable = deck.filter((c) => {
    if (c.upgraded) return false;
    const def = cardDefs.get(c.definitionId);
    return def ? def.type !== "CURSE" && def.type !== "STATUS" : false;
  });

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <h2 className="text-2xl font-bold text-blue-400">Enchanted Anvil</h2>
      <p className="text-gray-400">
        Survolez une carte pour prévisualiser l&apos;amélioration
      </p>

      <div className="flex max-w-2xl flex-wrap justify-center gap-3">
        {upgradable.map((card) => {
          const def = cardDefs.get(card.definitionId);
          if (!def) return null;
          const isSelected = selected === card.instanceId;
          return (
            <button
              key={card.instanceId}
              onClick={() => setSelected(card.instanceId)}
              onMouseEnter={(e) => handleMouseEnter(e, def)}
              onMouseLeave={handleMouseLeave}
              className={cn(
                "flex w-32 flex-col items-center gap-1 rounded-lg border-2 p-3 text-center transition",
                isSelected
                  ? "border-blue-400 bg-blue-950/60 ring-2 ring-blue-400"
                  : "border-gray-600 bg-gray-800/50 hover:border-gray-400",
              )}
            >
              <span className="text-xs font-bold text-white">{def.name}</span>
              <span className="text-[10px] text-gray-400">
                {def.type} · {def.rarity}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex gap-3">
        <button
          disabled={!selected}
          onClick={() => selected && onUpgrade(selected)}
          className={cn(
            "rounded-lg px-6 py-2 font-medium transition",
            selected
              ? "bg-blue-600 text-white hover:bg-blue-500"
              : "cursor-not-allowed bg-gray-700 text-gray-500",
          )}
        >
          Upgrade
        </button>
        <button
          className="rounded-lg bg-gray-700 px-6 py-2 text-white hover:bg-gray-600"
          onClick={onBack}
        >
          Back
        </button>
      </div>

      {mounted && <UpgradePreviewPanel info={hoverInfo} />}
    </div>
  );
}

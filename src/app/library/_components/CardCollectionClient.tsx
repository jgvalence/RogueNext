"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { BiomeType, Rarity } from "@/game/schemas/enums";

type CollectionTypeFilter = "ALL" | "ATTACK" | "DEFENSE" | "POWER";
type LockFilter = "ALL" | "UNLOCKED" | "LOCKED";

export interface CollectionCardRow {
  id: string;
  name: string;
  biome: BiomeType;
  type: "ATTACK" | "SKILL" | "POWER";
  rarity: Rarity;
  energyCost: number;
  description: string;
  unlocked: boolean;
  unlockCondition: string;
  missingCondition: string | null;
  unlockProgress: string | null;
}

interface CardCollectionClientProps {
  cards: CollectionCardRow[];
}

function matchesType(card: CollectionCardRow, filter: CollectionTypeFilter): boolean {
  if (filter === "ALL") return true;
  if (filter === "ATTACK") return card.type === "ATTACK";
  if (filter === "POWER") return card.type === "POWER";
  return card.type === "SKILL";
}

export function CardCollectionClient({ cards }: CardCollectionClientProps) {
  const [biome, setBiome] = useState<BiomeType | "ALL">("ALL");
  const [type, setType] = useState<CollectionTypeFilter>("ALL");
  const [rarity, setRarity] = useState<Rarity | "ALL">("ALL");
  const [lock, setLock] = useState<LockFilter>("ALL");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return cards
      .filter((c) => (biome === "ALL" ? true : c.biome === biome))
      .filter((c) => matchesType(c, type))
      .filter((c) => (rarity === "ALL" ? true : c.rarity === rarity))
      .filter((c) =>
        lock === "ALL" ? true : lock === "UNLOCKED" ? c.unlocked : !c.unlocked
      )
      .filter((c) =>
        query.trim().length === 0
          ? true
          : c.name.toLowerCase().includes(query.trim().toLowerCase())
      );
  }, [cards, biome, type, rarity, lock, query]);

  const unlockedCount = cards.filter((c) => c.unlocked).length;

  return (
    <div className="min-h-screen bg-gray-950 px-6 py-6 text-white">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black">Card Collection</h1>
            <p className="text-sm text-gray-400">
              {unlockedCount}/{cards.length} unlocked
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/library"
              className="rounded border border-gray-700 px-3 py-2 text-sm text-gray-300 hover:border-gray-500 hover:text-white"
            >
              Back to Library
            </Link>
            <Link
              href="/game"
              className="rounded bg-purple-600 px-4 py-2 text-sm font-bold text-white hover:bg-purple-500"
            >
              Start Run
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 rounded-lg border border-gray-800 bg-gray-900/60 p-3 md:grid-cols-6">
          <select
            value={biome}
            onChange={(e) => setBiome(e.target.value as BiomeType | "ALL")}
            className="rounded border border-gray-700 bg-gray-950 px-2 py-1.5 text-sm"
          >
            <option value="ALL">All biomes</option>
            <option value="LIBRARY">LIBRARY</option>
            <option value="VIKING">VIKING</option>
            <option value="GREEK">GREEK</option>
            <option value="EGYPTIAN">EGYPTIAN</option>
            <option value="LOVECRAFTIAN">LOVECRAFTIAN</option>
            <option value="AZTEC">AZTEC</option>
            <option value="CELTIC">CELTIC</option>
            <option value="RUSSIAN">RUSSIAN</option>
            <option value="AFRICAN">AFRICAN</option>
          </select>

          <select
            value={type}
            onChange={(e) => setType(e.target.value as CollectionTypeFilter)}
            className="rounded border border-gray-700 bg-gray-950 px-2 py-1.5 text-sm"
          >
            <option value="ALL">All types</option>
            <option value="ATTACK">Attack</option>
            <option value="DEFENSE">Defense (Skill)</option>
            <option value="POWER">Power</option>
          </select>

          <select
            value={rarity}
            onChange={(e) => setRarity(e.target.value as Rarity | "ALL")}
            className="rounded border border-gray-700 bg-gray-950 px-2 py-1.5 text-sm"
          >
            <option value="ALL">All rarities</option>
            <option value="COMMON">Common</option>
            <option value="UNCOMMON">Uncommon</option>
            <option value="RARE">Rare</option>
            <option value="STARTER">Starter</option>
          </select>

          <select
            value={lock}
            onChange={(e) => setLock(e.target.value as LockFilter)}
            className="rounded border border-gray-700 bg-gray-950 px-2 py-1.5 text-sm"
          >
            <option value="ALL">All states</option>
            <option value="UNLOCKED">Unlocked</option>
            <option value="LOCKED">Locked</option>
          </select>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search card name..."
            className="rounded border border-gray-700 bg-gray-950 px-2 py-1.5 text-sm md:col-span-2"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((card) => (
            <div
              key={card.id}
              className={`rounded-lg border p-3 ${
                card.unlocked
                  ? "border-emerald-700/50 bg-emerald-950/20"
                  : "border-rose-800/50 bg-rose-950/20"
              }`}
            >
              <div className="mb-1 flex items-center justify-between">
                <p className="font-bold">{card.name}</p>
                <span
                  className={`rounded px-2 py-0.5 text-xs font-semibold ${
                    card.unlocked
                      ? "bg-emerald-900 text-emerald-300"
                      : "bg-rose-900 text-rose-300"
                  }`}
                >
                  {card.unlocked ? "UNLOCKED" : "LOCKED"}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                {card.biome} • {card.type} • {card.rarity} • {card.energyCost} energy
              </p>
              <p className="mt-2 text-sm text-gray-300">{card.description}</p>

              {!card.unlocked && (
                <div className="mt-3 rounded border border-rose-900 bg-rose-950/30 p-2 text-xs text-rose-200">
                  <p className="font-semibold">Pourquoi cette carte est lock</p>
                  <p>
                    Condition manquante: {card.missingCondition ?? card.unlockCondition}
                  </p>
                  {card.unlockProgress && (
                    <p className="mt-1 text-rose-300">
                      Progression: {card.unlockProgress}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

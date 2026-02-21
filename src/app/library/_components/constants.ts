import type { BiomeType, BiomeResource } from "@/game/schemas/enums";
import type { Histoire } from "@/game/schemas/meta";

export interface BiomeTheme {
  border: string;
  bg: string;
  accent: string;
  glow: string;
  icon: string;
  label: string;
  resource: BiomeResource;
  name: string;
}

export const BIOME_THEMES: Record<BiomeType, BiomeTheme> = {
  LIBRARY: {
    border: "border-amber-700",
    bg: "bg-amber-950/40",
    accent: "text-amber-400",
    glow: "ring-amber-500",
    icon: "📄",
    label: "Pages",
    resource: "PAGES",
    name: "La Bibliothèque",
  },
  VIKING: {
    border: "border-blue-700",
    bg: "bg-blue-950/40",
    accent: "text-blue-400",
    glow: "ring-blue-500",
    icon: "ᚱ",
    label: "Runes",
    resource: "RUNES",
    name: "Contrées Vikings",
  },
  GREEK: {
    border: "border-sky-600",
    bg: "bg-sky-950/40",
    accent: "text-sky-300",
    glow: "ring-sky-400",
    icon: "🌿",
    label: "Lauriers",
    resource: "LAURIERS",
    name: "Grèce Antique",
  },
  EGYPTIAN: {
    border: "border-yellow-700",
    bg: "bg-yellow-950/40",
    accent: "text-yellow-400",
    glow: "ring-yellow-500",
    icon: "𓂀",
    label: "Glyphes",
    resource: "GLYPHES",
    name: "Égypte Éternelle",
  },
  LOVECRAFTIAN: {
    border: "border-green-800",
    bg: "bg-green-950/40",
    accent: "text-green-400",
    glow: "ring-green-600",
    icon: "🔮",
    label: "Fragments",
    resource: "FRAGMENTS",
    name: "Abysses Lovecraftiennes",
  },
  AZTEC: {
    border: "border-orange-700",
    bg: "bg-orange-950/40",
    accent: "text-orange-400",
    glow: "ring-orange-500",
    icon: "🗿",
    label: "Obsidienne",
    resource: "OBSIDIENNE",
    name: "Empire Aztèque",
  },
  CELTIC: {
    border: "border-emerald-700",
    bg: "bg-emerald-950/40",
    accent: "text-emerald-400",
    glow: "ring-emerald-500",
    icon: "🟡",
    label: "Ambre",
    resource: "AMBRE",
    name: "Forêts Celtiques",
  },
  RUSSIAN: {
    border: "border-red-800",
    bg: "bg-red-950/40",
    accent: "text-red-400",
    glow: "ring-red-600",
    icon: "✦",
    label: "Sceaux",
    resource: "SCEAUX",
    name: "Steppes Russes",
  },
  AFRICAN: {
    border: "border-amber-600",
    bg: "bg-amber-950/30",
    accent: "text-amber-500",
    glow: "ring-amber-600",
    icon: "🎭",
    label: "Masques",
    resource: "MASQUES",
    name: "Savanes Africaines",
  },
};

export const VISUEL_ICONS: Record<Histoire["visuel"], string> = {
  livre: "📕",
  parchemin: "📜",
  tablette: "🪨",
  grimoire: "📿",
};

export const TIER_LABELS = ["", "I", "II", "III"] as const;

export const BIOME_ORDER: BiomeType[] = [
  "LIBRARY",
  "VIKING",
  "GREEK",
  "EGYPTIAN",
  "LOVECRAFTIAN",
  "AZTEC",
  "CELTIC",
  "RUSSIAN",
  "AFRICAN",
];

export type SlotState =
  | "UNLOCKED"
  | "AVAILABLE"
  | "LOCKED_PREREQS"
  | "LOCKED_RESOURCES";

import type { BiomeType } from "../schemas/enums";

export interface BiomeMetadata {
  id: BiomeType;
  name: string;
  description: string;
  icon: string; // emoji fallback
  enemyPreview: string; // shown in BiomeSelectScreen
  flavor: string; // short atmospheric line
}

export const BIOME_METADATA: Record<BiomeType, BiomeMetadata> = {
  LIBRARY: {
    id: "LIBRARY",
    name: "The Forbidden Library",
    description: "Ancient tomes and ink-born creatures haunt endless shelves.",
    icon: "📚",
    enemyPreview: "Ink Slimes, Tome Wraiths, Chapter Guardian",
    flavor: "The pages whisper forbidden knowledge...",
  },
  VIKING: {
    id: "VIKING",
    name: "The Frozen North",
    description: "Norse warriors and mythic beasts roam ice-bound halls.",
    icon: "⚔️",
    enemyPreview: "Draugr, Shield Maidens, Fenrir",
    flavor: "Valhalla awaits those worthy of its gates.",
  },
  GREEK: {
    id: "GREEK",
    name: "The Labyrinthine Pantheon",
    description: "Olympian monsters guard treasures of the ancient world.",
    icon: "🏛️",
    enemyPreview: "Harpies, Cyclops, Medusa",
    flavor: "The gods play games with mortal lives.",
  },
  EGYPTIAN: {
    id: "EGYPTIAN",
    name: "The Eternal Sands",
    description: "Undying guardians protect the secrets of the pharaohs.",
    icon: "🏺",
    enemyPreview: "Coming soon...",
    flavor: "Death is but the beginning.",
  },
  LOVECRAFTIAN: {
    id: "LOVECRAFTIAN",
    name: "The Outer Void",
    description: "Eldritch horrors from beyond reality itself.",
    icon: "🐙",
    enemyPreview: "Coming soon...",
    flavor: "The stars align in patterns no mind should witness.",
  },
  AZTEC: {
    id: "AZTEC",
    name: "The Obsidian Temple",
    description: "Jaguar warriors and feathered serpents demand tribute.",
    icon: "🌞",
    enemyPreview: "Coming soon...",
    flavor: "The fifth sun must be fed.",
  },
  CELTIC: {
    id: "CELTIC",
    name: "The Mist-Veiled Otherworld",
    description: "Fae creatures and druidic spirits dwell beyond the veil.",
    icon: "🌿",
    enemyPreview: "Coming soon...",
    flavor: "The old ways have long memories.",
  },
  RUSSIAN: {
    id: "RUSSIAN",
    name: "The Winter Forest",
    description: "Slavic spirits and forest demons lurk in eternal night.",
    icon: "❄️",
    enemyPreview: "Coming soon...",
    flavor: "Baba Yaga's hut turns on its chicken legs.",
  },
  AFRICAN: {
    id: "AFRICAN",
    name: "The Spirit Savanna",
    description: "Orishas and ancestral beasts walk the sacred plains.",
    icon: "🦁",
    enemyPreview: "Coming soon...",
    flavor: "The ancestors watch over those who remember them.",
  },
};

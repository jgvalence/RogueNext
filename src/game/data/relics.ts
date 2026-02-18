import type { RelicRarity } from "../schemas/enums";

export interface RelicDefinitionData {
  id: string;
  name: string;
  description: string;
  rarity: RelicRarity;
}

export const relicDefinitions: RelicDefinitionData[] = [
  {
    id: "ancient_quill",
    name: "Ancient Quill",
    description: "+2 ink max.",
    rarity: "COMMON",
  },
  {
    id: "energy_crystal",
    name: "Energy Crystal",
    description: "+1 energy per turn.",
    rarity: "RARE",
  },
  {
    id: "bookmark",
    name: "Bookmark",
    description: "Draw 1 extra card per turn.",
    rarity: "UNCOMMON",
  },
  {
    id: "ink_stamp",
    name: "Ink Stamp",
    description: "Start each combat with 3 ink.",
    rarity: "UNCOMMON",
  },
  {
    id: "iron_binding",
    name: "Iron Binding",
    description: "Gain 1 extra ink per card played.",
    rarity: "BOSS",
  },
];

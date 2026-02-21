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
    description: "Gain +1 ink when ink-per-card triggers.",
    rarity: "BOSS",
  },
  {
    id: "blighted_compass",
    name: "Blighted Compass",
    description: "+1 draw per turn, but start combat with 1 Weak.",
    rarity: "UNCOMMON",
  },
  {
    id: "cursed_diacrit",
    name: "Cursed Diacrit",
    description: "+1 energy per turn, but add Haunting Regret each combat.",
    rarity: "RARE",
  },
  {
    id: "runic_bulwark",
    name: "Runic Bulwark",
    description: "Retain 50% of your remaining Block each turn.",
    rarity: "RARE",
  },
  {
    id: "eternal_hourglass",
    name: "Eternal Hourglass",
    description: "Unspent energy is conserved between turns.",
    rarity: "RARE",
  },
  {
    id: "briar_codex",
    name: "Briar Codex",
    description: "Start each combat with 2 Thorns.",
    rarity: "UNCOMMON",
  },
  {
    id: "warded_ribbon",
    name: "Warded Ribbon",
    description: "Start each combat with 6 Block.",
    rarity: "COMMON",
  },
  {
    id: "inkwell_reservoir",
    name: "Inkwell Reservoir",
    description: "+1 max ink and start each combat with 1 ink.",
    rarity: "COMMON",
  },
  {
    id: "battle_lexicon",
    name: "Battle Lexicon",
    description: "Start each combat with +1 Strength.",
    rarity: "UNCOMMON",
  },
];

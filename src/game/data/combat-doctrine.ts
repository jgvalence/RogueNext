import type { BiomeType, EnemyRole } from "../schemas/enums";

export interface BiomeCombatDoctrine {
  biome: BiomeType;
  fantasy: string;
  attackTheme: string[];
  supportTheme: string[];
  controlTheme: string[];
}

export const biomeCombatDoctrines: BiomeCombatDoctrine[] = [
  {
    biome: "LIBRARY",
    fantasy: "Knowledge warfare and deck disruption",
    attackTheme: ["precise chip damage", "ink pressure"],
    supportTheme: ["curse injection", "resource denial setup"],
    controlTheme: ["draw redirection", "hand lock effects"],
  },
  {
    biome: "VIKING",
    fantasy: "Brutal momentum",
    attackTheme: ["burst damage", "tempo tax"],
    supportTheme: ["rage prep", "opening pressure"],
    controlTheme: ["cost pressure"],
  },
  {
    biome: "GREEK",
    fantasy: "Martial tactics",
    attackTheme: ["burst windows", "debuff punish"],
    supportTheme: ["aegis stance", "counter setup"],
    controlTheme: ["measured cost pressure"],
  },
  {
    biome: "EGYPTIAN",
    fantasy: "Attrition and curses",
    attackTheme: ["steady damage", "debuff layering"],
    supportTheme: ["sustain and guard"],
    controlTheme: ["draw and tempo erosion"],
  },
  {
    biome: "LOVECRAFTIAN",
    fantasy: "Mind collapse",
    attackTheme: ["chaotic spikes", "ink disruption"],
    supportTheme: ["summon pressure", "curse spread"],
    controlTheme: ["freeze hand", "decision denial"],
  },
  {
    biome: "AZTEC",
    fantasy: "Ritual aggression",
    attackTheme: ["high-risk burst", "tax on response"],
    supportTheme: ["ritual setup"],
    controlTheme: ["short-term cost spikes"],
  },
  {
    biome: "CELTIC",
    fantasy: "Endurance and retaliation",
    attackTheme: ["grind damage"],
    supportTheme: ["thorns and warding"],
    controlTheme: ["tempo slows"],
  },
  {
    biome: "RUSSIAN",
    fantasy: "Cold tempo",
    attackTheme: ["disciplined strikes"],
    supportTheme: ["defensive posture"],
    controlTheme: ["draw suppression", "resource drag"],
  },
  {
    biome: "AFRICAN",
    fantasy: "Group coordination",
    attackTheme: ["pack focus fire"],
    supportTheme: ["command auras", "team buffs"],
    controlTheme: ["rewrite denial windows"],
  },
];

export const enemyRolePrinciples: Record<EnemyRole, string[]> = {
  ASSAULT: [
    "Prioritize direct damage patterns",
    "Keep at least one reliable hit intent",
  ],
  SUPPORT: [
    "Enable allied plans through buffs or setup",
    "Must have offensive fallback when isolated",
  ],
  CONTROL: [
    "Disrupt hand, draw, ink, or card costs",
    "Still applies pressure with chip damage",
  ],
  TANK: ["Absorb pressure with block/mitigation", "Anchor the encounter pace"],
  HYBRID: ["Mix two roles with moderate reliability"],
};

export const disruptionEffectCatalog = [
  "FREEZE_HAND_CARDS",
  "NEXT_DRAW_TO_DISCARD_THIS_TURN",
  "DISABLE_INK_POWER_THIS_TURN",
  "INCREASE_CARD_COST_THIS_TURN",
  "INCREASE_CARD_COST_NEXT_TURN",
  "REDUCE_DRAW_THIS_TURN",
  "REDUCE_DRAW_NEXT_TURN",
  "FORCE_DISCARD_RANDOM",
] as const;

// Shared buff metadata used by BuffPill and parseDescriptionWithTooltips

export const buffMeta: Record<
  string,
  { label: string; color: string; description: (stacks: number) => string }
> = {
  POISON: {
    label: "Poison",
    color: "bg-green-900 text-green-300",
    description: (s) =>
      `Deals ${s} damage at end of turn, then decreases by 1.`,
  },
  WEAK: {
    label: "Weak",
    color: "bg-yellow-900 text-yellow-300",
    description: () => "Reduces damage dealt by 25%.",
  },
  VULNERABLE: {
    label: "Vulnerable",
    color: "bg-orange-900 text-orange-300",
    description: () => "Increases damage taken by 50%.",
  },
  STRENGTH: {
    label: "Strength",
    color: "bg-red-900 text-red-300",
    description: (s) => `Increases all damage dealt by ${s}.`,
  },
  FOCUS: {
    label: "Focus",
    color: "bg-blue-900 text-blue-300",
    description: (s) => `Increases block gained by ${s}.`,
  },
  THORNS: {
    label: "Thorns",
    color: "bg-rose-900 text-rose-300",
    description: (s) => `Deals ${s} damage to attackers.`,
  },
};

// Maps display label names (as they appear in card descriptions) to buff keys.
// Used by parseDescriptionWithTooltips to detect and wrap buff names with tooltips.
export const buffLabelToKey: Record<string, string> = {
  Poison: "POISON",
  Vulnerable: "VULNERABLE",
  Weak: "WEAK",
  Strength: "STRENGTH",
  Focus: "FOCUS",
  Thorns: "THORNS",
};

import { i18n } from "@/lib/i18n";

type BuffMetaEntry = {
  color: string;
  label: () => string;
  description: (stacks: number) => string;
};

export const buffMeta: Record<string, BuffMetaEntry> = {
  POISON: {
    color: "bg-green-900 text-green-300",
    label: () => i18n.t("buff.POISON.label"),
    description: (stacks) => i18n.t("buff.POISON.description", { stacks }),
  },
  WEAK: {
    color: "bg-yellow-900 text-yellow-300",
    label: () => i18n.t("buff.WEAK.label"),
    description: (stacks) => i18n.t("buff.WEAK.description", { stacks }),
  },
  VULNERABLE: {
    color: "bg-orange-900 text-orange-300",
    label: () => i18n.t("buff.VULNERABLE.label"),
    description: (stacks) => i18n.t("buff.VULNERABLE.description", { stacks }),
  },
  STUN: {
    color: "bg-slate-700 text-slate-100",
    label: () => i18n.t("buff.STUN.label"),
    description: (stacks) => i18n.t("buff.STUN.description", { stacks }),
  },
  STUN_IMMUNITY: {
    color: "bg-cyan-950 text-cyan-200",
    label: () => i18n.t("buff.STUN_IMMUNITY.label"),
    description: (stacks) =>
      i18n.t("buff.STUN_IMMUNITY.description", { stacks }),
  },
  STRENGTH: {
    color: "bg-red-900 text-red-300",
    label: () => i18n.t("buff.STRENGTH.label"),
    description: (stacks) => i18n.t("buff.STRENGTH.description", { stacks }),
  },
  FOCUS: {
    color: "bg-blue-900 text-blue-300",
    label: () => i18n.t("buff.FOCUS.label"),
    description: (stacks) => i18n.t("buff.FOCUS.description", { stacks }),
  },
  THORNS: {
    color: "bg-rose-900 text-rose-300",
    label: () => i18n.t("buff.THORNS.label"),
    description: (stacks) => i18n.t("buff.THORNS.description", { stacks }),
  },
  BLEED: {
    color: "bg-red-950 text-red-400",
    label: () => i18n.t("buff.BLEED.label"),
    description: (stacks) => i18n.t("buff.BLEED.description", { stacks }),
  },
  WARD: {
    color: "bg-cyan-900 text-cyan-200",
    label: () => i18n.t("buff.WARD.label"),
    description: (stacks) => i18n.t("buff.WARD.description", { stacks }),
  },
  EXHAUST_ENERGY: {
    color: "bg-amber-900 text-amber-200",
    label: () => i18n.t("buff.EXHAUST_ENERGY.label"),
    description: (stacks) =>
      i18n.t("buff.EXHAUST_ENERGY.description", { stacks }),
  },
  POISON_BURST: {
    color: "bg-emerald-900 text-emerald-200",
    label: () => i18n.t("buff.POISON_BURST.label"),
    description: (stacks) =>
      i18n.t("buff.POISON_BURST.description", { stacks }),
  },
  STONEBOUND: {
    color: "bg-stone-800 text-stone-100",
    label: () => i18n.t("buff.STONEBOUND.label"),
    description: (stacks) => i18n.t("buff.STONEBOUND.description", { stacks }),
  },
};

export function getBuffLabelToKeyMap(): Record<string, string> {
  const labels: Record<string, string> = {};

  for (const [key, meta] of Object.entries(buffMeta)) {
    const currentLabel = meta.label();
    labels[currentLabel] = key;
  }

  // Ensure both FR and EN labels are recognized regardless of active language.
  labels.Poison = "POISON";
  labels.Poisonner = "POISON";
  labels.Weak = "WEAK";
  labels.Faible = "WEAK";
  labels.Vulnerable = "VULNERABLE";
  labels.Stun = "STUN";
  labels.Etourdi = "STUN";
  labels.Strength = "STRENGTH";
  labels.Force = "STRENGTH";
  labels.Focus = "FOCUS";
  labels.Concentration = "FOCUS";
  labels.Thorns = "THORNS";
  labels.Epines = "THORNS";
  labels.Bleed = "BLEED";
  labels.Saignement = "BLEED";
  labels.Ward = "WARD";
  labels.Garde = "WARD";
  labels["Ember Flow"] = "EXHAUST_ENERGY";
  labels["Flux de braise"] = "EXHAUST_ENERGY";
  labels["Venom Rite"] = "POISON_BURST";
  labels["Rite venimeux"] = "POISON_BURST";
  labels.Stonebound = "STONEBOUND";
  labels.Petrifie = "STONEBOUND";

  return labels;
}

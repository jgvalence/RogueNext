import type { UsableItemDefinition } from "@/game/schemas/items";

export interface UsableItemUiMeta {
  label: string;
  className: string;
  targetLabel: string;
}

export function getUsableItemUiMeta(
  def: UsableItemDefinition
): UsableItemUiMeta {
  const primaryEffect = def.effects[0];
  const targetLabel = def.targeting === "SINGLE_ENEMY" ? "Cible" : "Soi";

  if (!primaryEffect) {
    return {
      label: "OBJ",
      className: "border-slate-500/60 bg-slate-900/60 text-slate-200",
      targetLabel,
    };
  }

  if (primaryEffect.type === "DAMAGE") {
    return {
      label: "DMG",
      className: "border-rose-400/70 bg-rose-950/70 text-rose-100",
      targetLabel,
    };
  }

  if (primaryEffect.type === "BLOCK") {
    return {
      label: "ARM",
      className: "border-sky-400/70 bg-sky-950/70 text-sky-100",
      targetLabel,
    };
  }

  if (primaryEffect.type === "DRAW_CARDS") {
    return {
      label: "PIO",
      className: "border-cyan-400/70 bg-cyan-950/70 text-cyan-100",
      targetLabel,
    };
  }

  if (primaryEffect.type === "GAIN_ENERGY") {
    return {
      label: "ENE",
      className: "border-yellow-300/70 bg-yellow-950/70 text-yellow-100",
      targetLabel,
    };
  }

  if (primaryEffect.type === "GAIN_INK") {
    return {
      label: "ENC",
      className: "border-violet-400/70 bg-violet-950/70 text-violet-100",
      targetLabel,
    };
  }

  if (
    primaryEffect.type === "GAIN_STRENGTH" ||
    primaryEffect.type === "GAIN_FOCUS" ||
    primaryEffect.type === "APPLY_BUFF"
  ) {
    return {
      label: "BUF",
      className: "border-emerald-400/70 bg-emerald-950/70 text-emerald-100",
      targetLabel,
    };
  }

  if (primaryEffect.type === "APPLY_DEBUFF") {
    return {
      label: "MAL",
      className: "border-orange-400/70 bg-orange-950/70 text-orange-100",
      targetLabel,
    };
  }

  return {
    label: "OBJ",
    className: "border-slate-500/60 bg-slate-900/60 text-slate-200",
    targetLabel,
  };
}

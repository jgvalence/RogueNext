import type { CardDefinition } from "../schemas/cards";

/** Roles describe usable effects, never a card's name or rarity. */
export const BUILD_PATHS = [
  "ink",
  "armor",
  "poison",
  "bleed",
  "draw",
  "exhaust",
  "discard",
  "strength",
  "rhythm",
  "archive",
  "upgrade",
  "debt",
] as const;
export type BuildPath = (typeof BUILD_PATHS)[number];
export type BuildRole = "enabler" | "payoff";
export type BuildProfile = Partial<Record<BuildPath, BuildRole[]>>;

export function getBuildProfile(card: CardDefinition): BuildProfile {
  const profile: BuildProfile = {};
  const add = (path: BuildPath, role: BuildRole) => {
    const roles = (profile[path] ??= []);
    if (!roles.includes(role)) roles.push(role);
  };
  if (card.inkCost > 0 || card.inkedVariant) add("ink", "payoff");
  if (card.type === "POWER") add("exhaust", "enabler");
  for (const effect of card.effects) {
    const type = effect.type;
    if (type === "GAIN_INK" || type === "RHYTHM_REWARD") add("ink", "enabler");
    if (
      type === "BLOCK" ||
      type.startsWith("BLOCK_PER") ||
      effect.buff === "WARD"
    )
      add("armor", "enabler");
    if (
      type === "DAMAGE_EQUAL_BLOCK" ||
      effect.buff === "THORNS" ||
      type === "RETRIGGER_THORNS_ON_WEAK_ATTACK"
    )
      add("armor", "payoff");
    for (const [buff, path] of [
      ["POISON", "poison"],
      ["BLEED", "bleed"],
    ] as const) {
      if (type === "APPLY_DEBUFF" && effect.buff === buff && effect.value > 0)
        add(path, "enabler");
      if (
        (effect.buff === buff || effect.scalingBuff === buff) &&
        !["APPLY_DEBUFF", "APPLY_BUFF"].includes(type)
      )
        add(path, "payoff");
      if (type === "PROPAGATE_DOT" || type === "DAMAGE_PER_DOT_STACKS")
        add(path, "payoff");
    }
    if (type === "DOUBLE_POISON" || effect.buff === "POISON_BURST")
      add("poison", "payoff");
    if (type === "DRAW_CARDS" || type === "ARCHIVE_AND_DRAW")
      add("draw", "enabler");
    if (
      type === "DAMAGE_PER_DRAWN_THIS_TURN" ||
      type === "EMPTY_DRAW_PILE_BLOCK"
    )
      add("draw", "payoff");
    if (type === "EXHAUST") add("exhaust", "enabler");
    if (type.includes("PER_EXHAUSTED") || effect.buff === "EXHAUST_ENERGY")
      add("exhaust", "payoff");
    if (
      type === "FORCE_DISCARD_RANDOM" ||
      type === "NEXT_DRAW_TO_DISCARD_THIS_TURN" ||
      type === "ADD_CARD_TO_DISCARD"
    )
      add("discard", "enabler");
    if (
      type === "DAMAGE_PER_CLOG_IN_DISCARD" ||
      type === "MOVE_RANDOM_NON_CLOG_DISCARD_TO_HAND"
    )
      add("discard", "payoff");
    if (type === "GAIN_STRENGTH" || effect.buff === "STRENGTH")
      add("strength", "enabler");
    if (type === "DAMAGE" && card.type === "ATTACK") add("strength", "payoff");
    if (type === "RHYTHM_REWARD") {
      add("rhythm", "enabler");
      add("rhythm", "payoff");
    }
    if (
      type === "ARCHIVE_AND_DRAW" ||
      type === "TOPDECK_FROM_DISCARD" ||
      type === "REVEAL_AND_REVERSE_TOP" ||
      type === "RETAIN_CARDS"
    )
      add("archive", "enabler");
    if (
      type === "EMPTY_DRAW_PILE_BLOCK" ||
      type === "DAMAGE_PER_DRAWN_THIS_TURN"
    )
      add("archive", "payoff");
    if (type === "UPGRADE_RANDOM_CARD_IN_HAND" || type === "ARCHIVE_AND_DRAW")
      add("upgrade", "enabler");
    if (
      type === "DAMAGE_BONUS_IF_UPGRADED_IN_HAND" ||
      type === "COPY_LAST_CARD_TO_HAND"
    )
      add("upgrade", "payoff");
    if (type === "TAKE_ENERGY_DEBT") add("debt", "enabler");
    if (
      type === "EXACT_ENERGY_REWARD" ||
      type === "EXACT_INK_REWARD" ||
      type === "NEXT_CARD_DOUBLE_DAMAGE"
    )
      add("debt", "payoff");
    if (type === "DAMAGE_PER_CURRENT_INK" || type === "BLOCK_PER_CURRENT_INK")
      add("ink", "payoff");
  }
  if (card.onRandomDiscardEffects?.length) add("discard", "payoff");
  return profile;
}

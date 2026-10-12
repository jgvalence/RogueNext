import type { CombatState } from "../schemas/combat-state";
import type { CombatFeedbackInput } from "../schemas/combat-feedback";

/** Bounded, deterministic presentation journal. Never consumes gameplay RNG. */
export function appendCombatFeedback(
  state: CombatState,
  events: CombatFeedbackInput[]
): CombatState {
  if (!events.length) return state;
  let sequence = state.feedback?.sequence ?? 0;
  return {
    ...state,
    feedback: {
      sequence: sequence + events.length,
      events: [
        ...(state.feedback?.events ?? []),
        ...events.map((event) => ({ ...event, id: ++sequence })),
      ].slice(-64),
    },
  };
}

export function collectCombatFeedback(
  before: CombatState,
  after: CombatState,
  source?: string,
  damageKind: CombatFeedbackInput["kind"] = "hit",
  includeBlocked = false
): CombatState {
  if (before === after) return after;
  const events: CombatFeedbackInput[] = [];
  const nested = (after.feedback?.events ?? []).filter(
    (e) => e.id > (before.feedback?.sequence ?? 0)
  );
  const emit = (event: CombatFeedbackInput) => {
    if (!nested.some((e) => e.target === event.target && e.kind === event.kind))
      events.push({ ...event, source });
  };
  const entities = (s: CombatState) =>
    new Map<
      string,
      Pick<CombatState["player"], "currentHp" | "block" | "buffs">
    >([
      ["player", s.player] as const,
      ...s.enemies.map((e) => [e.instanceId, e] as const),
      ...s.allies.map((e) => [e.instanceId, e] as const),
    ]);
  const previous = entities(before);
  for (const [target, entity] of entities(after)) {
    const old = previous.get(target);
    if (!old || old.currentHp <= 0) continue;
    const damage = Math.max(0, old.currentHp - Math.max(0, entity.currentHp));
    const blocked = includeBlocked ? Math.max(0, old.block - entity.block) : 0;
    if (damage || blocked)
      emit({ kind: damageKind, target, amount: damage, blocked });
    if (entity.currentHp > old.currentHp)
      emit({ kind: "heal", target, amount: entity.currentHp - old.currentHp });
    if (entity.block > old.block)
      emit({ kind: "armor", target, amount: entity.block - old.block });
    for (const buff of entity.buffs) {
      const gain =
        buff.stacks -
        (old.buffs.find((b) => b.type === buff.type)?.stacks ?? 0);
      if (gain <= 0) continue;
      const kind =
        buff.type === "POISON"
          ? "poison"
          : buff.type === "BLEED"
            ? "bleed"
            : ["WEAK", "VULNERABLE", "STUN", "STONEBOUND"].includes(buff.type)
              ? "debuff"
              : "buff";
      emit({ kind, target, amount: gain });
    }
  }
  const statGain =
    Math.max(0, after.player.strength - before.player.strength) +
    Math.max(0, after.player.focus - before.player.focus);
  if (statGain) emit({ kind: "buff", target: "player", amount: statGain });
  const oldHand = new Set(before.hand.map((c) => c.instanceId));
  const drawn = after.hand.filter((c) => !oldHand.has(c.instanceId)).length;
  if (drawn) emit({ kind: "draw", target: "player", amount: drawn });
  const oldCards = new Map(
    [...before.hand, ...before.drawPile, ...before.discardPile].map((c) => [
      c.instanceId,
      c,
    ])
  );
  const upgraded = [
    ...after.hand,
    ...after.drawPile,
    ...after.discardPile,
  ].filter(
    (c) =>
      c.upgraded &&
      oldCards.has(c.instanceId) &&
      !oldCards.get(c.instanceId)!.upgraded
  ).length;
  if (upgraded) emit({ kind: "upgrade", target: "player", amount: upgraded });
  return appendCombatFeedback(after, events);
}

export function statusTickFeedback(
  target: string,
  beforeHp: number,
  poisonHp: number,
  bleedHp: number
): CombatFeedbackInput[] {
  const events: CombatFeedbackInput[] = [];
  const poison = Math.max(0, beforeHp - Math.max(0, poisonHp));
  const bleed = Math.max(0, Math.max(0, poisonHp) - Math.max(0, bleedHp));
  if (poison) events.push({ kind: "poisonTick", target, amount: poison });
  if (bleed) events.push({ kind: "bleedTick", target, amount: bleed });
  return events;
}

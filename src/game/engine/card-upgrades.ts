import type {
  CardDefinition,
  CardUpgrade,
  CardUpgradeBranch,
} from "../schemas/cards";
import type { Effect } from "../schemas/effects";

export function boostEffectsForUpgrade(effects: Effect[]): Effect[] {
  return effects.map((effect) => {
    switch (effect.type) {
      case "DAMAGE":
      case "BLOCK":
      case "HEAL":
      case "GAIN_INK":
        return {
          ...effect,
          value: Math.max(Math.floor(effect.value * 1.5), effect.value + 1),
        };
      case "DRAW_CARDS":
      case "GAIN_ENERGY":
      case "GAIN_STRENGTH":
      case "GAIN_FOCUS":
      case "DAMAGE_PER_DEBUFF":
      case "DAMAGE_PER_THIS_CARD_PLAYED":
      case "BLOCK_PER_DEBUFF":
      case "APPLY_BUFF_PER_DEBUFF":
      case "APPLY_BUFF":
      case "APPLY_DEBUFF":
        return { ...effect, value: effect.value + 1 };
      default:
        return effect;
    }
  });
}

function buildUpgradedDescriptionFromEffects(def: CardDefinition): string {
  return replaceValuesInDescription(
    def.description,
    def.effects,
    boostEffectsForUpgrade(def.effects)
  );
}

function replaceValuesInDescription(
  description: string,
  baseEffects: Effect[],
  upgradedEffects: Effect[]
): string {
  let nextDescription = description;
  for (let i = 0; i < baseEffects.length; i += 1) {
    const base = baseEffects[i];
    const boosted = upgradedEffects[i];
    if (!base || !boosted || base.value === boosted.value) continue;
    nextDescription = nextDescription.replace(
      new RegExp(`\\b${base.value}\\b`),
      String(boosted.value)
    );
  }
  return nextDescription;
}

function effectPattern(effects: Effect[]): string {
  return JSON.stringify(
    effects.map(({ value: _value, duration: _duration, ...effect }) => effect)
  );
}

function buildReliableCreativeUpgrade(
  def: CardDefinition,
  upgrade: CardUpgrade
): CardUpgrade {
  if (effectPattern(def.effects) !== effectPattern(upgrade.effects))
    return upgrade;

  const candidates: Array<{ effect: Effect; text: string }> =
    def.type === "ATTACK"
      ? def.targeting === "SINGLE_ENEMY"
        ? [
            {
              effect: {
                type: "DAMAGE_IF_TARGET_HAS_DEBUFF",
                value: 4,
                buff: "WEAK",
              },
              text: " Deal 4 additional damage if the target is Weak.",
            },
            { effect: { type: "GAIN_INK", value: 1 }, text: " Gain 1 Ink." },
            { effect: { type: "DRAW_CARDS", value: 1 }, text: " Draw 1 card." },
          ]
        : [
            { effect: { type: "GAIN_INK", value: 1 }, text: " Gain 1 Ink." },
            { effect: { type: "BLOCK", value: 4 }, text: " Gain 4 Block." },
            { effect: { type: "DRAW_CARDS", value: 1 }, text: " Draw 1 card." },
          ]
      : [
          { effect: { type: "DRAW_CARDS", value: 1 }, text: " Draw 1 card." },
          { effect: { type: "GAIN_INK", value: 2 }, text: " Gain 2 Ink." },
          {
            effect: { type: "MOVE_RANDOM_NON_CLOG_DISCARD_TO_HAND", value: 1 },
            text: " Return a non-Clog card from your discard pile to your hand.",
          },
        ];
  const occupied = new Set([
    ...def.effects.map((effect) => effect.type),
    ...getAlternativeEffectTypes(def),
  ]);
  const offset = [...def.id].reduce(
    (sum, character) => sum + character.charCodeAt(0),
    0
  );
  const ordered = candidates.map(
    (_, index) => candidates[(index + offset) % candidates.length]!
  );
  const choice =
    ordered.find(({ effect }) => !occupied.has(effect.type)) ?? ordered[0]!;
  return {
    ...upgrade,
    description: `${upgrade.description}${choice.text}`,
    effects: [...upgrade.effects, choice.effect],
  };
}

function getAlternativeEffectTypes(def: CardDefinition): string[] {
  if (def.characterId === "scribe")
    return ["UPGRADE_RANDOM_CARD_IN_HAND", "COPY_LAST_CARD_TO_HAND"];
  if (def.characterId === "bibliothecaire")
    return ["TOPDECK_FROM_DISCARD", "ARCHIVE_AND_DRAW"];
  if (def.characterId === "griot") return ["RHYTHM_REWARD", "PROPAGATE_DOT"];
  if (def.characterId === "fou")
    return ["EXACT_ENERGY_REWARD", "TAKE_ENERGY_DEBT", "EXACT_INK_REWARD"];
  return [];
}

export function buildUpgradedCardDefinition(
  def: CardDefinition,
  branch: CardUpgradeBranch = "A"
): CardDefinition {
  const selectedUpgrade = getCardUpgrade(def, branch);
  const effectKey = ({
    value: _value,
    duration: _duration,
    ...effect
  }: Effect) => JSON.stringify(effect);
  const baseKeys = new Set(def.effects.map(effectKey));
  const inkEffects =
    def.inkedVariant?.upgradedEffects ??
    boostEffectsForUpgrade(def.inkedVariant?.effects ?? []);
  const inkKeys = new Set(inkEffects.map(effectKey));
  const inkTarget = def.inkedVariant?.targeting ?? def.targeting;
  const branchSpecificInkedEffects = selectedUpgrade.effects.filter(
    (effect) =>
      !baseKeys.has(effectKey(effect)) &&
      !inkKeys.has(effectKey(effect)) &&
      isCompatibleUpgradeEffect(effect, inkTarget)
  );
  const upgradedInkedVariant = def.inkedVariant
    ? {
        ...def.inkedVariant,
        effects: [...inkEffects, ...branchSpecificInkedEffects],
        description:
          def.inkedVariant.upgradedDescription ??
          replaceValuesInDescription(
            def.inkedVariant.description,
            def.inkedVariant.effects,
            boostEffectsForUpgrade(def.inkedVariant.effects)
          ),
      }
    : null;

  if (selectedUpgrade) {
    return {
      ...def,
      description: selectedUpgrade.description,
      energyCost:
        selectedUpgrade.energyCost !== undefined
          ? selectedUpgrade.energyCost
          : def.energyCost,
      effects: selectedUpgrade.effects,
      onRandomDiscardEffects:
        selectedUpgrade.onRandomDiscardEffects ?? def.onRandomDiscardEffects,
      inkedVariant: upgradedInkedVariant,
    };
  }

  return {
    ...def,
    description: buildUpgradedDescriptionFromEffects(def),
    effects: boostEffectsForUpgrade(def.effects),
    onRandomDiscardEffects: boostEffectsForUpgrade(
      def.onRandomDiscardEffects ?? []
    ),
    inkedVariant: upgradedInkedVariant,
  };
}

function isCompatibleUpgradeEffect(
  effect: Effect,
  targeting: CardDefinition["targeting"]
): boolean {
  if (effect.type.startsWith("DAMAGE") || effect.type === "DOUBLE_POISON")
    return targeting === "SINGLE_ENEMY" || targeting === "ALL_ENEMIES";
  if (effect.type === "PROPAGATE_DOT") return targeting === "SINGLE_ENEMY";
  return true;
}

function buildAlternativeUpgrade(def: CardDefinition): CardUpgrade {
  // These cards offer a deliberate second build direction instead of the
  // class-wide default. Keep their base signatures in both branches.
  const authoredAlternatives: Record<string, { effect: Effect; text: string }> = {
    heavy_strike: { effect: { type: "DAMAGE_PER_EXHAUSTED_CARD", value: 2 }, text: " Deal 2 additional damage per exhausted card." },
    curse_word: { effect: { type: "GAIN_INK", value: 2 }, text: " Gain 2 Ink." },
    venin_du_serpent: { effect: { type: "PROPAGATE_DOT", value: 1 }, text: " Spread the target's Poison and Bleed concentration to other enemies." },
    plague_of_words: { effect: { type: "PROPAGATE_DOT", value: 1 }, text: " Spread the target's Poison and Bleed concentration to other enemies." },
    healing_script: { effect: { type: "ARCHIVE_AND_DRAW", value: 1 }, text: " Archive a card; it returns upgraded next turn. Draw a card." },
  };
  const authored = authoredAlternatives[def.id];
  if (authored && isCompatibleUpgradeEffect(authored.effect, def.targeting)) {
    return { description: `${def.description}${authored.text}`, effects: [...def.effects, authored.effect], onRandomDiscardEffects: def.onRandomDiscardEffects };
  }
  const identityCandidates: Effect[] =
    def.characterId === "griot"
      ? def.targeting === "SINGLE_ENEMY"
        ? [
            { type: "RHYTHM_REWARD", value: 1 },
            { type: "PROPAGATE_DOT", value: 1 },
          ]
        : [{ type: "RHYTHM_REWARD", value: 1 }]
      : def.characterId === "fou"
        ? [
            { type: "EXACT_ENERGY_REWARD", value: 6 },
            { type: "TAKE_ENERGY_DEBT", value: 1 },
            { type: "EXACT_INK_REWARD", value: 1 },
          ]
        : def.characterId === "scribe"
          ? [
              { type: "UPGRADE_RANDOM_CARD_IN_HAND", value: 1 },
              { type: "COPY_LAST_CARD_TO_HAND", value: 1 },
            ]
          : def.characterId === "bibliothecaire"
            ? [
                { type: "TOPDECK_FROM_DISCARD", value: 1 },
                { type: "ARCHIVE_AND_DRAW", value: 1 },
              ]
            : [];
  // Neutral cards express their biome instead of receiving the old generic
  // "costs one less" branch. This makes the second choice a build direction.
  const biomeCandidates: Partial<Record<CardDefinition["biome"], Effect[]>> = {
    VIKING: [
      { type: "DAMAGE_PER_EXHAUSTED_CARD", value: 2 },
      { type: "APPLY_BUFF_PER_EXHAUSTED_CARD", value: 1, buff: "STRENGTH" },
    ],
    GREEK: [
      { type: "TAKE_ENERGY_DEBT", value: 1 },
      { type: "EXACT_ENERGY_REWARD", value: 7 },
    ],
    EGYPTIAN: [
      { type: "ARCHIVE_AND_DRAW", value: 1 },
      { type: "TOPDECK_FROM_DISCARD", value: 1 },
    ],
    LOVECRAFTIAN: [
      { type: "DAMAGE_PER_CLOG_IN_DISCARD", value: 3 },
      { type: "ADD_CARD_TO_DISCARD", value: 1, cardId: "clog" },
    ],
    AZTEC: [
      { type: "DAMAGE_PER_DOT_STACKS", value: 1 },
      { type: "EXACT_INK_REWARD", value: 1 },
    ],
    CELTIC: [
      { type: "BLOCK_PER_EXHAUSTED_CARD", value: 2 },
      { type: "APPLY_BUFF", value: 2, buff: "THORNS" },
    ],
    RUSSIAN: [
      { type: "COPY_LAST_CARD_TO_HAND", value: 1 },
      { type: "MOVE_RANDOM_NON_CLOG_DISCARD_TO_HAND", value: 1 },
    ],
    AFRICAN: [
      { type: "RHYTHM_REWARD", value: 1 },
      { type: "PROPAGATE_DOT", value: 1 },
    ],
    LIBRARY: [
      { type: "UPGRADE_RANDOM_CARD_IN_HAND", value: 1 },
      { type: "TOPDECK_FROM_DISCARD", value: 1 },
    ],
  };
  const genericCandidates: Effect[] = [
    ...(biomeCandidates[def.biome] ?? []),
    ...(def.type === "ATTACK"
      ? [
          {
            type: "DAMAGE_IF_TARGET_HAS_DEBUFF",
            value: 5,
            buff: "WEAK",
          } as Effect,
          { type: "NEXT_CARD_DOUBLE_DAMAGE", value: 1 } as Effect,
        ]
      : [
          { type: "MOVE_RANDOM_NON_CLOG_DISCARD_TO_HAND", value: 1 } as Effect,
          { type: "RETAIN_CARDS", value: 1 } as Effect,
        ]),
  ];
  const candidates = [...identityCandidates, ...genericCandidates].filter(
    (effect) => isCompatibleUpgradeEffect(effect, def.targeting)
  );
  const existingTypes = new Set(
    [...def.effects, ...(def.upgrade?.effects ?? [])].map(
      (effect) => effect.type
    )
  );
  const bonusEffect =
    candidates.find((candidate) => !existingTypes.has(candidate.type)) ??
    candidates[0]!;
  const bonusDescriptions: Partial<Record<Effect["type"], string>> = {
    UPGRADE_RANDOM_CARD_IN_HAND:
      " Upgrade a random card in your hand for this combat.",
    COPY_LAST_CARD_TO_HAND: " Copy the last card played into your hand.",
    TOPDECK_FROM_DISCARD:
      " Put a card from your discard pile on top of your draw pile.",
    ARCHIVE_AND_DRAW:
      " Archive a card from your hand; it returns upgraded next turn. Draw a card.",
    RHYTHM_REWARD:
      " Alternate Attack and Skill to gain Ink; every third beat draws a card and grants 1 Energy.",
    PROPAGATE_DOT:
      " Raise other enemies' Poison and Bleed to the target's concentration without adding to existing stacks.",
    EXACT_ENERGY_REWARD: ` If this spends your last Energy, gain ${bonusEffect.value} Block.`,
    TAKE_ENERGY_DEBT: ` Borrow ${bonusEffect.value} Energy now; repay it at the start of upcoming turns.`,
    EXACT_INK_REWARD: ` If your Ink is empty, gain ${bonusEffect.value} Energy.`,
    DAMAGE_PER_EXHAUSTED_CARD: ` Deal ${bonusEffect.value} additional damage per exhausted card.`,
    APPLY_BUFF_PER_EXHAUSTED_CARD: ` Gain ${bonusEffect.value} Strength per exhausted card.`,
    DAMAGE_PER_CLOG_IN_DISCARD: ` Deal ${bonusEffect.value} additional damage per Clog in your discard pile.`,
    ADD_CARD_TO_DISCARD: " Add a Clog to your discard pile.",
    DAMAGE_PER_DOT_STACKS: ` Deal ${bonusEffect.value} additional damage per Poison or Bleed on the target.`,
    BLOCK_PER_EXHAUSTED_CARD: ` Gain ${bonusEffect.value} Block per exhausted card.`,
    APPLY_BUFF: ` Gain ${bonusEffect.value} Thorns.`,
    MOVE_RANDOM_NON_CLOG_DISCARD_TO_HAND:
      " Return a non-Clog card from your discard pile to your hand.",
    DAMAGE_IF_TARGET_HAS_DEBUFF: ` Deal ${bonusEffect.value} additional damage if the target is Weak.`,
    NEXT_CARD_DOUBLE_DAMAGE: " Your next Attack deals double damage.",
    RETAIN_CARDS: " Retain another random card in your hand for the next turn.",
  };
  const bonusDescription =
    bonusDescriptions[bonusEffect.type] ?? ` Trigger ${bonusEffect.type}.`;
  return {
    description: `${def.description}${bonusDescription}`,
    effects: [...def.effects, bonusEffect],
    onRandomDiscardEffects: def.onRandomDiscardEffects,
  };
}

export function getCardUpgrade(
  def: CardDefinition,
  branch: CardUpgradeBranch = "A"
): CardUpgrade {
  if (def.upgradeBranches) {
    return def.upgradeBranches[branch === "A" ? 0 : 1];
  }
  if (branch === "B") return buildAlternativeUpgrade(def);
  if (def.upgrade) return buildReliableCreativeUpgrade(def, def.upgrade);
  return buildReliableCreativeUpgrade(def, {
    description: buildUpgradedDescriptionFromEffects(def),
    effects: boostEffectsForUpgrade(def.effects),
    onRandomDiscardEffects: boostEffectsForUpgrade(
      def.onRandomDiscardEffects ?? []
    ),
  });
}

export function getCardUpgradeBranches(
  def: CardDefinition
): [CardUpgrade, CardUpgrade] {
  return [getCardUpgrade(def, "A"), getCardUpgrade(def, "B")];
}

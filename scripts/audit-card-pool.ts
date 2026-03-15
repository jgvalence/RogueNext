import { lootableCardDefinitions } from "../src/game/data/cards";
import type { CardDefinition } from "../src/game/schemas/cards";
import {
  buildCardExactMechanicSignature,
  buildCardPatternSignature,
} from "../src/game/engine/card-audit";

type Biome =
  | "LIBRARY"
  | "VIKING"
  | "GREEK"
  | "EGYPTIAN"
  | "LOVECRAFTIAN"
  | "AZTEC"
  | "CELTIC"
  | "RUSSIAN"
  | "AFRICAN";

type CharacterBucket = "neutral" | "scribe" | "bibliothecaire";
type BuildKey =
  | "vulnerable"
  | "weak"
  | "poison"
  | "bleed"
  | "ink"
  | "draw"
  | "discard"
  | "exhaust";

type BuildCoverageRow = {
  biome: Biome;
  total: number;
  missing: BuildKey[];
} & Record<BuildKey, number>;

type DuplicateGroup = {
  signature: string;
  count: number;
  cards: string[];
};

type CountRow = {
  biome: Biome;
  neutral: number;
  scribe: number;
  bibliothecaire: number;
  total: number;
};

type BuildTotalsRow = {
  totalCards: number;
} & Record<BuildKey, number>;

interface BuildTagDefinition {
  key: BuildKey;
  label: string;
  matches: (card: CardDefinition) => boolean;
}

const BIOMES: Biome[] = [
  "LIBRARY",
  "VIKING",
  "GREEK",
  "EGYPTIAN",
  "LOVECRAFTIAN",
  "AZTEC",
  "CELTIC",
  "RUSSIAN",
  "AFRICAN",
];

const CHARACTER_BUCKETS: CharacterBucket[] = [
  "neutral",
  "scribe",
  "bibliothecaire",
];

const BUILD_TAGS: BuildTagDefinition[] = [
  {
    key: "vulnerable",
    label: "Vulnerable",
    matches: (card) =>
      card.effects.some(
        (effect) =>
          (effect.type === "APPLY_DEBUFF" ||
            effect.type === "DAMAGE_PER_DEBUFF") &&
          effect.buff === "VULNERABLE"
      ),
  },
  {
    key: "weak",
    label: "Weak",
    matches: (card) =>
      card.effects.some(
        (effect) =>
          (effect.type === "APPLY_DEBUFF" ||
            effect.type === "BLOCK_PER_DEBUFF") &&
          effect.buff === "WEAK"
      ),
  },
  {
    key: "poison",
    label: "Poison",
    matches: (card) =>
      card.effects.some(
        (effect) =>
          (effect.type === "APPLY_DEBUFF" && effect.buff === "POISON") ||
          (effect.type === "DAMAGE_PER_DEBUFF" && effect.buff === "POISON") ||
          effect.type === "DOUBLE_POISON"
      ),
  },
  {
    key: "bleed",
    label: "Bleed",
    matches: (card) =>
      card.effects.some(
        (effect) =>
          (effect.type === "APPLY_DEBUFF" ||
            effect.type === "DAMAGE_PER_DEBUFF" ||
            effect.type === "BLOCK_PER_DEBUFF") &&
          effect.buff === "BLEED"
      ),
  },
  {
    key: "ink",
    label: "Ink",
    matches: (card) =>
      card.inkCost > 0 ||
      card.effects.some(
        (effect) =>
          effect.type === "GAIN_INK" ||
          effect.type === "DRAIN_INK" ||
          effect.type === "DAMAGE_PER_CURRENT_INK"
      ),
  },
  {
    key: "draw",
    label: "Draw",
    matches: (card) =>
      card.effects.some((effect) => effect.type === "DRAW_CARDS"),
  },
  {
    key: "discard",
    label: "Discard",
    matches: (card) =>
      card.effects.some((effect) =>
        [
          "ADD_CARD_TO_DISCARD",
          "MOVE_RANDOM_NON_CLOG_DISCARD_TO_HAND",
          "FORCE_DISCARD_RANDOM",
          "NEXT_DRAW_TO_DISCARD_THIS_TURN",
          "DAMAGE_PER_CLOG_IN_DISCARD",
        ].includes(effect.type)
      ),
  },
  {
    key: "exhaust",
    label: "Exhaust",
    matches: (card) =>
      card.effects.some(
        (effect) =>
          effect.type === "EXHAUST" ||
          effect.type === "DAMAGE_PER_EXHAUSTED_CARD" ||
          effect.type === "BLOCK_PER_EXHAUSTED_CARD" ||
          effect.type === "APPLY_BUFF_PER_EXHAUSTED_CARD"
      ),
  },
];

function isPlayable(card: CardDefinition): boolean {
  return card.type !== "STATUS" && card.type !== "CURSE";
}

function isActive(card: CardDefinition): boolean {
  return isPlayable(card) && card.isCollectible !== false;
}

function isBestiary(card: CardDefinition): boolean {
  return card.id.startsWith("bestiary_");
}

function getCharacterBucket(card: CardDefinition): CharacterBucket {
  if (card.characterId === "scribe") return "scribe";
  if (card.characterId === "bibliothecaire") return "bibliothecaire";
  return "neutral";
}

function formatCardLabel(card: CardDefinition): string {
  return `${card.id} (${card.biome}/${card.characterId ?? "neutral"})`;
}

function countByBiomeAndCharacter(cards: CardDefinition[]): CountRow[] {
  return BIOMES.map((biome) => {
    const biomeCards = cards.filter((card) => card.biome === biome);
    const row: CountRow = {
      biome,
      neutral: 0,
      scribe: 0,
      bibliothecaire: 0,
      total: biomeCards.length,
    };

    for (const bucket of CHARACTER_BUCKETS) {
      row[bucket] = biomeCards.filter(
        (card) => getCharacterBucket(card) === bucket
      ).length;
    }

    return row;
  });
}

function buildCoverageTotals(cards: CardDefinition[]): BuildTotalsRow {
  const totals: BuildTotalsRow = {
    totalCards: cards.length,
    vulnerable: 0,
    weak: 0,
    poison: 0,
    bleed: 0,
    ink: 0,
    draw: 0,
    discard: 0,
    exhaust: 0,
  };

  for (const tag of BUILD_TAGS) {
    totals[tag.key] = cards.filter((card) => tag.matches(card)).length;
  }

  return totals;
}

function buildCoverageRows(cards: CardDefinition[]): BuildCoverageRow[] {
  return BIOMES.map((biome) => {
    const biomeCards = cards.filter((card) => card.biome === biome);
    const row: BuildCoverageRow = {
      biome,
      total: biomeCards.length,
      vulnerable: 0,
      weak: 0,
      poison: 0,
      bleed: 0,
      ink: 0,
      draw: 0,
      discard: 0,
      exhaust: 0,
      missing: [],
    };

    for (const tag of BUILD_TAGS) {
      row[tag.key] = biomeCards.filter((card) => tag.matches(card)).length;
    }

    row.missing = BUILD_TAGS.filter((tag) => row[tag.key] === 0).map(
      (tag) => tag.key
    );

    return row;
  });
}

function groupDuplicateCards(
  cards: CardDefinition[],
  signatureBuilder: (card: CardDefinition) => string,
  minGroupSize = 2
): DuplicateGroup[] {
  const groups = new Map<string, CardDefinition[]>();

  for (const card of cards) {
    const signature = signatureBuilder(card);
    const existing = groups.get(signature);
    if (existing) {
      existing.push(card);
      continue;
    }
    groups.set(signature, [card]);
  }

  return [...groups.entries()]
    .filter(([, groupedCards]) => groupedCards.length >= minGroupSize)
    .sort((left, right) => right[1].length - left[1].length)
    .map(([signature, groupedCards]) => ({
      signature,
      count: groupedCards.length,
      cards: groupedCards.map((card) => formatCardLabel(card)),
    }));
}

function formatMarkdownTable(
  headers: string[],
  rows: Array<Array<string | number>>
): string {
  const headerLine = `| ${headers.join(" | ")} |`;
  const separatorLine = `| ${headers.map(() => "---").join(" | ")} |`;
  const bodyLines = rows.map((row) => `| ${row.join(" | ")} |`);
  return [headerLine, separatorLine, ...bodyLines].join("\n");
}

function pushDuplicateSection(
  lines: string[],
  title: string,
  groups: DuplicateGroup[],
  emptyLabel: string,
  limit = 12
): void {
  lines.push(title);
  lines.push("");
  if (groups.length === 0) {
    lines.push(`- ${emptyLabel}`);
    lines.push("");
    return;
  }

  for (const group of groups.slice(0, limit)) {
    lines.push(`- **${group.count} cards** share \`${group.signature}\``);
    lines.push(`  ${group.cards.join(", ")}`);
  }
  lines.push("");
}

function main() {
  const allCards = lootableCardDefinitions;
  const playableCards = allCards.filter(isPlayable);
  const activeCards = playableCards.filter(isActive);
  const activeNonBestiaryCards = activeCards.filter((card) => !isBestiary(card));
  const bestiaryCards = activeCards.filter(isBestiary);

  const collectionRows = countByBiomeAndCharacter(playableCards);
  const activeRows = countByBiomeAndCharacter(activeCards);
  const activeNonBestiaryRows = countByBiomeAndCharacter(activeNonBestiaryCards);
  const bestiaryRows = countByBiomeAndCharacter(bestiaryCards);
  const coverageRows = buildCoverageRows(activeNonBestiaryCards);
  const buildTotals = buildCoverageTotals(activeNonBestiaryCards);
  const authoredPatternGroups = groupDuplicateCards(
    activeNonBestiaryCards,
    buildCardPatternSignature,
    3
  );
  const bestiaryExactDuplicateGroups = groupDuplicateCards(
    bestiaryCards,
    buildCardExactMechanicSignature
  );
  const bestiaryPatternDuplicateGroups = groupDuplicateCards(
    bestiaryCards,
    buildCardPatternSignature
  );
  const allCardExactDuplicateGroups = groupDuplicateCards(
    activeCards,
    buildCardExactMechanicSignature
  );
  const allCardPatternDuplicateGroups = groupDuplicateCards(
    activeCards,
    buildCardPatternSignature
  );

  const payload = {
    generatedAt: new Date().toISOString(),
    totals: {
      all: allCards.length,
      playable: playableCards.length,
      active: activeCards.length,
      activeNonBestiary: activeNonBestiaryCards.length,
      bestiaryActive: bestiaryCards.length,
    },
    collectionRows,
    activeRows,
    activeNonBestiaryRows,
    bestiaryRows,
    coverageRows,
    buildTotals,
    authoredPatternGroups,
    bestiaryExactDuplicateGroups,
    bestiaryPatternDuplicateGroups,
    allCardExactDuplicateGroups,
    allCardPatternDuplicateGroups,
  };

  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const lines: string[] = [];
  lines.push("# Card Pool Audit");
  lines.push("");
  lines.push("Generated from `src/game/data/cards.ts`.");
  lines.push("");
  lines.push("## Totals");
  lines.push("");
  lines.push(`- All card definitions: **${payload.totals.all}**`);
  lines.push(
    `- Playable lootable cards (excluding STATUS/CURSE): **${payload.totals.playable}**`
  );
  lines.push(
    `- Active reward/merchant pool (\`isCollectible !== false\`): **${payload.totals.active}**`
  );
  lines.push(
    `- Hand-authored active cards (excluding generated bestiary): **${payload.totals.activeNonBestiary}**`
  );
  lines.push(`- Active bestiary cards: **${payload.totals.bestiaryActive}**`);
  lines.push("");
  lines.push("## Collection By Biome");
  lines.push("");
  lines.push("Counts below include generated bestiary cards.");
  lines.push("");
  lines.push(
    formatMarkdownTable(
      ["Biome", "Neutral", "Scribe", "Bibliothecaire", "Total"],
      collectionRows.map((row) => [
        row.biome,
        row.neutral,
        row.scribe,
        row.bibliothecaire,
        row.total,
      ])
    )
  );
  lines.push("");
  lines.push("## Active Pool By Biome");
  lines.push("");
  lines.push("Counts below include generated bestiary cards.");
  lines.push("");
  lines.push(
    formatMarkdownTable(
      ["Biome", "Neutral", "Scribe", "Bibliothecaire", "Total"],
      activeRows.map((row) => [
        row.biome,
        row.neutral,
        row.scribe,
        row.bibliothecaire,
        row.total,
      ])
    )
  );
  lines.push("");
  lines.push("## Active Hand-Authored Pool By Biome");
  lines.push("");
  lines.push("Counts below exclude generated bestiary cards.");
  lines.push("");
  lines.push(
    formatMarkdownTable(
      ["Biome", "Neutral", "Scribe", "Bibliothecaire", "Total"],
      activeNonBestiaryRows.map((row) => [
        row.biome,
        row.neutral,
        row.scribe,
        row.bibliothecaire,
        row.total,
      ])
    )
  );
  lines.push("");
  lines.push("## Active Bestiary By Biome");
  lines.push("");
  lines.push(
    "Bestiary cards are still attached to a biome via `card.biome`, even when they are generated from enemy unlocks."
  );
  lines.push("");
  lines.push(
    formatMarkdownTable(
      ["Biome", "Neutral", "Scribe", "Bibliothecaire", "Total"],
      bestiaryRows.map((row) => [
        row.biome,
        row.neutral,
        row.scribe,
        row.bibliothecaire,
        row.total,
      ])
    )
  );
  lines.push("");
  lines.push("## Build Coverage By Biome");
  lines.push("");
  lines.push(
    "Counts below use the active non-bestiary pool so generated mastery cards do not hide hand-authored gaps."
  );
  lines.push("");
  lines.push(
    formatMarkdownTable(
      [
        "Biome",
        "Vulnerable",
        "Weak",
        "Poison",
        "Bleed",
        "Ink",
        "Draw",
        "Discard",
        "Exhaust",
        "Missing",
      ],
      coverageRows.map((row) => [
        row.biome,
        row.vulnerable,
        row.weak,
        row.poison,
        row.bleed,
        row.ink,
        row.draw,
        row.discard,
        row.exhaust,
        row.missing.length > 0 ? row.missing.join(", ") : "none",
      ])
    )
  );
  lines.push("");
  lines.push("## Build Tag Totals");
  lines.push("");
  lines.push(
    "These totals use the active non-bestiary pool. Tags overlap: one card can count for multiple builds."
  );
  lines.push("");
  lines.push(
    formatMarkdownTable(
      [
        "Total Cards",
        "Vulnerable",
        "Weak",
        "Poison",
        "Bleed",
        "Ink",
        "Draw",
        "Discard",
        "Exhaust",
      ],
      [
        [
          buildTotals.totalCards,
          buildTotals.vulnerable,
          buildTotals.weak,
          buildTotals.poison,
          buildTotals.bleed,
          buildTotals.ink,
          buildTotals.draw,
          buildTotals.discard,
          buildTotals.exhaust,
        ],
      ]
    )
  );
  lines.push("");
  pushDuplicateSection(
    lines,
    "## Hand-Authored Pattern Hotspots",
    authoredPatternGroups,
    "No repeated hand-authored patterns across 3+ cards."
  );
  pushDuplicateSection(
    lines,
    "## Bestiary Exact Duplicate Mechanics",
    bestiaryExactDuplicateGroups,
    "No exact duplicate mechanics detected in active bestiary cards."
  );
  pushDuplicateSection(
    lines,
    "## Bestiary Pattern Hotspots",
    bestiaryPatternDuplicateGroups,
    "No repeated bestiary mechanic patterns detected."
  );
  pushDuplicateSection(
    lines,
    "## Global Exact Duplicate Mechanics",
    allCardExactDuplicateGroups,
    "No exact duplicate mechanics detected across active cards."
  );
  pushDuplicateSection(
    lines,
    "## Global Pattern Hotspots",
    allCardPatternDuplicateGroups,
    "No repeated mechanic patterns detected across active cards."
  );

  console.log(lines.join("\n"));
}

main();

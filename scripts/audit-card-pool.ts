import { lootableCardDefinitions } from "../src/game/data/cards";
import type { CardDefinition } from "../src/game/schemas/cards";

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
          ((effect.type === "APPLY_DEBUFF" ||
            effect.type === "DAMAGE_PER_DEBUFF") &&
            effect.buff === "VULNERABLE")
      ),
  },
  {
    key: "weak",
    label: "Weak",
    matches: (card) =>
      card.effects.some(
        (effect) =>
          ((effect.type === "APPLY_DEBUFF" ||
            effect.type === "BLOCK_PER_DEBUFF") &&
            effect.buff === "WEAK")
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
          ((effect.type === "APPLY_DEBUFF" ||
            effect.type === "DAMAGE_PER_DEBUFF" ||
            effect.type === "BLOCK_PER_DEBUFF") &&
            effect.buff === "BLEED")
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

function countByBiomeAndCharacter(cards: CardDefinition[]) {
  return BIOMES.map((biome) => {
    const biomeCards = cards.filter((card) => card.biome === biome);
    const row = {
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

function buildSimilaritySignature(card: CardDefinition): string {
  const effectSignature = card.effects
    .map((effect) => {
      if (
        effect.type === "APPLY_DEBUFF" ||
        effect.type === "APPLY_BUFF" ||
        effect.type === "DAMAGE_PER_DEBUFF" ||
        effect.type === "BLOCK_PER_DEBUFF"
      ) {
        return `${effect.type}:${effect.buff}`;
      }
      if (effect.type === "ADD_CARD_TO_DISCARD") {
        return `${effect.type}:${effect.cardId}`;
      }
      return effect.type;
    })
    .sort()
    .join("+");

  return `${card.type}|${card.energyCost}|${card.targeting}|${effectSignature}`;
}

function groupSimilarCards(cards: CardDefinition[]) {
  const groups = new Map<string, CardDefinition[]>();

  for (const card of cards) {
    const signature = buildSimilaritySignature(card);
    const existing = groups.get(signature);
    if (existing) {
      existing.push(card);
      continue;
    }
    groups.set(signature, [card]);
  }

  return [...groups.entries()]
    .filter(([, groupedCards]) => groupedCards.length >= 3)
    .sort((left, right) => right[1].length - left[1].length)
    .map(([signature, groupedCards]) => ({
      signature,
      count: groupedCards.length,
      cards: groupedCards.map(
        (card) =>
          `${card.id} (${card.biome}/${card.characterId ?? "neutral"})`
      ),
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

function loadCards(): CardDefinition[] {
  return lootableCardDefinitions;
}

function main() {
  const allCards = loadCards();
  const playableCards = allCards.filter(isPlayable);
  const activeCards = playableCards.filter(isActive);
  const activeNonBestiaryCards = activeCards.filter((card) => !isBestiary(card));
  const bestiaryCards = activeCards.filter(isBestiary);

  const collectionRows = countByBiomeAndCharacter(playableCards);
  const activeRows = countByBiomeAndCharacter(activeCards);
  const coverageRows = buildCoverageRows(activeNonBestiaryCards);
  const similarityGroups = groupSimilarCards(activeNonBestiaryCards);

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
    coverageRows,
    similarityGroups,
  };

  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const lines: string[] = [];
  lines.push("# Card Pool Audit");
  lines.push("");
  lines.push(`Generated from \`src/game/data/cards.ts\`.`);
  lines.push("");
  lines.push("## Totals");
  lines.push("");
  lines.push(
    `- All card definitions: **${payload.totals.all}**`
  );
  lines.push(
    `- Playable lootable cards (excluding STATUS/CURSE): **${payload.totals.playable}**`
  );
  lines.push(
    `- Active reward/merchant pool (\`isCollectible !== false\`): **${payload.totals.active}**`
  );
  lines.push(
    `- Hand-authored active cards (excluding generated bestiary): **${payload.totals.activeNonBestiary}**`
  );
  lines.push(
    `- Active bestiary cards: **${payload.totals.bestiaryActive}**`
  );
  lines.push("");
  lines.push("## Collection By Biome");
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
  lines.push("## Similarity Hotspots");
  lines.push("");

  for (const group of similarityGroups.slice(0, 12)) {
    lines.push(`- **${group.count} cards** share \`${group.signature}\``);
    lines.push(`  ${group.cards.join(", ")}`);
  }

  console.log(lines.join("\n"));
}

main();

import { relicDefinitions } from "../src/game/data/relics";

type DuplicateGroup = {
  signature: string;
  count: number;
  relics: string[];
};

function normalizeWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function buildExactDescriptionSignature(description: string): string {
  return normalizeWhitespace(description);
}

function buildPatternDescriptionSignature(description: string): string {
  return normalizeWhitespace(description)
    .replace(/\d+%/g, "#%")
    .replace(/\d+/g, "#");
}

function formatRelicLabel(relic: (typeof relicDefinitions)[number]): string {
  const source = relic.sourceBossId ? ` boss:${relic.sourceBossId}` : " general";
  return `${relic.id} (${relic.rarity},${source})`;
}

function groupDuplicates(
  signatureBuilder: (description: string) => string
): DuplicateGroup[] {
  const groups = new Map<string, (typeof relicDefinitions)[number][]>();

  for (const relic of relicDefinitions) {
    const signature = signatureBuilder(relic.description);
    const existing = groups.get(signature);
    if (existing) {
      existing.push(relic);
      continue;
    }
    groups.set(signature, [relic]);
  }

  return [...groups.entries()]
    .filter(([, relics]) => relics.length >= 2)
    .sort((left, right) => right[1].length - left[1].length)
    .map(([signature, relics]) => ({
      signature,
      count: relics.length,
      relics: relics.map((relic) => formatRelicLabel(relic)),
    }));
}

function pushSection(
  lines: string[],
  title: string,
  groups: DuplicateGroup[],
  emptyLabel: string
): void {
  lines.push(title);
  lines.push("");
  if (groups.length === 0) {
    lines.push(`- ${emptyLabel}`);
    lines.push("");
    return;
  }

  for (const group of groups) {
    lines.push(`- **${group.count} relics** share \`${group.signature}\``);
    lines.push(`  ${group.relics.join(", ")}`);
  }
  lines.push("");
}

function main() {
  const exactDuplicateGroups = groupDuplicates(buildExactDescriptionSignature);
  const patternDuplicateGroups = groupDuplicates(buildPatternDescriptionSignature);
  const payload = {
    generatedAt: new Date().toISOString(),
    totals: {
      all: relicDefinitions.length,
    },
    exactDuplicateGroups,
    patternDuplicateGroups,
  };

  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const lines: string[] = [];
  lines.push("# Relic Pool Audit");
  lines.push("");
  lines.push("Generated from `src/game/data/relics.ts`.");
  lines.push("");
  lines.push(`- Total relic definitions: **${relicDefinitions.length}**`);
  lines.push("");
  pushSection(
    lines,
    "## Exact Description Duplicates",
    exactDuplicateGroups,
    "No exact duplicate relic descriptions detected."
  );
  pushSection(
    lines,
    "## Pattern Description Hotspots",
    patternDuplicateGroups,
    "No repeated relic description patterns detected."
  );

  console.log(lines.join("\n"));
}

main();

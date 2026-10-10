import { relicDefinitions } from "../src/game/data/relics";
import { RELIC_UNLOCK_REQUIREMENTS_FROM_DOC } from "../src/game/data/relic-unlocks";
import { computeUnlockedRelicIds } from "../src/game/engine/difficulty";
import { characterDefinitions } from "../src/game/data/characters";
import fs from "node:fs";
import path from "node:path";

const EXPECTED_RELIC_TOTAL = 194;
const EXPECTED_MASTERY_RELICS_PER_CHARACTER = 5;

function readTypeScriptTree(directory: string): string {
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .map((entry) => {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return readTypeScriptTree(fullPath);
      return entry.isFile() && entry.name.endsWith(".ts")
        ? fs.readFileSync(fullPath, "utf8")
        : "";
    })
    .join("\n");
}

type DuplicateGroup = {
  signature: string;
  count: number;
  relics: string[];
};

type DominanceCandidate = {
  stronger: string;
  weaker: string;
  rarity: string;
  pattern: string;
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

function extractCaseBodies(source: string, relicId: string): string[] {
  const escapedId = relicId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matcher = new RegExp(
    `case ["']${escapedId}["']:\\s*([\\s\\S]*?)(?=\\n\\s*case ["']|\\n\\s*default:|$)`,
    "g"
  );
  return [...source.matchAll(matcher)].map((match) => match[1] ?? "");
}

function buildMechanicalSignature(source: string, relicId: string): string {
  const body = extractCaseBodies(source, relicId).join("\n").toLowerCase();
  const effects = [
    "block",
    "thorn",
    "strength",
    "inkcurrent",
    "energycurrent",
    "currenthp",
    "drawcards",
    "poison",
    "bleed",
    "vulnerable",
    "weak",
    "status",
    "discard",
    "exhaust",
    "gold",
  ].filter((token) => body.includes(token));
  const mechanics = [
    body.includes("setflag") ? "flag" : "",
    body.includes("getflag") ? "counter" : "",
    body.includes("%") ? "cadence" : "",
    body.includes("if (") ? "conditional" : "",
    body.includes("math.random") || body.includes("random") ? "random" : "",
  ].filter(Boolean);
  const values = [...body.matchAll(/(?:\+|>=?|===?)\s*(\d+)/g)].map(
    (match) => match[1]
  );
  return [...new Set([...effects, ...mechanics]), ...values].join("+") || "marker";
}

function findDominanceCandidates(): DominanceCandidate[] {
  const result: DominanceCandidate[] = [];
  for (let leftIndex = 0; leftIndex < relicDefinitions.length; leftIndex += 1) {
    const left = relicDefinitions[leftIndex]!;
    for (let rightIndex = leftIndex + 1; rightIndex < relicDefinitions.length; rightIndex += 1) {
      const right = relicDefinitions[rightIndex]!;
      if (left.rarity !== right.rarity) continue;
      const pattern = buildPatternDescriptionSignature(left.description);
      if (pattern !== buildPatternDescriptionSignature(right.description)) continue;
      const leftValues = [...left.description.matchAll(/\d+/g)].map(Number);
      const rightValues = [...right.description.matchAll(/\d+/g)].map(Number);
      if (leftValues.length === 0 || leftValues.length !== rightValues.length) continue;
      const leftDominates = leftValues.every((value, index) => value >= rightValues[index]!) &&
        leftValues.some((value, index) => value > rightValues[index]!);
      const rightDominates = rightValues.every((value, index) => value >= leftValues[index]!) &&
        rightValues.some((value, index) => value > leftValues[index]!);
      if (leftDominates || rightDominates) {
        result.push({
          stronger: leftDominates ? left.id : right.id,
          weaker: leftDominates ? right.id : left.id,
          rarity: left.rarity,
          pattern,
        });
      }
    }
  }
  return result;
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
  const byRarity = Object.fromEntries(
    ["COMMON", "UNCOMMON", "RARE", "BOSS"].map((rarity) => [
      rarity,
      relicDefinitions.filter((relic) => relic.rarity === rarity).length,
    ])
  );
  const byArchetype = Object.fromEntries(
    ["INK", "BLOCK", "DRAW", "STRENGTH", "HEAL", "POISON", "BLEED"].map(
      (tag) => [
        tag,
        relicDefinitions.filter((relic) =>
          relic.archetypeTags?.includes(
            tag as NonNullable<(typeof relicDefinitions)[number]["archetypeTags"]>[number]
          )
        ).length,
      ]
    )
  );
  const unlockRequirements = Object.values(RELIC_UNLOCK_REQUIREMENTS_FROM_DOC);
  const starterRelicIds = characterDefinitions.map(
    (character) => character.starterRelicId
  );
  const invalidStarterRelics = starterRelicIds.filter(
    (relicId) =>
      !relicDefinitions.some((relic) => relic.id === relicId) ||
      RELIC_UNLOCK_REQUIREMENTS_FROM_DOC[relicId] != null
  );
  const masteryByCharacter = Object.fromEntries(
    ["scribe", "bibliothecaire", "griot", "fou"].map((characterId) => [
      characterId,
      unlockRequirements.filter(
        (rule) => rule.characterWinsByDifficulty?.characterId === characterId
      ).length,
    ])
  );
  const unlocksByType = {
    enemyKills: unlockRequirements.filter((rule) => rule.enemyKills).length,
    totalRuns: unlockRequirements.filter((rule) => rule.totalRuns).length,
    wonRuns: unlockRequirements.filter((rule) => rule.wonRuns).length,
    difficulty: unlockRequirements.filter((rule) => rule.winsByDifficulty)
      .length,
    characterDifficulty: unlockRequirements.filter(
      (rule) => rule.characterWinsByDifficulty
    ).length,
    gold: unlockRequirements.filter((rule) => rule.bestGoldInSingleRun).length,
  };
  const descriptions = relicDefinitions.map((relic) =>
    normalizeWhitespace(relic.description)
  );
  const designSignals = {
    initiallyUnlocked: computeUnlockedRelicIds(
      relicDefinitions.map((relic) => relic.id),
      {
        totalRuns: 0,
        wonRuns: 0,
        unlockedDifficultyMax: 0,
        winsByDifficulty: {},
        characterWinsByDifficulty: {},
        bestGoldInSingleRun: 0,
        enemyKillCounts: {},
      }
    ).length,
    bossSpecific: relicDefinitions.filter((relic) => relic.sourceBossId).length,
    tagged: relicDefinitions.filter(
      (relic) => (relic.archetypeTags?.length ?? 0) > 0
    ).length,
    combatStart: descriptions.filter((description) =>
      /start (each )?combat|combat start|debut de combat/.test(description)
    ).length,
    turnStart: descriptions.filter((description) =>
      /start of each turn|start of your turn|debut de tour/.test(description)
    ).length,
    turnEnd: descriptions.filter((description) =>
      /end of (each|your) turn|fin de tour/.test(description)
    ).length,
    conditional: descriptions.filter((description) =>
      /\bif\b|\bwhen\b|\bwhenever\b|\bsi\b|\bquand\b|toutes les|premiere fois/.test(
        description
      )
    ).length,
    explicitDrawback: descriptions.filter((description) =>
      /\bbut\b|\bmais\b|perdez|perd |lose |dazed|weak|vulnerable/.test(description)
    ).length,
  };
  const engineSource = readTypeScriptTree(
    path.resolve(process.cwd(), "src/game/engine")
  );
  const missingEngineReferences = relicDefinitions
    .filter((relic) => !engineSource.includes(relic.id))
    .map((relic) => relic.id);
  const mechanicalSignatures = Object.fromEntries(
    relicDefinitions.map((relic) => [
      relic.id,
      buildMechanicalSignature(engineSource, relic.id),
    ])
  );
  const mechanicalDuplicateGroups = [...new Set(Object.values(mechanicalSignatures))]
    .map((signature) => ({
      signature,
      relics: relicDefinitions
        .filter((relic) => mechanicalSignatures[relic.id] === signature)
        .map(formatRelicLabel),
    }))
    .filter((group) => group.signature !== "marker" && group.relics.length >= 2)
    .map((group) => ({ ...group, count: group.relics.length }))
    .sort((left, right) => right.count - left.count);
  const dominanceCandidates = findDominanceCandidates();
  const enemyUnlockGroups = new Map<string, string[]>();
  for (const [relicId, requirement] of Object.entries(RELIC_UNLOCK_REQUIREMENTS_FROM_DOC)) {
    if (!requirement.enemyKills) continue;
    const key = `${requirement.enemyKills.enemyId}:${requirement.enemyKills.count}`;
    enemyUnlockGroups.set(key, [...(enemyUnlockGroups.get(key) ?? []), relicId]);
  }
  const simultaneousEnemyUnlocks = [...enemyUnlockGroups.entries()]
    .filter(([, relicIds]) => relicIds.length > 1)
    .map(([gate, relicIds]) => ({ gate, relicIds }));
  const unlockReviews = relicDefinitions.map((relic) => {
    const requirement = RELIC_UNLOCK_REQUIREMENTS_FROM_DOC[relic.id];
    let gate = "INITIAL";
    let verdict = "Immediate pool foundation";
    if (starterRelicIds.includes(relic.id)) {
      gate = "CHARACTER_STARTER";
      verdict = "Core identity; available from the first run";
    } else if (requirement?.characterWinsByDifficulty) {
      const mastery = requirement.characterWinsByDifficulty;
      gate = `${mastery.characterId}:D${mastery.difficulty}`;
      verdict = "Character mastery reward";
    } else if (requirement?.enemyKills) {
      gate = `${requirement.enemyKills.enemyId} x${requirement.enemyKills.count}`;
      verdict = relic.sourceBossId
        ? "Boss mastery matches source"
        : "Enemy-themed mastery reward";
    } else if (relic.sourceBossId) {
      gate = `${relic.sourceBossId} mastery`;
      verdict = "Boss mastery matches source";
    } else if (requirement?.wonRuns) {
      gate = `${requirement.wonRuns} wins`;
      verdict = "Victory achievement";
    } else if (requirement?.winsByDifficulty) {
      gate = `difficulty ${Object.keys(requirement.winsByDifficulty).join("+")}`;
      verdict = "Difficulty achievement";
    } else if (requirement?.totalRuns) {
      gate = `${requirement.totalRuns} runs`;
      verdict = "Pity/progression cadence";
    } else if (requirement?.bestGoldInSingleRun) {
      gate = `${requirement.bestGoldInSingleRun} gold`;
      verdict = "Economy achievement";
    }
    return { id: relic.id, rarity: relic.rarity, gate, verdict };
  });
  const runOnlyUnlockCurve = [0, 3, 6, 10, 20].map((totalRuns) => ({
    totalRuns,
    unlocked: computeUnlockedRelicIds(
      relicDefinitions.map((relic) => relic.id),
      {
        totalRuns,
        wonRuns: 0,
        unlockedDifficultyMax: 0,
        winsByDifficulty: {},
        characterWinsByDifficulty: {},
        bestGoldInSingleRun: 0,
        enemyKillCounts: {},
      }
    ).length,
  }));
  const bossDecisionAudit = relicDefinitions
    .filter((relic) => relic.rarity === "BOSS")
    .map((relic) => {
      const description = normalizeWhitespace(relic.description);
      const signature = mechanicalSignatures[relic.id] ?? "marker";
      const decisionChanging =
        /\bif\b|\bwhen\b|\bwhenever\b|\bbut\b|first|every|each|once|instead|choose|cannot|only|odd|third|convert|killed|fatal|curse|temporary|chaque|toutes|une fois|perdez|temporaire|tue|mortel/.test(description) ||
        /conditional|counter|cadence|random/.test(signature);
      return { id: relic.id, decisionChanging, signature };
    });
  const payload = {
    generatedAt: new Date().toISOString(),
    totals: {
      all: relicDefinitions.length,
    },
    byRarity,
    byArchetype,
    unlocksByType,
    masteryByCharacter,
    designSignals,
    missingEngineReferences,
    mechanicalSignatures,
    mechanicalDuplicateGroups,
    dominanceCandidates,
    simultaneousEnemyUnlocks,
    starterRelicIds,
    invalidStarterRelics,
    unlockReviews,
    runOnlyUnlockCurve,
    bossDecisionAudit,
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
  lines.push(
    `- By rarity: **${byRarity.COMMON} common**, **${byRarity.UNCOMMON} uncommon**, **${byRarity.RARE} rare**, **${byRarity.BOSS} boss**`
  );
  lines.push(
    `- Initially unlocked: **${designSignals.initiallyUnlocked}** | Boss-specific: **${designSignals.bossSpecific}** | Archetype-tagged: **${designSignals.tagged}**`
  );
  lines.push(
    `- Timing families: **${designSignals.combatStart}** combat-start, **${designSignals.turnStart}** turn-start, **${designSignals.turnEnd}** turn-end`
  );
  lines.push(
    `- Decision signals: **${designSignals.conditional}** conditional, **${designSignals.explicitDrawback}** with an explicit drawback signal`
  );
  lines.push(
    `- Unlock gates: **${unlocksByType.enemyKills}** enemy mastery, **${unlocksByType.totalRuns}** run count, **${unlocksByType.wonRuns}** wins, **${unlocksByType.difficulty}** difficulty, **${unlocksByType.characterDifficulty}** character mastery, **${unlocksByType.gold}** gold challenge`
  );
  lines.push(
    `- Character mastery: ${Object.entries(masteryByCharacter)
      .map(([character, count]) => `${character} ${count}`)
      .join(", ")}`
  );
  lines.push(
    `- Relics without an engine reference: **${missingEngineReferences.length}**`
  );
  lines.push(
    `- Archetype tags: ${Object.entries(byArchetype)
      .map(([tag, count]) => `${tag} ${count}`)
      .join(", ")}`
  );
  lines.push("");
  pushSection(
    lines,
    "## Exact Description Duplicates",
    exactDuplicateGroups,
    "No exact duplicate relic descriptions detected."
  );
  pushSection(
    lines,
    "## Mechanical Signature Hotspots",
    mechanicalDuplicateGroups,
    "No repeated mechanical signatures detected."
  );
  lines.push("## Strict Dominance Candidates (same rarity and text pattern)");
  lines.push("");
  lines.push(
    dominanceCandidates.length === 0
      ? "- No numeric strict-dominance candidate detected."
      : dominanceCandidates
          .map((candidate) => `- ${candidate.stronger} > ${candidate.weaker} (${candidate.rarity}): \`${candidate.pattern}\``)
          .join("\n")
  );
  lines.push("");
  lines.push("## Unlock Cadence Diagnostics");
  lines.push("");
  lines.push(`- Run-only baseline: ${runOnlyUnlockCurve.map((point) => `${point.totalRuns} runs = ${point.unlocked}`).join(", ")}.`);
  lines.push(`- Simultaneous enemy mastery gates: **${simultaneousEnemyUnlocks.length}**.`);
  for (const group of simultaneousEnemyUnlocks) lines.push(`  - ${group.gate}: ${group.relicIds.join(", ")}`);
  lines.push("");
  lines.push(`- Character starter relics: ${starterRelicIds.join(", ")}.`);
  lines.push("");
  if (process.argv.includes("--unlock-details")) {
    lines.push("## Relic-by-Relic Unlock Review");
    lines.push("");
    lines.push("| Relic | Rarity | Gate | Verdict |");
    lines.push("| --- | --- | --- | --- |");
    for (const review of unlockReviews) {
      lines.push(`| ${review.id} | ${review.rarity} | ${review.gate} | ${review.verdict} |`);
    }
    lines.push("");
  }
  lines.push("## Boss Relic Decision Audit");
  lines.push("");
  lines.push(`- Decision-changing: **${bossDecisionAudit.filter((entry) => entry.decisionChanging).length}/${bossDecisionAudit.length}**.`);
  for (const entry of bossDecisionAudit) lines.push(`  - ${entry.decisionChanging ? "interactive" : "passive"}: ${entry.id} (${entry.signature})`);
  lines.push("");

  if (relicDefinitions.length !== EXPECTED_RELIC_TOTAL) {
    console.error(
      `Relic budget changed: expected ${EXPECTED_RELIC_TOTAL}, got ${relicDefinitions.length}.`
    );
    process.exitCode = 1;
  }
  if (
    Object.values(masteryByCharacter).some(
      (count) => count !== EXPECTED_MASTERY_RELICS_PER_CHARACTER
    )
  ) {
    console.error("Character mastery relic tracks must contain five relics each.");
    process.exitCode = 1;
  }
  if (missingEngineReferences.length > 0) {
    console.error(
      `Relics missing engine references: ${missingEngineReferences.join(", ")}`
    );
    process.exitCode = 1;
  }
  if (new Set(starterRelicIds).size !== characterDefinitions.length) {
    console.error("Character starter relics must be unique.");
    process.exitCode = 1;
  }
  if (invalidStarterRelics.length > 0) {
    console.error(
      `Starter relics must exist and be initially unlocked: ${invalidStarterRelics.join(", ")}`
    );
    process.exitCode = 1;
  }
  pushSection(
    lines,
    "## Pattern Description Hotspots",
    patternDuplicateGroups,
    "No repeated relic description patterns detected."
  );

  console.log(lines.join("\n"));
}

main();

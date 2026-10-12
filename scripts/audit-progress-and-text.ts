import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { histoireDefinitions } from "../src/game/data/histoires";
import {
  computeMetaBonuses,
  getResourcesForCombat,
  BIOME_RESOURCE,
} from "../src/game/engine/meta";
import { fr } from "../src/lib/i18n/messages/fr";
import { en } from "../src/lib/i18n/messages/en";
import { allCardDefinitions } from "../src/game/data";
import { getAllRelicTextEntries } from "../src/lib/i18n/relic-text-resources";
const folder = "docs/validation-2026-10-12";
fs.mkdirSync(folder, { recursive: true });
if (process.argv[2] === "meta") {
  const issues: string[] = [];
  const stories = new Map(histoireDefinitions.map((h) => [h.id, h]));
  if (stories.size !== histoireDefinitions.length)
    issues.push("Duplicate story IDs");
  const closure = (id: string, ancestors: string[] = []): Set<string> => {
    if (ancestors.includes(id)) {
      issues.push(`Cycle: ${[...ancestors, id].join(" > ")}`);
      return new Set();
    }
    const story = stories.get(id);
    if (!story) {
      issues.push(`Missing prerequisite: ${id}`);
      return new Set();
    }
    return new Set([
      id,
      ...story.prerequis.flatMap((p) => [...closure(p, [...ancestors, id])]),
    ]);
  };
  const rows = histoireDefinitions.map((story) => {
    const required = [...closure(story.id)];
    const cumulativeCost: Record<string, number> = {};
    for (const id of required)
      for (const [resource, cost] of Object.entries(stories.get(id)!.cout)) {
        if (!Number.isInteger(cost) || cost <= 0)
          issues.push(`Invalid cost: ${id}/${resource}/${cost}`);
        cumulativeCost[resource] = (cumulativeCost[resource] ?? 0) + cost;
      }
    const resource = BIOME_RESOURCE[story.biome];
    const yieldPerFight = getResourcesForCombat(story.biome, false, false, 1)[
      resource
    ]!;
    return {
      id: story.id,
      biome: story.biome,
      tier: story.tier,
      prerequisites: story.prerequis,
      cost: story.cout,
      cumulativeCost,
      normalFloor1FightsForOwnCost: Math.ceil(
        (story.cout[resource] ?? 0) / yieldPerFight
      ),
      bonusesAfterPrerequisites: computeMetaBonuses(required),
    };
  });
  const report = {
    issues,
    stories: rows,
    allBonuses: computeMetaBonuses([...stories.keys()]),
    assumption:
      "Combat-equivalent estimates at floor 1, without spending elsewhere; not a prediction of human sessions.",
  };
  fs.writeFileSync(
    path.join(folder, "meta.json"),
    JSON.stringify(report, null, 2)
  );
  console.log({ stories: rows.length, issues });
  if (issues.length) process.exitCode = 1;
} else {
  const flatten = (
    value: unknown,
    prefix = "",
    output: Record<string, string> = {}
  ): Record<string, string> => {
    if (typeof value === "string") output[prefix] = value;
    else if (value && typeof value === "object")
      for (const [key, child] of Object.entries(value))
        flatten(child, prefix ? `${prefix}.${key}` : key, output);
    return output;
  };
  const french = flatten(fr),
    english = flatten(en);
  // These namespaces deliberately use canonical catalogue text outside messages/*.ts.
  // Audit the effective resources instead of reporting valid fallbacks as missing keys.
  const fillMissing = (
    target: Record<string, string>,
    defaults: Record<string, string>
  ) => {
    let filled = 0;
    for (const [key, value] of Object.entries(defaults))
      if (!(key in target)) {
        target[key] = value;
        filled++;
      }
    return filled;
  };
  const catalogueDefaults = {
    frenchStories: fillMissing(
      french,
      flatten({
        stories: Object.fromEntries(
          histoireDefinitions.map((h) => [
            h.id,
            {
              title: h.titre,
              description: h.description,
              ...(h.auteur ? { author: h.auteur } : {}),
            },
          ])
        ),
      })
    ),
    englishCardNames: fillMissing(
      english,
      flatten({
        cards: Object.fromEntries(
          allCardDefinitions.map((c) => [c.id, { name: c.name }])
        ),
      })
    ),
    frenchCardNames: fillMissing(
      french,
      flatten({
        cards: Object.fromEntries(
          allCardDefinitions.map((c) => [c.id, { name: c.name }])
        ),
      })
    ),
    frenchRelics: fillMissing(
      french,
      flatten({ relics: getAllRelicTextEntries("fr") })
    ),
    englishRelics: fillMissing(
      english,
      flatten({ relics: getAllRelicTextEntries("en") })
    ),
  };
  const placeholders = (text: string) =>
    [...text.matchAll(/{{\s*([^}]+?)\s*}}/g)].map((m) => m[1]!).sort();
  const missingEnglish = Object.keys(french).filter((k) => !(k in english));
  const missingFrench = Object.keys(english).filter((k) => !(k in french));
  const mismatchedPlaceholders = Object.keys(french).filter(
    (k) =>
      k in english &&
      JSON.stringify(placeholders(french[k]!)) !==
        JSON.stringify(placeholders(english[k]!))
  );
  const corrupted = [...Object.entries(french), ...Object.entries(english)]
    .filter(([, v]) => /\uFFFD/.test(v))
    .map(([k]) => k);
  const missingLiteralKeys: Array<{ file: string; key: string }> = [];
  const scan = (directory: string) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        scan(file);
        continue;
      }
      if (!/\.tsx?$/.test(file) || /\.test\./.test(file)) continue;
      const source = ts.createSourceFile(
        file,
        fs.readFileSync(file, "utf8"),
        ts.ScriptTarget.Latest,
        true
      );
      const visit = (node: ts.Node) => {
        if (
          ts.isCallExpression(node) &&
          ts.isIdentifier(node.expression) &&
          node.expression.text === "t"
        ) {
          const key = node.arguments[0],
            options = node.arguments[1];
          const fallback =
            options &&
            (ts.isStringLiteral(options) ||
              (ts.isObjectLiteralExpression(options) &&
                options.properties.some(
                  (p) => p.name?.getText(source) === "defaultValue"
                )));
          if (
            key &&
            ts.isStringLiteral(key) &&
            !fallback &&
            !(key.text in french) &&
            !(`${key.text}_one` in french && `${key.text}_other` in french) &&
            !Object.keys(french).some((k) => k.startsWith(key.text + "."))
          )
            missingLiteralKeys.push({ file, key: key.text });
        }
        ts.forEachChild(node, visit);
      };
      visit(source);
    }
  };
  scan("src");
  const report = {
    frenchKeys: Object.keys(french).length,
    englishKeys: Object.keys(english).length,
    catalogueDefaults,
    missingEnglish,
    missingFrench,
    mismatchedPlaceholders,
    corrupted,
    missingLiteralKeys,
  };
  fs.writeFileSync(
    path.join(folder, "translations.json"),
    JSON.stringify(report, null, 2)
  );
  console.log(report);
  if (
    missingEnglish.length ||
    missingFrench.length ||
    mismatchedPlaceholders.length ||
    corrupted.length ||
    missingLiteralKeys.length
  )
    process.exitCode = 1;
}

import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
const root = "docs/validation-2026-10-12";
fs.mkdirSync(root, { recursive: true });
const characters = ["scribe", "bibliothecaire", "griot", "fou"];
const biomes = [
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
const cases = characters.flatMap((character) =>
  biomes.map((biome) => ({ character, biome }))
);
const results = [];
async function worker() {
  while (cases.length) {
    const { character, biome } = cases.shift();
    const name = `journey-${character}-${biome}`,
      file = path.join(root, name + ".json");
    const log = fs.openSync(path.join(root, name + ".log"), "w");
    const code = await new Promise((resolve, reject) => {
      const p = spawn(
        process.execPath,
        [
          "node_modules/tsx/dist/cli.mjs",
          "scripts/simulate.ts",
          "3",
          "0",
          biome,
          character,
          "average",
          `qa-1012-${character}-${biome}`,
          "--validate-checkpoints",
          "--json",
          file,
        ],
        { windowsHide: true, stdio: ["ignore", log, log] }
      );
      p.on("error", reject);
      p.on("exit", resolve);
    });
    fs.closeSync(log);
    const report = JSON.parse(fs.readFileSync(file, "utf8"));
    results.push({
      character,
      biome,
      code,
      runs: report.runs.length,
      wins: report.wins,
      checkpoints: report.runs.reduce(
        (n, r) => n + (r.validatedCheckpoints ?? 0),
        0
      ),
      errors: report.errors,
    });
    fs.writeFileSync(
      path.join(root, "journeys.json"),
      JSON.stringify(results, null, 2)
    );
    console.log(name, code, report.errors.length ? "ERROR" : "OK");
  }
}
await Promise.all([worker(), worker()]);
if (results.some((r) => r.code !== 0 || r.errors.length)) process.exitCode = 1;

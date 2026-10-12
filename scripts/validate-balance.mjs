/** Independent confirmation seeds; uses the real reducer and filtered intentions. */
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
const folder = "docs/validation-2026-10-12";
fs.mkdirSync(folder, { recursive: true });
const builds = [
  ["scribe", "ink"],
  ["scribe", "upgrade"],
  ["scribe", "exhaust"],
  ["bibliothecaire", "draw"],
  ["bibliothecaire", "archive"],
  ["bibliothecaire", "armor"],
  ["griot", "poison"],
  ["griot", "bleed"],
  ["griot", "rhythm"],
  ["fou", "ink"],
  ["fou", "debt"],
  ["fou", "strength"],
  ["fou", "discard"],
];
const cases = builds.flatMap(([character, build]) =>
  Array.from({ length: 6 }, (_, difficulty) => ({
    character,
    build,
    difficulty,
    meta: difficulty < 2 ? "average" : "strong",
    runs: 20,
    strict: false,
  }))
);
for (const character of ["scribe", "bibliothecaire", "griot", "fou"])
  cases.push({
    character,
    build: "mixed",
    difficulty: 0,
    meta: "none",
    runs: 30,
    strict: false,
  });
for (const [character, build] of builds.filter(
  ([, build]) => build !== "armor"
)) {
  for (let difficulty = 0; difficulty < 3; difficulty++)
    cases.push({
      character,
      build,
      difficulty,
      meta: difficulty < 2 ? "average" : "strong",
      runs: 10,
      strict: true,
    });
}
// Resume this dated campaign after an infrastructure interruption, without rerolling successful seeds.
const results = process.argv.includes("--resume") && fs.existsSync(path.join(folder, "balance.json"))
  ? JSON.parse(fs.readFileSync(path.join(folder, "balance.json"), "utf8")).filter(r => r.code === 0 && r.errors.length === 0)
  : [];
async function worker() {
  while (cases.length) {
    const c = cases.shift();
    if (results.some(r => r.character === c.character && r.build === c.build && r.difficulty === c.difficulty && r.meta === c.meta && r.strict === c.strict && r.runs === c.runs)) continue;
    const name = `balance-${c.character}-${c.build}-D${c.difficulty}-${c.meta}${c.strict ? "-strict" : ""}`;
    const file = path.join(folder, name + ".json");
    const log = fs.openSync(path.join(folder, name + ".log"), "w");
    const seed = `confirmation-1012-D${c.difficulty}-${c.meta}${c.strict ? "-strict" : ""}`;
    const code = await new Promise((resolve, reject) => {
      const child = spawn(
        process.execPath,
        [
          "node_modules/tsx/dist/cli.mjs",
          "scripts/simulate.ts",
          String(c.runs),
          String(c.difficulty),
          "null",
          c.character,
          c.meta,
          seed,
          "--build",
          c.build,
          "--validate-checkpoints",
          "--json",
          file,
          ...(c.strict ? ["--no-armor-payoffs"] : []),
        ],
        { windowsHide: true, stdio: ["ignore", log, log] }
      );
      child.on("error", reject);
      child.on("exit", resolve);
    });
    fs.closeSync(log);
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    const n = data.runs.length,
      p = data.wins / n,
      z = 1.96,
      d = 1 + (z * z) / n;
    const center = (p + (z * z) / (2 * n)) / d,
      half = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / d;
    results.push({
      ...c,
      seed,
      file,
      code,
      wins: data.wins,
      errors: data.errors,
      interval95: [center - half, center + half],
    });
    fs.writeFileSync(
      path.join(folder, "balance.json"),
      JSON.stringify(results, null, 2)
    );
    console.log(name, `${data.wins}/${n}`, data.errors.length ? "ERROR" : "OK");
  }
}
await Promise.all([worker(), worker()]);
if (results.some((r) => r.code !== 0 || r.errors.length)) process.exitCode = 1;

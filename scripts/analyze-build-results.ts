import fs from "node:fs";
import {
  getBuildProfile,
  type BuildPath,
} from "../src/game/engine/build-profile";
import type { CardDefinition } from "../src/game/schemas/cards";

const root = "docs/balance-2026-10-09";
type Cell = {
  character: string;
  meta: string;
  difficulty: number;
  build: string;
  n: number;
  wins: number;
  errors: string[];
  exitCode: number;
};
type Run = {
  won: boolean;
  combats: number;
  totalTurns: number;
  deckSizeAtEnd: number;
  error: string | null;
};
type Result = {
  wins: number;
  errors: string[];
  runs: Run[];
  draftStats: Record<string, { offered: number; picked: number }>;
  upgradeStats: { A: number; B: number };
};
const read = <T>(path: string): T =>
  JSON.parse(fs.readFileSync(`${root}/${path}`, "utf8"));
const catalogues = {
  before: new Map(
    read<{ cards: CardDefinition[] }>("catalogue-before.json").cards.map(
      (c) => [c.id, c]
    )
  ),
  after: new Map(
    read<{ cards: CardDefinition[] }>("catalogue-after.json").cards.map((c) => [
      c.id,
      c,
    ])
  ),
};
const key = (row: Cell) =>
  `${row.character}-${row.meta}-d${row.difficulty}-${row.build}`;
function interval(wins: number, n: number) {
  const p = wins / n,
    z = 1.96,
    den = 1 + (z * z) / n;
  const mid = (p + (z * z) / (2 * n)) / den;
  const radius =
    (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / den;
  return [100 * (mid - radius), 100 * (mid + radius)].map(
    (v) => Math.round(v * 10) / 10
  );
}
function metrics(stage: "before" | "after" | "stress", row: Cell) {
  const data = read<Result>(`${stage}-${key(row)}.json`);
  if (row.exitCode !== 0 || data.errors.length)
    throw new Error(`Invalid cell: ${stage}-${key(row)}`);
  const catalogue = catalogues[stage === "before" ? "before" : "after"];
  const picks = Object.values(data.draftStats).reduce(
    (sum, c) => sum + c.picked,
    0
  );
  const aligned = Object.entries(data.draftStats).reduce((sum, [id, count]) => {
    const card = catalogue.get(id);
    return (
      sum +
      (card &&
      row.build !== "mixed" &&
      getBuildProfile(card)[row.build as BuildPath]?.length
        ? count.picked
        : 0)
    );
  }, 0);
  const combats = data.runs.reduce((sum, run) => sum + run.combats, 0);
  return {
    ...row,
    winRate: (100 * data.wins) / row.n,
    wilson95: interval(data.wins, row.n),
    turnsPerCombat:
      data.runs.reduce((sum, run) => sum + run.totalTurns, 0) /
      Math.max(1, combats),
    meanDeckSize:
      data.runs.reduce((sum, run) => sum + run.deckSizeAtEnd, 0) / row.n,
    matchingDraftShare:
      row.build === "mixed" ? null : aligned / Math.max(1, picks),
    upgradeChoices: data.upgradeStats,
    mostPicked: Object.entries(data.draftStats)
      .filter(([, c]) => c.picked)
      .sort((a, b) => b[1].picked - a[1].picked)
      .slice(0, 5)
      .map(([id, c]) => ({ id, ...c })),
  };
}
const stages = Object.fromEntries(
  (["before", "after", "stress"] as const).map((stage) => [
    stage,
    read<{ rows: Cell[] }>(`matrix-${stage}.json`).rows.map((row) =>
      metrics(stage, row)
    ),
  ])
);
const before = new Map(stages.before!.map((row) => [key(row), row]));
const comparisons = stages.after!.map((row) => {
  const previous = before.get(key(row))!;
  return {
    ...row,
    beforeWinRate: previous.winRate,
    deltaPoints: row.winRate - previous.winRate,
  };
});
fs.writeFileSync(
  `${root}/comparison.json`,
  JSON.stringify(
    {
      comparisons,
      stress: stages.stress,
      method:
        "Wilson 95% intervals describe this heuristic and sample only. Draft shares are conditional on offered cards. These are not human win rates.",
    },
    null,
    2
  )
);
const table = [
  "| Personnage | Méta | D | Préférence | Avant | Après | IC 95 % après | Choix liés à la préférence |",
  "| --- | --- | ---: | --- | ---: | ---: | --- | ---: |",
  ...comparisons.map(
    (row) =>
      `| ${row.character} | ${row.meta} | ${row.difficulty} | ${row.build} | ${row.beforeWinRate.toFixed(1)} % | ${row.winRate.toFixed(1)} % | ${row.wilson95.join("–")} % | ${row.matchingDraftShare == null ? "—" : (100 * row.matchingDraftShare).toFixed(1) + " %"} |`
  ),
  "",
  "| Personnage | D | Préférence | Victoires / 30 | IC 95 % |",
  "| --- | ---: | --- | ---: | --- |",
  ...stages.stress!.map(
    (row) =>
      `| ${row.character} | ${row.difficulty} | ${row.build} | ${row.wins} | ${row.wilson95.join("–")} % |`
  ),
];
fs.writeFileSync(`${root}/comparison.md`, table.join("\n") + "\n");
console.log(
  JSON.stringify(
    comparisons.map(
      ({
        character,
        meta,
        difficulty,
        build,
        beforeWinRate,
        winRate,
        matchingDraftShare,
      }) => ({
        character,
        meta,
        difficulty,
        build,
        beforeWinRate,
        winRate,
        matchingDraftShare,
      })
    ),
    null,
    2
  )
);

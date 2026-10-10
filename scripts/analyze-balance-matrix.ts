import fs from "node:fs";
import { allCardDefinitions } from "../src/game/data";
import { buildUpgradedCardDefinition } from "../src/game/engine/card-upgrades";
import { getBuildProfile } from "../src/game/engine/build-profile";

const root = "docs/rooms-balance-2026-10-10";
const stage = process.argv[2] ?? "after";
const definitions = new Map(allCardDefinitions.map(card => [card.id, card]));
type DeckCard = { id: string; upgraded: boolean; branch: "A" | "B" | null };
type Run = { won: boolean; finalDeck: DeckCard[] };
const rows = fs.readdirSync(root).filter(file => file.startsWith(`${stage}-`) && file.endsWith(".json")).map(file => {
  const data = JSON.parse(fs.readFileSync(`${root}/${file}`, "utf8"));
  const wins = (data.runs as Run[]).filter(run => run.won);
  const cleanWins = wins.filter(run => run.finalDeck.every(card => {
    const base = definitions.get(card.id);
    if (!base) throw new Error(`Unknown card: ${card.id}`);
    const def = card.upgraded ? buildUpgradedCardDefinition(base, card.branch ?? "A") : base;
    return !getBuildProfile({...def, effects: [...def.effects, ...(def.inkedVariant?.effects ?? []), ...(def.onRandomDiscardEffects ?? [])]}).armor?.includes("payoff");
  }));
  return {character:data.config.character, difficulty:data.config.difficulty, meta:data.config.metaPreset, build:data.config.buildType, runs:data.runs.length, wins:wins.length, winsWithoutArmorPayoff:cleanWins.length};
});
fs.writeFileSync(`${root}/analysis-${stage}.json`, JSON.stringify(rows, null, 2));
console.table(rows);

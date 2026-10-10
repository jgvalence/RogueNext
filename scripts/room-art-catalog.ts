import fs from "node:fs";
import { fr } from "../src/lib/i18n/messages/fr";

const root = "docs/rooms-balance-2026-10-10";
fs.mkdirSync(root, { recursive: true });
const source = fs.readFileSync("src/game/engine/run-events.ts", "utf8");
const ids = [...source.matchAll(/^    id: "([^"]+)",/gm)].map((m) => m[1]!);
const events = fr.events as Record<string, { title: string; description: string; flavorText?: string }>;
fs.writeFileSync(`${root}/events.json`, JSON.stringify(ids.map((id) => ({ id, ...events[id] })), null, 2));
console.log(ids.length + " events");

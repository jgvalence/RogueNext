import fs from "node:fs";
import assert from "node:assert/strict";
const worker = fs.readFileSync("public/sw.js", "utf8");
const urls = [...worker.matchAll(/url:"([^"]+)"/g)].map((match) => match[1]);
assert(urls.length > 0, "Find compiled precache entries");
assert(
  !urls.some((url) => url.includes("/images/cards/painted-v1/")),
  "Paintings excluded from installation precache"
);
assert(worker.includes("card-paintings-v1"));
assert(worker.includes("maxEntries:180"));
assert(worker.includes("StaleWhileRevalidate"));
const report = {
  precacheEntries: urls.length,
  paintingsPrecached: 0,
  runtimeCache: "card-paintings-v1",
  maxEntries: 180,
};
fs.writeFileSync(
  "docs/card-art-2026-10-10/pwa-validation.json",
  JSON.stringify(report, null, 2) + "\n"
);
console.log(report);

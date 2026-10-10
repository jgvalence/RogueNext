import fs from "node:fs/promises";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import sharp from "sharp";

const root = "docs/card-art-2026-10-10";
const cards = JSON.parse(await fs.readFile(`${root}/catalog.json`, "utf8"));
const directory = "public/images/cards/painted-v1";
const hashes = new Set(),
  sources = new Set(),
  byBiome = {},
  sizes = { thumbnail: [], card: [], full: [] };
const allowPartial = process.argv.includes("--partial");
const mappingText = await fs.readFile("src/lib/card-art.generated.ts", "utf8");
const mapping = JSON.parse(
  mappingText.slice(mappingText.indexOf("{"), mappingText.lastIndexOf("}") + 1)
);
if (!allowPartial)
  assert.deepEqual(
    Object.keys(mapping).sort(),
    cards.map((card) => card.id).sort()
  );
let covered = 0;
for (const card of cards) {
  const metadata = await fs
    .readFile(`${root}/${card.id}.json`, "utf8")
    .then(JSON.parse)
    .catch(() => null);
  if (!metadata && allowPartial) continue;
  assert(metadata, `Missing metadata: ${card.id}`);
  assert.equal(metadata.mode, "built-in image_gen");
  assert.equal(
    mapping[card.id],
    `/images/cards/painted-v1/${card.id}.webp`,
    `Missing game mapping: ${card.id}`
  );
  assert(!sources.has(metadata.source), `Reused image: ${card.id}`);
  sources.add(metadata.source);
  for (const [suffix, width, label] of [
    ["-thumb", 288, "thumbnail"],
    ["", 768, "card"],
    ["-full", 1536, "full"],
  ]) {
    const buffer = await fs.readFile(`${directory}/${card.id}${suffix}.webp`);
    const image = await sharp(buffer).metadata();
    assert.equal(image.width, width, card.id);
    assert.equal(image.height, (width * 2) / 3, card.id);
    assert.equal(image.format, "webp");
    sizes[label].push(buffer.byteLength);
    if (!suffix) {
      const hash = crypto.createHash("sha256").update(buffer).digest("hex");
      assert(!hashes.has(hash), `Duplicate artwork: ${card.id}`);
      hashes.add(hash);
    }
  }
  byBiome[card.biome] = (byBiome[card.biome] ?? 0) + 1;
  covered++;
}
const stats = Object.fromEntries(
  Object.entries(sizes).map(([label, values]) => [
    label,
    {
      count: values.length,
      totalBytes: values.reduce((a, b) => a + b, 0),
      minBytes: Math.min(...values),
      maxBytes: Math.max(...values),
      meanBytes: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
    },
  ])
);
const report = {
  total: cards.length,
  covered,
  uniqueImages: hashes.size,
  byBiome,
  sizes: stats,
};
await fs.writeFile(
  `${root}/asset-validation.json`,
  JSON.stringify(report, null, 2) + "\n"
);
console.log(JSON.stringify(report, null, 2));

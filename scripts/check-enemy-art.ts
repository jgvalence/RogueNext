import fs from "node:fs";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import sharp from "sharp";
import { enemyDefinitions } from "../src/game/data";
import { PAINTED_ENEMY_IMAGES } from "../src/lib/enemy-art.generated";
import { getEnemyImageSrc, getEnemyFallbackSrc } from "../src/lib/assets";

async function main() {
  const hashes = new Set<string>(),
    totals = { thumb: 0, card: 0, full: 0 };
  assert.deepEqual(
    Object.keys(PAINTED_ENEMY_IMAGES).sort(),
    enemyDefinitions.map((e) => e.id).sort()
  );
  for (const enemy of enemyDefinitions) {
    assert(
      fs.existsSync("public" + getEnemyFallbackSrc(enemy.id)),
      `Missing fallback: ${enemy.id}`
    );
    for (const [size, width] of [
      ["thumb", 288],
      ["card", 768],
      ["full", 1536],
    ] as const) {
      const source = getEnemyImageSrc(enemy.id, size);
      assert(source.endsWith(".webp"), enemy.id);
      const data = fs.readFileSync("public" + source),
        meta = await sharp(data).metadata();
      assert.equal(meta.width, width, enemy.id);
      assert.equal(meta.height, (width * 2) / 3, enemy.id);
      assert.equal(meta.format, "webp");
      totals[size] += data.length;
      if (size === "card") {
        const hash = crypto.createHash("sha256").update(data).digest("hex");
        assert(!hashes.has(hash), `Duplicate: ${enemy.id}`);
        hashes.add(hash);
      }
    }
  }
  const result = {
    total: enemyDefinitions.length,
    bosses: enemyDefinitions.filter((e) => e.isBoss).length,
    uniquePortraits: hashes.size,
    totalBytesBySize: totals,
  };
  fs.writeFileSync(
    "docs/enemy-art-2026-10-10/asset-validation.json",
    JSON.stringify(result, null, 2) + "\n"
  );
  console.log(result);
}
void main();

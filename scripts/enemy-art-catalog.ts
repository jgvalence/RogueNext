import fs from "node:fs";
import { enemyDefinitions } from "../src/game/data";
const root = "docs/enemy-art-2026-10-10";
fs.mkdirSync(root, { recursive: true });
const cards = JSON.parse(
  fs.readFileSync("docs/card-art-2026-10-10/catalog.json", "utf8")
) as { id: string }[];
const catalog = enemyDefinitions.map((enemy) => {
  const card = cards.find(
    (c) =>
      c.id === `bestiary_normal_${enemy.id}` ||
      c.id === `bestiary_elite_${enemy.id}`
  );
  return {
    id: enemy.id,
    name: enemy.name,
    biome: enemy.biome,
    boss: enemy.isBoss,
    elite: enemy.isElite,
    reuseCard: card?.id ?? null,
  };
});
fs.writeFileSync(
  `${root}/catalog.json`,
  JSON.stringify(catalog, null, 2) + "\n"
);
console.log(
  JSON.stringify({
    total: catalog.length,
    bosses: catalog.filter((e) => e.boss).length,
    reuse: catalog.filter((e) => e.reuseCard).length,
    new: catalog.filter((e) => !e.reuseCard).length,
  })
);

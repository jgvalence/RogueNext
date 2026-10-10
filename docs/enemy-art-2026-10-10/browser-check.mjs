import fs from "node:fs";
import assert from "node:assert/strict";
const catalog = JSON.parse(
  fs.readFileSync("docs/enemy-art-2026-10-10/catalog.json", "utf8")
);
const tabs = await (await fetch("http://127.0.0.1:9223/json/list")).json();
const ws = new WebSocket(
  tabs.find((t) => t.type === "page").webSocketDebuggerUrl
);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let serial = 0;
const pending = new Map(),
  errors = [],
  checks = [];
ws.onmessage = ({ data }) => {
  const m = JSON.parse(data);
  if (m.id) {
    const [r, j] = pending.get(m.id);
    pending.delete(m.id);
    m.error ? j(m.error) : r(m.result);
  }
  if (m.method === "Runtime.exceptionThrown")
    errors.push(m.params.exceptionDetails);
};
const cdp = (method, params = {}) =>
  new Promise((r, j) => {
    const id = ++serial;
    pending.set(id, [r, j]);
    ws.send(JSON.stringify({ id, method, params }));
  });
const js = async (expression) => {
  const r = await cdp("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  assert(!r.exceptionDetails, JSON.stringify(r.exceptionDetails));
  return r.result.value;
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await cdp("Runtime.enable");
await cdp("Page.enable");
const only = process.argv.find((a) => a.startsWith("--boss="))?.slice(7);
const bosses = catalog.filter((e) => e.boss && (!only || e.id === only));
const scenarios = process.argv.includes("--quick")
  ? [
      [bosses.find((e) => e.id === "fenrir"), 1440, 1000],
      [bosses.find((e) => e.id === "fenrir"), 390, 844],
    ]
  : bosses.flatMap((e) => [
      [e, 1440, 1000],
      [e, 390, 844],
    ]);
if (!only && !process.argv.includes("--quick")) {
  for (const id of ["fenrir", "hydra_aspect"]) {
    const enemy = bosses.find((e) => e.id === id);
    scenarios.push([enemy, 320, 568], [enemy, 844, 390]);
  }
}
for (const [enemy, width, height] of scenarios) {
  await cdp("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 1024,
  });
  const companions = catalog
    .filter((e) => e.biome === enemy.biome && !e.boss)
    .slice(0, 2)
    .map((e) => e.id);
  await cdp("Page.navigate", {
    url: `http://127.0.0.1:4318/?biome=${enemy.biome}&enemyIds=${[enemy.id, ...companions].join(",")}&enemies=3&allies=0`,
  });
  await wait(1100);
  for (let attempt = 0; attempt < 150; attempt++) {
    if (
      await js(
        `(()=>{const images=[...document.querySelectorAll('[data-enemy-art]')].filter(i=>i.getBoundingClientRect().width>0);return images.some(i=>i.dataset.enemyArt===${JSON.stringify(enemy.id)})&&images.every(i=>i.complete&&i.naturalWidth>0)})()`
      )
    )
      break;
    await wait(100);
  }
  const metrics = await js(
    `({overflow:document.documentElement.scrollWidth>innerWidth,portraits:[...document.querySelectorAll('[data-enemy-art]')].filter(i=>i.getBoundingClientRect().width>0).map(i=>({id:i.dataset.enemyArt,src:i.getAttribute('src'),loaded:i.complete&&i.naturalWidth>0,fit:getComputedStyle(i).objectFit}))})`
  );
  const shot = await cdp("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
  });
  fs.writeFileSync(
    `docs/enemy-art-2026-10-10/${enemy.id}-${width}.png`,
    Buffer.from(shot.data, "base64")
  );
  assert(!metrics.overflow);
  assert(
    metrics.portraits.some((i) => i.id === enemy.id),
    enemy.id + JSON.stringify({ metrics, errors })
  );
  assert(
    metrics.portraits.every((i) => i.loaded && i.src.endsWith(".webp")),
    JSON.stringify(metrics)
  );
  checks.push({ id: enemy.id, width, height, ...metrics });
  console.log(enemy.id, width, "passed");
}
await js(
  `document.querySelector('[data-enemy-art]').dispatchEvent(new Event('error'))`
);
await wait(250);
assert(
  await js(
    `document.querySelector('[data-enemy-art]').getAttribute('src').endsWith('.svg')`
  ),
  "SVG fallback on loading failure"
);
assert.equal(errors.length, 0, JSON.stringify(errors));
fs.writeFileSync(
  "docs/enemy-art-2026-10-10/browser-results.json",
  JSON.stringify({ checks, errors, fallback: true }, null, 2)
);
ws.close();

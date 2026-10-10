import fs from "node:fs";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import path from "node:path";
const tabs = await (await fetch("http://127.0.0.1:9223/json/list")).json();
const ws = new WebSocket(
  tabs.find((t) => t.type === "page").webSocketDebuggerUrl
);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let serial = 0;
const pending = new Map(),
  errors = [],
  checks = [];
ws.addEventListener("message", ({ data }) => {
  const m = JSON.parse(data);
  if (m.id) {
    const [r, j] = pending.get(m.id);
    pending.delete(m.id);
    m.error ? j(m.error) : r(m.result);
  }
  if (m.method === "Runtime.exceptionThrown")
    errors.push(m.params.exceptionDetails);
});
function cdp(method, params = {}) {
  return new Promise((r, j) => {
    const id = ++serial;
    pending.set(id, [r, j]);
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function js(expression) {
  const r = await cdp("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  assert(!r.exceptionDetails, JSON.stringify(r.exceptionDetails));
  return r.result.value;
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await cdp("Runtime.enable");
await cdp("Page.enable");
for (const [width, height] of [
  [1440, 1000],
  [390, 844],
]) {
  await cdp("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 500,
  });
  await cdp("Page.navigate", {
    url: pathToFileURL(path.resolve("docs/enemy-art-2026-10-10/galerie.html"))
      .href,
  });
  await wait(1000);
  assert.equal(await js('document.querySelectorAll("article").length'), 101);
  assert(await js("document.documentElement.scrollWidth<=innerWidth"));
  await js('kind.value="Boss";kind.dispatchEvent(new Event("change"))');
  assert.equal(await js('document.querySelectorAll("article:not([hidden])").length'),18);
  await js('kind.value="";world.value="VIKING";world.dispatchEvent(new Event("change"))');
  assert(
    await js(
      '[...document.querySelectorAll("article:not([hidden])")].every(e=>e.dataset.world==="VIKING")'
    )
  );
  await js(
    'world.value="";search.value="fenrir";search.dispatchEvent(new Event("input"))'
  );
  assert.equal(
    await js('document.querySelectorAll("article:not([hidden])").length'),
    1
  );
  await js('document.querySelector("article:not([hidden]) a").click()');
  await wait(500);
  const metrics = await js(
    '(()=>{const i=document.querySelector("#full"),r=i.getBoundingClientRect();return{open:document.querySelector("dialog").open,width:i.naturalWidth,height:i.naturalHeight,fit:getComputedStyle(i).objectFit,fits:r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight}})()'
  );
  assert(metrics.open && metrics.fits);
  assert.equal(metrics.width, 1536);
  assert.equal(metrics.height, 1024);
  assert.equal(metrics.fit, "contain");
  await cdp("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "Escape",
    code: "Escape",
    windowsVirtualKeyCode: 27,
  });
  await wait(200);
  assert.equal(await js('document.querySelector("dialog").open'), false);
  await js('search.value="";search.dispatchEvent(new Event("input"))');
  const shot = await cdp("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
  });
  fs.writeFileSync(
    `docs/enemy-art-2026-10-10/gallery-${width}.png`,
    Buffer.from(shot.data, "base64")
  );
  checks.push({
    width,
    height,
    portraits: 101,
    filter: true,
    search: true,
    escape: true,
    ...metrics,
  });
}
assert.equal(errors.length, 0, JSON.stringify(errors));
fs.writeFileSync(
  "docs/enemy-art-2026-10-10/gallery-results.json",
  JSON.stringify({ checks, errors }, null, 2)
);
console.log(
  "Gallery: desktop and mobile, 101 cards, search, world filter and full artwork passed"
);
ws.close();

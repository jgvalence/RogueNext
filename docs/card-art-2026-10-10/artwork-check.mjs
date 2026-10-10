import fs from "node:fs";
import assert from "node:assert/strict";
const tabs = await (await fetch("http://127.0.0.1:9223/json/list")).json();
const ws = new WebSocket(
  tabs.find((t) => t.type === "page").webSocketDebuggerUrl
);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let serial = 0;
const pending = new Map(),
  checks = [],
  errors = [];
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
async function click(selector) {
  const p = await js(
    `(()=>{const el=document.querySelector(${JSON.stringify(selector)});if(!el)return null;const r=el.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`
  );
  assert(p, "Missing " + selector);
  await cdp("Input.dispatchMouseEvent", {
    type: "mousePressed",
    ...p,
    button: "left",
    clickCount: 1,
  });
  await cdp("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    ...p,
    button: "left",
    clickCount: 1,
  });
  await wait(350);
}
async function shot(name) {
  const r = await cdp("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
  });
  fs.writeFileSync(
    `docs/card-art-2026-10-10/${name}.png`,
    Buffer.from(r.data, "base64")
  );
}
await cdp("Runtime.enable");
await cdp("Page.enable");
await cdp("Emulation.setFocusEmulationEnabled", { enabled: true });
for (const [width, height] of [
  [390, 844],
  [320, 568],
  [844, 390],
  [1280, 900],
]) {
  const mobile = width < 1024;
  await cdp("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile,
  });
  await cdp("Page.navigate", {
    url: `http://127.0.0.1:4318/?${mobile ? "hand=8" : "screen=interface"}`,
  });
  await wait(1500);
  const hand = mobile ? await js("previewState.combat.hand.length") : null;
  if (mobile) await click(".mobile-card-inspect");
  assert.equal(
    await js('Boolean(document.querySelector(".card-art-full"))'),
    false
  );
  await shot(`cards-${width}`);
  await click(
    mobile ? ".mobile-card-preview .card-art-zoom" : ".card-art-zoom"
  );
  await wait(500);
  const metrics = await js(
    `(()=>{const i=document.querySelector('.card-art-full');if(!i)return null;const r=i.getBoundingClientRect(),m=i.closest('.ant-modal').getBoundingClientRect();return {naturalWidth:i.naturalWidth,naturalHeight:i.naturalHeight,fit:getComputedStyle(i).objectFit,left:r.left,right:r.right,top:r.top,bottom:r.bottom,modalLeft:m.left,modalRight:m.right,overflow:document.documentElement.scrollWidth>innerWidth}})()`
  );
  assert(metrics, `Viewer missing at ${width}`);
  assert.equal(metrics.naturalWidth, 1536);
  assert.equal(metrics.naturalHeight, 1024);
  assert.equal(metrics.fit, "contain");
  assert(
    metrics.left >= 0 &&
      metrics.right <= width &&
      metrics.top >= 0 &&
      metrics.bottom <= height,
    JSON.stringify(metrics)
  );
  assert(!metrics.overflow);
  await shot(`artwork-${width}`);
  await click(".card-art-full");
  if (mobile) assert.equal(await js("previewState.combat.hand.length"), hand);
  await cdp("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "Escape",
    code: "Escape",
    windowsVirtualKeyCode: 27,
  });
  await wait(400);
  assert.equal(
    await js('Boolean(document.querySelector(".card-art-full"))'),
    false,
    "Escape closes artwork"
  );
  if (mobile) {
    assert(
      await js('Boolean(document.querySelector(".mobile-card-preview"))'),
      "Escape retains card reading"
    );
    assert.equal(await js("previewState.combat.hand.length"), hand);
    await click(".mobile-preview-close");
  }
  checks.push({
    width,
    height,
    ...metrics,
    escape: true,
    noAccidentalPlay: true,
  });
  console.log(`Artwork ${width} x ${height}: passed`);
}
await cdp("Emulation.setDeviceMetricsOverride", {
  width: 1440,
  height: 1000,
  deviceScaleFactor: 1,
  mobile: false,
});
await cdp("Page.navigate", { url: "http://127.0.0.1:4318/?hand=5" });
await wait(1500);
const desktopHand = await js("previewState.combat.hand.length");
const hover = await js(
  `(()=>{const e=[...document.querySelectorAll('[data-game-card]')].find(e=>e.getBoundingClientRect().width>0);const r=e.getBoundingClientRect();return{x:r.left+30,y:r.top+50}})()`
);
await cdp("Input.dispatchMouseEvent", { type: "mouseMoved", ...hover });
await wait(600);
await click(".card-art-zoom");
await wait(400);
await cdp("Input.dispatchMouseEvent", { type: "mouseMoved", x: 20, y: 20 });
await wait(400);
assert(
  await js('Boolean(document.querySelector(".card-art-full"))'),
  "Desktop artwork survives pointer leaving the card"
);
await click(".card-art-full");
assert.equal(await js("previewState.combat.hand.length"), desktopHand);
await shot("artwork-desktop-hand");
await cdp("Input.dispatchKeyEvent", {
  type: "keyDown",
  key: "Escape",
  code: "Escape",
  windowsVirtualKeyCode: 27,
});
await wait(400);
assert.equal(
  await js('Boolean(document.querySelector(".card-art-full"))'),
  false
);
assert.equal(await js("previewState.combat.hand.length"), desktopHand);
checks.push({
  desktopHandZoom: true,
  survivesMouseLeave: true,
  noAccidentalPlay: true,
});
console.log("Desktop hand: hover, artwork, pointer exit and Escape passed");
await cdp("Page.navigate", { url: "http://127.0.0.1:4318/?hand=5" });
await wait(1500);
await cdp("Input.dispatchMouseEvent", { type: "mouseMoved", x: 5, y: 5 });
await js(
  `[...document.querySelectorAll('[data-game-card]')].find(e=>e.getBoundingClientRect().width>0).focus()`
);
await wait(400);
assert(
  await js('Boolean(document.querySelector(".card-art-zoom"))'),
  "Keyboard focus reveals illustration command"
);
await js('document.querySelector(".card-art-zoom").focus()');
await cdp("Input.dispatchKeyEvent", {
  type: "keyDown",
  key: "Enter",
  code: "Enter",
  windowsVirtualKeyCode: 13,
  text: "\r",
});
await cdp("Input.dispatchKeyEvent", {
  type: "keyUp",
  key: "Enter",
  code: "Enter",
  windowsVirtualKeyCode: 13,
});
await wait(500);
assert(
  await js('Boolean(document.querySelector(".card-art-full"))'),
  "Keyboard opens artwork"
);
assert.equal(await js("previewState.combat.hand.length"), desktopHand);
await cdp("Input.dispatchKeyEvent", {
  type: "keyDown",
  key: "Escape",
  code: "Escape",
  windowsVirtualKeyCode: 27,
});
await wait(400);
assert.equal(
  await js('Boolean(document.querySelector(".card-art-full"))'),
  false
);
checks.push({ keyboardHandZoom: true, noAccidentalPlay: true });
console.log("Desktop keyboard: focus, Enter and Escape passed");
assert.equal(errors.length, 0, JSON.stringify(errors));
fs.writeFileSync(
  "docs/card-art-2026-10-10/browser-results.json",
  JSON.stringify({ checks, errors }, null, 2)
);
ws.close();

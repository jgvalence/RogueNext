import fs from "node:fs";
import assert from "node:assert/strict";
const catalog = JSON.parse(
  fs.readFileSync("docs/rooms-balance-2026-10-10/events.json", "utf8")
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
const scenarios = ["map", "shop", "rest", "forge", "event&event=ink_fountain"].flatMap(screen => [[screen,1440,1000],[screen,390,844],[screen,320,568],[screen,844,390]]);
if (!process.argv.includes("--quick")) scenarios.push(...catalog.map(e=>[`event&event=${e.id}`,390,844]));
for (const [screen,width,height] of scenarios) {
  await cdp("Emulation.setDeviceMetricsOverride", {width,height,deviceScaleFactor:1,mobile:width<1024});
  await cdp("Page.navigate", {url:`http://127.0.0.1:4318/?screen=${screen}`});
  await wait(1000);
  for(let i=0;i<100;i++){
    if(await js(`document.querySelectorAll('[data-room-art]').length>0&&[...document.querySelectorAll('[data-room-art] img')].every(i=>i.complete&&i.naturalWidth>0)`))break;
    await wait(100);
  }
  const metrics=await js(`({overflow:document.documentElement.scrollWidth>innerWidth,portraits:[...document.querySelectorAll('[data-room-art] img')].map(i=>({src:i.currentSrc,loaded:i.complete&&i.naturalWidth>0})),buttons:[...document.querySelectorAll('button')].filter(b=>b.getBoundingClientRect().width>0).length})`);
  const shot=await cdp("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
  fs.writeFileSync(`docs/rooms-balance-2026-10-10/${screen.replaceAll('&event=','-')}-${width}.png`,Buffer.from(shot.data,'base64'));
  assert(!metrics.overflow,JSON.stringify({screen,width,metrics}));
  assert(metrics.portraits.length>0&&metrics.portraits.every(i=>i.loaded&&i.src.includes('/rooms/painted-v1/')),JSON.stringify({screen,width,metrics,errors}));
  assert(metrics.buttons>0);
  checks.push({screen,width,height,...metrics});console.log(screen,width,'passed');
}
await js(`document.querySelector('[data-room-art] img').dispatchEvent(new Event('error'))`);
for(let i=0;i<50;i++) {
  if(await js(`document.querySelector('[data-room-art] img').currentSrc.endsWith('.svg')`)) break;
  await wait(100);
}
assert(await js(`document.querySelector('[data-room-art] img').currentSrc.endsWith('.svg')`));
assert.equal(errors.length,0,JSON.stringify(errors));
fs.writeFileSync('docs/rooms-balance-2026-10-10/browser-results.json',JSON.stringify({checks,errors,fallback:true},null,2));
ws.close();

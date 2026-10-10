import fs from 'node:fs';
import assert from 'node:assert/strict';
const tabs=await (await fetch('http://127.0.0.1:9223/json/list')).json();
const ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let serial=0;const pending=new Map(),checks=[];
ws.addEventListener('message',({data})=>{const m=JSON.parse(data);if(m.id){const [r,j]=pending.get(m.id);pending.delete(m.id);m.error?j(m.error):r(m.result);}});
function cdp(method,params={}){return new Promise((r,j)=>{const id=++serial;pending.set(id,[r,j]);ws.send(JSON.stringify({id,method,params}));});}
async function js(expression){const r=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});assert(!r.exceptionDetails,JSON.stringify(r.exceptionDetails));return r.result.value;}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function click(selector){const p=await js(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});if(!el)return null;const r=el.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);assert(p,'Missing '+selector);await cdp('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'left',clickCount:1});await cdp('Input.dispatchMouseEvent',{type:'mouseReleased',...p,button:'left',clickCount:1});await wait(180);}
async function shot(name){const r=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(`docs/visual-2026-10-09/${name}.png`,Buffer.from(r.data,'base64'));}
await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
await cdp('Page.navigate',{url:'http://127.0.0.1:4318/?hand=8'});await wait(1600);
const initialHand=await js('previewState.combat.hand.length');
await click('.mobile-card-inspect');
assert(await js('Boolean(document.querySelector(".mobile-card-preview"))'));
assert.equal(await js('previewState.combat.hand.length'),initialHand);
const previewRect=await js('(()=>{const r=document.querySelector(".mobile-card-preview").getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right}})()');
assert(previewRect.top>=0&&previewRect.bottom<=844&&previewRect.left>=0&&previewRect.right<=390,JSON.stringify(previewRect));
await shot('card-reading-mobile');checks.push('Read opens within viewport without playing a card');
await click('.mobile-preview-close');assert.equal(await js('Boolean(document.querySelector(".mobile-card-preview"))'),false);checks.push('Close button closes card reading');
await click('.mobile-card-inspect');await cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await wait(100);assert.equal(await js('Boolean(document.querySelector(".mobile-card-preview"))'),false);checks.push('Escape closes card reading');
await js('document.querySelector(".mobile-hand-scroll").scrollLeft=300');await wait(250);assert(await js('document.querySelector(".mobile-hand-scroll").scrollLeft>0'));checks.push('Long hand scrolls horizontally');
await js('document.querySelector(".mobile-hand-scroll").scrollLeft=0');await wait(250);
await cdp('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
const touchY=await js('document.querySelector(".mobile-hand-scroll").getBoundingClientRect().top+85');
await cdp('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:300,y:touchY}]});
for(const x of [270,220,160,90]){await cdp('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:touchY}]});await wait(40);}
await cdp('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await wait(250);
assert(await js('document.querySelector(".mobile-hand-scroll").scrollLeft>40'));
assert.equal(await js('previewState.combat.hand.length'),initialHand);checks.push('Touch swipe scrolls the hand without playing a card');
await js('document.querySelector(".mobile-hand-scroll").scrollLeft=0');await wait(250);
await click('.combat-action-bar > div:nth-child(2) button');
assert(await js('[...document.querySelectorAll("button")].some(b=>b.textContent.trim()==="Fermer"&&b.getBoundingClientRect().width>0)'));
await shot('ink-powers-mobile');
await js('[...document.querySelectorAll("button")].find(b=>b.textContent.trim()==="Fermer"&&b.getBoundingClientRect().width>0).click()');await wait(100);checks.push('Ink button opens powers and closes');
await click('[data-mobile-hand-card]');
await click('.mobile-enemy-portrait');await wait(600);
assert.equal(await js('previewState.combat.hand.length'),initialHand-1);checks.push('Select attack then enemy plays exactly one card through the game reducer');
await cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
assert(await js('matchMedia("(prefers-reduced-motion: reduce)").matches'));
const durations=await js('[...document.querySelectorAll(".animate-enemy-idle")].map(e=>getComputedStyle(e).animationDuration)');assert(durations.every(x=>parseFloat(x)<=0.01));checks.push('Reduced motion removes looping animation duration');
await cdp('Emulation.setEmulatedMedia',{features:[]});
await cdp('Emulation.setDeviceMetricsOverride',{width:320,height:568,deviceScaleFactor:1,mobile:true});
await cdp('Page.navigate',{url:'http://127.0.0.1:4318/'});await wait(1400);
const player=await js('(()=>{const el=document.querySelector(".combat-mobile-allies button:last-child");const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom,visible:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest("button")===el}})()');
assert(player.visible&&player.bottom<=568,JSON.stringify(player));checks.push('Player health remains visible at 320 x 568');
await cdp('Emulation.setDeviceMetricsOverride',{width:667,height:375,deviceScaleFactor:1,mobile:true});await wait(350);
const landscapePlayer=await js('(()=>{const el=document.querySelector(".combat-mobile-allies button:last-child");const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom,visible:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest("button")===el}})()');
assert(landscapePlayer.visible,JSON.stringify(landscapePlayer));checks.push('Player health remains visible at 667 x 375');
await js('document.querySelector(".combat-scene-art").dispatchEvent(new Event("error"))');await wait(300);
assert(await js('document.querySelector(".combat-scene-art").currentSrc.endsWith(".svg")'));checks.push('A failed painted background falls back to the original SVG');
fs.writeFileSync('docs/visual-2026-10-09/interaction-results.json',JSON.stringify({checks},null,2));console.log(checks.join('\n'));ws.close();

import fs from 'node:fs';
import assert from 'node:assert/strict';
const tabs=await(await fetch('http://127.0.0.1:9223/json/list')).json();
const ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let n=0;const pending=new Map(),errors=[];
ws.addEventListener('message',({data})=>{const m=JSON.parse(data);if(m.id){const [r,j]=pending.get(m.id);pending.delete(m.id);m.error?j(m.error):r(m.result);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params);});
function cdp(method,params={}){return new Promise((r,j)=>{const id=++n;pending.set(id,[r,j]);ws.send(JSON.stringify({id,method,params}));});}
await cdp('Runtime.enable');
await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
await cdp('Page.navigate',{url:'http://127.0.0.1:4320/'});
await new Promise(r=>setTimeout(r,3500));
const result=await cdp('Runtime.evaluate',{expression:`({url:location.href,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,title:document.querySelector('h1')?.textContent,broken:[...document.images].filter(i=>i.getBoundingClientRect().width>0&&(!i.complete||!i.naturalWidth)).map(i=>i.src),polish:[...document.styleSheets].some(s=>{try{return [...s.cssRules].some(r=>r.cssText.includes('.panlibrarium-home'))}catch{return false}})})`,returnByValue:true});
const info=result.result.value;
assert(info.title.includes('Panlibrarium'));assert.equal(info.width,info.scrollWidth);assert.equal(info.broken.length,0);assert(info.polish);assert.equal(errors.length,0);
const shot=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync('docs/visual-2026-10-09/home-production-mobile.png',Buffer.from(shot.data,'base64'));
fs.writeFileSync('docs/visual-2026-10-09/production-results.json',JSON.stringify({info,errors},null,2));console.log('Production home: image, CSS, layout and runtime OK');ws.close();

import fs from 'node:fs';
const tabs=await (await fetch('http://127.0.0.1:9223/json/list')).json();
const ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
await new Promise(resolve=>ws.addEventListener('open',resolve,{once:true}));
let serial=0;
const pending=new Map(), errors=[];
ws.addEventListener('message',({data})=>{const msg=JSON.parse(data);if(msg.id){const [resolve,reject]=pending.get(msg.id)||[];pending.delete(msg.id);msg.error?reject?.(msg.error):resolve?.(msg.result);}if(msg.method==='Runtime.exceptionThrown')errors.push(msg.params.exceptionDetails);});
function cdp(method,params={}){return new Promise((resolve,reject)=>{const id=++serial;pending.set(id,[resolve,reject]);ws.send(JSON.stringify({id,method,params}));});}
async function evaluate(expression){const r=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
const delay=ms=>new Promise(r=>setTimeout(r,ms));
await cdp('Runtime.enable');await cdp('Page.enable');
const scenarios=process.argv.includes('--all')?[
 ['combat-desktop',1440,1000,''],['combat-laptop',1280,720,''],['combat-compact-desktop',1024,600,''],
 ['combat-portrait',390,844,''],['combat-small',320,568,''],['combat-landscape',844,390,''],['combat-short',667,375,''],
 ['combat-duel',390,844,'&enemies=1&allies=0'],['combat-tablet',820,1180,'&hand=8'],
 ['home-desktop',1440,900,'&screen=home'],['home-mobile',390,844,'&screen=home'],
 ['setup-desktop',1440,1000,'&screen=setup'],['setup-mobile',390,844,'&screen=setup'],
 ['intro-mobile',390,844,'&screen=intro'],['shop-mobile',390,844,'&screen=shop'],['shop-desktop',1440,1000,'&screen=shop'],
 ['cards',1280,900,'&screen=cards'],['egyptian',1440,900,'&biome=EGYPTIAN&enemies=2&allies=0'],['library',1440,900,'&biome=LIBRARY&enemies=2&allies=0'],
 ...['GREEK','AZTEC','CELTIC','RUSSIAN','AFRICAN','LOVECRAFTIAN'].map(b=>[b.toLowerCase(),1280,800,'&biome='+b+'&enemies=2&allies=0'])
]:[['combat-desktop',1440,1000,''],['combat-portrait',390,844,''],['combat-landscape',844,390,''],['cards',1280,900,'&screen=cards']];
const metrics=[];
for(const [name,width,height,query] of scenarios){
 await cdp('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<1024});
 await cdp('Page.navigate',{url:`http://127.0.0.1:4318/?v=2${query}`});
 await delay(1800);
 const info=await evaluate(`({width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,body:document.body.innerText.slice(0,250),brokenImages:[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src),endTurn:[...document.querySelectorAll('button')].filter(b=>b.textContent.includes('Fin du tour')&&b.getBoundingClientRect().width).map(b=>{const r=b.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}})})`);
 const shot=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
 fs.writeFileSync(`docs/visual-2026-10-09/${name}.png`,Buffer.from(shot.data,'base64'));
 metrics.push({name,...info});console.log(name,info.scrollWidth,info.width,info.brokenImages.length);
}
fs.writeFileSync('docs/visual-2026-10-09/browser-results.json',JSON.stringify({metrics,errors},null,2));
console.log('Runtime errors:',errors.length);
ws.close();

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
const scenarios=[['interface-desktop',1280,900,'&screen=interface'],['interface-mobile',390,844,'&screen=interface']];
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
const controls=await evaluate(`(()=>{
 const buttons=[...document.querySelectorAll('.rogue-button')];
 const disabled=buttons.find(b=>b.textContent==='Indisponible');
 const primary=buttons.find(b=>b.textContent==='Continuer');
 primary.focus();
 return {disabled:disabled.disabled,primaryBackground:getComputedStyle(primary).backgroundImage,disabledBackground:getComputedStyle(disabled).backgroundImage,focusable:document.activeElement===primary};
})()`);
if(!controls.disabled||!controls.focusable||controls.primaryBackground===controls.disabledBackground)throw new Error(JSON.stringify(controls));
await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Ouvrir le panneau').click()`);
await delay(350);
const modal=await evaluate(`(()=>{const el=document.querySelector('.rogue-modal');const r=el.getBoundingClientRect();return {visible:r.width>0,fits:r.x>=0&&r.right<=innerWidth}})()`);
if(!modal.visible||!modal.fits)throw new Error(JSON.stringify(modal));
const modalShot=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
fs.writeFileSync('docs/visual-2026-10-09/interface-modal-mobile.png',Buffer.from(modalShot.data,'base64'));
await evaluate(`document.querySelector('.rogue-modal .ant-modal-footer button').click()`);
await delay(350);
const closed=await evaluate(`!document.querySelector('.rogue-modal')||document.querySelector('.rogue-modal').getBoundingClientRect().width===0`);
if(!closed)throw new Error('Modal did not close');
fs.writeFileSync('docs/visual-2026-10-09/interface-results.json',JSON.stringify({metrics,controls,modal,closed,errors},null,2));
console.log('Runtime errors:',errors.length);
ws.close();

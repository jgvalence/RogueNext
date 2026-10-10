import fs from 'node:fs';import assert from 'node:assert/strict';import {connect,stateScript,wait} from './cdp.mjs';
const b=await connect(),root='docs/balance-final-2026-10-10';const checks=[];
async function shot(label){const r=await b.cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(`${root}/05-layout-${label}.png`,Buffer.from(r.data,'base64'));}
try {
 for(const [width,height] of [[320,568],[390,844],[844,390],[1440,1000]]){
  await b.cdp('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<1024});await b.setTouch(width<1024);await wait(800);
  assert(!await b.js('document.documentElement.scrollWidth>innerWidth'),`overflow ${width}`);
  await shot(`${width}x${height}`);checks.push({width,height,noHorizontalOverflow:true});
 }
 await b.cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await b.setTouch(true);await wait(500);
 const before=await b.js(stateScript);if(!await b.js("!!document.querySelector('.card-art-zoom')"))await b.click(b.button('Lire'));await wait(500);await b.click("document.querySelector('.card-art-zoom')");
 await b.until("document.querySelector('.card-art-full')?.naturalWidth>0");
 const image=await b.js("(()=>{const e=document.querySelector('.card-art-full'),r=e.getBoundingClientRect();return {src:e.getAttribute('src'),naturalWidth:e.naturalWidth,naturalHeight:e.naturalHeight,width:r.width,height:r.height,objectFit:getComputedStyle(e).objectFit}})()");
 assert(image.src.includes('-full.webp'));assert(image.naturalWidth>=1000);assert.equal(image.objectFit,'contain');assert(!await b.js('document.documentElement.scrollWidth>innerWidth'));await shot('illustration');
 await b.click("[...document.querySelectorAll('button')].find(e=>e.textContent.startsWith('Fermer l'))");
 await b.click(b.button('Fermer'));await wait(300);assert.deepEqual((await b.js(stateScript)).combat,before.combat);
 const result={viewports:checks,illustration:image,artViewerDoesNotPlayCard:true,errors:b.errors};fs.writeFileSync(`${root}/05-mobile-layouts.json`,JSON.stringify(result,null,2));console.log(result);
}finally{b.close();}

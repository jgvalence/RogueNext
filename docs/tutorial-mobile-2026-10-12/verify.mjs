import fs from 'node:fs';import assert from 'node:assert/strict';
import {connect,wait,stateScript} from '../balance-final-2026-10-10/cdp.mjs';
const b=await connect(),checks=[],folder='docs/tutorial-mobile-2026-10-12';fs.mkdirSync(folder,{recursive:true});
const step=()=>b.js("document.querySelector('.combat-view')?.dataset.tutorialStep");
async function tap(expression){
 await b.js(`(${expression}).scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'})`);await wait(500);
 const p=await b.js(`(()=>{const e=${expression},r=e.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;return {x,y,hit:e.contains(document.elementFromPoint(x,y))}})()`);assert(p.hit,'Tap intercepted');
 await b.cdp('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:p.x,y:p.y,radiusX:1,radiusY:1,force:1}]});await wait(80);await b.cdp('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
}
async function reloadAt(expected){await wait(3000);await b.js('localStorage.clear();window.__tutorialReload=true');await b.cdp('Page.reload');await b.until(`!window.__tutorialReload&&document.querySelector('.combat-view')?.dataset.tutorialStep===${JSON.stringify(expected)}`,90000);}
async function layouts(label){
 await b.js(`(()=>{const s=document.createElement('style');s.textContent='nextjs-portal,.tsqd-parent-container { display: none !important; }';document.head.append(s)})()`);
 for(const [width,height] of [[393,873],[873,393],[873,340],[320,568]]){
  await b.cdp('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true});await b.setTouch(true);await wait(250);
  await b.js("document.querySelector('.combat-view').scrollTop=0");
  const m=await b.js(`(()=>{const g=document.querySelector('.first-combat-guide'),r=g.getBoundingClientRect(),h=document.querySelector('.mobile-hand-scroll').getBoundingClientRect();return {overflow:document.documentElement.scrollWidth>innerWidth,font:parseFloat(getComputedStyle(g.querySelector('p')).fontSize),buttons:[...g.querySelectorAll('button')].map(e=>e.getBoundingClientRect().height),overlapsHand:r.left<h.right&&r.right>h.left&&r.top<h.bottom&&r.bottom>h.top,guideInViewport:r.top>=0&&r.bottom<=innerHeight}})()`);
  assert(!m.overflow);assert(m.font>=14);assert(m.buttons.every(v=>v>=44));assert(!m.overlapsHand,JSON.stringify({label,width,height,m}));assert(m.guideInViewport,JSON.stringify({label,width,height,m}));
  fs.writeFileSync(`${folder}/${label}-${width}x${height}.png`,Buffer.from((await b.cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false})).data,'base64'));
  checks.push({step:label,width,height,...m});
 }
 await b.cdp('Emulation.setDeviceMetricsOverride',{width:393,height:873,deviceScaleFactor:1,mobile:true});await b.setTouch(true);await wait(200);
}
try{
 await b.until("!!document.querySelector('.first-combat-guide')",90000);
 for(const name of ['cards','energy','incomingDamage','ink']){assert.equal(await step(),name);await layouts(name);await b.click(b.button('Compris'));await wait(200);}
 assert.equal(await step(),'inkPowers');await layouts('inkPowers');
 await b.click(b.button('Ouvrir les pouvoirs'));await b.until("!!document.querySelector('.mobile-powers-panel')");
 assert(await b.js("[...document.querySelectorAll('.mobile-powers-panel [data-tutorial-power]')].some(e=>!e.disabled)"));
 await b.click("document.querySelector('.mobile-powers-panel [data-tutorial-power]')");await b.until("document.querySelector('.combat-view')?.dataset.tutorialStep==='inkedCard'");
 await reloadAt('inkedCard');await layouts('inkedCard');await b.click(b.button('Montrer la carte'));
 const ink="document.querySelector('[data-tutorial-ink-card] .mobile-card-actions button:last-child')";
 assert(await b.js(`!(${ink}).disabled`));await tap(ink);await b.until("!!document.querySelector('[data-card-selected=true][data-card-inked=true]')");
 if(await b.js("!!document.querySelector('.mobile-enemy-portrait[data-targetable]')"))await tap("document.querySelector('.mobile-enemy-portrait[data-targetable]')");else await tap(ink);
 await b.until("document.querySelector('.combat-view')?.dataset.tutorialStep==='endTurn'");await reloadAt('endTurn');await layouts('endTurn');
 const before=await b.js(stateScript);await b.click("document.querySelector('.first-combat-guide-action')");await b.until("!document.querySelector('.first-combat-guide')");
 await b.until(`(${stateScript})?.combat?.turnNumber>${before.combat.turnNumber}`,20000);
 await wait(2500);await b.js('localStorage.clear();window.__tutorialReload=true');await b.cdp('Page.reload');await b.until(`!window.__tutorialReload&&(${stateScript})?.combat?.turnNumber>${before.combat.turnNumber}`,90000);assert(!await b.js("document.querySelector('.first-combat-guide')!==null"));
 assert.equal(b.errors.length,0);fs.writeFileSync(`${folder}/checks.json`,JSON.stringify({checks,powerUsed:true,inkedCardPlayed:true,endTurnCompleted:true,reloadAfterPower:true,reloadAfterInkedCard:true,reloadAfterEndTurn:true,errors:b.errors},null,2)+'\n');console.log({layouts:checks.length,powerUsed:true,inkedCardPlayed:true,endTurnCompleted:true,reloads:3});
}finally{b.close();}

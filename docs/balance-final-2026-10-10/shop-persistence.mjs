import fs from 'node:fs';
import assert from 'node:assert/strict';
import {PrismaClient} from '@prisma/client';
import {connect,stateScript,wait} from './cdp.mjs';
const db=new PrismaClient({datasourceUrl:'postgresql://rogue_e2e@127.0.0.1:55439/rogue_e2e?schema=public'});
const b=await connect();
await b.cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await b.setTouch(true);
const s=await b.js(stateScript),id=s.runId;
const row=()=>db.run.findUniqueOrThrow({where:{id}});
async function saved(predicate){for(let i=0;i<100;i++){const r=await row();if(predicate(r.state))return r.state;await wait(150);}throw Error('Save timeout');}
async function reload(){await b.cdp('Page.reload',{ignoreCache:true});await wait(1000);await b.until(stateScript);await b.until("document.body.innerText.includes('Quitter la boutique')");}
try {
 const initial=await saved(s=>!!s.merchantCheckpoint);
 await b.click("[...document.querySelectorAll('button')].find(e=>!e.disabled&&e.textContent.includes('Acheter'))");
 const purchased=await saved(s=>s.gold<initial.gold&&s.deck.length===initial.deck.length+1);
 await reload();const resumed=await b.js(stateScript);
 assert.equal(resumed.gold,purchased.gold);assert.deepEqual(resumed.deck,purchased.deck);assert.deepEqual(resumed.merchantCheckpoint,purchased.merchantCheckpoint);
 await b.click("[...document.querySelectorAll('button')].find(e=>!e.disabled&&e.textContent.includes('Retire 1 carte')&&!e.textContent.includes('sacrifiant'))");
 const pending=await saved(s=>!!s.merchantCheckpoint?.pendingPurgeItemId);
 assert(pending.gold<purchased.gold);assert.equal(pending.deck.length,purchased.deck.length);
 await reload();await b.until("!!document.querySelector('[role=dialog] [data-game-card]')");
 assert.equal((await b.js(stateScript)).gold,pending.gold);
 await b.click("document.querySelector('[role=dialog] [data-game-card]')",true);
 const purged=await saved(s=>!s.merchantCheckpoint?.pendingPurgeItemId&&s.deck.length===pending.deck.length-1);
 assert.equal(purged.gold,pending.gold);
 await reload();const final=await b.js(stateScript);assert.deepEqual(final.deck,purged.deck);assert.equal(final.gold,purged.gold);assert.deepEqual(final.merchantCheckpoint,purged.merchantCheckpoint);
 const report={runId:id,purchaseSurvivesReload:true,stockSurvivesReload:true,pendingPaidPurgeSurvivesReload:true,noDoubleCharge:true,removedCardSurvivesReload:true,gold:[initial.gold,purchased.gold,pending.gold,final.gold],deckSizes:[initial.deck.length,purchased.deck.length,pending.deck.length,final.deck.length],errors:b.errors};
 fs.writeFileSync('docs/balance-final-2026-10-10/05-shop-persistence.json',JSON.stringify(report,null,2));console.log(report);
} finally {b.close();await db.$disconnect();}

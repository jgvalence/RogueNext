import fs from 'node:fs';import assert from 'node:assert/strict';import {PrismaClient} from '@prisma/client';import {connect,stateScript,wait} from './cdp.mjs';
const db=new PrismaClient({datasourceUrl:'postgresql://rogue_e2e@127.0.0.1:55439/rogue_e2e?schema=public'});const b=await connect();await b.cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await b.setTouch(true);
try {
 const id=(await b.js(stateScript)).runId;await wait(2500);const before=(await db.run.findUniqueOrThrow({where:{id}})).state;assert(before.pendingRewards?.isBoss);assert(before.pendingRewards.cardIds.length>0);
 await b.cdp('Page.reload',{ignoreCache:true});await wait(1200);await b.until(stateScript);await b.until("document.body.innerText.includes('recompense')");const after=await b.js(stateScript);assert.deepEqual(after.pendingRewards,before.pendingRewards);assert.equal(after.gold,before.gold);assert.deepEqual(after.deck,before.deck);
 const name=process.argv[2]??'fresh';
 if(name==='final'){assert.equal(after.status,'VICTORY');assert.equal((await db.run.findUniqueOrThrow({where:{id}})).status,'IN_PROGRESS');}
 const zoomFits=await b.js("[...document.querySelectorAll('[data-game-card] .card-art-zoom')].every(e=>{const r=e.getBoundingClientRect(),c=e.closest('[data-game-card]').getBoundingClientRect();return r.left>=c.left&&r.right<=c.right&&getComputedStyle(e.querySelector('.card-art-zoom-label')).display==='none'})");
 const r=await b.cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(`docs/balance-final-2026-10-10/05-${name}-boss-reward-reload.png`,Buffer.from(r.data,'base64'));
 const result={runId:id,floor:after.floor,room:after.currentRoom,status:after.status,noFixture:true,offerSurvivesReload:true,rerollsPreserved:true,goldAndDeckUnchanged:true,mobileIllustrationButtonFits:zoomFits,cardIds:after.pendingRewards.cardIds,relicIds:after.pendingRewards.relicIds,errors:b.errors};fs.writeFileSync(`docs/balance-final-2026-10-10/05-${name}-reward-reload.json`,JSON.stringify(result,null,2));console.log(result);
}finally{b.close();await db.$disconnect();}

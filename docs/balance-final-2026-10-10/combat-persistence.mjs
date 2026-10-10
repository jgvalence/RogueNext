import fs from 'node:fs';import assert from 'node:assert/strict';import {isDeepStrictEqual} from 'node:util';import {PrismaClient} from '@prisma/client';import {connect,stateScript,wait} from './cdp.mjs';
const db=new PrismaClient({datasourceUrl:'postgresql://rogue_e2e@127.0.0.1:55439/rogue_e2e?schema=public'});let b=await connect();
async function mobile(){await b.cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await b.setTouch(true);}
const s=await b.js(stateScript),id=s.runId,url=await b.js('location.href');
const row=()=>db.run.findUniqueOrThrow({where:{id}});
const same=isDeepStrictEqual;
async function saved(combat){for(let i=0;i<120;i++){const r=await row();if(same(r.state.combat,combat))return r.state;await wait(200);}throw Error('Save timeout');}
async function ready(){await wait(1200);await b.until(stateScript);await b.until("document.body.innerText.toLowerCase().includes('fin du tour')");}
try {
 await mobile();await b.click(b.button('Fin du tour'));await wait(1800);const afterTurn=await b.js(stateScript);await saved(afterTurn.combat);
 await b.cdp('Page.reload',{ignoreCache:true});await ready();const restored=await b.js(stateScript);assert.deepEqual(restored.combat,afterTurn.combat);assert.deepEqual(restored.deck,afterTurn.deck);assert.equal(restored.gold,afterTurn.gold);
 const newTab=await b.cdp('Target.createTarget',{url:'about:blank'});await b.cdp('Target.closeTarget',{targetId:b.id});b.close();b=await connect(newTab.targetId);await mobile();await b.cdp('Page.navigate',{url});await ready();const reopened=await b.js(stateScript);assert.deepEqual(reopened.combat,afterTurn.combat);
 await wait(2500);const beforeOffline=await row();await b.cdp('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:-1,uploadThroughput:-1});
 await b.click(b.button('Fin du tour'));await wait(3200);const offline=await b.js(stateScript);assert(!same(offline.combat,reopened.combat));assert.deepEqual((await row()).state.combat,beforeOffline.state.combat);
 const offlineText=await b.js('document.body.innerText');assert(/hors ligne|connexion|sauvegarde/i.test(offlineText));
 await b.cdp('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});await saved(offline.combat);
 await b.cdp('Page.reload',{ignoreCache:true});await ready();assert.deepEqual((await b.js(stateScript)).combat,offline.combat);
 const report={runId:id,reloadPreservesCombatHandDeckAndGold:true,tabCloseAndReopenPreservesCombat:true,offlineKeepsServerUnchanged:true,offlineWarningVisible:true,onlineAutomaticallySaves:true,reloadAfterNetworkRecovery:true,errors:b.errors};
 fs.writeFileSync('docs/balance-final-2026-10-10/05-combat-persistence.json',JSON.stringify(report,null,2));console.log(report);
} finally {await b.cdp('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1}).catch(()=>{});b.close();await db.$disconnect();}

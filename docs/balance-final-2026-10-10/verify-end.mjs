import fs from 'node:fs';import assert from 'node:assert/strict';import {PrismaClient} from '@prisma/client';import {connect,wait} from './cdp.mjs';
const db=new PrismaClient({datasourceUrl:'postgresql://rogue_e2e@127.0.0.1:55439/rogue_e2e?schema=public'});const b=await connect();
try {
 const results=[];
 for(const [name,id,status,bossCount] of [['desktop','cmv28t4vs0002tw5grwdpm2xj','DEFEAT',2],['mobile','cmv2acqz00001twtkq5ifts3n','VICTORY',3]]){
  let run;for(let i=0;i<100;i++){run=await db.run.findUniqueOrThrow({where:{id}});if(run.status===status)break;await wait(200);}assert.equal(run.status,status);
  const summaries=await db.runSummary.findMany({where:{userId:run.userId}});assert.equal(summaries.length,1);assert.equal(summaries[0].status,status);const bossCombatWins=summaries[0].analytics.combats.filter(c=>c.won&&c.room===15).length;assert.equal(bossCombatWins,bossCount);
  const snapshots=await db.pvpDeckSnapshot.count({where:{userId:run.userId}});assert.equal(snapshots,1);
  if(name==='mobile'){assert.equal(run.state.pendingRewards,undefined);assert.equal(run.state.merchantCheckpoint,undefined);}
  const result={name,runId:id,status,floor:run.state.floor,room:run.state.currentRoom,bossCombatWins,bossesDefeated:summaries[0].bossesDefeated,oneSummary:true,onePvpSnapshot:true,clearedRewardCheckpoint:!run.state.pendingRewards};results.push(result);
  const path=`docs/balance-final-2026-10-10/05-${name}-result.json`;const old=JSON.parse(fs.readFileSync(path,'utf8'));fs.writeFileSync(path,JSON.stringify({...old,clientStatus:old.status,status,databaseConfirmed:true,terminal:result},null,2));
 }
 const mobile=await db.run.findUniqueOrThrow({where:{id:results[1].runId}});const before=await db.userProgression.findUniqueOrThrow({where:{userId:mobile.userId}});assert.equal(before.wonRuns,51);
 await b.cdp('Page.navigate',{url:'http://127.0.0.1:4319/runs'});await b.until("document.body.innerText.toLowerCase().includes('victoire')");await b.cdp('Page.reload',{ignoreCache:true});await wait(2500);await b.until("document.body.innerText.toLowerCase().includes('victoire')");
 const after=await db.userProgression.findUniqueOrThrow({where:{userId:mobile.userId}});assert.equal(after.wonRuns,before.wonRuns);assert.deepEqual(after.resources,before.resources);assert.equal(await db.runSummary.count({where:{userId:mobile.userId}}),1);
 const result={runs:results,historyShowsVictory:true,historyReloadDoesNotDuplicateRewards:true,wonRunsBeforeFixture:50,wonRunsAfter:after.wonRuns,errors:b.errors};fs.writeFileSync('docs/balance-final-2026-10-10/05-terminal-verification.json',JSON.stringify(result,null,2));console.log(result);
}finally{b.close();await db.$disconnect();}

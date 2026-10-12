import fs from 'node:fs';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';

// Run before changing balance, then again with "after". Identical seeds,
// no purchased meta progression, real engine and normal starter decks.
const phase=process.argv[2];
assert(['before','after'].includes(phase));
const folder='docs/d0-opening-2026-10-12';
for(const character of ['scribe','bibliothecaire','griot','fou']) {
  const prefix=`${folder}/${phase}-${character}`;
  const log=fs.openSync(`${prefix}.log`,'w');
  const code=await new Promise((resolve,reject)=>{
    const child=spawn(process.execPath,['node_modules/tsx/dist/cli.mjs','scripts/simulate.ts','30','0','null',character,'none','d0-opening-1012','--verbose','--validate-checkpoints','--json',`${prefix}.json`],{windowsHide:true,stdio:['ignore',log,log]});
    child.on('error',reject);child.on('exit',resolve);
  });
  fs.closeSync(log);assert.equal(code,0);
  const data=JSON.parse(fs.readFileSync(`${prefix}.json`,'utf8'));
  assert.equal(data.errors.length,0);
  const text=fs.readFileSync(`${prefix}.log`,'utf8');
  const firstFloor=[...text.matchAll(/fl1 d\d+ (NORM|ELITE|BOSS|PRE) \[[^\]]*\] HP:(\d+)→(\d+|MORT) turns:(\d+)/g)];
  const bosses=firstFloor.filter(m=>m[1]==='BOSS'&&m[3]!=='MORT');
  const summary={phase,character,runs:data.runs.length,wins:data.wins,firstFloorVictories:bosses.length,meanHpAfterFirstBoss:bosses.reduce((sum,m)=>sum+Number(m[3]),0)/bosses.length,meanFirstFloorNetCombatLoss:firstFloor.reduce((sum,m)=>sum+Math.max(0,Number(m[2])-(m[3]==='MORT'?0:Number(m[3]))),0)/data.runs.length,errors:data.errors};
  fs.writeFileSync(`${prefix}-summary.json`,JSON.stringify(summary,null,2)+'\n');
  console.log(summary);
}

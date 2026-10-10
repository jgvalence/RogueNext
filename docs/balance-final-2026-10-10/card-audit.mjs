import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {allCardDefinitions}=require('../../src/game/data/index.ts');
const {getCardUpgradeBranches}=require('../../src/game/engine/card-upgrades.ts');
const root='docs/balance-final-2026-10-10';
const stage=process.argv[2]??'before';
const exposure={},branches={A:0,B:0};
for(const name of fs.readdirSync(root).filter(n=>n.startsWith(stage==='after'?'04-final-':'03-calibrated-')&&n.endsWith('.json'))){
 const data=JSON.parse(fs.readFileSync(`${root}/${name}`,'utf8'));
 for(const [id,counts] of Object.entries(data.draftStats??{})){
  exposure[id]??={offered:0,picked:0};exposure[id].offered+=counts.offered;exposure[id].picked+=counts.picked;
 }
 for(const b of ['A','B'])branches[b]+=data.upgradeStats?.[b]??0;
}
const active=allCardDefinitions.filter(c=>c.isCollectible!==false&&!c.isStarterCard&&c.rarity!=='STARTER'&&!['STATUS','CURSE'].includes(c.type));
const pattern=effects=>JSON.stringify(effects.map(({value,duration,...e})=>e));
const groups=new Map();
for(const c of active){const key=c.type+'|'+c.targeting+'|'+pattern(c.effects);groups.set(key,[...(groups.get(key)??[]),c.id]);}
const rows=active.map(c=>{const [a,b]=getCardUpgradeBranches(c);return {id:c.id,character:c.characterId??'neutral',...(exposure[c.id]??{offered:0,picked:0}),branchesIdentical:JSON.stringify(a)===JSON.stringify(b),sameBranchPattern:pattern(a.effects)===pattern(b.effects),base:c.effects,A:a.effects,B:b.effects};});
const report={active:active.length,branchSelections:branches,duplicates:[...groups.values()].filter(g=>g.length>1),identicalBranches:rows.filter(r=>r.branchesIdentical).map(r=>r.id),underused:rows.filter(r=>r.offered>=30).sort((a,b)=>a.picked/a.offered-b.picked/b.offered).slice(0,35),cards:rows};
fs.writeFileSync(`${root}/04-card-audit-${stage}.json`,JSON.stringify(report,null,2));
console.log(JSON.stringify({active:report.active,branches,duplicates:report.duplicates,identicalBranches:report.identicalBranches,underused:report.underused.map(({id,offered,picked})=>({id,offered,picked}))},null,2));

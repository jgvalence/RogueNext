import fs from 'node:fs';
import {createRequire} from 'node:module';
import {connect,wait,stateScript} from './cdp.mjs';
const require=createRequire(import.meta.url);
const {buildCardDefsMap,buildEnemyDefsMap}=require('../../src/game/data/index.ts');
const {chooseCombatCard}=require('../../scripts/simulation-combat-policy.ts');
const cards=buildCardDefsMap(),enemies=buildEnemyDefsMap();
const b=await connect();
const selector=(id,kind)=>`(()=>{for(const e of document.querySelectorAll(${JSON.stringify(kind==='card'?'[data-game-card],[data-mobile-hand-card]':'[role="button"],button')})){if(!e.getBoundingClientRect().width)continue;let f=e[Object.keys(e).find(k=>k.startsWith('__reactFiber$'))];for(let i=0;f&&i<9;i++,f=f.return){const p=f.memoizedProps;if(p?.instanceId===${JSON.stringify(id)}||p?.enemy?.instanceId===${JSON.stringify(id)}||f.key==='mobile-card-'+${JSON.stringify(id)})return e;}}return null;})()`;
const actions=[];
try{
 for(let i=0;i<Number(process.argv[2]??100);i++){
  const s=await b.js(stateScript);if(!s?.combat)break;
  if(['COMBAT_WON','COMBAT_LOST'].includes(s.combat.phase)){await wait(1000);break;}
  if(s.combat.phase!=='PLAYER_TURN'){await wait(250);continue;}
  const choice=chooseCombatCard(s.combat,cards,enemies);
  if(choice){
   const el=selector(choice.instanceId,'card');
   const target=choice.useInked?`[...(${el})?.querySelectorAll('button')??[]].find(e=>e.textContent.toLowerCase().includes('encre'))`:el;
   await b.click(target);await wait(100);
   if(choice.targetId)await b.click(selector(choice.targetId,'enemy'));else await b.click(target);
   await wait(350);actions.push(choice);
  }else{await b.click(b.button('Fin du tour'));await wait(1500);actions.push({endTurn:s.combat.turnNumber});}
 }
 console.log(JSON.stringify({actions,text:await b.js('document.body.innerText')},null,2));
}finally{fs.writeFileSync('.local-e2e/ui-actions.json',JSON.stringify(actions,null,2));b.close();}

import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {connect,wait,stateScript} from './cdp.mjs';
const require=createRequire(import.meta.url);
const {buildCardDefsMap,buildEnemyDefsMap}=require('../../src/game/data/index.ts');
const {chooseCombatCard,chooseInkPower}=require('../../scripts/simulation-combat-policy.ts');
const {scoreCardForBuild}=require('../../scripts/simulation-policy.ts');
const cards=buildCardDefsMap(),enemies=buildEnemyDefsMap();
const b=await connect();const width=Number(process.argv[2]??1440),height=width<600?844:1000;
await b.cdp('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<600});
await b.setTouch(width<600);
const root='docs/balance-final-2026-10-10',name=process.argv[3]??'desktop';
const log=fs.existsSync(`${root}/05-${name}-progress.json`)?JSON.parse(fs.readFileSync(`${root}/05-${name}-progress.json`,'utf8')).log:[],seen=new Set(log.map(e=>e.phase));let last='',stalled=0;
const visible="e.getBoundingClientRect().width>0&&!e.disabled";
const byText=text=>`[...document.querySelectorAll('button')].find(e=>${visible}&&e.textContent.toLowerCase().includes(${JSON.stringify(text.toLowerCase())}))`;
const byFiber=(id,kind)=>`(()=>{for(const e of document.querySelectorAll(${JSON.stringify(kind==='card'?'[data-game-card],[data-mobile-hand-card]':'button')})){if(!e.getBoundingClientRect().width)continue;let f=e[Object.keys(e).find(k=>k.startsWith('__reactFiber$'))];for(let i=0;f&&i<9;i++,f=f.return){const p=f.memoizedProps;if(p?.instanceId===${JSON.stringify(id)}||p?.enemy?.instanceId===${JSON.stringify(id)}||p?.definition?.id===${JSON.stringify(id)}||f.key===${JSON.stringify(id)}||f.key==='mobile-card-'+${JSON.stringify(id)})return e;}}return null;})()`;
const screenScript=`(()=>{const e=document.querySelector('main')??document.querySelector('button');if(!e)return {};let f=e[Object.keys(e).find(k=>k.startsWith('__reactFiber$'))];if(!f)return {};while(f.return)f=f.return;const stack=[f.stateNode.current],out={};while(stack.length){const n=stack.pop();const p=n.memoizedProps;const name=p?.onResolveHandOverflowExhaust&&p?.onEndTurn?'CombatView':p?.onSelectRoom&&p?.map?'FloorMap':p?.onPickCard&&p?.cardChoices?'RewardScreen':p?.onBuy&&p?.onRemoveCard?'ShopView':p?.onEventChoice&&p?.onHeal?'SpecialRoomView':p?.onFight&&p?.onHeal?'PreBossRoomView':p?.onChoose&&p?.choices?'BiomeSelectScreen':p?.onBackToLibrary&&p?.status?'RunOutcomeScreen':p?.showFirstRunTutorial&&p?.onContinue?'RunSetupScreen':null;if(name)out[name]={cardChoices:p.cardChoices?.map(c=>c.id),relicChoices:p.relicChoices?.map(c=>c.id),unlockedInkPowers:p.unlockedInkPowers};if(n.sibling)stack.push(n.sibling);if(n.child)stack.push(n.child);}return out;})()`;
async function clickIf(expression){if(await b.js(`!!(${expression})`)){await b.click(expression);await wait(220);return true;}return false;}
async function shot(label){const r=await b.cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(`${root}/05-${name}-${label}.png`,Buffer.from(r.data,'base64'));}
try{
 for(let i=0;i<2500;i++){
  const s=await b.js(stateScript),screens=await b.js(screenScript),text=await b.js('document.body.innerText');
  if(!s){await wait(300);continue;}
  const phase=Object.keys(screens)[0]??'unknown',key=`${s.floor}/${s.currentRoom}/${phase}`;
  if(key!==last){console.log(key,'HP',s.combat?.player.currentHp??s.playerCurrentHp);last=key;stalled=0;log.push({phase,floor:s.floor,room:s.currentRoom,hp:s.combat?.player.currentHp??s.playerCurrentHp,status:s.status});
   if(!seen.has(phase)){seen.add(phase);await shot(phase);}
   assert(!await b.js('document.documentElement.scrollWidth>innerWidth'),`Horizontal overflow: ${key}`);
  }
  if(++stalled>150)throw Error('UI stalled: '+key);
  fs.writeFileSync(`${root}/05-${name}-progress.json`,JSON.stringify({log,errors:b.errors},null,2));
  if(phase==='RunOutcomeScreen'){await shot('outcome');break;}
  if(phase===process.argv[4]){console.log('Paused for persistence checks');break;}
  if(process.argv[4]==='FINAL_REWARDS'&&phase==='RewardScreen'&&s.status==='VICTORY'){console.log('Paused at final boss rewards');break;}
  if(phase==='CombatView'){
   if(await clickIf(b.button('Fermer')))continue;
   if(s.combat?.phase!=='PLAYER_TURN'){await wait(350);continue;}
   if(text.includes('TUTORIEL COMBAT')){await clickIf(b.button('Passer'));continue;}
   if(s.combat.pendingHandOverflowExhaust>0){await b.click("document.querySelector('[role=dialog] [data-game-card]')",true);await wait(250);continue;}
   const choice=chooseCombatCard(s.combat,cards,enemies);
   const power=chooseInkPower(s.combat,cards,enemies,screens.CombatView.unlockedInkPowers??[]);
   if(power&&(!choice||power.score>choice.score)&&!['INDEX','REWRITE'].includes(power.power)){
    let target=byFiber(power.power,'enemy');
    if(!await b.js(`!!(${target})`)){await clickIf(byText('Pouvoirs'));target=byFiber(power.power,'enemy');}
    if(await clickIf(target)){await clickIf(b.button('Fermer'));if(power.targetId)await b.click(byFiber(power.targetId,'enemy'));log.push({power:power.power});await wait(300);continue;}
    await clickIf(b.button('Fermer'));
   }
   if(choice){
    const el=byFiber(choice.instanceId,'card');
    const target=choice.useInked?`[...(${el})?.querySelectorAll('button')??[]].find(e=>e.textContent.toLowerCase().includes('encre'))`:el;
    console.log('Play',s.combat.hand.find(c=>c.instanceId===choice.instanceId)?.definitionId,choice.useInked,choice.targetId);
    await (width>=1024?b.press(target):b.click(target,!choice.useInked));await wait(180);
    if(choice.targetId)await b.click(byFiber(choice.targetId,'enemy'));else await (width>=1024?b.press(target):b.click(target,!choice.useInked));
    await wait(450);if(JSON.stringify((await b.js(stateScript))?.combat)===JSON.stringify(s.combat)){await wait(600);continue;}log.push({card:s.combat.hand.find(c=>c.instanceId===choice.instanceId)?.definitionId,inked:choice.useInked});
   }else{await b.click(b.button('Fin du tour'));await wait(1200);}
   continue;
  }
  if(phase==='RewardScreen'){
   if(await clickIf("[...document.querySelectorAll('button')].find(e=>e.textContent.startsWith('Fermer l'))"))continue;
   const choices=screens.RewardScreen.cardChoices??[];
   if(s.currentRoom===16&&choices.length)log.push({bossRewardFloor:s.floor,cardChoices:[...choices]});
   if(choices.length){const best=choices.sort((a,b)=>scoreCardForBuild(cards.get(b),'ink')-scoreCardForBuild(cards.get(a),'ink'))[0];if(!await clickIf(byText('Choisir cette carte'))){await b.click(byFiber(best,'card'),true);await wait(250);await clickIf(byText('Choisir cette carte'));}}
   else if(screens.RewardScreen.relicChoices?.length){const relic=screens.RewardScreen.relicChoices.find(id=>id.includes('healer'))??screens.RewardScreen.relicChoices[0];await b.click(byFiber(relic,'enemy'));}
   else if(!await clickIf(byText('PV max')))await clickIf(b.button('Passer'));
   continue;
  }
  if(phase==='FloorMap'){
   const expr=`[...document.querySelectorAll('button')].filter(e=>${visible}&&e.title&&!['Voir le deck','Plein ecran','Voir les reliques','Menu'].includes(e.title)).sort((a,b)=>{const score=t=>/repos/i.test(t)?0:/Scriptorium/i.test(t)?1:/Evenement/i.test(t)?2:/Forge/i.test(t)?3:/lite/i.test(t)?9:4;return score(a.title)-score(b.title);})[0]`;
   await b.click(expr);await wait(400);continue;
  }
  if(phase==='SpecialRoomView'){
   if(await b.js("!!document.querySelector('[role=dialog] [data-game-card]')")){await b.click("document.querySelector('[role=dialog] [data-game-card]')",true);await wait(400);continue;}
   if(await clickIf(b.button('Continuer')))continue;
   if(await clickIf(b.button('Soigner')))continue;
   const action=`[...document.querySelectorAll('button')].find(e=>${visible}&&e.textContent.trim()&&!e.title&&!e.getAttribute('aria-label')&&!/^(Menu|Plein ecran|Reliques|GD|Illustration|Lire)/.test(e.textContent.trim()))`;
   if(await clickIf(action)){log.push({event:key,action:true});continue;}
  }
  if(phase==='ShopView'){
   const dialog=await b.js("!!document.querySelector('[role=dialog]')");
   if(dialog){await b.click(byFiber('strike','card'),true);await wait(300);await clickIf(byText('confirmer'));continue;}
   const already=log.some(e=>e.shop===key);
   if(!already){
    if(await clickIf(byText('Acheter'))){log.push({shop:key,purchase:true,goldBefore:s.gold});continue;}
    if(s.playerCurrentHp>50&&!log.some(e=>e.purge)&&await clickIf(byText('Purge de sang'))){log.push({shop:key,purge:true,deckBefore:s.deck.length});continue;}
    log.push({shop:key,noAffordablePurchase:true});
   }
   await b.click(b.button('Quitter la boutique'));await wait(300);continue;
  }
  if(phase==='BiomeSelectScreen'){await b.click("document.querySelector('[data-testid=biome-select-grid] button')");await wait(500);continue;}
  if(phase==='PreBossRoomView'){
   if(!await clickIf(byText('Vasque de restauration')))await clickIf(byText('affronter'));continue;
  }
  throw Error('Unhandled screen '+phase+'\n'+text);
 }
 const s=await b.js(stateScript);fs.writeFileSync(`${root}/05-${name}-result.json`,JSON.stringify({viewport:{width,height},status:s?.status,runId:s?.runId,log,errors:b.errors},null,2));
}catch(e){await shot('failure');console.error(e);console.log(await b.js('document.body.innerText'));process.exitCode=1;}
finally{b.close();}

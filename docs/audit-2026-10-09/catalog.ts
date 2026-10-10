// @ts-nocheck -- read-only audit extraction.
import fs from 'node:fs';
import { allCardDefinitions, enemyDefinitions, relicDefinitions } from '../../src/game/data';
import { getCardArchetypeTags } from '../../src/game/engine/card-archetypes';
import { runConditionDefinitions } from '../../src/game/engine/run-conditions';
import { usableItemDefinitions } from '../../src/game/engine/items';
import { pickEvent } from '../../src/game/engine/run-events';
import { createRNG } from '../../src/game/engine/rng';
const groups=new Map();
for(const c of allCardDefinitions)groups.set(c.id,[...(groups.get(c.id)||[]),c]);
const duplicateIds=[...groups].filter(([id,cs])=>cs.length>1).map(([id,cs])=>({id,definitions:cs.map(c=>({isStarterCard:c.isStarterCard,character:c.characterId,description:c.description,effects:c.effects}))}));
const eventSamples=[0,3,4].map(d=>{const counts={};const rng=createRNG('events-audit');for(let i=0;i<1000;i++){const e=pickEvent(rng,d);counts[e.id]=(counts[e.id]||0)+1;}return {difficulty:d,counts};});
fs.writeFileSync('docs/audit-2026-10-09/content-diagnostics.json',JSON.stringify({uniqueCardIds:groups.size,duplicateIds,conditions:runConditionDefinitions.length,items:usableItemDefinitions.length,eventSamples},null,2));
const csv=(name,rows)=>{const keys=Object.keys(rows[0]);const q=v=>'"'+String(v??'').replaceAll('"','""')+'"';fs.writeFileSync('docs/audit-2026-10-09/'+name,'\ufeff'+[keys.map(q).join(';'),...rows.map(r=>keys.map(k=>q(r[k])).join(';'))].join('\n'));};
csv('cartes.csv',allCardDefinitions.map(c=>({id:c.id,nom:c.name,personnage:c.characterId||'neutre',biome:c.biome,type:c.type,rarete:c.rarity,energie:c.energyCost,encre:c.inkCost,starter:!!c.isStarterCard,collectible:c.isCollectible!==false,tags:getCardArchetypeTags(c).join(','),description:c.description,effets:JSON.stringify(c.effects),variante:JSON.stringify(c.inkedVariant),amelioration:JSON.stringify(c.upgrade)})));
csv('ennemis.csv',enemyDefinitions.map(e=>({id:e.id,nom:e.name,biome:e.biome,boss:e.isBoss,elite:e.isElite,script:!!e.isScriptedOnly,pv:e.maxHp,role:e.role,tier:e.tier,capacites:JSON.stringify(e.abilities)})));
csv('reliques.csv',relicDefinitions.map(r=>({id:r.id,nom:r.name,rarete:r.rarity,boss:r.sourceBossId,tags:r.archetypeTags?.join(','),description:r.description})));
console.log(JSON.stringify({uniqueCardIds:groups.size,duplicateIds,conditions:runConditionDefinitions.length,items:usableItemDefinitions.length},null,2));

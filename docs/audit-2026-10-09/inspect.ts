import fs from 'node:fs';
import { allCardDefinitions, enemyDefinitions, relicDefinitions, allyDefinitions, histoireDefinitions } from '../../src/game/data';
import { computeMetaBonuses } from '../../src/game/engine/meta';
import { getEnemyImageSrc, CARD_IMAGES } from '../../src/lib/assets';
import { getDifficultyModifiers, getDiff0FloorRamp } from '../../src/game/engine/difficulty';
import { createNewRun, advanceFloor } from '../../src/game/engine/run';
import { createRNG } from '../../src/game/engine/rng';
import { characterDefinitions } from '../../src/game/data/characters';
const biomes = [...new Set(enemyDefinitions.map(e=>e.biome))];
const inventory = {
 counts:{cards:allCardDefinitions.length,enemies:enemyDefinitions.length,bosses:enemyDefinitions.filter(e=>e.isBoss).length,elites:enemyDefinitions.filter(e=>e.isElite&&!e.isBoss).length,allies:allyDefinitions.length,relics:relicDefinitions.length,stories:histoireDefinitions.length,cardArt:Object.keys(CARD_IMAGES).length},
 biomes:biomes.map(b=>({biome:b,normal:enemyDefinitions.filter(e=>e.biome===b&&!e.isBoss&&!e.isElite&&!e.isScriptedOnly).length,elites:enemyDefinitions.filter(e=>e.biome===b&&e.isElite&&!e.isBoss).length,bosses:enemyDefinitions.filter(e=>e.biome===b&&e.isBoss).map(e=>({id:e.id,hp:e.maxHp,abilities:e.abilities.map(a=>a.name)}))})),
 missingEnemyArt:enemyDefinitions.filter(e=>!fs.existsSync('public'+getEnemyImageSrc(e.id))).map(e=>({id:e.id,path:getEnemyImageSrc(e.id)})),
 maxRealMeta:computeMetaBonuses(histoireDefinitions.map(h=>h.id)),
 difficulties:[0,1,2,3,4,5].map(d=>({difficulty:d,...getDifficultyModifiers(d)})),
 floorRamp:[1,2,3].map(f=>({floor:f,...getDiff0FloorRamp(f)})),
 starts: characterDefinitions.map(c=>{const rng=createRNG('audit');let run=createNewRun('audit','audit',c.starterDeckIds.map(id=>allCardDefinitions.find(x=>x.id===id)!),rng,undefined,[],undefined,allCardDefinitions);const start=run.unlockedCardIds.length;run={...run,unlockedCardIds:allCardDefinitions.filter(c=>!c.isStarterCard&&c.isCollectible!==false).map(c=>c.id)};const forced=run.unlockedCardIds.length;run=advanceFloor(run,'VIKING',rng,allCardDefinitions);return {character:c.id,inferred:run.characterId,start,forced,afterAdvance:run.unlockedCardIds.length,relics:run.unlockedRelicIds.length};})
};
fs.writeFileSync('docs/audit-2026-10-09/inventory.json',JSON.stringify(inventory,null,2));
console.log(JSON.stringify(inventory,null,2));


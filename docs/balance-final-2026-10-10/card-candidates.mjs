import {writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {allCardDefinitions:cardDefinitions}=require('../../src/game/data/index.ts');
const {buildUpgradedCardDefinition}=require('../../src/game/engine/card-upgrades.ts');
const ids=['heavy_strike','obsidian_jab','tome_strike','hieroglyph_strike','curse_word','venin_du_serpent','mjolnir_echo','sand_whip','gorgons_gaze','oral_history','pharaohs_curse','plague_of_words','sun_ritual','ares_verse','logos_strike','griot_strike','ink_surge'];
writeFileSync('docs/balance-final-2026-10-10/04-candidates.json',JSON.stringify(cardDefinitions.filter(c=>ids.includes(c.id)).map(c=>({id:c.id,name:c.name,character:c.characterId,cost:c.energyCost,rarity:c.rarity,type:c.type,effects:c.effects,ink:c.inkedVariant,A:buildUpgradedCardDefinition(c,'A').effects,B:buildUpgradedCardDefinition(c,'B').effects})),null,2));

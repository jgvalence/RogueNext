// Local visual harness: actual components and combat reducer, no remote API.
// @ts-nocheck
import React from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { i18n } from '../../src/lib/i18n';
import { AntdProvider } from '../../src/components/providers/AntdProvider';
import { GameProvider, useGame } from '../../src/app/game/_providers/game-provider';
import { GameLayout } from '../../src/app/game/_components/shared/GameLayout';
import { CombatView } from '../../src/app/game/_components/combat/CombatView';
import { RunSetupScreen } from '../../src/app/game/_components/run-setup/RunSetupScreen';
import { HomeContent } from '../../src/components/home/HomeContent';
import { FloorMap } from '../../src/app/game/_components/map/FloorMap';
import { SpecialRoomView, EventRoom } from '../../src/app/game/_components/special/SpecialRoomView';
import { EVENTS, createGuaranteedRelicEvent } from '../../src/game/engine/run-events';
import { ShopView } from '../../src/app/game/_components/merchant/ShopView';
import { RogueButton, RogueCard, RogueModal } from '../../src/components/ui/rogue';
import { GameCard } from '../../src/app/game/_components/combat/GameCard';
import { allCardDefinitions, buildCardDefsMap, buildEnemyDefsMap, buildAllyDefsMap } from '../../src/game/data';
import { characterDefinitions } from '../../src/game/data/characters';
import { createNewRun } from '../../src/game/engine/run';
import { initCombat } from '../../src/game/engine/combat';
import { createRNG } from '../../src/game/engine/rng';
globalThis.React = React;
const query = new URLSearchParams(location.search);
const screen = query.get('screen') || 'combat';
const biome = query.get('biome') || 'VIKING';
const characterId = query.get('character') || 'scribe';
const count = Number(query.get('enemies') || 4);
const cardDefs = buildCardDefsMap(), enemyDefs = buildEnemyDefsMap(), allyDefs = buildAllyDefsMap();
const character = characterDefinitions.find(c => c.id === characterId);
const rng = createRNG('visual-polish');
let run = createNewRun('visual', 'visual', character.starterDeckIds.map(id => cardDefs.get(id)), rng, undefined, [], undefined, allCardDefinitions);
run = {...run, characterId, phase:'COMBAT', currentBiome:biome, pendingBiomeChoices:null, selectedDifficultyLevel:0, unlockedCharacterIds:['scribe','bibliothecaire','griot','fou']};
const biomeEnemies = {VIKING:['fenrir','draugr','shield_maiden','draugr'],LIBRARY:['chapter_guardian','ink_slime','paper_golem','quill_sprite'],EGYPTIAN:['ra_avatar','sand_guardian','tomb_priest','mummy_knight'],CELTIC:['dagda_shadow','briar_beast','sidhe_raider','bog_beast']};
let combat = initCombat(run, (query.get('enemyIds')?.split(',').filter(id=>enemyDefs.has(id)) || biomeEnemies[biome] || [...enemyDefs.values()].filter(e=>e.biome===biome).slice(0,4).map(e=>e.id)).slice(0,count), enemyDefs, allyDefs, cardDefs, rng);
combat = {...combat, allies: query.get('allies') === '0' ? [] : [...allyDefs.values()].slice(0,3).map((def,i)=>({instanceId:`ally-${i}`,definitionId:def.id,name:def.name,currentHp:def.maxHp,maxHp:def.maxHp,block:0,speed:def.speed,buffs:[],intentIndex:0})), pendingEnergyDebt:2};
combat.hand = ['strike','defend','ink_surge','poison_herb','star_chart','iron_bard','healing_rhythm','pacte_final'].slice(0,Number(query.get('hand')||5)).map((id,i)=>({instanceId:`visual-card-${i}`,definitionId:id,upgraded:false}));
combat.retainedHandCardIds = [combat.hand[0].instanceId];
run = {...run, combat, phase: ['map','shop','rest','forge','event'].includes(screen) ? 'ROOM_SELECTION' : 'COMBAT'};
const noop = () => {};
function InterfaceGallery() {
  const [open,setOpen] = React.useState(false);
  return <main style={{maxWidth:1080,margin:'auto',padding:24}}>
    <h1 style={{fontFamily:'Georgia',fontSize:30,color:'#efd6a3',marginBottom:20}}>Atelier du Panlibrarium</h1>
    <RogueCard title="Commandes" style={{marginBottom:24}}>
      <div style={{display:'flex',flexWrap:'wrap',gap:12}}>
        <RogueButton type="primary">Continuer</RogueButton>
        <RogueButton>Voir le deck</RogueButton>
        <RogueButton danger>Abandonner</RogueButton>
        <RogueButton disabled>Indisponible</RogueButton>
        <RogueButton loading>Chargement</RogueButton>
        <RogueButton type="text">Retour</RogueButton>
        <RogueButton onClick={()=>setOpen(true)}>Ouvrir le panneau</RogueButton>
      </div>
    </RogueCard>
    <div style={{display:'flex',gap:20,flexWrap:'wrap',justifyContent:'center'}}>
      {['strike','defend','star_chart','pacte_final'].map((id,i)=><GameCard key={id} definition={cardDefs.get(id)} size="lg" scrollable isSelected={i===1} canPlayInked={i===1} upgraded={i===2}/>)}
    </div>
    <RogueModal open={open} title="Le chapitre vous attend" onCancel={()=>setOpen(false)} footer={<RogueButton type="primary" onClick={()=>setOpen(false)}>Continuer</RogueButton>}><p>Consultez vos cartes avant de reprendre votre expédition.</p></RogueModal>
  </main>;
}
function Content() {
  const {state,dispatch} = useGame();
  window.previewState = state;
  const play = (instanceId,targetId,useInked) => dispatch({type:'PLAY_CARD',payload:{instanceId,targetId,useInked}});
  const sharedRoom = {playerCurrentHp:40, playerMaxHp:68, gold:160, deck:state.deck, cardDefs, rng, difficultyLevel:0, runState:state, onHeal:noop, onUpgrade:noop, onHealRoomBloodPurge:noop, onPurgeCard:noop, onEventChoice:noop, onPickCardReward:noop, onEventContinue:noop, onRelicExchange:noop, onSkip:noop};
  const content = screen === 'map' ? <FloorMap map={state.map} currentRoom={0} floor={1} currentBiome={biome} enemyDefs={enemyDefs} onSelectRoom={index=>window.lastMapChoice=index}/> : screen === 'rest' || screen === 'forge' ? <SpecialRoomView {...sharedRoom} forcedRoomType={screen==='rest'?'HEAL':'UPGRADE'}/> : screen === 'event' ? <EventRoom {...sharedRoom} forcedEvent={query.get('event')==='sealed_reliquary'?createGuaranteedRelicEvent():EVENTS.find(e=>e.id===(query.get('event')||'ink_fountain'))}/> : screen === 'interface' ? <InterfaceGallery/> : screen === 'setup' || screen === 'intro' ? <RunSetupScreen runState={state} cardDefs={cardDefs} allyDefs={allyDefs} showFirstRunTutorial={screen === 'intro'} onContinue={noop}/> : screen === 'shop' ? <ShopView floor={1} gold={160} playerCurrentHp={40} relicIds={[]} unlockedCardIds={[...cardDefs.keys()]} unlockedRelicIds={[]} unlockedDifficultyLevelSnapshot={1} selectedDifficultyLevel={0} relicDiscount={0} characterId={characterId} cardDefs={cardDefs} rng={rng} deck={state.deck} usableItems={[]} usableItemCapacity={3} rerollCount={0} allyIds={[]} allySlots={3} onBuy={noop} onReroll={noop} onRemoveCard={noop} onLeave={noop}/> : screen === 'cards' ? <div style={{display:'flex',flexWrap:'wrap',gap:20,padding:30,justifyContent:'center'}}>{['poison_herb','iron_bard','star_chart','healing_rhythm','pacte_final','labyrinth','ink_flow','blood_codex'].map(id=><GameCard key={id} definition={cardDefs.get(id)} size="lg" scrollable />)}</div> : <CombatView combat={state.combat} cardDefs={cardDefs} enemyDefs={enemyDefs} allyDefs={allyDefs} onPlayCard={play} onEndTurn={()=>dispatch({type:'END_TURN'})} onUseItem={noop} onUseInkPower={noop} onResolveHandOverflowExhaust={noop} usableItems={[]} usableItemDefs={new Map()} biome={biome} unlockedInkPowers={character.powers}/>;
  return screen === 'home' ? <HomeContent isSignedIn/> : <GameLayout elapsedMs={82000}>{content}</GameLayout>;
}
createRoot(document.getElementById('root')).render(<I18nextProvider i18n={i18n}><AntdProvider><GameProvider initialState={run} cardDefs={cardDefs} enemyDefs={enemyDefs} allyDefs={allyDefs}><Content/></GameProvider></AntdProvider></I18nextProvider>);

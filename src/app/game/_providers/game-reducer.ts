import type { RunState } from "@/game/schemas/run-state";
import type { CardDefinition } from "@/game/schemas/cards";
import type { EnemyDefinition, AllyDefinition } from "@/game/schemas/entities";
import type {
  InkPowerType,
  BiomeType,
  BiomeResource,
} from "@/game/schemas/enums";
import { GAME_CONSTANTS } from "@/game/constants";
import { createRNG, type RNG } from "@/game/engine/rng";
import { playCard, canPlayCard } from "@/game/engine/cards";
import {
  initCombat,
  startPlayerTurn,
  endPlayerTurn,
  executeAlliesEnemiesTurn,
  checkCombatEnd,
} from "@/game/engine/combat";
import {
  executeAlliesTurn,
  executeOneEnemyTurn,
  finalizeEnemyRound,
} from "@/game/engine/enemies";
import { applyInkPower } from "@/game/engine/ink";
import { synchronizeHydraCombatState } from "@/game/engine/hydra";
import { synchronizeKoscheiCombatState } from "@/game/engine/koschei";
import { synchronizeMedusaCombatState } from "@/game/engine/medusa";
import { synchronizeAnansiCombatState } from "@/game/engine/anansi-weaver";
import { synchronizeCernunnosCombatState } from "@/game/engine/cernunnos-shade";
import { synchronizeDagdaCombatState } from "@/game/engine/dagda-shadow";
import { synchronizeNyarlathotepCombatState } from "@/game/engine/nyarlathotep";
import { synchronizeOsirisCombatState } from "@/game/engine/osiris-judgment";
import { synchronizeQuetzalcoatlCombatState } from "@/game/engine/quetzalcoatl";
import { synchronizeRaCombatState } from "@/game/engine/ra-avatar";
import { synchronizeShubCombatState } from "@/game/engine/shub-spawn";
import { synchronizeSoundiataCombatState } from "@/game/engine/soundiata-spirit";
import { synchronizeTezcatlipocaCombatState } from "@/game/engine/tezcatlipoca";
import {
  addRelicToRunState,
  applyRelicsOnCombatStart,
  applyRelicsOnCardPlayed,
  getRelicExhaustKeepChance,
  setRunRelicFlag,
} from "@/game/engine/relics";
import { drawCards, exhaustCardFromHandForOverflow } from "@/game/engine/deck";
import {
  addInitialCharacterCardUnlocks,
  computeUnlockedCardIds,
  onEnterBiome,
} from "@/game/engine/card-unlocks";
import {
  selectRoom,
  applyDifficultyToRun,
  applyRunConditionToRun,
  completeCombat,
  advanceFloor,
  applyHealRoom,
  applyHealRoomBloodPurge,
  upgradeCardInDeck,
  applyFreeUpgradeInDeck,
  removeCardFromRunDeck,
  applyEventChoice,
  drawStartingUncommonCardChoices,
  type GameEvent,
  getBossRoomIndexForMap,
} from "@/game/engine/run";
import { addCardToRunDeck } from "@/game/engine/rewards";
import {
  applyStartMerchantOffer,
  buyShopItem,
  buyShopReroll,
  completeStartMerchant,
  type ShopItem,
  type StartMerchantOffer,
} from "@/game/engine/merchant";
import { applyUsableItem } from "@/game/engine/items";
import { matchesCardCharacter } from "@/game/engine/card-filters";
import { characterDefinitions, getCharacterById } from "@/game/data/characters";
import { ensureFirstCombatTutorialInkedCardInHand } from "@/game/engine/first-combat-tutorial";
import { applyFirstRunOpeningCombatAdvantage } from "@/game/engine/first-run-script";
import { nanoid } from "nanoid";

function mergeCounts(
  left: Record<string, number>,
  right: Record<string, number>
): Record<string, number> {
  const result = { ...left };
  for (const [key, value] of Object.entries(right)) {
    result[key] = (result[key] ?? 0) + value;
  }
  return result;
}

function incrementCount(
  counts: Record<string, number>,
  key: string
): Record<string, number> {
  return { ...counts, [key]: (counts[key] ?? 0) + 1 };
}

// ============================
// Types
// ============================

export type GameAction =
  | { type: "LOAD_RUN"; payload: RunState }
  | {
      type: "START_COMBAT";
      payload: {
        enemyIds: string[];
        encounterBiomeOverride?: BiomeType;
        encounterBossIdOverride?: string;
      };
    }
  | {
      type: "PLAY_CARD";
      payload: {
        instanceId: string;
        targetId: string | null;
        useInked: boolean;
      };
    }
  | { type: "END_TURN" }
  | {
      type: "SYNC_FIRST_COMBAT_TUTORIAL_STATE";
      payload: {
        ensureInkedCardInHand?: boolean;
        minimumInkCurrent?: number;
      };
    }
  | {
      type: "RESOLVE_HAND_OVERFLOW_EXHAUST";
      payload: { cardInstanceId: string };
    }
  | { type: "FORCE_TUTORIAL_COMBAT_DEFEAT" }
  | {
      type: "USE_USABLE_ITEM";
      payload: { itemInstanceId: string; targetId: string | null };
    }
  | { type: "BEGIN_ENEMY_TURN" }
  | { type: "EXECUTE_ENEMY_STEP"; payload: { enemyInstanceId: string } }
  | { type: "FINALIZE_ENEMY_TURN" }
  | {
      type: "USE_INK_POWER";
      payload: { power: InkPowerType; targetId: string | null };
    }
  | { type: "SELECT_ROOM"; payload: { choiceIndex: number } }
  | { type: "APPLY_DIFFICULTY"; payload: { difficultyLevel: number } }
  | { type: "APPLY_RUN_CONDITION"; payload: { conditionId: string } }
  | { type: "ADD_STARTING_BONUS_CARD"; payload: { definitionId: string } }
  | {
      type: "RECORD_REWARD_OFFER";
      payload: { key: string; cards: string[]; relics: string[] };
    }
  | {
      type: "PICK_CARD_REWARD";
      payload: { definitionId: string; combatReward?: boolean };
    }
  | { type: "SKIP_CARD_REWARD" }
  | {
      type: "COMPLETE_COMBAT";
      payload: {
        goldReward: number;
        biomeResources?: Partial<Record<BiomeResource, number>>;
        usableItemDropDefinitionId?: string | null;
      };
    }
  | {
      type: "PICK_RELIC_REWARD";
      payload: { relicId: string; combatReward?: boolean };
    }
  | { type: "PICK_ALLY_REWARD"; payload: { allyId: string } }
  | { type: "GAIN_MAX_HP"; payload: { amount: number } }
  | { type: "APPLY_HEAL_ROOM" }
  | {
      type: "APPLY_HEAL_ROOM_BLOOD_PURGE";
      payload: { cardInstanceId: string };
    }
  | { type: "ADVANCE_ROOM" }
  | { type: "BUY_SHOP_ITEM"; payload: { item: ShopItem } }
  | { type: "REROLL_SHOP" }
  | { type: "BUY_START_MERCHANT_OFFER"; payload: { offer: StartMerchantOffer } }
  | { type: "COMPLETE_START_MERCHANT" }
  | { type: "DEV_SKIP_TO_BOSS_ROOM" }
  | { type: "CHEAT_KILL_ENEMY"; payload: { enemyInstanceId: string } }
  | {
      type: "UPGRADE_CARD";
      payload: {
        cardInstanceId: string;
        upgradeBranch?: import("@/game/schemas/cards").CardUpgradeBranch;
      };
    }
  | { type: "APPLY_FREE_UPGRADE"; payload: { cardInstanceId: string } }
  | { type: "MARK_FREE_UPGRADE_USED" }
  | { type: "SET_RELIC_RUN_FLAG"; payload: { flag: string; value?: boolean } }
  | { type: "REMOVE_CARD_FROM_DECK"; payload: { cardInstanceId: string } }
  | { type: "APPLY_EVENT"; payload: { event: GameEvent; choiceIndex: number } }
  | { type: "CHOOSE_BIOME"; payload: { biome: BiomeType } }
  | { type: "CHOOSE_CHARACTER"; payload: { characterId: string } }
  | {
      type: "EXCHANGE_RELIC";
      payload: { giveRelicId: string; takeRelicId: string };
    };

interface ReducerDeps {
  cardDefs: Map<string, CardDefinition>;
  enemyDefs: Map<string, EnemyDefinition>;
  allyDefs: Map<string, AllyDefinition>;
  rng: RNG;
}

export function createGameReducer(deps: ReducerDeps) {
  const synchronizeBossStates = (combat: NonNullable<RunState["combat"]>) =>
    synchronizeKoscheiCombatState(
      synchronizeHydraCombatState(
        synchronizeMedusaCombatState(
          synchronizeQuetzalcoatlCombatState(
            synchronizeTezcatlipocaCombatState(
              synchronizeOsirisCombatState(
                synchronizeShubCombatState(
                  synchronizeNyarlathotepCombatState(
                    synchronizeSoundiataCombatState(
                      synchronizeAnansiCombatState(
                        synchronizeCernunnosCombatState(
                          synchronizeDagdaCombatState(
                            synchronizeRaCombatState(combat)
                          )
                        )
                      )
                    )
                  )
                )
              )
            )
          )
        )
      )
    );

  const applySurvivalOnceIfNeeded = (state: RunState, rng: RNG): RunState => {
    if (!state.combat || state.combat.phase !== "COMBAT_LOST") return state;
    if (!state.metaBonuses?.survivalOnce || state.survivalOnceUsed)
      return state;

    const revivedBase = {
      ...state.combat,
      phase: "ALLIES_ENEMIES_TURN" as const,
      player: {
        ...state.combat.player,
        currentHp: 1,
        block: 0,
      },
    };
    const revivedCombat = startPlayerTurn(revivedBase, rng, state.relicIds);
    return {
      ...state,
      survivalOnceUsed: true,
      combat: revivedCombat,
    };
  };

  return function gameReducer(state: RunState, action: GameAction): RunState {
    const { cardDefs, enemyDefs, allyDefs, rng } = deps;

    switch (action.type) {
      case "LOAD_RUN":
        return action.payload;

      case "START_COMBAT": {
        let combat = initCombat(
          state,
          action.payload.enemyIds,
          enemyDefs,
          allyDefs,
          cardDefs,
          rng
        );
        combat = applyRelicsOnCombatStart(combat, state.relicIds, rng);
        combat = synchronizeBossStates(combat);

        // initCombat already drew the initial hand before relics are applied.
        // If relics increased drawCount (e.g. Bookmark), top up opening hand.
        if (combat.hand.length < combat.player.drawCount) {
          combat = drawCards(
            combat,
            combat.player.drawCount - combat.hand.length,
            rng,
            "SYSTEM",
            "COMBAT_START_RELIC_DRAW_TOPUP"
          );
        }

        if (
          state.firstRunScript?.enabled &&
          state.firstRunScript.step === "FIRST_COMBAT" &&
          state.floor === 1 &&
          state.currentRoom === 0
        ) {
          combat = applyFirstRunOpeningCombatAdvantage(combat);
        }

        if (
          action.payload.encounterBiomeOverride ||
          action.payload.encounterBossIdOverride
        ) {
          combat = {
            ...combat,
            encounterContext: {
              biome: action.payload.encounterBiomeOverride,
              bossDefinitionId: action.payload.encounterBossIdOverride,
            },
          };
        }

        return applySurvivalOnceIfNeeded(
          {
            ...state,
            analytics: {
              ...state.analytics,
              combatsStarted: state.analytics.combatsStarted + 1,
              cardlessTurnStarts:
                (state.analytics.cardlessTurnStarts ?? 0) +
                (combat.hand.some((card) =>
                  canPlayCard(combat, card.instanceId, cardDefs)
                )
                  ? 0
                  : 1),
            },
            combat,
          },
          rng
        );
      }

      case "PLAY_CARD": {
        if (!state.combat || state.combat.phase !== "PLAYER_TURN") return state;
        const playedInstance = state.combat.hand.find(
          (c) => c.instanceId === action.payload.instanceId
        );
        const playedCardDef = playedInstance
          ? cardDefs.get(playedInstance.definitionId)
          : undefined;
        let combat = playCard(
          state.combat,
          action.payload.instanceId,
          action.payload.targetId,
          action.payload.useInked,
          cardDefs,
          rng,
          {
            attackBonus: state.metaBonuses?.attackBonus ?? 0,
            exhaustKeepChance:
              (state.metaBonuses?.exhaustKeepChance ?? 0) +
              getRelicExhaustKeepChance(state.relicIds),
          }
        );
        if (playedCardDef && state.relicIds.length > 0) {
          combat = applyRelicsOnCardPlayed(
            combat,
            state.relicIds,
            playedCardDef.type,
            {
              beforeState: state.combat,
              targetId: action.payload.targetId,
              rng,
            }
          );
        }
        combat = synchronizeBossStates(combat);
        combat = checkCombatEnd(combat);
        return applySurvivalOnceIfNeeded({ ...state, combat }, rng);
      }

      case "SYNC_FIRST_COMBAT_TUTORIAL_STATE": {
        if (!state.combat) return state;

        let combat = state.combat;

        if (action.payload.ensureInkedCardInHand) {
          combat = ensureFirstCombatTutorialInkedCardInHand(combat, cardDefs);
        }

        if (action.payload.minimumInkCurrent != null) {
          const minimumInkCurrent = Math.max(
            0,
            Math.floor(action.payload.minimumInkCurrent)
          );
          const nextInkCurrent = Math.min(
            combat.player.inkMax,
            Math.max(combat.player.inkCurrent, minimumInkCurrent)
          );

          if (nextInkCurrent !== combat.player.inkCurrent) {
            combat = {
              ...combat,
              player: {
                ...combat.player,
                inkCurrent: nextInkCurrent,
              },
            };
          }
        }

        if (combat === state.combat) return state;
        return { ...state, combat };
      }

      case "USE_USABLE_ITEM": {
        const next = applyUsableItem(
          state,
          action.payload.itemInstanceId,
          action.payload.targetId,
          rng
        );
        if (next === state) return state;
        return applySurvivalOnceIfNeeded(
          {
            ...next,
            analytics: {
              ...next.analytics,
              usableItemsUsed: next.analytics.usableItemsUsed + 1,
            },
          },
          rng
        );
      }

      case "END_TURN": {
        if (!state.combat || state.combat.phase !== "PLAYER_TURN") return state;
        if ((state.combat.pendingHandOverflowExhaust ?? 0) > 0) return state;
        let combat = endPlayerTurn(state.combat, state.relicIds);
        combat = executeAlliesEnemiesTurn(combat, enemyDefs, allyDefs, rng);

        if (combat.phase !== "COMBAT_WON" && combat.phase !== "COMBAT_LOST") {
          combat = startPlayerTurn(combat, rng, state.relicIds);
        }

        return applySurvivalOnceIfNeeded({ ...state, combat }, rng);
      }

      case "RESOLVE_HAND_OVERFLOW_EXHAUST": {
        if (!state.combat) return state;
        const combat = exhaustCardFromHandForOverflow(
          state.combat,
          action.payload.cardInstanceId
        );
        return { ...state, combat };
      }

      // â”€â”€ Step-by-step enemy turn (for animations) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      case "BEGIN_ENEMY_TURN": {
        if (!state.combat || state.combat.phase !== "PLAYER_TURN") return state;
        let combat = endPlayerTurn(state.combat, state.relicIds);
        // Reset enemy blocks at start of their turn
        combat = {
          ...combat,
          enemies: combat.enemies.map((e) => ({ ...e, block: 0 })),
        };
        combat = executeAlliesTurn(combat, allyDefs, rng);
        combat = checkCombatEnd(combat);
        return applySurvivalOnceIfNeeded({ ...state, combat }, rng);
      }

      case "EXECUTE_ENEMY_STEP": {
        if (!state.combat) return state;
        if (
          state.combat.phase === "COMBAT_WON" ||
          state.combat.phase === "COMBAT_LOST"
        )
          return state;
        const { enemyInstanceId } = action.payload;
        const enemy = state.combat.enemies.find(
          (e) => e.instanceId === enemyInstanceId
        );
        if (!enemy || enemy.currentHp <= 0) return state;
        const def = enemyDefs.get(enemy.definitionId);
        if (!def) return state;
        let combat = executeOneEnemyTurn(
          state.combat,
          enemy,
          def,
          rng,
          enemyDefs
        );
        combat = checkCombatEnd(combat);
        return applySurvivalOnceIfNeeded({ ...state, combat }, rng);
      }

      case "FINALIZE_ENEMY_TURN": {
        if (!state.combat) return state;
        if (
          state.combat.phase === "COMBAT_WON" ||
          state.combat.phase === "COMBAT_LOST"
        )
          return state;
        let combat = finalizeEnemyRound(state.combat);
        combat = checkCombatEnd(combat);
        if (combat.phase !== "COMBAT_WON" && combat.phase !== "COMBAT_LOST") {
          combat = startPlayerTurn(combat, rng, state.relicIds);
          const cardless = !combat.hand.some((card) =>
            canPlayCard(combat!, card.instanceId, cardDefs)
          );
          return applySurvivalOnceIfNeeded(
            {
              ...state,
              combat,
              analytics: {
                ...state.analytics,
                cardlessTurnStarts:
                  (state.analytics.cardlessTurnStarts ?? 0) +
                  (cardless ? 1 : 0),
              },
            },
            rng
          );
        }
        return applySurvivalOnceIfNeeded({ ...state, combat }, rng);
      }

      case "USE_INK_POWER": {
        if (!state.combat || state.combat.phase !== "PLAYER_TURN") return state;
        const combat = applyInkPower(
          state.combat,
          action.payload.power,
          action.payload.targetId,
          cardDefs,
          rng
        );
        return applySurvivalOnceIfNeeded({ ...state, combat }, rng);
      }

      case "SELECT_ROOM":
        if (
          state.firstRunScript?.enabled &&
          state.firstRunScript.step === "MAP_INTRO" &&
          state.floor === 1 &&
          state.currentRoom === 1 &&
          action.payload.choiceIndex !== 2
        ) {
          return state;
        }
        return {
          ...selectRoom(state, action.payload.choiceIndex),
          firstRunScript:
            state.firstRunScript?.enabled &&
            state.firstRunScript.step === "MAP_INTRO" &&
            state.floor === 1 &&
            state.currentRoom === 1 &&
            action.payload.choiceIndex === 2
              ? {
                  ...state.firstRunScript,
                  step: "FORCED_ELITE" as const,
                }
              : state.firstRunScript,
          merchantRerollCount: 0,
        };

      case "APPLY_DIFFICULTY":
        return applyDifficultyToRun(state, action.payload.difficultyLevel);

      case "APPLY_RUN_CONDITION":
        return applyRunConditionToRun(state, action.payload.conditionId, rng, [
          ...cardDefs.values(),
        ]);

      case "COMPLETE_COMBAT": {
        if (!state.combat) return state;
        const combat = state.combat;
        const nextState = completeCombat(
          state,
          combat,
          action.payload.goldReward,
          rng,
          action.payload.biomeResources,
          [...cardDefs.values()],
          state.relicIds,
          action.payload.usableItemDropDefinitionId
        );

        const completedRoom = state.map[state.currentRoom]?.find(
          (room) => room.completed
        );
        const encounterType: "NORMAL" | "ELITE" | "BOSS" =
          state.currentRoom === state.map.length - 1
            ? "BOSS"
            : completedRoom?.isElite
              ? "ELITE"
              : "NORMAL";
        const won = combat.phase === "COMBAT_WON";
        const damageTaken = Math.max(
          0,
          (combat.analyticsStartHp ?? state.playerCurrentHp) -
            combat.player.currentHp
        );
        const analytics = {
          ...nextState.analytics,
          combatsWon: nextState.analytics.combatsWon + (won ? 1 : 0),
          totalTurns:
            nextState.analytics.totalTurns + Math.max(0, combat.turnNumber),
          alliesLost:
            (nextState.analytics.alliesLost ?? 0) +
            combat.allies.filter((ally) => ally.currentHp <= 0).length,
          damageTaken: nextState.analytics.damageTaken + damageTaken,
          inkGenerated:
            nextState.analytics.inkGenerated +
            (combat.analyticsInkGenerated ?? 0),
          inkSpent:
            nextState.analytics.inkSpent + (combat.analyticsInkSpent ?? 0),
          inkedCardsPlayed:
            nextState.analytics.inkedCardsPlayed +
            (combat.analyticsInkedCardsPlayed ?? 0),
          cardPlays: mergeCounts(
            nextState.analytics.cardPlays,
            combat.analyticsCardPlays ?? {}
          ),
          cardModePlays: mergeCounts(
            nextState.analytics.cardModePlays,
            combat.analyticsCardModePlays ?? {}
          ),
          inkPowerUses: mergeCounts(
            nextState.analytics.inkPowerUses,
            combat.analyticsInkPowerUses ?? {}
          ),
          combats: [
            ...nextState.analytics.combats,
            {
              biome: combat.encounterContext?.biome ?? state.currentBiome,
              floor: state.floor,
              room: state.currentRoom,
              encounterType,
              enemyIds: combat.enemies.map((enemy) => enemy.definitionId),
              won,
              turns: Math.max(0, combat.turnNumber),
              hpBefore: combat.analyticsStartHp ?? state.playerCurrentHp,
              hpAfter: combat.player.currentHp,
              damageTaken,
              inkGenerated: combat.analyticsInkGenerated ?? 0,
              inkSpent: combat.analyticsInkSpent ?? 0,
              inkedCardsPlayed: combat.analyticsInkedCardsPlayed ?? 0,
              inkPowerUses: combat.analyticsInkPowerUses ?? {},
              cardModePlays: combat.analyticsCardModePlays ?? {},
            },
          ],
        };
        const nextStateWithAnalytics = { ...nextState, analytics };

        if (
          state.firstRunScript?.enabled &&
          state.firstRunScript.step === "FIRST_COMBAT" &&
          state.floor === 1 &&
          state.currentRoom === 0
        ) {
          return {
            ...nextStateWithAnalytics,
            firstRunScript: {
              ...state.firstRunScript,
              step: "MAP_INTRO",
            },
          };
        }

        return nextStateWithAnalytics;
      }

      // Legacy action retained for old clients; the tutorial is now playable.
      case "FORCE_TUTORIAL_COMBAT_DEFEAT":
        return state;

      case "CHOOSE_CHARACTER": {
        const char = getCharacterById(action.payload.characterId);
        const nextUnlockProgress = onEnterBiome(
          state.cardUnlockProgress ?? {
            enteredBiomes: {},
            biomeRunsCompleted: {},
            eliteKillsByBiome: {},
            bossKillsByBiome: {},
            byCharacter: {},
          },
          state.currentBiome ?? "LIBRARY",
          char.id
        );
        const unlockedCardIds = addInitialCharacterCardUnlocks(
          computeUnlockedCardIds(
            [...cardDefs.values()],
            nextUnlockProgress,
            state.unlockedStoryIdsSnapshot ?? [],
            state.enemyKillCounts ?? {}
          ),
          char.id
        );
        const newDeck = char.starterDeckIds
          .map((id) => cardDefs.get(id))
          .filter((def): def is NonNullable<typeof def> => def != null)
          .map((def) => ({
            instanceId: nanoid(),
            definitionId: def.id,
            upgraded: false,
          }));
        if (state.metaBonuses?.startingRareCard) {
          const rarePool = [...cardDefs.values()].filter(
            (card) =>
              card.rarity === "RARE" &&
              !card.isStarterCard &&
              card.isCollectible !== false &&
              matchesCardCharacter(card, char.id)
          );
          if (rarePool.length > 0) {
            const rareCard = rng.pick(rarePool);
            newDeck.push({
              instanceId: nanoid(),
              definitionId: rareCard.id,
              upgraded: false,
            });
          }
        }
        // Rebuild difficulty levels from the per-character snapshot
        const charDiffMax =
          (
            state.difficultyMaxByCharacter as Record<string, number> | undefined
          )?.[char.id] ?? 0;
        const charDiffLevels = Array.from(
          { length: charDiffMax + 1 },
          (_, idx) => idx
        );
        return {
          ...state,
          characterId: char.id,
          relicIds: [
            ...state.relicIds.filter(
              (relicId) =>
                !characterDefinitions.some(
                  (definition) => definition.starterRelicId === relicId
                )
            ),
            char.starterRelicId,
          ],
          deck: newDeck,
          unlockedCardIds,
          cardUnlockProgress: nextUnlockProgress,
          pendingCharacterChoices: null,
          pendingDifficultyLevels: charDiffLevels,
          selectedDifficultyLevel: null,
          unlockedDifficultyLevelSnapshot: charDiffMax,
        };
      }

      case "CHOOSE_BIOME":
        return advanceFloor(state, action.payload.biome, rng, [
          ...cardDefs.values(),
        ]);

      case "ADD_STARTING_BONUS_CARD": {
        if (
          state.startingBonusCardApplied ||
          !state.metaBonuses?.startingUncommonCardChoice
        ) {
          return state;
        }
        const definition = cardDefs.get(action.payload.definitionId);
        if (
          !definition ||
          definition.rarity !== "UNCOMMON" ||
          definition.isStarterCard ||
          definition.isCollectible === false ||
          !matchesCardCharacter(definition, state.characterId)
        ) {
          return state;
        }
        const availableChoices = drawStartingUncommonCardChoices(
          [...cardDefs.values()],
          createRNG(
            `${state.seed}-starting-uncommon-choice-${state.characterId}`
          ),
          state.characterId,
          state.unlockedCardIds
        );
        if (!availableChoices.some((card) => card.id === definition.id)) {
          return state;
        }
        return {
          ...state,
          startingBonusCardApplied: true,
          deck: [
            ...state.deck,
            {
              instanceId: nanoid(),
              definitionId: definition.id,
              upgraded: false,
            },
          ],
        };
      }

      case "RECORD_REWARD_OFFER": {
        const offers = state.analytics.rewardOffers ?? [];
        if (offers.some((offer) => offer.key === action.payload.key))
          return state;
        return {
          ...state,
          analytics: {
            ...state.analytics,
            rewardOffers: [
              ...offers,
              {
                ...action.payload,
                floor: state.floor,
                room: state.currentRoom,
                chosen: [],
                skipped: false,
              },
            ].slice(-500),
          },
        };
      }

      case "PICK_CARD_REWARD": {
        const next = addCardToRunDeck(state, action.payload.definitionId);
        return {
          ...next,
          analytics: {
            ...next.analytics,
            rewardOffers: action.payload.combatReward
              ? selectOfferedReward(
                  next.analytics.rewardOffers,
                  action.payload.definitionId
                )
              : next.analytics.rewardOffers,
            cardsAdded: incrementCount(
              next.analytics.cardsAdded,
              action.payload.definitionId
            ),
          },
        };
      }

      case "SKIP_CARD_REWARD":
        return {
          ...state,
          analytics: {
            ...state.analytics,
            rewardOffers: selectOfferedReward(
              state.analytics.rewardOffers,
              null
            ),
            cardRewardsSkipped: state.analytics.cardRewardsSkipped + 1,
          },
        };

      case "APPLY_HEAL_ROOM":
        return applyHealRoom(state);

      case "ADVANCE_ROOM":
        return {
          ...state,
          currentRoom: state.currentRoom + 1,
          merchantRerollCount: 0,
        };

      case "BUY_SHOP_ITEM": {
        const result = buyShopItem(state, action.payload.item);
        return result
          ? {
              ...result,
              analytics: {
                ...result.analytics,
                shopPurchases: result.analytics.shopPurchases + 1,
              },
            }
          : state;
      }

      case "REROLL_SHOP": {
        const result = buyShopReroll(state);
        return result
          ? {
              ...result,
              analytics: {
                ...result.analytics,
                shopRerolls: result.analytics.shopRerolls + 1,
              },
            }
          : state;
      }

      case "BUY_START_MERCHANT_OFFER":
        return applyStartMerchantOffer(state, action.payload.offer);

      case "COMPLETE_START_MERCHANT":
        return completeStartMerchant(state);

      case "DEV_SKIP_TO_BOSS_ROOM": {
        if (process.env.NODE_ENV === "production") return state;

        const bossRoomIndex = getBossRoomIndexForMap(state.map);
        if (state.currentRoom >= bossRoomIndex) return state;

        const preBossIndex = Math.max(0, bossRoomIndex - 1);
        const bossSlot = state.map[bossRoomIndex] ?? [];
        const preBossSlot = state.map[preBossIndex] ?? [];
        const targetBossNode = bossSlot[0];
        const targetBossNodeId = targetBossNode
          ? (targetBossNode.nodeId ?? `${targetBossNode.index}-0`)
          : null;
        const matchedPreBossChoiceIndex = preBossSlot.findIndex(
          (node, choiceIndex) => {
            if (!targetBossNodeId) return choiceIndex === 0;
            const nextNodeIds = node.nextNodeIds ?? [];
            return nextNodeIds.length === 0
              ? choiceIndex === 0
              : nextNodeIds.includes(targetBossNodeId);
          }
        );
        const preBossChoiceIndex =
          matchedPreBossChoiceIndex >= 0 ? matchedPreBossChoiceIndex : 0;

        return {
          ...state,
          currentRoom: bossRoomIndex,
          merchantRerollCount: 0,
          map: state.map.map((slot, slotIndex) =>
            slotIndex === preBossIndex
              ? slot.map((node, choiceIndex) => ({
                  ...node,
                  completed: choiceIndex === preBossChoiceIndex,
                }))
              : slot
          ),
        };
      }

      case "CHEAT_KILL_ENEMY": {
        if (process.env.NODE_ENV === "production") return state;
        if (!state.combat) return state;
        if (
          state.combat.phase === "COMBAT_WON" ||
          state.combat.phase === "COMBAT_LOST"
        ) {
          return state;
        }

        const combat = checkCombatEnd({
          ...state.combat,
          enemies: state.combat.enemies.map((enemy) =>
            enemy.instanceId === action.payload.enemyInstanceId
              ? { ...enemy, currentHp: 0, block: 0 }
              : enemy
          ),
        });

        return applySurvivalOnceIfNeeded({ ...state, combat }, rng);
      }

      case "UPGRADE_CARD": {
        const next = upgradeCardInDeck(
          state,
          action.payload.cardInstanceId,
          action.payload.upgradeBranch ?? "A"
        );
        return next === state
          ? state
          : {
              ...next,
              analytics: {
                ...next.analytics,
                cardsUpgraded: next.analytics.cardsUpgraded + 1,
                upgradeBranchChoices: {
                  ...next.analytics.upgradeBranchChoices,
                  [action.payload.upgradeBranch ?? "A"]:
                    (next.analytics.upgradeBranchChoices[
                      action.payload.upgradeBranch ?? "A"
                    ] ?? 0) + 1,
                },
              },
            };
      }

      case "APPLY_FREE_UPGRADE":
        return applyFreeUpgradeInDeck(state, action.payload.cardInstanceId);

      case "MARK_FREE_UPGRADE_USED":
        return { ...state, freeUpgradeUsed: true };

      case "SET_RELIC_RUN_FLAG":
        return setRunRelicFlag(
          state,
          action.payload.flag,
          action.payload.value ?? true
        );

      case "REMOVE_CARD_FROM_DECK": {
        const removedDefinitionId = state.deck.find(
          (card) => card.instanceId === action.payload.cardInstanceId
        )?.definitionId;
        const next = removeCardFromRunDeck(
          state,
          action.payload.cardInstanceId
        );
        return next === state
          ? state
          : {
              ...next,
              analytics: {
                ...next.analytics,
                cardsRemoved: next.analytics.cardsRemoved + 1,
                cardsRemovedById: removedDefinitionId
                  ? {
                      ...next.analytics.cardsRemovedById,
                      [removedDefinitionId]:
                        (next.analytics.cardsRemovedById[removedDefinitionId] ??
                          0) + 1,
                    }
                  : next.analytics.cardsRemovedById,
              },
            };
      }

      case "APPLY_HEAL_ROOM_BLOOD_PURGE":
        return applyHealRoomBloodPurge(state, action.payload.cardInstanceId);

      case "APPLY_EVENT":
        return applyEventChoice(
          state,
          action.payload.event,
          action.payload.choiceIndex
        );

      case "PICK_RELIC_REWARD": {
        const next = addRelicToRunState(state, action.payload.relicId);
        return {
          ...next,
          analytics: {
            ...next.analytics,
            rewardOffers: action.payload.combatReward
              ? selectOfferedReward(
                  next.analytics.rewardOffers,
                  action.payload.relicId
                )
              : next.analytics.rewardOffers,
          },
        };
      }

      case "EXCHANGE_RELIC": {
        const { giveRelicId, takeRelicId } = action.payload;
        if (!state.relicIds.includes(giveRelicId)) return state;
        if (state.relicIds.includes(takeRelicId)) return state;
        const withoutGiven = {
          ...state,
          relicIds: state.relicIds.filter((id) => id !== giveRelicId),
        };
        return addRelicToRunState(withoutGiven, takeRelicId);
      }

      case "GAIN_MAX_HP":
        return {
          ...state,
          playerMaxHp: state.playerMaxHp + action.payload.amount,
          playerCurrentHp: state.playerCurrentHp + action.payload.amount,
        };

      case "PICK_ALLY_REWARD": {
        const maxAllies = Math.min(
          GAME_CONSTANTS.MAX_ALLIES,
          Math.max(0, state.metaBonuses?.allySlots ?? 0)
        );
        if (state.allyIds.includes(action.payload.allyId)) return state;
        if (state.allyIds.length >= maxAllies) return state;
        return {
          ...state,
          allyIds: [...state.allyIds, action.payload.allyId],
        };
      }

      default:
        return state;
    }
  };
}

function selectOfferedReward(
  offers: RunState["analytics"]["rewardOffers"],
  choice: string | null
) {
  return offers?.map((offer, index) =>
    index === offers.length - 1 &&
    (choice === null ||
      offer.cards.includes(choice) ||
      offer.relics.includes(choice))
      ? {
          ...offer,
          chosen: choice
            ? [...new Set([...offer.chosen, choice])]
            : offer.chosen,
          skipped: choice === null,
        }
      : offer
  );
}

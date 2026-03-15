import type {
  CardRedaction,
  CardRedactionType,
  CombatState,
} from "../schemas/combat-state";
import type { CardDefinition, CardInstance } from "../schemas/cards";
import { buildCardDefsMap, buildEnemyDefsMap } from "../data";
import { nanoid } from "nanoid";
import type { RNG } from "./rng";

export const ARCHIVIST_ID = "the_archivist";
export const ARCHIVIST_BLACK_INKWELL_ID = "archivist_black_inkwell";
export const ARCHIVIST_PALE_INKWELL_ID = "archivist_pale_inkwell";

const TEXT_REDACTION_SOURCE_IDS = new Set([ARCHIVIST_PALE_INKWELL_ID]);
const cardDefs = buildCardDefsMap();
const enemyDefs = buildEnemyDefsMap();

function getAllCardInstances(state: CombatState): CardInstance[] {
  return [
    ...state.hand,
    ...state.drawPile,
    ...state.discardPile,
    ...state.exhaustPile,
  ];
}

function isLivingEnemyDefinitionId(
  state: CombatState,
  definitionId: string
): boolean {
  return state.enemies.some(
    (enemy) => enemy.definitionId === definitionId && enemy.currentHp > 0
  );
}

function getLivingInkwellIds(state: CombatState): string[] {
  return [ARCHIVIST_BLACK_INKWELL_ID, ARCHIVIST_PALE_INKWELL_ID].filter((id) =>
    isLivingEnemyDefinitionId(state, id)
  );
}

function reviveArchivistInkwell(
  state: CombatState,
  definitionId: string
): CombatState {
  const existingEnemy = state.enemies.find(
    (enemy) => enemy.definitionId === definitionId
  );
  if (existingEnemy) {
    if (existingEnemy.currentHp > 0) return state;
    return {
      ...state,
      enemies: state.enemies.map((enemy) =>
        enemy.instanceId === existingEnemy.instanceId
          ? {
              ...enemy,
              currentHp: enemy.maxHp,
              block: 0,
              buffs: [],
              mechanicFlags: {},
              intentIndex: 0,
            }
          : enemy
      ),
    };
  }

  if (state.enemies.length >= 4) return state;
  const definition = enemyDefs.get(definitionId);
  if (!definition) return state;

  return {
    ...state,
    enemies: [
      ...state.enemies,
      {
        instanceId: nanoid(),
        definitionId: definition.id,
        name: definition.name,
        isBoss: definition.isBoss,
        isElite: definition.isElite,
        currentHp: definition.maxHp,
        maxHp: definition.maxHp,
        block: 0,
        mechanicFlags: {},
        speed: definition.speed,
        buffs: [],
        intentIndex: 0,
      },
    ],
  };
}

function restoreMissingArchivistInkwells(
  state: CombatState,
  missingDefinitionIds: string[]
): CombatState {
  let current = state;
  for (const definitionId of missingDefinitionIds) {
    current = reviveArchivistInkwell(current, definitionId);
  }
  return current;
}

function getMissingArchivistInkwellIds(state: CombatState): string[] {
  return [ARCHIVIST_BLACK_INKWELL_ID, ARCHIVIST_PALE_INKWELL_ID].filter(
    (definitionId) => !isLivingEnemyDefinitionId(state, definitionId)
  );
}

function restoreOneMissingArchivistInkwell(
  state: CombatState,
  rng: RNG
): CombatState {
  const missingInkwellIds = getMissingArchivistInkwellIds(state);
  if (missingInkwellIds.length === 0) return state;
  return reviveArchivistInkwell(state, rng.pick(missingInkwellIds));
}

function getEffectiveCardEnergyCostForSelection(
  definition: CardDefinition,
  upgraded: boolean
): number {
  if (upgraded && definition.upgrade?.energyCost !== undefined) {
    return definition.upgrade.energyCost;
  }
  return definition.energyCost;
}

function hasRedactionFromSource(
  state: CombatState,
  cardInstanceId: string,
  sourceEnemyDefinitionId: string
): boolean {
  return (state.cardRedactions ?? []).some(
    (redaction) =>
      redaction.cardInstanceId === cardInstanceId &&
      redaction.sourceEnemyDefinitionId === sourceEnemyDefinitionId
  );
}

function countRedactionsFromSource(
  state: CombatState,
  sourceEnemyDefinitionId: string
): number {
  return (state.cardRedactions ?? []).filter(
    (redaction) => redaction.sourceEnemyDefinitionId === sourceEnemyDefinitionId
  ).length;
}

function isNonStatusCard(card: CardInstance): boolean {
  const definition = cardDefs.get(card.definitionId);
  return Boolean(
    definition && definition.type !== "STATUS" && definition.type !== "CURSE"
  );
}

function getRedactionCandidates(
  state: CombatState,
  type: CardRedactionType,
  sourceEnemyDefinitionId: string,
  preferVisibleCard = false
): CardInstance[] {
  const orderedPiles = preferVisibleCard
    ? [state.hand, state.drawPile, state.discardPile, state.exhaustPile]
    : [state.drawPile, state.discardPile, state.hand, state.exhaustPile];
  const flatCards = orderedPiles.flatMap((pile) => pile);
  const withoutSameSource = flatCards.filter(
    (card) =>
      !hasRedactionFromSource(state, card.instanceId, sourceEnemyDefinitionId)
  );
  if (withoutSameSource.length === 0) return [];

  const nonStatusCards = withoutSameSource.filter(isNonStatusCard);
  const basePool =
    nonStatusCards.length > 0 ? nonStatusCards : withoutSameSource;

  if (type === "TEXT") {
    const premiumPool = basePool.filter((card) => {
      const definition = cardDefs.get(card.definitionId);
      return Boolean(definition && (card.upgraded || definition.inkedVariant));
    });
    return premiumPool.length > 0 ? premiumPool : basePool;
  }

  return basePool;
}

function pickRedactionTarget(
  state: CombatState,
  type: CardRedactionType,
  sourceEnemyDefinitionId: string,
  preferVisibleCard = false
): CardInstance | null {
  const candidates = getRedactionCandidates(
    state,
    type,
    sourceEnemyDefinitionId,
    preferVisibleCard
  );
  if (candidates.length === 0) return null;

  return [...candidates].sort((left, right) => {
    const leftDefinition = cardDefs.get(left.definitionId);
    const rightDefinition = cardDefs.get(right.definitionId);
    const leftCost = leftDefinition
      ? getEffectiveCardEnergyCostForSelection(leftDefinition, left.upgraded)
      : 0;
    const rightCost = rightDefinition
      ? getEffectiveCardEnergyCostForSelection(rightDefinition, right.upgraded)
      : 0;
    return rightCost - leftCost;
  })[0]!;
}

function addCardRedaction(
  state: CombatState,
  redaction: CardRedaction
): CombatState {
  return {
    ...state,
    cardRedactions: [...(state.cardRedactions ?? []), redaction],
  };
}

function applyArchivistRedaction(
  state: CombatState,
  sourceEnemyDefinitionId: string,
  type: CardRedactionType,
  preferVisibleCard = false
): CombatState {
  if (!isLivingEnemyDefinitionId(state, sourceEnemyDefinitionId)) return state;
  const targetCard = pickRedactionTarget(
    state,
    type,
    sourceEnemyDefinitionId,
    preferVisibleCard
  );
  if (!targetCard) return state;

  return addCardRedaction(state, {
    cardInstanceId: targetCard.instanceId,
    sourceEnemyDefinitionId,
    type,
  });
}

function hasActiveRedaction(
  state: CombatState,
  cardInstanceId: string,
  predicate: (redaction: CardRedaction) => boolean
): boolean {
  return (state.cardRedactions ?? []).some(
    (redaction) =>
      redaction.cardInstanceId === cardInstanceId && predicate(redaction)
  );
}

export function synchronizeArchivistCombatState(
  state: CombatState
): CombatState {
  const archivistAlive = isLivingEnemyDefinitionId(state, ARCHIVIST_ID);
  let changed = false;
  let nextEnemies = state.enemies;
  let nextRedactions = [...(state.cardRedactions ?? [])];

  if (!archivistAlive) {
    nextEnemies = state.enemies.map((enemy) => {
      if (
        enemy.definitionId !== ARCHIVIST_BLACK_INKWELL_ID &&
        enemy.definitionId !== ARCHIVIST_PALE_INKWELL_ID
      ) {
        return enemy;
      }
      if (enemy.currentHp <= 0 && enemy.block <= 0) return enemy;
      changed = true;
      return {
        ...enemy,
        currentHp: 0,
        block: 0,
      };
    });
    if (nextRedactions.length > 0) {
      nextRedactions = [];
      changed = true;
    }
  } else {
    const livingSourceIds = new Set(getLivingInkwellIds(state));
    const existingCardIds = new Set(
      getAllCardInstances(state).map((card) => card.instanceId)
    );
    const filteredRedactions = nextRedactions.filter(
      (redaction) =>
        livingSourceIds.has(redaction.sourceEnemyDefinitionId) &&
        existingCardIds.has(redaction.cardInstanceId)
    );
    if (filteredRedactions.length !== nextRedactions.length) {
      nextRedactions = filteredRedactions;
      changed = true;
    }
  }

  if (!changed) return state;
  return {
    ...state,
    enemies: nextEnemies,
    cardRedactions: nextRedactions,
  };
}

export function initializeArchivistCombat(state: CombatState): CombatState {
  if (!isLivingEnemyDefinitionId(state, ARCHIVIST_ID)) return state;
  const openingState = synchronizeArchivistCombatState({
    ...state,
    cardRedactions: state.cardRedactions ?? [],
  });
  if ((openingState.cardRedactions?.length ?? 0) > 0) return openingState;
  return applyArchivistRedaction(
    openingState,
    ARCHIVIST_BLACK_INKWELL_ID,
    "COST",
    true
  );
}

export function triggerArchivistPhaseTwo(state: CombatState): CombatState {
  let current = synchronizeArchivistCombatState(state);
  current = restoreMissingArchivistInkwells(
    current,
    getMissingArchivistInkwellIds(current)
  );
  current = applyArchivistRedaction(
    current,
    ARCHIVIST_BLACK_INKWELL_ID,
    "COST"
  );
  current = applyArchivistRedaction(current, ARCHIVIST_PALE_INKWELL_ID, "TEXT");
  return current;
}

export function applyArchivistAbilityMechanics(
  state: CombatState,
  abilityName: string,
  rng: RNG
): CombatState {
  let current = synchronizeArchivistCombatState(state);

  switch (abilityName) {
    case "Ink Erasure":
      return applyArchivistRedaction(
        current,
        ARCHIVIST_BLACK_INKWELL_ID,
        "COST"
      );
    case "Void Library":
      return applyArchivistRedaction(
        current,
        ARCHIVIST_PALE_INKWELL_ID,
        "TEXT"
      );
    case "Corrupted Index": {
      current = restoreOneMissingArchivistInkwell(current, rng);
      const livingSources = getLivingInkwellIds(current);
      if (livingSources.length === 0) return current;

      const minRedactions = Math.min(
        ...livingSources.map((sourceId) =>
          countRedactionsFromSource(current, sourceId)
        )
      );
      const sourcePool = livingSources.filter(
        (sourceId) =>
          countRedactionsFromSource(current, sourceId) === minRedactions
      );
      const pickedSourceId = rng.pick(sourcePool);
      const redactionType =
        pickedSourceId === ARCHIVIST_BLACK_INKWELL_ID ? "COST" : "TEXT";
      return applyArchivistRedaction(current, pickedSourceId, redactionType);
    }
    default:
      return current;
  }
}

export function getArchivistCardCostModifier(
  state: CombatState,
  cardInstanceId: string
): number {
  return hasActiveRedaction(
    state,
    cardInstanceId,
    (redaction) => redaction.type === "COST"
  )
    ? 1
    : 0;
}

export function isArchivistCardTextRedacted(
  state: CombatState,
  cardInstanceId: string
): boolean {
  return hasActiveRedaction(
    state,
    cardInstanceId,
    (redaction) =>
      redaction.type === "TEXT" &&
      TEXT_REDACTION_SOURCE_IDS.has(redaction.sourceEnemyDefinitionId)
  );
}

export function getArchivistEffectiveUpgradeState(
  state: CombatState,
  cardInstanceId: string,
  upgraded: boolean
): boolean {
  return upgraded && !isArchivistCardTextRedacted(state, cardInstanceId);
}

export function getArchivistEffectiveCardDefinition(
  state: CombatState,
  cardInstanceId: string,
  definition: CardDefinition
): CardDefinition {
  if (!isArchivistCardTextRedacted(state, cardInstanceId)) {
    return definition;
  }

  return {
    ...definition,
    inkedVariant: null,
    upgrade: null,
  };
}

import type { CombatState } from "../schemas/combat-state";
import type {
  BuffInstance,
  EnemyAbility,
  EnemyState,
} from "../schemas/entities";
import { getBabaYagaUiState } from "./baba-yaga";
import {
  ARCHIVIST_BLACK_INKWELL_ID,
  ARCHIVIST_PALE_INKWELL_ID,
} from "./archivist";
import { getFenrirHuntDamagePerPip, getFenrirUiState } from "./fenrir";
import {
  canHelQueenReinvokeDraugr,
  getHelQueenDeathCashoutDamage,
  getHelQueenDeathCashoutPerBleed,
  getHelQueenDeathWeak,
  getHelQueenLifeBleed,
  getHelQueenStance,
} from "./hel-queen";
import { getCernunnosUiState } from "./cernunnos-shade";
import { DAGDA_CAULDRON_ID, getDagdaAbilityPreviewState } from "./dagda-shadow";
import { getHydraPendingHeadDefinitionIds } from "./hydra";
import { getKoscheiUiState } from "./koschei";
import { getNyarlathotepUiState } from "./nyarlathotep";
import { getOsirisUiState } from "./osiris-judgment";
import { getQuetzalcoatlPhaseTwoMissBleed } from "./quetzalcoatl";
import { getRaUiState } from "./ra-avatar";
import { SHUB_BROOD_NEST_ID, getShubAbilityPreviewState } from "./shub-spawn";
import { getSoundiataUiState } from "./soundiata-spirit";
import { getAnansiUiState } from "./anansi-weaver";
import { isCurseCardDefinitionId } from "./status-cards";
import { getTezcatlipocaUiState } from "./tezcatlipoca";

export type EnemyIntentDamageBonus =
  | {
      type: "FLAT";
      value: number;
      active: true;
    }
  | {
      type: "PLAYER_DEBUFFED";
      value: number;
      active: boolean;
    }
  | {
      type: "PLAYER_INK_BELOW";
      threshold: number;
      value: number;
      active: boolean;
    }
  | {
      type: "PER_CURSE_CARD";
      valuePerCurse: number;
      curseCount: number;
      totalBonus: number;
      active: true;
    }
  | {
      type: "PER_REMAINING_HUNT";
      valuePerPip: number;
      remainingPips: number;
      maxPips: number;
      totalBonus: number;
      active: boolean;
    }
  | {
      type: "PER_PLAYER_BLEED";
      valuePerBleed: number;
      bleedStacks: number;
      totalBonus: number;
      active: boolean;
    }
  | {
      type: "PER_ANTLER_LAYER";
      valuePerLayer: number;
      antlerLayers: number;
      totalBonus: number;
      active: true;
    };

export type EnemyIntentExtraEffect =
  | {
      source: "ability" | "phase2";
      type: "SUMMON_ENEMY";
      enemyId: string;
    }
  | {
      source: "ability" | "phase2";
      type: "REINVOKE_ENEMY";
      enemyId: string;
    }
  | {
      source: "ability" | "phase2";
      type: "ADD_CARD_TO_DRAW";
      cardId: string;
      value: number;
    }
  | {
      source: "ability" | "phase2";
      type: "ADD_CARD_TO_DISCARD";
      cardId: string;
      value: number;
    }
  | {
      source: "ability" | "phase2";
      type: "HEAL_SELF";
      value: number;
    }
  | {
      source: "ability" | "phase2";
      type: "GAIN_STRENGTH_SELF";
      value: number;
    }
  | {
      source: "ability" | "phase2";
      type: "GAIN_THORNS_SELF";
      value: number;
    }
  | {
      source: "ability" | "phase2";
      type: "GAIN_BLOCK_SELF";
      value: number;
    }
  | {
      source: "ability" | "phase2";
      type: "APPLY_DEBUFF_TO_PLAYER";
      buff: "WEAK" | "VULNERABLE" | "POISON" | "BLEED";
      value: number;
      duration?: number;
    }
  | {
      source: "ability" | "phase2";
      type: "FREEZE_HAND";
      value: number;
    }
  | {
      source: "ability" | "phase2";
      type: "INCREASE_CARD_COST_NEXT_TURN";
      value: number;
    }
  | {
      source: "ability" | "phase2";
      type: "DRAIN_ALL_INK";
    }
  | {
      source: "ability" | "phase2";
      type: "SELF_DAMAGE";
      value: number;
    }
  | {
      source: "ability" | "phase2";
      type: "GAIN_STRENGTH_ALL_ENEMIES";
      value: number;
    }
  | {
      source: "ability" | "phase2";
      type: "GAIN_BLOCK_ALL_ENEMIES";
      value: number;
    }
  | {
      source: "ability" | "phase2";
      type: "GAIN_THORNS_ALL_ENEMIES";
      value: number;
    }
  | {
      source: "ability" | "phase2";
      type: "REDACT_CARD";
      redaction: "COST" | "TEXT" | "COST_OR_TEXT";
      value: number;
    }
  | {
      source: "ability" | "phase2";
      type: "RESTORE_REDACTIONS_ON_DEFEAT";
      redaction: "COST" | "TEXT";
    }
  | {
      source: "ability" | "phase2";
      type: "CASH_OUT_PLAYER_BLEED";
      valuePerBleed: number;
      bleedStacks: number;
      totalDamage: number;
    }
  | {
      source: "ability" | "phase2";
      type: "SET_HUNT_COUNTER";
      value: number;
    }
  | {
      source: "ability" | "phase2";
      type: "ROTATE_STANCE_EVERY_TURN";
    }
  | {
      source: "ability" | "phase2";
      type: "MEDUSA_DOUBLE_PATTERN";
    }
  | {
      source: "ability" | "phase2";
      type: "TEZCATLIPOCA_MIRROR_ECHO";
      family: "ATTACK" | "BLOCK" | "INK" | "HEX";
      value: number;
    }
  | {
      source: "ability" | "phase2";
      type: "TEZCATLIPOCA_DOUBLE_ECHO";
    }
  | {
      source: "ability" | "phase2";
      type: "QUETZALCOATL_FAST_KNOCKDOWN";
      value: number;
    }
  | {
      source: "ability" | "phase2";
      type: "QUETZALCOATL_BLEED_ON_MISS";
      value: number;
    }
  | {
      source: "ability" | "phase2";
      type: "RA_SOLAR_CHARGE";
      value: number;
    }
  | {
      source: "ability" | "phase2";
      type: "RA_ECLIPSE_BARRIER";
    }
  | {
      source: "ability" | "phase2";
      type: "RA_PHASE_TWO_CHARGE_RATE";
      value: number;
    }
  | {
      source: "ability" | "phase2";
      type: "OSIRIS_STRICTER_THRESHOLD";
      value: number;
    }
  | {
      source: "ability" | "phase2";
      type: "SOUNDIATA_DOUBLE_VERSE";
    }
  | {
      source: "ability" | "phase2";
      type: "ANANSI_LOOM_PATTERN";
      pattern: string;
      progress: number;
      length: number;
      phaseTwo: boolean;
    }
  | {
      source: "ability" | "phase2";
      type: "ANANSI_THREE_STEP_PATTERN";
    }
  | {
      source: "ability" | "phase2";
      type: "ANANSI_DOUBLE_OUTCOME";
    }
  | {
      source: "ability" | "phase2";
      type: "NYARLATHOTEP_PROPHECY";
      omen: "DRAW" | "INK" | "ATTACK" | "SKILL";
      cardId: string;
    }
  | {
      source: "ability" | "phase2";
      type: "NYARLATHOTEP_DOUBLE_PROPHECY";
    }
  | {
      source: "ability" | "phase2";
      type: "SHUB_DOUBLE_BROOD";
    }
  | {
      source: "ability" | "phase2";
      type: "DAGDA_FAST_BREW";
    }
  | {
      source: "ability" | "phase2";
      type: "CERNUNNOS_FAST_REGROW";
      value: number;
    };

function countTrackedCurseCards(state: CombatState): number {
  return [
    ...state.hand,
    ...state.drawPile,
    ...state.discardPile,
    ...state.exhaustPile,
  ].filter((card) => isCurseCardDefinitionId(card.definitionId)).length;
}

function hasLivingEnemyDefinitionId(
  state: CombatState,
  definitionId: string
): boolean {
  return state.enemies.some(
    (enemy) => enemy.definitionId === definitionId && enemy.currentHp > 0
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

function getMissingArchivistInkwellIds(state: CombatState): string[] {
  return [ARCHIVIST_BLACK_INKWELL_ID, ARCHIVIST_PALE_INKWELL_ID].filter(
    (definitionId) => !hasLivingEnemyDefinitionId(state, definitionId)
  );
}

function getArchivistRedactionTypeForSource(
  sourceEnemyDefinitionId: string
): "COST" | "TEXT" {
  return sourceEnemyDefinitionId === ARCHIVIST_BLACK_INKWELL_ID
    ? "COST"
    : "TEXT";
}

function getArchivistCorruptedIndexPreviewRedaction(
  state: CombatState
): "COST" | "TEXT" | "COST_OR_TEXT" | null {
  const livingInkwellIds = [
    ARCHIVIST_BLACK_INKWELL_ID,
    ARCHIVIST_PALE_INKWELL_ID,
  ].filter((definitionId) => hasLivingEnemyDefinitionId(state, definitionId));
  const missingInkwellIds = getMissingArchivistInkwellIds(state);

  if (missingInkwellIds.length >= 2 && livingInkwellIds.length === 0) {
    return "COST_OR_TEXT";
  }

  if (livingInkwellIds.length === 1 && missingInkwellIds.length === 1) {
    const livingId = livingInkwellIds[0]!;
    const missingId = missingInkwellIds[0]!;
    const livingCount = countRedactionsFromSource(state, livingId);
    return livingCount > 0
      ? getArchivistRedactionTypeForSource(missingId)
      : "COST_OR_TEXT";
  }

  const blackAlive = livingInkwellIds.includes(ARCHIVIST_BLACK_INKWELL_ID);
  const paleAlive = livingInkwellIds.includes(ARCHIVIST_PALE_INKWELL_ID);
  if (blackAlive && paleAlive) {
    const blackCount = countRedactionsFromSource(
      state,
      ARCHIVIST_BLACK_INKWELL_ID
    );
    const paleCount = countRedactionsFromSource(
      state,
      ARCHIVIST_PALE_INKWELL_ID
    );
    if (blackCount === paleCount) return "COST_OR_TEXT";
    return blackCount < paleCount ? "COST" : "TEXT";
  }
  if (blackAlive) return "COST";
  if (paleAlive) return "TEXT";
  return null;
}

function getArchivistCorruptedIndexPreviewExtras(
  state: CombatState
): EnemyIntentExtraEffect[] {
  const extras: EnemyIntentExtraEffect[] = [];
  const missingInkwellIds = getMissingArchivistInkwellIds(state);

  if (missingInkwellIds.length === 1) {
    extras.push({
      source: "ability",
      type: "REINVOKE_ENEMY",
      enemyId: missingInkwellIds[0]!,
    });
  }

  const redaction = getArchivistCorruptedIndexPreviewRedaction(state);
  if (redaction) {
    extras.push({
      source: "ability",
      type: "REDACT_CARD",
      redaction,
      value: 1,
    });
  }

  return extras;
}

function getArchivistPhaseTwoPreviewRedactions(
  state: CombatState
): EnemyIntentExtraEffect[] {
  const extras: EnemyIntentExtraEffect[] = [];

  if (
    hasLivingEnemyDefinitionId(state, ARCHIVIST_BLACK_INKWELL_ID) ||
    getMissingArchivistInkwellIds(state).includes(ARCHIVIST_BLACK_INKWELL_ID)
  ) {
    extras.push({
      source: "phase2",
      type: "REDACT_CARD",
      redaction: "COST",
      value: 1,
    });
  }
  if (
    hasLivingEnemyDefinitionId(state, ARCHIVIST_PALE_INKWELL_ID) ||
    getMissingArchivistInkwellIds(state).includes(ARCHIVIST_PALE_INKWELL_ID)
  ) {
    extras.push({
      source: "phase2",
      type: "REDACT_CARD",
      redaction: "TEXT",
      value: 1,
    });
  }

  return extras;
}

function getArchivistPhaseTwoPreviewReinvokes(
  state: CombatState
): EnemyIntentExtraEffect[] {
  return getMissingArchivistInkwellIds(state).map((enemyId) => ({
    source: "phase2" as const,
    type: "REINVOKE_ENEMY" as const,
    enemyId,
  }));
}

export function hasPlayerDebuffForEnemyBonus(
  playerBuffs: BuffInstance[]
): boolean {
  return playerBuffs.some(
    (buff) =>
      buff.stacks > 0 &&
      (buff.type === "WEAK" ||
        buff.type === "VULNERABLE" ||
        buff.type === "POISON")
  );
}

export function getBonusDamageIfPlayerDebuffed(
  definitionId: string,
  abilityName: string
): number | null {
  const key = `${definitionId}:${abilityName}`;
  switch (key) {
    case "medusa:Stone Crush":
      return 8;
    case "shub_spawn:Dark Young Stomp":
      return 6;
    case "koschei_deathless:Deathless Blow":
      return 10;
    case "anansi_weaver:Story's End":
      return 8;
    default:
      return null;
  }
}

function getPlayerBleedStacks(state: CombatState): number {
  return (
    state.player.buffs.find((buff) => buff.type === "BLEED" && buff.stacks > 0)
      ?.stacks ?? 0
  );
}

function abilityHasDamageEffect(ability: EnemyAbility): boolean {
  return ability.effects.some(
    (effect) =>
      effect.type === "DAMAGE" || effect.type === "DAMAGE_PER_TARGET_BLOCK"
  );
}

export function getEnemyIntentDamageBonuses(
  state: CombatState,
  enemy: EnemyState,
  ability: EnemyAbility
): EnemyIntentDamageBonus[] {
  const key = `${enemy.definitionId}:${ability.name}`;
  const bonuses: EnemyIntentDamageBonus[] = [];

  if (enemy.definitionId === "ra_avatar" && ability.name === "Divine Scorch") {
    const ra = getRaUiState(enemy);
    if (ra?.judgmentReady) {
      bonuses.push({
        type: "FLAT",
        value: ra.judgmentBonusDamage,
        active: true,
      });
    }
  }

  if (
    enemy.definitionId === "osiris_judgment" &&
    abilityHasDamageEffect(ability)
  ) {
    const osiris = getOsirisUiState(enemy);
    if (osiris?.verdict === "ATTACK") {
      bonuses.push({
        type: "FLAT",
        value: osiris.damageBonus,
        active: true,
      });
    }
  }

  if (enemy.definitionId === "fenrir" && abilityHasDamageEffect(ability)) {
    const fenrir = getFenrirUiState(enemy);
    if (fenrir) {
      bonuses.push({
        type: "PER_REMAINING_HUNT",
        valuePerPip: getFenrirHuntDamagePerPip(),
        remainingPips: fenrir.huntRemaining,
        maxPips: fenrir.huntMax,
        totalBonus: fenrir.damageBonus,
        active: fenrir.huntRemaining > 0,
      });
    }
  }

  if (
    enemy.definitionId === "hel_queen" &&
    getHelQueenStance(enemy) === "DEATH" &&
    abilityHasDamageEffect(ability)
  ) {
    const bleedStacks = getPlayerBleedStacks(state);
    const valuePerBleed = getHelQueenDeathCashoutPerBleed(enemy);
    bonuses.push({
      type: "PER_PLAYER_BLEED",
      valuePerBleed,
      bleedStacks,
      totalBonus: bleedStacks * valuePerBleed,
      active: bleedStacks > 0,
    });
  }

  if (
    enemy.definitionId === "cernunnos_shade" &&
    ability.name === "Ancient Wrath"
  ) {
    const cernunnos = getCernunnosUiState(enemy);
    if (cernunnos) {
      bonuses.push({
        type: "PER_ANTLER_LAYER",
        valuePerLayer: cernunnos.ancientWrathPerLayer,
        antlerLayers: cernunnos.antlerLayers,
        totalBonus: cernunnos.ancientWrathBonus,
        active: true,
      });
    }
  }

  switch (key) {
    case "chapter_guardian:Ink Devour": {
      const curseCount = countTrackedCurseCards(state);
      bonuses.push({
        type: "PER_CURSE_CARD",
        valuePerCurse: 2,
        curseCount,
        totalBonus: curseCount * 2,
        active: true,
      });
      return bonuses;
    }
    case "medusa:Stone Crush":
    case "shub_spawn:Dark Young Stomp":
    case "koschei_deathless:Deathless Blow":
    case "anansi_weaver:Story's End": {
      const value = getBonusDamageIfPlayerDebuffed(
        enemy.definitionId,
        ability.name
      );
      if (value) {
        bonuses.push({
          type: "PLAYER_DEBUFFED",
          value,
          active: hasPlayerDebuffForEnemyBonus(state.player.buffs),
        });
      }
      return bonuses;
    }
    case "the_archivist:Void Library":
      bonuses.push({
        type: "PLAYER_INK_BELOW",
        threshold: 1,
        value: 6,
        active: state.player.inkCurrent <= 1,
      });
      return bonuses;
    default:
      return bonuses;
  }
}

export function getEnemyIntentActiveDamageBonusTotal(
  state: CombatState,
  enemy: EnemyState,
  ability: EnemyAbility
): number {
  return getEnemyIntentDamageBonuses(state, enemy, ability).reduce(
    (total, bonus) => {
      switch (bonus.type) {
        case "FLAT":
        case "PLAYER_DEBUFFED":
        case "PLAYER_INK_BELOW":
          return total + (bonus.active ? bonus.value : 0);
        case "PER_CURSE_CARD":
        case "PER_REMAINING_HUNT":
        case "PER_PLAYER_BLEED":
        case "PER_ANTLER_LAYER":
          return total + bonus.totalBonus;
        default:
          return total;
      }
    },
    0
  );
}

function getFenrirAbilityPreviewExtras(
  state: CombatState,
  enemy: EnemyState,
  ability: EnemyAbility
): EnemyIntentExtraEffect[] {
  if (ability.name !== "Pack Howl") return [];

  const fenrir = getFenrirUiState(enemy);
  if (!fenrir || !fenrir.packHowlPrimed) return [];

  if (state.enemies.length < 4) {
    return [{ source: "ability", type: "SUMMON_ENEMY", enemyId: "draugr" }];
  }

  if (!fenrir.phaseTwo) return [];

  return [
    {
      source: "ability",
      type: "APPLY_DEBUFF_TO_PLAYER",
      buff: "BLEED",
      value: 2,
      duration: 4,
    },
  ];
}

function getHelQueenAbilityPreviewExtras(
  state: CombatState,
  enemy: EnemyState
): EnemyIntentExtraEffect[] {
  if (getHelQueenStance(enemy) === "LIFE") {
    const bleed = getHelQueenLifeBleed(enemy);
    return [
      {
        source: "ability",
        type: "APPLY_DEBUFF_TO_PLAYER",
        buff: "BLEED",
        value: bleed.stacks,
        duration: bleed.duration,
      },
    ];
  }

  const extras: EnemyIntentExtraEffect[] = [];
  const bleedStacks = getPlayerBleedStacks(state);
  const totalDamage = getHelQueenDeathCashoutDamage(state, enemy);

  if (bleedStacks > 0 && totalDamage > 0) {
    extras.push({
      source: "ability",
      type: "CASH_OUT_PLAYER_BLEED",
      valuePerBleed: getHelQueenDeathCashoutPerBleed(enemy),
      bleedStacks,
      totalDamage,
    });
  }

  if (canHelQueenReinvokeDraugr(state)) {
    extras.push({
      source: "ability",
      type: "REINVOKE_ENEMY",
      enemyId: "draugr",
    });
  }

  const deathWeak = getHelQueenDeathWeak(enemy);
  if (deathWeak.stacks > 0) {
    extras.push({
      source: "ability",
      type: "APPLY_DEBUFF_TO_PLAYER",
      buff: "WEAK",
      value: deathWeak.stacks,
      duration: deathWeak.duration,
    });
  }

  return extras;
}

function getBabaYagaAbilityPreviewExtras(
  enemy: EnemyState,
  ability: EnemyAbility
): EnemyIntentExtraEffect[] {
  const extras: EnemyIntentExtraEffect[] = [];

  if (ability.name === "Witchfire") {
    extras.push({
      source: "ability",
      type: "ADD_CARD_TO_DISCARD",
      cardId: "smudged_lens",
      value: 1,
    });
  }
  if (ability.name === "Soul Stew") {
    extras.push({ source: "ability", type: "HEAL_SELF", value: 10 });
  }

  const babaYaga = getBabaYagaUiState(enemy);
  if (!babaYaga || babaYaga.appeased) return extras;
  const punishBlock = babaYaga.phaseTwo ? 12 : 8;
  const punishFreeze = babaYaga.phaseTwo ? 2 : 1;
  const punishStrength = babaYaga.phaseTwo ? 2 : 1;

  switch (babaYaga.face) {
    case "TEETH":
      extras.push({
        source: "ability",
        type: "GAIN_STRENGTH_SELF",
        value: punishStrength,
      });
      return extras;
    case "BONES":
      extras.push({
        source: "ability",
        type: "GAIN_BLOCK_SELF",
        value: punishBlock,
      });
      return extras;
    case "HEARTH":
      extras.push({
        source: "ability",
        type: "FREEZE_HAND",
        value: punishFreeze,
      });
      return extras;
    case "CURSE":
      extras.push({ source: "ability", type: "FREEZE_HAND", value: 2 });
      extras.push({
        source: "ability",
        type: "INCREASE_CARD_COST_NEXT_TURN",
        value: 1,
      });
      return extras;
    default:
      return extras;
  }
}

function getKoscheiAbilityPreviewExtras(
  enemy: EnemyState,
  ability: EnemyAbility
): EnemyIntentExtraEffect[] {
  const extras: EnemyIntentExtraEffect[] = [];
  const koschei = getKoscheiUiState(enemy);

  if (koschei?.resealPending && koschei.currentVesselId) {
    extras.push({
      source: "ability",
      type: "REINVOKE_ENEMY",
      enemyId: koschei.currentVesselId,
    });
  }

  if (ability.name === "Immortal Ward") {
    extras.push({ source: "ability", type: "HEAL_SELF", value: 12 });
  }

  return extras;
}

function getHydraAbilityPreviewExtras(
  enemy: EnemyState
): EnemyIntentExtraEffect[] {
  return getHydraPendingHeadDefinitionIds(enemy).map((enemyId) => ({
    source: "ability" as const,
    type: "SUMMON_ENEMY" as const,
    enemyId,
  }));
}

function getTezcatlipocaAbilityPreviewExtras(
  enemy: EnemyState
): EnemyIntentExtraEffect[] {
  const tezcatlipoca = getTezcatlipocaUiState(enemy);
  if (!tezcatlipoca) return [];

  return tezcatlipoca.slots.map((slot) => ({
    source: "ability" as const,
    type: "TEZCATLIPOCA_MIRROR_ECHO" as const,
    family: slot.family,
    value: slot.value,
  }));
}

function getRaAbilityPreviewExtras(
  enemy: EnemyState,
  ability: EnemyAbility
): EnemyIntentExtraEffect[] {
  const ra = getRaUiState(enemy);
  if (!ra) return [];

  const extras: EnemyIntentExtraEffect[] = [
    {
      source: "ability",
      type: "RA_SOLAR_CHARGE",
      value: ra.chargePerTurn,
    },
  ];

  if (ability.name === "Solar Barrier" && ra.canEclipse) {
    extras.push({ source: "ability", type: "RA_ECLIPSE_BARRIER" });
  }

  if (ability.name === "Divine Scorch" && ra.judgmentReady) {
    extras.push({ source: "ability", type: "DRAIN_ALL_INK" });
  }

  return extras;
}

function getOsirisAbilityPreviewExtras(
  enemy: EnemyState
): EnemyIntentExtraEffect[] {
  const osiris = getOsirisUiState(enemy);
  if (!osiris) return [];

  if (osiris.verdict === "ATTACK") {
    return [
      {
        source: "ability",
        type: "APPLY_DEBUFF_TO_PLAYER",
        buff: "WEAK",
        value: osiris.weakValue,
        duration: 2,
      },
    ];
  }

  if (osiris.verdict === "BLOCK") {
    return [
      {
        source: "ability",
        type: "GAIN_BLOCK_SELF",
        value: osiris.blockBonus,
      },
      {
        source: "ability",
        type: "APPLY_DEBUFF_TO_PLAYER",
        buff: "VULNERABLE",
        value: osiris.vulnerableValue,
        duration: 2,
      },
    ];
  }

  return [];
}

function getSoundiataAbilityPreviewExtras(
  enemy: EnemyState
): EnemyIntentExtraEffect[] {
  const soundiata = getSoundiataUiState(enemy);
  if (!soundiata) return [];

  const extras: EnemyIntentExtraEffect[] = [];

  for (const verse of soundiata.verses) {
    if (verse.interruptProgress >= verse.interruptThreshold) continue;
    if (verse.progress + 1 < verse.length) continue;

    if (verse.chapter === "RALLY") {
      extras.push({
        source: "ability",
        type: "GAIN_STRENGTH_ALL_ENEMIES",
        value: verse.value,
      });
      continue;
    }
    if (verse.chapter === "SHIELD") {
      extras.push({
        source: "ability",
        type: "GAIN_BLOCK_ALL_ENEMIES",
        value: verse.value,
      });
      continue;
    }
    extras.push({
      source: "ability",
      type: "GAIN_THORNS_ALL_ENEMIES",
      value: verse.value,
    });
  }

  return extras;
}

function getAnansiAbilityPreviewExtras(
  state: CombatState,
  enemy: EnemyState
): EnemyIntentExtraEffect[] {
  const anansi = getAnansiUiState(enemy, state);
  if (!anansi || anansi.stalled || anansi.progress >= anansi.length) return [];

  return [
    {
      source: "ability",
      type: "ANANSI_LOOM_PATTERN",
      pattern: anansi.compactLabel,
      progress: anansi.progress,
      length: anansi.length,
      phaseTwo: anansi.phaseTwo,
    },
  ];
}

function getNyarlathotepAbilityPreviewExtras(
  enemy: EnemyState
): EnemyIntentExtraEffect[] {
  const nyarl = getNyarlathotepUiState(enemy);
  if (!nyarl) return [];

  return nyarl.prophecies
    .filter((prophecy) => !prophecy.consumed)
    .map((prophecy) => ({
      source: "ability" as const,
      type: "NYARLATHOTEP_PROPHECY" as const,
      omen: prophecy.omen,
      cardId: prophecy.cardId,
    }));
}

function getShubAbilityPreviewExtras(
  state: CombatState,
  enemy: EnemyState,
  ability: EnemyAbility
): EnemyIntentExtraEffect[] {
  const preview = getShubAbilityPreviewState(state, enemy, ability.name);
  if (!preview) return [];

  const extras: EnemyIntentExtraEffect[] = [];
  for (let index = 0; index < preview.nestSummons; index += 1) {
    extras.push({
      source: "ability",
      type: "SUMMON_ENEMY",
      enemyId: SHUB_BROOD_NEST_ID,
    });
  }
  if (preview.consumeHeal > 0) {
    extras.push({
      source: "ability",
      type: "HEAL_SELF",
      value: preview.consumeHeal,
    });
    extras.push({
      source: "ability",
      type: "APPLY_DEBUFF_TO_PLAYER",
      buff: "POISON",
      value: preview.consumePoison,
    });
  }
  for (let index = 0; index < preview.hatchSummons; index += 1) {
    extras.push({
      source: "ability",
      type: "SUMMON_ENEMY",
      enemyId: "shoggoth_spawn",
    });
  }

  return extras;
}

function getDagdaAbilityPreviewExtras(
  state: CombatState,
  enemy: EnemyState,
  ability: EnemyAbility
): EnemyIntentExtraEffect[] {
  const preview = getDagdaAbilityPreviewState(state, enemy, ability.name);
  if (!preview) return [];

  const extras: EnemyIntentExtraEffect[] = [];
  if (preview.summonsCauldron) {
    extras.push({
      source: "ability",
      type: "SUMMON_ENEMY",
      enemyId: DAGDA_CAULDRON_ID,
    });
  }
  if (!preview.resolvesBrew || !preview.brewType) return extras;

  if (preview.brewType === "FEAST") {
    extras.push({
      source: "ability",
      type: "HEAL_SELF",
      value: preview.feastHeal,
    });
    extras.push({
      source: "ability",
      type: "GAIN_STRENGTH_SELF",
      value: preview.feastStrength,
    });
    return extras;
  }

  for (const cardId of preview.famineCardIds) {
    extras.push({
      source: "ability",
      type: "ADD_CARD_TO_DISCARD",
      cardId,
      value: 1,
    });
  }
  extras.push({
    source: "ability",
    type: "APPLY_DEBUFF_TO_PLAYER",
    buff: "WEAK",
    value: preview.famineWeak,
    duration: preview.famineWeakDuration,
  });
  return extras;
}

export function getEnemyIntentAbilityExtraEffects(
  state: CombatState,
  enemy: EnemyState,
  ability: EnemyAbility
): EnemyIntentExtraEffect[] {
  if (enemy.definitionId === "fenrir") {
    return getFenrirAbilityPreviewExtras(state, enemy, ability);
  }

  if (enemy.definitionId === "hel_queen") {
    return getHelQueenAbilityPreviewExtras(state, enemy);
  }

  if (enemy.definitionId === "baba_yaga_hut") {
    return getBabaYagaAbilityPreviewExtras(enemy, ability);
  }

  if (enemy.definitionId === "koschei_deathless") {
    return getKoscheiAbilityPreviewExtras(enemy, ability);
  }

  if (enemy.definitionId === "hydra_aspect") {
    return getHydraAbilityPreviewExtras(enemy);
  }

  if (enemy.definitionId === "tezcatlipoca_echo") {
    return getTezcatlipocaAbilityPreviewExtras(enemy);
  }

  if (enemy.definitionId === "ra_avatar") {
    return getRaAbilityPreviewExtras(enemy, ability);
  }

  if (enemy.definitionId === "osiris_judgment") {
    return getOsirisAbilityPreviewExtras(enemy);
  }

  if (enemy.definitionId === "soundiata_spirit") {
    return getSoundiataAbilityPreviewExtras(enemy);
  }

  if (enemy.definitionId === "nyarlathotep_shard") {
    return getNyarlathotepAbilityPreviewExtras(enemy);
  }

  if (enemy.definitionId === "shub_spawn") {
    return getShubAbilityPreviewExtras(state, enemy, ability);
  }

  if (enemy.definitionId === "dagda_shadow") {
    return getDagdaAbilityPreviewExtras(state, enemy, ability);
  }

  const passiveExtras =
    enemy.definitionId === "anansi_weaver"
      ? getAnansiAbilityPreviewExtras(state, enemy)
      : [];

  const key = `${enemy.definitionId}:${ability.name}`;

  switch (key) {
    case "chapter_guardian:Page Storm":
      return [
        { source: "ability", type: "SUMMON_ENEMY", enemyId: "ink_slime" },
      ];
    case "medusa:Petrifying Gaze":
      return [
        {
          source: "ability",
          type: "ADD_CARD_TO_DISCARD",
          cardId: "dazed",
          value: 1,
        },
      ];
    case "soundiata_spirit:Epic Command":
      return passiveExtras;
    case "soundiata_spirit:Griot's Shield":
      return passiveExtras;
    case "archivist_black_inkwell:Seal Reservoir":
      return [
        {
          source: "ability",
          type: "RESTORE_REDACTIONS_ON_DEFEAT",
          redaction: "COST",
        },
      ];
    case "archivist_pale_inkwell:Blank Reservoir":
      return [
        {
          source: "ability",
          type: "RESTORE_REDACTIONS_ON_DEFEAT",
          redaction: "TEXT",
        },
      ];
    case "the_archivist:Ink Erasure":
      return hasLivingEnemyDefinitionId(state, ARCHIVIST_BLACK_INKWELL_ID)
        ? [
            {
              source: "ability",
              type: "REDACT_CARD",
              redaction: "COST",
              value: 1,
            },
          ]
        : [];
    case "the_archivist:Corrupted Index":
      return [
        {
          source: "ability",
          type: "ADD_CARD_TO_DRAW",
          cardId: "binding_curse",
          value: 1,
        },
        ...getArchivistCorruptedIndexPreviewExtras(state),
      ];
    case "the_archivist:Void Library":
      return hasLivingEnemyDefinitionId(state, ARCHIVIST_PALE_INKWELL_ID)
        ? [
            {
              source: "ability",
              type: "REDACT_CARD",
              redaction: "TEXT",
              value: 1,
            },
          ]
        : [];
    case "anansi_weaver:Web Trap":
      return [
        ...passiveExtras,
        {
          source: "ability",
          type: "ADD_CARD_TO_DRAW",
          cardId: "hexed_parchment",
          value: 1,
        },
      ];
    default:
      return passiveExtras;
  }
}

export function shouldPreviewEnemyPhaseTwo(enemy: EnemyState): boolean {
  if (enemy.currentHp <= 0) return false;
  if (enemy.currentHp > Math.floor(enemy.maxHp / 2)) return false;

  const phaseKey = `${enemy.definitionId}_phase2`;
  return (enemy.mechanicFlags?.[phaseKey] ?? 0) <= 0;
}

function phaseBuffExtra(
  type: "GAIN_STRENGTH_SELF" | "GAIN_THORNS_SELF",
  value: number
): EnemyIntentExtraEffect {
  return { source: "phase2", type, value };
}

export function getEnemyIntentPendingPhaseExtraEffects(
  state: CombatState,
  enemy: EnemyState
): EnemyIntentExtraEffect[] {
  if (!shouldPreviewEnemyPhaseTwo(enemy)) return [];

  switch (enemy.definitionId) {
    case "chapter_guardian":
      return [
        { source: "phase2", type: "HEAL_SELF", value: 16 },
        phaseBuffExtra("GAIN_STRENGTH_SELF", 2),
        {
          source: "phase2",
          type: "ADD_CARD_TO_DRAW",
          cardId: "haunting_regret",
          value: 1,
        },
        {
          source: "phase2",
          type: "ADD_CARD_TO_DRAW",
          cardId: "binding_curse",
          value: 1,
        },
        {
          source: "phase2",
          type: "INCREASE_CARD_COST_NEXT_TURN",
          value: 1,
        },
      ];
    case "fenrir":
      return [{ source: "phase2", type: "SET_HUNT_COUNTER", value: 4 }];
    case "medusa":
      return [{ source: "phase2", type: "MEDUSA_DOUBLE_PATTERN" }];
    case "ra_avatar":
      return [{ source: "phase2", type: "RA_PHASE_TWO_CHARGE_RATE", value: 2 }];
    case "nyarlathotep_shard":
      return [
        { source: "phase2", type: "SUMMON_ENEMY", enemyId: "void_tendril" },
        { source: "phase2", type: "NYARLATHOTEP_DOUBLE_PROPHECY" },
      ];
    case "tezcatlipoca_echo":
      return [{ source: "phase2", type: "TEZCATLIPOCA_DOUBLE_ECHO" }];
    case "dagda_shadow":
      return [
        ...(hasLivingEnemyDefinitionId(state, DAGDA_CAULDRON_ID)
          ? []
          : [
              {
                source: "phase2" as const,
                type: "SUMMON_ENEMY" as const,
                enemyId: DAGDA_CAULDRON_ID,
              },
            ]),
        { source: "phase2", type: "DAGDA_FAST_BREW" },
      ];
    case "baba_yaga_hut":
      return [
        { source: "phase2", type: "SUMMON_ENEMY", enemyId: "snow_maiden" },
      ];
    case "soundiata_spirit":
      return [
        { source: "phase2", type: "SUMMON_ENEMY", enemyId: "mask_hunter" },
        {
          source: "phase2",
          type: "SOUNDIATA_DOUBLE_VERSE",
        },
      ];
    case "the_archivist":
      return [
        { source: "phase2", type: "HEAL_SELF", value: 12 },
        phaseBuffExtra("GAIN_STRENGTH_SELF", 2),
        ...getArchivistPhaseTwoPreviewReinvokes(state),
        {
          source: "phase2",
          type: "ADD_CARD_TO_DRAW",
          cardId: "binding_curse",
          value: 1,
        },
        ...getArchivistPhaseTwoPreviewRedactions(state),
      ];
    case "hel_queen":
      return [{ source: "phase2", type: "ROTATE_STANCE_EVERY_TURN" }];
    case "hydra_aspect":
      return [
        {
          source: "phase2",
          type: "SUMMON_ENEMY",
          enemyId: "hydra_head_center",
        },
      ];
    case "osiris_judgment":
      return [
        { source: "phase2", type: "OSIRIS_STRICTER_THRESHOLD", value: 5 },
      ];
    case "shub_spawn":
      return [
        { source: "phase2", type: "SUMMON_ENEMY", enemyId: SHUB_BROOD_NEST_ID },
        { source: "phase2", type: "SHUB_DOUBLE_BROOD" },
      ];
    case "quetzalcoatl_wrath":
      return [
        {
          source: "phase2",
          type: "QUETZALCOATL_FAST_KNOCKDOWN",
          value: 2,
        },
        {
          source: "phase2",
          type: "QUETZALCOATL_BLEED_ON_MISS",
          value: getQuetzalcoatlPhaseTwoMissBleed(),
        },
      ];
    case "cernunnos_shade":
      return [
        { source: "phase2", type: "SUMMON_ENEMY", enemyId: "amber_hound" },
        { source: "phase2", type: "CERNUNNOS_FAST_REGROW", value: 2 },
      ];
    case "koschei_deathless":
      return [
        { source: "phase2", type: "SUMMON_ENEMY", enemyId: "koschei_herald" },
        {
          source: "phase2",
          type: "INCREASE_CARD_COST_NEXT_TURN",
          value: 1,
        },
      ];
    case "anansi_weaver":
      return [
        { source: "phase2", type: "ANANSI_THREE_STEP_PATTERN" },
        { source: "phase2", type: "ANANSI_DOUBLE_OUTCOME" },
      ];
    default:
      return [];
  }
}

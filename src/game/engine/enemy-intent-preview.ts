import type { CombatState } from "../schemas/combat-state";
import type {
  BuffInstance,
  EnemyAbility,
  EnemyState,
} from "../schemas/entities";
import {
  ARCHIVIST_BLACK_INKWELL_ID,
  ARCHIVIST_PALE_INKWELL_ID,
} from "./archivist";
import { isCurseCardDefinitionId } from "./status-cards";

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
      type: "REDACT_CARD";
      redaction: "COST" | "TEXT" | "COST_OR_TEXT";
      value: number;
    }
  | {
      source: "ability" | "phase2";
      type: "RESTORE_REDACTIONS_ON_DEFEAT";
      redaction: "COST" | "TEXT";
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
    case "hel_queen:Death's Reckoning":
      return 8;
    case "shub_spawn:Dark Young Stomp":
      return 6;
    case "cernunnos_shade:Ancient Wrath":
      return 6;
    case "koschei_deathless:Deathless Blow":
      return 10;
    case "anansi_weaver:Story's End":
      return 8;
    default:
      return null;
  }
}

export function getEnemyIntentDamageBonuses(
  state: CombatState,
  enemy: EnemyState,
  ability: EnemyAbility
): EnemyIntentDamageBonus[] {
  const key = `${enemy.definitionId}:${ability.name}`;

  switch (key) {
    case "chapter_guardian:Ink Devour": {
      const curseCount = countTrackedCurseCards(state);
      return [
        {
          type: "PER_CURSE_CARD",
          valuePerCurse: 2,
          curseCount,
          totalBonus: curseCount * 2,
          active: true,
        },
      ];
    }
    case "medusa:Stone Crush":
    case "hel_queen:Death's Reckoning":
    case "shub_spawn:Dark Young Stomp":
    case "cernunnos_shade:Ancient Wrath":
    case "koschei_deathless:Deathless Blow":
    case "anansi_weaver:Story's End": {
      const value = getBonusDamageIfPlayerDebuffed(
        enemy.definitionId,
        ability.name
      );
      if (!value) return [];
      return [
        {
          type: "PLAYER_DEBUFFED",
          value,
          active: hasPlayerDebuffForEnemyBonus(state.player.buffs),
        },
      ];
    }
    case "ra_avatar:Divine Scorch":
      return [
        {
          type: "PLAYER_INK_BELOW",
          threshold: 2,
          value: 6,
          active: state.player.inkCurrent <= 2,
        },
      ];
    case "the_archivist:Void Library":
      return [
        {
          type: "PLAYER_INK_BELOW",
          threshold: 1,
          value: 6,
          active: state.player.inkCurrent <= 1,
        },
      ];
    case "osiris_judgment:Soul Drain":
      return [
        {
          type: "PLAYER_INK_BELOW",
          threshold: 2,
          value: 8,
          active: state.player.inkCurrent <= 2,
        },
      ];
    case "tezcatlipoca_echo:Mirror Slash":
      return [{ type: "FLAT", value: 8, active: true }];
    case "quetzalcoatl_wrath:Solar Dive":
      return [{ type: "FLAT", value: 8, active: true }];
    default:
      return [];
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
          return total + bonus.totalBonus;
        default:
          return total;
      }
    },
    0
  );
}

export function getEnemyIntentAbilityExtraEffects(
  state: CombatState,
  enemy: EnemyState,
  ability: EnemyAbility
): EnemyIntentExtraEffect[] {
  const key = `${enemy.definitionId}:${ability.name}`;

  switch (key) {
    case "chapter_guardian:Page Storm":
      return [
        { source: "ability", type: "SUMMON_ENEMY", enemyId: "ink_slime" },
      ];
    case "fenrir:Pack Howl":
      return [{ source: "ability", type: "SUMMON_ENEMY", enemyId: "draugr" }];
    case "fenrir:World's End":
      return [
        {
          source: "ability",
          type: "ADD_CARD_TO_DRAW",
          cardId: "dazed",
          value: 2,
        },
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
    case "ra_avatar:Solar Barrier":
      return [{ source: "ability", type: "HEAL_SELF", value: 10 }];
    case "nyarlathotep_shard:Mad Prophecy":
      return [
        {
          source: "ability",
          type: "ADD_CARD_TO_DRAW",
          cardId: "echo_curse",
          value: 1,
        },
      ];
    case "nyarlathotep_shard:Void Mantle":
      return [
        {
          source: "ability",
          type: "SUMMON_ENEMY",
          enemyId: "cultist_scribe",
        },
      ];
    case "tezcatlipoca_echo:Night Mantle":
      return [{ source: "ability", type: "HEAL_SELF", value: 8 }];
    case "dagda_shadow:Cauldron Steam":
      return [
        {
          source: "ability",
          type: "ADD_CARD_TO_DISCARD",
          cardId: "hexed_parchment",
          value: 1,
        },
      ];
    case "baba_yaga_hut:Witchfire":
      return [
        {
          source: "ability",
          type: "ADD_CARD_TO_DISCARD",
          cardId: "smudged_lens",
          value: 1,
        },
      ];
    case "baba_yaga_hut:Soul Stew":
      return [{ source: "ability", type: "HEAL_SELF", value: 10 }];
    case "soundiata_spirit:Epic Command":
      return [
        {
          source: "ability",
          type: "GAIN_STRENGTH_ALL_ENEMIES",
          value: 1,
        },
      ];
    case "soundiata_spirit:Griot's Shield":
      return [
        {
          source: "ability",
          type: "GAIN_BLOCK_ALL_ENEMIES",
          value: 8,
        },
      ];
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
    case "osiris_judgment:Anubis Seal":
      return [{ source: "ability", type: "HEAL_SELF", value: 12 }];
    case "shub_spawn:Spawn Eruption":
      return [
        {
          source: "ability",
          type: "SUMMON_ENEMY",
          enemyId: "shoggoth_spawn",
        },
      ];
    case "anansi_weaver:Web Trap":
      return [
        {
          source: "ability",
          type: "ADD_CARD_TO_DRAW",
          cardId: "hexed_parchment",
          value: 1,
        },
      ];
    default:
      return [];
  }
}

export function shouldPreviewEnemyPhaseTwo(enemy: EnemyState): boolean {
  if (enemy.currentHp <= 0) return false;
  if (enemy.currentHp > Math.floor(enemy.maxHp / 2)) return false;

  const phaseKey = `${enemy.definitionId}_phase2`;
  return (enemy.mechanicFlags?.[phaseKey] ?? 0) <= 0;
}

function debuffExtra(
  buff: "WEAK" | "VULNERABLE" | "POISON" | "BLEED",
  value: number,
  duration?: number
): EnemyIntentExtraEffect {
  return {
    source: "phase2",
    type: "APPLY_DEBUFF_TO_PLAYER",
    buff,
    value,
    duration,
  };
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
      return [
        { source: "phase2", type: "HEAL_SELF", value: 18 },
        phaseBuffExtra("GAIN_STRENGTH_SELF", 3),
        { source: "phase2", type: "SUMMON_ENEMY", enemyId: "draugr" },
        debuffExtra("BLEED", 3, 4),
      ];
    case "medusa":
      return [
        { source: "phase2", type: "HEAL_SELF", value: 16 },
        phaseBuffExtra("GAIN_STRENGTH_SELF", 2),
        debuffExtra("VULNERABLE", 3, 3),
        debuffExtra("WEAK", 2, 3),
        {
          source: "phase2",
          type: "ADD_CARD_TO_DISCARD",
          cardId: "dazed",
          value: 2,
        },
      ];
    case "ra_avatar":
      return [
        { source: "phase2", type: "HEAL_SELF", value: 20 },
        phaseBuffExtra("GAIN_STRENGTH_SELF", 3),
        { source: "phase2", type: "DRAIN_ALL_INK" },
        debuffExtra("VULNERABLE", 2, 3),
      ];
    case "nyarlathotep_shard":
      return [
        { source: "phase2", type: "HEAL_SELF", value: 15 },
        phaseBuffExtra("GAIN_STRENGTH_SELF", 2),
        { source: "phase2", type: "SUMMON_ENEMY", enemyId: "void_tendril" },
        {
          source: "phase2",
          type: "ADD_CARD_TO_DRAW",
          cardId: "haunting_regret",
          value: 1,
        },
        {
          source: "phase2",
          type: "ADD_CARD_TO_DRAW",
          cardId: "echo_curse",
          value: 1,
        },
        { source: "phase2", type: "FREEZE_HAND", value: 2 },
      ];
    case "tezcatlipoca_echo":
      return [
        { source: "phase2", type: "SELF_DAMAGE", value: 20 },
        phaseBuffExtra("GAIN_STRENGTH_SELF", 6),
        {
          source: "phase2",
          type: "ADD_CARD_TO_DRAW",
          cardId: "ink_burn",
          value: 2,
        },
      ];
    case "dagda_shadow":
      return [
        { source: "phase2", type: "HEAL_SELF", value: 25 },
        phaseBuffExtra("GAIN_STRENGTH_SELF", 2),
        phaseBuffExtra("GAIN_THORNS_SELF", 8),
        {
          source: "phase2",
          type: "ADD_CARD_TO_DISCARD",
          cardId: "hexed_parchment",
          value: 1,
        },
      ];
    case "baba_yaga_hut":
      return [
        { source: "phase2", type: "HEAL_SELF", value: 18 },
        phaseBuffExtra("GAIN_STRENGTH_SELF", 2),
        { source: "phase2", type: "SUMMON_ENEMY", enemyId: "snow_maiden" },
        { source: "phase2", type: "FREEZE_HAND", value: 2 },
      ];
    case "soundiata_spirit":
      return [
        { source: "phase2", type: "HEAL_SELF", value: 18 },
        phaseBuffExtra("GAIN_STRENGTH_SELF", 3),
        { source: "phase2", type: "SUMMON_ENEMY", enemyId: "mask_hunter" },
        {
          source: "phase2",
          type: "GAIN_STRENGTH_ALL_ENEMIES",
          value: 2,
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
      return [
        { source: "phase2", type: "HEAL_SELF", value: 18 },
        phaseBuffExtra("GAIN_STRENGTH_SELF", 3),
        { source: "phase2", type: "SUMMON_ENEMY", enemyId: "draugr" },
        debuffExtra("BLEED", 3, 5),
        debuffExtra("WEAK", 2, 3),
      ];
    case "hydra_aspect":
      return [
        { source: "phase2", type: "HEAL_SELF", value: 15 },
        phaseBuffExtra("GAIN_STRENGTH_SELF", 3),
        { source: "phase2", type: "SUMMON_ENEMY", enemyId: "gorgon" },
        debuffExtra("VULNERABLE", 3, 3),
      ];
    case "osiris_judgment":
      return [
        { source: "phase2", type: "HEAL_SELF", value: 20 },
        phaseBuffExtra("GAIN_STRENGTH_SELF", 3),
        { source: "phase2", type: "DRAIN_ALL_INK" },
        debuffExtra("WEAK", 2, 3),
        debuffExtra("VULNERABLE", 2, 3),
      ];
    case "shub_spawn":
      return [
        { source: "phase2", type: "HEAL_SELF", value: 15 },
        phaseBuffExtra("GAIN_STRENGTH_SELF", 2),
        {
          source: "phase2",
          type: "SUMMON_ENEMY",
          enemyId: "shoggoth_spawn",
        },
        debuffExtra("POISON", 6),
        {
          source: "phase2",
          type: "ADD_CARD_TO_DISCARD",
          cardId: "dazed",
          value: 2,
        },
      ];
    case "quetzalcoatl_wrath":
      return [
        { source: "phase2", type: "HEAL_SELF", value: 15 },
        phaseBuffExtra("GAIN_STRENGTH_SELF", 3),
        debuffExtra("BLEED", 3, 5),
        debuffExtra("VULNERABLE", 2, 3),
        {
          source: "phase2",
          type: "ADD_CARD_TO_DRAW",
          cardId: "ink_burn",
          value: 2,
        },
      ];
    case "cernunnos_shade":
      return [
        { source: "phase2", type: "HEAL_SELF", value: 18 },
        phaseBuffExtra("GAIN_STRENGTH_SELF", 2),
        phaseBuffExtra("GAIN_THORNS_SELF", 10),
        { source: "phase2", type: "SUMMON_ENEMY", enemyId: "amber_hound" },
        debuffExtra("BLEED", 2, 4),
      ];
    case "koschei_deathless":
      return [
        { source: "phase2", type: "HEAL_SELF", value: 30 },
        phaseBuffExtra("GAIN_STRENGTH_SELF", 3),
        { source: "phase2", type: "SUMMON_ENEMY", enemyId: "koschei_herald" },
        {
          source: "phase2",
          type: "INCREASE_CARD_COST_NEXT_TURN",
          value: 2,
        },
      ];
    case "anansi_weaver":
      return [
        { source: "phase2", type: "HEAL_SELF", value: 14 },
        phaseBuffExtra("GAIN_STRENGTH_SELF", 2),
        debuffExtra("WEAK", 2, 3),
        debuffExtra("VULNERABLE", 2, 3),
        { source: "phase2", type: "FREEZE_HAND", value: 2 },
        {
          source: "phase2",
          type: "ADD_CARD_TO_DISCARD",
          cardId: "shrouded_omen",
          value: 1,
        },
        {
          source: "phase2",
          type: "ADD_CARD_TO_DISCARD",
          cardId: "binding_curse",
          value: 1,
        },
      ];
    default:
      return [];
  }
}

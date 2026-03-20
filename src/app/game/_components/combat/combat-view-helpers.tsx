import { type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import type { CombatState } from "@/game/schemas/combat-state";
import type { CardDefinition } from "@/game/schemas/cards";
import type {
  EnemyAbility,
  BuffInstance,
  PlayerState,
} from "@/game/schemas/entities";
import type { Effect } from "@/game/schemas/effects";
import { buffMeta } from "../shared/buff-meta";
import { boostEffectsForUpgrade } from "@/game/engine/card-upgrades";
import {
  calculateDamage,
  computeDamageFromTargetBlock,
} from "@/game/engine/damage";
import { applyBuff } from "@/game/engine/buffs";
import {
  getEnemyIntentAbilityExtraEffects,
  getEnemyIntentActiveDamageBonusTotal,
  getEnemyIntentDamageBonuses,
  getEnemyIntentPendingPhaseExtraEffects,
  type EnemyIntentDamageBonus,
  type EnemyIntentExtraEffect,
} from "@/game/engine/enemy-intent-preview";
import { getBabaYagaUiState } from "@/game/engine/baba-yaga";
import { getChapterGuardianUiState } from "@/game/engine/chapter-guardian";
import { getFenrirUiState } from "@/game/engine/fenrir";
import {
  getHelQueenDeathWeak,
  getHelQueenLifeBleed,
  getHelQueenUiState,
} from "@/game/engine/hel-queen";
import { getHydraUiState } from "@/game/engine/hydra";
import { getKoscheiUiState } from "@/game/engine/koschei";
import { getMedusaUiState } from "@/game/engine/medusa";
import { getAnansiUiState } from "@/game/engine/anansi-weaver";
import { getCernunnosUiState } from "@/game/engine/cernunnos-shade";
import {
  getDagdaCauldronUiState,
  getDagdaUiState,
} from "@/game/engine/dagda-shadow";
import { getNyarlathotepUiState } from "@/game/engine/nyarlathotep";
import { getOsirisUiState } from "@/game/engine/osiris-judgment";
import { getQuetzalcoatlUiState } from "@/game/engine/quetzalcoatl";
import { getRaUiState } from "@/game/engine/ra-avatar";
import { getShubNestUiState, getShubUiState } from "@/game/engine/shub-spawn";
import { getSoundiataUiState } from "@/game/engine/soundiata-spirit";
import { getTezcatlipocaUiState } from "@/game/engine/tezcatlipoca";
import { getCardDefinitionById } from "@/game/data";
import { localizeCardName } from "@/lib/i18n/card-text";
import { localizeEnemyName } from "@/lib/i18n/entity-text";
import { i18n } from "@/lib/i18n";

export interface StatusMarker {
  key: string;
  colorClass: string;
  compactLabel: string;
  symbolLabel: string;
  detailLabel: string;
  detailText?: string;
  pending?: boolean;
}

function renderCompactStatusMarkers(markers: StatusMarker[]): ReactNode {
  if (markers.length === 0) return null;

  const visible = markers.slice(0, 3);
  const remaining = markers.length - visible.length;

  return (
    <>
      {visible.map((marker) => (
        <span
          key={marker.key}
          className={cn(
            "rounded border border-slate-950/60 px-1 py-0.5 text-[9px] font-bold",
            marker.colorClass,
            marker.pending && "border-dashed"
          )}
        >
          {marker.compactLabel}
        </span>
      ))}
      {remaining > 0 && (
        <span className="rounded bg-slate-900/80 px-1 py-0.5 text-[9px] font-bold text-slate-200">
          +{remaining}
        </span>
      )}
    </>
  );
}

function renderStatusMarkerSymbols(markers: StatusMarker[]): ReactNode {
  if (markers.length === 0) return null;

  const visible = markers.slice(0, 4);
  const remaining = markers.length - visible.length;

  return (
    <>
      {visible.map((marker) => (
        <span
          key={`${marker.key}-symbol`}
          className={cn(
            "inline-flex h-4 min-w-4 items-center justify-center rounded-full border border-slate-950/70 px-1 text-[9px] font-black leading-none",
            marker.colorClass,
            marker.pending && "border-dashed"
          )}
        >
          {marker.symbolLabel}
        </span>
      ))}
      {remaining > 0 && (
        <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full border border-slate-900/70 bg-slate-900/85 px-1 text-[9px] font-black text-slate-200">
          +{remaining}
        </span>
      )}
    </>
  );
}

function renderStatusMarkerDetails(markers: StatusMarker[]): ReactNode {
  if (markers.length === 0) return null;

  return (
    <div className="space-y-0.5">
      {markers.map((marker) => (
        <p key={`${marker.key}-detail`} className="text-[11px] text-slate-200">
          <span
            className={cn(
              "rounded px-1 py-px font-semibold",
              marker.colorClass
            )}
          >
            {marker.detailLabel}
          </span>
          {marker.detailText ? ` - ${marker.detailText}` : ""}
        </p>
      ))}
    </div>
  );
}

function formatTurnCounter(duration?: number): string | null {
  if (duration === undefined || duration <= 0) return null;
  return `${duration}t`;
}

function usesDurationAsPrimaryCounter(buff: BuffInstance): boolean {
  return (
    buff.type === "WEAK" ||
    buff.type === "VULNERABLE" ||
    buff.type === "STUN" ||
    buff.type === "STUN_IMMUNITY"
  );
}

function formatCompactBuffCounter(buff: BuffInstance): string | null {
  const turnCounter = formatTurnCounter(buff.duration);

  if (usesDurationAsPrimaryCounter(buff)) {
    return turnCounter ?? (buff.stacks > 1 ? `${buff.stacks}` : null);
  }

  if (turnCounter) {
    return `${buff.stacks}/${turnCounter}`;
  }

  return buff.stacks > 1 ? `${buff.stacks}` : null;
}

function formatSymbolBuffCounter(buff: BuffInstance): string {
  if (usesDurationAsPrimaryCounter(buff)) {
    return buff.duration !== undefined && buff.duration > 0
      ? `${buff.duration}`
      : buff.stacks > 1
        ? `${buff.stacks}`
        : "";
  }

  if (buff.duration !== undefined && buff.duration > 0) {
    return `${buff.stacks}/${buff.duration}`;
  }

  return buff.stacks > 1 ? `${buff.stacks}` : "";
}

function buildBuffStatusMarker(buff: BuffInstance, key: string): StatusMarker {
  const meta = buffMeta[buff.type];
  const label = meta?.label() ?? buff.type;
  const description = meta?.description(buff.stacks) ?? "";
  const shortLabel = label.slice(0, 2).toUpperCase();
  const compactCounter = formatCompactBuffCounter(buff);
  const compactLabel = compactCounter
    ? `${shortLabel} ${compactCounter}`
    : shortLabel;
  const symbolCounter = formatSymbolBuffCounter(buff);
  const symbolLabel = `${getBuffSymbol(buff.type)}${symbolCounter}`;
  const durationLabel = formatTurnCounter(buff.duration);
  const detailParts: string[] = [];

  if (buff.stacks > 1) {
    detailParts.push(`x${buff.stacks}`);
  }
  if (durationLabel) {
    detailParts.push(`(${durationLabel})`);
  }

  const detailLabel = [label, ...detailParts].join(" ");
  const durationNote =
    buff.duration !== undefined && buff.duration > 0
      ? i18n.t("buff.durationNote", { count: buff.duration })
      : "";

  return {
    key,
    colorClass: meta?.color ?? "bg-slate-700 text-slate-200",
    compactLabel,
    symbolLabel,
    detailLabel,
    detailText: [description, durationNote].filter(Boolean).join(" "),
  };
}

function buildBuffStatusMarkers(buffs: BuffInstance[]): StatusMarker[] {
  return buffs.map((buff, index) =>
    buildBuffStatusMarker(buff, `${buff.type}-${index}`)
  );
}

function buildChapterGuardianStatusMarkers(
  enemy: CombatState["enemies"][number]
): StatusMarker[] {
  const guardianState = getChapterGuardianUiState(enemy);
  if (!guardianState) return [];

  const t = i18n.t.bind(i18n);
  const markers: StatusMarker[] = [];

  if (guardianState.open) {
    markers.push({
      key: "chapter-guardian-open",
      colorClass: "bg-emerald-950/85 text-emerald-100",
      compactLabel: "OPEN",
      symbolLabel: "OP",
      detailLabel: t("enemyCard.chapterGuardian.openLabel"),
      detailText: t("enemyCard.chapterGuardian.openDetail", {
        multiplier: guardianState.openChapterDamageMultiplier,
      }),
    });
  }

  if (guardianState.rebindPending) {
    markers.push({
      key: "chapter-guardian-rebind",
      colorClass: "bg-amber-950/85 text-amber-100",
      compactLabel: "REBIND",
      symbolLabel: "RB",
      detailLabel: t("enemyCard.chapterGuardian.rebindLabel"),
      detailText: t("enemyCard.chapterGuardian.rebindDetail"),
    });
  }

  if (guardianState.martialActive) {
    markers.push({
      key: "chapter-guardian-martial",
      colorClass: "bg-rose-950/85 text-rose-100",
      compactLabel: `ATK ${guardianState.martialProgress}/${guardianState.martialThreshold}`,
      symbolLabel: `A${guardianState.martialProgress}/${guardianState.martialThreshold}`,
      detailLabel: t("enemyCard.chapterGuardian.martialLabel"),
      detailText: t("enemyCard.chapterGuardian.martialDetail", {
        progress: guardianState.martialProgress,
        threshold: guardianState.martialThreshold,
        cap: guardianState.damageCap ?? 0,
      }),
    });
  }

  if (guardianState.scriptActive) {
    markers.push({
      key: "chapter-guardian-script",
      colorClass: "bg-blue-950/85 text-blue-100",
      compactLabel: `BLK ${guardianState.scriptProgress}/${guardianState.scriptThreshold}`,
      symbolLabel: `B${guardianState.scriptProgress}/${guardianState.scriptThreshold}`,
      detailLabel: t("enemyCard.chapterGuardian.scriptLabel"),
      detailText: t("enemyCard.chapterGuardian.scriptDetail", {
        progress: guardianState.scriptProgress,
        threshold: guardianState.scriptThreshold,
        punish: guardianState.scriptPunishBlock,
      }),
    });
  }

  if (guardianState.inkActive) {
    const punishCardDefinition = getCardDefinitionById(
      guardianState.inkPunishCardId
    );
    markers.push({
      key: "chapter-guardian-ink",
      colorClass: "bg-cyan-950/85 text-cyan-100",
      compactLabel: `INK ${guardianState.inkProgress}/${guardianState.inkThreshold}`,
      symbolLabel: `I${guardianState.inkProgress}/${guardianState.inkThreshold}`,
      detailLabel: t("enemyCard.chapterGuardian.inkLabel"),
      detailText: t("enemyCard.chapterGuardian.inkDetail", {
        progress: guardianState.inkProgress,
        threshold: guardianState.inkThreshold,
        card: punishCardDefinition
          ? localizeCardName(punishCardDefinition, t as never)
          : guardianState.inkPunishCardId,
      }),
    });
  }

  return markers;
}

function buildFenrirStatusMarkers(
  enemy: CombatState["enemies"][number]
): StatusMarker[] {
  const fenrir = getFenrirUiState(enemy);
  if (!fenrir) return [];

  const t = i18n.t.bind(i18n);
  const detailText =
    fenrir.huntRemaining > 0
      ? t("enemyCard.fenrir.huntDetail", {
          remaining: fenrir.huntRemaining,
          max: fenrir.huntMax,
          bonus: fenrir.damageBonus,
        })
      : t("enemyCard.fenrir.huntBrokenDetail");
  const phaseTwoText =
    fenrir.phaseTwo && fenrir.huntRemaining > 0
      ? ` ${t("enemyCard.fenrir.phaseTwoHowlDetail")}`
      : "";

  return [
    {
      key: "fenrir-hunt",
      colorClass:
        fenrir.huntRemaining > 0
          ? "bg-amber-950/85 text-amber-100"
          : "bg-slate-800/90 text-slate-200",
      compactLabel: `HUNT ${fenrir.huntRemaining}/${fenrir.huntMax}`,
      symbolLabel: `H${fenrir.huntRemaining}/${fenrir.huntMax}`,
      detailLabel: t("enemyCard.fenrir.huntLabel"),
      detailText: `${detailText}${phaseTwoText}`,
    },
  ];
}

function buildHelQueenStatusMarkers(
  enemy: CombatState["enemies"][number]
): StatusMarker[] {
  const hel = getHelQueenUiState(enemy);
  if (!hel) return [];

  const t = i18n.t.bind(i18n);
  const lifeBleed = getHelQueenLifeBleed(enemy);
  const deathWeak = getHelQueenDeathWeak(enemy);
  const isLife = hel.stance === "LIFE";
  const nextStanceLabel = t(
    hel.nextStance === "LIFE"
      ? "enemyCard.helQueen.lifeLabel"
      : "enemyCard.helQueen.deathLabel"
  );

  return [
    {
      key: "hel-queen-stance",
      colorClass: isLife
        ? "bg-emerald-950/85 text-emerald-100"
        : "bg-slate-900/90 text-rose-100",
      compactLabel: `${hel.stance} ${hel.turnsUntilSwap}`,
      symbolLabel: `${isLife ? "L" : "D"}${hel.turnsUntilSwap}`,
      detailLabel: isLife
        ? t("enemyCard.helQueen.lifeLabel")
        : t("enemyCard.helQueen.deathLabel"),
      detailText: isLife
        ? t("enemyCard.helQueen.lifeDetail", {
            bleed: lifeBleed.stacks,
            next: nextStanceLabel,
            turns: hel.turnsUntilSwap,
          })
        : t(
            deathWeak.stacks > 0
              ? "enemyCard.helQueen.deathPhaseTwoDetail"
              : "enemyCard.helQueen.deathDetail",
            {
              weak: deathWeak.stacks,
              next: nextStanceLabel,
              turns: hel.turnsUntilSwap,
            }
          ),
    },
  ];
}

function getBabaYagaFaceLabelKey(face: string): string {
  switch (face) {
    case "BONES":
      return "enemyCard.babaYaga.bonesLabel";
    case "HEARTH":
      return "enemyCard.babaYaga.hearthLabel";
    case "CURSE":
      return "enemyCard.babaYaga.curseLabel";
    default:
      return "enemyCard.babaYaga.teethLabel";
  }
}

function buildBabaYagaStatusMarkers(
  enemy: CombatState["enemies"][number]
): StatusMarker[] {
  const babaYaga = getBabaYagaUiState(enemy);
  if (!babaYaga) return [];

  const t = i18n.t.bind(i18n);
  const nextFaceLabel = t(getBabaYagaFaceLabelKey(babaYaga.nextFace));

  switch (babaYaga.face) {
    case "TEETH":
      return [
        {
          key: "baba-yaga-teeth",
          colorClass: "bg-amber-950/85 text-amber-100",
          compactLabel: `TEETH ${babaYaga.attackProgress}/${babaYaga.attackThreshold}`,
          symbolLabel: `T${babaYaga.attackProgress}/${babaYaga.attackThreshold}`,
          detailLabel: t("enemyCard.babaYaga.teethLabel"),
          detailText: t("enemyCard.babaYaga.teethDetail", {
            progress: babaYaga.attackProgress,
            threshold: babaYaga.attackThreshold,
            next: nextFaceLabel,
            turns: babaYaga.turnsUntilRotate,
          }),
        },
      ];
    case "BONES":
      return [
        {
          key: "baba-yaga-bones",
          colorClass: "bg-stone-900/90 text-stone-100",
          compactLabel: `BONES ${babaYaga.blockProgress}/${babaYaga.blockThreshold}`,
          symbolLabel: `B${babaYaga.blockProgress}/${babaYaga.blockThreshold}`,
          detailLabel: t("enemyCard.babaYaga.bonesLabel"),
          detailText: t("enemyCard.babaYaga.bonesDetail", {
            progress: babaYaga.blockProgress,
            threshold: babaYaga.blockThreshold,
            next: nextFaceLabel,
            turns: babaYaga.turnsUntilRotate,
          }),
        },
      ];
    case "HEARTH":
      return [
        {
          key: "baba-yaga-hearth",
          colorClass: "bg-cyan-950/85 text-cyan-100",
          compactLabel: `HEARTH ${babaYaga.inkProgress}/${babaYaga.inkThreshold}`,
          symbolLabel: `H${babaYaga.inkProgress}/${babaYaga.inkThreshold}`,
          detailLabel: t("enemyCard.babaYaga.hearthLabel"),
          detailText: t("enemyCard.babaYaga.hearthDetail", {
            progress: babaYaga.inkProgress,
            threshold: babaYaga.inkThreshold,
            next: nextFaceLabel,
            turns: babaYaga.turnsUntilRotate,
          }),
        },
      ];
    case "CURSE":
      return [
        {
          key: "baba-yaga-curse",
          colorClass: "bg-purple-950/85 text-purple-100",
          compactLabel: `CURSE ${babaYaga.curseSatisfiedCount}/${babaYaga.curseRequirementCount}`,
          symbolLabel: `C${babaYaga.curseSatisfiedCount}/${babaYaga.curseRequirementCount}`,
          detailLabel: t("enemyCard.babaYaga.curseLabel"),
          detailText: t("enemyCard.babaYaga.curseDetail", {
            attacks: babaYaga.attackProgress,
            block: babaYaga.blockProgress,
            ink: babaYaga.inkProgress,
            next: nextFaceLabel,
            turns: babaYaga.turnsUntilRotate,
          }),
        },
      ];
    default:
      return [];
  }
}

function buildKoscheiStatusMarkers(
  enemy: CombatState["enemies"][number]
): StatusMarker[] {
  const koschei = getKoscheiUiState(enemy);
  if (!koschei) return [];

  const t = i18n.t.bind(i18n);

  if (koschei.mortal) {
    return [
      {
        key: "koschei-mortal",
        colorClass: "bg-emerald-950/85 text-emerald-100",
        compactLabel: "MORTAL",
        symbolLabel: "MO",
        detailLabel: t("enemyCard.koschei.mortalLabel"),
        detailText: t("enemyCard.koschei.mortalDetail"),
      },
    ];
  }

  const vesselLabel = koschei.currentVesselId
    ? localizeEnemyName(
        koschei.currentVesselId,
        formatIntentFallbackLabel(koschei.currentVesselId)
      )
    : t("enemyCard.koschei.hiddenDeathLabel");
  const detailText = koschei.resealPending
    ? t("enemyCard.koschei.resealDetail", { vessel: vesselLabel })
    : koschei.phaseTwo && !koschei.resealUsed
      ? t("enemyCard.koschei.stagePhaseTwoDetail", { vessel: vesselLabel })
      : t("enemyCard.koschei.stageDetail", { vessel: vesselLabel });
  const compactStage =
    koschei.stage === "CHEST"
      ? "CHEST"
      : koschei.stage === "EGG"
        ? "EGG"
        : "NEEDLE";
  const symbolStage =
    koschei.stage === "CHEST" ? "C" : koschei.stage === "EGG" ? "E" : "N";

  return [
    {
      key: "koschei-immortal",
      colorClass: "bg-slate-900/90 text-amber-100",
      compactLabel: `IMM ${compactStage}`,
      symbolLabel: `I${symbolStage}`,
      detailLabel: t("enemyCard.koschei.immortalLabel"),
      detailText,
    },
  ];
}

function buildTezcatlipocaStatusMarkers(
  enemy: CombatState["enemies"][number]
): StatusMarker[] {
  const tezcatlipoca = getTezcatlipocaUiState(enemy);
  if (!tezcatlipoca) return [];

  const t = i18n.t.bind(i18n);

  return tezcatlipoca.slots.map((slot, index) => {
    const compactFamily =
      slot.family === "ATTACK"
        ? "ATK"
        : slot.family === "BLOCK"
          ? "BLK"
          : slot.family === "INK"
            ? "INK"
            : "HEX";
    const colorClass =
      slot.family === "ATTACK"
        ? "bg-red-950/85 text-red-100"
        : slot.family === "BLOCK"
          ? "bg-blue-950/85 text-blue-100"
          : slot.family === "INK"
            ? "bg-cyan-950/85 text-cyan-100"
            : "bg-stone-900/90 text-stone-100";
    const detailText =
      slot.family === "ATTACK"
        ? t("enemyCard.tezcatlipoca.attackDetail", { value: slot.value })
        : slot.family === "BLOCK"
          ? t("enemyCard.tezcatlipoca.blockDetail", { value: slot.value })
          : slot.family === "INK"
            ? t("enemyCard.tezcatlipoca.inkDetail", {
                value: Math.max(1, Math.ceil(slot.value / 4)),
              })
            : t("enemyCard.tezcatlipoca.hexDetail", {
                value: slot.value >= 10 ? 2 : 1,
              });

    return {
      key: `tezcatlipoca-slot-${index}`,
      colorClass,
      compactLabel: `MIRROR ${compactFamily} ${slot.value}`,
      symbolLabel: `M${index + 1}`,
      detailLabel: t("enemyCard.tezcatlipoca.mirrorLabel"),
      detailText,
    };
  });
}

function buildRaStatusMarkers(
  enemy: CombatState["enemies"][number]
): StatusMarker[] {
  const ra = getRaUiState(enemy);
  if (!ra) return [];

  const t = i18n.t.bind(i18n);
  const markers: StatusMarker[] = [
    {
      key: "ra-sun",
      colorClass: ra.judgmentReady
        ? "bg-amber-950/85 text-amber-100"
        : "bg-orange-950/85 text-orange-100",
      compactLabel: `SUN ${ra.charge}/${ra.chargeMax}`,
      symbolLabel: `S${ra.charge}`,
      detailLabel: t("enemyCard.ra.sunLabel"),
      detailText: ra.judgmentReady
        ? t("enemyCard.ra.sunReadyDetail", {
            bonus: ra.judgmentBonusDamage,
          })
        : t("enemyCard.ra.sunDetail", {
            charge: ra.charge,
            max: ra.chargeMax,
            value: ra.chargePerTurn,
          }),
    },
  ];

  if (ra.canEclipse) {
    markers.push({
      key: "ra-eclipse",
      colorClass: "bg-slate-900/90 text-slate-100",
      compactLabel: "ECLIPSE",
      symbolLabel: "EC",
      detailLabel: t("enemyCard.ra.eclipseLabel"),
      detailText: t("enemyCard.ra.eclipseDetail"),
    });
  }

  return markers;
}

function buildOsirisStatusMarkers(
  enemy: CombatState["enemies"][number]
): StatusMarker[] {
  const osiris = getOsirisUiState(enemy);
  if (!osiris) return [];

  const t = i18n.t.bind(i18n);
  const markers: StatusMarker[] = [
    {
      key: "osiris-scales",
      colorClass:
        osiris.verdict === "ATTACK"
          ? "bg-rose-950/85 text-rose-100"
          : osiris.verdict === "BLOCK"
            ? "bg-blue-950/85 text-blue-100"
            : "bg-stone-900/90 text-stone-100",
      compactLabel: `MAAT ${osiris.damageDealt}/${osiris.blockGained}`,
      symbolLabel: `M${osiris.damageDealt}/${osiris.blockGained}`,
      detailLabel: t("enemyCard.osiris.scalesLabel"),
      detailText:
        osiris.verdict === "ATTACK"
          ? t("enemyCard.osiris.attackVerdictDetail", {
              damage: osiris.damageDealt,
              block: osiris.blockGained,
              bonus: osiris.damageBonus,
              weak: osiris.weakValue,
            })
          : osiris.verdict === "BLOCK"
            ? t("enemyCard.osiris.blockVerdictDetail", {
                damage: osiris.damageDealt,
                block: osiris.blockGained,
                bonus: osiris.blockBonus,
                vulnerable: osiris.vulnerableValue,
              })
            : t("enemyCard.osiris.balancedDetail", {
                damage: osiris.damageDealt,
                block: osiris.blockGained,
                threshold: osiris.threshold,
              }),
    },
  ];

  if (osiris.verdict !== "BALANCED") {
    markers.push({
      key: "osiris-verdict",
      colorClass:
        osiris.verdict === "ATTACK"
          ? "bg-rose-950/85 text-rose-100"
          : "bg-blue-950/85 text-blue-100",
      compactLabel: osiris.verdict === "ATTACK" ? "VERDICT ATK" : "VERDICT BLK",
      symbolLabel: osiris.verdict === "ATTACK" ? "VA" : "VB",
      detailLabel:
        osiris.verdict === "ATTACK"
          ? t("enemyCard.osiris.attackVerdictLabel")
          : t("enemyCard.osiris.blockVerdictLabel"),
      detailText:
        osiris.verdict === "ATTACK"
          ? t("enemyCard.osiris.attackVerdictShort", {
              bonus: osiris.damageBonus,
              weak: osiris.weakValue,
            })
          : t("enemyCard.osiris.blockVerdictShort", {
              bonus: osiris.blockBonus,
              vulnerable: osiris.vulnerableValue,
            }),
    });
  }

  return markers;
}

function buildDagdaStatusMarkers(
  enemy: CombatState["enemies"][number]
): StatusMarker[] {
  const dagda = getDagdaUiState(enemy);
  if (dagda) {
    const t = i18n.t.bind(i18n);
    if (!dagda.cauldronPresent) {
      return [
        {
          key: "dagda-cauldron-down",
          colorClass: "bg-stone-900/90 text-stone-100",
          compactLabel: "CAULDRON DOWN",
          symbolLabel: "CD",
          detailLabel: t("enemyCard.dagda.cauldronDownLabel"),
          detailText: t("enemyCard.dagda.cauldronDownDetail"),
        },
      ];
    }

    const famineCards = dagda.famineCardIds
      .map((cardId) => getLocalizedIntentCardName(cardId, t))
      .join(", ");
    return [
      {
        key: "dagda-brew",
        colorClass:
          dagda.brewType === "FEAST"
            ? "bg-emerald-950/85 text-emerald-100"
            : "bg-stone-900/90 text-amber-100",
        compactLabel: `BREW ${dagda.brewType} ${dagda.progress}/${dagda.length}`,
        symbolLabel: `${dagda.brewType === "FEAST" ? "F" : "M"}${dagda.progress}`,
        detailLabel: t("enemyCard.dagda.brewLabel"),
        detailText:
          dagda.brewType === "FEAST"
            ? t("enemyCard.dagda.feastDetail", {
                progress: dagda.progress,
                length: dagda.length,
                heal: dagda.feastHeal,
                strength: dagda.feastStrength,
              })
            : t("enemyCard.dagda.famineDetail", {
                progress: dagda.progress,
                length: dagda.length,
                cards: famineCards,
                weak: dagda.famineWeak,
                duration: dagda.famineWeakDuration,
              }),
      },
    ];
  }

  const cauldron = getDagdaCauldronUiState(enemy);
  if (!cauldron) return [];

  const t = i18n.t.bind(i18n);
  return [
    {
      key: "dagda-cauldron",
      colorClass:
        cauldron.brewType === "FEAST"
          ? "bg-emerald-950/85 text-emerald-100"
          : "bg-stone-900/90 text-amber-100",
      compactLabel: `${cauldron.brewType} ${cauldron.progress}/${cauldron.length}`,
      symbolLabel: `${cauldron.brewType === "FEAST" ? "F" : "M"}${cauldron.progress}`,
      detailLabel: t("enemyCard.dagda.cauldronLabel"),
      detailText: t("enemyCard.dagda.cauldronDetail", {
        brew: cauldron.brewType,
        progress: cauldron.progress,
        length: cauldron.length,
      }),
    },
  ];
}

function buildCernunnosStatusMarkers(
  enemy: CombatState["enemies"][number]
): StatusMarker[] {
  const cernunnos = getCernunnosUiState(enemy);
  if (!cernunnos) return [];

  const t = i18n.t.bind(i18n);
  if (cernunnos.exposed) {
    return [
      {
        key: "cernunnos-exposed",
        colorClass: "bg-emerald-950/85 text-emerald-100",
        compactLabel: "EXPOSED",
        symbolLabel: "EX",
        detailLabel: t("enemyCard.cernunnos.exposedLabel"),
        detailText: t("enemyCard.cernunnos.exposedDetail", {
          bonus: Math.round((cernunnos.exposedDamageMultiplier - 1) * 100),
          regrow: cernunnos.regrowPerTurn,
        }),
      },
    ];
  }

  return [
    {
      key: "cernunnos-crown",
      colorClass: "bg-amber-950/85 text-amber-100",
      compactLabel: `CROWN ${cernunnos.antlerLayers}/${cernunnos.maxAntlerLayers}`,
      symbolLabel: `C${cernunnos.antlerLayers}`,
      detailLabel: t("enemyCard.cernunnos.crownLabel"),
      detailText: t("enemyCard.cernunnos.crownDetail", {
        layers: cernunnos.antlerLayers,
        max: cernunnos.maxAntlerLayers,
        cap: cernunnos.damageCap,
        wrath: cernunnos.ancientWrathBonus,
      }),
    },
  ];
}

function buildNyarlathotepStatusMarkers(
  enemy: CombatState["enemies"][number]
): StatusMarker[] {
  const nyarl = getNyarlathotepUiState(enemy);
  if (!nyarl) return [];

  const t = i18n.t.bind(i18n);
  return nyarl.prophecies.map((prophecy, index) => {
    const cardName = getLocalizedIntentCardName(prophecy.cardId, t);
    const detailText =
      prophecy.omen === "DRAW"
        ? t("enemyCard.nyarlathotep.drawDetail", { card: cardName })
        : prophecy.omen === "INK"
          ? t("enemyCard.nyarlathotep.inkDetail", { card: cardName })
          : prophecy.omen === "ATTACK"
            ? t("enemyCard.nyarlathotep.attackDetail", { card: cardName })
            : t("enemyCard.nyarlathotep.skillDetail", { card: cardName });

    return {
      key: `nyarl-prophecy-${index}`,
      colorClass: prophecy.consumed
        ? "bg-stone-900/90 text-stone-100"
        : "bg-violet-950/85 text-violet-100",
      compactLabel: prophecy.consumed
        ? `OMEN ${prophecy.compactLabel} X`
        : `OMEN ${prophecy.compactLabel}`,
      symbolLabel: prophecy.consumed
        ? `X${prophecy.compactLabel[0]}`
        : `O${prophecy.compactLabel[0]}`,
      detailLabel: prophecy.consumed
        ? t("enemyCard.nyarlathotep.spentLabel")
        : t("enemyCard.nyarlathotep.prophecyLabel"),
      detailText: prophecy.consumed
        ? t("enemyCard.nyarlathotep.spentDetail", {
            omen: prophecy.omen,
            card: cardName,
          })
        : nyarl.phaseTwo && index === 1
          ? `${detailText} ${t("enemyCard.nyarlathotep.phaseTwoDetail")}`
          : detailText,
    };
  });
}

function buildShubStatusMarkers(
  enemy: CombatState["enemies"][number]
): StatusMarker[] {
  const shub = getShubUiState(enemy);
  if (!shub) return [];

  const t = i18n.t.bind(i18n);
  return [
    {
      key: "shub-brood",
      colorClass: "bg-lime-950/85 text-lime-100",
      compactLabel: `BROOD ${shub.nestCount}/${shub.maxNests}`,
      symbolLabel: `B${shub.nestCount}`,
      detailLabel: t("enemyCard.shub.broodLabel"),
      detailText:
        shub.nestCount > 0
          ? t("enemyCard.shub.broodDetail", {
              count: shub.nestCount,
              max: shub.maxNests,
              timer: shub.nextHatch,
              heal: shub.consumeHeal,
              poison: shub.consumePoison,
            })
          : t("enemyCard.shub.broodEmptyDetail", {
              max: shub.maxNests,
              heal: shub.consumeHeal,
              poison: shub.consumePoison,
            }),
    },
  ];
}

function buildShubNestStatusMarkers(
  enemy: CombatState["enemies"][number]
): StatusMarker[] {
  const nest = getShubNestUiState(enemy);
  if (!nest) return [];

  const t = i18n.t.bind(i18n);
  return [
    {
      key: "shub-nest-hatch",
      colorClass: "bg-emerald-950/85 text-emerald-100",
      compactLabel: `HATCH ${nest.timer}/${nest.maxTimer}`,
      symbolLabel: `H${nest.timer}`,
      detailLabel: t("enemyCard.shub.nestLabel"),
      detailText: t("enemyCard.shub.nestDetail", {
        timer: nest.timer,
        max: nest.maxTimer,
      }),
    },
  ];
}

function buildSoundiataStatusMarkers(
  enemy: CombatState["enemies"][number]
): StatusMarker[] {
  const soundiata = getSoundiataUiState(enemy);
  if (!soundiata) return [];

  const t = i18n.t.bind(i18n);
  return soundiata.verses.map((verse, index) => {
    const colorClass =
      verse.chapter === "RALLY"
        ? "bg-red-950/85 text-red-100"
        : verse.chapter === "SHIELD"
          ? "bg-blue-950/85 text-blue-100"
          : "bg-amber-950/85 text-amber-100";
    const detailText =
      verse.chapter === "RALLY"
        ? t("enemyCard.soundiata.rallyDetail", {
            progress: verse.progress,
            length: verse.length,
            value: verse.value,
            interrupt: verse.interruptProgress,
            threshold: verse.interruptThreshold,
          })
        : verse.chapter === "SHIELD"
          ? t("enemyCard.soundiata.shieldDetail", {
              progress: verse.progress,
              length: verse.length,
              value: verse.value,
              interrupt: verse.interruptProgress,
              threshold: verse.interruptThreshold,
            })
          : t("enemyCard.soundiata.warDetail", {
              progress: verse.progress,
              length: verse.length,
              value: verse.value,
              interrupt: verse.interruptProgress,
              threshold: verse.interruptThreshold,
            });

    return {
      key: `soundiata-verse-${index}`,
      colorClass,
      compactLabel: `${verse.chapter} ${verse.progress}/${verse.length}`,
      symbolLabel: `${verse.chapter[0]}${verse.progress}`,
      detailLabel: t("enemyCard.soundiata.verseLabel"),
      detailText:
        soundiata.phaseTwo && index === 1
          ? `${detailText} ${t("enemyCard.soundiata.phaseTwoDetail")}`
          : detailText,
    };
  });
}

function buildAnansiStatusMarkers(
  enemy: CombatState["enemies"][number]
): StatusMarker[] {
  const anansi = getAnansiUiState(enemy);
  if (!anansi) return [];

  const t = i18n.t.bind(i18n);
  const markers: StatusMarker[] = [];

  if (anansi.stalled) {
    markers.push({
      key: "anansi-stalled",
      colorClass: "bg-stone-900/90 text-stone-100",
      compactLabel: "LOOM STALL",
      symbolLabel: "LS",
      detailLabel: t("enemyCard.anansi.stalledLabel"),
      detailText: t("enemyCard.anansi.stalledDetail"),
    });
  }

  markers.push({
    key: "anansi-loom",
    colorClass: "bg-purple-950/85 text-purple-100",
    compactLabel: `LOOM ${anansi.compactLabel} ${anansi.progress}/${anansi.length}`,
    symbolLabel: `L${anansi.progress}`,
    detailLabel: t("enemyCard.anansi.loomLabel"),
    detailText: anansi.phaseTwo
      ? t("enemyCard.anansi.loomPhaseTwoDetail", {
          pattern: anansi.patternLabel,
          progress: anansi.progress,
          length: anansi.length,
        })
      : t("enemyCard.anansi.loomDetail", {
          pattern: anansi.patternLabel,
          progress: anansi.progress,
          length: anansi.length,
        }),
  });

  if (anansi.webbedCount > 0) {
    markers.push({
      key: "anansi-webbed",
      colorClass: "bg-amber-950/85 text-amber-100",
      compactLabel: `WEB ${anansi.webbedCount}`,
      symbolLabel: `W${anansi.webbedCount}`,
      detailLabel: t("enemyCard.anansi.webbedLabel"),
      detailText: t("enemyCard.anansi.webbedDetail", {
        count: anansi.webbedCount,
      }),
    });
  }

  return markers;
}

function buildQuetzalcoatlStatusMarkers(
  enemy: CombatState["enemies"][number]
): StatusMarker[] {
  const quetzalcoatl = getQuetzalcoatlUiState(enemy);
  if (!quetzalcoatl) return [];

  const t = i18n.t.bind(i18n);
  const markers: StatusMarker[] = [];

  if (quetzalcoatl.stance === "AIRBORNE") {
    markers.push({
      key: "quetzalcoatl-airborne",
      colorClass: "bg-sky-950/85 text-sky-100",
      compactLabel: "AIR",
      symbolLabel: "AIR",
      detailLabel: t("enemyCard.quetzalcoatl.airborneLabel"),
      detailText: t("enemyCard.quetzalcoatl.airborneDetail", {
        cap: quetzalcoatl.airborneDamageCap,
      }),
    });
    markers.push({
      key: "quetzalcoatl-counter",
      colorClass: "bg-amber-950/85 text-amber-100",
      compactLabel: `DOWN ${quetzalcoatl.hits}/${quetzalcoatl.knockdownThreshold}`,
      symbolLabel: `D${quetzalcoatl.hits}`,
      detailLabel: t("enemyCard.quetzalcoatl.counterLabel"),
      detailText: quetzalcoatl.phaseTwo
        ? t("enemyCard.quetzalcoatl.counterPhaseTwoDetail", {
            hits: quetzalcoatl.hits,
            threshold: quetzalcoatl.knockdownThreshold,
            bleed: quetzalcoatl.missBleed,
          })
        : t("enemyCard.quetzalcoatl.counterDetail", {
            hits: quetzalcoatl.hits,
            threshold: quetzalcoatl.knockdownThreshold,
          }),
    });
    return markers;
  }

  markers.push({
    key: "quetzalcoatl-grounded",
    colorClass: "bg-emerald-950/85 text-emerald-100",
    compactLabel: "GROUND",
    symbolLabel: "GRD",
    detailLabel: t("enemyCard.quetzalcoatl.groundedLabel"),
    detailText: t("enemyCard.quetzalcoatl.groundedDetail", {
      bonus: Math.round((quetzalcoatl.groundedDamageMultiplier - 1) * 100),
    }),
  });

  return markers;
}

function buildMedusaStatusMarkers(
  enemy: CombatState["enemies"][number]
): StatusMarker[] {
  const medusa = getMedusaUiState(enemy);
  if (!medusa) return [];

  const t = i18n.t.bind(i18n);
  const medusaGazeLabelFallback =
    i18n.resolvedLanguage === "fr" ? "Regard interdit" : "Forbidden Gaze";

  return medusa.patterns.map((pattern, index) => ({
    key: `medusa-gaze-${index}`,
    colorClass:
      index === 0
        ? "bg-violet-950/85 text-violet-100"
        : "bg-stone-900/90 text-stone-100",
    compactLabel: `GAZE ${pattern.compactLabel} ${pattern.progress}/${pattern.length}`,
    symbolLabel: `G${index + 1}`,
    detailLabel: t("enemyCard.medusa.gazeLabel", {
      defaultValue: medusaGazeLabelFallback,
    }),
    detailText: t("enemyCard.medusa.gazeDetail", {
      pattern: pattern.label,
      progress: pattern.progress,
      length: pattern.length,
      petrify: medusa.petrifyCostBonus,
      defaultValue:
        i18n.resolvedLanguage === "fr"
          ? "Ne complete pas {{pattern}} ce tour ({{progress}}/{{length}}). Sinon, la derniere carte devient Petrifiee et coute +{{petrify}}."
          : "Do not complete {{pattern}} this turn ({{progress}}/{{length}}). If you do, the last card becomes Petrified and costs +{{petrify}}.",
    }),
  }));
}

function buildHydraStatusMarkers(
  enemy: CombatState["enemies"][number]
): StatusMarker[] {
  const hydra = getHydraUiState(enemy);
  if (!hydra) return [];

  const t = i18n.t.bind(i18n);
  const markers: StatusMarker[] = [
    {
      key: "hydra-heads",
      colorClass: "bg-emerald-950/85 text-emerald-100",
      compactLabel: `HEAD ${hydra.aliveHeads}/${hydra.totalHeads}`,
      symbolLabel: `H${hydra.aliveHeads}`,
      detailLabel: t("enemyCard.hydra.headsLabel"),
      detailText: t("enemyCard.hydra.headsDetail", {
        alive: hydra.aliveHeads,
        total: hydra.totalHeads,
      }),
    },
  ];

  if (hydra.pendingHeads > 0) {
    markers.push({
      key: "hydra-regrow",
      colorClass: "bg-cyan-950/85 text-cyan-100",
      compactLabel: `REGROW ${hydra.pendingHeads}`,
      symbolLabel: `R${hydra.pendingHeads}`,
      detailLabel: t("enemyCard.hydra.regrowLabel"),
      detailText: t("enemyCard.hydra.regrowDetail", {
        count: hydra.pendingHeads,
      }),
    });
  }

  if (hydra.cauterizedHeads > 0) {
    markers.push({
      key: "hydra-cauterized",
      colorClass: "bg-amber-950/85 text-amber-100",
      compactLabel: `SEAR ${hydra.cauterizedHeads}`,
      symbolLabel: `S${hydra.cauterizedHeads}`,
      detailLabel: t("enemyCard.hydra.cauterizedLabel"),
      detailText: t("enemyCard.hydra.cauterizedDetail", {
        count: hydra.cauterizedHeads,
      }),
    });
  }

  return markers;
}

function buildPlayerDisruptionMarkers(
  disruption:
    | CombatState["playerDisruption"]
    | CombatState["nextPlayerDisruption"]
    | undefined,
  scope: "current" | "next"
): StatusMarker[] {
  if (!disruption) return [];

  const pending = scope === "next";
  const prefix = pending ? ">" : "";
  const markers: StatusMarker[] = [];

  if ((disruption.extraCardCost ?? 0) > 0) {
    const value = disruption.extraCardCost;
    markers.push({
      key: `${scope}-extra-card-cost`,
      colorClass: pending
        ? "bg-amber-950/85 text-amber-200"
        : "bg-amber-900/85 text-amber-100",
      compactLabel: `${prefix}+${value}C`,
      symbolLabel: `${prefix}+${value}C`,
      detailLabel: pending
        ? i18n.t("reward.effect.increaseCardCostNextTurn", { value })
        : i18n.t("reward.effect.increaseCardCostThisTurn", { value }),
      pending,
    });
  }

  if ((disruption.drawPenalty ?? 0) > 0) {
    const value = disruption.drawPenalty;
    markers.push({
      key: `${scope}-draw-penalty`,
      colorClass: pending
        ? "bg-slate-800/90 text-slate-200"
        : "bg-slate-700 text-slate-100",
      compactLabel: `${prefix}-${value}D`,
      symbolLabel: `${prefix}-${value}D`,
      detailLabel: pending
        ? i18n.t("reward.effect.reduceDrawNextTurn", { value })
        : i18n.t("reward.effect.reduceDrawThisTurn", { value }),
      pending,
    });
  }

  if (!pending && (disruption.drawsToDiscardRemaining ?? 0) > 0) {
    markers.push({
      key: `${scope}-draw-to-discard`,
      colorClass: "bg-purple-900/85 text-purple-100",
      compactLabel: "D>DIS",
      symbolLabel: "D>",
      detailLabel: i18n.t("reward.effect.nextDrawToDiscardThisTurn"),
    });
  }

  if (!pending && (disruption.disabledInkPowers ?? []).length > 0) {
    markers.push({
      key: `${scope}-ink-power-locked`,
      colorClass: "bg-cyan-900/85 text-cyan-100",
      compactLabel: "INK X",
      symbolLabel: "IX",
      detailLabel: i18n.t("playerStats.inkPowerLocked"),
    });
  }

  return markers;
}

export function renderCompactBuffs(buffs: BuffInstance[]): ReactNode {
  return renderCompactStatusMarkers(buildBuffStatusMarkers(buffs));
}

export function renderBuffSymbols(buffs: BuffInstance[]): ReactNode {
  return renderStatusMarkerSymbols(buildBuffStatusMarkers(buffs));
}

function getBuffSymbol(buffType: string): string {
  switch (buffType) {
    case "POISON":
      return "\u2620";
    case "WEAK":
      return "\u2304";
    case "VULNERABLE":
      return "\u25C9";
    case "STUN":
      return "Z";
    case "STUN_IMMUNITY":
      return "R";
    case "STRENGTH":
      return "\u2694";
    case "FOCUS":
      return "\u2726";
    case "THORNS":
      return "\u2736";
    case "BLEED":
      return "\uD83E\uDE78";
    default:
      return "\u2022";
  }
}

export function renderBuffTooltipDetails(buffs: BuffInstance[]): ReactNode {
  return renderStatusMarkerDetails(buildBuffStatusMarkers(buffs));
}

export function buildEnemyStatusMarkers(
  enemy: CombatState["enemies"][number]
): StatusMarker[] {
  return [
    ...buildChapterGuardianStatusMarkers(enemy),
    ...buildFenrirStatusMarkers(enemy),
    ...buildHelQueenStatusMarkers(enemy),
    ...buildDagdaStatusMarkers(enemy),
    ...buildCernunnosStatusMarkers(enemy),
    ...buildRaStatusMarkers(enemy),
    ...buildOsirisStatusMarkers(enemy),
    ...buildNyarlathotepStatusMarkers(enemy),
    ...buildShubStatusMarkers(enemy),
    ...buildShubNestStatusMarkers(enemy),
    ...buildSoundiataStatusMarkers(enemy),
    ...buildAnansiStatusMarkers(enemy),
    ...buildTezcatlipocaStatusMarkers(enemy),
    ...buildQuetzalcoatlStatusMarkers(enemy),
    ...buildMedusaStatusMarkers(enemy),
    ...buildHydraStatusMarkers(enemy),
    ...buildBabaYagaStatusMarkers(enemy),
    ...buildKoscheiStatusMarkers(enemy),
    ...buildBuffStatusMarkers(enemy.buffs),
  ];
}

export function renderCompactEnemyStatusMarkers(
  markers: StatusMarker[]
): ReactNode {
  return renderCompactStatusMarkers(markers);
}

export function renderEnemyStatusMarkerDetails(
  markers: StatusMarker[]
): ReactNode {
  return renderStatusMarkerDetails(markers);
}

export function buildPlayerMarkerBuffs(player: PlayerState): BuffInstance[] {
  const markers: BuffInstance[] = [...player.buffs];
  if (player.strength > 0) {
    markers.push({ type: "STRENGTH", stacks: player.strength });
  }
  if (player.focus > 0) {
    markers.push({ type: "FOCUS", stacks: player.focus });
  }
  return markers;
}

export function buildPlayerStatusMarkers(
  player: PlayerState,
  disruption?: CombatState["playerDisruption"],
  nextDisruption?: CombatState["nextPlayerDisruption"],
  attackBonus = 0
): StatusMarker[] {
  const markers: StatusMarker[] = [
    ...buildPlayerDisruptionMarkers(disruption, "current"),
    ...buildPlayerDisruptionMarkers(nextDisruption, "next"),
    ...buildBuffStatusMarkers(player.buffs),
  ];

  if (player.strength > 0) {
    markers.push(
      buildBuffStatusMarker(
        { type: "STRENGTH", stacks: player.strength },
        "player-strength"
      )
    );
  }
  if (player.focus > 0) {
    markers.push(
      buildBuffStatusMarker(
        { type: "FOCUS", stacks: player.focus },
        "player-focus"
      )
    );
  }
  if (attackBonus > 0) {
    markers.push({
      key: "player-attack-bonus",
      colorClass: "bg-red-950/85 text-red-100",
      compactLabel: i18n.t("playerStats.attackBonusBadge", {
        value: attackBonus,
      }),
      symbolLabel: `A+${attackBonus}`,
      detailLabel: i18n.t("library.bonus.attackBonus", { value: attackBonus }),
      detailText: i18n.t("playerStats.attackBonusTooltip", {
        value: attackBonus,
      }),
    });
  }

  return markers;
}

export function renderCompactStatusMarkersForPlayer(
  markers: StatusMarker[]
): ReactNode {
  return renderCompactStatusMarkers(markers);
}

export function renderStatusMarkerSymbolsForPlayer(
  markers: StatusMarker[]
): ReactNode {
  return renderStatusMarkerSymbols(markers);
}

export function renderStatusMarkerDetailsForPlayer(
  markers: StatusMarker[]
): ReactNode {
  return renderStatusMarkerDetails(markers);
}

type EnemyIntentEntry = {
  key: string;
  label: string;
  colorClass: string;
};

function formatIntentFallbackLabel(id: string): string {
  return id
    .split("_")
    .map((chunk) =>
      chunk.length > 0 ? chunk[0]!.toUpperCase() + chunk.slice(1) : chunk
    )
    .join(" ");
}

function getLocalizedIntentCardName(
  cardId: string,
  t: (key: string, options?: Record<string, unknown>) => string
): string {
  const definition = getCardDefinitionById(cardId);
  return definition
    ? localizeCardName(definition, t as never)
    : formatIntentFallbackLabel(cardId);
}

function getLocalizedIntentEnemyName(enemyId: string): string {
  return localizeEnemyName(enemyId, formatIntentFallbackLabel(enemyId));
}

function applyPhasePrefix(
  label: string,
  source: EnemyIntentExtraEffect["source"],
  t: (key: string, options?: Record<string, unknown>) => string
): string {
  if (source !== "phase2") return label;
  return `${t("enemyCard.phase2Badge")} ${label}`;
}

function buildEffectIntentEntry(
  effect: Effect,
  index: number,
  t: (key: string, options?: Record<string, unknown>) => string,
  combat: CombatState,
  enemy: CombatState["enemies"][number],
  ability: EnemyAbility | undefined,
  resolvedTarget:
    | "player"
    | "all_enemies"
    | "all_allies"
    | { type: "enemy"; instanceId: string }
    | { type: "ally"; instanceId: string }
): EnemyIntentEntry {
  let label = "";
  let colorClass = "bg-slate-700 text-slate-100";

  switch (effect.type) {
    case "DAMAGE":
    case "DAMAGE_PER_TARGET_BLOCK":
      label = `${t("enemyCard.dmg")} ${computeEnemyEffectDamagePreview(
        combat,
        enemy,
        resolvedTarget,
        effect,
        ability
      )}`;
      colorClass = "bg-red-900/70 text-red-200";
      break;
    case "DAMAGE_BONUS_IF_UPGRADED_IN_HAND":
      label = t("reward.effect.damageBonusIfUpgradedInHand", {
        value: effect.value,
      });
      colorClass = "bg-red-900/70 text-red-200";
      break;
    case "DAMAGE_PER_DEBUFF":
      label = t("reward.effect.damagePerDebuff", {
        buff: buffMeta[effect.buff ?? ""]?.label() ?? effect.buff ?? "status",
        value: effect.value,
      });
      colorClass = "bg-red-900/70 text-red-200";
      break;
    case "DAMAGE_PER_CURRENT_INK":
      label = t("reward.effect.damagePerCurrentInk", { value: effect.value });
      colorClass = "bg-cyan-950/80 text-cyan-200";
      break;
    case "DAMAGE_PER_CLOG_IN_DISCARD":
      label = t("reward.effect.damagePerClogInDiscard", {
        value: effect.value,
      });
      colorClass = "bg-purple-950/80 text-purple-200";
      break;
    case "DAMAGE_PER_EXHAUSTED_CARD":
      label = t("reward.effect.damagePerExhaustedCard", {
        value: effect.value,
      });
      colorClass = "bg-amber-950/80 text-amber-200";
      break;
    case "DAMAGE_PER_DRAWN_THIS_TURN":
      label = t("reward.effect.damagePerDrawnThisTurn", {
        value: effect.value,
      });
      colorClass = "bg-indigo-950/80 text-indigo-200";
      break;
    case "HEAL":
      label = t("reward.effect.heal", { value: effect.value });
      colorClass = "bg-emerald-900/70 text-emerald-200";
      break;
    case "BLOCK":
      label = t("reward.effect.block", { value: effect.value });
      colorClass = "bg-blue-900/70 text-blue-200";
      break;
    case "BLOCK_PER_CURRENT_INK":
      label = t("reward.effect.blockPerCurrentInk", { value: effect.value });
      colorClass = "bg-cyan-950/80 text-cyan-200";
      break;
    case "BLOCK_PER_DEBUFF":
      label = t("reward.effect.blockPerDebuff", {
        buff: buffMeta[effect.buff ?? ""]?.label() ?? effect.buff ?? "status",
        value: effect.value,
      });
      colorClass = "bg-blue-900/70 text-blue-200";
      break;
    case "BLOCK_PER_EXHAUSTED_CARD":
      label = t("reward.effect.blockPerExhaustedCard", {
        value: effect.value,
      });
      colorClass = "bg-blue-950/80 text-blue-200";
      break;
    case "APPLY_BUFF_PER_EXHAUSTED_CARD":
      label = t("reward.effect.applyBuffPerExhaustedCard", {
        buff: buffMeta[effect.buff ?? ""]?.label() ?? effect.buff ?? "status",
        value: effect.value,
      });
      colorClass = "bg-amber-950/80 text-amber-200";
      break;
    case "RETRIGGER_THORNS_ON_WEAK_ATTACK":
      label = t("reward.effect.retriggerThornsOnWeakAttack", {
        value: effect.value,
      });
      colorClass = "bg-amber-900/70 text-amber-200";
      break;
    case "DRAW_CARDS":
      label = t("reward.effect.drawCards", { value: effect.value });
      colorClass = "bg-indigo-900/70 text-indigo-200";
      break;
    case "GAIN_INK":
      label = t("reward.effect.gainInk", { value: effect.value });
      colorClass = "bg-cyan-900/70 text-cyan-200";
      break;
    case "APPLY_BUFF":
      label = t("reward.effect.applyBuff", {
        buff: buffMeta[effect.buff ?? ""]?.label() ?? effect.buff ?? "status",
        value: effect.value,
      });
      colorClass = "bg-amber-900/70 text-amber-200";
      break;
    case "APPLY_DEBUFF":
      label = t("reward.effect.applyDebuff", {
        buff: buffMeta[effect.buff ?? ""]?.label() ?? effect.buff ?? "status",
        value: effect.value,
      });
      colorClass = "bg-purple-900/70 text-purple-200";
      break;
    case "DRAIN_INK":
      label = t("reward.effect.drainInk", { value: effect.value });
      colorClass = "bg-cyan-900/70 text-cyan-200";
      break;
    case "ADD_CARD_TO_DRAW":
      label = effect.cardId
        ? t("enemyCard.addCardToDrawNamed", {
            value: effect.value,
            card: getLocalizedIntentCardName(effect.cardId, t),
          })
        : t("gameCard.effect.addToDraw");
      colorClass = "bg-indigo-950/80 text-indigo-200";
      break;
    case "ADD_CARD_TO_DISCARD":
      label = effect.cardId
        ? t("enemyCard.addCardToDiscardNamed", {
            value: effect.value,
            card: getLocalizedIntentCardName(effect.cardId, t),
          })
        : t("gameCard.effect.addToDiscard");
      colorClass = "bg-slate-800 text-slate-100";
      break;
    case "MOVE_RANDOM_NON_CLOG_DISCARD_TO_HAND":
      label = t("reward.effect.moveRandomNonClogDiscardToHand", {
        value: effect.value,
      });
      colorClass = "bg-purple-950/80 text-purple-200";
      break;
    case "FREEZE_HAND_CARDS":
      label = t("reward.effect.freezeHandCards", { value: effect.value });
      colorClass = "bg-cyan-950/80 text-cyan-200";
      break;
    case "NEXT_DRAW_TO_DISCARD_THIS_TURN":
      label = t("reward.effect.nextDrawToDiscardThisTurn");
      colorClass = "bg-purple-950/80 text-purple-200";
      break;
    case "DISABLE_INK_POWER_THIS_TURN":
      label = t("enemyCard.lockInk", { power: effect.inkPower ?? "all" });
      colorClass = "bg-cyan-900/80 text-cyan-100";
      break;
    case "INCREASE_CARD_COST_THIS_TURN":
      label = t("reward.effect.increaseCardCostThisTurn", {
        value: effect.value,
      });
      colorClass = "bg-amber-900/80 text-amber-100";
      break;
    case "INCREASE_CARD_COST_NEXT_TURN":
      label = t("reward.effect.increaseCardCostNextTurn", {
        value: effect.value,
      });
      colorClass = "bg-amber-900/80 text-amber-100";
      break;
    case "REDUCE_DRAW_THIS_TURN":
      label = t("reward.effect.reduceDrawThisTurn", { value: effect.value });
      colorClass = "bg-slate-700 text-slate-100";
      break;
    case "REDUCE_DRAW_NEXT_TURN":
      label = t("reward.effect.reduceDrawNextTurn", { value: effect.value });
      colorClass = "bg-slate-700 text-slate-100";
      break;
    case "FORCE_DISCARD_RANDOM":
      label = t("enemyCard.randomDiscard", { value: effect.value });
      colorClass = "bg-rose-900/80 text-rose-100";
      break;
    default:
      label = t("reward.effect.fallback", {
        type: effect.type.toLowerCase(),
        value: effect.value,
      });
      colorClass = "bg-slate-700 text-slate-100";
      break;
  }

  return {
    key: `${effect.type}-${index}`,
    label,
    colorClass,
  };
}

function buildDamageBonusIntentEntry(
  bonus: EnemyIntentDamageBonus,
  index: number,
  t: (key: string, options?: Record<string, unknown>) => string
): EnemyIntentEntry {
  switch (bonus.type) {
    case "FLAT":
      return {
        key: `bonus-flat-${index}`,
        label: t("enemyCard.bonusDamageFlat", { bonus: bonus.value }),
        colorClass: "bg-amber-900/70 text-amber-100",
      };
    case "PLAYER_DEBUFFED":
      return {
        key: `bonus-debuff-${index}`,
        label: t("enemyCard.conditionalBonusVsDebuffed", {
          bonus: bonus.value,
        }),
        colorClass: bonus.active
          ? "bg-amber-800/70 text-amber-100 ring-1 ring-amber-300/50"
          : "bg-gray-700/80 text-gray-200",
      };
    case "PLAYER_INK_BELOW":
      return {
        key: `bonus-low-ink-${index}`,
        label: t("enemyCard.conditionalBonusVsLowInk", {
          bonus: bonus.value,
          threshold: bonus.threshold,
        }),
        colorClass: bonus.active
          ? "bg-cyan-900/75 text-cyan-100 ring-1 ring-cyan-300/40"
          : "bg-slate-700/80 text-slate-200",
      };
    case "PER_CURSE_CARD":
      return {
        key: `bonus-curse-${index}`,
        label: t("enemyCard.conditionalBonusPerCurse", {
          perCurse: bonus.valuePerCurse,
          total: bonus.totalBonus,
        }),
        colorClass:
          bonus.totalBonus > 0
            ? "bg-purple-900/75 text-purple-100 ring-1 ring-purple-300/40"
            : "bg-slate-700/80 text-slate-200",
      };
    case "PER_REMAINING_HUNT":
      return {
        key: `bonus-hunt-${index}`,
        label: t("enemyCard.conditionalBonusPerHunt", {
          perPip: bonus.valuePerPip,
          remaining: bonus.remainingPips,
          total: bonus.totalBonus,
        }),
        colorClass: bonus.active
          ? "bg-amber-900/75 text-amber-100 ring-1 ring-amber-300/40"
          : "bg-slate-700/80 text-slate-200",
      };
    case "PER_PLAYER_BLEED":
      return {
        key: `bonus-bleed-${index}`,
        label: t("enemyCard.conditionalBonusPerBleed", {
          perBleed: bonus.valuePerBleed,
          total: bonus.totalBonus,
        }),
        colorClass: bonus.active
          ? "bg-rose-900/75 text-rose-100 ring-1 ring-rose-300/40"
          : "bg-slate-700/80 text-slate-200",
      };
    case "PER_ANTLER_LAYER":
      return {
        key: `bonus-antler-${index}`,
        label: t("enemyCard.conditionalBonusPerAntler", {
          perAntler: bonus.valuePerLayer,
          total: bonus.totalBonus,
        }),
        colorClass:
          bonus.totalBonus > 0
            ? "bg-amber-900/75 text-amber-100 ring-1 ring-amber-300/40"
            : "bg-slate-700/80 text-slate-200",
      };
    default:
      return {
        key: `bonus-fallback-${index}`,
        label: "",
        colorClass: "bg-slate-700 text-slate-100",
      };
  }
}

function buildExtraIntentEntry(
  extra: EnemyIntentExtraEffect,
  index: number,
  t: (key: string, options?: Record<string, unknown>) => string
): EnemyIntentEntry {
  let label = "";
  let colorClass = "bg-slate-700 text-slate-100";

  switch (extra.type) {
    case "SUMMON_ENEMY":
      label = `${t("enemyCard.summon")} ${getLocalizedIntentEnemyName(
        extra.enemyId
      )}`;
      colorClass = "bg-orange-900/70 text-orange-200";
      break;
    case "REINVOKE_ENEMY":
      label = t("enemyCard.reinvokeEnemy", {
        enemy: getLocalizedIntentEnemyName(extra.enemyId),
      });
      colorClass = "bg-orange-950/80 text-amber-100";
      break;
    case "ADD_CARD_TO_DRAW":
      label = t("enemyCard.addCardToDrawNamed", {
        value: extra.value,
        card: getLocalizedIntentCardName(extra.cardId, t),
      });
      colorClass = "bg-indigo-950/80 text-indigo-200";
      break;
    case "ADD_CARD_TO_DISCARD":
      label = t("enemyCard.addCardToDiscardNamed", {
        value: extra.value,
        card: getLocalizedIntentCardName(extra.cardId, t),
      });
      colorClass = "bg-slate-800 text-slate-100";
      break;
    case "HEAL_SELF":
      label = t("reward.effect.heal", { value: extra.value });
      colorClass = "bg-emerald-900/70 text-emerald-200";
      break;
    case "GAIN_STRENGTH_SELF":
      label = `${buffMeta.STRENGTH?.label() ?? "Strength"} +${extra.value}`;
      colorClass = "bg-red-900/70 text-red-200";
      break;
    case "GAIN_THORNS_SELF":
      label = `${buffMeta.THORNS?.label() ?? "Thorns"} +${extra.value}`;
      colorClass = "bg-rose-900/70 text-rose-200";
      break;
    case "GAIN_BLOCK_SELF":
      label = `${t("playerStats.block")} +${extra.value}`;
      colorClass = "bg-blue-950/80 text-blue-100";
      break;
    case "APPLY_DEBUFF_TO_PLAYER": {
      const buffLabel = buffMeta[extra.buff]?.label() ?? extra.buff;
      const durationText =
        typeof extra.duration === "number" && extra.duration > 0
          ? ` (${extra.duration}t)`
          : "";
      label = `${t("reward.effect.applyDebuff", {
        buff: buffLabel,
        value: extra.value,
      })}${durationText}`;
      colorClass = "bg-purple-900/70 text-purple-200";
      break;
    }
    case "FREEZE_HAND":
      label = t("reward.effect.freezeHandCards", { value: extra.value });
      colorClass = "bg-cyan-950/80 text-cyan-200";
      break;
    case "INCREASE_CARD_COST_NEXT_TURN":
      label = t("reward.effect.increaseCardCostNextTurn", {
        value: extra.value,
      });
      colorClass = "bg-amber-900/80 text-amber-100";
      break;
    case "DRAIN_ALL_INK":
      label = t("enemyCard.drainAllInk");
      colorClass = "bg-cyan-900/80 text-cyan-100";
      break;
    case "SELF_DAMAGE":
      label = t("enemyCard.selfDamage", { value: extra.value });
      colorClass = "bg-rose-950/80 text-rose-100";
      break;
    case "GAIN_STRENGTH_ALL_ENEMIES":
      label = t("enemyCard.alliesGainBuff", {
        buff: buffMeta.STRENGTH?.label() ?? "Strength",
        value: extra.value,
      });
      colorClass = "bg-red-950/80 text-red-100";
      break;
    case "GAIN_BLOCK_ALL_ENEMIES":
      label = t("enemyCard.alliesGainBlock", { value: extra.value });
      colorClass = "bg-blue-950/80 text-blue-100";
      break;
    case "GAIN_THORNS_ALL_ENEMIES":
      label = t("enemyCard.alliesGainThorns", { value: extra.value });
      colorClass = "bg-amber-950/80 text-amber-100";
      break;
    case "REDACT_CARD":
      label =
        extra.redaction === "COST"
          ? t("enemyCard.redactCardCost", { value: extra.value })
          : extra.redaction === "TEXT"
            ? t("enemyCard.redactCardText", { value: extra.value })
            : t("enemyCard.redactCardFlexible", { value: extra.value });
      colorClass =
        extra.redaction === "COST"
          ? "bg-amber-950/80 text-amber-100"
          : extra.redaction === "TEXT"
            ? "bg-slate-700 text-slate-100"
            : "bg-stone-800 text-stone-100";
      break;
    case "RESTORE_REDACTIONS_ON_DEFEAT":
      label =
        extra.redaction === "COST"
          ? t("enemyCard.restoreCostRedactionsOnDefeat")
          : t("enemyCard.restoreTextRedactionsOnDefeat");
      colorClass =
        extra.redaction === "COST"
          ? "bg-emerald-950/80 text-emerald-100"
          : "bg-teal-950/80 text-teal-100";
      break;
    case "CASH_OUT_PLAYER_BLEED":
      label = t("enemyCard.cashOutPlayerBleed", {
        bleed: extra.bleedStacks,
        damage: extra.totalDamage,
      });
      colorClass = "bg-rose-950/80 text-rose-100";
      break;
    case "SET_HUNT_COUNTER":
      label = t("enemyCard.phase2FenrirHunt", { value: extra.value });
      colorClass = "bg-amber-950/80 text-amber-100";
      break;
    case "ROTATE_STANCE_EVERY_TURN":
      label = t("enemyCard.phase2HelRotate");
      colorClass = "bg-slate-800 text-slate-100";
      break;
    case "MEDUSA_DOUBLE_PATTERN":
      label = t("enemyCard.phase2MedusaDoubleGaze", {
        defaultValue:
          i18n.resolvedLanguage === "fr"
            ? "Phase 2 : revele un deuxieme pattern interdit"
            : "Phase 2: reveals a second forbidden pattern",
      });
      colorClass = "bg-violet-950/80 text-violet-100";
      break;
    case "TEZCATLIPOCA_MIRROR_ECHO":
      label =
        extra.family === "ATTACK"
          ? t("enemyCard.tezcatlipoca.intentAttackEcho", {
              value: extra.value,
            })
          : extra.family === "BLOCK"
            ? t("enemyCard.tezcatlipoca.intentBlockEcho", {
                value: extra.value,
              })
            : extra.family === "INK"
              ? t("enemyCard.tezcatlipoca.intentInkEcho", {
                  value: Math.max(1, Math.ceil(extra.value / 4)),
                })
              : t("enemyCard.tezcatlipoca.intentHexEcho", {
                  value: extra.value >= 10 ? 2 : 1,
                });
      colorClass =
        extra.family === "ATTACK"
          ? "bg-red-950/80 text-red-100"
          : extra.family === "BLOCK"
            ? "bg-blue-950/80 text-blue-100"
            : extra.family === "INK"
              ? "bg-cyan-950/80 text-cyan-100"
              : "bg-stone-900/90 text-stone-100";
      break;
    case "TEZCATLIPOCA_DOUBLE_ECHO":
      label = t("enemyCard.phase2TezcatlipocaDoubleEcho");
      colorClass = "bg-stone-900/90 text-amber-100";
      break;
    case "QUETZALCOATL_FAST_KNOCKDOWN":
      label = t("enemyCard.phase2QuetzalcoatlFastKnockdown", {
        value: extra.value,
      });
      colorClass = "bg-sky-950/80 text-sky-100";
      break;
    case "QUETZALCOATL_BLEED_ON_MISS":
      label = t("enemyCard.phase2QuetzalcoatlBleedOnMiss", {
        value: extra.value,
      });
      colorClass = "bg-rose-950/80 text-rose-100";
      break;
    case "RA_SOLAR_CHARGE":
      label = t("enemyCard.ra.chargeIntent", { value: extra.value });
      colorClass = "bg-orange-950/80 text-orange-100";
      break;
    case "RA_ECLIPSE_BARRIER":
      label = t("enemyCard.ra.eclipseIntent");
      colorClass = "bg-slate-900/90 text-slate-100";
      break;
    case "RA_PHASE_TWO_CHARGE_RATE":
      label = t("enemyCard.phase2RaChargeRate", { value: extra.value });
      colorClass = "bg-orange-950/80 text-orange-100";
      break;
    case "OSIRIS_STRICTER_THRESHOLD":
      label = t("enemyCard.phase2OsirisThreshold", { value: extra.value });
      colorClass = "bg-stone-900/90 text-amber-100";
      break;
    case "SOUNDIATA_DOUBLE_VERSE":
      label = t("enemyCard.phase2SoundiataDoubleVerse");
      colorClass = "bg-amber-950/80 text-amber-100";
      break;
    case "NYARLATHOTEP_PROPHECY":
      label =
        extra.omen === "DRAW"
          ? t("enemyCard.nyarlathotep.intentDraw", {
              card: getLocalizedIntentCardName(extra.cardId, t),
            })
          : extra.omen === "INK"
            ? t("enemyCard.nyarlathotep.intentInk", {
                card: getLocalizedIntentCardName(extra.cardId, t),
              })
            : extra.omen === "ATTACK"
              ? t("enemyCard.nyarlathotep.intentAttack", {
                  card: getLocalizedIntentCardName(extra.cardId, t),
                })
              : t("enemyCard.nyarlathotep.intentSkill", {
                  card: getLocalizedIntentCardName(extra.cardId, t),
                });
      colorClass = "bg-violet-950/80 text-violet-100";
      break;
    case "NYARLATHOTEP_DOUBLE_PROPHECY":
      label = t("enemyCard.phase2NyarlathotepDoubleProphecy");
      colorClass = "bg-violet-950/80 text-violet-100";
      break;
    case "SHUB_DOUBLE_BROOD":
      label = t("enemyCard.phase2ShubDoubleBrood");
      colorClass = "bg-lime-950/80 text-lime-100";
      break;
    case "DAGDA_FAST_BREW":
      label = t("enemyCard.phase2DagdaFastBrew");
      colorClass = "bg-emerald-950/80 text-emerald-100";
      break;
    case "CERNUNNOS_FAST_REGROW":
      label = t("enemyCard.phase2CernunnosFastRegrow", {
        value: extra.value,
      });
      colorClass = "bg-amber-950/80 text-amber-100";
      break;
    case "ANANSI_LOOM_PATTERN":
      label = extra.phaseTwo
        ? t("enemyCard.anansi.intentPatternPhaseTwo", {
            pattern: extra.pattern,
            progress: extra.progress,
            length: extra.length,
          })
        : t("enemyCard.anansi.intentPattern", {
            pattern: extra.pattern,
            progress: extra.progress,
            length: extra.length,
          });
      colorClass = "bg-purple-950/80 text-purple-100";
      break;
    case "ANANSI_THREE_STEP_PATTERN":
      label = t("enemyCard.phase2AnansiThreeStepPattern");
      colorClass = "bg-purple-950/80 text-purple-100";
      break;
    case "ANANSI_DOUBLE_OUTCOME":
      label = t("enemyCard.phase2AnansiDoubleOutcome");
      colorClass = "bg-rose-950/80 text-rose-100";
      break;
    default:
      break;
  }

  return {
    key: `extra-${extra.type}-${index}`,
    label: applyPhasePrefix(label, extra.source, t),
    colorClass,
  };
}

function buildEnemyIntentEntries(
  combat: CombatState,
  enemy: CombatState["enemies"][number],
  resolvedTarget:
    | "player"
    | "all_enemies"
    | "all_allies"
    | { type: "enemy"; instanceId: string }
    | { type: "ally"; instanceId: string },
  ability: EnemyAbility,
  t: (key: string, options?: Record<string, unknown>) => string
): EnemyIntentEntry[] {
  const baseEntries = ability.effects.map((effect, index) =>
    buildEffectIntentEntry(
      effect,
      index,
      t,
      combat,
      enemy,
      ability,
      resolvedTarget
    )
  );
  const bonusEntries = getEnemyIntentDamageBonuses(combat, enemy, ability).map(
    (bonus, index) => buildDamageBonusIntentEntry(bonus, index, t)
  );
  const extraEntries = [
    ...getEnemyIntentAbilityExtraEffects(combat, enemy, ability),
    ...getEnemyIntentPendingPhaseExtraEffects(combat, enemy),
  ].map((extra, index) => buildExtraIntentEntry(extra, index, t));

  return [...baseEntries, ...bonusEntries, ...extraEntries].filter(
    (entry) => entry.label.length > 0
  );
}

export function renderEnemyIntentEffects(
  effects: Effect[],
  t: (key: string, options?: Record<string, unknown>) => string,
  combat: CombatState,
  enemy: CombatState["enemies"][number],
  ability: EnemyAbility | undefined,
  resolvedTarget:
    | "player"
    | "all_enemies"
    | "all_allies"
    | { type: "enemy"; instanceId: string }
    | { type: "ally"; instanceId: string }
): ReactNode[] {
  const effectiveAbility = ability ?? {
    name: "",
    weight: 1,
    effects,
  };

  return buildEnemyIntentEntries(
    combat,
    enemy,
    resolvedTarget,
    effectiveAbility,
    t
  ).map((entry) => (
    <span
      key={entry.key}
      className={cn(
        "rounded px-1.5 py-0.5 text-[10px] font-bold",
        entry.colorClass
      )}
    >
      {entry.label}
    </span>
  ));
}

export function formatAllyIntent(
  ability: EnemyAbility,
  t: (key: string, options?: Record<string, unknown>) => string
): string {
  const effects = ability.effects.map((effect) => {
    switch (effect.type) {
      case "DAMAGE":
        return t("reward.effect.damage", { value: effect.value });
      case "DAMAGE_BONUS_IF_UPGRADED_IN_HAND":
        return t("reward.effect.damageBonusIfUpgradedInHand", {
          value: effect.value,
        });
      case "DAMAGE_PER_CURRENT_INK":
        return t("reward.effect.damagePerCurrentInk", {
          value: effect.value,
        });
      case "DAMAGE_PER_CLOG_IN_DISCARD":
        return t("reward.effect.damagePerClogInDiscard", {
          value: effect.value,
        });
      case "DAMAGE_PER_EXHAUSTED_CARD":
        return t("reward.effect.damagePerExhaustedCard", {
          value: effect.value,
        });
      case "DAMAGE_PER_DRAWN_THIS_TURN":
        return t("reward.effect.damagePerDrawnThisTurn", {
          value: effect.value,
        });
      case "HEAL":
        return t("reward.effect.heal", { value: effect.value });
      case "BLOCK":
        return t("reward.effect.block", { value: effect.value });
      case "BLOCK_PER_CURRENT_INK":
        return t("reward.effect.blockPerCurrentInk", {
          value: effect.value,
        });
      case "BLOCK_PER_EXHAUSTED_CARD":
        return t("reward.effect.blockPerExhaustedCard", {
          value: effect.value,
        });
      case "APPLY_BUFF_PER_EXHAUSTED_CARD":
        return t("reward.effect.applyBuffPerExhaustedCard", {
          buff: effect.buff ?? "status",
          value: effect.value,
        });
      case "RETRIGGER_THORNS_ON_WEAK_ATTACK":
        return t("reward.effect.retriggerThornsOnWeakAttack", {
          value: effect.value,
        });
      case "DRAW_CARDS":
        return t("reward.effect.drawCards", { value: effect.value });
      case "GAIN_INK":
        return t("reward.effect.gainInk", { value: effect.value });
      case "GAIN_FOCUS":
        return t("reward.effect.gainFocus", { value: effect.value });
      case "GAIN_STRENGTH":
        return t("reward.effect.gainStrength", { value: effect.value });
      case "GAIN_ENERGY":
        return t("reward.effect.gainEnergy", { value: effect.value });
      case "APPLY_BUFF":
        return t("reward.effect.applyBuff", {
          buff: effect.buff ?? "status",
          value: effect.value,
        });
      case "APPLY_DEBUFF":
        return t("reward.effect.applyDebuff", {
          buff: effect.buff ?? "status",
          value: effect.value,
        });
      case "DRAIN_INK":
        return t("reward.effect.drainInk", { value: effect.value });
      case "EXHAUST":
        return t("reward.effect.exhaust");
      case "ADD_CARD_TO_DRAW":
        return t("gameCard.effect.addToDraw");
      case "ADD_CARD_TO_DISCARD":
        return t("gameCard.effect.addToDiscard");
      case "MOVE_RANDOM_NON_CLOG_DISCARD_TO_HAND":
        return t("reward.effect.moveRandomNonClogDiscardToHand", {
          value: effect.value,
        });
      case "FORCE_DISCARD_RANDOM":
        return t("reward.effect.forceDiscardRandom", { value: effect.value });
      default:
        return t("reward.effect.fallback", {
          type: effect.type.toLowerCase(),
          value: effect.value,
        });
    }
  });

  const targetLabel =
    ability.target === "ALL_ENEMIES"
      ? t("reward.target.allEnemies")
      : ability.target === "LOWEST_HP_ENEMY"
        ? t("reward.target.lowestHpEnemy")
        : ability.target === "ALLY_PRIORITY"
          ? t("reward.target.allyPriority")
          : ability.target === "SELF"
            ? t("reward.target.self")
            : t("reward.target.player");

  return `${targetLabel}: ${effects.join(", ")}`;
}

export function buildMobileEnemyIntentChips(
  combat: CombatState,
  enemy: CombatState["enemies"][number],
  resolvedTarget:
    | "player"
    | "all_enemies"
    | "all_allies"
    | { type: "enemy"; instanceId: string }
    | { type: "ally"; instanceId: string },
  ability: EnemyAbility | undefined,
  hideIntent: boolean,
  t?: (key: string, options?: Record<string, unknown>) => string
): string[] {
  const translate = typeof t === "function" ? t : (key: string) => key;
  if (!ability || hideIntent) return [translate("enemyCard.intentHidden")];

  return buildEnemyIntentEntries(
    combat,
    enemy,
    resolvedTarget,
    ability,
    translate
  ).map((entry) => entry.label);
}

export function summarizeEnemyIntentLabels(
  labels: string[],
  maxVisible: number
): {
  visibleLabels: string[];
  remaining: number;
} {
  const safeMaxVisible = Math.max(1, Math.floor(maxVisible));

  return {
    visibleLabels: labels.slice(0, safeMaxVisible),
    remaining: Math.max(0, labels.length - safeMaxVisible),
  };
}

export function computeEnemyDamagePreview(
  combat: CombatState,
  enemy: CombatState["enemies"][number],
  resolvedTarget:
    | "player"
    | "all_enemies"
    | "all_allies"
    | { type: "enemy"; instanceId: string }
    | { type: "ally"; instanceId: string },
  baseDamage: number,
  ability?: EnemyAbility
): number {
  let effectiveBaseDamage = baseDamage;
  if (ability && resolvedTarget === "player") {
    effectiveBaseDamage += getEnemyIntentActiveDamageBonusTotal(
      combat,
      enemy,
      ability
    );
  }

  const scaledBaseDamage = Math.max(
    1,
    Math.round(effectiveBaseDamage * (combat.enemyDamageScale ?? 1))
  );
  const targetBuffs = resolveEnemyIntentTargetBuffs(combat, resolvedTarget);
  return calculateDamage(
    scaledBaseDamage,
    { strength: getStrengthFromBuffs(enemy.buffs), buffs: enemy.buffs },
    { buffs: targetBuffs }
  );
}

function resolveEnemyIntentTargetBlock(
  combat: CombatState,
  resolvedTarget:
    | "player"
    | "all_enemies"
    | "all_allies"
    | { type: "enemy"; instanceId: string }
    | { type: "ally"; instanceId: string }
): number {
  if (resolvedTarget === "player") return combat.player.block;

  if (resolvedTarget === "all_enemies") {
    return combat.enemies.find((entry) => entry.currentHp > 0)?.block ?? 0;
  }

  if (resolvedTarget === "all_allies") {
    return combat.allies.find((entry) => entry.currentHp > 0)?.block ?? 0;
  }

  if (resolvedTarget.type === "ally") {
    return (
      combat.allies.find(
        (entry) => entry.instanceId === resolvedTarget.instanceId
      )?.block ?? 0
    );
  }

  return (
    combat.enemies.find(
      (entry) => entry.instanceId === resolvedTarget.instanceId
    )?.block ?? 0
  );
}

export function computeEnemyEffectDamagePreview(
  combat: CombatState,
  enemy: CombatState["enemies"][number],
  resolvedTarget:
    | "player"
    | "all_enemies"
    | "all_allies"
    | { type: "enemy"; instanceId: string }
    | { type: "ally"; instanceId: string },
  effect: Effect,
  ability?: EnemyAbility
): number {
  if (effect.type === "DAMAGE") {
    return computeEnemyDamagePreview(
      combat,
      enemy,
      resolvedTarget,
      effect.value,
      ability
    );
  }

  if (effect.type !== "DAMAGE_PER_TARGET_BLOCK") {
    return 0;
  }

  const targetBlock = resolveEnemyIntentTargetBlock(combat, resolvedTarget);
  const targetBuffs = resolveEnemyIntentTargetBuffs(combat, resolvedTarget);
  return calculateDamage(
    computeDamageFromTargetBlock(targetBlock, effect.value),
    { strength: getStrengthFromBuffs(enemy.buffs), buffs: enemy.buffs },
    { buffs: targetBuffs }
  );
}

function resolveEnemyIntentTargetBuffs(
  combat: CombatState,
  resolvedTarget:
    | "player"
    | "all_enemies"
    | "all_allies"
    | { type: "enemy"; instanceId: string }
    | { type: "ally"; instanceId: string }
): BuffInstance[] {
  if (resolvedTarget === "player") return combat.player.buffs;

  if (resolvedTarget === "all_enemies") {
    return combat.player.buffs;
  }

  if (resolvedTarget === "all_allies") {
    return combat.enemies.find((entry) => entry.currentHp > 0)?.buffs ?? [];
  }

  if (resolvedTarget.type === "ally") {
    return (
      combat.allies.find(
        (entry) => entry.instanceId === resolvedTarget.instanceId
      )?.buffs ?? []
    );
  }

  return (
    combat.enemies.find(
      (entry) => entry.instanceId === resolvedTarget.instanceId
    )?.buffs ?? []
  );
}

function getStrengthFromBuffs(buffs: BuffInstance[]): number {
  return buffs
    .filter((buff) => buff.type === "STRENGTH")
    .reduce((total, buff) => total + buff.stacks, 0);
}

export function getPreviewEffectsForSelectedCard(
  definition: CardDefinition,
  upgraded: boolean,
  useInked: boolean,
  attackBonus: number
): Effect[] {
  const isUsingInkedVariant = Boolean(useInked && definition.inkedVariant);
  let effects = isUsingInkedVariant
    ? definition.inkedVariant!.effects
    : definition.effects;

  if (upgraded) {
    if (isUsingInkedVariant) {
      effects = boostEffectsForUpgrade(effects);
    } else if (definition.upgrade) {
      effects = definition.upgrade.effects;
    } else {
      effects = boostEffectsForUpgrade(effects);
    }
  }

  const effectiveAttackBonus = definition.type === "ATTACK" ? attackBonus : 0;
  if (effectiveAttackBonus <= 0) {
    return effects;
  }

  return effects.map((effect) =>
    effect.type === "DAMAGE"
      ? { ...effect, value: effect.value + effectiveAttackBonus }
      : effect
  );
}

export function buildIncomingDamagePreviewMap(
  combat: CombatState,
  definition: CardDefinition | null,
  effects: Effect[],
  selectedCardId: string | null
): Map<string, number> {
  const result = new Map<string, number>();
  if (!selectedCardId || !definition) return result;
  if (
    definition.targeting !== "SINGLE_ENEMY" &&
    definition.targeting !== "ALL_ENEMIES"
  ) {
    return result;
  }
  if (!effects.some((e) => e.type === "DAMAGE")) return result;

  for (const enemy of combat.enemies) {
    if (enemy.currentHp <= 0) continue;
    result.set(
      enemy.instanceId,
      computeIncomingDamageAgainstEnemy(
        effects,
        combat.player.strength,
        combat.player.buffs,
        enemy.block,
        enemy.buffs
      )
    );
  }

  return result;
}

function computeIncomingDamageAgainstEnemy(
  effects: Effect[],
  attackerStrength: number,
  attackerBuffs: CombatState["player"]["buffs"],
  targetBlock: number,
  targetBuffs: CombatState["enemies"][number]["buffs"]
): number {
  let totalHpLoss = 0;
  let tempBlock = Math.max(0, targetBlock);
  let tempStrength = attackerStrength;
  let tempTargetBuffs = targetBuffs;

  for (const effect of effects) {
    if (effect.type === "GAIN_STRENGTH") {
      tempStrength += effect.value;
      continue;
    }

    if (
      (effect.type === "APPLY_DEBUFF" || effect.type === "APPLY_BUFF") &&
      effect.buff
    ) {
      tempTargetBuffs = applyBuff(
        tempTargetBuffs,
        effect.buff,
        effect.value,
        effect.duration
      );
      continue;
    }

    if (effect.type === "DAMAGE") {
      const rawDamage = calculateDamage(
        effect.value,
        { strength: tempStrength, buffs: attackerBuffs },
        { buffs: tempTargetBuffs }
      );
      const blocked = Math.min(tempBlock, rawDamage);
      tempBlock -= blocked;
      totalHpLoss += Math.max(0, rawDamage - blocked);
    }
  }

  return Math.max(0, totalHpLoss);
}

export function resolveEnemyIntentTargetLabel(
  combat: CombatState,
  target:
    | "player"
    | "all_enemies"
    | "all_allies"
    | { type: "enemy"; instanceId: string }
    | { type: "ally"; instanceId: string },
  t: (key: string, options?: Record<string, unknown>) => string
): string | null {
  if (target === "player") return t("combat.you");
  if (target === "all_enemies") return t("combat.allEnemies");
  if (target === "all_allies") return t("combat.allAllies");
  if (target.type === "ally") {
    return (
      combat.allies.find((a) => a.instanceId === target.instanceId)?.name ??
      t("combat.ally")
    );
  }
  if (target.type === "enemy") {
    const enemy = combat.enemies.find(
      (e) => e.instanceId === target.instanceId
    );
    return enemy
      ? localizeEnemyName(enemy.definitionId, enemy.name)
      : t("combat.enemy");
  }
  return t("combat.you");
}

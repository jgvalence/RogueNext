"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import type { CombatState } from "@/game/schemas/combat-state";
import type { CombatFeedbackEvent } from "@/game/schemas/combat-feedback";
import {
  combatFeedbackDuration,
  combatFeedbackStagger,
} from "@/lib/combat-feedback-timing";
import { playSound, type SoundKey } from "@/lib/sound";
import "./combat-feedback.css";

type Point = { x: number; y: number; width: number };
type VisibleEffect = CombatFeedbackEvent &
  Point & { origin?: Point; token: number; duration: number; lane: number };

const COLORS: Record<CombatFeedbackEvent["kind"], string> = {
  hit: "#fff2b0",
  poison: "#a5ff55",
  poisonTick: "#a5ff55",
  bleed: "#ff6981",
  bleedTick: "#ff6981",
  armor: "#8dceff",
  heal: "#6fffb2",
  draw: "#ffdf9c",
  upgrade: "#ffd45c",
  buff: "#e0a0ff",
  debuff: "#bf92ff",
  skill: "#e0a0ff",
  ink: "#66edff",
};
const SOUNDS: Partial<Record<CombatFeedbackEvent["kind"], SoundKey>> = {
  hit: "ENEMY_HIT",
  poison: "POISON_FX",
  poisonTick: "POISON_FX",
  bleed: "BLEED_FX",
  bleedTick: "BLEED_FX",
  armor: "ARMOR_FX",
  heal: "HEAL_FX",
  draw: "CARD_DRAW",
  upgrade: "SKILL_FX",
  skill: "SKILL_FX",
  ink: "INK_FX",
};

function locate(target: string): Point | undefined {
  for (const element of document.querySelectorAll<HTMLElement>(
    "[data-fx-target]"
  )) {
    if (element.dataset.fxTarget !== target) continue;
    const r = element.getBoundingClientRect();
    if (
      r.width <= 0 ||
      r.height <= 0 ||
      r.bottom <= 0 ||
      r.top >= innerHeight ||
      r.right <= 0 ||
      r.left >= innerWidth
    )
      continue;
    return {
      x: r.x + r.width / 2,
      y: r.y + r.height / 2,
      width: Math.max(96, Math.min(210, r.width)),
    };
  }
  return undefined;
}

function Glyph({ kind }: { kind: CombatFeedbackEvent["kind"] }) {
  if (kind === "hit")
    return (
      <>
        <path
          className="fx-slash-glow"
          pathLength="1"
          d="M12 83 Q48 27 91 15 Q64 51 12 83"
        />
        <path
          className="fx-slash-core"
          pathLength="1"
          d="M15 81 Q54 40 88 18"
        />
        <path
          className="fx-impact"
          d="m50 20 5 24 22-8-17 17 18 15-25-9-8 22 1-27-22-4 23-3Z"
        />
      </>
    );
  if (kind === "poison" || kind === "poisonTick")
    return (
      <>
        <circle className="fx-wave" cx="50" cy="50" r="29" />
        {[25, 50, 75].map((x, i) => (
          <path
            key={x}
            className="fx-droplet"
            style={{ animationDelay: `${i * 40}ms` }}
            d={`M${x} 25 q-17 24 0 27 q17-3 0-27Z`}
          />
        ))}
        <circle className="fx-bubble" cx="36" cy="68" r="5" />
        <circle className="fx-bubble" cx="67" cy="67" r="7" />
      </>
    );
  if (kind === "bleed" || kind === "bleedTick")
    return (
      <>
        <path
          className="fx-slash-core"
          pathLength="1"
          d="m24 42 40-20m-35 34 40-20m-32 35 35-20"
        />
        <path className="fx-droplet" d="M55 44q-23 32 0 37q23-5 0-37Z" />
      </>
    );
  if (kind === "armor")
    return (
      <>
        <path
          className="fx-shield"
          d="M50 12 80 24v24Q78 73 50 89 22 73 20 48V24Z"
        />
        <path className="fx-mark" d="M50 27v42M34 47h32" />
      </>
    );
  if (kind === "heal")
    return (
      <>
        <path
          className="fx-rise"
          d="M43 24h14v19h19v14H57v19H43V57H24V43h19Z"
        />
        <path className="fx-sparks" d="M17 24v14m-7-7h14m58 29v14m-7-7h14" />
      </>
    );
  if (kind === "draw")
    return (
      <>
        <rect
          className="fx-card-back"
          x="22"
          y="18"
          width="38"
          height="52"
          rx="5"
        />
        <rect className="fx-rise" x="39" y="30" width="38" height="52" rx="5" />
        <path d="m50 59 9-13 9 13m-9-13v26" />
      </>
    );
  if (kind === "upgrade")
    return (
      <>
        <path
          className="fx-star"
          d="m50 7 10 28 30 5-23 19 7 30-24-17-25 17 8-30L10 40l30-5Z"
        />
        <path className="fx-mark" d="m38 54 12-13 12 13m-12-13v28" />
      </>
    );
  if (kind === "debuff")
    return (
      <>
        <circle className="fx-wave" cx="50" cy="50" r="34" />
        <path className="fx-rise" d="m26 30 24 20 24-20M26 53l24 20 24-20" />
      </>
    );
  if (kind === "buff")
    return (
      <>
        <circle className="fx-wave" cx="50" cy="50" r="34" />
        <path className="fx-rise" d="m26 47 24-20 24 20M26 70l24-20 24 20" />
      </>
    );
  return (
    <>
      <circle className="fx-rune" cx="50" cy="50" r="33" />
      <path className="fx-rune" d="m50 8 36 63H14ZM19 30h62L50 91Z" />
      <path
        className="fx-mark"
        d={
          kind === "ink"
            ? "M56 20 34 58l5 17 15-9 19-41ZM34 58l20 8"
            : "m50 30 5 15 15 5-15 5-5 15-5-15-15-5 15-5Z"
        }
      />
    </>
  );
}

export function CombatFeedbackLayer({ combat }: { combat: CombatState }) {
  const { t } = useTranslation();
  // Hydration/reopening a save must never replay its presentation history.
  const seen = useRef(combat.feedback?.sequence ?? 0);
  const serial = useRef(0);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const lastSound = useRef(0);
  const [visible, setVisible] = useState<VisibleEffect[]>([]);
  useEffect(
    () => () => {
      for (const timer of timers.current) clearTimeout(timer);
      timers.current.clear();
    },
    []
  );
  useEffect(() => {
    const journal = combat.feedback;
    if (!journal) return;
    if (journal.sequence < seen.current) seen.current = 0;
    const fresh = journal.events.filter((e) => e.id > seen.current);
    seen.current = journal.sequence;
    const perTarget = new Map<string, number>();
    const schedule = (fn: () => void, delay: number) => {
      const timer = setTimeout(() => {
        timers.current.delete(timer);
        fn();
      }, delay);
      timers.current.add(timer);
    };
    // A shield/heal/etc. is clearer than a second generic rune over the same target.
    const specific = fresh.filter(
      (event) =>
        event.kind !== "skill" ||
        !fresh.some(
          (other) => other.target === event.target && other.kind !== "skill"
        )
    );
    for (const event of specific) {
      const index = perTarget.get(event.target) ?? 0;
      perTarget.set(event.target, index + 1);
      const delay = combatFeedbackStagger(index);
      schedule(() => {
        const point = locate(event.target);
        if (!point) return;
        const effect: VisibleEffect = {
          ...event,
          ...point,
          token: ++serial.current,
          duration: combatFeedbackDuration(),
          lane: index % 3,
          origin: event.source ? locate(event.source) : undefined,
        };
        setVisible((old) => [...old, effect].slice(-48));
        const sound =
          event.target === "player" && event.kind === "hit"
            ? "PLAYER_HIT"
            : SOUNDS[event.kind];
        if (sound && performance.now() - lastSound.current > 65) {
          playSound(sound, 0.45);
          lastSound.current = performance.now();
        }
        schedule(
          () =>
            setVisible((old) => old.filter((e) => e.token !== effect.token)),
          effect.duration
        );
      }, delay);
    }
  }, [combat.feedback]);
  if (typeof document === "undefined" || !visible.length) return null;
  return createPortal(
    <div className="combat-feedback-layer" aria-hidden="true">
      {visible.map((effect) => (
        <div
          key={effect.token}
          data-combat-fx={effect.kind}
          data-fx-event={effect.id}
          data-fx-target-id={effect.target}
          className={`combat-fx combat-fx-${effect.kind}`}
          style={
            {
              left: effect.x,
              top: effect.y,
              width: effect.width,
              height: effect.width * 0.7,
              "--fx-color": COLORS[effect.kind],
              "--fx-duration": `${effect.duration}ms`,
              "--fx-angle": `${effect.id % 2 ? -10 : 10}deg`,
            } as CSSProperties
          }
        >
          <svg viewBox="0 0 100 100" className="combat-fx-glyph">
            <Glyph kind={effect.kind} />
          </svg>
          <span
            className="combat-fx-caption"
            style={{ marginTop: effect.lane * 23 }}
          >
            {t(`combat.feedback.${effect.kind}`)}
            {effect.amount !== undefined && effect.amount > 0
              ? ` ${["hit", "poisonTick", "bleedTick"].includes(effect.kind) ? "−" : "+"}${effect.amount}`
              : ""}
            {effect.blocked
              ? ` · ${t("combat.feedback.absorbed", { count: effect.blocked })}`
              : ""}
          </span>
        </div>
      ))}
      {visible
        .filter(
          (e) =>
            e.origin &&
            e.source !== e.target &&
            (e.kind === "hit" || e.kind === "ink")
        )
        .map((e) => (
          <svg
            key={`trail-${e.token}`}
            className="combat-fx-trail"
            style={{ "--fx-duration": `${e.duration}ms` } as CSSProperties}
          >
            <path
              d={`M${e.origin!.x} ${e.origin!.y} Q${(e.origin!.x + e.x) / 2} ${Math.min(e.origin!.y, e.y) - 35} ${e.x} ${e.y}`}
            />
          </svg>
        ))}
    </div>,
    document.fullscreenElement ?? document.body
  );
}

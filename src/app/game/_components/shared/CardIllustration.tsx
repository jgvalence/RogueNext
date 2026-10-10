import { useId } from "react";
import type { CardDefinition } from "@/game/schemas/cards";
import type { BiomeType } from "@/game/schemas/enums";

// A small engraved vocabulary for cards without bespoke art. Original card
// illustrations remain preferred. The symbol follows mechanics, never rarity.
const palettes: Record<BiomeType, [string, string, string]> = {
  LIBRARY: ["#192b39", "#d6bb7f", "#73bcca"],
  VIKING: ["#182e42", "#bdd8de", "#73bcca"],
  GREEK: ["#283442", "#e2cfac", "#a3c7de"],
  EGYPTIAN: ["#382b23", "#e0ba73", "#89b6a5"],
  LOVECRAFTIAN: ["#292338", "#b6a0cb", "#76b19e"],
  AZTEC: ["#24382f", "#cdaf70", "#79b495"],
  CELTIC: ["#27352d", "#c1cb91", "#8eb397"],
  RUSSIAN: ["#252f43", "#d7d7df", "#8bbacb"],
  AFRICAN: ["#3c2a27", "#deb574", "#bd8277"],
};

const engravings = {
  blade:
    "M83 108L161 23L151 66L99 121ZM83 108L99 121M69 112L105 143M81 127L60 150M53 147L62 156M107 82L127 62",
  shield:
    "M110 30L154 48L149 97Q139 125 110 144Q81 125 71 97L66 48ZM110 44L139 57L135 94Q128 115 110 128Q92 115 85 94L81 57ZM110 58V110M89 83H131",
  book: "M110 55Q78 36 49 49L55 124Q84 113 110 131Q136 113 165 124L171 49Q142 36 110 55ZM110 55V131M62 65Q84 58 99 69M63 80Q83 73 99 84M64 96Q83 89 99 100M122 69Q144 58 158 65M122 84Q144 73 157 80M122 100Q142 89 156 96",
  quill:
    "M70 141Q92 91 151 28Q178 80 103 117L89 116M79 126L146 42M102 95L105 65M117 81L147 77M89 118L65 118L60 145L81 145Z",
  poison:
    "M94 29H127V42H122V71L146 113Q160 143 111 148Q62 143 76 113L99 71V42H94ZM83 110Q107 98 140 110M100 53H120M96 125L103 120M123 130L128 124M109 89L115 83",
  blood:
    "M111 29Q102 60 82 82Q48 124 90 144Q128 165 149 127Q161 99 137 74Q118 49 111 29ZM92 100Q77 122 97 132M116 61L127 79",
  flame:
    "M111 25Q122 68 146 79Q141 96 132 102Q156 90 156 114Q154 148 113 150Q73 145 68 118Q61 93 88 69Q80 98 101 101Q121 72 111 25ZM112 111Q87 134 114 142Q138 133 112 111Z",
  eye: "M41 88Q107 19 179 88Q111 151 41 88ZM65 88Q110 42 155 88Q110 129 65 88ZM110 61A27 27 0 1 0 111 61ZM110 73V103M110 24V39M110 137V152M48 35L63 51M158 125L172 140M170 35L156 51M62 125L48 140",
  hourglass:
    "M77 28H145V43H135Q135 72 116 88Q136 107 136 135H145V148H77V135H85Q85 107 104 88Q85 72 85 43H77ZM88 43H133M88 135H133M95 60L110 79L125 60ZM96 126L110 105L124 126Z",
  drum: "M70 67Q110 49 153 67L142 130Q111 152 79 130ZM70 67Q108 87 153 67M79 130Q110 116 142 130M80 75L99 135L123 78L134 134M53 34L92 55M128 52L165 25M47 31L56 39M162 21L169 29",
  thread:
    "M58 54Q110 11 161 55L110 144ZM58 54Q110 79 161 55M78 92Q110 66 144 92M96 120Q110 99 124 120M110 31V144M57 55L36 38M162 55L184 38M110 144V162",
  crown:
    "M64 120L49 52L88 76L110 31L133 76L172 52L156 120ZM64 120H156V137H64ZM85 105L78 81M110 112V70M135 105L143 81",
};

function getMotif(card: CardDefinition): keyof typeof engravings {
  const effects = card.effects;
  if (effects.some((e) => e.type === "RHYTHM_REWARD")) return "drum";
  if (effects.some((e) => e.type === "TAKE_ENERGY_DEBT")) return "hourglass";
  if (effects.some((e) => e.buff === "POISON" || e.type === "DOUBLE_POISON"))
    return "poison";
  if (effects.some((e) => e.buff === "BLEED")) return "blood";
  if (
    effects.some((e) => e.type.startsWith("UPGRADE_") || e.type === "GAIN_INK")
  )
    return "quill";
  if (effects.some((e) => e.type.includes("EXHAUST"))) return "flame";
  if (
    effects.some((e) => e.type.includes("RETAIN") || e.type.includes("DISCARD"))
  )
    return "thread";
  if (
    effects.some((e) => e.type.includes("DRAW") || e.type.includes("ARCHIVE"))
  )
    return "book";
  if (effects.some((e) => e.type.includes("BLOCK") || e.type === "HEAL"))
    return "shield";
  if (card.type === "POWER") return "crown";
  if (card.type === "ATTACK") return "blade";
  return "eye";
}

export function CardIllustration({
  definition,
  className,
}: {
  definition: CardDefinition;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  const [shadow, parchment, light] =
    palettes[definition.biome] ?? palettes.LIBRARY;
  const motif = getMotif(definition);
  const stamp = [...definition.id].reduce(
    (value, char) => value + char.charCodeAt(0),
    0
  );
  return (
    <svg
      viewBox="0 0 220 170"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      className={className}
      data-card-motif={motif}
    >
      <defs>
        <radialGradient id={`${id}-light`}>
          <stop stopColor={light} stopOpacity=".24" />
          <stop offset="1" stopColor={shadow} />
        </radialGradient>
        <linearGradient id={`${id}-ink`} x2=".8" y2="1">
          <stop stopColor={parchment} />
          <stop offset="1" stopColor={light} />
        </linearGradient>
      </defs>
      <path fill={shadow} d="M0 0H220V170H0Z" />
      <path fill={`url(#${id}-light)`} d="M0 0H220V170H0Z" />
      <g fill="none" stroke={parchment} opacity=".14">
        <circle cx="110" cy="86" r="67" />
        <circle cx="110" cy="86" r="73" strokeDasharray="1 5" />
        <path d="M0 148L110 14L220 148M0 157H220M15 0V170M205 0V170M0 85H220" />
        <path d="M24 170V62Q24 4 69 4M196 170V62Q196 4 151 4" strokeWidth="8" />
      </g>
      <ellipse cx="110" cy="149" rx="49" ry="7" fill="#03070c" opacity=".6" />
      <path
        d={engravings[motif]}
        transform="translate(2 3)"
        fill={shadow}
        stroke="#03070c"
        strokeWidth="8"
        strokeLinejoin="round"
      />
      <path
        d={engravings[motif]}
        fill={shadow}
        fillOpacity=".75"
        stroke={`url(#${id}-ink)`}
        strokeWidth="2.8"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <g fill={parchment} opacity=".65">
        {[0, 1, 2, 3, 4].map((i) => (
          <circle
            key={i}
            cx={24 + ((stamp * (i + 1)) % 173)}
            cy={14 + ((stamp + i * 31) % 140)}
            r={i % 2 ? 1 : 1.6}
          />
        ))}
      </g>
      <path
        d="M8 18V8H23M197 8H212V18M8 152V162H23M197 162H212V152"
        fill="none"
        stroke={parchment}
        opacity=".35"
      />
    </svg>
  );
}

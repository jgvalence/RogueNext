import { useId } from "react";

const identities: Record<string, [string, string, string]> = {
  scribe: ["#294c69", "#82b7cc", "#cfb277"],
  bibliothecaire: ["#4e3c61", "#b1a4cc", "#dbc69b"],
  griot: ["#614230", "#d6a568", "#92af8d"],
  fou: ["#573341", "#c1888f", "#c5b692"],
};

/** Lightweight engraved portraits, shared by selection and battlefield. */
export function CharacterPortrait({
  identity = "scribe",
  className,
}: {
  identity?: string;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  const [cloak, light, gold] = identities[identity] ?? identities.scribe!;
  const isGriot = identity === "griot";
  const isFou = identity === "fou";
  return (
    <svg
      viewBox="0 0 180 220"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${id}-robe`} x2="1" y2="1">
          <stop stopColor={light} />
          <stop offset=".3" stopColor={cloak} />
          <stop offset="1" stopColor="#0b1420" />
        </linearGradient>
        <radialGradient id={`${id}-halo`}>
          <stop stopColor={light} stopOpacity=".2" />
          <stop offset="1" stopColor={light} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="90" cy="98" r="88" fill={`url(#${id}-halo)`} />
      <circle
        cx="90"
        cy="86"
        r="60"
        fill="none"
        stroke={gold}
        strokeOpacity=".23"
      />
      <path
        d="M30 205Q35 127 63 110L117 110Q146 125 151 205Q94 223 30 205Z"
        fill={`url(#${id}-robe)`}
        stroke={gold}
        strokeOpacity=".35"
      />
      <path
        d="M62 129L45 198M78 135L72 207M104 134L113 208M122 127L136 196"
        stroke={light}
        opacity=".22"
        fill="none"
      />
      <path
        d="M59 85Q52 40 90 24Q131 40 122 85L116 117L91 132L63 114Z"
        fill={cloak}
        stroke={gold}
        strokeWidth="1.5"
      />
      <path
        d="M67 75Q67 48 90 43Q115 48 115 76L108 104L91 116L73 105Z"
        fill={isGriot ? "#654838" : "#b19982"}
      />
      <path d="M68 77Q66 53 90 43Q114 53 115 77L91 66Z" fill="#101923" />
      <path
        d="M76 83L84 85M99 85L106 83M85 100Q91 103 97 99"
        fill="none"
        stroke="#1b222a"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M62 112L91 132L116 113M54 131L88 155L129 130"
        stroke={gold}
        fill="none"
        strokeWidth="2"
      />
      <circle cx="90" cy="148" r="5" fill={gold} />
      {identity === "bibliothecaire" && (
        <g stroke={gold} fill="none">
          <circle cx="79" cy="83" r="9" />
          <circle cx="103" cy="83" r="9" />
          <path d="M88 82H94" />
        </g>
      )}
      {isFou && (
        <path
          d="M59 79L35 28L74 49L99 13L118 56L152 35L122 89L106 63L91 67L73 64Z"
          fill={cloak}
          stroke={gold}
          strokeWidth="1.5"
        />
      )}
      {isGriot ? (
        <g stroke={gold} strokeWidth="2">
          <path
            d="M58 163Q89 146 121 163L116 202Q89 215 65 202Z"
            fill={cloak}
          />
          <ellipse cx="90" cy="163" rx="31" ry="9" fill="#bdad8a" />
          <path d="M68 173L80 203L91 176L102 203L114 173" fill="none" />
        </g>
      ) : (
        <g stroke={gold} strokeWidth="1.5">
          <path
            d="M41 158L86 170L130 156L125 191L85 207L46 193Z"
            fill="#b9b29a"
          />
          <path
            d="M86 170L85 207M52 169L77 179M54 178L76 188M96 179L119 169M96 188L118 179"
            fill="none"
            stroke="#56636b"
          />
        </g>
      )}
      <path
        d="M141 167L156 102Q171 81 167 72Q147 80 148 103L138 173"
        fill={light}
        stroke={gold}
      />
      <path
        d="M47 153L62 164M118 160L132 153"
        fill="none"
        stroke={isGriot ? "#805c41" : "#b19982"}
        strokeWidth="10"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AllyPortrait({
  identity,
  className,
}: {
  identity: string;
  className?: string;
}) {
  if (identity.includes("familiar") || identity === "index_raven") {
    return (
      <svg
        viewBox="0 0 180 220"
        aria-hidden="true"
        focusable="false"
        className={className}
      >
        <ellipse cx="90" cy="202" rx="55" ry="9" fill="#06121d" />
        <path
          d="M32 173Q8 131 25 91L61 122Q71 78 92 94Q111 78 123 122L156 91Q175 148 139 176L123 197L62 197Z"
          fill={identity === "venom_familiar" ? "#26483c" : "#243c51"}
          stroke="#81b9bc"
          strokeWidth="2"
        />
        <path
          d="M65 148L82 154M101 154L118 148"
          stroke="#b8e3cd"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M84 170L92 178L100 170M30 153L55 165M128 165L151 146"
          fill="none"
          stroke="#8cafa4"
          strokeWidth="2"
        />
        <path
          d="M64 193L55 204M116 193L125 204"
          stroke="#d0b781"
          strokeWidth="3"
        />
      </svg>
    );
  }
  if (identity === "ward_knight")
    return (
      <svg
        viewBox="0 0 180 220"
        aria-hidden="true"
        focusable="false"
        className={className}
      >
        <path
          d="M34 208L45 115L70 99H114L140 122L151 208Z"
          fill="#273c4b"
          stroke="#7595a2"
          strokeWidth="2"
        />
        <path
          d="M65 97V55L91 36L118 55V97L92 119Z"
          fill="#83969c"
          stroke="#d6cba8"
          strokeWidth="2"
        />
        <path
          d="M74 70H109V79H74ZM90 80V105"
          fill="#15222c"
          stroke="#15222c"
          strokeWidth="3"
        />
        <path
          d="M40 122L89 140L79 183L53 211L28 180L21 140Z"
          fill="#314e5c"
          stroke="#c7b68a"
          strokeWidth="3"
        />
        <path
          d="M52 145V188M34 164H71M134 103V195M122 132H148"
          fill="none"
          stroke="#c7b68a"
          strokeWidth="3"
        />
      </svg>
    );
  return (
    <CharacterPortrait
      identity={identity === "scribe_apprentice" ? "scribe" : "bibliothecaire"}
      className={className}
    />
  );
}

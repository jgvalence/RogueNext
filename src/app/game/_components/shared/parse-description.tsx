import type { JSX } from "react";
import { Tooltip } from "./Tooltip";
import { buffMeta, buffLabelToKey } from "./buff-meta";

const labels = Object.keys(buffLabelToKey);
const escapedLabels = labels.map((l) =>
  l.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
);
const buffRegex = new RegExp(`(${escapedLabels.join("|")})`, "g");

/**
 * Parse a card description string and wrap recognized buff/debuff names
 * in Tooltip components showing their game effect.
 */
export function parseDescriptionWithTooltips(description: string): JSX.Element {
  const parts = description.split(buffRegex);

  return (
    <>
      {parts.map((part, i) => {
        const buffKey = buffLabelToKey[part];
        if (!buffKey) return <span key={i}>{part}</span>;

        const meta = buffMeta[buffKey];
        if (!meta) return <span key={i}>{part}</span>;

        return (
          <Tooltip
            key={i}
            content={
              <span>
                <span className="font-bold">{meta.label}</span>
                <br />
                {meta.description(1)}
              </span>
            }
          >
            <span
              className={`cursor-help rounded px-0.5 font-semibold ${meta.color}`}
            >
              {part}
            </span>
          </Tooltip>
        );
      })}
    </>
  );
}

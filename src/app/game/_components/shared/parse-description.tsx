import type { JSX } from "react";
import { Tooltip } from "./Tooltip";
import { buffMeta, getBuffLabelToKeyMap } from "./buff-meta";

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function parseDescriptionWithTooltips(description: string): JSX.Element {
  const buffLabelToKey = getBuffLabelToKeyMap();
  const labels = Object.keys(buffLabelToKey);

  if (labels.length === 0) {
    return <>{description}</>;
  }

  const buffRegex = new RegExp(`(${labels.map(escapeRegex).join("|")})`, "g");
  const parts = description.split(buffRegex);

  return (
    <>
      {parts.map((part, i) => {
        const buffKey = buffLabelToKey[part];
        if (!buffKey) return <span key={i}>{part}</span>;

        const meta = buffMeta[buffKey];
        if (!meta) return <span key={i}>{part}</span>;

        const label = meta.label();
        const helpText = meta.description(1);

        return (
          <Tooltip
            key={i}
            content={
              <span>
                <span className="font-bold">{label}</span>
                <br />
                {helpText}
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

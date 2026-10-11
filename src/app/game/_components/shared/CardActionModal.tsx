"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { CardDefinition, CardUpgradeBranch } from "@/game/schemas/cards";
import { RogueButton, RogueModal } from "@/components/ui/rogue";
import { GameCard } from "../combat/GameCard";

type CardActionModalProps = {
  card: CardDefinition;
  actionLabel: string;
  onCancel: () => void;
} & (
  | { mode: "pick"; onAction: () => void }
  | { mode: "upgrade"; onAction: (branch: CardUpgradeBranch) => void }
);

export function CardActionModal(props: CardActionModalProps) {
  const { card, actionLabel, onCancel } = props;
  const { t } = useTranslation();
  const [branch, setBranch] = useState<CardUpgradeBranch | null>("A");
  const isUpgrade = props.mode === "upgrade";

  return (
    <RogueModal
      open
      centered
      zIndex={1200}
      className="card-action-modal"
      title={actionLabel}
      width={560}
      onCancel={onCancel}
      footer={
        <div className="card-action-footer">
          <RogueButton onClick={onCancel}>{t("common.back")}</RogueButton>
          <RogueButton
            type="primary"
            disabled={isUpgrade && branch === null}
            onClick={() => {
              if (props.mode === "pick") props.onAction();
              else if (branch) props.onAction(branch);
            }}
          >
            {actionLabel}
            {isUpgrade && branch ? ` ${branch}` : ""}
          </RogueButton>
        </div>
      }
    >
      {isUpgrade && (
        <div
          className="card-variant-options"
          role="group"
          aria-label={actionLabel}
        >
          {([null, "A", "B"] as const).map((variant) => (
            <RogueButton
              key={variant ?? "current"}
              aria-pressed={branch === variant}
              onClick={() => setBranch(variant)}
            >
              {variant
                ? `${t("gameCard.labels.upgraded")} ${variant}`
                : t("gameCard.labels.current")}
            </RogueButton>
          ))}
        </div>
      )}
      <GameCard
        definition={card}
        size="lg"
        reading
        upgraded={isUpgrade && branch !== null}
        upgradeBranch={branch ?? "A"}
      />
    </RogueModal>
  );
}

"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { CardDefinition } from "@/game/schemas/cards";
import { CARD_IMAGES } from "@/lib/assets";
import { CardIllustration } from "./CardIllustration";
import { RogueButton, RogueModal } from "@/components/ui/rogue";
import { localizeCardName } from "@/lib/i18n/card-text";

/** Shared by hand, collection, rewards, shop and enlarged card reading. */
export function CardArtwork({
  definition,
  className,
  thumbnail = false,
  allowZoom = false,
}: {
  definition: CardDefinition;
  className?: string;
  thumbnail?: boolean;
  allowZoom?: boolean;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [failedFullSource, setFailedFullSource] = useState<string | null>(null);
  const original = CARD_IMAGES[definition.id];
  const source =
    thumbnail && original?.endsWith(".webp")
      ? original.replace(/\.webp$/, "-thumb.webp")
      : original;
  const [failedSource, setFailedSource] = useState<string | null>(null);

  if (!original || !source || failedSource === source) {
    return <CardIllustration definition={definition} className={className} />;
  }

  return (
    <>
      {/* The surrounding card supplies its localized accessible name. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={source}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        width={thumbnail ? 288 : 768}
        height={thumbnail ? 192 : 512}
        className={className}
        onError={() => setFailedSource(source)}
      />
      {(allowZoom || open) && original.endsWith(".webp") && (
        <div
          onClick={(event) => event.stopPropagation()}
          onDoubleClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          {allowZoom && (
            <RogueButton
              type="text"
              className="card-art-zoom"
              aria-label={`${t("visual.viewIllustration")}: ${localizeCardName(definition, t)}`}
              onClick={() => setOpen(true)}
            >
              <span className="card-art-zoom-label">{t("visual.illustration")}</span>
              <span aria-hidden="true">↗</span>
            </RogueButton>
          )}
          {open && (
            <RogueModal
              open
              className="card-art-viewer"
              title={localizeCardName(definition, t)}
              width="min(1200px, calc(100vw - 24px))"
              centered
              onCancel={() => setOpen(false)}
              footer={
                <RogueButton onClick={() => setOpen(false)}>
                  {t("visual.closeIllustration")}
                </RogueButton>
              }
            >
              {/* The full image is requested only when the viewer is opened. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  failedFullSource === original
                    ? original
                    : original.replace(/\.webp$/, "-full.webp")
                }
                alt={localizeCardName(definition, t)}
                width={1536}
                height={1024}
                decoding="async"
                onError={() => setFailedFullSource(original)}
                className="card-art-full"
              />
            </RogueModal>
          )}
        </div>
      )}
    </>
  );
}

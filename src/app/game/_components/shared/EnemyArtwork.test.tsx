import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EnemyArtwork } from "./EnemyArtwork";
import { getEnemyImageSrc, getEnemyFallbackSrc } from "@/lib/assets";

describe("EnemyArtwork", () => {
  it("tries the old artwork before reporting a missing enemy image, then recovers for a different enemy", () => {
    const failure = vi.fn();
    const { container, rerender } = render(
      <EnemyArtwork enemyId="fenrir" onError={failure} />
    );
    const img = container.querySelector("img")!;
    expect(img.getAttribute("src")).toBe(getEnemyImageSrc("fenrir"));
    fireEvent.error(img);
    expect(img.getAttribute("src")).toBe(getEnemyFallbackSrc("fenrir"));
    expect(failure).not.toHaveBeenCalled();
    fireEvent.error(img);
    expect(failure).toHaveBeenCalledOnce();
    rerender(<EnemyArtwork enemyId="medusa" onError={failure} />);
    expect(img.getAttribute("src")).toBe(getEnemyImageSrc("medusa"));
  });
  it("prioritizes paintings over legacy aliases and keeps the matching fallback", () => {
    expect(getEnemyImageSrc("osiris_judgment")).toContain(
      "osiris_judgment.webp"
    );
    expect(getEnemyFallbackSrc("osiris_judgment")).toBe(
      "/images/enemies/osiris_eye.svg"
    );
    expect(getEnemyImageSrc("draugr", "thumb")).toContain(
      "bestiary_normal_draugr-thumb.webp"
    );
  });
});

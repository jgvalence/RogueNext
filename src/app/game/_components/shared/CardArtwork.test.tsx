import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { starterCardDefinitions } from "@/game/data/starter-deck";
import { CardArtwork } from "./CardArtwork";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) =>
      options?.defaultValue ?? key,
  }),
}));

describe("CardArtwork", () => {
  const strike = starterCardDefinitions.find((card) => card.id === "strike")!;
  const defend = starterCardDefinitions.find((card) => card.id === "defend")!;

  it("recovers from a missing thumbnail and can display a different card afterwards", () => {
    const { container, rerender } = render(
      <CardArtwork definition={strike} thumbnail />
    );
    const image = container.querySelector("img")!;
    expect(image.src).toContain("strike-thumb.webp");
    fireEvent.error(image);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("svg")).not.toBeNull();
    rerender(<CardArtwork definition={defend} thumbnail />);
    expect(container.querySelector("img")?.src).toContain("defend-thumb.webp");
  });

  it("opens the full artwork without playing the surrounding card", () => {
    const play = vi.fn();
    render(
      <div onClick={play}>
        <CardArtwork definition={strike} allowZoom />
      </div>
    );
    expect(document.querySelector('img[src$="-full.webp"]')).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: /visual.viewIllustration/ })
    );
    expect(
      document.querySelector('img[src$="strike-full.webp"]')
    ).not.toBeNull();
    expect(play).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole("button", { name: "visual.closeIllustration" })
    );
    expect(document.querySelector('img[src$="-full.webp"]')).toBeNull();
    expect(play).not.toHaveBeenCalled();
  });

  it("keeps artwork open when the desktop card stops being hovered", () => {
    const { rerender } = render(<CardArtwork definition={strike} allowZoom />);
    fireEvent.click(
      screen.getByRole("button", { name: /visual.viewIllustration/ })
    );
    rerender(<CardArtwork definition={strike} allowZoom={false} />);
    expect(
      document.querySelector('img[src$="strike-full.webp"]')
    ).not.toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: "visual.closeIllustration" })
    );
    expect(document.querySelector('img[src$="-full.webp"]')).toBeNull();
  });
});

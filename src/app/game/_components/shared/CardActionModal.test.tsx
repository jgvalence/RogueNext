import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { buildCardDefsMap } from "@/game/data";
import { CardActionModal } from "./CardActionModal";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("@/components/ui/rogue", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/components/ui/rogue")>()),
  RogueModal: ({
    children,
    footer,
  }: {
    children: ReactNode;
    footer: ReactNode;
  }) => (
    <div role="dialog">
      {children}
      {footer}
    </div>
  ),
}));
vi.mock("../combat/GameCard", () => ({
  GameCard: ({
    upgraded,
    upgradeBranch,
  }: {
    upgraded: boolean;
    upgradeBranch: string;
  }) => <div data-testid="preview">{upgraded ? upgradeBranch : "base"}</div>,
}));

afterEach(cleanup);
const card = [...buildCardDefsMap().values()][0]!;

describe("card confirmation semantics", () => {
  it("shows only the base reward and confirms without an upgrade branch", () => {
    const onAction = vi.fn();
    render(
      <CardActionModal
        mode="pick"
        card={card}
        actionLabel="Choisir"
        onAction={onAction}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByTestId("preview").textContent).toBe("base");
    expect(screen.queryByRole("button", { name: /upgraded/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Choisir" }));
    expect(onAction).toHaveBeenCalledOnce();
    expect(onAction).toHaveBeenCalledWith();
  });

  it("returns to the offers without claiming or skipping a reward", () => {
    const onAction = vi.fn(),
      onCancel = vi.fn();
    render(
      <CardActionModal
        mode="pick"
        card={card}
        actionLabel="Choisir"
        onAction={onAction}
        onCancel={onCancel}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "common.back" }));
    expect(onCancel).toHaveBeenCalledOnce();
    expect(onAction).not.toHaveBeenCalled();
  });

  it("keeps both real upgrade branches and disables claiming the current card", () => {
    const onAction = vi.fn();
    render(
      <CardActionModal
        mode="upgrade"
        card={card}
        actionLabel="Améliorer"
        onAction={onAction}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByTestId("preview").textContent).toBe("A");
    fireEvent.click(
      screen.getByRole("button", { name: "gameCard.labels.current" })
    );
    expect(
      screen.getByRole("button", { name: "Améliorer" }).hasAttribute("disabled")
    ).toBe(true);
    fireEvent.click(
      screen.getByRole("button", { name: "gameCard.labels.upgraded B" })
    );
    expect(screen.getByTestId("preview").textContent).toBe("B");
    fireEvent.click(screen.getByRole("button", { name: "Améliorer B" }));
    expect(onAction).toHaveBeenCalledOnce();
    expect(onAction).toHaveBeenCalledWith("B");
  });
});

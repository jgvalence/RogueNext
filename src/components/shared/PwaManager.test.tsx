import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ButtonHTMLAttributes } from "react";
import { PwaManager } from "./PwaManager";

const route = vi.hoisted(() => ({ pathname: "/library" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("@/components/ui/rogue", () => ({
  RogueButton: (props: ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props} />
  ),
}));

let worker: EventTarget & {
  controller: object | null;
  getRegistration: ReturnType<typeof vi.fn>;
};
beforeEach(() => {
  route.pathname = "/library";
  worker = Object.assign(new EventTarget(), {
    controller: {},
    getRegistration: vi
      .fn()
      .mockResolvedValue({ update: vi.fn().mockResolvedValue(undefined) }),
  });
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: worker,
  });
});
afterEach(() => {
  Reflect.deleteProperty(navigator, "serviceWorker");
});

describe("PWA installation and updates", () => {
  it("defers an available update until the player leaves the expedition", () => {
    route.pathname = "/game/run-id";
    const view = render(<PwaManager />);
    act(() => worker.dispatchEvent(new Event("controllerchange")));
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    route.pathname = "/library";
    view.rerender(<PwaManager />);
    expect(
      screen.getByRole("button", { name: "pwa.update" })
    ).toBeInTheDocument();
  });
  it("does not announce the first service worker installation as an update", () => {
    worker.controller = null;
    render(<PwaManager />);
    act(() => worker.dispatchEvent(new Event("controllerchange")));
    expect(screen.queryByText("pwa.updateReady")).not.toBeInTheDocument();
    act(() => worker.dispatchEvent(new Event("controllerchange")));
    expect(
      screen.getByRole("button", { name: "pwa.update" })
    ).toBeInTheDocument();
  });
  it("opens the browser installation prompt only after the user clicks", async () => {
    render(<PwaManager />);
    const prompt = vi.fn().mockResolvedValue(undefined);
    const event = Object.assign(
      new Event("beforeinstallprompt", { cancelable: true }),
      { prompt, userChoice: Promise.resolve({ outcome: "accepted" }) }
    );
    act(() => window.dispatchEvent(event));
    expect(event.defaultPrevented).toBe(true);
    expect(prompt).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "pwa.install" }));
    await waitFor(() => expect(prompt).toHaveBeenCalledOnce());
    await waitFor(() =>
      expect(screen.queryByRole("button")).not.toBeInTheDocument()
    );
  });
});

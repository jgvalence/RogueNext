import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { useTranslation } from "react-i18next";
import { afterEach, expect, it, vi } from "vitest";
import { I18nProvider } from "./I18nProvider";
import { i18n, setLocale } from "@/lib/i18n";

function Label() {
  const { t } = useTranslation();
  return <p>{t("menu.library")}</p>;
}

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  setLocale("fr");
});

it("restores English after hydrating the French server HTML without a mismatch", async () => {
  await i18n.changeLanguage("fr");
  const tree = (
    <I18nProvider>
      <Label />
    </I18nProvider>
  );
  const container = document.createElement("div");
  container.innerHTML = renderToString(tree);
  expect(container.textContent).toBe("Bibliothèque");
  localStorage.setItem("rogue-next-locale", "en");
  const onRecoverableError = vi.fn();
  let root: ReturnType<typeof hydrateRoot>;
  await act(async () => {
    root = hydrateRoot(container, tree, { onRecoverableError });
  });
  expect(container.textContent).toBe("Library");
  expect(document.documentElement.lang).toBe("en");
  expect(onRecoverableError).not.toHaveBeenCalled();
  await act(async () => root.unmount());
});

it("allows switching language when storage is blocked", () => {
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new DOMException("Blocked", "SecurityError");
  });
  expect(() => setLocale("en")).not.toThrow();
  expect(i18n.resolvedLanguage).toBe("en");
});

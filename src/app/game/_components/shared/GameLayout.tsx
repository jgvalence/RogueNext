"use client";

import { type ReactNode, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGame } from "../../_providers/game-provider";
import { setSoundsEnabled } from "@/lib/sound";
import { setMusicEnabled } from "@/lib/music";
import { setLocale, supportedLocales, type SupportedLocale } from "@/lib/i18n";
import { RogueButton, RogueModal, RogueTag } from "@/components/ui/rogue";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { relicDefinitions } from "@/game/data/relics";
import { DeckViewerModal } from "./DeckViewerModal";
import { RulesModal } from "./RulesModal";
import {
  localizeRelicDescription,
  localizeRelicName,
} from "@/lib/i18n/entity-text";

function formatRunDuration(totalMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(totalMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

interface GameLayoutProps {
  children: ReactNode;
  onAbandonRun?: () => void | Promise<void>;
}

export function GameLayout({ children, onAbandonRun }: GameLayoutProps) {
  const { t, i18n } = useTranslation();
  const { state, cardDefs } = useGame();
  const [muted, setMuted] = useState(false);
  const [showRelics, setShowRelics] = useState(false);
  const [showDeckViewer, setShowDeckViewer] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(() =>
    Math.max(0, Date.now() - (state.runStartedAtMs ?? Date.now()))
  );

  useEffect(() => {
    const syncFullscreenState = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    syncFullscreenState();
    document.addEventListener("fullscreenchange", syncFullscreenState);
    return () =>
      document.removeEventListener("fullscreenchange", syncFullscreenState);
  }, []);

  useEffect(() => {
    const runStart = state.runStartedAtMs ?? Date.now();
    const updateElapsed = () =>
      setElapsedMs(Math.max(0, Date.now() - runStart));
    updateElapsed();
    const interval = window.setInterval(updateElapsed, 1000);
    return () => window.clearInterval(interval);
  }, [state.runStartedAtMs]);

  const ownedRelics = state.relicIds
    .map((id) => relicDefinitions.find((r) => r.id === id))
    .filter((r): r is (typeof relicDefinitions)[number] => Boolean(r));
  const hpSource = state.combat?.player ?? {
    currentHp: state.playerCurrentHp,
    maxHp: state.playerMaxHp,
  };
  const hpRatio = hpSource.maxHp > 0 ? hpSource.currentHp / hpSource.maxHp : 0;
  const totalRooms = Math.max(1, state.map.length);
  const displayedRoom = Math.max(
    1,
    Math.min(state.currentRoom + 1, totalRooms)
  );
  const canRequestCombatEndTurn =
    state.combat?.phase === "PLAYER_TURN" &&
    (state.combat.pendingHandOverflowExhaust ?? 0) <= 0;

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    setSoundsEnabled(!next);
    setMusicEnabled(!next);
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }
      await document.documentElement.requestFullscreen();
    } catch {
      // Browser may block fullscreen when not allowed by user gesture/policy.
    }
  };

  const triggerMobileCombatAction = (
    action:
      | "open-ink"
      | "open-inventory"
      | "open-draw"
      | "open-discard"
      | "open-exhaust"
  ) => {
    window.dispatchEvent(
      new CustomEvent("game:mobile-combat-action", {
        detail: { action },
      })
    );
  };

  const requestCombatEndTurn = () => {
    window.dispatchEvent(new Event("game:end-turn-request"));
  };

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-slate-950 text-white">
      <div className="fixed inset-0 z-50 hidden flex-col items-center justify-center gap-6 bg-slate-950 sm:hidden portrait:flex">
        <div className="text-5xl font-black tracking-[0.2em]">
          {t("layout.rotate")}
        </div>
        <p className="text-xl font-bold text-white">
          {t("layout.rotateDevice")}
        </p>
        <p className="text-sm text-slate-400">{t("layout.rotateHint")}</p>
      </div>

      <div className="flex items-center justify-between border-b border-slate-700/60 bg-slate-900/90 px-2 py-1.5 backdrop-blur-sm sm:px-5 sm:py-2.5 [@media(max-height:540px)]:gap-2 [@media(max-height:540px)]:px-2 [@media(max-height:540px)]:py-1">
        <div className="flex items-center gap-2">
          <RogueTag
            bordered={false}
            className="rounded bg-slate-700 px-2.5 py-1 text-xs font-semibold uppercase tracking-widest text-slate-300"
          >
            {t("layout.floor", { floor: state.floor })}
          </RogueTag>
          <span className="text-xs text-slate-500 sm:text-sm">|</span>
          <span className="text-xs text-slate-400 sm:text-sm">
            {t("layout.room")}{" "}
            <span className="font-semibold text-slate-200">
              {displayedRoom}
            </span>
            <span className="text-slate-600">/{totalRooms}</span>
          </span>
          <span className="hidden text-xs text-slate-500 lg:inline lg:text-sm">
            |
          </span>
          <span className="hidden text-xs font-semibold text-cyan-300 lg:inline lg:text-sm">
            {t("layout.time", { value: formatRunDuration(elapsedMs) })}
          </span>
        </div>

        <div className="hidden flex-col items-center sm:flex [@media(max-height:540px)]:hidden">
          <span className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">
            Panlibrarium
          </span>
          {state.selectedDifficultyLevel !== null && (
            <span className="text-[10px] italic tracking-wide text-amber-800/70">
              {t(
                `runDifficulty.levels.${state.selectedDifficultyLevel}.chapter`
              )}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 [@media(max-height:540px)]:gap-1.5">
          <div className="hidden items-center gap-1.5 sm:flex [@media(max-height:540px)]:hidden">
            <span className="text-sm text-red-400">{t("layout.hp")}</span>
            <span
              className={`text-sm font-bold ${
                hpRatio <= 0.3
                  ? "text-red-400"
                  : hpRatio <= 0.6
                    ? "text-orange-300"
                    : "text-green-400"
              }`}
            >
              {hpSource.currentHp}
              <span className="text-slate-500">/{hpSource.maxHp}</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 [@media(max-height:540px)]:hidden">
            <span className="text-xs text-amber-400 sm:text-sm">
              {t("layout.gold")}
            </span>
            <span className="text-xs font-bold text-amber-300 sm:text-sm">
              {state.gold}
            </span>
          </div>

          {Object.entries(state.earnedResources ?? {}).some(
            ([, v]) => v > 0
          ) && (
            <div className="hidden items-center gap-1 sm:flex [@media(max-height:540px)]:hidden">
              {Object.entries(state.earnedResources ?? {})
                .filter(([, v]) => v > 0)
                .map(([key, val]) => (
                  <RogueTag
                    key={key}
                    bordered={false}
                    className="rounded bg-slate-700/60 px-1.5 py-0.5 text-xs text-amber-400/80"
                  >
                    {val} {key.charAt(0) + key.slice(1).toLowerCase()}
                  </RogueTag>
                ))}
            </div>
          )}

          <RogueButton
            onClick={() => setShowDeckViewer(true)}
            className="hidden !h-auto items-center gap-1.5 !rounded !border !border-slate-600/50 !bg-transparent !px-2 !py-1 transition hover:!border-slate-400 sm:!flex [@media(max-height:540px)]:!hidden"
            title={t("layout.viewDeck")}
          >
            <span className="text-xs text-slate-500">{t("layout.deck")}</span>
            <span className="text-sm font-semibold text-slate-200">
              {state.deck.length}
            </span>
          </RogueButton>
          <RogueButton
            onClick={toggleFullscreen}
            className="!h-auto !rounded !border !border-cyan-700/70 !bg-transparent !px-2 !py-1 !text-xs !font-semibold !text-cyan-200 transition hover:!border-cyan-400 hover:!text-white"
            title={t("layout.fullscreen")}
          >
            {isFullscreen ? t("layout.exitFullscreen") : t("layout.fullscreen")}
          </RogueButton>

          {state.combat && (
            <div className="flex items-center gap-1 lg:hidden">
              <div className="rounded border border-yellow-700/50 bg-yellow-950/30 px-1.5 py-1 text-[10px] font-black text-yellow-100">
                {t("combat.energy")} {state.combat.player.energyCurrent}
              </div>

              <RogueButton
                onClick={() => triggerMobileCombatAction("open-ink")}
                className="!h-auto !rounded !border !border-cyan-700/60 !bg-cyan-950/25 !px-1.5 !py-1 !text-[10px] !font-black !text-cyan-100"
              >
                {t("combat.ink")} {state.combat.player.inkCurrent}
              </RogueButton>

              <RogueButton
                onClick={() => triggerMobileCombatAction("open-inventory")}
                className="!h-auto !rounded !border !border-amber-700/60 !bg-slate-900/80 !px-1.5 !py-1 !text-[10px] !font-black !text-amber-200"
              >
                {t("combat.inventory")} {state.usableItems?.length ?? 0}
              </RogueButton>

              <RogueButton
                onClick={requestCombatEndTurn}
                disabled={!canRequestCombatEndTurn}
                className="!h-auto !rounded !border !border-emerald-300/30 !bg-emerald-600 !px-1.5 !py-1 !text-[10px] !font-black !uppercase !tracking-wide !text-white disabled:!cursor-not-allowed disabled:!border-slate-700 disabled:!bg-slate-700 disabled:!text-slate-500"
              >
                {t("combat.endTurn")}
              </RogueButton>
            </div>
          )}

          {state.relicIds.length > 0 && (
            <RogueButton
              onClick={() => setShowRelics((v) => !v)}
              className="!hidden !h-auto items-center gap-1.5 !rounded !border !border-purple-700/50 !bg-transparent !px-2 !py-1 hover:!border-purple-500/70 sm:!flex"
              title={t("layout.showRelics")}
            >
              <span className="text-xs text-purple-400">
                {t("layout.relics")}
              </span>
              <span className="text-sm font-semibold text-purple-300">
                {state.relicIds.length}
              </span>
            </RogueButton>
          )}
          <RogueButton
            onClick={() => setShowMenu(true)}
            className="!h-auto !rounded !border !border-slate-600 !bg-transparent !px-2 !py-1 !text-xs !font-semibold !text-slate-300 transition hover:!border-slate-400 hover:!text-white"
            title={t("layout.menu")}
          >
            {t("layout.menu")}
          </RogueButton>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">{children}</div>

      {showDeckViewer && (
        <DeckViewerModal
          deck={state.deck}
          cardDefs={cardDefs}
          onClose={() => setShowDeckViewer(false)}
        />
      )}

      {showRules && <RulesModal onClose={() => setShowRules(false)} />}

      {showMenu && (
        <RogueModal
          open
          onCancel={() => setShowMenu(false)}
          footer={null}
          centered
          destroyOnClose
          width={420}
          className="[&_.ant-modal-body]:!p-4 [&_.ant-modal-close]:!text-slate-300 [&_.ant-modal-content]:!rounded-xl [&_.ant-modal-content]:!border [&_.ant-modal-content]:!border-slate-700 [&_.ant-modal-content]:!bg-slate-900"
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-100">
              {t("layout.menu")}
            </h3>
            <RogueButton
              onClick={() => setShowMenu(false)}
              className="!h-auto !rounded !border !border-slate-600 !bg-transparent !px-2 !py-1 !text-xs !text-slate-300 hover:!border-slate-400"
            >
              {t("common.close")}
            </RogueButton>
          </div>

          <div className="space-y-2">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {t("common.language")}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {supportedLocales.map((locale) => {
                  const isActive = i18n.resolvedLanguage === locale;
                  return (
                    <RogueButton
                      key={locale}
                      onClick={() => setLocale(locale as SupportedLocale)}
                      className={`!h-auto !rounded !border !px-3 !py-2 !text-sm !font-semibold ${
                        isActive
                          ? "!border-slate-300 !bg-slate-200 !text-slate-900"
                          : "!border-slate-600 !bg-transparent !text-slate-200 hover:!border-slate-400"
                      }`}
                    >
                      {locale.toUpperCase()}
                    </RogueButton>
                  );
                })}
              </div>
            </div>

            {state.combat && (
              <div className="space-y-2 rounded border border-cyan-900/40 bg-slate-950/50 p-2 lg:hidden">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-cyan-300/80">
                  {t("combat.section")}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <RogueButton
                    onClick={() => {
                      triggerMobileCombatAction("open-draw");
                      setShowMenu(false);
                    }}
                    className="!h-auto !rounded !border !border-slate-500/70 !bg-slate-800 !px-2 !py-1.5 !text-left"
                  >
                    <p className="text-[10px] font-semibold uppercase text-slate-400">
                      {t("combat.draw")}
                    </p>
                    <p className="text-base font-black text-slate-100">
                      {state.combat.drawPile.length}
                    </p>
                  </RogueButton>

                  <RogueButton
                    onClick={() => {
                      triggerMobileCombatAction("open-discard");
                      setShowMenu(false);
                    }}
                    className="!h-auto !rounded !border !border-red-700/60 !bg-slate-800 !px-2 !py-1.5 !text-left"
                  >
                    <p className="text-[10px] font-semibold uppercase text-red-400/80">
                      {t("combat.discard")}
                    </p>
                    <p className="text-base font-black text-slate-100">
                      {state.combat.discardPile.length}
                    </p>
                  </RogueButton>

                  {state.combat.exhaustPile.length > 0 && (
                    <RogueButton
                      onClick={() => {
                        triggerMobileCombatAction("open-exhaust");
                        setShowMenu(false);
                      }}
                      className="!h-auto !rounded !border !border-purple-700/60 !bg-slate-800 !px-2 !py-1.5 !text-left"
                    >
                      <p className="text-[10px] font-semibold uppercase text-purple-400/80">
                        {t("combat.exhaust")}
                      </p>
                      <p className="text-base font-black text-slate-100">
                        {state.combat.exhaustPile.length}
                      </p>
                    </RogueButton>
                  )}
                </div>
              </div>
            )}

            {state.relicIds.length > 0 && (
              <RogueButton
                onClick={() => {
                  setShowRelics(true);
                  setShowMenu(false);
                }}
                className="!h-auto !w-full !rounded !border !border-purple-700/60 !bg-transparent !px-3 !py-2 !text-sm !font-semibold !text-purple-300 hover:!border-purple-500 hover:!text-purple-200"
              >
                {t("layout.relics")} ({state.relicIds.length})
              </RogueButton>
            )}

            <RogueButton
              onClick={() => {
                setShowRules(true);
                setShowMenu(false);
              }}
              className="!h-auto !w-full !rounded !border !border-slate-600 !bg-transparent !px-3 !py-2 !text-sm !font-semibold !text-slate-200 hover:!border-slate-400 hover:!text-white"
            >
              {t("home.rules")}
            </RogueButton>

            <RogueButton
              onClick={toggleMute}
              className="!h-auto !w-full !rounded !border !border-slate-600 !bg-transparent !px-3 !py-2 !text-sm !font-semibold !text-slate-200 hover:!border-slate-400 hover:!text-white"
            >
              {muted ? t("layout.unmute") : t("layout.mute")}
            </RogueButton>

            {onAbandonRun && (
              <RogueButton
                onClick={() => {
                  const confirmed = window.confirm(t("layout.abandonConfirm"));
                  if (!confirmed) return;
                  setShowMenu(false);
                  void onAbandonRun();
                }}
                className="!h-auto !w-full !rounded !border !border-red-700 !bg-transparent !px-3 !py-2 !text-sm !font-semibold !text-red-300 hover:!border-red-500 hover:!text-red-200"
              >
                {t("layout.abandonRun")}
              </RogueButton>
            )}

            <LogoutButton
              label={t("home.logout")}
              className="w-full rounded border border-slate-600 px-3 py-2 text-sm font-semibold text-slate-200 hover:border-slate-400 hover:text-white"
            />
          </div>
        </RogueModal>
      )}

      {showRelics && (
        <RogueModal
          open
          onCancel={() => setShowRelics(false)}
          footer={null}
          centered
          destroyOnClose
          width={860}
          className="[&_.ant-modal-body]:!p-4 [&_.ant-modal-close]:!text-slate-300 [&_.ant-modal-content]:!rounded-xl [&_.ant-modal-content]:!border [&_.ant-modal-content]:!border-slate-700 [&_.ant-modal-content]:!bg-slate-900"
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-100">
              {t("layout.yourRelics")}
            </h3>
            <RogueButton
              onClick={() => setShowRelics(false)}
              className="!h-auto !rounded !border !border-slate-600 !bg-transparent !px-2 !py-1 !text-xs !text-slate-300 hover:!border-slate-400"
            >
              {t("common.close")}
            </RogueButton>
          </div>

          {ownedRelics.length === 0 ? (
            <p className="text-sm text-slate-400">{t("layout.noRelicsYet")}</p>
          ) : (
            <div className="space-y-2">
              {ownedRelics.map((relic) => (
                <div
                  key={relic.id}
                  className="rounded border border-slate-700 bg-slate-950/60 p-3"
                >
                  <p className="text-sm font-semibold text-slate-100">
                    {localizeRelicName(relic.id, relic.name)}{" "}
                    <RogueTag className="ml-1 text-xs uppercase tracking-wide text-slate-400">
                      {relic.rarity}
                    </RogueTag>
                  </p>
                  <p className="text-sm text-slate-300">
                    {localizeRelicDescription(relic.id, relic.description)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </RogueModal>
      )}
    </div>
  );
}

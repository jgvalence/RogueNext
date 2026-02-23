"use client";

import { type ReactNode, useEffect, useState } from "react";
import { useGame } from "../../_providers/game-provider";
import { setSoundsEnabled } from "@/lib/sound";
import { setMusicEnabled } from "@/lib/music";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { relicDefinitions } from "@/game/data/relics";
import { DeckViewerModal } from "./DeckViewerModal";
import { RulesModal } from "./RulesModal";

interface GameLayoutProps {
  children: ReactNode;
}

export function GameLayout({ children }: GameLayoutProps) {
  const { state, cardDefs } = useGame();
  const [muted, setMuted] = useState(false);
  const [showRelics, setShowRelics] = useState(false);
  const [showDeckViewer, setShowDeckViewer] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const syncFullscreenState = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    syncFullscreenState();
    document.addEventListener("fullscreenchange", syncFullscreenState);
    return () =>
      document.removeEventListener("fullscreenchange", syncFullscreenState);
  }, []);

  const ownedRelics = state.relicIds
    .map((id) => relicDefinitions.find((r) => r.id === id))
    .filter((r): r is (typeof relicDefinitions)[number] => Boolean(r));

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

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-slate-950 text-white">
      <div className="fixed inset-0 z-50 hidden flex-col items-center justify-center gap-6 bg-slate-950 sm:hidden portrait:flex">
        <div className="text-5xl font-black tracking-[0.2em]">ROTATE</div>
        <p className="text-xl font-bold text-white">Rotate your device</p>
        <p className="text-sm text-slate-400">
          Panlibrarium requires landscape mode
        </p>
      </div>

      <div className="flex items-center justify-between border-b border-slate-700/60 bg-slate-900/90 px-2 py-1.5 backdrop-blur-sm sm:px-5 sm:py-2.5 [@media(max-height:540px)]:gap-2 [@media(max-height:540px)]:px-2 [@media(max-height:540px)]:py-1">
        <div className="flex items-center gap-2">
          <span className="rounded bg-slate-700 px-2.5 py-1 text-xs font-semibold uppercase tracking-widest text-slate-300">
            Floor {state.floor}
          </span>
          <span className="text-xs text-slate-500 sm:text-sm">|</span>
          <span className="text-xs text-slate-400 sm:text-sm">
            Room{" "}
            <span className="font-semibold text-slate-200">
              {state.currentRoom + 1}
            </span>
            <span className="text-slate-600">/{state.map.length}</span>
          </span>
        </div>

        <span className="hidden text-sm font-bold uppercase tracking-[0.2em] text-slate-500 sm:block [@media(max-height:540px)]:hidden">
          Panlibrarium
        </span>

        <div className="flex items-center gap-3 [@media(max-height:540px)]:gap-1.5">
          <div className="hidden items-center gap-1.5 sm:flex [@media(max-height:540px)]:hidden">
            <span className="text-sm text-red-400">HP</span>
            <span
              className={`text-sm font-bold ${
                state.playerCurrentHp / state.playerMaxHp <= 0.3
                  ? "text-red-400"
                  : state.playerCurrentHp / state.playerMaxHp <= 0.6
                    ? "text-orange-300"
                    : "text-green-400"
              }`}
            >
              {state.playerCurrentHp}
              <span className="text-slate-500">/{state.playerMaxHp}</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 [@media(max-height:540px)]:hidden">
            <span className="text-xs text-amber-400 sm:text-sm">Gold</span>
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
                  <span
                    key={key}
                    className="rounded bg-slate-700/60 px-1.5 py-0.5 text-xs text-amber-400/80"
                  >
                    {val} {key.charAt(0) + key.slice(1).toLowerCase()}
                  </span>
                ))}
            </div>
          )}

          <button
            onClick={() => setShowDeckViewer(true)}
            className="hidden items-center gap-1.5 rounded border border-slate-600/50 px-2 py-1 transition hover:border-slate-400 sm:flex [@media(max-height:540px)]:hidden"
            title="Voir le deck"
          >
            <span className="text-xs text-slate-500">Deck</span>
            <span className="text-sm font-semibold text-slate-200">
              {state.deck.length}
            </span>
          </button>

          <button
            onClick={() => setShowRules(true)}
            className="rounded border border-slate-600 px-2 py-1 text-xs font-semibold text-slate-300 transition hover:border-slate-400 hover:text-white [@media(max-height:540px)]:hidden"
            title="Voir les règles"
            type="button"
          >
            R&egrave;gles
          </button>

          <button
            onClick={toggleFullscreen}
            className="rounded border border-cyan-700/70 px-2 py-1 text-xs font-semibold text-cyan-200 transition hover:border-cyan-400 hover:text-white"
            title="Plein écran"
            type="button"
          >
            {isFullscreen ? "Quitter plein écran" : "Plein écran"}
          </button>

          {state.relicIds.length > 0 && (
            <button
              onClick={() => setShowRelics((v) => !v)}
              className="flex items-center gap-1.5 rounded border border-purple-700/50 px-2 py-1 hover:border-purple-500/70 [@media(max-height:540px)]:hidden"
              title="Show relics"
            >
              <span className="text-xs text-purple-400">Relics</span>
              <span className="text-sm font-semibold text-purple-300">
                {state.relicIds.length}
              </span>
            </button>
          )}

          <button
            onClick={toggleMute}
            title={muted ? "Unmute" : "Mute"}
            className="rounded border border-slate-600 px-2 py-1 text-xs font-semibold text-slate-300 transition hover:border-slate-400 hover:text-white [@media(max-height:540px)]:hidden"
          >
            {muted ? "Unmute" : "Mute"}
          </button>

          <LogoutButton
            label="Logout"
            className="rounded border border-slate-600 px-2 py-1 text-xs font-semibold text-slate-300 transition hover:border-slate-400 hover:text-white [@media(max-height:540px)]:hidden"
          />
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

      {showRelics && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4"
          onClick={() => setShowRelics(false)}
        >
          <div
            className="w-full max-w-xl rounded-xl border border-slate-700 bg-slate-900 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-100">
                Your Relics
              </h3>
              <button
                onClick={() => setShowRelics(false)}
                className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:border-slate-400"
              >
                Close
              </button>
            </div>

            {ownedRelics.length === 0 ? (
              <p className="text-sm text-slate-400">No relics yet.</p>
            ) : (
              <div className="space-y-2">
                {ownedRelics.map((relic) => (
                  <div
                    key={relic.id}
                    className="rounded border border-slate-700 bg-slate-950/60 p-3"
                  >
                    <p className="text-sm font-semibold text-slate-100">
                      {relic.name}{" "}
                      <span className="ml-1 text-xs uppercase tracking-wide text-slate-400">
                        {relic.rarity}
                      </span>
                    </p>
                    <p className="text-sm text-slate-300">
                      {relic.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

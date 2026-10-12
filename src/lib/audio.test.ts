import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const preferences = vi.hoisted(() => ({ music: 0, effects: 0 }));
vi.mock("./audio-preferences", () => ({
  readAudioPreferences: () => preferences,
}));
beforeEach(() => {
  vi.resetModules();
  vi.useFakeTimers();
  preferences.music = 0;
  preferences.effects = 0;
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
describe("audio lifecycle", () => {
  it("does not allocate an AudioContext while effects are muted", async () => {
    const context = vi.fn();
    vi.stubGlobal("AudioContext", context);
    const { playSound } = await import("./sound");
    playSound("BUTTON_CLICK");
    playSound("ENEMY_HIT");
    expect(context).not.toHaveBeenCalled();
  });
  it("loads no muted music, resumes the latest scene, and disposes its track on mute", async () => {
    const pause = vi.fn(),
      load = vi.fn(),
      removeAttribute = vi.fn();
    const audio = vi
      .fn()
      .mockImplementation((src: string) => ({
        src,
        volume: 0,
        loop: false,
        play: vi.fn().mockResolvedValue(undefined),
        pause,
        load,
        removeAttribute,
        addEventListener: vi.fn(),
      }));
    vi.stubGlobal("Audio", audio);
    const music = await import("./music");
    music.startMusic("combat");
    music.startMusic("boss");
    expect(audio).not.toHaveBeenCalled();
    preferences.music = 0.5;
    music.refreshMusicVolume();
    await Promise.resolve();
    expect(audio).toHaveBeenCalledOnce();
    expect(audio).toHaveBeenCalledWith("/sounds/music/boss.ogg");
    preferences.music = 0;
    music.refreshMusicVolume();
    expect(pause).toHaveBeenCalledOnce();
    expect(removeAttribute).toHaveBeenCalledWith("src");
    expect(load).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });
});

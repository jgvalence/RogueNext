import { describe, expect, it } from "vitest";
import { BiomeType } from "@/game/schemas/enums";
import {
  getCombatBiomeTheme,
  getCombatSceneDepthTheme,
} from "./combat-biome-theme";

describe("combat biome themes", () => {
  it.each(BiomeType.options)("defines a complete scene for %s", (biome) => {
    const interfaceTheme = getCombatBiomeTheme(biome);
    const depthTheme = getCombatSceneDepthTheme(biome);

    expect(interfaceTheme.sceneBase).toBeTruthy();
    expect(depthTheme.horizon).toContain("from-transparent");
    expect(depthTheme.ground).toContain("from-");
    expect(depthTheme.groundLight).toContain("to-transparent");
    expect(depthTheme.contactShadow).toContain("before:bg-");
    expect(depthTheme.motes).toContain("bg-");
  });
});

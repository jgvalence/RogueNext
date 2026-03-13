import { describe, expect, it } from "vitest";
import { auditStoryDescriptions } from "../engine/story-description-audit";

describe("story description audit", () => {
  it("keeps story descriptions aligned with their real bonus", () => {
    expect(auditStoryDescriptions()).toEqual([]);
  });
});

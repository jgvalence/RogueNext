import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-auth", () => ({
  default: () => ({ auth: (handler: unknown) => handler }),
}));

import middleware from "./middleware";

async function anonymousRequest(path: string) {
  const request = Object.assign(new NextRequest(`https://example.com${path}`), {
    auth: null,
  });
  return (
    middleware as unknown as (input: typeof request) => Promise<Response>
  )(request);
}

describe("public release version", () => {
  it("allows checking the deployed revision without signing in", async () => {
    const response = await anonymousRequest("/api/version");
    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it.each(["/api/run/save", "/api/version/private"])(
    "keeps %s protected",
    async (path) => {
      const response = await anonymousRequest(path);
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: "Unauthorized" });
    }
  );
});

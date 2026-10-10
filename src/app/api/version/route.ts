import { DEFAULT_RUN_ANALYTICS } from "@/game/schemas/analytics";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    {
      revision: process.env.VERCEL_GIT_COMMIT_SHA ?? "local",
      rulesVersion: DEFAULT_RUN_ANALYTICS.rulesVersion,
    },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}

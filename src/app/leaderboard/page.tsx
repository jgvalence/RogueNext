import { auth } from "@/lib/auth/config";
import {
  getLeaderboardAction,
  type LeaderboardSortMode,
} from "@/server/actions/progression";
import { LeaderboardClient } from "./_components/LeaderboardClient";

const LEADERBOARD_ENTRY_LIMIT = 50;
const LEADERBOARD_TIME_DIFFICULTY_MAX = 5;

type LeaderboardPageProps = {
  searchParams?: Promise<{
    sort?: string | string[];
    difficulty?: string | string[];
  }>;
};

function readFirstParam(
  value: string | string[] | undefined
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseSortMode(rawSort: string | undefined): LeaderboardSortMode {
  return rawSort === "victory_time" ? "victory_time" : "progression";
}

function parseTimeDifficulty(rawDifficulty: string | undefined): number | null {
  if (rawDifficulty == null || rawDifficulty === "") return null;

  const difficulty = Number(rawDifficulty);
  if (
    !Number.isInteger(difficulty) ||
    difficulty < 0 ||
    difficulty > LEADERBOARD_TIME_DIFFICULTY_MAX
  ) {
    return null;
  }

  return difficulty;
}

export default async function LeaderboardPage({
  searchParams,
}: LeaderboardPageProps) {
  const resolvedSearchParams = await searchParams;
  const sortMode = parseSortMode(
    readFirstParam(resolvedSearchParams?.sort)
  );
  const timeDifficulty =
    sortMode === "victory_time"
      ? parseTimeDifficulty(readFirstParam(resolvedSearchParams?.difficulty))
      : null;

  const [session, leaderboardResult] = await Promise.all([
    auth(),
    getLeaderboardAction({
      limit: LEADERBOARD_ENTRY_LIMIT,
      sort: sortMode,
      timeDifficulty,
    }),
  ]);

  const currentUserId = session?.user?.id ?? null;
  const entries = leaderboardResult.success
    ? leaderboardResult.data.leaderboard
    : [];
  const loadError = leaderboardResult.success
    ? null
    : leaderboardResult.error.message;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#03060A] text-amber-50">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-amber-700/15 blur-[90px]" />
        <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-sky-700/10 blur-[120px]" />
        <div className="absolute bottom-0 left-1/2 h-72 w-[36rem] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.12),transparent_70%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,10,0.55),rgba(2,6,10,0.95))]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <LeaderboardClient
          entries={entries}
          currentUserId={currentUserId}
          loadError={loadError}
          entryLimit={LEADERBOARD_ENTRY_LIMIT}
          sortMode={sortMode}
          timeDifficulty={timeDifficulty}
        />
      </div>
    </main>
  );
}

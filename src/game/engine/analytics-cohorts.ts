import { RunAnalyticsSchema } from "../schemas/analytics";

export function summarizeAnalyticsCohorts(
  rows: Array<{
    characterId: string;
    difficultyLevel: number;
    status: string;
    unlockedStoryCount: number;
    analytics: unknown;
  }>
) {
  const groups = new Map<
    string,
    {
      label: string;
      runs: number;
      wins: number;
      defeats: number;
      abandoned: number;
      offers: number;
      skipped: number;
      cardless: number;
      unusedItems: number;
      alliesLost: number;
    }
  >();
  for (const row of rows) {
    const parsed = RunAnalyticsSchema.safeParse(row.analytics);
    if (!parsed.success) continue;
    const analytics = parsed.data;
    const experience =
      analytics.totalRunsAtStart == null
        ? "exp. inconnue"
        : analytics.totalRunsAtStart < 5
          ? "0–4 runs"
          : analytics.totalRunsAtStart < 20
            ? "5–19 runs"
            : "20+ runs";
    const meta =
      row.unlockedStoryCount < 10
        ? "0–9 histoires"
        : row.unlockedStoryCount < 30
          ? "10–29 histoires"
          : "30+ histoires";
    const label = `${analytics.rulesVersion ?? "legacy"} · ${row.characterId} · D${row.difficultyLevel} · ${meta} · ${experience}`;
    const group = groups.get(label) ?? {
      label,
      runs: 0,
      wins: 0,
      defeats: 0,
      abandoned: 0,
      offers: 0,
      skipped: 0,
      cardless: 0,
      unusedItems: 0,
      alliesLost: 0,
    };
    group.runs++;
    if (row.status === "VICTORY") group.wins++;
    if (row.status === "DEFEAT") group.defeats++;
    if (row.status === "ABANDONED") group.abandoned++;
    group.offers += analytics.rewardOffers?.length ?? 0;
    group.skipped +=
      analytics.rewardOffers?.filter((offer) => offer.skipped).length ?? 0;
    group.cardless += analytics.cardlessTurnStarts;
    group.unusedItems += analytics.unusedItemsAtEnd ?? 0;
    group.alliesLost += analytics.alliesLost;
    groups.set(label, group);
  }
  return [...groups.values()]
    .sort((a, b) => b.runs - a.runs)
    .map((group) => ({
      ...group,
      winRate:
        group.wins + group.defeats > 0
          ? group.wins / (group.wins + group.defeats)
          : null,
    }));
}

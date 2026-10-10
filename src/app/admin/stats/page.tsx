import { CohortTable } from "./CohortTable";
import { requireAdmin } from "@/lib/auth/helpers";
import { prisma } from "@/lib/db/prisma";
import { buildEnemyDefsMap } from "@/game/data";
import { summarizeAnalyticsCohorts } from "@/game/engine/analytics-cohorts";
import { RunAnalyticsSchema } from "@/game/schemas/analytics";

export const dynamic = "force-dynamic";

async function getStats() {
  const [
    total,
    byStatus,
    byDifficulty,
    byBuild,
    byBiome,
    byCharacter,
    byCondition,
    defeatEnemies,
    defeatFloors,
    telemetryRows,
  ] = await Promise.all([
    prisma.runSummary.count(),

    prisma.runSummary.groupBy({
      by: ["status"],
      _count: { id: true },
    }),

    prisma.runSummary.groupBy({
      by: ["difficultyLevel", "status"],
      _count: { id: true },
      orderBy: { difficultyLevel: "asc" },
    }),

    prisma.runSummary.groupBy({
      by: ["buildArchetype", "status"],
      _count: { id: true },
      orderBy: { buildArchetype: "asc" },
    }),

    prisma.runSummary.groupBy({
      by: ["biome", "status"],
      _count: { id: true },
      orderBy: { biome: "asc" },
    }),

    prisma.runSummary.groupBy({
      by: ["characterId", "status"],
      _count: { id: true },
      orderBy: { characterId: "asc" },
    }),

    prisma.runSummary.groupBy({
      by: ["runConditionId", "status"],
      _count: { id: true },
      orderBy: { runConditionId: "asc" },
    }),

    // Top 10 ennemis qui ont causé le plus de défaites
    prisma.runSummary.groupBy({
      by: ["defeatEnemyId"],
      where: { status: "DEFEAT", defeatEnemyId: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),

    // Défaites par étage
    prisma.runSummary.groupBy({
      by: ["floorReached"],
      where: { status: "DEFEAT" },
      _count: { id: true },
      orderBy: { floorReached: "asc" },
    }),

    prisma.runSummary.findMany({
      select: {
        analytics: true,
        characterId: true,
        difficultyLevel: true,
        status: true,
        unlockedStoryCount: true,
      },
      orderBy: { createdAt: "desc" },
      take: 2000,
    }),
  ]);

  const telemetry = telemetryRows.flatMap((row) => {
    const parsed = RunAnalyticsSchema.safeParse(row.analytics);
    return parsed.success ? [parsed.data] : [];
  });
  const cohorts = summarizeAnalyticsCohorts(telemetryRows);
  const telemetryTotals = telemetry.reduce(
    (totals, run) => ({
      inkGenerated: totals.inkGenerated + run.inkGenerated,
      inkSpent: totals.inkSpent + run.inkSpent,
      inkedCardsPlayed: totals.inkedCardsPlayed + run.inkedCardsPlayed,
      combats: totals.combats + run.combatsStarted,
      turns: totals.turns + run.totalTurns,
      damageTaken: totals.damageTaken + run.damageTaken,
    }),
    {
      inkGenerated: 0,
      inkSpent: 0,
      inkedCardsPlayed: 0,
      combats: 0,
      turns: 0,
      damageTaken: 0,
    }
  );
  const inkPowerUses: Record<string, number> = {};
  const cardPlays: Record<string, number> = {};
  const cardModePlays: Record<string, number> = {};
  const upgradeBranchChoices: Record<string, number> = {};
  const cardsAdded: Record<string, number> = {};
  const cardsRemovedById: Record<string, number> = {};
  for (const run of telemetry) {
    for (const [power, count] of Object.entries(run.inkPowerUses)) {
      inkPowerUses[power] = (inkPowerUses[power] ?? 0) + count;
    }
    for (const [cardId, count] of Object.entries(run.cardPlays)) {
      cardPlays[cardId] = (cardPlays[cardId] ?? 0) + count;
    }
    for (const [mode, count] of Object.entries(run.cardModePlays)) {
      cardModePlays[mode] = (cardModePlays[mode] ?? 0) + count;
    }
    for (const [branch, count] of Object.entries(run.upgradeBranchChoices)) {
      upgradeBranchChoices[branch] =
        (upgradeBranchChoices[branch] ?? 0) + count;
    }
    for (const [cardId, count] of Object.entries(run.cardsAdded)) {
      cardsAdded[cardId] = (cardsAdded[cardId] ?? 0) + count;
    }
    for (const [cardId, count] of Object.entries(run.cardsRemovedById)) {
      cardsRemovedById[cardId] = (cardsRemovedById[cardId] ?? 0) + count;
    }
  }

  return {
    total,
    byStatus,
    byDifficulty,
    byBuild,
    byBiome,
    byCharacter,
    byCondition,
    defeatEnemies,
    defeatFloors,
    telemetryTotals,
    cohorts,
    inkPowerUses: Object.entries(inkPowerUses).sort((a, b) => b[1] - a[1]),
    topCardPlays: Object.entries(cardPlays)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15),
    cardModePlays: Object.entries(cardModePlays).sort((a, b) => b[1] - a[1]),
    upgradeBranchChoices: Object.entries(upgradeBranchChoices).sort(
      (a, b) => b[1] - a[1]
    ),
    cardAcquisitionStats: Array.from(
      new Set([...Object.keys(cardsAdded), ...Object.keys(cardsRemovedById)])
    )
      .map((cardId) => ({
        cardId,
        added: cardsAdded[cardId] ?? 0,
        removed: cardsRemovedById[cardId] ?? 0,
        played: cardPlays[cardId] ?? 0,
      }))
      .sort((left, right) => right.added - left.added),
  };
}

export default async function AdminStatsPage() {
  await requireAdmin();

  const {
    total,
    byStatus,
    byDifficulty,
    byBuild,
    byBiome,
    byCharacter,
    byCondition,
    defeatEnemies,
    defeatFloors,
    telemetryTotals,
    cohorts,
    inkPowerUses,
    topCardPlays,
    cardModePlays,
    upgradeBranchChoices,
    cardAcquisitionStats,
  } = await getStats();

  const enemyDefs = buildEnemyDefsMap();

  const wins = byStatus.find((s) => s.status === "VICTORY")?._count.id ?? 0;
  const defeats = byStatus.find((s) => s.status === "DEFEAT")?._count.id ?? 0;
  const abandoned =
    byStatus.find((s) => s.status === "ABANDONED")?._count.id ?? 0;
  const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : "—";

  // Grouper par difficulté pour tableau winrate
  const diffLevels = [
    ...new Set(byDifficulty.map((r) => r.difficultyLevel)),
  ].sort((a, b) => a - b);

  // Grouper build + status
  const builds = [...new Set(byBuild.map((r) => r.buildArchetype))].sort();

  return (
    <div className="min-h-screen bg-gray-950 p-8 text-gray-100">
      <h1 className="mb-2 text-2xl font-bold">Stats Alpha</h1>
      <p className="mb-8 text-sm text-gray-400">{total} runs enregistrés</p>

      <section className="mb-10 overflow-x-auto">
        <h2 className="mb-3 text-lg font-semibold text-amber-400">
          Cohortes comparables
        </h2>
        <p className="mb-3 text-sm text-gray-400">
          Derniers 2 000 historiques. Victoires / (victoires + défaites),
          abandons séparés. Les anciennes versions restent isolées. Les tours
          sans carte jouable peuvent encore permettre un pouvoir ou un objet.
        </p>
        <CohortTable cohorts={cohorts} />
      </section>

      {/* Vue globale */}
      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-amber-400">
          Vue globale
        </h2>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total runs", value: total },
            { label: "Victoires", value: `${wins} (${winRate}%)` },
            { label: "Défaites", value: defeats },
            { label: "Abandons", value: abandoned },
          ].map(({ label, value }) => (
            <div key={label} className="rounded bg-gray-800 p-4">
              <div className="mb-1 text-xs text-gray-400">{label}</div>
              <div className="text-xl font-bold">{value}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-amber-400">
          Acquisition, jeu et suppression
        </h2>
        <div className="grid gap-2 md:grid-cols-2">
          {cardAcquisitionStats.slice(0, 30).map((card) => (
            <div
              key={card.cardId}
              className="rounded bg-gray-800 px-3 py-2 text-sm"
            >
              <span className="font-mono">{card.cardId}</span>
              <span className="float-right text-gray-300">
                +{card.added} / joue {card.played} / retire {card.removed}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-amber-400">
          Choix de cartes et d&apos;evolutions
        </h2>
        <div className="mb-4 flex flex-wrap gap-2">
          {upgradeBranchChoices.map(([branch, count]) => (
            <span
              key={branch}
              className="rounded bg-gray-800 px-3 py-2 text-sm"
            >
              Branche {branch}: <strong>{count}</strong>
            </span>
          ))}
        </div>
        <div className="grid gap-2 md:grid-cols-3">
          {cardModePlays.slice(0, 30).map(([mode, count]) => (
            <div
              key={mode}
              className="flex justify-between rounded bg-gray-800 px-3 py-2 text-sm"
            >
              <span className="font-mono">{mode}</span>
              <strong>{count}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-amber-400">
          Winrate par personnage
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 text-left text-gray-400">
              <th className="pb-2 pr-6">Personnage</th>
              <th className="pb-2 pr-6">Runs</th>
              <th className="pb-2 pr-6">Victoires</th>
              <th className="pb-2">Winrate</th>
            </tr>
          </thead>
          <tbody>
            {[...new Set(byCharacter.map((row) => row.characterId))].map(
              (characterId) => {
                const rows = byCharacter.filter(
                  (row) => row.characterId === characterId
                );
                const runCount = rows.reduce(
                  (sum, row) => sum + row._count.id,
                  0
                );
                const victories =
                  rows.find((row) => row.status === "VICTORY")?._count.id ?? 0;
                return (
                  <tr key={characterId} className="border-b border-gray-800">
                    <td className="py-2 pr-6 capitalize">{characterId}</td>
                    <td className="py-2 pr-6">{runCount}</td>
                    <td className="py-2 pr-6 text-green-400">{victories}</td>
                    <td className="py-2">
                      {runCount > 0
                        ? `${((victories / runCount) * 100).toFixed(1)}%`
                        : "—"}
                    </td>
                  </tr>
                );
              }
            )}
          </tbody>
        </table>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-amber-400">
          Conditions de départ
        </h2>
        <div className="flex flex-wrap gap-2">
          {[...new Set(byCondition.map((row) => row.runConditionId))].map(
            (conditionId) => {
              const rows = byCondition.filter(
                (row) => row.runConditionId === conditionId
              );
              const runCount = rows.reduce(
                (sum, row) => sum + row._count.id,
                0
              );
              const victories =
                rows.find((row) => row.status === "VICTORY")?._count.id ?? 0;
              return (
                <span
                  key={conditionId ?? "none"}
                  className="rounded bg-gray-800 px-3 py-2 text-sm"
                >
                  {conditionId ?? "Aucune"}: {runCount} runs,{" "}
                  {runCount > 0 ? Math.round((victories / runCount) * 100) : 0}%
                </span>
              );
            }
          )}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-amber-400">
          Utilisation de l&apos;Encre
        </h2>
        <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: "Encre générée", value: telemetryTotals.inkGenerated },
            { label: "Encre dépensée", value: telemetryTotals.inkSpent },
            {
              label: "Taux d'utilisation",
              value:
                telemetryTotals.inkGenerated > 0
                  ? `${Math.round((telemetryTotals.inkSpent / telemetryTotals.inkGenerated) * 100)}%`
                  : "—",
            },
            {
              label: "Cartes encrées",
              value: telemetryTotals.inkedCardsPlayed,
            },
          ].map(({ label, value }) => (
            <div key={label} className="rounded bg-gray-800 p-4">
              <div className="mb-1 text-xs text-gray-400">{label}</div>
              <div className="text-xl font-bold">{value}</div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {inkPowerUses.map(([power, count]) => (
            <span key={power} className="rounded bg-gray-800 px-3 py-2 text-sm">
              {power}: <strong>{count}</strong>
            </span>
          ))}
          {inkPowerUses.length === 0 && (
            <span className="text-sm text-gray-500">Pas encore de données</span>
          )}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-amber-400">
          Cartes les plus jouées
        </h2>
        <div className="grid gap-2 md:grid-cols-3">
          {topCardPlays.map(([cardId, count]) => (
            <div
              key={cardId}
              className="flex justify-between rounded bg-gray-800 px-3 py-2 text-sm"
            >
              <span className="font-mono">{cardId}</span>
              <strong>{count}</strong>
            </div>
          ))}
        </div>
      </section>

      {/* Winrate par difficulté */}
      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-amber-400">
          Winrate par difficulté
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 text-left text-gray-400">
              <th className="pb-2 pr-6">Diff</th>
              <th className="pb-2 pr-6">Runs</th>
              <th className="pb-2 pr-6">Victoires</th>
              <th className="pb-2 pr-6">Défaites</th>
              <th className="pb-2">Winrate</th>
            </tr>
          </thead>
          <tbody>
            {diffLevels.map((diff) => {
              const rows = byDifficulty.filter(
                (r) => r.difficultyLevel === diff
              );
              const w =
                rows.find((r) => r.status === "VICTORY")?._count.id ?? 0;
              const d = rows.find((r) => r.status === "DEFEAT")?._count.id ?? 0;
              const tot = rows.reduce((s, r) => s + r._count.id, 0);
              return (
                <tr key={diff} className="border-b border-gray-800">
                  <td className="py-2 pr-6 font-mono">Diff {diff}</td>
                  <td className="py-2 pr-6">{tot}</td>
                  <td className="py-2 pr-6 text-green-400">{w}</td>
                  <td className="py-2 pr-6 text-red-400">{d}</td>
                  <td className="py-2">
                    {tot > 0 ? `${((w / tot) * 100).toFixed(1)}%` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Winrate par build */}
      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-amber-400">
          Winrate par build
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 text-left text-gray-400">
              <th className="pb-2 pr-6">Build</th>
              <th className="pb-2 pr-6">Runs</th>
              <th className="pb-2 pr-6">Victoires</th>
              <th className="pb-2">Winrate</th>
            </tr>
          </thead>
          <tbody>
            {builds.map((build) => {
              const rows = byBuild.filter((r) => r.buildArchetype === build);
              const w =
                rows.find((r) => r.status === "VICTORY")?._count.id ?? 0;
              const tot = rows.reduce((s, r) => s + r._count.id, 0);
              return (
                <tr key={build} className="border-b border-gray-800">
                  <td className="py-2 pr-6 capitalize">{build}</td>
                  <td className="py-2 pr-6">{tot}</td>
                  <td className="py-2 pr-6 text-green-400">{w}</td>
                  <td className="py-2">
                    {tot > 0 ? `${((w / tot) * 100).toFixed(1)}%` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <p className="text-sm text-slate-400">
        Télémétrie détaillée : les 2 000 derniers résumés au maximum. Les
        compteurs de dégâts mesurent les PV nets perdus ; les causes fatales
        historiques ne sont pas fiables. Les agrégats de victoire portent sur
        toutes les runs.
      </p>
      {/* Winrate par biome */}
      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-amber-400">
          Winrate par biome de départ
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 text-left text-gray-400">
              <th className="pb-2 pr-6">Biome</th>
              <th className="pb-2 pr-6">Runs</th>
              <th className="pb-2 pr-6">Victoires</th>
              <th className="pb-2">Winrate</th>
            </tr>
          </thead>
          <tbody>
            {[...new Set(byBiome.map((r) => r.biome))].sort().map((biome) => {
              const rows = byBiome.filter((r) => r.biome === biome);
              const w =
                rows.find((r) => r.status === "VICTORY")?._count.id ?? 0;
              const tot = rows.reduce((s, r) => s + r._count.id, 0);
              return (
                <tr key={biome} className="border-b border-gray-800">
                  <td className="py-2 pr-6">{biome}</td>
                  <td className="py-2 pr-6">{tot}</td>
                  <td className="py-2 pr-6 text-green-400">{w}</td>
                  <td className="py-2">
                    {tot > 0 ? `${((w / tot) * 100).toFixed(1)}%` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Défaites par étage */}
      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-amber-400">
          Défaites par étage
        </h2>
        <div className="flex flex-wrap gap-3">
          {defeatFloors.map(({ floorReached, _count }) => (
            <div
              key={floorReached}
              className="min-w-[80px] rounded bg-gray-800 p-3 text-center"
            >
              <div className="text-xs text-gray-400">Étage {floorReached}</div>
              <div className="text-xl font-bold text-red-400">{_count.id}</div>
              <div className="text-xs text-gray-500">
                {defeats > 0
                  ? `${((_count.id / defeats) * 100).toFixed(0)}%`
                  : ""}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Top ennemis tueurs */}
      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-amber-400">
          Top ennemis — causes de défaite
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 text-left text-gray-400">
              <th className="pb-2 pr-6">Ennemi</th>
              <th className="pb-2 pr-6">ID</th>
              <th className="pb-2">Défaites causées</th>
            </tr>
          </thead>
          <tbody>
            {defeatEnemies.map(({ defeatEnemyId, _count }) => {
              if (!defeatEnemyId) return null;
              const def = enemyDefs.get(defeatEnemyId);
              return (
                <tr key={defeatEnemyId} className="border-b border-gray-800">
                  <td className="py-2 pr-6">{def?.name ?? "—"}</td>
                  <td className="py-2 pr-6 font-mono text-xs text-gray-400">
                    {defeatEnemyId}
                  </td>
                  <td className="py-2 font-bold text-red-400">{_count.id}</td>
                </tr>
              );
            })}
            {defeatEnemies.length === 0 && (
              <tr>
                <td colSpan={3} className="py-4 text-center text-gray-500">
                  Pas encore de données
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

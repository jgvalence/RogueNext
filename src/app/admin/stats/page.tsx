import { requireAdmin } from "@/lib/auth/helpers";
import { prisma } from "@/lib/db/prisma";
import { buildEnemyDefsMap } from "@/game/data";

export const dynamic = "force-dynamic";

async function getStats() {
  const [
    total,
    byStatus,
    byDifficulty,
    byBuild,
    byBiome,
    defeatEnemies,
    defeatFloors,
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
  ]);

  return {
    total,
    byStatus,
    byDifficulty,
    byBuild,
    byBiome,
    defeatEnemies,
    defeatFloors,
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
    defeatEnemies,
    defeatFloors,
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

import { getRunHistoryAction } from "@/server/actions/runs";
import { RunHistoryClient } from "./_components/RunHistoryClient";

export default async function RunsPage() {
  const result = await getRunHistoryAction();

  const entries = result.success ? result.data.entries : [];
  const loadError = result.success ? null : result.error.message;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#03060A] text-amber-50">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-amber-700/15 blur-[90px]" />
        <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-sky-700/10 blur-[120px]" />
        <div className="absolute bottom-0 left-1/2 h-72 w-[36rem] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.12),transparent_70%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,10,0.55),rgba(2,6,10,0.95))]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
        <RunHistoryClient entries={entries} loadError={loadError} />
      </div>
    </main>
  );
}

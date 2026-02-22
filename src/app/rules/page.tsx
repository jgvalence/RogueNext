import { RulesContent } from "@/components/rules/RulesContent";

export default function RulesPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gray-950 px-4 py-6 text-white sm:px-6 sm:py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/4 h-[540px] w-[540px] -translate-x-1/2 rounded-full bg-purple-900/20 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-[280px] w-[360px] rounded-full bg-blue-900/15 blur-[90px]" />
        <div className="absolute right-0 top-0 h-[240px] w-[340px] rounded-full bg-amber-900/10 blur-[90px]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-5xl">
        <RulesContent mode="page" />
      </div>
    </main>
  );
}

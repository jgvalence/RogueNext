"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createRunAction } from "@/server/actions/run";
import { useActiveRun } from "@/lib/query/hooks/use-game-data";
import { gameKeys } from "@/lib/query/game-keys";
import { useRouter } from "next/navigation";

export default function GameHubPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: activeRun, isLoading } = useActiveRun();
  const [error, setError] = useState<string | null>(null);

  const createRun = useMutation({
    mutationFn: async () => {
      const result = await createRunAction({});
      if (!result.success) throw new Error(result.error.message);
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: gameKeys.activeRun });
      router.push(`/game/${data.runId}`);
    },
    onError: (err) => setError(err.message),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gray-900 text-white">
      <h1 className="text-5xl font-bold tracking-tight">Panlibrarium</h1>
      <p className="text-lg text-gray-400">
        A deck-builder roguelike through books of mythology
      </p>

      <div className="flex gap-4">
        {activeRun && (
          <button
            className="rounded-lg bg-green-700 px-6 py-3 font-bold text-white transition hover:bg-green-600"
            onClick={() => router.push(`/game/${activeRun.id}`)}
          >
            Continue Run
          </button>
        )}

        <button
          className="rounded-lg bg-blue-700 px-6 py-3 font-bold text-white transition hover:bg-blue-600 disabled:opacity-50"
          onClick={() => createRun.mutate()}
          disabled={createRun.isPending}
        >
          {createRun.isPending ? "Creating..." : "New Run"}
        </button>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}

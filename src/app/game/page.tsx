"use client";

import { useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createRunAction } from "@/server/actions/run";
import { useActiveRun } from "@/lib/query/hooks/use-game-data";
import { gameKeys } from "@/lib/query/game-keys";
import { useRouter } from "next/navigation";

export default function GameHubPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: activeRun, isLoading } = useActiveRun();
  const launched = useRef(false);

  const createRun = useMutation({
    mutationFn: async () => {
      const result = await createRunAction({});
      if (!result.success) throw new Error(result.error.message);
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: gameKeys.activeRun });
      router.replace(`/game/${data.runId}`);
    },
  });

  useEffect(() => {
    if (isLoading || launched.current) return;
    launched.current = true;
    if (activeRun) {
      router.replace(`/game/${activeRun.id}`);
    } else {
      createRun.mutate();
    }
  }, [isLoading, activeRun]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
      <p className="text-gray-400">Chargement…</p>
    </div>
  );
}

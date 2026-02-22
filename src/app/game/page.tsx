"use client";

import { useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createRunAction } from "@/server/actions/run";
import { useActiveRun } from "@/lib/query/hooks/use-game-data";
import { gameKeys } from "@/lib/query/game-keys";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

export default function GameHubPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    data: activeRun,
    isLoading,
    isFetching,
    isError: isActiveRunError,
    error: activeRunError,
    refetch: refetchActiveRun,
  } = useActiveRun();
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

  // Wait for a fresh fetch (not stale cache) before deciding to resume or create.
  // Without this, a stale cached run that has already ended causes "Run not found".
  useEffect(() => {
    if (isLoading || isFetching || launched.current) return;
    launched.current = true;
    if (activeRun) {
      router.replace(`/game/${activeRun.id}`);
    } else {
      createRun.mutate();
    }
  }, [isLoading, isFetching, activeRun]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isActiveRunError || createRun.isError) {
    const message =
      (activeRunError as Error | null)?.message ??
      (createRun.error as Error | null)?.message ??
      t("gameHub.unknownError");

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-900 px-6 text-white">
        <p className="max-w-xl text-center text-red-300">
          {t("gameHub.failedToStart", { message })}
        </p>
        <button
          type="button"
          className="rounded-lg border border-gray-600 px-4 py-2 text-sm text-gray-200 hover:border-gray-400"
          onClick={async () => {
            launched.current = false;
            await refetchActiveRun();
          }}
        >
          {t("gameHub.retry")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
      <p className="text-gray-400">{t("gameHub.loading")}</p>
    </div>
  );
}

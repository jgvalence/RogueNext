"use client";
import { toast } from "sonner";
import { i18n } from "@/lib/i18n";
import type { RunState } from "@/game/schemas/run-state";
import {
  saveRunStateAction,
  endRunAction as endAction,
} from "@/server/actions/run";

type SaveSession = {
  revision: number;
  pending: Promise<unknown> | null;
  conflicted: boolean;
  unacknowledged?: RunState;
  endedStatus?: string;
};
const sessions = new Map<string, SaveSession>();
function sessionFor(state: RunState): SaveSession {
  let session = sessions.get(state.runId);
  if (!session) {
    session = {
      revision: state.saveRevision ?? 0,
      pending: null,
      conflicted: false,
    };
    sessions.set(state.runId, session);
  } else if (!session.pending && (state.saveRevision ?? 0) > session.revision) {
    session.revision = state.saveRevision!;
    session.conflicted = false;
    session.unacknowledged = undefined;
  }
  return session;
}
function enqueue<T>(
  session: SaveSession,
  operation: () => Promise<T>
): Promise<T> {
  const result = session.pending
    ? session.pending.then(operation, operation)
    : operation();
  session.pending = result;
  void result
    .finally(() => {
      if (session.pending === result) session.pending = null;
    })
    .catch(() => {});
  return result;
}
export class SaveConflictError extends Error {}
async function writeSnapshot(
  session: SaveSession,
  snapshot: RunState,
  keepalive: boolean
): Promise<void> {
  session.unacknowledged = snapshot;
  let saved: boolean;
  if (keepalive) {
    const response = await fetch("/api/run/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      keepalive: true,
      body: JSON.stringify({ runId: snapshot.runId, state: snapshot }),
    });
    if (!response.ok) throw new Error("SAVE_FAILED");
    saved = (await response.json()).saved === true;
  } else {
    const response = await saveRunStateAction({
      runId: snapshot.runId,
      state: snapshot,
    });
    if (!response.success) {
      session.unacknowledged = undefined;
      throw new Error(response.error.message);
    }
    saved = response.data.saved === true;
  }
  if (!saved) {
    session.conflicted = true;
    throw new SaveConflictError("SAVE_CONFLICT");
  }
  session.unacknowledged = undefined;
  session.revision += 1;
}
export function persistRunState(
  state: RunState,
  keepalive = false
): Promise<void> {
  const session = sessionFor(state);
  return enqueue(session, async () => {
    if (session.endedStatus) return;
    if (session.conflicted) throw new SaveConflictError("SAVE_CONFLICT");
    // Reconcile an uncertain network result before sending newer gameplay.
    // The server accepts an identical retry of the last committed revision.
    if (session.unacknowledged)
      await writeSnapshot(session, session.unacknowledged, keepalive);
    await writeSnapshot(
      session,
      { ...state, saveRevision: session.revision },
      keepalive
    );
  });
}
export async function endRunAction(input: Parameters<typeof endAction>[0]) {
  if (!input.finalState) return endAction(input);
  const session = sessionFor(input.finalState as RunState);
  return enqueue(session, async () => {
    try {
      if (session.endedStatus === input.status)
        return { success: true as const, data: { ended: true } };
      if (session.conflicted) throw new SaveConflictError("SAVE_CONFLICT");
      if (session.unacknowledged)
        await writeSnapshot(session, session.unacknowledged, false);
      const result = await endAction({
        ...input,
        finalState: { ...input.finalState!, saveRevision: session.revision },
      });
      if (!result.success) toast.error(result.error.message);
      if (result.success && !result.data.ended)
        throw new Error("END_NOT_CONFIRMED");
      if (result.success) session.endedStatus = input.status;
      return result;
    } catch {
      toast.error(i18n.t("run.endSaveFailed"));
      return { success: false as const, error: { message: "SAVE_FAILED" } };
    }
  });
}
export function resetRunSaveSession(runId: string): void {
  if (!sessions.get(runId)?.pending) sessions.delete(runId);
}

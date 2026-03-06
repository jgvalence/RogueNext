import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import type { RunState } from "@/game/schemas/run-state";
import type { GameAction } from "../_providers/game-reducer";

interface UseCombatTurnFlowParams {
  dispatch: (action: GameAction) => void;
  stateRef: MutableRefObject<RunState>;
}

export function useCombatTurnFlow({
  dispatch,
  stateRef,
}: UseCombatTurnFlowParams) {
  const [actingEnemyId, setActingEnemyId] = useState<string | null>(null);
  const [attackingEnemyId, setAttackingEnemyId] = useState<string | null>(null);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const [isResolvingEndTurn, setIsResolvingEndTurn] = useState(false);

  const enemyTurnCancelledRef = useRef(false);
  const endTurnInFlightRef = useRef(false);

  const cancelEnemyTurnFlow = useCallback(() => {
    enemyTurnCancelledRef.current = true;
    setActingEnemyId(null);
    setAttackingEnemyId(null);
  }, []);

  const handleEndTurn = useCallback(async () => {
    const combat = stateRef.current.combat;
    if (!combat || combat.phase !== "PLAYER_TURN") return;
    if ((combat.pendingHandOverflowExhaust ?? 0) > 0) return;
    if (endTurnInFlightRef.current) return;

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, ms));

    endTurnInFlightRef.current = true;
    setIsResolvingEndTurn(true);
    try {
      if (combat.hand.length > 0) {
        setIsDiscarding(true);
        await sleep(350);
        setIsDiscarding(false);
      }

      const sortedEnemies = [...combat.enemies]
        .filter((enemy) => enemy.currentHp > 0)
        .sort((a, b) => b.speed - a.speed);

      enemyTurnCancelledRef.current = false;
      dispatch({ type: "BEGIN_ENEMY_TURN" });
      await sleep(150);

      for (const enemy of sortedEnemies) {
        if (enemyTurnCancelledRef.current) break;

        setActingEnemyId(enemy.instanceId);
        await sleep(350);

        if (enemyTurnCancelledRef.current) break;

        setAttackingEnemyId(enemy.instanceId);
        dispatch({
          type: "EXECUTE_ENEMY_STEP",
          payload: { enemyInstanceId: enemy.instanceId },
        });
        await sleep(300);

        setAttackingEnemyId(null);
        setActingEnemyId(null);
        await sleep(150);
      }

      if (!enemyTurnCancelledRef.current) {
        dispatch({ type: "FINALIZE_ENEMY_TURN" });
      }
      setActingEnemyId(null);
      setAttackingEnemyId(null);
    } finally {
      endTurnInFlightRef.current = false;
      setIsResolvingEndTurn(false);
      setIsDiscarding(false);
    }
  }, [dispatch, stateRef]);

  useEffect(() => {
    const onTopMenuEndTurn = () => {
      void handleEndTurn();
    };
    window.addEventListener("game:end-turn-request", onTopMenuEndTurn);
    return () =>
      window.removeEventListener("game:end-turn-request", onTopMenuEndTurn);
  }, [handleEndTurn]);

  return {
    actingEnemyId,
    attackingEnemyId,
    isDiscarding,
    isResolvingEndTurn,
    handleEndTurn,
    cancelEnemyTurnFlow,
  };
}

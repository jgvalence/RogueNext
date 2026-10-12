import { scaleCombatDelay } from "./combat-speed";

export const combatFeedbackDuration = () =>
  Math.max(360, scaleCombatDelay(720));
export const combatFeedbackStagger = (index: number) =>
  scaleCombatDelay(Math.min(index, 8) * 100);

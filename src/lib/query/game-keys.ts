export const gameKeys = {
  cardDefinitions: ["game", "card-definitions"] as const,
  enemyDefinitions: ["game", "enemy-definitions"] as const,
  allyDefinitions: ["game", "ally-definitions"] as const,
  relicDefinitions: ["game", "relic-definitions"] as const,
  activeRun: ["game", "active-run"] as const,
  runHistory: (userId: string) => ["game", "runs", userId] as const,
};

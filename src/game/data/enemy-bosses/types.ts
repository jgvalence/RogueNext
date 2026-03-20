import type { EnemyDefinition } from "../../schemas/entities";

export type RawEnemyDefinition = Omit<EnemyDefinition, "role">;

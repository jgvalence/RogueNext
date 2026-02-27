import type { BuffInstance } from "@/game/schemas/entities";

const BONUS_DAMAGE_IF_PLAYER_DEBUFFED: Record<string, number> = {
  "medusa:Stone Crush": 8,
  "hel_queen:Death's Reckoning": 8,
  "shub_spawn:Dark Young Stomp": 6,
  "cernunnos_shade:Ancient Wrath": 6,
  "koschei_deathless:Deathless Blow": 10,
  "anansi_weaver:Story's End": 8,
};

export function getBonusDamageIfPlayerDebuffed(
  definitionId: string,
  abilityName: string
): number | null {
  return (
    BONUS_DAMAGE_IF_PLAYER_DEBUFFED[`${definitionId}:${abilityName}`] ?? null
  );
}

export function hasPlayerDebuffForEnemyBonus(
  playerBuffs: BuffInstance[]
): boolean {
  return playerBuffs.some(
    (buff) =>
      buff.stacks > 0 &&
      (buff.type === "WEAK" ||
        buff.type === "VULNERABLE" ||
        buff.type === "POISON")
  );
}

import { lootableCardDefinitions } from "../src/game/data/cards";
import { matchesCardCharacter } from "../src/game/engine/card-filters";
import { generateShopInventory } from "../src/game/engine/merchant";
import { createRNG } from "../src/game/engine/rng";
import { generateCombatRewards } from "../src/game/engine/rewards";
import type { BiomeType } from "../src/game/schemas/enums";

type SignatureAuditTarget = {
  id: string;
  label: string;
};

type SignatureCadenceRow = {
  id: string;
  label: string;
  biome: BiomeType;
  characterId: string;
  rarity: string;
  normalRewardRate: number;
  eliteRewardRate: number;
  merchantRate: number;
};

const ITERATIONS = 4000;
const AUDIT_TARGETS: SignatureAuditTarget[] = [
  { id: "curator_pact", label: "Curator Pact" },
  { id: "saga_keeper", label: "Saga Keeper" },
  { id: "book_of_the_dead", label: "Book of the Dead" },
  { id: "written_prophecy", label: "Written Prophecy" },
  { id: "fates_decree", label: "Fate's Decree" },
];

function getEligibleUnlockedCardIds(characterId?: string): string[] {
  return lootableCardDefinitions
    .filter(
      (card) =>
        !card.isStarterCard &&
        card.isCollectible !== false &&
        matchesCardCharacter(card, characterId)
    )
    .map((card) => card.id);
}

function hasCardChoice(
  rewards: ReturnType<typeof generateCombatRewards>,
  cardId: string
): boolean {
  return rewards.cardChoices.some((card) => card.id === cardId);
}

function hasMerchantCardOffer(
  inventory: ReturnType<typeof generateShopInventory>,
  cardId: string
): boolean {
  return inventory.some(
    (item) => item.type === "card" && item.cardDef?.id === cardId
  );
}

function toPercent(value: number, iterations: number): number {
  return Number(((value / iterations) * 100).toFixed(2));
}

function buildCadenceRow(target: SignatureAuditTarget): SignatureCadenceRow {
  const card = lootableCardDefinitions.find((entry) => entry.id === target.id);
  if (!card?.characterId) {
    throw new Error(`Signature audit target not found or missing character: ${target.id}`);
  }

  const unlockedCardIds = getEligibleUnlockedCardIds(card.characterId);
  let normalRewardHits = 0;
  let eliteRewardHits = 0;
  let merchantHits = 0;

  for (let i = 0; i < ITERATIONS; i += 1) {
    const normalRewards = generateCombatRewards(
      8,
      1,
      false,
      false,
      2,
      lootableCardDefinitions,
      createRNG(`signature-normal:${target.id}:${i}`),
      card.biome,
      [],
      unlockedCardIds,
      [],
      0,
      0,
      undefined,
      0,
      0,
      0,
      undefined,
      1,
      false,
      card.characterId
    );
    if (hasCardChoice(normalRewards, target.id)) {
      normalRewardHits += 1;
    }

    const eliteRewards = generateCombatRewards(
      8,
      1,
      false,
      true,
      2,
      lootableCardDefinitions,
      createRNG(`signature-elite:${target.id}:${i}`),
      card.biome,
      [],
      unlockedCardIds,
      [],
      0,
      0,
      undefined,
      0,
      0,
      0,
      undefined,
      1,
      false,
      card.characterId
    );
    if (hasCardChoice(eliteRewards, target.id)) {
      eliteRewardHits += 1;
    }

    const merchantInventory = generateShopInventory(
      8,
      lootableCardDefinitions,
      [],
      createRNG(`signature-merchant:${target.id}:${i}`),
      unlockedCardIds,
      0,
      0,
      0,
      [],
      3,
      undefined,
      [],
      0,
      card.characterId
    );
    if (hasMerchantCardOffer(merchantInventory, target.id)) {
      merchantHits += 1;
    }
  }

  return {
    id: target.id,
    label: target.label,
    biome: card.biome,
    characterId: card.characterId,
    rarity: card.rarity,
    normalRewardRate: toPercent(normalRewardHits, ITERATIONS),
    eliteRewardRate: toPercent(eliteRewardHits, ITERATIONS),
    merchantRate: toPercent(merchantHits, ITERATIONS),
  };
}

function printTable(rows: SignatureCadenceRow[]) {
  console.log("# Signature Cadence Audit");
  console.log("");
  console.log(`Iterations per target: ${ITERATIONS}`);
  console.log("");
  console.log(
    "| Card | Character | Biome | Rarity | Normal reward | Elite reward | Merchant |"
  );
  console.log(
    "| --- | --- | --- | --- | --- | --- | --- |"
  );
  for (const row of rows) {
    console.log(
      `| ${row.id} | ${row.characterId} | ${row.biome} | ${row.rarity} | ${row.normalRewardRate}% | ${row.eliteRewardRate}% | ${row.merchantRate}% |`
    );
  }
}

const rows = AUDIT_TARGETS.map(buildCadenceRow);
printTable(rows);

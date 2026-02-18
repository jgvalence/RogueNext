import { Prisma, PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { allCardDefinitions } from "../src/game/data";
import { enemyDefinitions } from "../src/game/data/enemies";
import { relicDefinitions } from "../src/game/data/relics";
import { allyDefinitions } from "../src/game/data/allies";

const prisma = new PrismaClient();

// Helper to convert data to Prisma-compatible JSON
function toJson(data: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(data)) as Prisma.InputJsonValue;
}

function toJsonOrNull(
  data: unknown
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (data === null || data === undefined) return Prisma.JsonNull;
  return JSON.parse(JSON.stringify(data)) as Prisma.InputJsonValue;
}

async function main() {
  console.warn("Starting database seed...");

  // Create admin user
  const adminPassword = await hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin User",
      password: adminPassword,
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });
  console.warn("Created admin user:", admin.email);

  // Create demo user
  const userPassword = await hash("user123", 12);
  const user = await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: {},
    create: {
      email: "user@example.com",
      name: "Demo User",
      password: userPassword,
      role: "USER",
      emailVerified: new Date(),
    },
  });
  console.warn("Created demo user:", user.email);

  // Seed card definitions
  for (const card of allCardDefinitions) {
    await prisma.cardDefinition.upsert({
      where: { id: card.id },
      update: {
        name: card.name,
        type: card.type,
        energyCost: card.energyCost,
        inkCost: card.inkCost,
        targeting: card.targeting,
        rarity: card.rarity,
        description: card.description,
        effects: toJson(card.effects),
        inkedVariant: toJsonOrNull(card.inkedVariant),
        isStarterCard: card.isStarterCard,
      },
      create: {
        id: card.id,
        name: card.name,
        type: card.type,
        energyCost: card.energyCost,
        inkCost: card.inkCost,
        targeting: card.targeting,
        rarity: card.rarity,
        description: card.description,
        effects: toJson(card.effects),
        inkedVariant: toJsonOrNull(card.inkedVariant),
        isStarterCard: card.isStarterCard,
      },
    });
  }
  console.warn(`Seeded ${allCardDefinitions.length} card definitions`);

  // Seed enemy definitions
  for (const enemy of enemyDefinitions) {
    await prisma.enemyDefinition.upsert({
      where: { id: enemy.id },
      update: {
        name: enemy.name,
        maxHp: enemy.maxHp,
        speed: enemy.speed,
        abilities: toJson(enemy.abilities),
        isBoss: enemy.isBoss,
        tier: enemy.tier,
      },
      create: {
        id: enemy.id,
        name: enemy.name,
        maxHp: enemy.maxHp,
        speed: enemy.speed,
        abilities: toJson(enemy.abilities),
        isBoss: enemy.isBoss,
        tier: enemy.tier,
      },
    });
  }
  console.warn(`Seeded ${enemyDefinitions.length} enemy definitions`);

  // Seed relic definitions
  for (const relic of relicDefinitions) {
    await prisma.relicDefinition.upsert({
      where: { id: relic.id },
      update: {
        name: relic.name,
        description: relic.description,
        rarity: relic.rarity,
        effects: {},
      },
      create: {
        id: relic.id,
        name: relic.name,
        description: relic.description,
        rarity: relic.rarity,
        effects: {},
      },
    });
  }
  console.warn(`Seeded ${relicDefinitions.length} relic definitions`);

  // Seed ally definitions
  for (const ally of allyDefinitions) {
    await prisma.allyDefinition.upsert({
      where: { id: ally.id },
      update: {
        name: ally.name,
        maxHp: ally.maxHp,
        speed: ally.speed,
        abilities: toJson(ally.abilities),
      },
      create: {
        id: ally.id,
        name: ally.name,
        maxHp: ally.maxHp,
        speed: ally.speed,
        abilities: toJson(ally.abilities),
      },
    });
  }
  console.warn(`Seeded ${allyDefinitions.length} ally definitions`);

  console.warn("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

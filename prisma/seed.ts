import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.warn("🌱 Starting database seed...");

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

  console.warn("✅ Created admin user:", admin.email);

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

  console.warn("✅ Created demo user:", user.email);

  // Create demo products (if using e-commerce models)
  const products = await Promise.all([
    prisma.product.upsert({
      where: { slug: "demo-product-1" },
      update: {},
      create: {
        name: "Demo Product 1",
        slug: "demo-product-1",
        description: "This is a demo product for testing purposes",
        price: 1999, // $19.99
        currency: "USD",
        stock: 100,
        images: ["https://via.placeholder.com/400"],
        isActive: true,
      },
    }),
    prisma.product.upsert({
      where: { slug: "demo-product-2" },
      update: {},
      create: {
        name: "Demo Product 2",
        slug: "demo-product-2",
        description: "Another demo product",
        price: 2999, // $29.99
        currency: "USD",
        stock: 50,
        images: ["https://via.placeholder.com/400"],
        isActive: true,
      },
    }),
  ]);

  console.warn(`✅ Created ${products.length} demo products`);

  console.warn("🎉 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

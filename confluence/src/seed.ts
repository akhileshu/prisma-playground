import dotenv from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

dotenv.config({
  path: "./confluence/.env",
});

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.create({
    data: {
      name: "Alice",
      email: "alice@example.com",
      posts: {
        create: [
          {
            title: "Prisma basics",
            published: true,
          },
          {
            title: "Database design",
            published: false,
          },
        ],
      },
    },
  });

  await prisma.user.create({
    data: {
      name: "Bob",
      email: "bob@example.com",
      posts: {
        create: [
          {
            title: "SQL fundamentals",
            published: true,
          },
        ],
      },
    },
  });

  console.log("Seed complete.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

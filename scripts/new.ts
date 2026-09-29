import { mkdirSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const name = process.argv[2];

if (!name) {
  console.error("Usage: bun new <workspace-name>");
  process.exit(1);
}

if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
  console.error("Workspace name can only contain letters, numbers, _ and -");
  process.exit(1);
}

const databaseName = name.replace(/-/g, "_");
const root = name;

mkdirSync(`${root}/prisma`, { recursive: true });
mkdirSync(`${root}/src`, { recursive: true });

// --------------------------------------------------
// .env
// --------------------------------------------------

writeFileSync(
  `${root}/.env`,
  `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/${databaseName}"\n`,
);

// --------------------------------------------------
// Prisma schema
// --------------------------------------------------

writeFileSync(
  `${root}/prisma/schema.prisma`,
  `generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
}

model User {
  id    Int    @id @default(autoincrement())
  name  String
  email String @unique
  posts Post[]
}

model Post {
  id        Int     @id @default(autoincrement())
  title     String
  published Boolean @default(false)
  authorId  Int

  author User @relation(fields: [authorId], references: [id])
}
`,
);

// --------------------------------------------------
// Prisma config
// --------------------------------------------------

writeFileSync(
  `${root}/prisma.config.ts`,
  `import dotenv from "dotenv";
import { defineConfig, env } from "prisma/config";

dotenv.config({
  path: "./${root}/.env",
});

export default defineConfig({
  schema: "prisma/schema.prisma",

  datasource: {
    url: env("DATABASE_URL"),
  },
});
`,
);

// --------------------------------------------------
// Seed
// --------------------------------------------------

writeFileSync(
  `${root}/src/seed.ts`,
  `import dotenv from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

dotenv.config({
  path: "./${root}/.env",
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
`,
);

// --------------------------------------------------
// Query playground
// --------------------------------------------------

writeFileSync(
  `${root}/src/query.ts`,
  `import dotenv from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

dotenv.config({
  path: "./${root}/.env",
});

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  // Experiment here.

  const users = await prisma.user.findMany({
    include: {
      posts: true,
    },
  });

  console.dir(users, { depth: null });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
`,
);

// --------------------------------------------------
// Create PostgreSQL database
// --------------------------------------------------

try {
  execSync(
    `docker compose exec -T postgres createdb -U postgres ${databaseName}`,
    { stdio: "ignore" },
  );

  console.log(`Created database: ${databaseName}`);
} catch {
  console.log(`Database already exists: ${databaseName}`);
}

// --------------------------------------------------
// Generate Prisma client
// --------------------------------------------------

execSync(`bunx prisma generate --config=${root}/prisma.config.ts`, {
  stdio: "inherit",
});

// --------------------------------------------------
// Push schema
// --------------------------------------------------

execSync(`bunx prisma db push --config=${root}/prisma.config.ts`, {
  stdio: "inherit",
});

console.log(`
Created workspace: ${name}

  ${root}/
  ├── .env
  ├── prisma.config.ts
  ├── prisma/
  │   └── schema.prisma
  ├── generated/
  │   └── prisma/
  └── src/
      ├── seed.ts
      └── query.ts

Try:

  bun ${root}/src/seed.ts
  bun ${root}/src/query.ts

After changing schema.prisma:

  bunx prisma generate --config=${root}/prisma.config.ts
  bunx prisma db push --config=${root}/prisma.config.ts
`);

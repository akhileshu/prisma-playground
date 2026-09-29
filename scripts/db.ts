import { execSync } from "node:child_process";

const workspace = process.argv[2];

if (!workspace) {
  console.error("Usage: bun db <workspace-name>");
  process.exit(1);
}

execSync(`bunx prisma generate --config=${workspace}/prisma.config.ts`, {
  stdio: "inherit",
});

execSync(`bunx prisma db push --config=${workspace}/prisma.config.ts`, {
  stdio: "inherit",
});

console.log(`\nDatabase updated: ${workspace}`);

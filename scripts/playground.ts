import { execSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";

const args = new Set(process.argv.slice(2));

const seed = args.has("--seed");
const query = args.has("--query");
const db = args.has("--db");

if (!seed && !query && !db) {
  console.log(`
Usage:

  bun playground --seed
  bun playground --query
  bun playground --seed --query
  bun playground --db
`);
  process.exit(0);
}

const workspaces = readdirSync(".", { withFileTypes: true })
  .filter((entry) => {
    if (!entry.isDirectory()) return false;

    const name = entry.name;

    // Ignore project/infrastructure directories.
    if (name === "node_modules" || name === "scripts" || name.startsWith(".")) {
      return false;
    }

    return existsSync(`${name}/prisma.config.ts`);
  })
  .map((entry) => entry.name);

if (workspaces.length === 0) {
  console.log("No workspaces found.");
  process.exit(0);
}

console.log(`
══════════════════════════════════════════════════
 Prisma Playground
══════════════════════════════════════════════════
`);

console.log(`Workspaces: ${workspaces.join(", ")}\n`);

function runWorkspace(workspace: string, command: string) {
  console.log(`
──────────────────────────────────────────────────
 ${workspace}
──────────────────────────────────────────────────
`);

  try {
    execSync(command, {
      stdio: "inherit",
    });
  } catch {
    console.error(`\n✗ ${workspace} failed\n`);
  }
}

// --------------------------------------------------
// DB
// --------------------------------------------------

if (db) {
  console.log(`
══════════════════════════════════════════════════
 DB — ALL WORKSPACES
══════════════════════════════════════════════════
`);

  for (const workspace of workspaces) {
    runWorkspace(
      workspace,
      `bunx prisma generate --config=${workspace}/prisma.config.ts`,
    );

    runWorkspace(
      workspace,
      `bunx prisma db push --config=${workspace}/prisma.config.ts`,
    );
  }
}

// --------------------------------------------------
// Seed
// --------------------------------------------------

if (seed) {
  console.log(`
══════════════════════════════════════════════════
 SEED — ALL WORKSPACES
══════════════════════════════════════════════════
`);

  for (const workspace of workspaces) {
    runWorkspace(workspace, `bun ${workspace}/src/seed.ts`);
  }
}

// --------------------------------------------------
// Query
// --------------------------------------------------

if (query) {
  console.log(`
══════════════════════════════════════════════════
 QUERY — ALL WORKSPACES
══════════════════════════════════════════════════
`);

  for (const workspace of workspaces) {
    runWorkspace(workspace, `bun ${workspace}/src/query.ts`);
  }
}

# Prisma Playground

A lightweight Prisma + PostgreSQL playground for experimenting with database schemas, Prisma queries, and data modeling without building a full application.

Each workspace has its own:

* Prisma schema
* PostgreSQL database
* `.env`
* generated Prisma Client
* seed and query playground

Dependencies are shared at the root.

## Get started

```sh
bun install
bun run start
```

`start` starts the PostgreSQL container.

## Work with a single workspace

Create a new workspace:

```sh
bun new confluence
```

After modifying `schema.prisma`, apply the changes:

```sh
bun db confluence
```

Run the workspace experiments:

```sh
bun confluence/src/seed.ts
bun confluence/src/query.ts
```

`query.ts` is the main place to experiment with Prisma queries.

## Manage all workspaces

Run an operation across every workspace:

```sh
# Generate clients + push schemas
bun playground --db

# Seed every workspace
bun playground --seed

# Run queries in every workspace
bun playground --query

# Seed, then query every workspace
bun playground --seed --query
```

Workspaces are discovered automatically, so creating another workspace with `bun new <name>` makes it available to the bulk commands.

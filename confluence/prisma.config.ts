import dotenv from "dotenv";
import { defineConfig, env } from "prisma/config";

dotenv.config({
  path: "./confluence/.env",
});

export default defineConfig({
  schema: "prisma/schema.prisma",

  datasource: {
    url: env("DATABASE_URL"),
  },
});

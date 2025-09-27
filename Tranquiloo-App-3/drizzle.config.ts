import { defineConfig } from "drizzle-kit";

// Using SQLite temporarily due to Neon database issues
export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: "./data/tranquiloo.db",
  },
});

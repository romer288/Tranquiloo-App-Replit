import { defineConfig } from "drizzle-kit";

// PostgreSQL configuration for Supabase
export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});

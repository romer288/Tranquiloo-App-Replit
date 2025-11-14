// Note: dotenv is loaded in server/index.ts (dev) before this file is imported
// In production (Vercel), environment variables are automatically available

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

// Lazy connection - only initialize when first accessed
let client: ReturnType<typeof postgres> | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;

function getConnection() {
  if (!client) {
    // Get Supabase connection string
    const connectionString = process.env.DATABASE_URL ||
      `postgresql://postgres.przforeyoxweawyfrxws:${process.env.SUPABASE_DB_PASSWORD}@aws-1-us-east-2.pooler.supabase.com:6543/postgres`;

    console.log('[DB] Lazy-connecting to Supabase PostgreSQL...');

    // Create PostgreSQL connection with proper Supabase settings
    // Supabase requires SSL and prepare: false for pooled connections
    client = postgres(connectionString, {
      prepare: false, // Required for Supabase connection pooler
      ssl: 'require', // Supabase requires SSL
      connect_timeout: 5, // 5 second timeout
      idle_timeout: 20,
      max_lifetime: 60 * 30, // 30 minutes
      max: 1 // Limit to 1 connection in serverless environment
    });

    dbInstance = drizzle(client, { schema });
  }

  return { client, db: dbInstance! };
}

// Export getters that lazily initialize connection
export const pool = new Proxy({} as ReturnType<typeof postgres>, {
  get(target, prop) {
    const { client } = getConnection();
    return (client as any)[prop];
  }
});

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    const { db } = getConnection();
    return (db as any)[prop];
  }
});

export const sqliteDatabase = null; // No SQLite database

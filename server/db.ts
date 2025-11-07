// Note: dotenv is loaded in server/index.ts (dev) before this file is imported
// In production (Vercel), environment variables are automatically available

// Disable SSL certificate verification for Supabase
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

// Get Supabase connection string
const connectionString = process.env.DATABASE_URL ||
  `postgresql://postgres.przforeyoxweawyfrxws:${process.env.SUPABASE_DB_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

console.log('[DB] Connecting to Supabase PostgreSQL...');

// Create PostgreSQL connection
const client = postgres(connectionString, {
  prepare: false,
  ssl: false
});

// Export Drizzle instance (tables already exist in Supabase from migrations)
export const pool = client;
export const db = drizzle(client, { schema });
export const sqliteDatabase = null; // No SQLite database

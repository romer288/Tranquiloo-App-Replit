import dotenv from "dotenv";
dotenv.config();

// Disable SSL certificate verification for Supabase
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Temporarily use SQLite to bypass disabled Neon database
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from "@shared/schema";
import { mkdirSync } from 'fs';
import { dirname } from 'path';

// Create data directory if it doesn't exist
const dbPath = './data/tranquiloo.db';
try {
  mkdirSync(dirname(dbPath), { recursive: true });
} catch {}

// Initialize SQLite database
const sqliteDb = new Database(dbPath);

// Enable foreign keys
sqliteDb.pragma('foreign_keys = ON');

// Create tables if they don't exist
sqliteDb.exec(`
  CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    patient_code TEXT,
    role TEXT DEFAULT 'user',
    hashed_password TEXT,
    email_verified INTEGER DEFAULT 0,
    email_verification_token TEXT,
    password_reset_token TEXT,
    password_reset_expires INTEGER,
    auth_method TEXT DEFAULT 'email',
    license_number TEXT,
    license_state TEXT,
    license_grace_deadline INTEGER,
    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
    updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
  );

  CREATE TABLE IF NOT EXISTS chat_sessions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    title TEXT DEFAULT 'New Chat Session',
    ai_companion TEXT DEFAULT 'vanessa',
    language TEXT DEFAULT 'english',
    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
    updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
  );

  CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    session_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    sender TEXT NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
  );

  CREATE TABLE IF NOT EXISTS anxiety_analyses (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    message_id TEXT,
    anxiety_level INTEGER,
    triggers TEXT,
    sentiment TEXT,
    intervention_needed INTEGER DEFAULT 0,
    recommended_techniques TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
  );

  CREATE TABLE IF NOT EXISTS therapists (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    profile_id TEXT UNIQUE NOT NULL,
    specializations TEXT,
    years_of_experience INTEGER,
    bio TEXT,
    hourly_rate TEXT,
    is_available INTEGER DEFAULT 1,
    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
    updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
  );

  CREATE TABLE IF NOT EXISTS user_goals (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    priority TEXT DEFAULT 'medium',
    target_date INTEGER,
    status TEXT DEFAULT 'active',
    progress INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
    updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
  );

  CREATE TABLE IF NOT EXISTS goal_progress (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    goal_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    note TEXT,
    progress_value INTEGER,
    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
  );

  CREATE TABLE IF NOT EXISTS intervention_summaries (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    session_id TEXT,
    intervention_type TEXT NOT NULL,
    anxiety_level_before INTEGER,
    anxiety_level_after INTEGER,
    techniques_used TEXT,
    effectiveness_rating INTEGER,
    notes TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
  );

  CREATE TABLE IF NOT EXISTS therapist_patients (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    therapist_id TEXT NOT NULL,
    patient_code TEXT NOT NULL,
    patient_name TEXT,
    added_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
    UNIQUE(therapist_id, patient_code)
  );

  CREATE TABLE IF NOT EXISTS therapist_patient_connections (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    patient_id TEXT NOT NULL,
    therapist_email TEXT NOT NULL,
    patient_email TEXT NOT NULL,
    patient_code TEXT NOT NULL,
    patient_consent_given INTEGER DEFAULT 0,
    therapist_accepted INTEGER DEFAULT 0,
    connection_request_date INTEGER,
    connection_accepted_date INTEGER,
    share_analytics INTEGER DEFAULT 0,
    share_reports INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    notes TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
    updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
  );

  CREATE TABLE IF NOT EXISTS email_queue (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    to_email TEXT NOT NULL,
    from_email TEXT,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    text_content TEXT,
    html_content TEXT,
    email_type TEXT,
    metadata TEXT,
    status TEXT DEFAULT 'pending',
    attempts INTEGER DEFAULT 0,
    last_error TEXT,
    sent_at INTEGER,
    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
    updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
  );
`);

export const pool = null; // SQLite doesn't use connection pool
export const db = drizzle(sqliteDb);
export const sqliteDatabase = sqliteDb; // Export raw SQLite instance for direct queries

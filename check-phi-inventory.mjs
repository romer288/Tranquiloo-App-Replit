#!/usr/bin/env node
import postgres from 'postgres';

const sql = postgres('postgresql://postgres.przforeyoxweawyfrxws:Casas123!Cecasem123!@aws-1-us-east-2.pooler.supabase.com:6543/postgres', {
  ssl: 'require',
  prepare: false
});

console.log('\n=== PHI INVENTORY ACROSS ALL TABLES ===\n');

// Profiles
const profiles = await sql`SELECT COUNT(*) as count FROM profiles`;
console.log('✅ Profiles (names, emails, patient codes):', profiles[0].count);

// Wellness tracking
const wellness = await sql`SELECT COUNT(*) as count FROM wellness_tracking`;
console.log('✅ Wellness tracking entries (mood, anxiety):', wellness[0].count);

// Chat sessions and messages
const sessions = await sql`SELECT COUNT(*) as count FROM chat_sessions`;
const messages = await sql`SELECT COUNT(*) as count FROM chat_messages`;
console.log('✅ Chat sessions:', sessions[0].count);
console.log('✅ Chat messages (therapy conversations):', messages[0].count);

// Anxiety analyses
const anxiety = await sql`SELECT COUNT(*) as count FROM anxiety_analyses`;
console.log('✅ Anxiety analyses:', anxiety[0].count);

// Appointments
const appointments = await sql`SELECT COUNT(*) as count FROM appointments`;
console.log('✅ Appointments:', appointments[0].count);

// User goals
const goals = await sql`SELECT COUNT(*) as count FROM user_goals`;
console.log('✅ User goals:', goals[0].count);

// Treatment plans
const treatment = await sql`SELECT COUNT(*) as count FROM treatment_plans`;
console.log('✅ Treatment plans:', treatment[0].count);

// Conversation summaries
const summaries = await sql`SELECT COUNT(*) as count FROM conversation_summaries`;
console.log('✅ Conversation summaries:', summaries[0].count);

// Email queue (contains PHI in email content)
const emailQueue = await sql`SELECT COUNT(*) as count FROM email_queue`;
console.log('✅ Email queue (contains verification emails with names):', emailQueue[0].count);

console.log('\n=== TOTAL PHI RECORDS ===');
const totalRecords =
  parseInt(profiles[0].count) +
  parseInt(wellness[0].count) +
  parseInt(sessions[0].count) +
  parseInt(messages[0].count) +
  parseInt(anxiety[0].count) +
  parseInt(appointments[0].count) +
  parseInt(goals[0].count) +
  parseInt(treatment[0].count) +
  parseInt(summaries[0].count) +
  parseInt(emailQueue[0].count);

console.log(`📊 Total PHI records: ${totalRecords}`);

await sql.end();

#!/usr/bin/env node
import postgres from 'postgres';

const sql = postgres('postgresql://postgres.przforeyoxweawyfrxws:Casas123!Cecasem123!@aws-1-us-east-2.pooler.supabase.com:6543/postgres', {
  ssl: 'require',
  prepare: false
});

console.log('\n=== Email Queue Status ===\n');

const emails = await sql`
  SELECT id, to_email, email_type, status, subject, created_at, sent_at
  FROM email_queue
  ORDER BY created_at DESC
  LIMIT 10
`;

console.log('Recent emails in queue:');
console.table(emails);

console.log('\n=== Email Status Summary ===\n');
const summary = await sql`
  SELECT status, COUNT(*) as count
  FROM email_queue
  GROUP BY status
`;
console.table(summary);

await sql.end();

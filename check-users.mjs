import postgres from 'postgres';
import { createClient } from '@supabase/supabase-js';

const sql = postgres('postgresql://postgres.przforeyoxweawyfrxws:Casas123!Cecasem123!@aws-1-us-east-2.pooler.supabase.com:6543/postgres', {
  ssl: 'require',
  prepare: false
});

// Check Supabase Auth users
console.log('\n=== Checking Supabase Auth ===');
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://przforeyoxweawyfrxws.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || ''
);

try {
  const { data: users, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Error getting Supabase Auth users:', error);
  } else {
    console.log(`Found ${users.users.length} users in Supabase Auth:`);
    console.table(users.users.map(u => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      email_confirmed: u.email_confirmed_at ? 'Yes' : 'No'
    })));
  }
} catch (err) {
  console.error('Failed to check Supabase Auth:', err.message);
}

// Check profiles table
const profiles = await sql`SELECT id, first_name, last_name, role, created_at FROM profiles ORDER BY created_at DESC LIMIT 10`;
console.log('\n=== Profiles in database ===');
console.table(profiles);

await sql.end();

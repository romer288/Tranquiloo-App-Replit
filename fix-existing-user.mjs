#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import postgres from 'postgres';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://przforeyoxweawyfrxws.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || ''
);

const sql = postgres('postgresql://postgres.przforeyoxweawyfrxws:Casas123!Cecasem123!@aws-1-us-east-2.pooler.supabase.com:6543/postgres', {
  ssl: 'require',
  prepare: false
});

console.log('\n=== Fixing Existing Profile Without Auth User ===\n');

// Get profiles that don't have Auth users
const profiles = await sql`
  SELECT id, email, first_name, last_name, role
  FROM profiles
  WHERE email IS NOT NULL
  ORDER BY created_at DESC
`;

console.log(`Found ${profiles.length} profiles in database`);

for (const profile of profiles) {
  console.log(`\nChecking profile: ${profile.email} (${profile.id})`);

  // Check if Auth user exists
  const { data: authUser, error: getUserError } = await supabase.auth.admin.getUserById(profile.id);

  if (authUser && authUser.user) {
    console.log(`✅ Auth user already exists for ${profile.email}`);
    continue;
  }

  console.log(`❌ No Auth user found for ${profile.email}`);
  console.log(`Creating Supabase Auth user with ID: ${profile.id}`);

  // Create Auth user with the same ID as the profile
  const { data: newAuthUser, error: createError } = await supabase.auth.admin.createUser({
    id: profile.id, // Use existing profile ID
    email: profile.email,
    email_confirm: true,
    user_metadata: {
      full_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
      role: profile.role
    }
  });

  if (createError) {
    console.error(`❌ Failed to create Auth user for ${profile.email}:`, createError.message);
  } else {
    console.log(`✅ Successfully created Auth user for ${profile.email}`);
    console.log(`   User ID: ${newAuthUser.user.id}`);
  }
}

console.log('\n=== Verification ===\n');

// List all Auth users
const { data: allAuthUsers } = await supabase.auth.admin.listUsers();
console.log(`Total Supabase Auth users: ${allAuthUsers?.users.length || 0}`);
if (allAuthUsers?.users) {
  console.table(allAuthUsers.users.map(u => ({
    id: u.id,
    email: u.email,
    created_at: u.created_at,
    email_confirmed: u.email_confirmed_at ? 'Yes' : 'No'
  })));
}

await sql.end();
console.log('\n✅ Done!\n');

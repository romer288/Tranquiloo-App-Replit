#!/usr/bin/env node
import postgres from 'postgres';

const sql = postgres('postgresql://postgres.przforeyoxweawyfrxws:Casas123!Cecasem123!@aws-1-us-east-2.pooler.supabase.com:6543/postgres', {
  ssl: 'require',
  prepare: false
});

console.log('\n=== Checking RLS Status ===\n');

// Check which tables have RLS enabled
const tablesRLS = await sql`
  SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY tablename
`;

console.log('Tables with RLS status:');
console.table(tablesRLS.map(t => ({
  table: t.tablename,
  rls_enabled: t.rls_enabled ? '✅' : '❌'
})));

// Count RLS policies per table
const policies = await sql`
  SELECT
    tablename,
    COUNT(*) as policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  GROUP BY tablename
  ORDER BY tablename
`;

console.log('\nPolicies per table:');
console.table(policies);

// List all existing policies
const allPolicies = await sql`
  SELECT
    tablename,
    policyname,
    cmd as command,
    roles
  FROM pg_policies
  WHERE schemaname = 'public'
  ORDER BY tablename, policyname
`;

console.log('\nAll existing policies:');
console.table(allPolicies);

await sql.end();

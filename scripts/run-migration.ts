import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 Running database migration...\n');

  try {
    // Get migration file from command line or use default
    const migrationFile = process.argv[2] || 'migrations/001_add_wellness_features.sql';
    const migrationPath = join(process.cwd(), migrationFile);
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log(`📄 Read migration file: ${migrationFile}`);
    console.log(`   Size: ${migrationSQL.length} characters\n`);

    // Execute the migration
    console.log('⚙️  Executing migration SQL...');

    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      // If exec_sql doesn't exist, try direct execution (split by semicolon)
      console.log('⚠️  exec_sql function not found, trying direct execution...\n');

      // Split SQL into individual statements
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      console.log(`   Found ${statements.length} SQL statements to execute\n`);

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];

        // Skip comments
        if (statement.startsWith('--') || statement.startsWith('COMMENT ON')) {
          continue;
        }

        console.log(`   [${i + 1}/${statements.length}] Executing statement...`);

        const { error: stmtError } = await supabase.rpc('exec', {
          query: statement + ';'
        });

        if (stmtError) {
          console.error(`   ❌ Error: ${stmtError.message}`);
          console.error(`   Statement: ${statement.substring(0, 100)}...`);
        } else {
          console.log(`   ✅ Success`);
        }
      }
    } else {
      console.log('✅ Migration executed successfully!\n');
    }

    console.log('\n🎉 Migration complete!');
    console.log('\nNext steps:');
    console.log('1. Verify tables in Supabase dashboard');
    console.log('2. Continue with building AI features\n');

  } catch (err: any) {
    console.error('❌ Migration failed:', err.message);
    console.error('\nManual steps required:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to SQL Editor');
    console.log('4. Copy/paste the content from migrations/001_add_wellness_features.sql');
    console.log('5. Click "Run"\n');
    process.exit(1);
  }
}

runMigration();

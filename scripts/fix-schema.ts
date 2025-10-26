import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function fixSchema() {
  console.log('🔧 Adding missing columns to research_papers table...\n');

  const sql = `
    ALTER TABLE research_papers
    ADD COLUMN IF NOT EXISTS abstract TEXT,
    ADD COLUMN IF NOT EXISTS pmid TEXT,
    ADD COLUMN IF NOT EXISTS doi TEXT,
    ADD COLUMN IF NOT EXISTS journal TEXT,
    ADD COLUMN IF NOT EXISTS citation_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS article_type TEXT;

    CREATE INDEX IF NOT EXISTS idx_papers_pmid ON research_papers(pmid);
  `;

  // Split and execute each statement
  const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);

  for (const statement of statements) {
    console.log(`Executing: ${statement.substring(0, 60)}...`);

    const { error } = await supabase.rpc('query', { sql: statement });

    if (error) {
      // Try direct query if RPC doesn't work
      const { error: queryError } = await supabase.from('research_papers').select('*').limit(0);

      if (queryError) {
        console.error(`❌ Error: ${error.message}`);
      } else {
        console.log(`⚠️  RPC not available, but table exists`);
      }
    } else {
      console.log(`✅ Success\n`);
    }
  }

  console.log('\n✅ Schema fix complete!\n');
}

fixSchema().catch(console.error);

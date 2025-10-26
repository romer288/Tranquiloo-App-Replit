import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function test() {
  const { data: papers, error } = await supabase
    .from('research_papers')
    .select('id, title, topic')
    .limit(10);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log(`Found ${papers?.length || 0} papers:`);
    papers?.forEach(p => console.log(`- ${p.topic}: ${p.title.substring(0, 60)}...`));
  }
}

test();

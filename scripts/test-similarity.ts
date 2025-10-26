import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}

async function testSimilarity() {
  const testQuery = "I have anxiety and can't sleep";

  console.log(`\n🔍 Testing similarity for: "${testQuery}"\n`);

  // Generate embedding for the query
  const queryEmbedding = await generateEmbedding(testQuery);
  console.log(`✅ Generated query embedding (${queryEmbedding.length} dimensions)\n`);

  // Search with NO threshold to see all similarity scores
  const { data, error } = await supabase.rpc('search_research_papers', {
    query_embedding: queryEmbedding,
    match_threshold: 0.0, // No threshold - show all
    match_count: 10,
  });

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`📊 Similarity scores for all papers:\n`);
  data?.forEach((paper: any, i: number) => {
    console.log(`${i + 1}. Similarity: ${(paper.similarity * 100).toFixed(1)}%`);
    console.log(`   Topic: ${paper.topic}`);
    console.log(`   Title: ${paper.title.substring(0, 60)}...`);
    console.log();
  });

  console.log(`\n💡 Recommendations:`);
  if (data && data.length > 0) {
    const maxSim = Math.max(...data.map((p: any) => p.similarity));
    console.log(`   - Highest similarity: ${(maxSim * 100).toFixed(1)}%`);
    console.log(`   - Current threshold: 50% (0.5)`);
    console.log(`   - Papers above threshold: ${data.filter((p: any) => p.similarity > 0.5).length}`);
    console.log(`   - Suggested threshold: ${Math.max(0.3, maxSim - 0.1).toFixed(2)} (${(Math.max(0.3, maxSim - 0.1) * 100).toFixed(0)}%)`);
  }
}

testSimilarity();

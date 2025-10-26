import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export interface ResearchPaper {
  id: string;
  title: string;
  authors: string | null;
  year: number | null;
  topic: string | null;
  content: string;
  summary: string | null;
  source_url: string | null;
  similarity?: number;
}

/**
 * Generate embedding for a query using OpenAI
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });

  return response.data[0].embedding;
}

/**
 * Search research papers using semantic similarity
 */
export async function searchResearchPapers(
  query: string,
  options: {
    matchThreshold?: number;
    matchCount?: number;
    topicFilter?: string;
  } = {}
): Promise<ResearchPaper[]> {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured. Returning empty results.');
    return [];
  }

  const {
    matchThreshold = 0.7,
    matchCount = 5,
    topicFilter,
  } = options;

  // Generate embedding for the query
  const queryEmbedding = await generateEmbedding(query);

  // Call Supabase function to search papers
  console.log(`[RAG] Calling search_research_papers with threshold ${matchThreshold}`);
  const { data, error } = await supabase.rpc('search_research_papers', {
    query_embedding: queryEmbedding,
    match_threshold: matchThreshold,
    match_count: matchCount,
  });

  if (error) {
    console.error('[RAG] Error searching research papers:', error);
    throw new Error(`Failed to search research papers: ${error.message}`);
  }

  console.log(`[RAG] RPC returned ${data?.length || 0} results`);

  let results = data || [];

  // Filter by topic if specified
  if (topicFilter && results.length > 0) {
    results = results.filter((paper: any) =>
      paper.topic?.toLowerCase().includes(topicFilter.toLowerCase())
    );
  }

  return results.map((paper: any) => ({
    id: paper.id,
    title: paper.title,
    authors: paper.authors,
    year: paper.year,
    topic: paper.topic,
    content: paper.content,
    summary: paper.summary,
    source_url: paper.source_url,
    similarity: paper.similarity,
  }));
}

/**
 * Get relevant research context for an AI conversation
 * Returns formatted text to include in AI prompt
 */
export async function getResearchContext(
  userMessage: string,
  maxPapers: number = 3
): Promise<string> {
  try {
    console.log(`[RAG] Searching for papers matching: "${userMessage.substring(0, 50)}..."`);
    const papers = await searchResearchPapers(userMessage, {
      matchCount: maxPapers,
      matchThreshold: 0.25, // Adjusted for casual vs academic language gap
    });

    console.log(`[RAG] Found ${papers.length} papers`);
    if (papers.length === 0) {
      return '';
    }

    // Format papers as context for AI
    const context = papers.map((paper, index) => {
      const citation = paper.authors && paper.year
        ? `${paper.authors} (${paper.year})`
        : paper.title;

      return `
[Research Paper ${index + 1}]
Title: ${paper.title}
Citation: ${citation}
Topic: ${paper.topic || 'General'}
${paper.summary || paper.content.substring(0, 500)}...
${paper.source_url ? `Source: ${paper.source_url}` : ''}
      `.trim();
    }).join('\n\n---\n\n');

    return `
The following research papers are relevant to the user's question:

${context}

Please reference these papers in your response when appropriate, using citations like "(Author, Year)" or "According to research on [topic]...".
    `.trim();
  } catch (error) {
    console.error('Error getting research context:', error);
    return ''; // Fail gracefully
  }
}

/**
 * Store a research paper with its embedding
 */
export async function storeResearchPaper(paper: {
  title: string;
  authors?: string;
  year?: number;
  topic?: string;
  content: string;
  summary?: string;
  source_url?: string;
}): Promise<string> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  // Generate embedding for the paper content
  const embedding = await generateEmbedding(
    `${paper.title} ${paper.summary || paper.content}`
  );

  const { data, error } = await supabase
    .from('research_papers')
    .insert({
      title: paper.title,
      authors: paper.authors || null,
      year: paper.year || null,
      topic: paper.topic || null,
      content: paper.content,
      summary: paper.summary || null,
      source_url: paper.source_url || null,
      embedding: embedding,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error storing research paper:', error);
    throw new Error(`Failed to store research paper: ${error.message}`);
  }

  return data.id;
}

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
  citationCount?: number;
  qualityScore?: number;
}

/**
 * Generate embedding for a query using OpenAI
 */
async function generateEmbedding(text: string): Promise<number[]> {
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
 * PHASE 2 ENHANCEMENT: Query Expansion
 * Expand user's casual language into medical/clinical terms
 */
function expandQuery(userMessage: string): string[] {
  const queries = [userMessage]; // Always include original

  const lowerMessage = userMessage.toLowerCase();

  // Anxiety-related expansions
  if (lowerMessage.match(/anxious|anxiety|worry|worried|nervous|panic/)) {
    queries.push('anxiety disorder treatment cognitive behavioral therapy');
    queries.push('generalized anxiety disorder GAD intervention');
    if (lowerMessage.includes('panic')) {
      queries.push('panic disorder panic attacks treatment');
    }
    if (lowerMessage.match(/social|people|public/)) {
      queries.push('social anxiety disorder social phobia treatment');
    }
  }

  // Depression-related expansions
  if (lowerMessage.match(/depress|sad|hopeless|unmotivated|low mood/)) {
    queries.push('major depressive disorder treatment');
    queries.push('depression cognitive behavioral therapy');
    queries.push('behavioral activation depression intervention');
  }

  // Sleep-related expansions
  if (lowerMessage.match(/sleep|insomnia|tired|exhausted|can't sleep/)) {
    queries.push('insomnia cognitive behavioral therapy CBT-I');
    queries.push('sleep disorder treatment sleep hygiene');
    queries.push('anxiety related insomnia intervention');
  }

  // Trauma/PTSD-related expansions
  if (lowerMessage.match(/trauma|ptsd|flashback|nightmare|abuse/)) {
    queries.push('post-traumatic stress disorder PTSD treatment');
    queries.push('trauma focused cognitive behavioral therapy');
    queries.push('prolonged exposure therapy');
  }

  // OCD-related expansions
  if (lowerMessage.match(/ocd|obsess|compuls|intrusive thought|ritual/)) {
    queries.push('obsessive compulsive disorder OCD treatment');
    queries.push('exposure response prevention ERP');
  }

  // Eating disorder expansions
  if (lowerMessage.match(/eating|anorexia|bulimia|binge|food|weight/)) {
    queries.push('eating disorder treatment cognitive behavioral therapy');
    queries.push('anorexia nervosa bulimia intervention');
  }

  // Stress/coping expansions
  if (lowerMessage.match(/stress|overwhelm|cope|coping|burnout/)) {
    queries.push('stress management intervention');
    queries.push('mindfulness based stress reduction');
    queries.push('coping strategies psychological intervention');
  }

  // Remove duplicates
  return [...new Set(queries)];
}

/**
 * PHASE 2 ENHANCEMENT: Keyword Matching Score
 * Boost papers that contain exact keywords from user query
 */
function calculateKeywordScore(paper: ResearchPaper, userMessage: string): number {
  const keywords = userMessage.toLowerCase().split(/\s+/)
    .filter(word => word.length > 3); // Only words longer than 3 chars

  const paperText = `${paper.title} ${paper.content} ${paper.summary}`.toLowerCase();

  let matchCount = 0;
  for (const keyword of keywords) {
    if (paperText.includes(keyword)) {
      matchCount++;
    }
  }

  return keywords.length > 0 ? matchCount / keywords.length : 0;
}

/**
 * PHASE 2 ENHANCEMENT: Extract citation count from paper content
 */
function extractCitationCount(paper: ResearchPaper): number {
  const match = paper.content.match(/CITATION COUNT:\s*(\d+)/i);
  return match ? parseInt(match[1]) : 0;
}

/**
 * PHASE 2 ENHANCEMENT: Calculate quality score for re-ranking
 */
function calculateQualityScore(
  paper: ResearchPaper,
  similarity: number,
  keywordScore: number
): number {
  const citations = extractCitationCount(paper);
  const year = paper.year || 2000;

  // Normalize citation count (log scale, max = 10)
  const citationScore = Math.min(Math.log(citations + 1) / Math.log(5000), 1);

  // Recency bonus (papers from 2020-2025 get bonus)
  const recencyScore = year >= 2020 ? 1.0 : year >= 2015 ? 0.7 : year >= 2010 ? 0.4 : 0.2;

  // Article type bonus
  let articleTypeScore = 0.5;
  const content = paper.content.toLowerCase();
  if (content.includes('meta-analysis')) articleTypeScore = 1.0;
  else if (content.includes('systematic review')) articleTypeScore = 0.9;
  else if (content.includes('randomized controlled trial') || content.includes('rct')) articleTypeScore = 0.8;
  else if (content.includes('review')) articleTypeScore = 0.6;

  // Weighted combination
  const qualityScore =
    0.40 * similarity +           // Semantic match (40%)
    0.20 * keywordScore +          // Exact keyword match (20%)
    0.20 * citationScore +         // Citation count (20%)
    0.10 * recencyScore +          // Recency (10%)
    0.10 * articleTypeScore;       // Study quality (10%)

  return qualityScore;
}

/**
 * PHASE 2 ENHANCED: Search with query expansion, hybrid scoring, and re-ranking
 */
export async function enhancedSearchResearchPapers(
  userMessage: string,
  options: {
    maxPapers?: number;
    minThreshold?: number;
    topicFilter?: string;
  } = {}
): Promise<ResearchPaper[]> {
  if (!isSupabaseConfigured()) {
    console.warn('[RAG] Supabase not configured');
    return [];
  }

  const { maxPapers = 5, minThreshold = 0.20, topicFilter } = options;

  console.log(`[RAG] Enhanced search for: "${userMessage.substring(0, 50)}..."`);

  // STEP 1: Query Expansion
  const expandedQueries = expandQuery(userMessage);
  console.log(`[RAG] Expanded to ${expandedQueries.length} queries`);

  const allPapers = new Map<string, ResearchPaper>();

  // STEP 2: Search each expanded query
  for (const query of expandedQueries) {
    try {
      const queryEmbedding = await generateEmbedding(query);

      const { data, error } = await supabase.rpc('search_research_papers', {
        query_embedding: queryEmbedding,
        match_threshold: minThreshold,
        match_count: 10, // Get more than needed for re-ranking
      });

      if (error) {
        console.error('[RAG] Search error:', error.message);
        continue;
      }

      // Add to results (de-duplicate by ID)
      data?.forEach((paper: any) => {
        if (!allPapers.has(paper.id)) {
          allPapers.set(paper.id, {
            id: paper.id,
            title: paper.title,
            authors: paper.authors,
            year: paper.year,
            topic: paper.topic,
            content: paper.content,
            summary: paper.summary,
            source_url: paper.source_url,
            similarity: paper.similarity,
          });
        } else {
          // If duplicate, keep the higher similarity score
          const existing = allPapers.get(paper.id)!;
          if (paper.similarity > existing.similarity!) {
            allPapers.set(paper.id, {
              ...existing,
              similarity: paper.similarity,
            });
          }
        }
      });
    } catch (error: any) {
      console.error(`[RAG] Error searching query "${query}":`, error.message);
    }
  }

  let results = Array.from(allPapers.values());
  console.log(`[RAG] Found ${results.length} unique papers before filtering`);

  // STEP 3: Topic filtering (if specified)
  if (topicFilter && results.length > 0) {
    results = results.filter((paper) =>
      paper.topic?.toLowerCase().includes(topicFilter.toLowerCase())
    );
    console.log(`[RAG] ${results.length} papers after topic filter "${topicFilter}"`);
  }

  // STEP 4: Hybrid scoring (semantic + keyword matching)
  results.forEach((paper) => {
    const keywordScore = calculateKeywordScore(paper, userMessage);
    const qualityScore = calculateQualityScore(
      paper,
      paper.similarity || 0,
      keywordScore
    );
    paper.qualityScore = qualityScore;
  });

  // STEP 5: Re-rank by quality score
  results.sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0));

  // STEP 6: Return top N
  const finalResults = results.slice(0, maxPapers);

  console.log(`[RAG] Returning ${finalResults.length} top papers after re-ranking`);
  finalResults.forEach((paper, i) => {
    console.log(`  ${i + 1}. [${(paper.qualityScore! * 100).toFixed(1)}%] ${paper.title.substring(0, 50)}...`);
  });

  return finalResults;
}

/**
 * Get formatted research context for AI prompt (enhanced version)
 */
export async function getEnhancedResearchContext(
  userMessage: string,
  maxPapers: number = 3
): Promise<string> {
  try {
    const papers = await enhancedSearchResearchPapers(userMessage, {
      maxPapers,
      minThreshold: 0.20,
    });

    if (papers.length === 0) {
      console.log('[RAG] No relevant papers found');
      return '';
    }

    // Format papers as context for AI
    const context = papers.map((paper, index) => {
      const citation = paper.authors && paper.year
        ? `${paper.authors} (${paper.year})`
        : paper.title;

      const citationCount = extractCitationCount(paper);

      return `
[Research Paper ${index + 1}]
Title: ${paper.title}
Citation: ${citation}
Evidence Quality: ${citationCount} citations | ${paper.topic || 'General'}
Relevance Score: ${((paper.qualityScore || 0) * 100).toFixed(0)}%

${paper.summary || paper.content.substring(0, 500)}...

${paper.source_url ? `Source: ${paper.source_url}` : ''}
      `.trim();
    }).join('\n\n---\n\n');

    return `
The following research papers are relevant to the user's question:

${context}

Please reference these papers in your response when appropriate, using citations like "(Author, Year)" or "According to research on [topic]...".
    `.trim();
  } catch (error: any) {
    console.error('[RAG] Error getting research context:', error.message);
    return ''; // Fail gracefully
  }
}

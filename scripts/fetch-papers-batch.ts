/**
 * Multi-source batch paper fetching with rate limiting and fallbacks
 *
 * Architecture:
 * 1. PubMed ESearch → PMIDs (recall)
 * 2. PubMed ESummary → metadata (batched, ≤200 per call)
 * 3. OpenAlex → citations by DOI/PMID (batch with cursor)
 * 4. Crossref → fallback DOI metadata
 * 5. EPMC → last resort for abstracts
 */

import Bottleneck from 'bottleneck';
import { createClient } from '@supabase/supabase-js';
import { OpenAIEmbeddings } from '@langchain/openai';

// Rate-limited fetcher with retries and caching
const limiter = new Bottleneck({
  maxConcurrent: 2,
  minTime: 200, // 200ms between requests
});

interface CachedResponse {
  data: any;
  timestamp: number;
  endpoint: string;
}

const cache = new Map<string, CachedResponse>();
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

async function cachedFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  const cacheKey = endpoint + JSON.stringify(options);

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    console.log(`    [CACHE HIT] ${endpoint.slice(0, 80)}...`);
    return cached.data;
  }

  // Fetch with retries
  return limiter.schedule(async () => {
    for (let attempt = 0, delay = 250; attempt < 5; attempt++, delay *= 2) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        const res = await fetch(endpoint, {
          ...options,
          headers: {
            'User-Agent': 'Tranquiloo/1.0 (mental-health-research; contact@tranquiloo.app)',
            ...options.headers,
          },
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (res.ok) {
          const data = await res.json();
          cache.set(cacheKey, { data, timestamp: Date.now(), endpoint });
          return data;
        }

        if (res.status >= 500) {
          // Server error - retry with backoff
          const jitter = Math.random() * 150;
          console.warn(`    [RETRY ${attempt + 1}/5] ${res.status} - waiting ${delay + jitter}ms`);
          await new Promise(r => setTimeout(r, delay + jitter));
          continue;
        }

        throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      } catch (error: any) {
        if (attempt === 4) throw error;

        const jitter = Math.random() * 150;
        console.warn(`    [RETRY ${attempt + 1}/5] ${error.message} - waiting ${delay + jitter}ms`);
        await new Promise(r => setTimeout(r, delay + jitter));
      }
    }
    throw new Error('Max retries exceeded');
  });
}

// DSM-5 category configurations with targeted queries
const DSM5_CATEGORIES = [
  {
    category: 'ANXIETY_DISORDERS',
    name: 'Anxiety Disorders',
    targetCount: 100,
    subQueries: [
      // Diagnosis & screening
      {
        name: 'Anxiety diagnosis/screening',
        term: '("Anxiety Disorders"[MeSH] OR "Generalized Anxiety Disorder"[MeSH]) AND (diagnosis[Title/Abstract] OR screening[Title/Abstract] OR assessment[Title/Abstract])',
        subtopic: 'diagnosis',
      },
      // Treatment - CBT/Exposure
      {
        name: 'Anxiety CBT/exposure therapy',
        term: '("Anxiety Disorders"[MeSH]) AND ("exposure therapy"[Title/Abstract] OR "cognitive behavioral therapy"[Title/Abstract] OR CBT[Title/Abstract]) AND (meta-analysis[Publication Type] OR systematic[sb] OR guideline[Publication Type])',
        subtopic: 'CBT-exposure',
      },
      // Treatment - Pharmacotherapy
      {
        name: 'Anxiety pharmacotherapy',
        term: '("Anxiety Disorders"[MeSH]) AND (SSRI[Title/Abstract] OR SNRI[Title/Abstract] OR benzodiazepine[Title/Abstract] OR pharmacotherapy[Title/Abstract]) AND (systematic[sb] OR meta-analysis[Publication Type])',
        subtopic: 'pharmacotherapy',
      },
      // Specific: Panic disorder
      {
        name: 'Panic disorder treatment',
        term: '("Panic Disorder"[MeSH] OR "panic attack"[Title/Abstract]) AND (treatment[Title/Abstract] OR therapy[Title/Abstract]) AND (meta-analysis[Publication Type] OR systematic[sb])',
        subtopic: 'panic',
      },
      // Specific: Social anxiety
      {
        name: 'Social anxiety treatment',
        term: '("Phobia, Social"[MeSH] OR "Social Anxiety Disorder"[Title/Abstract]) AND (treatment[Title/Abstract] OR therapy[Title/Abstract]) AND (meta-analysis[Publication Type] OR systematic[sb])',
        subtopic: 'social-anxiety',
      },
    ],
    minCitations: 15,
    dateRanges: [
      { name: '2013-2018', minDate: '2013/01/01', maxDate: '2018/12/31' },
      { name: '2019-2025', minDate: '2019/01/01', maxDate: '2025/12/31' },
    ],
  },
  {
    category: 'OCD_RELATED_DISORDERS',
    name: 'OCD & Related Disorders',
    targetCount: 100,
    subQueries: [
      // ERP - core treatment
      {
        name: 'OCD ERP treatment',
        term: '("Obsessive-Compulsive Disorder"[MeSH]) AND ("exposure and response prevention"[Title/Abstract] OR ERP[Title/Abstract] OR "exposure therapy"[Title/Abstract]) AND (meta-analysis[Publication Type] OR guideline[Publication Type] OR systematic[sb])',
        subtopic: 'ERP',
      },
      // Subtypes (harm, contamination, checking)
      {
        name: 'OCD subtypes',
        term: '("Obsessive-Compulsive Disorder"[MeSH]) AND (harm[Title/Abstract] OR contamination[Title/Abstract] OR checking[Title/Abstract] OR symmetry[Title/Abstract]) AND (treatment[Title/Abstract] OR therapy[Title/Abstract])',
        subtopic: 'subtypes',
      },
      // Pharmacotherapy & augmentation
      {
        name: 'OCD pharmacotherapy',
        term: '("Obsessive-Compulsive Disorder"[MeSH]) AND (SSRI[Title/Abstract] OR clomipramine[Title/Abstract] OR "antipsychotic augmentation"[Title/Abstract]) AND (meta-analysis[Publication Type] OR systematic[sb])',
        subtopic: 'pharmacotherapy',
      },
      // Body dysmorphic disorder
      {
        name: 'Body dysmorphic disorder',
        term: '("Body Dysmorphic Disorder"[MeSH] OR BDD[Title/Abstract]) AND (treatment[Title/Abstract] OR therapy[Title/Abstract])',
        subtopic: 'BDD',
      },
      // Hoarding disorder
      {
        name: 'Hoarding disorder',
        term: '("Hoarding Disorder"[Title/Abstract]) AND (treatment[Title/Abstract] OR intervention[Title/Abstract])',
        subtopic: 'hoarding',
      },
    ],
    minCitations: 15,
    dateRanges: [
      { name: '2013-2018', minDate: '2013/01/01', maxDate: '2018/12/31' },
      { name: '2019-2025', minDate: '2019/01/01', maxDate: '2025/12/31' },
    ],
  },
  {
    category: 'DEPRESSIVE_DISORDERS',
    name: 'Depressive Disorders',
    targetCount: 100,
    subQueries: [
      // MDD general treatment
      {
        name: 'Major depression treatment',
        term: '("Depressive Disorder, Major"[MeSH] OR "Major Depressive Disorder"[Title/Abstract] OR MDD[Title/Abstract]) AND (treatment[Title/Abstract] OR therapy[Title/Abstract]) AND (meta-analysis[Publication Type] OR guideline[Publication Type])',
        subtopic: 'MDD-treatment',
      },
      // Treatment-resistant depression
      {
        name: 'Treatment-resistant depression',
        term: '("Depressive Disorder, Major"[MeSH]) AND ("treatment resistant"[Title/Abstract] OR "treatment-resistant"[Title/Abstract] OR augmentation[Title/Abstract] OR switching[Title/Abstract]) AND (meta-analysis[Publication Type] OR systematic[sb])',
        subtopic: 'TRD',
      },
      // CBT/behavioral activation
      {
        name: 'Depression psychotherapy',
        term: '("Depressive Disorder, Major"[MeSH]) AND ("cognitive behavioral therapy"[Title/Abstract] OR "behavioral activation"[Title/Abstract] OR "interpersonal therapy"[Title/Abstract] OR IPT[Title/Abstract]) AND (meta-analysis[Publication Type] OR systematic[sb])',
        subtopic: 'psychotherapy',
      },
      // Persistent depressive disorder
      {
        name: 'Persistent depressive disorder',
        term: '("Dysthymic Disorder"[MeSH] OR "Persistent Depressive Disorder"[Title/Abstract]) AND (treatment[Title/Abstract])',
        subtopic: 'dysthymia',
      },
      // Measurement-based care
      {
        name: 'Depression measurement-based care',
        term: '(depression[Title/Abstract]) AND ("measurement-based care"[Title/Abstract] OR PHQ-9[Title/Abstract]) AND (systematic[sb] OR meta-analysis[Publication Type])',
        subtopic: 'measurement-based-care',
      },
    ],
    minCitations: 15,
    dateRanges: [
      { name: '2013-2018', minDate: '2013/01/01', maxDate: '2018/12/31' },
      { name: '2019-2025', minDate: '2019/01/01', maxDate: '2025/12/31' },
    ],
  },
  {
    category: 'TRAUMA_STRESSOR_DISORDERS',
    name: 'Trauma & Stressor-Related Disorders',
    targetCount: 100,
    subQueries: [
      // PTSD evidence-based therapies
      {
        name: 'PTSD psychotherapy',
        term: '("Stress Disorders, Post-Traumatic"[MeSH] OR PTSD[Title/Abstract]) AND ("prolonged exposure"[Title/Abstract] OR PE[Title/Abstract] OR CPT[Title/Abstract] OR EMDR[Title/Abstract]) AND (meta-analysis[Publication Type] OR guideline[Publication Type] OR systematic[sb])',
        subtopic: 'PTSD-therapy',
      },
      // PTSD nightmares
      {
        name: 'PTSD nightmares treatment',
        term: '(PTSD[Title/Abstract] OR "posttraumatic stress"[Title/Abstract]) AND ("imagery rehearsal therapy"[Title/Abstract] OR IRT[Title/Abstract] OR nightmares[Title/Abstract]) AND (treatment[Title/Abstract])',
        subtopic: 'nightmares',
      },
      // Complex PTSD
      {
        name: 'Complex PTSD treatment',
        term: '("Complex PTSD"[Title/Abstract] OR "complex trauma"[Title/Abstract] OR "developmental trauma"[Title/Abstract]) AND (treatment[Title/Abstract] OR therapy[Title/Abstract])',
        subtopic: 'complex-PTSD',
      },
      // Acute stress disorder
      {
        name: 'Acute stress disorder',
        term: '("Acute Stress Disorder"[MeSH]) AND (treatment[Title/Abstract] OR "early intervention"[Title/Abstract])',
        subtopic: 'acute-stress',
      },
      // TF-CBT (trauma-focused CBT)
      {
        name: 'Trauma-focused CBT',
        term: '("trauma focused cognitive behavioral therapy"[Title/Abstract] OR "TF-CBT"[Title/Abstract]) AND (systematic[sb] OR meta-analysis[Publication Type])',
        subtopic: 'TF-CBT',
      },
    ],
    minCitations: 15,
    dateRanges: [
      { name: '2013-2018', minDate: '2013/01/01', maxDate: '2018/12/31' },
      { name: '2019-2025', minDate: '2019/01/01', maxDate: '2025/12/31' },
    ],
  },
  {
    category: 'BIPOLAR_DISORDERS',
    name: 'Bipolar & Related Disorders',
    targetCount: 100,
    subQueries: [
      // Mania/maintenance treatment
      {
        name: 'Bipolar mania treatment',
        term: '("Bipolar Disorder"[MeSH]) AND (mania[Title/Abstract] OR hypomania[Title/Abstract] OR maintenance[Title/Abstract]) AND (guideline[Publication Type] OR meta-analysis[Publication Type] OR systematic[sb])',
        subtopic: 'mania-maintenance',
      },
      // Bipolar depression
      {
        name: 'Bipolar depression treatment',
        term: '("Bipolar Disorder"[MeSH]) AND (depression[Title/Abstract] OR "depressive episode"[Title/Abstract]) AND (quetiapine[Title/Abstract] OR lamotrigine[Title/Abstract] OR lurasidone[Title/Abstract] OR psychotherapy[Title/Abstract])',
        subtopic: 'bipolar-depression',
      },
      // Rapid cycling
      {
        name: 'Rapid cycling bipolar',
        term: '("rapid cycling"[Title/Abstract]) AND (bipolar[Title/Abstract]) AND (treatment[Title/Abstract] OR management[Title/Abstract])',
        subtopic: 'rapid-cycling',
      },
      // Antidepressant risk/switching
      {
        name: 'Bipolar antidepressant risk',
        term: '(bipolar[Title/Abstract]) AND (switching[Title/Abstract] OR "antidepressant-induced"[Title/Abstract] OR "antidepressant risk"[Title/Abstract])',
        subtopic: 'antidepressant-risk',
      },
      // Peripartum bipolar
      {
        name: 'Peripartum bipolar',
        term: '(peripartum[Title/Abstract] OR postpartum[Title/Abstract]) AND (bipolar[Title/Abstract]) AND (treatment[Title/Abstract] OR management[Title/Abstract])',
        subtopic: 'peripartum',
      },
    ],
    minCitations: 15,
    dateRanges: [
      { name: '2013-2018', minDate: '2013/01/01', maxDate: '2018/12/31' },
      { name: '2019-2025', minDate: '2019/01/01', maxDate: '2025/12/31' },
    ],
  },
];

// PubMed ESearch - get PMIDs
async function pubmedSearch(query: string, minDate: string, maxDate: string, retmax = 100): Promise<string[]> {
  const baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi';
  const params = new URLSearchParams({
    db: 'pubmed',
    term: query,
    retmax: retmax.toString(),
    retmode: 'json',
    mindate: minDate,
    maxdate: maxDate,
    datetype: 'pdat', // publication date
    usehistory: 'y',
  });

  const data = await cachedFetch(`${baseUrl}?${params}`);
  return data.esearchresult?.idlist || [];
}

// PubMed ESummary - batch metadata (up to 200 PMIDs)
interface PubMedPaper {
  pmid: string;
  title: string;
  authors?: string;
  journal?: string;
  pubDate?: string;
  pubTypes?: string[];
  doi?: string;
}

async function pubmedBatchMetadata(pmids: string[]): Promise<Map<string, PubMedPaper>> {
  if (pmids.length === 0) return new Map();

  const baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi';
  const batchSize = 200;
  const results = new Map<string, PubMedPaper>();

  for (let i = 0; i < pmids.length; i += batchSize) {
    const batch = pmids.slice(i, i + batchSize);
    const params = new URLSearchParams({
      db: 'pubmed',
      id: batch.join(','),
      retmode: 'json',
    });

    console.log(`    [PUBMED] Fetching metadata for ${batch.length} PMIDs (batch ${Math.floor(i / batchSize) + 1})`);

    const data = await cachedFetch(`${baseUrl}?${params}`);

    if (data.result) {
      for (const pmid of batch) {
        const paper = data.result[pmid];
        if (!paper || paper.error) continue;

        results.set(pmid, {
          pmid,
          title: paper.title || '',
          authors: paper.authors?.map((a: any) => a.name).join(', ') || '',
          journal: paper.fulljournalname || paper.source || '',
          pubDate: paper.pubdate || '',
          pubTypes: paper.pubtype || [],
          doi: paper.articleids?.find((id: any) => id.idtype === 'doi')?.value,
        });
      }
    }
  }

  return results;
}

// OpenAlex - batch citations by PMID (cursor pagination)
interface OpenAlexPaper {
  pmid: string;
  doi?: string;
  citedByCount: number;
  isOpenAccess: boolean;
  concepts?: string[];
}

async function openAlexBatchCitations(pmids: string[]): Promise<Map<string, OpenAlexPaper>> {
  if (pmids.length === 0) return new Map();

  const results = new Map<string, OpenAlexPaper>();

  // OpenAlex requires individual PMID lookups via direct URL
  // Use batching with rate limiting to avoid hammering the API
  const batchSize = 25; // Process 25 at a time

  for (let i = 0; i < pmids.length; i += batchSize) {
    const batch = pmids.slice(i, i + batchSize);

    console.log(`    [OPENALEX] Fetching citations for PMIDs ${i + 1}-${i + batch.length} of ${pmids.length}`);

    // Process batch in parallel but rate-limited by Bottleneck
    const promises = batch.map(async (pmid) => {
      try {
        // Try lookup by PMID
        const url = `https://api.openalex.org/works/pmid:${pmid}?select=id,doi,ids,cited_by_count,open_access,concepts`;
        const data = await cachedFetch(url);

        if (data && data.id) {
          return {
            pmid,
            doi: data.doi?.replace('https://doi.org/', ''),
            citedByCount: data.cited_by_count || 0,
            isOpenAccess: data.open_access?.is_oa || false,
            concepts: data.concepts?.slice(0, 5).map((c: any) => c.display_name) || [],
          };
        }
      } catch (error: any) {
        // Silently skip 404s (paper not in OpenAlex)
        if (!error.message.includes('404')) {
          console.warn(`    [OPENALEX] PMID ${pmid}: ${error.message}`);
        }
      }
      return null;
    });

    const batchResults = await Promise.all(promises);

    for (const result of batchResults) {
      if (result) {
        results.set(result.pmid, result);
      }
    }
  }

  return results;
}

// EPMC fallback - fetch abstract only when needed
async function epmcFetchAbstract(pmid: string): Promise<string | null> {
  const url = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=EXT_ID:${pmid}&format=json&resultType=core`;

  try {
    const data = await cachedFetch(url);
    const paper = data.resultList?.result?.[0];
    return paper?.abstractText || null;
  } catch (error) {
    return null;
  }
}

// Quality scoring with diversity constraints
interface ScoredPaper {
  pmid: string;
  title: string;
  year: number;
  citations: number;
  pubTypes: string[];
  subtopic: string;
  score: number;
  doi?: string;
  isOpenAccess: boolean;
}

function calculateQualityScore(
  pubmedPaper: PubMedPaper,
  openAlexPaper: OpenAlexPaper | undefined,
  subtopic: string,
  subtopicCoverage: Map<string, number>
): ScoredPaper {
  const citations = openAlexPaper?.citedByCount || 0;
  const year = parseInt(pubmedPaper.pubDate?.slice(0, 4) || '2020');

  // Publication type weights
  let pubTypeWeight = 0.5; // default Review
  if (pubmedPaper.pubTypes?.some(t => t.includes('Guideline') || t.includes('Practice Guideline'))) {
    pubTypeWeight = 1.0;
  } else if (pubmedPaper.pubTypes?.some(t => t.includes('Meta-Analysis'))) {
    pubTypeWeight = 1.0;
  } else if (pubmedPaper.pubTypes?.some(t => t.includes('Systematic Review'))) {
    pubTypeWeight = 0.9;
  } else if (pubmedPaper.pubTypes?.some(t => t.includes('Randomized Controlled Trial'))) {
    pubTypeWeight = 0.8;
  }

  // Recency weight
  const recencyWeight = year >= 2019 ? 1.0 : 0.6;

  // Coverage bonus (boost underrepresented subtopics)
  const currentCount = subtopicCoverage.get(subtopic) || 0;
  const coverageBonus = currentCount < 2 ? 0.2 : currentCount < 4 ? 0.1 : 0;

  // Open access bonus
  const oaBonus = openAlexPaper?.isOpenAccess ? 0.05 : 0;

  const score =
    0.45 * Math.log10(1 + citations) +
    0.25 * pubTypeWeight +
    0.15 * recencyWeight +
    0.10 * coverageBonus +
    0.05 * oaBonus;

  return {
    pmid: pubmedPaper.pmid,
    title: pubmedPaper.title,
    year,
    citations,
    pubTypes: pubmedPaper.pubTypes || [],
    subtopic,
    score,
    doi: pubmedPaper.doi || openAlexPaper?.doi,
    isOpenAccess: openAlexPaper?.isOpenAccess || false,
  };
}

// Enforce diversity constraints
function selectDiversePapers(
  scoredPapers: ScoredPaper[],
  targetCount: number
): ScoredPaper[] {
  // Sort by score descending
  scoredPapers.sort((a, b) => b.score - a.score);

  const selected: ScoredPaper[] = [];
  const subtopicCounts = new Map<string, number>();
  const typeCounts = { guideline: 0, meta: 0, systematic: 0, rct: 0 };

  // First pass: ensure minimums (1 guideline, 6 meta/systematic, 2 RCTs)
  const guidelines = scoredPapers.filter(p =>
    p.pubTypes.some(t => t.includes('Guideline'))
  );
  const metaSystematic = scoredPapers.filter(p =>
    p.pubTypes.some(t => t.includes('Meta-Analysis') || t.includes('Systematic Review'))
  );
  const rcts = scoredPapers.filter(p =>
    p.pubTypes.some(t => t.includes('Randomized Controlled Trial'))
  );

  // Add best guideline
  if (guidelines.length > 0) {
    selected.push(guidelines[0]);
    typeCounts.guideline++;
    subtopicCounts.set(guidelines[0].subtopic, (subtopicCounts.get(guidelines[0].subtopic) || 0) + 1);
  }

  // Add best 6 meta/systematic
  for (const paper of metaSystematic.slice(0, 6)) {
    if (!selected.find(p => p.pmid === paper.pmid)) {
      selected.push(paper);
      if (paper.pubTypes.some(t => t.includes('Meta-Analysis'))) typeCounts.meta++;
      else typeCounts.systematic++;
      subtopicCounts.set(paper.subtopic, (subtopicCounts.get(paper.subtopic) || 0) + 1);
    }
  }

  // Add best 2 RCTs
  for (const paper of rcts.slice(0, 2)) {
    if (!selected.find(p => p.pmid === paper.pmid)) {
      selected.push(paper);
      typeCounts.rct++;
      subtopicCounts.set(paper.subtopic, (subtopicCounts.get(paper.subtopic) || 0) + 1);
    }
  }

  // Fill remaining slots with highest scoring papers
  for (const paper of scoredPapers) {
    if (selected.length >= targetCount) break;
    if (!selected.find(p => p.pmid === paper.pmid)) {
      selected.push(paper);
      subtopicCounts.set(paper.subtopic, (subtopicCounts.get(paper.subtopic) || 0) + 1);
    }
  }

  console.log(`\n   📊 Diversity: ${typeCounts.guideline} guidelines, ${typeCounts.meta} meta-analyses, ${typeCounts.systematic} systematic reviews, ${typeCounts.rct} RCTs`);
  console.log(`   📊 Subtopics: ${Array.from(subtopicCounts.entries()).map(([k, v]) => `${k}=${v}`).join(', ')}`);

  return selected.slice(0, targetCount);
}

// Build structured embedding card
function buildEmbeddingCard(
  paper: ScoredPaper,
  abstract: string | null,
  category: string
): string {
  const yearStr = paper.year ? ` (${paper.year})` : '';
  const citationsStr = paper.citations > 0 ? ` [${paper.citations} citations]` : '';

  let card = `# ${category} → ${paper.subtopic}\n\n`;
  card += `**${paper.title}**${yearStr}${citationsStr}\n\n`;
  card += `Study type: ${paper.pubTypes.join(', ')}\n\n`;

  if (abstract) {
    // Extract key findings (first 500 chars of abstract as proxy)
    const excerpt = abstract.slice(0, 500).trim();
    card += `Key findings: ${excerpt}${abstract.length > 500 ? '...' : ''}\n\n`;
  }

  // Add safety flags for specific subtopics
  if (paper.subtopic.includes('harm') || paper.subtopic.includes('OCD')) {
    card += `⚠️ Safety: Avoid reassurance-seeking; tolerate uncertainty; do not check compulsively.\n`;
  }
  if (paper.subtopic.includes('mania') || paper.subtopic.includes('bipolar')) {
    card += `⚠️ Safety: Monitor for manic switching; caution with antidepressants alone.\n`;
  }
  if (paper.subtopic.includes('PTSD') || paper.subtopic.includes('trauma')) {
    card += `⚠️ Safety: Ensure stabilization before trauma processing; monitor dissociation.\n`;
  }

  card += `\nSource: PMID ${paper.pmid}`;
  if (paper.doi) card += ` | DOI ${paper.doi}`;

  return card;
}

// Main execution
async function main() {
  console.log('🧠 Multi-Source Batch Paper Fetching\n');
  console.log('Architecture:');
  console.log('  1. PubMed ESearch → PMIDs (recall)');
  console.log('  2. PubMed ESummary → metadata (batched)');
  console.log('  3. OpenAlex → citations (batched)');
  console.log('  4. EPMC → abstracts (fallback)');
  console.log('  5. Quality scoring + diversity constraints\n');
  console.log('======================================================================\n');

  // Initialize Supabase & OpenAI
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY!,
    modelName: 'text-embedding-3-small',
  });

  let totalImported = 0;
  let totalErrors = 0;

  // Process each category
  for (const categoryConfig of DSM5_CATEGORIES) {
    console.log(`\n📚 Category: ${categoryConfig.name}`);
    console.log(`   Target: ${categoryConfig.targetCount} papers\n`);

    const allPMIDs = new Set<string>();
    const pmidToSubtopic = new Map<string, string>();

    // Step 1: Recall - gather PMIDs from all sub-queries and date ranges
    for (const subQuery of categoryConfig.subQueries) {
      for (const dateRange of categoryConfig.dateRanges) {
        console.log(`    [SEARCH] ${subQuery.name} (${dateRange.name})`);

        try {
          const pmids = await pubmedSearch(
            subQuery.term,
            dateRange.minDate,
            dateRange.maxDate,
            100
          );

          console.log(`    Found ${pmids.length} PMIDs`);

          for (const pmid of pmids) {
            allPMIDs.add(pmid);
            pmidToSubtopic.set(pmid, subQuery.subtopic);
          }
        } catch (error: any) {
          console.error(`    ❌ Search failed: ${error.message}`);
          totalErrors++;
        }
      }
    }

    console.log(`\n   📥 Total unique PMIDs: ${allPMIDs.size}`);

    if (allPMIDs.size === 0) {
      console.log(`   ⚠️  No papers found, skipping category\n`);
      continue;
    }

    // Step 2: Batch metadata from PubMed
    console.log(`\n   [STEP 2] Fetching metadata from PubMed ESummary...`);
    const pmidArray = Array.from(allPMIDs);
    const pubmedMetadata = await pubmedBatchMetadata(pmidArray);
    console.log(`   ✅ Retrieved metadata for ${pubmedMetadata.size} papers`);

    // Step 3: Batch citations from OpenAlex
    console.log(`\n   [STEP 3] Fetching citations from OpenAlex...`);
    const openAlexData = await openAlexBatchCitations(pmidArray);
    console.log(`   ✅ Retrieved citations for ${openAlexData.size} papers`);

    // Step 4: Score and rank
    console.log(`\n   [STEP 4] Scoring papers...`);
    const scoredPapers: ScoredPaper[] = [];
    const subtopicCoverage = new Map<string, number>();

    for (const pmid of pmidArray) {
      const pubmedPaper = pubmedMetadata.get(pmid);
      if (!pubmedPaper) continue;

      const openAlexPaper = openAlexData.get(pmid);
      const subtopic = pmidToSubtopic.get(pmid) || 'general';

      // Filter by minimum citations
      if (openAlexPaper && openAlexPaper.citedByCount < categoryConfig.minCitations) {
        continue;
      }

      const scored = calculateQualityScore(
        pubmedPaper,
        openAlexPaper,
        subtopic,
        subtopicCoverage
      );

      scoredPapers.push(scored);
      subtopicCoverage.set(subtopic, (subtopicCoverage.get(subtopic) || 0) + 1);
    }

    console.log(`   ✅ Scored ${scoredPapers.length} qualifying papers`);

    // Step 5: Apply diversity constraints
    console.log(`\n   [STEP 5] Selecting diverse top ${categoryConfig.targetCount}...`);
    const selectedPapers = selectDiversePapers(scoredPapers, categoryConfig.targetCount);

    // Step 6: Fetch abstracts and build embeddings
    console.log(`\n   [STEP 6] Building embeddings...`);
    for (const paper of selectedPapers) {
      try {
        // Fetch abstract from EPMC
        const abstract = await epmcFetchAbstract(paper.pmid);

        // Build structured card
        const embeddingCard = buildEmbeddingCard(paper, abstract, categoryConfig.category);

        // Generate embedding
        const embedding = await embeddings.embedQuery(embeddingCard);

        // Insert into database
        const { error } = await supabase.from('research_papers').insert({
          pmid: paper.pmid,
          doi: paper.doi,
          title: paper.title,
          abstract: abstract || '',
          authors: '', // Could enhance with author extraction
          journal: '',
          year: paper.year,
          citation_count: paper.citations,
          article_type: paper.pubTypes.join(', '),
          embedding,
          category: categoryConfig.category,
          subtopic: paper.subtopic,
          quality_score: paper.score,
          is_open_access: paper.isOpenAccess,
          embedding_card: embeddingCard,
        });

        if (error) {
          if (error.code === '23505') {
            console.log(`    ⏭️  PMID ${paper.pmid} already exists`);
          } else {
            console.error(`    ❌ Insert failed for PMID ${paper.pmid}: ${error.message}`);
            totalErrors++;
          }
        } else {
          console.log(`    ✅ Imported PMID ${paper.pmid} (${paper.citations} cites, score ${paper.score.toFixed(2)})`);
          totalImported++;
        }
      } catch (error: any) {
        console.error(`    ❌ Error processing PMID ${paper.pmid}: ${error.message}`);
        totalErrors++;
      }
    }

    console.log(`\n   Category complete: ${selectedPapers.length} papers imported`);
  }

  console.log('\n======================================================================');
  console.log('📊 FINAL SUMMARY');
  console.log('======================================================================');
  console.log(`✅ Successfully imported: ${totalImported} papers`);
  console.log(`❌ Errors: ${totalErrors}`);
  console.log('======================================================================\n');
}

main().catch(console.error);

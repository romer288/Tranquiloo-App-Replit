import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

interface PaperMetadata {
  pmid: string;
  title: string;
  authors: string;
  year: number;
  journal: string;
  abstract: string;
  citationCount: number;
  publicationType: string[];
  doi?: string;
  category: string;
}

/**
 * DSM-5 Categories with Targeted Search Strategies
 * Based on clinical framework provided by user
 */
const DSM5_CATEGORIES = [
  {
    category: 'neurodevelopmental_disorders',
    targetCount: 30,
    searchQueries: [
      '("Attention Deficit Disorder with Hyperactivity"[MeSH] OR "ADHD"[Title/Abstract]) AND ("treatment"[Title/Abstract] OR "therapy"[Title/Abstract] OR "intervention"[Title/Abstract])',
      '("Autism Spectrum Disorder"[MeSH] OR "Autistic Disorder"[MeSH]) AND ("behavioral intervention"[Title/Abstract] OR "social skills"[Title/Abstract] OR "treatment"[Title/Abstract])',
      '("Learning Disabilities"[MeSH] OR "Dyslexia"[MeSH]) AND ("intervention"[Title/Abstract] OR "treatment"[Title/Abstract])',
      '("Communication Disorders"[MeSH]) AND ("speech therapy"[Title/Abstract] OR "language intervention"[Title/Abstract])',
      '("Developmental Coordination Disorder"[Title/Abstract] OR "Motor Skills Disorders"[MeSH]) AND ("occupational therapy"[Title/Abstract] OR "intervention"[Title/Abstract])'
    ],
    minCitations: 50,
    publicationTypes: ['Meta-Analysis', 'Systematic Review', 'Review']
  },
  {
    category: 'schizophrenia_psychotic_disorders',
    targetCount: 30,
    searchQueries: [
      '("Schizophrenia"[MeSH] OR "Psychotic Disorders"[MeSH]) AND ("antipsychotic"[Title/Abstract] OR "treatment"[Title/Abstract] OR "therapy"[Title/Abstract])',
      '("Schizoaffective Disorder"[MeSH]) AND ("management"[Title/Abstract] OR "treatment"[Title/Abstract])',
      '("early intervention in psychosis"[Title/Abstract] OR "first episode psychosis"[Title/Abstract]) AND ("treatment"[Title/Abstract])',
      '("cognitive remediation"[Title/Abstract] OR "cognitive training"[Title/Abstract]) AND ("schizophrenia"[Title/Abstract])',
      '("family psychoeducation"[Title/Abstract]) AND ("schizophrenia"[Title/Abstract] OR "psychosis"[Title/Abstract])'
    ],
    minCitations: 100,
    publicationTypes: ['Meta-Analysis', 'Systematic Review']
  },
  {
    category: 'bipolar_disorders',
    targetCount: 30,
    searchQueries: [
      '("Bipolar Disorder"[MeSH] OR "Bipolar I"[Title/Abstract] OR "Bipolar II"[Title/Abstract]) AND ("mood stabilizer"[Title/Abstract] OR "lithium"[Title/Abstract] OR "treatment"[Title/Abstract])',
      '("Bipolar Disorder"[MeSH]) AND ("psychotherapy"[Title/Abstract] OR "cognitive behavioral therapy"[Title/Abstract] OR "interpersonal"[Title/Abstract])',
      '("rapid cycling"[Title/Abstract]) AND ("bipolar"[Title/Abstract]) AND ("treatment"[Title/Abstract])',
      '("peripartum"[Title/Abstract] OR "postpartum"[Title/Abstract]) AND ("bipolar"[Title/Abstract]) AND ("treatment"[Title/Abstract])',
      '("mixed features"[Title/Abstract]) AND ("bipolar"[Title/Abstract]) AND ("management"[Title/Abstract])'
    ],
    minCitations: 100,
    publicationTypes: ['Meta-Analysis', 'Systematic Review']
  },
  {
    category: 'depressive_disorders',
    targetCount: 30,
    searchQueries: [
      '("Depressive Disorder, Major"[MeSH] OR "Major Depressive Disorder"[Title/Abstract] OR "MDD"[Title/Abstract]) AND ("treatment"[Title/Abstract] OR "cognitive behavioral therapy"[Title/Abstract] OR "antidepressant"[Title/Abstract])',
      '("Dysthymic Disorder"[MeSH] OR "Persistent Depressive Disorder"[Title/Abstract]) AND ("treatment"[Title/Abstract])',
      '("treatment resistant depression"[Title/Abstract] OR "refractory depression"[Title/Abstract]) AND ("intervention"[Title/Abstract])',
      '("Premenstrual Dysphoric Disorder"[MeSH] OR "PMDD"[Title/Abstract]) AND ("treatment"[Title/Abstract])',
      '("behavioral activation"[Title/Abstract]) AND ("depression"[Title/Abstract]) AND ("treatment"[Title/Abstract])',
      '("seasonal affective disorder"[Title/Abstract] OR "seasonal depression"[Title/Abstract]) AND ("light therapy"[Title/Abstract] OR "treatment"[Title/Abstract])'
    ],
    minCitations: 100,
    publicationTypes: ['Meta-Analysis', 'Systematic Review']
  },
  {
    category: 'anxiety_disorders',
    targetCount: 30,
    searchQueries: [
      '("Anxiety Disorders"[MeSH] OR "Generalized Anxiety Disorder"[MeSH] OR "GAD"[Title/Abstract]) AND ("cognitive behavioral therapy"[Title/Abstract] OR "treatment"[Title/Abstract])',
      '("Panic Disorder"[MeSH] OR "panic attack"[Title/Abstract]) AND ("treatment"[Title/Abstract] OR "exposure therapy"[Title/Abstract])',
      '("Phobia, Social"[MeSH] OR "Social Anxiety Disorder"[Title/Abstract]) AND ("cognitive behavioral therapy"[Title/Abstract] OR "exposure"[Title/Abstract])',
      '("Agoraphobia"[MeSH]) AND ("treatment"[Title/Abstract] OR "therapy"[Title/Abstract])',
      '("Phobic Disorders"[MeSH] OR "specific phobia"[Title/Abstract]) AND ("exposure therapy"[Title/Abstract] OR "treatment"[Title/Abstract])',
      '("Separation Anxiety Disorder"[MeSH]) AND ("treatment"[Title/Abstract] OR "intervention"[Title/Abstract])'
    ],
    minCitations: 80,
    publicationTypes: ['Meta-Analysis', 'Systematic Review', 'Review']
  },
  {
    category: 'ocd_related_disorders',
    targetCount: 30,
    searchQueries: [
      '("Obsessive-Compulsive Disorder"[MeSH] OR "OCD"[Title/Abstract]) AND ("exposure response prevention"[Title/Abstract] OR "ERP"[Title/Abstract] OR "treatment"[Title/Abstract])',
      '("Body Dysmorphic Disorder"[MeSH] OR "BDD"[Title/Abstract]) AND ("treatment"[Title/Abstract] OR "cognitive behavioral therapy"[Title/Abstract])',
      '("Hoarding Disorder"[Title/Abstract]) AND ("treatment"[Title/Abstract] OR "intervention"[Title/Abstract])',
      '("Trichotillomania"[MeSH] OR "hair pulling"[Title/Abstract]) AND ("treatment"[Title/Abstract] OR "habit reversal"[Title/Abstract])',
      '("Excoriation Disorder"[Title/Abstract] OR "skin picking"[Title/Abstract]) AND ("treatment"[Title/Abstract])'
    ],
    minCitations: 80,
    publicationTypes: ['Meta-Analysis', 'Systematic Review']
  },
  {
    category: 'trauma_stressor_disorders',
    targetCount: 30,
    searchQueries: [
      '("Stress Disorders, Post-Traumatic"[MeSH] OR "PTSD"[Title/Abstract]) AND ("prolonged exposure"[Title/Abstract] OR "cognitive processing therapy"[Title/Abstract] OR "EMDR"[Title/Abstract] OR "treatment"[Title/Abstract])',
      '("Acute Stress Disorder"[MeSH]) AND ("treatment"[Title/Abstract] OR "early intervention"[Title/Abstract])',
      '("Adjustment Disorders"[MeSH]) AND ("treatment"[Title/Abstract] OR "therapy"[Title/Abstract])',
      '("Complex PTSD"[Title/Abstract] OR "complex trauma"[Title/Abstract]) AND ("treatment"[Title/Abstract])',
      '("trauma focused cognitive behavioral therapy"[Title/Abstract] OR "TF-CBT"[Title/Abstract]) AND ("children"[Title/Abstract] OR "adolescents"[Title/Abstract])'
    ],
    minCitations: 100,
    publicationTypes: ['Meta-Analysis', 'Systematic Review']
  }
];

/**
 * Search PubMed with specific query
 */
async function searchPubMed(query: string, maxResults: number = 10): Promise<string[]> {
  try {
    const searchUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi';

    const params = {
      db: 'pubmed',
      term: query,
      retmax: maxResults,
      retmode: 'json',
      sort: 'relevance',
      mindate: '2013/01/01', // DSM-5 published May 2013
      maxdate: '2025/12/31'
    };

    console.log(`    Searching PubMed: "${query.substring(0, 80)}..."`);

    const response = await axios.get(searchUrl, { params, timeout: 30000 });

    const pmids = response.data.esearchresult?.idlist || [];
    console.log(`    Found ${pmids.length} papers`);

    return pmids;

  } catch (error: any) {
    console.error(`    Error searching PubMed: ${error.message}`);
    return [];
  }
}

/**
 * Fetch paper metadata from Europe PMC (better structured data than PubMed XML)
 */
async function fetchPaperFromEuropePMC(pmid: string): Promise<PaperMetadata | null> {
  try {
    const url = `https://www.ebi.ac.uk/europepmc/webservices/rest/search`;
    const params = {
      query: `PMID:${pmid}`,
      format: 'json',
    };

    const response = await axios.get(url, { params, timeout: 10000 });
    const result = response.data.resultList?.result?.[0];

    if (!result) {
      return null;
    }

    return {
      pmid,
      title: result.title || '',
      authors: result.authorString || '',
      year: parseInt(result.pubYear) || 2020,
      journal: result.journalTitle || '',
      abstract: result.abstractText || '',
      citationCount: parseInt(result.citedByCount) || 0,
      publicationType: result.pubType ? result.pubType.split(';') : [],
      doi: result.doi || undefined,
      category: ''
    };

  } catch (error: any) {
    console.error(`    Error fetching PMID ${pmid} from Europe PMC: ${error.message}`);
    return null;
  }
}

/**
 * Generate embedding with enhanced metadata
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.substring(0, 8000),
  });
  return response.data[0].embedding;
}

/**
 * Create enriched content for embedding
 */
function createEnrichedContent(paper: PaperMetadata): string {
  return `
DISORDER CATEGORY: ${paper.category.replace(/_/g, ' ').toUpperCase()}
DSM-5 TREATMENT FOCUS: Evidence-based interventions and therapy approaches

STUDY TYPE: ${paper.publicationType.join(', ')}
CITATION COUNT: ${paper.citationCount} citations (high-impact research)
PUBLICATION YEAR: ${paper.year}

TITLE: ${paper.title}

AUTHORS: ${paper.authors}

JOURNAL: ${paper.journal}

ABSTRACT:
${paper.abstract}

CLINICAL RELEVANCE: This ${paper.publicationType[0]?.toLowerCase() || 'research'} with ${paper.citationCount} citations represents high-quality evidence for DSM-5 ${paper.category.replace(/_/g, ' ')} treatment approaches. Published in ${paper.year}, it provides current evidence-based guidance for mental health interventions.

SOURCE: https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/
${paper.doi ? `DOI: https://doi.org/${paper.doi}` : ''}
  `.trim();
}

/**
 * Main function to fetch papers for all DSM-5 categories
 */
async function fetchAllDSM5Papers() {
  console.log('🧠 Starting DSM-5 Treatment Paper Curation\n');
  console.log('Target: 200+ meta-analyses and systematic reviews');
  console.log('Categories: 7 DSM-5 disorder categories');
  console.log('Date range: 2013-2025 (DSM-5 era)\n');
  console.log('='.repeat(70) + '\n');

  let totalPapers = 0;
  let totalSuccess = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const categoryConfig of DSM5_CATEGORIES) {
    console.log(`\n📚 Category: ${categoryConfig.category.toUpperCase()}`);
    console.log(`   Target: ${categoryConfig.targetCount} papers`);
    console.log(`   Min citations: ${categoryConfig.minCitations}`);
    console.log(`   Types: ${categoryConfig.publicationTypes.join(', ')}\n`);

    const categoryPapers: PaperMetadata[] = [];
    const seenPMIDs = new Set<string>();

    // Search each query for this category
    for (const query of categoryConfig.searchQueries) {
      const pmids = await searchPubMed(query, 20);

      for (const pmid of pmids) {
        if (seenPMIDs.has(pmid)) continue;
        seenPMIDs.add(pmid);

        // Check if already in database
        const { data: existing } = await supabase
          .from('research_papers')
          .select('id')
          .eq('source_url', `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`)
          .single();

        if (existing) {
          totalSkipped++;
          continue;
        }

        // Fetch metadata
        const paper = await fetchPaperFromEuropePMC(pmid);

        if (!paper) {
          totalErrors++;
          continue;
        }

        // Filter by citation count
        if (paper.citationCount < categoryConfig.minCitations) {
          continue;
        }

        // Filter by publication type
        const hasCorrectType = categoryConfig.publicationTypes.some(type =>
          paper.publicationType.some(pt => pt.toLowerCase().includes(type.toLowerCase()))
        );

        if (!hasCorrectType) {
          continue;
        }

        paper.category = categoryConfig.category;
        categoryPapers.push(paper);

        if (categoryPapers.length >= categoryConfig.targetCount) {
          break;
        }
      }

      if (categoryPapers.length >= categoryConfig.targetCount) {
        break;
      }

      // Rate limiting - wait 500ms between queries
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Sort by citation count and take top papers
    categoryPapers.sort((a, b) => b.citationCount - a.citationCount);
    const topPapers = categoryPapers.slice(0, categoryConfig.targetCount);

    console.log(`\n   Found ${topPapers.length} qualifying papers`);
    console.log(`   Importing to database...\n`);

    // Import papers to database
    for (let i = 0; i < topPapers.length; i++) {
      const paper = topPapers[i];

      console.log(`   [${i + 1}/${topPapers.length}] ${paper.title.substring(0, 60)}...`);
      console.log(`       Citations: ${paper.citationCount} | Year: ${paper.year} | Type: ${paper.publicationType[0]}`);

      try {
        // Create enriched content
        const enrichedContent = createEnrichedContent(paper);

        // Generate embedding
        const embedding = await generateEmbedding(enrichedContent);

        // Store in database
        const { error } = await supabase.from('research_papers').insert({
          title: paper.title,
          authors: paper.authors,
          year: paper.year,
          topic: paper.category,
          content: enrichedContent,
          summary: `${paper.publicationType[0]} - ${paper.journal} (${paper.year}). ${paper.citationCount} citations. ${paper.abstract.substring(0, 200)}...`,
          source_url: `https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/`,
          embedding: embedding,
        });

        if (error) {
          console.log(`       ❌ Database error: ${error.message}`);
          totalErrors++;
        } else {
          console.log(`       ✅ Imported successfully`);
          totalSuccess++;
          totalPapers++;
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));

      } catch (error: any) {
        console.log(`       ❌ Error: ${error.message}`);
        totalErrors++;
      }
    }

    console.log(`\n   Category complete: ${topPapers.length} papers imported`);
  }

  console.log('\n' + '='.repeat(70));
  console.log('📊 FINAL SUMMARY');
  console.log('='.repeat(70));
  console.log(`✅ Successfully imported: ${totalSuccess} papers`);
  console.log(`⏭️  Skipped (already exist): ${totalSkipped} papers`);
  console.log(`❌ Errors: ${totalErrors}`);
  console.log(`📚 Total in database: ${totalPapers} new papers`);
  console.log('='.repeat(70));

  if (totalSuccess > 0) {
    console.log(`\n🎉 Your AI now has ${totalSuccess} DSM-5 treatment papers!`);
    console.log(`💰 Embedding cost: ~$${(totalSuccess * 0.00002).toFixed(4)}`);
  }
}

// Run the fetcher
fetchAllDSM5Papers().catch(console.error);

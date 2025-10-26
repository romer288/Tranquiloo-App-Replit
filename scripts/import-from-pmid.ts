import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import axios from 'axios';
import * as fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

interface PaperRecord {
  category: string;
  pmid: string;
  title: string;
  authors: string;
  year: number;
  journal: string;
  citations: number;
  article_type: string;
  notes: string;
}

interface PubMedPaper {
  pmid: string;
  title: string;
  abstract: string;
  authors: string;
  journal: string;
  year: number;
  doi?: string;
  meshTerms: string[];
}

/**
 * Parse CSV file with paper catalog
 */
function parseCSV(filePath: string): PaperRecord[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line =>
    line.trim() && !line.startsWith('#') && !line.startsWith('//')
  );

  const records: PaperRecord[] = [];

  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(',');
    if (parts.length < 9) continue;

    records.push({
      category: parts[0].trim(),
      pmid: parts[1].trim(),
      title: parts[2].trim().replace(/^"|"$/g, ''),
      authors: parts[3].trim().replace(/^"|"$/g, ''),
      year: parseInt(parts[4].trim()),
      journal: parts[5].trim().replace(/^"|"$/g, ''),
      citations: parseInt(parts[6].trim()),
      article_type: parts[7].trim(),
      notes: parts[8].trim(),
    });
  }

  return records;
}

/**
 * Fetch paper details from PubMed using E-utilities API
 */
async function fetchPubMedAbstract(pmid: string): Promise<PubMedPaper | null> {
  try {
    const fetchUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi';

    const params = {
      db: 'pubmed',
      id: pmid,
      retmode: 'xml',
    };

    console.log(`  Fetching from PubMed API...`);
    const response = await axios.get(fetchUrl, { params });
    const xmlData = response.data;

    // Simple XML parsing (extract key fields)
    const abstract = extractXMLField(xmlData, 'AbstractText');
    const meshTerms = extractXMLArray(xmlData, 'DescriptorName');
    const doi = extractXMLField(xmlData, 'ELocationID');

    if (!abstract) {
      console.log(`  ⚠️  No abstract found for PMID ${pmid}`);
      return null;
    }

    return {
      pmid,
      title: '',
      abstract,
      authors: '',
      journal: '',
      year: 0,
      doi: doi || undefined,
      meshTerms,
    };

  } catch (error: any) {
    console.error(`  ❌ Error fetching PMID ${pmid}:`, error.message);
    return null;
  }
}

/**
 * Simple XML field extractor
 */
function extractXMLField(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

/**
 * Extract multiple XML fields as array
 */
function extractXMLArray(xml: string, tag: string): string[] {
  const regex = new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, 'gi');
  const matches = xml.match(regex) || [];
  return matches.map(m => m.replace(new RegExp(`</?${tag}[^>]*>`, 'gi'), '').trim());
}

/**
 * Generate OpenAI embedding
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.substring(0, 8000), // Limit to avoid token limits
  });
  return response.data[0].embedding;
}

/**
 * Create enriched content for embedding
 */
function createEnrichedContent(record: PaperRecord, pubmedData: PubMedPaper): string {
  return `
DISORDER CATEGORY: ${record.category.replace('_', ' ')}
STUDY TYPE: ${record.article_type}
CITATION COUNT: ${record.citations} citations
PUBLICATION YEAR: ${record.year}

TITLE: ${record.title}

AUTHORS: ${record.authors} (${record.year})

JOURNAL: ${record.journal}

MESH TERMS: ${pubmedData.meshTerms.join(', ')}

KEY NOTES: ${record.notes}

ABSTRACT:
${pubmedData.abstract}

CLINICAL RELEVANCE: This ${record.article_type.toLowerCase()} with ${record.citations} citations represents high-quality evidence for ${record.category.replace('_', ' ')} treatment approaches.

SOURCE: https://pubmed.ncbi.nlm.nih.gov/${record.pmid}/
DOI: ${pubmedData.doi || 'Not available'}
  `.trim();
}

/**
 * Import papers from CSV into database
 */
async function importPapers() {
  console.log('📚 Starting Paper Import from PMID Catalog\n');

  // Parse CSV
  console.log('📄 Reading research-papers-catalog.csv...');
  const records = parseCSV('research-papers-catalog.csv');
  console.log(`✅ Found ${records.length} papers in catalog\n`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    console.log(`\n[${i + 1}/${records.length}] Processing PMID ${record.pmid}`);
    console.log(`  Category: ${record.category}`);
    console.log(`  Title: ${record.title.substring(0, 60)}...`);

    // Check if already exists
    const { data: existing } = await supabase
      .from('research_papers')
      .select('id')
      .eq('source_url', `https://pubmed.ncbi.nlm.nih.gov/${record.pmid}/`)
      .single();

    if (existing) {
      console.log(`  ⏭️  Already in database, skipping`);
      skipCount++;
      continue;
    }

    // Fetch abstract from PubMed
    const pubmedData = await fetchPubMedAbstract(record.pmid);

    if (!pubmedData) {
      console.log(`  ❌ Skipping - no abstract available`);
      errorCount++;
      continue;
    }

    // Create enriched content
    const enrichedContent = createEnrichedContent(record, pubmedData);

    // Generate embedding
    console.log(`  🔢 Generating embedding...`);
    const embedding = await generateEmbedding(enrichedContent);

    // Store in database
    console.log(`  💾 Storing in database...`);
    const { error } = await supabase.from('research_papers').insert({
      title: record.title,
      authors: record.authors,
      year: record.year,
      topic: record.category,
      content: enrichedContent,
      summary: `${record.article_type} - ${record.journal} (${record.year}). ${record.citations} citations. ${record.notes}`,
      source_url: `https://pubmed.ncbi.nlm.nih.gov/${record.pmid}/`,
      embedding: embedding,
    });

    if (error) {
      console.error(`  ❌ Database error:`, error.message);
      errorCount++;
    } else {
      console.log(`  ✅ Successfully imported!`);
      successCount++;
    }

    // Rate limiting: Wait 500ms between requests to be nice to PubMed
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n\n' + '='.repeat(60));
  console.log('📊 Import Summary');
  console.log('='.repeat(60));
  console.log(`✅ Successfully imported: ${successCount}`);
  console.log(`⏭️  Skipped (already exist): ${skipCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📝 Total in catalog: ${records.length}`);
  console.log('='.repeat(60));

  if (successCount > 0) {
    console.log(`\n🎉 Your AI now has access to ${successCount + skipCount} research papers!`);
    console.log(`💰 Cost: ~$${(successCount * 0.00002).toFixed(4)} in embeddings`);
  }
}

// Run the import
importPapers().catch(console.error);

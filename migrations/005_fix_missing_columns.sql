-- Fix missing columns in research_papers table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- Add all missing columns
ALTER TABLE research_papers
ADD COLUMN IF NOT EXISTS abstract TEXT,
ADD COLUMN IF NOT EXISTS pmid TEXT,
ADD COLUMN IF NOT EXISTS doi TEXT,
ADD COLUMN IF NOT EXISTS journal TEXT,
ADD COLUMN IF NOT EXISTS citation_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS article_type TEXT,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS subtopic TEXT,
ADD COLUMN IF NOT EXISTS quality_score FLOAT,
ADD COLUMN IF NOT EXISTS is_open_access BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS embedding_card TEXT,
ADD COLUMN IF NOT EXISTS pub_types TEXT[],
ADD COLUMN IF NOT EXISTS source_json JSONB;

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_papers_pmid ON research_papers(pmid);
CREATE INDEX IF NOT EXISTS idx_papers_category ON research_papers(category);
CREATE INDEX IF NOT EXISTS idx_papers_subtopic ON research_papers(subtopic);
CREATE INDEX IF NOT EXISTS idx_papers_quality ON research_papers(quality_score DESC);

-- Create unique constraint on PMID (prevent duplicates)
CREATE UNIQUE INDEX IF NOT EXISTS idx_papers_pmid_unique ON research_papers(pmid) WHERE pmid IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN research_papers.pmid IS 'PubMed ID - unique identifier for research papers';
COMMENT ON COLUMN research_papers.doi IS 'Digital Object Identifier';
COMMENT ON COLUMN research_papers.abstract IS 'Paper abstract text';
COMMENT ON COLUMN research_papers.citation_count IS 'Number of citations from OpenAlex';
COMMENT ON COLUMN research_papers.category IS 'DSM-5 category (e.g., ANXIETY_DISORDERS, OCD_RELATED_DISORDERS)';
COMMENT ON COLUMN research_papers.subtopic IS 'Specific subtopic (e.g., ERP, harm-obsessions, CBT-exposure)';
COMMENT ON COLUMN research_papers.quality_score IS 'Composite score: 0.45*log(cites) + 0.25*type + 0.15*recency + 0.10*coverage + 0.05*OA';
COMMENT ON COLUMN research_papers.embedding_card IS 'Structured text used for embedding (500-900 tokens with subtopic tags)';

-- Verify the changes
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'research_papers'
ORDER BY ordinal_position;

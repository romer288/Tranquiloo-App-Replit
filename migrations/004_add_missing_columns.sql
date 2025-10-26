-- Add missing columns that were referenced in code but not in schema

ALTER TABLE research_papers
ADD COLUMN IF NOT EXISTS abstract TEXT,
ADD COLUMN IF NOT EXISTS pmid TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS doi TEXT,
ADD COLUMN IF NOT EXISTS journal TEXT,
ADD COLUMN IF NOT EXISTS citation_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS article_type TEXT;

-- Create index on PMID for faster lookups
CREATE INDEX IF NOT EXISTS idx_papers_pmid ON research_papers(pmid);

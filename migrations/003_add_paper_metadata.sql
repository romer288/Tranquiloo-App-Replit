-- Add new fields for quality scoring and diversity tracking

ALTER TABLE research_papers
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS subtopic TEXT,
ADD COLUMN IF NOT EXISTS quality_score FLOAT,
ADD COLUMN IF NOT EXISTS is_open_access BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS embedding_card TEXT,
ADD COLUMN IF NOT EXISTS pub_types TEXT[],
ADD COLUMN IF NOT EXISTS source_json JSONB;

-- Create index on category and subtopic for filtered retrieval
CREATE INDEX IF NOT EXISTS idx_papers_category ON research_papers(category);
CREATE INDEX IF NOT EXISTS idx_papers_subtopic ON research_papers(subtopic);
CREATE INDEX IF NOT EXISTS idx_papers_quality ON research_papers(quality_score DESC);

-- Add fetch log table for debugging and caching
CREATE TABLE IF NOT EXISTS fetch_log (
  id SERIAL PRIMARY KEY,
  endpoint TEXT NOT NULL,
  params_hash TEXT,
  status INT,
  retries INT DEFAULT 0,
  duration_ms INT,
  cached BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fetch_log_endpoint ON fetch_log(endpoint, params_hash);
CREATE INDEX IF NOT EXISTS idx_fetch_log_created ON fetch_log(created_at);

COMMENT ON TABLE fetch_log IS 'Logs all API calls for debugging rate limits and cache hits';
COMMENT ON COLUMN research_papers.category IS 'DSM-5 category (e.g., ANXIETY_DISORDERS, OCD_RELATED_DISORDERS)';
COMMENT ON COLUMN research_papers.subtopic IS 'Specific subtopic (e.g., ERP, harm-obsessions, CBT-exposure)';
COMMENT ON COLUMN research_papers.quality_score IS 'Composite score: 0.45*log(cites) + 0.25*type + 0.15*recency + 0.10*coverage + 0.05*OA';
COMMENT ON COLUMN research_papers.embedding_card IS 'Structured text used for embedding (500-900 tokens with subtopic tags)';

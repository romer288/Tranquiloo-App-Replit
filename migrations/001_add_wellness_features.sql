-- Migration: Add wellness features for non-HIPAA app
-- Keeps all existing tables (therapist portal, appointments, etc.)

-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Research papers table with vector embeddings
CREATE TABLE IF NOT EXISTS research_papers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  authors TEXT,
  year INTEGER,
  topic TEXT, -- 'anxiety', 'depression', 'cbt', 'mindfulness', etc.
  content TEXT NOT NULL,
  summary TEXT,
  source_url TEXT, -- Link to PubMed or original source
  embedding VECTOR(1536), -- OpenAI text-embedding-3-small
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast vector similarity search
CREATE INDEX IF NOT EXISTS research_papers_embedding_idx
  ON research_papers
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Text search index for keywords
CREATE INDEX IF NOT EXISTS research_papers_topic_idx ON research_papers(topic);
CREATE INDEX IF NOT EXISTS research_papers_title_idx ON research_papers USING GIN(to_tsvector('english', title));

-- Wellness tracking (subjective, non-medical data)
CREATE TABLE IF NOT EXISTS wellness_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 10),
  energy_level TEXT CHECK (energy_level IN ('low', 'medium', 'high')),
  heart_rate_feeling TEXT CHECK (heart_rate_feeling IN ('calm', 'normal', 'elevated', 'racing')),
  sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
  stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 10),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS wellness_tracking_user_id_idx ON wellness_tracking(user_id);
CREATE INDEX IF NOT EXISTS wellness_tracking_created_at_idx ON wellness_tracking(created_at DESC);

-- Conversation summaries for token optimization
CREATE TABLE IF NOT EXISTS conversation_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  message_count INTEGER DEFAULT 0,
  key_topics TEXT[], -- Array of topics discussed
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS conversation_summaries_conversation_id_idx ON conversation_summaries(conversation_id);
CREATE INDEX IF NOT EXISTS conversation_summaries_user_id_idx ON conversation_summaries(user_id);

-- User consent tracking (non-HIPAA disclaimers)
CREATE TABLE IF NOT EXISTS user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL, -- 'terms_of_service', 'not_medical_advice', 'data_usage'
  consent_text TEXT NOT NULL, -- Full text of what they consented to
  consented_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS user_consents_user_id_idx ON user_consents(user_id);

-- Keywords extracted from conversations (for therapist insights)
CREATE TABLE IF NOT EXISTS conversation_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  frequency INTEGER DEFAULT 1,
  context TEXT, -- 'anxiety', 'coping', 'family', etc.
  detected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS conversation_keywords_conversation_id_idx ON conversation_keywords(conversation_id);
CREATE INDEX IF NOT EXISTS conversation_keywords_user_id_idx ON conversation_keywords(user_id);
CREATE INDEX IF NOT EXISTS conversation_keywords_keyword_idx ON conversation_keywords(keyword);

-- Row Level Security Policies
-- Users can only see their own data

ALTER TABLE wellness_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wellness data" ON wellness_tracking
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own wellness data" ON wellness_tracking
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own wellness data" ON wellness_tracking
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own wellness data" ON wellness_tracking
  FOR DELETE USING (auth.uid()::text = user_id);

-- Therapists can view their patients' wellness data (with consent)
CREATE POLICY "Therapists can view connected patients wellness data" ON wellness_tracking
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM therapist_patient_connections tpc
      INNER JOIN profiles p ON p.email = tpc.therapist_email
      WHERE p.id = auth.uid()::text
        AND tpc.patient_id::text = wellness_tracking.user_id
        AND tpc.is_active = true
        AND tpc.patient_consent_given = true
    )
  );

ALTER TABLE conversation_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own summaries" ON conversation_summaries
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own summaries" ON conversation_summaries
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Therapists can view patient summaries (with consent)
CREATE POLICY "Therapists can view patient summaries" ON conversation_summaries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM therapist_patient_connections tpc
      INNER JOIN profiles p ON p.email = tpc.therapist_email
      WHERE p.id = auth.uid()::text
        AND tpc.patient_id::text = conversation_summaries.user_id
        AND tpc.is_active = true
        AND tpc.share_analytics = true
    )
  );

ALTER TABLE conversation_keywords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own keywords" ON conversation_keywords
  FOR SELECT USING (auth.uid()::text = user_id);

-- Therapists can view patient keywords (with consent)
CREATE POLICY "Therapists can view patient keywords" ON conversation_keywords
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM therapist_patient_connections tpc
      INNER JOIN profiles p ON p.email = tpc.therapist_email
      WHERE p.id = auth.uid()::text
        AND tpc.patient_id::text = conversation_keywords.user_id
        AND tpc.is_active = true
        AND tpc.share_analytics = true
    )
  );

-- Research papers are public (read-only)
ALTER TABLE research_papers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view research papers" ON research_papers
  FOR SELECT USING (true);

-- Only admins can insert/update research papers
CREATE POLICY "Admins can manage research papers" ON research_papers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()::text
        AND profiles.role = 'admin'
    )
  );

ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consents" ON user_consents
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own consents" ON user_consents
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Function to search research papers by semantic similarity
CREATE OR REPLACE FUNCTION search_research_papers(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  authors TEXT,
  year INTEGER,
  topic TEXT,
  content TEXT,
  summary TEXT,
  source_url TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    rp.id,
    rp.title,
    rp.authors,
    rp.year,
    rp.topic,
    rp.content,
    rp.summary,
    rp.source_url,
    1 - (rp.embedding <=> query_embedding) AS similarity
  FROM research_papers rp
  WHERE 1 - (rp.embedding <=> query_embedding) > match_threshold
  ORDER BY rp.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to get wellness trends for a user
CREATE OR REPLACE FUNCTION get_wellness_trends(
  p_user_id TEXT,
  days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
  date DATE,
  avg_mood NUMERIC,
  avg_energy NUMERIC,
  avg_stress NUMERIC,
  avg_sleep NUMERIC,
  entry_count INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(wt.created_at) as date,
    AVG(wt.mood_score)::NUMERIC(3,1) as avg_mood,
    AVG(CASE
      WHEN wt.energy_level = 'low' THEN 1
      WHEN wt.energy_level = 'medium' THEN 2
      WHEN wt.energy_level = 'high' THEN 3
      ELSE NULL
    END)::NUMERIC(3,1) as avg_energy,
    AVG(wt.stress_level)::NUMERIC(3,1) as avg_stress,
    AVG(wt.sleep_quality)::NUMERIC(3,1) as avg_sleep,
    COUNT(*)::INTEGER as entry_count
  FROM wellness_tracking wt
  WHERE wt.user_id = p_user_id
    AND wt.created_at >= NOW() - (days_back || ' days')::INTERVAL
  GROUP BY DATE(wt.created_at)
  ORDER BY date DESC;
END;
$$;

COMMENT ON TABLE research_papers IS 'Stores curated research papers with vector embeddings for semantic search';
COMMENT ON TABLE wellness_tracking IS 'User-reported wellness metrics (subjective, non-medical data)';
COMMENT ON TABLE conversation_summaries IS 'Compressed summaries of conversations to reduce token usage';
COMMENT ON TABLE user_consents IS 'Tracks user consent to disclaimers (NOT medical advice, NOT HIPAA)';
COMMENT ON TABLE conversation_keywords IS 'Keywords extracted from conversations for therapist insights';

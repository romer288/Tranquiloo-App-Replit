-- ============================================
-- COMPLETE RLS POLICIES SETUP
-- ============================================
-- This script adds missing policies for tables that have RLS enabled
-- Uses DROP POLICY IF EXISTS to avoid duplication errors

-- ============================================
-- PROFILES TABLE (already has service role policy)
-- ============================================

-- Drop existing policies if they exist to avoid errors
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid()::text = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid()::text = id);

-- ============================================
-- WELLNESS TRACKING
-- ============================================

DROP POLICY IF EXISTS "Users can read own wellness data" ON public.wellness_tracking;
DROP POLICY IF EXISTS "Users can insert own wellness data" ON public.wellness_tracking;
DROP POLICY IF EXISTS "Users can update own wellness data" ON public.wellness_tracking;
DROP POLICY IF EXISTS "Users can delete own wellness data" ON public.wellness_tracking;
DROP POLICY IF EXISTS "Service role full access to wellness" ON public.wellness_tracking;

CREATE POLICY "Users can read own wellness data"
  ON public.wellness_tracking
  FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own wellness data"
  ON public.wellness_tracking
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own wellness data"
  ON public.wellness_tracking
  FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own wellness data"
  ON public.wellness_tracking
  FOR DELETE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Service role full access to wellness"
  ON public.wellness_tracking
  FOR ALL
  TO service_role
  USING (true);

-- ============================================
-- CHAT SESSIONS
-- ============================================

DROP POLICY IF EXISTS "Users can read own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can create own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can update own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Service role full access to chat sessions" ON public.chat_sessions;

CREATE POLICY "Users can read own chat sessions"
  ON public.chat_sessions
  FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create own chat sessions"
  ON public.chat_sessions
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own chat sessions"
  ON public.chat_sessions
  FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Service role full access to chat sessions"
  ON public.chat_sessions
  FOR ALL
  TO service_role
  USING (true);

-- ============================================
-- CHAT MESSAGES
-- ============================================

DROP POLICY IF EXISTS "Users can read own chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can insert own chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Service role full access to chat messages" ON public.chat_messages;

CREATE POLICY "Users can read own chat messages"
  ON public.chat_messages
  FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own chat messages"
  ON public.chat_messages
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Service role full access to chat messages"
  ON public.chat_messages
  FOR ALL
  TO service_role
  USING (true);

-- ============================================
-- ANXIETY ANALYSES
-- ============================================

DROP POLICY IF EXISTS "Users can read own anxiety analyses" ON public.anxiety_analyses;
DROP POLICY IF EXISTS "Users can insert own anxiety analyses" ON public.anxiety_analyses;
DROP POLICY IF EXISTS "Service role full access to anxiety analyses" ON public.anxiety_analyses;

CREATE POLICY "Users can read own anxiety analyses"
  ON public.anxiety_analyses
  FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own anxiety analyses"
  ON public.anxiety_analyses
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Service role full access to anxiety analyses"
  ON public.anxiety_analyses
  FOR ALL
  TO service_role
  USING (true);

-- ============================================
-- APPOINTMENTS
-- ============================================

DROP POLICY IF EXISTS "Patients can read own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Patients can create own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Service role full access to appointments" ON public.appointments;

CREATE POLICY "Patients can read own appointments"
  ON public.appointments
  FOR SELECT
  USING (auth.uid()::text = patient_id);

CREATE POLICY "Patients can create own appointments"
  ON public.appointments
  FOR INSERT
  WITH CHECK (auth.uid()::text = patient_id);

CREATE POLICY "Service role full access to appointments"
  ON public.appointments
  FOR ALL
  TO service_role
  USING (true);

-- ============================================
-- USER GOALS
-- ============================================

DROP POLICY IF EXISTS "Users can read own goals" ON public.user_goals;
DROP POLICY IF EXISTS "Users can create own goals" ON public.user_goals;
DROP POLICY IF EXISTS "Users can update own goals" ON public.user_goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON public.user_goals;
DROP POLICY IF EXISTS "Service role full access to user goals" ON public.user_goals;

CREATE POLICY "Users can read own goals"
  ON public.user_goals
  FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create own goals"
  ON public.user_goals
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own goals"
  ON public.user_goals
  FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own goals"
  ON public.user_goals
  FOR DELETE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Service role full access to user goals"
  ON public.user_goals
  FOR ALL
  TO service_role
  USING (true);

-- ============================================
-- GOAL PROGRESS
-- ============================================

DROP POLICY IF EXISTS "Service role full access to goal progress" ON public.goal_progress;

CREATE POLICY "Service role full access to goal progress"
  ON public.goal_progress
  FOR ALL
  TO service_role
  USING (true);

-- ============================================
-- CONVERSATION SUMMARIES
-- ============================================

DROP POLICY IF EXISTS "Users can read own conversation summaries" ON public.conversation_summaries;
DROP POLICY IF EXISTS "Service role full access to conversation summaries" ON public.conversation_summaries;

CREATE POLICY "Users can read own conversation summaries"
  ON public.conversation_summaries
  FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Service role full access to conversation summaries"
  ON public.conversation_summaries
  FOR ALL
  TO service_role
  USING (true);

-- ============================================
-- CONVERSATION KEYWORDS
-- ============================================

DROP POLICY IF EXISTS "Users can read own conversation keywords" ON public.conversation_keywords;
DROP POLICY IF EXISTS "Service role full access to conversation keywords" ON public.conversation_keywords;

CREATE POLICY "Users can read own conversation keywords"
  ON public.conversation_keywords
  FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Service role full access to conversation keywords"
  ON public.conversation_keywords
  FOR ALL
  TO service_role
  USING (true);

-- ============================================
-- INTERVENTION SUMMARIES
-- ============================================

DROP POLICY IF EXISTS "Users can read own intervention summaries" ON public.intervention_summaries;
DROP POLICY IF EXISTS "Service role full access to intervention summaries" ON public.intervention_summaries;

CREATE POLICY "Users can read own intervention summaries"
  ON public.intervention_summaries
  FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Service role full access to intervention summaries"
  ON public.intervention_summaries
  FOR ALL
  TO service_role
  USING (true);

-- ============================================
-- USER CONSENTS
-- ============================================

DROP POLICY IF EXISTS "Users can read own consents" ON public.user_consents;
DROP POLICY IF EXISTS "Service role full access to user consents" ON public.user_consents;

CREATE POLICY "Users can read own consents"
  ON public.user_consents
  FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Service role full access to user consents"
  ON public.user_consents
  FOR ALL
  TO service_role
  USING (true);

-- ============================================
-- RESEARCH PAPERS (already has public read policy)
-- ============================================

DROP POLICY IF EXISTS "Service role full access to research papers" ON public.research_papers;

CREATE POLICY "Service role full access to research papers"
  ON public.research_papers
  FOR ALL
  TO service_role
  USING (true);

-- ============================================
-- THERAPISTS
-- ============================================

DROP POLICY IF EXISTS "Service role full access to therapists" ON public.therapists;

CREATE POLICY "Service role full access to therapists"
  ON public.therapists
  FOR ALL
  TO service_role
  USING (true);

-- ============================================
-- TREATMENT PLANS
-- ============================================

DROP POLICY IF EXISTS "Service role full access to treatment plans" ON public.treatment_plans;

CREATE POLICY "Service role full access to treatment plans"
  ON public.treatment_plans
  FOR ALL
  TO service_role
  USING (true);

-- ============================================
-- USER THERAPISTS
-- ============================================

DROP POLICY IF EXISTS "Service role full access to user therapists" ON public.user_therapists;

CREATE POLICY "Service role full access to user therapists"
  ON public.user_therapists
  FOR ALL
  TO service_role
  USING (true);

-- ============================================
-- THERAPIST PATIENT CONNECTIONS
-- ============================================

DROP POLICY IF EXISTS "Service role full access to therapist patient connections" ON public.therapist_patient_connections;

CREATE POLICY "Service role full access to therapist patient connections"
  ON public.therapist_patient_connections
  FOR ALL
  TO service_role
  USING (true);

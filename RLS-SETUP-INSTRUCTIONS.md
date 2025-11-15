# Row Level Security (RLS) Setup Instructions

## CRITICAL SECURITY ISSUE

Your Supabase Security Advisor shows **18 RLS errors** - all database tables are **publicly accessible without authentication**! This is a major HIPAA violation for a mental health app.

## What You Need To Do

1. Go to your Supabase project: https://supabase.com/dashboard/project/przforeyoxweawyfrxws

2. Navigate to **SQL Editor**

3. Run the SQL script below to enable Row Level Security on all tables

4. This will fix all 18 security errors and protect patient data

---

## SQL Script to Run in Supabase SQL Editor

```sql
-- ============================================
-- ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
-- ============================================
-- This prevents unauthorized access to patient health data

-- Enable RLS on all tables
ALTER TABLE public.wellness_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anxiety_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intervention_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapist_patient_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_therapists ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CREATE RLS POLICIES FOR PROFILES TABLE
-- ============================================

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

-- Service role can do anything (for server-side operations)
CREATE POLICY "Service role has full access to profiles"
  ON public.profiles
  FOR ALL
  TO service_role
  USING (true);

-- ============================================
-- CREATE RLS POLICIES FOR WELLNESS TRACKING
-- ============================================

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
-- CREATE RLS POLICIES FOR CHAT SESSIONS
-- ============================================

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
-- CREATE RLS POLICIES FOR CHAT MESSAGES
-- ============================================

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
-- CREATE RLS POLICIES FOR ANXIETY ANALYSES
-- ============================================

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
-- CREATE RLS POLICIES FOR APPOINTMENTS
-- ============================================

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
-- CREATE RLS POLICIES FOR USER GOALS
-- ============================================

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
-- CREATE RLS POLICIES FOR REMAINING TABLES
-- ============================================

-- Goal Progress
CREATE POLICY "Service role full access to goal progress"
  ON public.goal_progress
  FOR ALL
  TO service_role
  USING (true);

-- Conversation Summaries
CREATE POLICY "Users can read own conversation summaries"
  ON public.conversation_summaries
  FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Service role full access to conversation summaries"
  ON public.conversation_summaries
  FOR ALL
  TO service_role
  USING (true);

-- Conversation Keywords
CREATE POLICY "Users can read own conversation keywords"
  ON public.conversation_keywords
  FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Service role full access to conversation keywords"
  ON public.conversation_keywords
  FOR ALL
  TO service_role
  USING (true);

-- Intervention Summaries
CREATE POLICY "Users can read own intervention summaries"
  ON public.intervention_summaries
  FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Service role full access to intervention summaries"
  ON public.intervention_summaries
  FOR ALL
  TO service_role
  USING (true);

-- User Consents
CREATE POLICY "Users can read own consents"
  ON public.user_consents
  FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Service role full access to user consents"
  ON public.user_consents
  FOR ALL
  TO service_role
  USING (true);

-- Research Papers - publicly readable
CREATE POLICY "Research papers are publicly readable"
  ON public.research_papers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role full access to research papers"
  ON public.research_papers
  FOR ALL
  TO service_role
  USING (true);

-- Email Queue - service role only
CREATE POLICY "Only service role can access email queue"
  ON public.email_queue
  FOR ALL
  TO service_role
  USING (true);

-- Therapists
CREATE POLICY "Service role full access to therapists"
  ON public.therapists
  FOR ALL
  TO service_role
  USING (true);

-- Treatment Plans
CREATE POLICY "Service role full access to treatment plans"
  ON public.treatment_plans
  FOR ALL
  TO service_role
  USING (true);

-- User Therapists
CREATE POLICY "Service role full access to user therapists"
  ON public.user_therapists
  FOR ALL
  TO service_role
  USING (true);

-- Therapist Patient Connections
CREATE POLICY "Service role full access to therapist patient connections"
  ON public.therapist_patient_connections
  FOR ALL
  TO service_role
  USING (true);
```

---

## Verify It Worked

After running the script:

1. Go back to **Database → Advisors → Security Advisor** in Supabase
2. Click "Refresh"
3. All 18 errors should be gone!
4. You should see "0 errors" ✅

---

## Why This Is Critical

- **Before**: Anyone on the internet could read/write patient health data
- **After**: Only authenticated users can access their own data
- **Service Role**: Your backend (with service key) can still do everything

This is **required for HIPAA compliance** and protects your users' sensitive mental health information.

-- Enable Row Level Security (RLS) on all tables
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

-- Create RLS policies for profiles table
-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Service role can do anything (for server-side operations)
CREATE POLICY "Service role has full access to profiles"
  ON public.profiles
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Create RLS policies for wellness_tracking
CREATE POLICY "Users can read own wellness data"
  ON public.wellness_tracking
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wellness data"
  ON public.wellness_tracking
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wellness data"
  ON public.wellness_tracking
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own wellness data"
  ON public.wellness_tracking
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for chat_sessions
CREATE POLICY "Users can read own chat sessions"
  ON public.chat_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chat sessions"
  ON public.chat_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat sessions"
  ON public.chat_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create RLS policies for chat_messages
CREATE POLICY "Users can read own chat messages"
  ON public.chat_messages
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages"
  ON public.chat_messages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for anxiety_analyses
CREATE POLICY "Users can read own anxiety analyses"
  ON public.anxiety_analyses
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own anxiety analyses"
  ON public.anxiety_analyses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for appointments
CREATE POLICY "Patients can read own appointments"
  ON public.appointments
  FOR SELECT
  USING (auth.uid() = patient_id);

CREATE POLICY "Patients can create own appointments"
  ON public.appointments
  FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

-- Create RLS policies for user_goals
CREATE POLICY "Users can read own goals"
  ON public.user_goals
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own goals"
  ON public.user_goals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON public.user_goals
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
  ON public.user_goals
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for goal_progress
CREATE POLICY "Users can read own goal progress"
  ON public.goal_progress
  FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM public.user_goals WHERE id = goal_id));

CREATE POLICY "Users can create own goal progress"
  ON public.goal_progress
  FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.user_goals WHERE id = goal_id));

-- Create RLS policies for conversation_summaries
CREATE POLICY "Users can read own conversation summaries"
  ON public.conversation_summaries
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversation summaries"
  ON public.conversation_summaries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for conversation_keywords
CREATE POLICY "Users can read own conversation keywords"
  ON public.conversation_keywords
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversation keywords"
  ON public.conversation_keywords
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for intervention_summaries
CREATE POLICY "Users can read own intervention summaries"
  ON public.intervention_summaries
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own intervention summaries"
  ON public.intervention_summaries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for user_consents
CREATE POLICY "Users can read own consents"
  ON public.user_consents
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own consents"
  ON public.user_consents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own consents"
  ON public.user_consents
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Research papers - publicly readable
CREATE POLICY "Research papers are publicly readable"
  ON public.research_papers
  FOR SELECT
  TO authenticated
  USING (true);

-- Email queue - service role only
CREATE POLICY "Only service role can access email queue"
  ON public.email_queue
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Therapist tables - restrict to therapists
CREATE POLICY "Therapists can read own data"
  ON public.therapists
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Therapists can update own data"
  ON public.therapists
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Treatment plans - patients and their therapists can read
CREATE POLICY "Users can read own treatment plans"
  ON public.treatment_plans
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT therapist_id FROM public.user_therapists WHERE user_id = treatment_plans.user_id
    )
  );

-- User therapists connections
CREATE POLICY "Users can read own therapist connections"
  ON public.user_therapists
  FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = therapist_id);

CREATE POLICY "Users can create therapist connections"
  ON public.user_therapists
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Therapist patient connections
CREATE POLICY "Therapists can read own patient connections"
  ON public.therapist_patient_connections
  FOR SELECT
  USING (auth.uid() IN (
    SELECT user_id FROM public.therapists WHERE id = therapist_id
  ));

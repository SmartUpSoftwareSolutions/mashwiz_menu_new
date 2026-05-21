-- Create survey_settings table
CREATE TABLE IF NOT EXISTS public.survey_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description_en text NOT NULL DEFAULT 'Help us improve by sharing your feedback. Your opinion matters!',
  description_ar text NOT NULL DEFAULT 'ساعدنا في التحسين من خلال مشاركة ملاحظاتك. رأيك يهمنا!',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create survey_questions table
CREATE TABLE IF NOT EXISTS public.survey_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_en text NOT NULL,
  question_ar text NOT NULL,
  question_type text NOT NULL CHECK (question_type IN ('rating', 'text', 'yes_no', 'multiple_choice')),
  choices jsonb DEFAULT NULL,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create survey_responses table
CREATE TABLE IF NOT EXISTS public.survey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.survey_questions(id) ON DELETE CASCADE,
  rating integer DEFAULT NULL,
  text_response text DEFAULT NULL,
  selected_choice text DEFAULT NULL,
  customer_name text DEFAULT NULL,
  customer_email text DEFAULT NULL,
  customer_phone text DEFAULT NULL,
  session_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure id defaults are set (in case table pre-existed without defaults)
ALTER TABLE public.survey_settings ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.survey_questions ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.survey_responses ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Enable Row Level Security
ALTER TABLE public.survey_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

-- RLS policies: allow all operations for both anon and authenticated
-- (admin uses localStorage-based auth, not Supabase Auth, so requests arrive as anon role)
DROP POLICY IF EXISTS "Allow all for anon and authenticated" ON public.survey_settings;
CREATE POLICY "Allow all for anon and authenticated" ON public.survey_settings
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for anon and authenticated" ON public.survey_questions;
CREATE POLICY "Allow all for anon and authenticated" ON public.survey_questions
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for anon and authenticated" ON public.survey_responses;
CREATE POLICY "Allow all for anon and authenticated" ON public.survey_responses
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_survey_settings_updated_at ON public.survey_settings;
CREATE TRIGGER set_survey_settings_updated_at
  BEFORE UPDATE ON public.survey_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_survey_questions_updated_at ON public.survey_questions;
CREATE TRIGGER set_survey_questions_updated_at
  BEFORE UPDATE ON public.survey_questions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

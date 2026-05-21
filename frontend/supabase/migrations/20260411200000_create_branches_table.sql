-- Branches lookup table: maps branch codes to human-readable names
CREATE TABLE IF NOT EXISTS public.branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_ar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Also add branch_code to locations so each location can be tied to a branch
ALTER TABLE public.locations
  ADD COLUMN IF NOT EXISTS branch_code TEXT;

-- Row-level security
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to branches"
  ON public.branches FOR SELECT
  USING (true);

CREATE POLICY "Allow all operations on branches"
  ON public.branches FOR ALL
  USING (true)
  WITH CHECK (true);

-- Updated-at trigger
CREATE TRIGGER set_updated_at_branches
  BEFORE UPDATE ON public.branches
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

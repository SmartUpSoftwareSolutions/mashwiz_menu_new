CREATE TABLE public.promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT,
  image_url TEXT NOT NULL,
  amount TEXT,
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to promotions"
  ON public.promotions FOR SELECT
  USING (true);

CREATE POLICY "Allow all operations on promotions"
  ON public.promotions FOR ALL
  USING (true);

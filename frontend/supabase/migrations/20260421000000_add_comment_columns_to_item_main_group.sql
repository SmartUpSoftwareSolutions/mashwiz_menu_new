ALTER TABLE public.item_main_group
  ADD COLUMN IF NOT EXISTS comment_en TEXT,
  ADD COLUMN IF NOT EXISTS comment_ar TEXT;

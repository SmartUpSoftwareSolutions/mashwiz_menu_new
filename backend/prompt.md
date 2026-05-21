I need to connect this project to a new Lovable/Supabase project. Please:

1. Give me the new Supabase credentials:
   - Project URL (VITE_SUPABASE_URL)
   - Anon/Publishable key (VITE_SUPABASE_ANON_KEY)
   - Service Role key (for backend full access)
   - Pooler connection string (DATABASE_URL) — port 5432 (Transaction mode)
   - Direct connection string (DIRECT_URL) — port 5432

   ⚠️ This database will be used for full read AND write operations from an
   external Node.js + Prisma backend. Please disable RLS on all tables or
   ensure the connection user has SELECT, INSERT, UPDATE, and DELETE
   privileges on every table with no blocking policies.

2. Create the following tables in the new Supabase database:

-- customer_details
CREATE TABLE customer_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- item_main_group
CREATE TABLE item_main_group (
  id_primary SERIAL PRIMARY KEY,
  itm_group_code TEXT NOT NULL,
  itm_group_name TEXT NOT NULL,
  show_in_website BOOLEAN,
  order_group INT,
  website_description_ar TEXT,
  website_description_en TEXT,
  website_name_ar TEXT,
  website_name_en TEXT,
  saleable BOOLEAN,
  nested_level INT,
  parent_group_code TEXT,
  path TEXT,
  branch_code TEXT,
  UNIQUE (itm_group_code, branch_code)
);

-- item_master
CREATE TABLE item_master (
  id SERIAL PRIMARY KEY,
  itm_code TEXT NOT NULL,
  itm_name TEXT NOT NULL,
  itm_group_code TEXT,
  photo_url BYTEA,
  image TEXT,
  item_order INT,
  image_order INT,
  sales_price DECIMAL(10,2),
  show_in_website BOOLEAN,
  website_description_ar TEXT,
  website_description_en TEXT,
  website_name_ar TEXT,
  website_name_en TEXT,
  saleable BOOLEAN,
  fasting BOOLEAN,
  vegetarian BOOLEAN,
  healthy_choice BOOLEAN,
  signature_dish BOOLEAN,
  spicy BOOLEAN,
  branch_code TEXT,
  UNIQUE (itm_code, branch_code),
  FOREIGN KEY (itm_group_code, branch_code) REFERENCES item_main_group(itm_group_code, branch_code) ON DELETE SET NULL
);

-- tags
CREATE TABLE tags (
  id CHAR(36) PRIMARY KEY,
  fasting TEXT,
  vegetarian TEXT,
  healthy_choice TEXT,
  signature_dish TEXT,
  spicy TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- web_themes
CREATE TABLE web_themes (
  theme_id TEXT PRIMARY KEY,
  theme_name TEXT NOT NULL,
  background_color TEXT NOT NULL,
  primary_color TEXT NOT NULL,
  secondary_color TEXT NOT NULL,
  text_color TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- restaurant_info
CREATE TABLE restaurant_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slogan TEXT,
  logo_url TEXT,
  logo_blob BYTEA,
  style TEXT NOT NULL,
  show_all_category BOOLEAN DEFAULT true,
  theme_id TEXT REFERENCES web_themes(theme_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  branch_code TEXT
);

-- restaurant_branches
CREATE TABLE restaurant_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_code TEXT UNIQUE NOT NULL,
  branch_name TEXT NOT NULL,
  company TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- social_links
CREATE TABLE social_links (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  "bgColor" TEXT,
  "textColor" TEXT,
  "borderColor" TEXT,
  url TEXT NOT NULL,
  links_order INT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- buckets
CREATE TABLE buckets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  public BOOLEAN NOT NULL,
  file_size_limit BIGINT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- locations
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  location_order INT,
  city TEXT NOT NULL,
  map_link TEXT NOT NULL,
  is_open_24_7 BOOLEAN,
  working_hours JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- survey_settings
CREATE TABLE survey_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description_en TEXT DEFAULT 'Help us improve by sharing your feedback. Your opinion matters!',
  description_ar TEXT DEFAULT 'ساعدنا في التحسين من خلال مشاركة ملاحظاتك. رأيك يهمنا!',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- survey_questions
CREATE TABLE survey_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_en TEXT NOT NULL,
  question_ar TEXT NOT NULL,
  question_type TEXT DEFAULT 'rating',
  choices JSONB,
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- survey_responses
CREATE TABLE survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES survey_questions(id) ON DELETE CASCADE,
  rating INT,
  text_response TEXT,
  selected_choice TEXT,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- button_clicks
CREATE TABLE button_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  button_name TEXT NOT NULL,
  clicked_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

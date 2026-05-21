-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Customer Details Table
CREATE TABLE public.customer_details (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Item Main Group (Categories) Table
CREATE TABLE public.item_main_group (
  id_primary SERIAL PRIMARY KEY,
  itm_group_code TEXT UNIQUE NOT NULL,
  itm_group_name TEXT NOT NULL,
  show_in_website BOOLEAN,
  order_group INTEGER,
  website_description_ar TEXT,
  website_description_en TEXT,
  website_name_ar TEXT,
  website_name_en TEXT,
  saleable BOOLEAN,
  nested_level INTEGER,
  parent_group_code TEXT,
  path TEXT,
  branch_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Item Master (Menu Items) Table
CREATE TABLE public.item_master (
  id SERIAL PRIMARY KEY,
  itm_code TEXT UNIQUE NOT NULL DEFAULT uuid_generate_v4()::TEXT,
  itm_name TEXT NOT NULL,
  itm_group_code TEXT REFERENCES public.item_main_group(itm_group_code) ON DELETE SET NULL,
  photo_url BYTEA,
  image TEXT,
  item_order INTEGER,
  image_order INTEGER,
  sales_price DECIMAL(10, 2),
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tags Table
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fasting TEXT,
  vegetarian TEXT,
  healthy_choice TEXT,
  signature_dish TEXT,
  spicy TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Web Themes Table
CREATE TABLE public.web_themes (
  theme_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  theme_name TEXT NOT NULL,
  background_color TEXT NOT NULL,
  primary_color TEXT NOT NULL,
  secondary_color TEXT NOT NULL,
  text_color TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Restaurant Info Table
CREATE TABLE public.restaurant_info (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slogan TEXT,
  logo_url TEXT,
  logo_blob BYTEA,
  style TEXT NOT NULL,
  show_all_category BOOLEAN DEFAULT TRUE,
  theme_id UUID REFERENCES public.web_themes(theme_id) ON DELETE SET NULL,
  branch_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Social Links Table
CREATE TABLE public.social_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform TEXT NOT NULL,
  bg_color TEXT,
  text_color TEXT,
  border_color TEXT,
  url TEXT NOT NULL,
  links_order INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Locations Table
CREATE TABLE public.locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  location_order INTEGER,
  city TEXT NOT NULL,
  map_link TEXT NOT NULL,
  is_open_24_7 BOOLEAN,
  working_hours JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_item_main_group_code ON public.item_main_group(itm_group_code);
CREATE INDEX idx_item_main_group_show_website ON public.item_main_group(show_in_website);
CREATE INDEX idx_item_main_group_branch ON public.item_main_group(branch_code);

CREATE INDEX idx_item_master_code ON public.item_master(itm_code);
CREATE INDEX idx_item_master_group_code ON public.item_master(itm_group_code);
CREATE INDEX idx_item_master_order ON public.item_master(item_order);
CREATE INDEX idx_item_master_show_website ON public.item_master(show_in_website);
CREATE INDEX idx_item_master_branch ON public.item_master(branch_code);

CREATE INDEX idx_restaurant_info_branch ON public.restaurant_info(branch_code);
CREATE INDEX idx_restaurant_info_theme ON public.restaurant_info(theme_id);

-- Enable Row Level Security
ALTER TABLE public.customer_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_main_group ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.web_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public read access (adjust based on your needs)
CREATE POLICY "Allow public read access to item_main_group"
  ON public.item_main_group FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to item_master"
  ON public.item_master FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to tags"
  ON public.tags FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to web_themes"
  ON public.web_themes FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to restaurant_info"
  ON public.restaurant_info FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to social_links"
  ON public.social_links FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to locations"
  ON public.locations FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to customer_details"
  ON public.customer_details FOR SELECT
  USING (true);

-- Create policies for admin write access (you'll need to implement auth later)
CREATE POLICY "Allow all operations on item_main_group"
  ON public.item_main_group FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on item_master"
  ON public.item_master FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on tags"
  ON public.tags FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on web_themes"
  ON public.web_themes FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on restaurant_info"
  ON public.restaurant_info FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on social_links"
  ON public.social_links FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on locations"
  ON public.locations FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on customer_details"
  ON public.customer_details FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.customer_details
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.item_main_group
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.item_master
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.tags
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.web_themes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.restaurant_info
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.social_links
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.locations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
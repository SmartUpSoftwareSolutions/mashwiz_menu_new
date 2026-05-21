-- Add composite index to speed up the admin menu items query
-- which filters on saleable + show_in_website and orders by itm_group_code + item_order + itm_name
CREATE INDEX IF NOT EXISTS idx_item_master_saleable_website_group_order
  ON public.item_master (saleable, show_in_website, itm_group_code, item_order, itm_name);

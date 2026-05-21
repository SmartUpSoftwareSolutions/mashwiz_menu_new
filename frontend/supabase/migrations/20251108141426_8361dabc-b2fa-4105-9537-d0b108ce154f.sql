-- Create button_clicks table for analytics
CREATE TABLE IF NOT EXISTS public.button_clicks (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  button_name text NOT NULL,
  clicked_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.button_clicks ENABLE ROW LEVEL SECURITY;

-- Allow all operations on button_clicks (same as other tables)
CREATE POLICY "Allow all operations on button_clicks" 
ON public.button_clicks 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Allow public read access
CREATE POLICY "Allow public read access to button_clicks" 
ON public.button_clicks 
FOR SELECT 
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_button_clicks_updated_at
BEFORE UPDATE ON public.button_clicks
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
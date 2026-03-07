
-- Add starts_at column to tests table for scheduled start times
ALTER TABLE public.tests ADD COLUMN IF NOT EXISTS starts_at timestamp with time zone DEFAULT NULL;

-- Create platform_settings table for configurable settings like support URL
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid DEFAULT NULL
);

-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings
CREATE POLICY "Anyone can read platform settings"
  ON public.platform_settings
  FOR SELECT
  USING (true);

-- Only super admins can manage settings
CREATE POLICY "Super admins can manage platform settings"
  ON public.platform_settings
  FOR ALL
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

-- Insert default support URL
INSERT INTO public.platform_settings (key, value) VALUES ('support_url', 'https://t.me/support') ON CONFLICT (key) DO NOTHING;

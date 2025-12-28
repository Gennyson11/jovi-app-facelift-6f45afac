-- Create site settings table for maintenance mode and other global settings
CREATE TABLE public.site_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage settings
CREATE POLICY "Admins can manage site settings"
ON public.site_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Everyone can read settings (needed for maintenance check)
CREATE POLICY "Anyone can read site settings"
ON public.site_settings
FOR SELECT
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default maintenance mode setting (off by default)
INSERT INTO public.site_settings (key, value)
VALUES ('maintenance_mode', '{"enabled": false, "message": "O site está em manutenção. Voltaremos em breve!"}'::jsonb);
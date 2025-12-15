-- Create table to track platform clicks
CREATE TABLE public.platform_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform_id UUID NOT NULL REFERENCES public.streaming_platforms(id) ON DELETE CASCADE,
  click_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(platform_id)
);

-- Enable RLS
ALTER TABLE public.platform_clicks ENABLE ROW LEVEL SECURITY;

-- Admins can manage clicks
CREATE POLICY "Admins can manage clicks"
ON public.platform_clicks
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can view clicks
CREATE POLICY "Authenticated users can view clicks"
ON public.platform_clicks
FOR SELECT
USING (true);

-- Authenticated users can increment clicks
CREATE POLICY "Authenticated users can update clicks"
ON public.platform_clicks
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Allow insert for new platforms
CREATE POLICY "Allow insert for clicks"
ON public.platform_clicks
FOR INSERT
WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_platform_clicks_updated_at
BEFORE UPDATE ON public.platform_clicks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Initialize click counts for existing platforms
INSERT INTO public.platform_clicks (platform_id, click_count)
SELECT id, 0 FROM public.streaming_platforms
ON CONFLICT (platform_id) DO NOTHING;
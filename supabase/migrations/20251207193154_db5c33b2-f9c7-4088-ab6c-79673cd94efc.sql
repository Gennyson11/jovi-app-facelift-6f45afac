-- Create enum for platform categories
CREATE TYPE public.platform_category AS ENUM ('ai_tools', 'streamings', 'software', 'bonus_courses');

-- Add category column to streaming_platforms
ALTER TABLE public.streaming_platforms 
ADD COLUMN category platform_category NOT NULL DEFAULT 'streamings';

COMMENT ON COLUMN public.streaming_platforms.category IS 'Category of the platform: ai_tools, streamings, software, bonus_courses';
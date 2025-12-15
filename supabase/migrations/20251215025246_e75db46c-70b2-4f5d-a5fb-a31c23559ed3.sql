-- Add whatsapp column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN whatsapp TEXT;

-- Add avatar_url column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN avatar_url TEXT;
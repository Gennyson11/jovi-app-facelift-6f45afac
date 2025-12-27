-- Add block_reason column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN block_reason text DEFAULT NULL;
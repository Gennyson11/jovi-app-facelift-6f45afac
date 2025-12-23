-- Add original_price column for discount display
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS original_price DECIMAL(10,2) DEFAULT NULL;
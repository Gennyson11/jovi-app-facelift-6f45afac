-- Add partner_id column to profiles to track which partner registered the client
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS partner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_partner_id ON public.profiles(partner_id);

-- Allow partners to view clients they registered
CREATE POLICY "Partners can view their clients"
ON public.profiles
FOR SELECT
USING (
  partner_id = auth.uid() AND 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'socio'
  )
);

-- Allow partners to update their clients
CREATE POLICY "Partners can update their clients"
ON public.profiles
FOR UPDATE
USING (
  partner_id = auth.uid() AND 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'socio'
  )
)
WITH CHECK (
  partner_id = auth.uid() AND 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'socio'
  )
);
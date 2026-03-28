-- 1. Fix invites: Replace open SELECT with restricted policies
DROP POLICY IF EXISTS "Anyone can view invite by code" ON public.invites;

CREATE POLICY "Authenticated users can lookup invite by code"
  ON public.invites FOR SELECT
  TO authenticated
  USING (true);

-- Note: The actual code-based filtering happens in app queries.
-- Admins already have full access via "Admins can manage all invites".
-- We restrict to authenticated only, removing public/anon access.

-- 2. Fix partner_client_view: Enable RLS and add policies
ALTER VIEW public.partner_client_view SET (security_invoker = on);

CREATE POLICY "Partners can view their own clients"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    partner_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'socio'
    )
  );

-- 3. Fix user_coins: Remove user UPDATE policy to prevent coin manipulation
DROP POLICY IF EXISTS "Users can update their own coins" ON public.user_coins;
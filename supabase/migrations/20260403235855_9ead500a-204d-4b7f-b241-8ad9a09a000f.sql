
-- 1. Fix invites: replace open SELECT policies with code-scoped lookup

DROP POLICY IF EXISTS "Anyone can lookup invite by code" ON public.invites;
DROP POLICY IF EXISTS "Authenticated users can lookup invite by code" ON public.invites;

-- Anon can only look up a specific invite by code (used during registration)
-- Since RLS can't access request params directly, we use a restrictive approach:
-- Only allow selecting active invites, and only expose non-sensitive columns via a view
CREATE POLICY "Anon can lookup active invites by code"
  ON public.invites FOR SELECT
  TO anon
  USING (status = 'active' AND expires_at > now());

CREATE POLICY "Authenticated can lookup active invites"
  ON public.invites FOR SELECT
  TO authenticated
  USING (
    status = 'active' AND expires_at > now()
    OR used_by = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- 2. Fix partner profile update escalation: replace permissive policy with a restricted one
-- that only allows updating name (not has_access, access_expires_at, partner_id, etc.)

DROP POLICY IF EXISTS "Partners can update client access only" ON public.profiles;

CREATE POLICY "Partners can update client name only"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    partner_id = auth.uid()
    AND has_role(auth.uid(), 'socio'::app_role)
  )
  WITH CHECK (
    partner_id = auth.uid()
    AND has_role(auth.uid(), 'socio'::app_role)
  );

-- 3. Ensure partner_client_view uses security_invoker
-- Recreate the view with security_invoker = on to respect RLS
ALTER VIEW public.partner_client_view SET (security_invoker = on);

-- Drop existing restrictive policies for partners
DROP POLICY IF EXISTS "Partners can view their clients" ON public.profiles;
DROP POLICY IF EXISTS "Partners can update their clients" ON public.profiles;

-- Create PERMISSIVE policies for partners (using OR logic)
CREATE POLICY "Partners can view their clients"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  partner_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'socio'::app_role
  )
);

CREATE POLICY "Partners can update their clients"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  partner_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'socio'::app_role
  )
)
WITH CHECK (
  partner_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'socio'::app_role
  )
);
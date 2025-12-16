-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can manage platform access" ON public.user_platform_access;
DROP POLICY IF EXISTS "Users can view their own platform access" ON public.user_platform_access;

-- Create PERMISSIVE policies (only one needs to pass)
CREATE POLICY "Admins can manage platform access" 
ON public.user_platform_access 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own platform access" 
ON public.user_platform_access 
FOR SELECT 
TO authenticated
USING (user_id IN (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()));
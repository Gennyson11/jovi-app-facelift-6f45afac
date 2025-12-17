-- Drop existing policies on user_platform_access
DROP POLICY IF EXISTS "Admins can manage platform access" ON public.user_platform_access;
DROP POLICY IF EXISTS "Users can view their own platform access" ON public.user_platform_access;

-- Create simple SELECT policy for admins that directly checks user_roles
CREATE POLICY "Admins can select all platform access" 
ON public.user_platform_access 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- Create INSERT/UPDATE/DELETE policy for admins
CREATE POLICY "Admins can modify platform access" 
ON public.user_platform_access 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- Keep users' own access policy
CREATE POLICY "Users can view their own platform access" 
ON public.user_platform_access 
FOR SELECT 
USING (
  user_id IN (
    SELECT profiles.id 
    FROM profiles 
    WHERE profiles.user_id = auth.uid()
  )
);
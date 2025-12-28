
-- Drop the insecure policies
DROP POLICY IF EXISTS "Authenticated users can view platforms" ON public.streaming_platforms;
DROP POLICY IF EXISTS "Authenticated users can view credentials" ON public.streaming_credentials;

-- Create secure policy for streaming_platforms
-- Users can only see platforms they have access to via user_platform_access table
CREATE POLICY "Users can view their accessible platforms" 
ON public.streaming_platforms 
FOR SELECT 
TO authenticated
USING (
  -- Admins can see all platforms
  has_role(auth.uid(), 'admin'::app_role)
  OR
  -- Socios can see all platforms  
  has_role(auth.uid(), 'socio'::app_role)
  OR
  -- Regular users can only see platforms they have access to
  EXISTS (
    SELECT 1 
    FROM public.user_platform_access upa
    JOIN public.profiles p ON p.id = upa.user_id
    WHERE upa.platform_id = streaming_platforms.id
    AND p.user_id = auth.uid()
  )
);

-- Create secure policy for streaming_credentials
-- Users can only see credentials for platforms they have access to
CREATE POLICY "Users can view their accessible credentials" 
ON public.streaming_credentials 
FOR SELECT 
TO authenticated
USING (
  -- Admins can see all credentials
  has_role(auth.uid(), 'admin'::app_role)
  OR
  -- Socios can see all credentials
  has_role(auth.uid(), 'socio'::app_role)
  OR
  -- Regular users can only see credentials for platforms they have access to
  EXISTS (
    SELECT 1 
    FROM public.user_platform_access upa
    JOIN public.profiles p ON p.id = upa.user_id
    WHERE upa.platform_id = streaming_credentials.platform_id
    AND p.user_id = auth.uid()
  )
);

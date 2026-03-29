
-- Allow anonymous/unauthenticated users to read invites (needed for invite registration page)
CREATE POLICY "Anyone can lookup invite by code"
ON public.invites
FOR SELECT
TO anon
USING (true);

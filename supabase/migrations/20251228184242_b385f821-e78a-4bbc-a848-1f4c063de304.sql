-- Allow anyone to view basic platform info (for invite page)
CREATE POLICY "Anyone can view platform names"
ON public.streaming_platforms
FOR SELECT
USING (true);
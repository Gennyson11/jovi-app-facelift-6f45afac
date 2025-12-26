-- Create user_access_logs table to track user logins with IP and location
CREATE TABLE public.user_access_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    ip_address TEXT NOT NULL,
    city TEXT,
    region TEXT,
    country TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_user_access_logs_user_id ON public.user_access_logs(user_id);
CREATE INDEX idx_user_access_logs_created_at ON public.user_access_logs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.user_access_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view access logs
CREATE POLICY "Admins can view all access logs"
ON public.user_access_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can manage access logs
CREATE POLICY "Admins can manage access logs"
ON public.user_access_logs
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow insert from edge functions (service role)
CREATE POLICY "Allow insert for authenticated users"
ON public.user_access_logs
FOR INSERT
WITH CHECK (user_id = auth.uid());
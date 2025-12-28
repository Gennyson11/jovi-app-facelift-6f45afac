-- 1. RESTRINGIR ACESSO AOS LOGS DE AUDITORIA - apenas sistema pode inserir
DROP POLICY IF EXISTS "Allow insert via function" ON public.security_audit_log;

-- Criar política mais restritiva
CREATE POLICY "Only system can insert audit logs"
ON public.security_audit_log
FOR INSERT
WITH CHECK (
  -- Apenas inserções via service role ou funções security definer
  current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  OR current_user = 'postgres'
);

-- 2. RESTRINGIR INSERÇÃO EM user_access_logs
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.user_access_logs;

-- Apenas o edge function (service role) pode inserir
CREATE POLICY "Only system can insert access logs"
ON public.user_access_logs
FOR INSERT
WITH CHECK (
  current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  OR current_user = 'postgres'
);

-- 3. RESTRINGIR VISUALIZAÇÃO DE CLIQUES - apenas admin pode ver todos
DROP POLICY IF EXISTS "Authenticated users can view clicks" ON public.platform_clicks;

CREATE POLICY "Users can view clicks of accessible platforms"
ON public.platform_clicks
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM user_platform_access upa
    JOIN profiles p ON p.id = upa.user_id
    WHERE upa.platform_id = platform_clicks.platform_id
    AND p.user_id = auth.uid()
    AND p.has_access = true
  )
);

-- 4. ADICIONAR CONSTRAINT para platform_clicks evitar duplicatas
ALTER TABLE public.platform_clicks 
ADD CONSTRAINT unique_platform_click UNIQUE (platform_id);
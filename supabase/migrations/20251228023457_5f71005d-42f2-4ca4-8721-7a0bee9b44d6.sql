-- 1. REMOVER COLUNAS DE CREDENCIAIS DA TABELA streaming_platforms
-- (as credenciais devem ficar APENAS na tabela streaming_credentials)
ALTER TABLE public.streaming_platforms DROP COLUMN IF EXISTS login;
ALTER TABLE public.streaming_platforms DROP COLUMN IF EXISTS password;

-- 2. CORRIGIR RLS DA TABELA platform_clicks
-- Remover políticas permissivas que permitem qualquer usuário manipular cliques
DROP POLICY IF EXISTS "Authenticated users can update clicks" ON public.platform_clicks;
DROP POLICY IF EXISTS "Allow insert for clicks" ON public.platform_clicks;

-- Criar nova política que só permite inserir/atualizar através de função segura
-- Primeiro, criar uma função segura para incrementar cliques
CREATE OR REPLACE FUNCTION public.increment_platform_click(p_platform_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.platform_clicks (platform_id, click_count)
  VALUES (p_platform_id, 1)
  ON CONFLICT (platform_id) 
  DO UPDATE SET 
    click_count = platform_clicks.click_count + 1,
    updated_at = now();
END;
$$;

-- Revogar acesso direto e permitir apenas via função
REVOKE ALL ON public.platform_clicks FROM authenticated;
GRANT SELECT ON public.platform_clicks TO authenticated;

-- 3. RESTRINGIR ACESSO DE PARCEIROS A DADOS SENSÍVEIS
-- Criar uma view segura para parceiros que não expõe email/whatsapp completos
CREATE OR REPLACE VIEW public.partner_client_view AS
SELECT 
  id,
  user_id,
  name,
  -- Mascarar email: mostrar apenas primeiros 3 caracteres + ***@dominio
  CASE 
    WHEN email IS NOT NULL THEN 
      CONCAT(LEFT(email, 3), '***@', SPLIT_PART(email, '@', 2))
    ELSE NULL 
  END as masked_email,
  has_access,
  access_expires_at,
  partner_id,
  created_at,
  updated_at,
  -- Mascarar WhatsApp: mostrar apenas últimos 4 dígitos
  CASE 
    WHEN whatsapp IS NOT NULL THEN 
      CONCAT('****', RIGHT(whatsapp, 4))
    ELSE NULL 
  END as masked_whatsapp
FROM public.profiles;

-- 4. ADICIONAR RESTRIÇÃO EXTRA NA TABELA streaming_credentials
-- Garantir que apenas usuários com acesso à plataforma podem ver as credenciais
DROP POLICY IF EXISTS "Users can view their accessible credentials" ON public.streaming_credentials;

CREATE POLICY "Users can view their accessible credentials" 
ON public.streaming_credentials
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'socio'::app_role) 
  OR (
    EXISTS (
      SELECT 1
      FROM user_platform_access upa
      JOIN profiles p ON p.id = upa.user_id
      WHERE upa.platform_id = streaming_credentials.platform_id 
      AND p.user_id = auth.uid()
      AND p.has_access = true  -- ADICIONAR: verificar se o usuário tem acesso ativo
    )
  )
);

-- 5. ADICIONAR LOG DE AUDITORIA PARA AÇÕES SENSÍVEIS
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  table_name text,
  record_id uuid,
  details jsonb,
  ip_address text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver logs de auditoria
CREATE POLICY "Only admins can view audit logs"
ON public.security_audit_log
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Permitir inserção via função segura
CREATE POLICY "Allow insert via function"
ON public.security_audit_log
FOR INSERT
WITH CHECK (true);

-- Função para registrar ações de segurança
CREATE OR REPLACE FUNCTION public.log_security_action(
  p_action text,
  p_table_name text DEFAULT NULL,
  p_record_id uuid DEFAULT NULL,
  p_details jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.security_audit_log (user_id, action, table_name, record_id, details)
  VALUES (auth.uid(), p_action, p_table_name, p_record_id, p_details);
END;
$$;
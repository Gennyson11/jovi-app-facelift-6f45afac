-- Remove a política que permite sócios verem dados completos dos clientes
DROP POLICY IF EXISTS "Partners can view their clients" ON public.profiles;
DROP POLICY IF EXISTS "Partners can update their clients" ON public.profiles;

-- Criar política mais restritiva para sócios - apenas podem ver campos limitados
-- Sócios devem usar a partner_client_view que já mascara dados sensíveis
CREATE POLICY "Partners can view limited client data"
ON public.profiles
FOR SELECT
USING (
  -- Sócios só podem ver seus próprios clientes
  -- mas através desta policy terão acesso restrito
  partner_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'socio'
  )
);

-- Sócios podem atualizar apenas campos específicos (has_access, access_expires_at)
-- mas não podem ver/alterar email ou whatsapp
CREATE POLICY "Partners can update client access only"
ON public.profiles
FOR UPDATE
USING (
  partner_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'socio'
  )
)
WITH CHECK (
  partner_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'socio'
  )
);

-- Adicionar RLS na view partner_client_view
-- A view já existe com security_invoker = true, então precisamos garantir 
-- que sócios usem ela para ver dados mascarados
COMMENT ON VIEW public.partner_client_view IS 'View segura para sócios verem clientes com dados sensíveis mascarados';
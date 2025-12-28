-- Corrigir a view para não usar SECURITY DEFINER implícito
-- Dropar a view anterior
DROP VIEW IF EXISTS public.partner_client_view;

-- Recriar com SECURITY INVOKER (padrão seguro)
CREATE VIEW public.partner_client_view 
WITH (security_invoker = true) AS
SELECT 
  id,
  user_id,
  name,
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
  CASE 
    WHEN whatsapp IS NOT NULL THEN 
      CONCAT('****', RIGHT(whatsapp, 4))
    ELSE NULL 
  END as masked_whatsapp
FROM public.profiles;
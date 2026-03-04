CREATE OR REPLACE FUNCTION public.get_partner_contact(p_user_id uuid)
RETURNS TABLE(partner_name text, partner_whatsapp text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT p2.name, p2.whatsapp
  FROM profiles p1
  JOIN profiles p2 ON p2.user_id = p1.partner_id
  WHERE p1.user_id = p_user_id
    AND p1.partner_id IS NOT NULL;
END;
$$;
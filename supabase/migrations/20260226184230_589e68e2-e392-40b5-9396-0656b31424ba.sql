-- Convert existing access_days values from hours to minutes
UPDATE public.invites SET access_days = access_days * 60 WHERE access_days > 0;

-- Update the use_invite function to use minutes instead of hours
CREATE OR REPLACE FUNCTION public.use_invite(p_invite_code text, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite record;
  v_profile_id uuid;
  v_platform_id uuid;
BEGIN
  SELECT * INTO v_invite FROM public.invites WHERE code = p_invite_code;
  
  IF v_invite IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Convite não encontrado');
  END IF;
  
  IF v_invite.status = 'used' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Este convite já foi utilizado');
  END IF;
  
  IF v_invite.status = 'expired' OR v_invite.expires_at < now() THEN
    UPDATE public.invites SET status = 'expired', updated_at = now() WHERE id = v_invite.id;
    RETURN jsonb_build_object('success', false, 'error', 'Este convite expirou');
  END IF;
  
  SELECT id INTO v_profile_id FROM public.profiles WHERE user_id = p_user_id;
  
  IF v_profile_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Perfil não encontrado');
  END IF;
  
  -- Use minutes for access duration
  UPDATE public.profiles 
  SET 
    has_access = true,
    access_expires_at = now() + (v_invite.access_days || ' minutes')::interval,
    updated_at = now()
  WHERE id = v_profile_id;
  
  FOREACH v_platform_id IN ARRAY v_invite.platform_ids
  LOOP
    INSERT INTO public.user_platform_access (user_id, platform_id)
    VALUES (v_profile_id, v_platform_id)
    ON CONFLICT DO NOTHING;
  END LOOP;
  
  UPDATE public.invites 
  SET 
    status = 'used',
    used_at = now(),
    used_by = p_user_id,
    updated_at = now()
  WHERE id = v_invite.id;
  
  RETURN jsonb_build_object('success', true, 'access_minutes', v_invite.access_days);
END;
$$;
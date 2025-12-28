-- Create invites table
CREATE TABLE public.invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  used_at timestamp with time zone,
  used_by uuid REFERENCES auth.users(id),
  created_by uuid NOT NULL,
  platform_ids uuid[] NOT NULL DEFAULT '{}',
  access_days integer NOT NULL DEFAULT 15,
  recipient_name text,
  recipient_email text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage all invites"
ON public.invites
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view invite by code"
ON public.invites
FOR SELECT
USING (true);

-- Create function to generate unique invite code
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  LOOP
    new_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    SELECT EXISTS(SELECT 1 FROM public.invites WHERE code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END;
$$;

-- Create function to use invite and create user access
CREATE OR REPLACE FUNCTION public.use_invite(
  p_invite_code text,
  p_user_id uuid
)
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
  -- Get invite
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
  
  -- Get profile id
  SELECT id INTO v_profile_id FROM public.profiles WHERE user_id = p_user_id;
  
  IF v_profile_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Perfil não encontrado');
  END IF;
  
  -- Update profile with access
  UPDATE public.profiles 
  SET 
    has_access = true,
    access_expires_at = now() + (v_invite.access_days || ' days')::interval,
    updated_at = now()
  WHERE id = v_profile_id;
  
  -- Add platform access
  FOREACH v_platform_id IN ARRAY v_invite.platform_ids
  LOOP
    INSERT INTO public.user_platform_access (user_id, platform_id)
    VALUES (v_profile_id, v_platform_id)
    ON CONFLICT DO NOTHING;
  END LOOP;
  
  -- Mark invite as used
  UPDATE public.invites 
  SET 
    status = 'used',
    used_at = now(),
    used_by = p_user_id,
    updated_at = now()
  WHERE id = v_invite.id;
  
  RETURN jsonb_build_object('success', true, 'access_days', v_invite.access_days);
END;
$$;

-- Trigger to update updated_at
CREATE TRIGGER update_invites_updated_at
BEFORE UPDATE ON public.invites
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
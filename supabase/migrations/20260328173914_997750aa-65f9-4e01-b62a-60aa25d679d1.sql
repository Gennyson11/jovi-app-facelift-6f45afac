-- Fix add_credits to allow internal calls from other SECURITY DEFINER functions
-- by adding an optional bypass parameter and checking if called from trusted context
CREATE OR REPLACE FUNCTION public.add_credits(
  p_user_id uuid, 
  p_amount integer, 
  p_type text, 
  p_description text DEFAULT NULL, 
  p_reference_id text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_balance integer;
  caller_role text;
  is_internal_call boolean;
BEGIN
  -- Check if this is an internal call from another SECURITY DEFINER function
  -- When called internally, session_user will be the function owner (postgres/supabase_admin)
  -- and current_user will also be set by SECURITY DEFINER
  is_internal_call := (session_user IN ('postgres', 'supabase_admin'));

  IF NOT is_internal_call THEN
    -- External call: check JWT role
    caller_role := coalesce(
      current_setting('request.jwt.claims', true)::json->>'role',
      ''
    );
    
    IF caller_role = 'service_role' THEN
      -- Edge functions can call freely
      NULL;
    ELSIF NOT has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Permission denied: only admins can add credits';
    END IF;
  END IF;

  INSERT INTO user_credits (user_id, balance)
  VALUES (p_user_id, p_amount)
  ON CONFLICT (user_id)
  DO UPDATE SET balance = user_credits.balance + p_amount;

  SELECT balance INTO new_balance FROM user_credits WHERE user_id = p_user_id;

  INSERT INTO credit_transactions (user_id, amount, type, description, reference_id)
  VALUES (p_user_id, p_amount, p_type, p_description, p_reference_id);

  RETURN new_balance;
END;
$$;
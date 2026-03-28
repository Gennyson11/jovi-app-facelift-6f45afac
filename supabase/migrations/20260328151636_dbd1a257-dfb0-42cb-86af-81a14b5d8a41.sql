CREATE OR REPLACE FUNCTION public.add_credits(p_user_id uuid, p_amount integer, p_type text, p_description text DEFAULT NULL::text, p_reference_id text DEFAULT NULL::text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  new_balance integer;
  caller_role text;
BEGIN
  -- Only allow admins or service_role (edge functions) to call this
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
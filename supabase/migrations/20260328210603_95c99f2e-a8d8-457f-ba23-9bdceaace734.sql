
-- Now that duplicates are cleaned, add unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_transactions_reference_id_unique 
ON credit_transactions (reference_id) 
WHERE reference_id IS NOT NULL;

-- Update add_credits function with idempotency check
CREATE OR REPLACE FUNCTION public.add_credits(p_user_id uuid, p_amount integer, p_type text, p_description text DEFAULT NULL::text, p_reference_id text DEFAULT NULL::text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_balance integer;
  caller_role text;
  is_internal_call boolean;
  existing_tx_id uuid;
BEGIN
  -- Check for duplicate reference_id first (idempotency)
  IF p_reference_id IS NOT NULL THEN
    SELECT id INTO existing_tx_id 
    FROM credit_transactions 
    WHERE reference_id = p_reference_id 
    LIMIT 1;
    
    IF existing_tx_id IS NOT NULL THEN
      -- Already processed, return current balance without adding
      SELECT balance INTO new_balance FROM user_credits WHERE user_id = p_user_id;
      RETURN COALESCE(new_balance, 0);
    END IF;
  END IF;

  -- Check if this is an internal call from another SECURITY DEFINER function
  is_internal_call := (session_user IN ('postgres', 'supabase_admin'));

  IF NOT is_internal_call THEN
    caller_role := coalesce(
      current_setting('request.jwt.claims', true)::json->>'role',
      ''
    );
    
    IF caller_role = 'service_role' THEN
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
$function$;

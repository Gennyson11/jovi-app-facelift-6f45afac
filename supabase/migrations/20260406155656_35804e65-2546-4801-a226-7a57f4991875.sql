CREATE OR REPLACE FUNCTION public.deduct_socio_credit(p_user_id uuid, p_type text, p_description text DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance integer;
BEGIN
  -- Ensure the caller is deducting from their own account
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Permission denied: can only deduct own credits';
  END IF;

  -- Ensure caller has socio role
  IF NOT has_role(p_user_id, 'socio') THEN
    RAISE EXCEPTION 'Permission denied: only socios can use this function';
  END IF;

  -- Validate type
  IF p_type NOT IN ('client_creation', 'client_reactivation') THEN
    RAISE EXCEPTION 'Invalid transaction type';
  END IF;

  -- Check balance
  SELECT balance INTO current_balance FROM user_credits WHERE user_id = p_user_id;
  IF COALESCE(current_balance, 0) < 1 THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;

  -- Deduct 1 credit
  UPDATE user_credits SET balance = balance - 1 WHERE user_id = p_user_id;
  SELECT balance INTO current_balance FROM user_credits WHERE user_id = p_user_id;

  -- Log transaction
  INSERT INTO credit_transactions (user_id, amount, type, description)
  VALUES (p_user_id, -1, p_type, p_description);

  RETURN current_balance;
END;
$$;
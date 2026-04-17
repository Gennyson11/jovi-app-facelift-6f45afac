CREATE OR REPLACE FUNCTION public.claim_mission_reward(p_user_id uuid, p_mission_id text, p_reward_amount integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_mission record;
  new_balance integer;
BEGIN
  -- Ensure caller can only claim their own missions
  IF p_user_id != auth.uid() AND NOT has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permissão negada');
  END IF;

  SELECT * INTO v_mission FROM user_missions
  WHERE user_id = p_user_id AND mission_id = p_mission_id;

  IF v_mission IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Missão não encontrada');
  END IF;

  IF NOT v_mission.completed THEN
    RETURN jsonb_build_object('success', false, 'error', 'Missão não completada');
  END IF;

  IF v_mission.claimed THEN
    RETURN jsonb_build_object('success', false, 'error', 'Recompensa já reivindicada');
  END IF;

  UPDATE user_missions
  SET claimed = true, claimed_at = now()
  WHERE user_id = p_user_id AND mission_id = p_mission_id;

  -- Add credits directly bypassing add_credits role check (we already validated above)
  INSERT INTO user_credits (user_id, balance)
  VALUES (p_user_id, p_reward_amount)
  ON CONFLICT (user_id)
  DO UPDATE SET balance = user_credits.balance + p_reward_amount;

  SELECT balance INTO new_balance FROM user_credits WHERE user_id = p_user_id;

  INSERT INTO credit_transactions (user_id, amount, type, description, reference_id)
  VALUES (p_user_id, p_reward_amount, 'mission_reward', 'Recompensa: ' || p_mission_id, 'mission_' || p_mission_id || '_' || p_user_id);

  RETURN jsonb_build_object('success', true, 'new_balance', new_balance);
END;
$function$;
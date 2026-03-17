
-- Tabela de saldo de créditos do usuário
CREATE TABLE public.user_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  balance integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credits" ON public.user_credits
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all credits" ON public.user_credits
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Tabela de transações de créditos (histórico)
CREATE TABLE public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount integer NOT NULL,
  type text NOT NULL CHECK (type IN ('purchase', 'mission_reward', 'usage', 'admin_grant')),
  description text,
  reference_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON public.credit_transactions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all transactions" ON public.credit_transactions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Tabela de progresso de missões do usuário
CREATE TABLE public.user_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mission_id text NOT NULL,
  progress integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  claimed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  claimed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, mission_id)
);

ALTER TABLE public.user_missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own missions" ON public.user_missions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can update own missions" ON public.user_missions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert own missions" ON public.user_missions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all missions" ON public.user_missions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger para updated_at
CREATE TRIGGER update_user_credits_updated_at
  BEFORE UPDATE ON public.user_credits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_missions_updated_at
  BEFORE UPDATE ON public.user_missions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função para adicionar créditos (security definer)
CREATE OR REPLACE FUNCTION public.add_credits(p_user_id uuid, p_amount integer, p_type text, p_description text DEFAULT NULL, p_reference_id text DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_balance integer;
BEGIN
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

-- Função para reivindicar recompensa de missão
CREATE OR REPLACE FUNCTION public.claim_mission_reward(p_user_id uuid, p_mission_id text, p_reward_amount integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mission record;
  new_balance integer;
BEGIN
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

  new_balance := public.add_credits(p_user_id, p_reward_amount, 'mission_reward', 'Recompensa: ' || p_mission_id);

  RETURN jsonb_build_object('success', true, 'new_balance', new_balance);
END;
$$;

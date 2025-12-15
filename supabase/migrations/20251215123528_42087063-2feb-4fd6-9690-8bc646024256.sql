-- Create user_coins table for daily coin management
CREATE TABLE public.user_coins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coins INTEGER NOT NULL DEFAULT 20,
  last_reset_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_coins ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own coins"
ON public.user_coins
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own coins"
ON public.user_coins
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow insert for authenticated users"
ON public.user_coins
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all coins"
ON public.user_coins
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger to update updated_at
CREATE TRIGGER update_user_coins_updated_at
BEFORE UPDATE ON public.user_coins
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to initialize coins for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_coins()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_coins (user_id, coins, last_reset_at)
  VALUES (NEW.id, 20, now())
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger to auto-create coins for new users
CREATE TRIGGER on_auth_user_created_coins
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_coins();

-- Function to check and reset coins if needed (based on Brasília timezone)
CREATE OR REPLACE FUNCTION public.check_and_reset_coins(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_coins INTEGER;
  last_reset TIMESTAMP WITH TIME ZONE;
  brasilia_now TIMESTAMP WITH TIME ZONE;
  brasilia_midnight TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get current time in Brasília timezone
  brasilia_now := now() AT TIME ZONE 'America/Sao_Paulo';
  
  -- Get today's midnight in Brasília timezone
  brasilia_midnight := date_trunc('day', brasilia_now) AT TIME ZONE 'America/Sao_Paulo';
  
  -- Get user's current coins and last reset
  SELECT coins, last_reset_at INTO current_coins, last_reset
  FROM public.user_coins
  WHERE user_id = p_user_id;
  
  -- If no record exists, create one
  IF current_coins IS NULL THEN
    INSERT INTO public.user_coins (user_id, coins, last_reset_at)
    VALUES (p_user_id, 20, now())
    RETURNING coins INTO current_coins;
    RETURN current_coins;
  END IF;
  
  -- Check if last reset was before today's midnight (Brasília time)
  IF last_reset < brasilia_midnight THEN
    -- Reset coins to 20
    UPDATE public.user_coins
    SET coins = 20, last_reset_at = now()
    WHERE user_id = p_user_id
    RETURNING coins INTO current_coins;
  END IF;
  
  RETURN current_coins;
END;
$$;

-- Function to deduct a coin
CREATE OR REPLACE FUNCTION public.deduct_coin(p_user_id UUID)
RETURNS TABLE(success BOOLEAN, remaining_coins INTEGER, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_coins INTEGER;
BEGIN
  -- First check and reset coins if needed
  current_coins := public.check_and_reset_coins(p_user_id);
  
  -- Check if user has coins
  IF current_coins <= 0 THEN
    RETURN QUERY SELECT false, 0, 'Você não tem moedas suficientes. Suas moedas resetam à meia-noite (horário de Brasília).'::TEXT;
    RETURN;
  END IF;
  
  -- Deduct one coin
  UPDATE public.user_coins
  SET coins = coins - 1
  WHERE user_id = p_user_id
  RETURNING coins INTO current_coins;
  
  RETURN QUERY SELECT true, current_coins, 'Moeda deduzida com sucesso.'::TEXT;
END;
$$;
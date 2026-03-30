
-- Carlos Porto: saldo 0, 0 gastos (remove correção de -18)
UPDATE user_credits SET balance = 0, updated_at = now() WHERE user_id = '4e1d263e-4a5b-4cf0-9420-9e091b7c3c1f';
DELETE FROM credit_transactions WHERE user_id = '4e1d263e-4a5b-4cf0-9420-9e091b7c3c1f' AND amount = -18 AND type = 'client_creation';

-- Carlos Oliveira: saldo 0, 6 gastos (ajusta correção de -31 para -3, total gasto = 1+1+1+3 = 6)
UPDATE user_credits SET balance = 0, updated_at = now() WHERE user_id = 'ecb1b4e5-7309-431e-879c-08b707f89767';
UPDATE credit_transactions SET amount = -3, description = 'Correção: 3 clientes criados sem desconto de crédito' WHERE user_id = 'ecb1b4e5-7309-431e-879c-08b707f89767' AND amount = -31 AND type = 'client_creation';

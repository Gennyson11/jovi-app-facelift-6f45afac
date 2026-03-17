import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Coins, Trophy, Star, Target, Gift, CheckCircle, Lock, ArrowRight, Zap, Clock, Copy, RefreshCw, X, CreditCard } from 'lucide-react';
import DashboardSidebar from '@/components/DashboardSidebar';

// Mission tier system
interface MissionDef {
  id: string;
  title: string;
  description: string;
  target: number;
  reward: number;
  level: number;
  tier: string;
  icon: string;
}

const TIER_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; emoji: string }> = {
  'bronze': { label: 'Bronze', bg: 'bg-amber-700/10', text: 'text-amber-600', border: 'border-amber-700/30', emoji: '🥉' },
  'prata': { label: 'Prata', bg: 'bg-slate-400/10', text: 'text-slate-300', border: 'border-slate-400/30', emoji: '🥈' },
  'ouro': { label: 'Ouro', bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30', emoji: '🥇' },
  'platina': { label: 'Platina', bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30', emoji: '💎' },
  'diamante': { label: 'Diamante', bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30', emoji: '👑' },
};

function getTier(level: number): string {
  if (level <= 20) return 'bronze';
  if (level <= 40) return 'prata';
  if (level <= 60) return 'ouro';
  if (level <= 80) return 'platina';
  return 'diamante';
}

// Generate 100 progressive missions — based on total credits PURCHASED
const MISSIONS: MissionDef[] = [
  // Bronze (1-20) — Reward: 2-3 créditos
  { id: 'lvl_1', title: 'Primeira Compra', description: 'Compre 5 créditos no total', target: 5, reward: 2, level: 1, tier: 'bronze', icon: '🛒' },
  { id: 'lvl_2', title: 'Começando', description: 'Compre 12 créditos no total', target: 12, reward: 2, level: 2, tier: 'bronze', icon: '📦' },
  { id: 'lvl_3', title: 'Investidor Iniciante', description: 'Compre 25 créditos no total', target: 25, reward: 2, level: 3, tier: 'bronze', icon: '💰' },
  { id: 'lvl_4', title: 'Acumulador', description: 'Compre 40 créditos no total', target: 40, reward: 2, level: 4, tier: 'bronze', icon: '📈' },
  { id: 'lvl_5', title: 'Centenário', description: 'Compre 50 créditos no total', target: 50, reward: 2, level: 5, tier: 'bronze', icon: '🔟' },
  { id: 'lvl_6', title: 'Comprador Ativo', description: 'Compre 75 créditos no total', target: 75, reward: 2, level: 6, tier: 'bronze', icon: '🛍️' },
  { id: 'lvl_7', title: 'Construtor', description: 'Compre 100 créditos no total', target: 100, reward: 2, level: 7, tier: 'bronze', icon: '🏗️' },
  { id: 'lvl_8', title: 'Progresso', description: 'Compre 150 créditos no total', target: 150, reward: 2, level: 8, tier: 'bronze', icon: '📊' },
  { id: 'lvl_9', title: 'Determinado', description: 'Compre 200 créditos no total', target: 200, reward: 2, level: 9, tier: 'bronze', icon: '💪' },
  { id: 'lvl_10', title: 'Meio Milhar', description: 'Compre 250 créditos no total', target: 250, reward: 3, level: 10, tier: 'bronze', icon: '🎯' },
  { id: 'lvl_11', title: 'Parceiro Bronze', description: 'Compre 325 créditos no total', target: 325, reward: 2, level: 11, tier: 'bronze', icon: '🤝' },
  { id: 'lvl_12', title: 'Em Crescimento', description: 'Compre 400 créditos no total', target: 400, reward: 2, level: 12, tier: 'bronze', icon: '🌱' },
  { id: 'lvl_13', title: 'Quinhentos', description: 'Compre 500 créditos no total', target: 500, reward: 3, level: 13, tier: 'bronze', icon: '⬆️' },
  { id: 'lvl_14', title: 'Dedicado', description: 'Compre 650 créditos no total', target: 650, reward: 2, level: 14, tier: 'bronze', icon: '🏅' },
  { id: 'lvl_15', title: 'Persistente', description: 'Compre 800 créditos no total', target: 800, reward: 3, level: 15, tier: 'bronze', icon: '⭐' },
  { id: 'lvl_16', title: 'Mil Créditos', description: 'Compre 1.000 créditos no total', target: 1000, reward: 3, level: 16, tier: 'bronze', icon: '🔥' },
  { id: 'lvl_17', title: 'Comprador Fiel', description: 'Compre 1.250 créditos no total', target: 1250, reward: 2, level: 17, tier: 'bronze', icon: '💎' },
  { id: 'lvl_18', title: 'Mil e Quinhentos', description: 'Compre 1.500 créditos no total', target: 1500, reward: 3, level: 18, tier: 'bronze', icon: '📦' },
  { id: 'lvl_19', title: 'Quase Elite', description: 'Compre 2.000 créditos no total', target: 2000, reward: 3, level: 19, tier: 'bronze', icon: '🚀' },
  { id: 'lvl_20', title: 'Graduado Bronze', description: 'Compre 2.500 créditos no total', target: 2500, reward: 5, level: 20, tier: 'bronze', icon: '🎓' },

  // Prata (21-40) — Reward: 3-5 créditos
  { id: 'lvl_21', title: 'Investidor Prata', description: 'Compre 3.000 créditos no total', target: 3000, reward: 3, level: 21, tier: 'prata', icon: '🥈' },
  { id: 'lvl_22', title: 'Crescendo Forte', description: 'Compre 3.750 créditos no total', target: 3750, reward: 3, level: 22, tier: 'prata', icon: '📈' },
  { id: 'lvl_23', title: 'Negociante', description: 'Compre 4.500 créditos no total', target: 4500, reward: 3, level: 23, tier: 'prata', icon: '🤑' },
  { id: 'lvl_24', title: 'Empreendedor', description: 'Compre 5.000 créditos no total', target: 5000, reward: 3, level: 24, tier: 'prata', icon: '💼' },
  { id: 'lvl_25', title: 'Seis Mil', description: 'Compre 6.000 créditos no total', target: 6000, reward: 3, level: 25, tier: 'prata', icon: '🎯' },
  { id: 'lvl_26', title: 'Expansão', description: 'Compre 7.500 créditos no total', target: 7500, reward: 4, level: 26, tier: 'prata', icon: '🌐' },
  { id: 'lvl_27', title: 'Comprador Elite', description: 'Compre 9.000 créditos no total', target: 9000, reward: 3, level: 27, tier: 'prata', icon: '👑' },
  { id: 'lvl_28', title: 'Dez Mil', description: 'Compre 10.000 créditos no total', target: 10000, reward: 4, level: 28, tier: 'prata', icon: '🏆' },
  { id: 'lvl_29', title: 'Negócio Sólido', description: 'Compre 12.500 créditos no total', target: 12500, reward: 4, level: 29, tier: 'prata', icon: '🏢' },
  { id: 'lvl_30', title: 'Parceiro de Peso', description: 'Compre 15.000 créditos no total', target: 15000, reward: 5, level: 30, tier: 'prata', icon: '⚡' },
  { id: 'lvl_31', title: 'Dezessete Mil', description: 'Compre 17.500 créditos no total', target: 17500, reward: 3, level: 31, tier: 'prata', icon: '💫' },
  { id: 'lvl_32', title: 'Magnata Iniciante', description: 'Compre 20.000 créditos no total', target: 20000, reward: 4, level: 32, tier: 'prata', icon: '🌟' },
  { id: 'lvl_33', title: 'Vinte e Cinco Mil', description: 'Compre 25.000 créditos no total', target: 25000, reward: 5, level: 33, tier: 'prata', icon: '🔥' },
  { id: 'lvl_34', title: 'Investidor Forte', description: 'Compre 30.000 créditos no total', target: 30000, reward: 4, level: 34, tier: 'prata', icon: '📊' },
  { id: 'lvl_35', title: 'Trinta e Cinco Mil', description: 'Compre 35.000 créditos no total', target: 35000, reward: 4, level: 35, tier: 'prata', icon: '🎖️' },
  { id: 'lvl_36', title: 'Quarenta Mil', description: 'Compre 40.000 créditos no total', target: 40000, reward: 5, level: 36, tier: 'prata', icon: '💰' },
  { id: 'lvl_37', title: 'Quarenta e Cinco Mil', description: 'Compre 45.000 créditos no total', target: 45000, reward: 4, level: 37, tier: 'prata', icon: '🚀' },
  { id: 'lvl_38', title: 'Perto dos Cinquenta', description: 'Compre 47.500 créditos no total', target: 47500, reward: 4, level: 38, tier: 'prata', icon: '🎯' },
  { id: 'lvl_39', title: 'Cinquenta Mil', description: 'Compre 50.000 créditos no total', target: 50000, reward: 5, level: 39, tier: 'prata', icon: '⭐' },
  { id: 'lvl_40', title: 'Graduado Prata', description: 'Compre 60.000 créditos no total', target: 60000, reward: 8, level: 40, tier: 'prata', icon: '🏆' },

  // Ouro (41-60) — Reward: 5-10 créditos
  { id: 'lvl_41', title: 'Investidor Ouro', description: 'Compre 75.000 créditos no total', target: 75000, reward: 5, level: 41, tier: 'ouro', icon: '🥇' },
  { id: 'lvl_42', title: 'Empreendedor Pro', description: 'Compre 90.000 créditos no total', target: 90000, reward: 5, level: 42, tier: 'ouro', icon: '💼' },
  { id: 'lvl_43', title: 'Grande Comprador', description: 'Compre 100.000 créditos no total', target: 100000, reward: 6, level: 43, tier: 'ouro', icon: '🛒' },
  { id: 'lvl_44', title: 'Cento e Vinte e Cinco', description: 'Compre 125.000 créditos no total', target: 125000, reward: 5, level: 44, tier: 'ouro', icon: '🔥' },
  { id: 'lvl_45', title: 'Magnata', description: 'Compre 150.000 créditos no total', target: 150000, reward: 6, level: 45, tier: 'ouro', icon: '💎' },
  { id: 'lvl_46', title: 'Cento e Setenta e Cinco', description: 'Compre 175.000 créditos no total', target: 175000, reward: 5, level: 46, tier: 'ouro', icon: '🏅' },
  { id: 'lvl_47', title: 'Duzentos Mil', description: 'Compre 200.000 créditos no total', target: 200000, reward: 7, level: 47, tier: 'ouro', icon: '⚡' },
  { id: 'lvl_48', title: 'Duzentos e Cinquenta', description: 'Compre 250.000 créditos no total', target: 250000, reward: 7, level: 48, tier: 'ouro', icon: '🌟' },
  { id: 'lvl_49', title: 'Barão', description: 'Compre 300.000 créditos no total', target: 300000, reward: 6, level: 49, tier: 'ouro', icon: '🎩' },
  { id: 'lvl_50', title: 'Trezentos e Cinquenta', description: 'Compre 350.000 créditos no total', target: 350000, reward: 8, level: 50, tier: 'ouro', icon: '🏔️' },
  { id: 'lvl_51', title: 'Quatrocentos Mil', description: 'Compre 400.000 créditos no total', target: 400000, reward: 6, level: 51, tier: 'ouro', icon: '📈' },
  { id: 'lvl_52', title: 'Quatrocentos e Cinquenta', description: 'Compre 450.000 créditos no total', target: 450000, reward: 6, level: 52, tier: 'ouro', icon: '💰' },
  { id: 'lvl_53', title: 'Meio Milhão', description: 'Compre 500.000 créditos no total', target: 500000, reward: 8, level: 53, tier: 'ouro', icon: '🌍' },
  { id: 'lvl_54', title: 'Mega Investidor', description: 'Compre 600.000 créditos no total', target: 600000, reward: 7, level: 54, tier: 'ouro', icon: '⭐' },
  { id: 'lvl_55', title: 'Comprador Supremo', description: 'Compre 750.000 créditos no total', target: 750000, reward: 8, level: 55, tier: 'ouro', icon: '🎯' },
  { id: 'lvl_56', title: 'Um Milhão', description: 'Compre 1.000.000 créditos no total', target: 1000000, reward: 10, level: 56, tier: 'ouro', icon: '🔥' },
  { id: 'lvl_57', title: 'Empresário', description: 'Compre 1.250.000 créditos no total', target: 1250000, reward: 8, level: 57, tier: 'ouro', icon: '🏢' },
  { id: 'lvl_58', title: 'Um e Meio Milhão', description: 'Compre 1.500.000 créditos no total', target: 1500000, reward: 8, level: 58, tier: 'ouro', icon: '♾️' },
  { id: 'lvl_59', title: 'Poderoso', description: 'Compre 2.000.000 créditos no total', target: 2000000, reward: 10, level: 59, tier: 'ouro', icon: '💫' },
  { id: 'lvl_60', title: 'Graduado Ouro', description: 'Compre 2.500.000 créditos no total', target: 2500000, reward: 15, level: 60, tier: 'ouro', icon: '👑' },

  // Platina (61-80) — Reward: 10-20 créditos
  { id: 'lvl_61', title: 'Investidor Platina', description: 'Compre 3.000.000 créditos no total', target: 3000000, reward: 10, level: 61, tier: 'platina', icon: '💎' },
  { id: 'lvl_62', title: 'Titã', description: 'Compre 3.750.000 créditos no total', target: 3750000, reward: 10, level: 62, tier: 'platina', icon: '🗿' },
  { id: 'lvl_63', title: 'Cinco Milhões', description: 'Compre 5.000.000 créditos no total', target: 5000000, reward: 12, level: 63, tier: 'platina', icon: '🏆' },
  { id: 'lvl_64', title: 'Mega Magnata', description: 'Compre 6.250.000 créditos no total', target: 6250000, reward: 10, level: 64, tier: 'platina', icon: '🌟' },
  { id: 'lvl_65', title: 'Sete e Meio Milhões', description: 'Compre 7.500.000 créditos no total', target: 7500000, reward: 12, level: 65, tier: 'platina', icon: '🔥' },
  { id: 'lvl_66', title: 'Imperador', description: 'Compre 8.750.000 créditos no total', target: 8750000, reward: 10, level: 66, tier: 'platina', icon: '👑' },
  { id: 'lvl_67', title: 'Dez Milhões', description: 'Compre 10.000.000 créditos no total', target: 10000000, reward: 15, level: 67, tier: 'platina', icon: '⚡' },
  { id: 'lvl_68', title: 'Mogul', description: 'Compre 12.500.000 créditos no total', target: 12500000, reward: 12, level: 68, tier: 'platina', icon: '🏛️' },
  { id: 'lvl_69', title: 'Quinze Milhões', description: 'Compre 15.000.000 créditos no total', target: 15000000, reward: 15, level: 69, tier: 'platina', icon: '💰' },
  { id: 'lvl_70', title: 'Supremo', description: 'Compre 20.000.000 créditos no total', target: 20000000, reward: 15, level: 70, tier: 'platina', icon: '🌌' },
  { id: 'lvl_71', title: 'Vinte e Cinco Milhões', description: 'Compre 25.000.000 créditos no total', target: 25000000, reward: 15, level: 71, tier: 'platina', icon: '📊' },
  { id: 'lvl_72', title: 'Barão Platina', description: 'Compre 30.000.000 créditos no total', target: 30000000, reward: 15, level: 72, tier: 'platina', icon: '🎩' },
  { id: 'lvl_73', title: 'Trinta e Sete Milhões', description: 'Compre 37.500.000 créditos no total', target: 37500000, reward: 18, level: 73, tier: 'platina', icon: '🏔️' },
  { id: 'lvl_74', title: 'Lorde', description: 'Compre 45.000.000 créditos no total', target: 45000000, reward: 15, level: 74, tier: 'platina', icon: '🗡️' },
  { id: 'lvl_75', title: 'Cinquenta Milhões', description: 'Compre 50.000.000 créditos no total', target: 50000000, reward: 18, level: 75, tier: 'platina', icon: '🌍' },
  { id: 'lvl_76', title: 'Rei', description: 'Compre 62.500.000 créditos no total', target: 62500000, reward: 15, level: 76, tier: 'platina', icon: '👑' },
  { id: 'lvl_77', title: 'Setenta e Cinco Milhões', description: 'Compre 75.000.000 créditos no total', target: 75000000, reward: 18, level: 77, tier: 'platina', icon: '⭐' },
  { id: 'lvl_78', title: 'Soberano', description: 'Compre 87.500.000 créditos no total', target: 87500000, reward: 18, level: 78, tier: 'platina', icon: '🌠' },
  { id: 'lvl_79', title: 'Cem Milhões', description: 'Compre 100.000.000 créditos no total', target: 100000000, reward: 20, level: 79, tier: 'platina', icon: '🚀' },
  { id: 'lvl_80', title: 'Graduado Platina', description: 'Compre 125.000.000 créditos no total', target: 125000000, reward: 25, level: 80, tier: 'platina', icon: '💎' },

  // Diamante (81-100) — Reward: 20-50 créditos
  { id: 'lvl_81', title: 'Diamante Iniciante', description: 'Compre 150.000.000 créditos no total', target: 150000000, reward: 20, level: 81, tier: 'diamante', icon: '💎' },
  { id: 'lvl_82', title: 'Cento e Setenta e Cinco M', description: 'Compre 175.000.000 créditos no total', target: 175000000, reward: 20, level: 82, tier: 'diamante', icon: '🌌' },
  { id: 'lvl_83', title: 'Bilionário Digital', description: 'Compre 200.000.000 créditos no total', target: 200000000, reward: 22, level: 83, tier: 'diamante', icon: '🤑' },
  { id: 'lvl_84', title: 'Duzentos e Cinquenta M', description: 'Compre 250.000.000 créditos no total', target: 250000000, reward: 25, level: 84, tier: 'diamante', icon: '🏆' },
  { id: 'lvl_85', title: 'Entidade', description: 'Compre 300.000.000 créditos no total', target: 300000000, reward: 22, level: 85, tier: 'diamante', icon: '🔥' },
  { id: 'lvl_86', title: 'Trezentos e Setenta e Cinco M', description: 'Compre 375.000.000 créditos no total', target: 375000000, reward: 25, level: 86, tier: 'diamante', icon: '⚡' },
  { id: 'lvl_87', title: 'Meio Bilhão', description: 'Compre 500.000.000 créditos no total', target: 500000000, reward: 30, level: 87, tier: 'diamante', icon: '💫' },
  { id: 'lvl_88', title: 'Mega Poderoso', description: 'Compre 750.000.000 créditos no total', target: 750000000, reward: 28, level: 88, tier: 'diamante', icon: '🌟' },
  { id: 'lvl_89', title: 'Um Bilhão', description: 'Compre 1.000.000.000 créditos no total', target: 1000000000, reward: 35, level: 89, tier: 'diamante', icon: '👑' },
  { id: 'lvl_90', title: 'Um e Meio Bilhão', description: 'Compre 1.500.000.000 créditos no total', target: 1500000000, reward: 30, level: 90, tier: 'diamante', icon: '🏛️' },
  { id: 'lvl_91', title: 'Dois e Meio Bilhões', description: 'Compre 2.500.000.000 créditos no total', target: 2500000000, reward: 35, level: 91, tier: 'diamante', icon: '🗿' },
  { id: 'lvl_92', title: 'Cinco Bilhões', description: 'Compre 5.000.000.000 créditos no total', target: 5000000000, reward: 35, level: 92, tier: 'diamante', icon: '💰' },
  { id: 'lvl_93', title: 'Dez Bilhões', description: 'Compre 10.000.000.000 créditos no total', target: 10000000000, reward: 38, level: 93, tier: 'diamante', icon: '🌍' },
  { id: 'lvl_94', title: 'Vinte e Cinco Bilhões', description: 'Compre 25.000.000.000 créditos no total', target: 25000000000, reward: 40, level: 94, tier: 'diamante', icon: '🔥' },
  { id: 'lvl_95', title: 'Cinquenta Bilhões', description: 'Compre 50.000.000.000 créditos no total', target: 50000000000, reward: 40, level: 95, tier: 'diamante', icon: '♾️' },
  { id: 'lvl_96', title: 'Cem Bilhões', description: 'Compre 100.000.000.000 créditos no total', target: 100000000000, reward: 42, level: 96, tier: 'diamante', icon: '⭐' },
  { id: 'lvl_97', title: 'Quinhentos Bilhões', description: 'Compre 500.000.000.000 créditos no total', target: 500000000000, reward: 45, level: 97, tier: 'diamante', icon: '🚀' },
  { id: 'lvl_98', title: 'Um Trilhão', description: 'Compre 1.000.000.000.000 créditos no total', target: 1000000000000, reward: 48, level: 98, tier: 'diamante', icon: '🌠' },
  { id: 'lvl_99', title: 'Ser Supremo', description: 'Compre 50.000.000.000.000 créditos no total', target: 50000000000000, reward: 50, level: 99, tier: 'diamante', icon: '🌌' },
  { id: 'lvl_100', title: '𝕃𝔼𝔾𝔼ℕ𝔻', description: 'Compre 1.000.000.000.000.000 créditos', target: 1000000000000000, reward: 50, level: 100, tier: 'diamante', icon: '👑' },
];

const CREDIT_UNIT_PRICE = 9.90;

const CREDIT_PACKAGES = [
  { id: 'pack_1', amount: 1, price: 9.90, popular: false },
  { id: 'pack_5', amount: 5, price: 44.90, popular: false },
  { id: 'pack_10', amount: 10, price: 84.90, popular: true },
  { id: 'pack_20', amount: 20, price: 159.90, popular: false },
];

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatar_url?: string | null;
}

interface MissionProgress {
  mission_id: string;
  progress: number;
  completed: boolean;
  claimed: boolean;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  created_at: string;
}

export default function Credits() {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [missionProgress, setMissionProgress] = useState<Record<string, MissionProgress>>({});
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isSocio, setIsSocio] = useState(false);
  const [loading, setLoading] = useState(true);
  const [claimingMission, setClaimingMission] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'creditos' | 'missoes' | 'historico'>('creditos');
  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [pixLoading, setPixLoading] = useState(false);
  const [pixData, setPixData] = useState<{
    paymentId: string;
    pixCode: string;
    qrCodeImage: string;
    value: number;
    creditAmount: number;
    status: string;
  } | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [cpfInput, setCpfInput] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<typeof CREDIT_PACKAGES[0] | null>(null);
  const [cpfStep, setCpfStep] = useState(true);

  const { user, signOut, loading: authLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user?.id) fetchData();
  }, [user?.id]);

  const fetchData = async () => {
    setLoading(true);
    const [profileRes, creditsRes, transactionsRes, missionsRes, socioRes] = await Promise.all([
      supabase.from('profiles').select('id, email, name, avatar_url, socio_2_enabled').eq('user_id', user!.id).maybeSingle(),
      supabase.from('user_credits').select('balance').eq('user_id', user!.id).maybeSingle(),
      supabase.from('credit_transactions').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(20),
      supabase.from('user_missions').select('*').eq('user_id', user!.id),
      supabase.from('user_roles').select('role').eq('user_id', user!.id).eq('role', 'socio').maybeSingle(),
    ]);

    if (profileRes.data) {
      setUserProfile(profileRes.data as UserProfile);
      // Gate: only socio_2_enabled or admin can access
      const isSocio2 = (profileRes.data as any).socio_2_enabled;
      if (!isAdmin && !isSocio2) {
        navigate('/dashboard');
        return;
      }
    }
    if (creditsRes.data) setBalance(creditsRes.data.balance);
    if (transactionsRes.data) setTransactions(transactionsRes.data as Transaction[]);
    setIsSocio(!!socioRes.data);

    if (missionsRes.data) {
      const map: Record<string, MissionProgress> = {};
      (missionsRes.data as MissionProgress[]).forEach(m => { map[m.mission_id] = m; });
      setMissionProgress(map);
    }

    // Calculate total credits purchased (only positive purchase transactions)
    const { data: purchaseData } = await supabase
      .from('credit_transactions')
      .select('amount')
      .eq('user_id', user!.id)
      .eq('type', 'purchase');

    const totalPurchased = (purchaseData || []).reduce((sum, t) => sum + (t.amount > 0 ? t.amount : 0), 0);

    // Auto-update mission progress based on total purchased credits
    for (const mission of MISSIONS) {
      const existing = missionsRes.data?.find((m: any) => m.mission_id === mission.id);
      const progress = Math.min(totalPurchased, mission.target);
      const completed = totalPurchased >= mission.target;

      if (!existing) {
        if (progress > 0) {
          await supabase.from('user_missions').insert({
            user_id: user!.id,
            mission_id: mission.id,
            progress,
            completed,
            completed_at: completed ? new Date().toISOString() : null,
          });
          setMissionProgress(prev => ({
            ...prev,
            [mission.id]: { mission_id: mission.id, progress, completed, claimed: false }
          }));
        }
      } else if (existing.progress < progress || (completed && !existing.completed)) {
        await supabase.from('user_missions')
          .update({ progress, completed, completed_at: completed && !existing.completed ? new Date().toISOString() : existing.completed_at })
          .eq('user_id', user!.id)
          .eq('mission_id', mission.id);
        setMissionProgress(prev => ({
          ...prev,
          [mission.id]: { ...prev[mission.id], progress, completed }
        }));
      }
    }

    setLoading(false);
  };

  const handleClaimReward = async (missionId: string, rewardAmount: number) => {
    setClaimingMission(missionId);
    const { data, error } = await supabase.rpc('claim_mission_reward', {
      p_user_id: user!.id,
      p_mission_id: missionId,
      p_reward_amount: rewardAmount,
    });

    const result = data as any;
    if (error || !result?.success) {
      toast({ title: '❌ Erro', description: result?.error || error?.message || 'Erro ao reivindicar', variant: 'destructive' });
    } else {
      setBalance(result.new_balance);
      setMissionProgress(prev => ({
        ...prev,
        [missionId]: { ...prev[missionId], claimed: true }
      }));
      toast({ title: '🎉 Recompensa Reivindicada!', description: `+${rewardAmount} créditos adicionados ao seu saldo!` });
      fetchData();
    }
    setClaimingMission(null);
  };

  const handleBuyCredits = async (packageId: string) => {
    const pkg = CREDIT_PACKAGES.find(p => p.id === packageId);
    if (!pkg) return;
    
    setSelectedPackage(pkg);
    setCpfStep(true);
    setCpfInput('');
    setPixData(null);
    setPaymentConfirmed(false);
    setPixModalOpen(true);
  };

  const handleConfirmCpf = async () => {
    if (!selectedPackage) return;
    const cleanCpf = cpfInput.replace(/\D/g, '');
    if (cleanCpf.length !== 11 && cleanCpf.length !== 14) {
      toast({ title: '❌ CPF/CNPJ inválido', description: 'Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.', variant: 'destructive' });
      return;
    }

    setCpfStep(false);
    setPixLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-pix-payment', {
        body: { amount: selectedPackage.amount, price: selectedPackage.price, cpfCnpj: cleanCpf },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setPixData(data);
    } catch (err: any) {
      toast({ title: '❌ Erro', description: err.message || 'Erro ao gerar PIX', variant: 'destructive' });
      setPixModalOpen(false);
    } finally {
      setPixLoading(false);
    }
  };

  const handleCopyPixCode = () => {
    if (pixData?.pixCode) {
      navigator.clipboard.writeText(pixData.pixCode);
      toast({ title: '✅ Copiado!', description: 'Código PIX copiado para a área de transferência' });
    }
  };

  const handleCheckPayment = useCallback(async () => {
    if (!pixData || paymentConfirmed) return;
    setCheckingPayment(true);

    try {
      const { data, error } = await supabase.functions.invoke('check-pix-payment', {
        body: { paymentId: pixData.paymentId, creditAmount: pixData.creditAmount },
      });

      if (error) throw error;

      if (data.status === 'CONFIRMED' || data.status === 'RECEIVED') {
        setPaymentConfirmed(true);
        toast({ title: '🎉 Pagamento Confirmado!', description: `+${pixData.creditAmount} créditos adicionados!` });
        fetchData();
      }
    } catch (err: any) {
      // silently ignore polling errors
    } finally {
      setCheckingPayment(false);
    }
  }, [pixData, paymentConfirmed]);

  // Auto-poll payment status every 5 seconds
  useEffect(() => {
    if (!pixData || paymentConfirmed || pixLoading) return;
    const interval = setInterval(() => {
      handleCheckPayment();
    }, 5000);
    return () => clearInterval(interval);
  }, [pixData, paymentConfirmed, pixLoading, handleCheckPayment]);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const typeLabels: Record<string, string> = {
    purchase: '💰 Compra',
    mission_reward: '🏆 Missão',
    usage: '⚡ Uso',
    client_creation: '👤 Cadastro Cliente',
    admin_grant: '🎁 Admin',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex w-full">
      <DashboardSidebar
        userProfile={userProfile}
        onLogout={handleLogout}
        activeCategory="creditos"
        onCategorySelect={(cat) => {
          if (cat !== 'creditos') navigate('/dashboard');
        }}
        isSocio={isSocio}
      />

      <div className="flex-1 min-w-0">
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
          <div className="px-4 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 ml-12 lg:ml-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Coins className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-display font-bold text-foreground">Meus Créditos</h1>
                <p className="text-xs text-muted-foreground">Gerencie seus créditos e missões</p>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
          {/* Balance Card */}
          <Card className="border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                    <Coins className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Saldo Atual</p>
                    <p className="text-4xl font-display font-bold text-foreground">{balance}</p>
                    <p className="text-xs text-muted-foreground">créditos disponíveis</p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <Badge variant="outline" className="border-primary/30 text-primary">
                    <Zap className="w-3 h-3 mr-1" /> v2.0
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-border pb-0">
            {[
              { key: 'creditos', label: 'Comprar Créditos', icon: Coins },
              { key: 'missoes', label: 'Missões', icon: Target },
              { key: 'historico', label: 'Histórico', icon: Clock },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all -mb-[1px] ${
                  activeTab === tab.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Comprar Créditos Tab */}
          {activeTab === 'creditos' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {CREDIT_PACKAGES.map((pkg) => (
                <Card
                  key={pkg.id}
                  className={`relative overflow-hidden transition-all hover:scale-[1.02] ${
                    pkg.popular ? 'border-primary shadow-lg shadow-primary/20' : 'border-border'
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
                      POPULAR
                    </div>
                  )}
                  <CardContent className="p-5 text-center space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mx-auto">
                      <Coins className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-3xl font-display font-bold text-foreground">{pkg.amount}</p>
                      <p className="text-xs text-muted-foreground">créditos</p>
                    </div>
                    <p className="text-lg font-bold text-primary">
                      R$ {pkg.price.toFixed(2).replace('.', ',')}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      R$ {(pkg.price / pkg.amount).toFixed(2).replace('.', ',')} / crédito
                    </p>
                    <Button
                      className="w-full"
                      variant={pkg.popular ? 'default' : 'outline'}
                      onClick={() => handleBuyCredits(pkg.id)}
                    >
                      Comprar
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Missões Tab */}
          {activeTab === 'missoes' && (
            <div className="space-y-6">
              {Object.entries(TIER_CONFIG).map(([tierKey, tierInfo]) => {
                const tierMissions = MISSIONS.filter(m => m.tier === tierKey);
                if (tierMissions.length === 0) return null;
                
                const completedCount = tierMissions.filter(m => missionProgress[m.id]?.claimed).length;
                
                return (
                  <div key={tierKey}>
                    <div className="flex items-center justify-between mb-3">
                      <Badge className={`${tierInfo.bg} ${tierInfo.text} ${tierInfo.border} border`}>
                        <span className="mr-1">{tierInfo.emoji}</span> {tierInfo.label} ({completedCount}/{tierMissions.length})
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Lvl {tierMissions[0].level}-{tierMissions[tierMissions.length - 1].level}
                      </span>
                    </div>
                    <div className="grid gap-2">
                      {tierMissions.map((mission) => {
                        const mp = missionProgress[mission.id];
                        const progress = mp?.progress || 0;
                        const completed = mp?.completed || false;
                        const claimed = mp?.claimed || false;
                        const progressPercent = Math.min((progress / mission.target) * 100, 100);

                        return (
                          <Card key={mission.id} className={`border transition-all ${claimed ? 'opacity-60' : ''}`}>
                            <CardContent className="p-3">
                              <div className="flex items-center gap-3">
                                <div className="text-2xl flex-shrink-0">{mission.icon}</div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-[10px] text-muted-foreground font-mono">Lv.{mission.level}</span>
                                    <h4 className="font-semibold text-foreground text-sm">{mission.title}</h4>
                                    {claimed && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                                  </div>
                                  <p className="text-[11px] text-muted-foreground mb-1.5">{mission.description}</p>
                                  <div className="flex items-center gap-3">
                                    <Progress value={progressPercent} className="flex-1 h-1.5" />
                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                      {progress}/{mission.target}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                                  <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                                    <Coins className="w-3 h-3" /> +{mission.reward}
                                  </div>
                                  {completed && !claimed ? (
                                    <Button
                                      size="sm"
                                      className="text-[10px] h-6 px-2"
                                      onClick={() => handleClaimReward(mission.id, mission.reward)}
                                      disabled={claimingMission === mission.id}
                                    >
                                      {claimingMission === mission.id ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        'Reivindicar'
                                      )}
                                    </Button>
                                  ) : claimed ? (
                                    <span className="text-[9px] text-emerald-400">Resgatado</span>
                                  ) : (
                                    <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Histórico Tab */}
          {activeTab === 'historico' && (
            <div className="space-y-2">
              {transactions.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">Nenhuma transação ainda</p>
                  </CardContent>
                </Card>
              ) : (
                transactions.map((tx) => (
                  <Card key={tx.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {typeLabels[tx.type] || tx.type}
                        </p>
                        {tx.description && (
                          <p className="text-xs text-muted-foreground">{tx.description}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(tx.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <span className={`font-display font-bold text-lg ${tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount}
                      </span>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </main>
      </div>

      {/* PIX Payment Modal */}
      <Dialog open={pixModalOpen} onOpenChange={(open) => { if (!open && !pixLoading) { setPixModalOpen(false); setPixData(null); } }}>
        <DialogContent className="sm:max-w-md border-primary/30 bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <CreditCard className="w-5 h-5 text-primary" />
              Comprar Créditos
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">Cada crédito equivale a 1 acesso criado para seu cliente</p>

          {cpfStep && !pixLoading && !pixData && !paymentConfirmed && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border border-primary/30 bg-primary/5">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">{selectedPackage?.amount} Crédito{(selectedPackage?.amount || 0) > 1 ? 's' : ''}</span>
                </div>
                <span className="text-lg font-bold text-primary">
                  R$ {(selectedPackage?.price || 0).toFixed(2).replace('.', ',')}
                </span>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">CPF ou CNPJ</label>
                <input
                  type="text"
                  placeholder="000.000.000-00"
                  value={cpfInput}
                  onChange={(e) => setCpfInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  maxLength={18}
                />
                <p className="text-xs text-muted-foreground mt-1">Necessário para gerar o pagamento PIX</p>
              </div>
              <Button className="w-full" onClick={handleConfirmCpf} disabled={!cpfInput.replace(/\D/g, '')}>
                Gerar PIX
              </Button>
            </div>
          )}

          {pixLoading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Gerando pagamento PIX...</p>
            </div>
          )}

          {paymentConfirmed && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <p className="text-lg font-bold text-foreground">Pagamento Confirmado!</p>
              <p className="text-sm text-muted-foreground">+{pixData?.creditAmount} créditos adicionados ao seu saldo</p>
              <Button onClick={() => { setPixModalOpen(false); setPixData(null); }} className="mt-2">
                Fechar
              </Button>
            </div>
          )}

          {pixData && !pixLoading && !paymentConfirmed && (
            <div className="space-y-4">
              {/* Package info */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-primary/30 bg-primary/5">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">{pixData.creditAmount} Crédito{pixData.creditAmount > 1 ? 's' : ''}</span>
                </div>
                <span className="text-lg font-bold text-primary">
                  R$ {pixData.value.toFixed(2).replace('.', ',')}
                </span>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center gap-2">
                <div className="bg-white p-3 rounded-lg">
                  <img
                    src={`data:image/png;base64,${pixData.qrCodeImage}`}
                    alt="QR Code PIX"
                    className="w-48 h-48"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Escaneie o QR Code ou copie o código abaixo</p>
              </div>

              {/* PIX Code */}
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-[10px] text-muted-foreground font-mono break-all leading-relaxed max-h-16 overflow-y-auto">
                  {pixData.pixCode}
                </p>
              </div>

              {/* Copy button */}
              <Button variant="outline" className="w-full gap-2" onClick={handleCopyPixCode}>
                <Copy className="w-4 h-4" />
                Copiar código PIX
              </Button>

              {/* Checking payment */}
              <Button
                className="w-full gap-2"
                variant="default"
                onClick={handleCheckPayment}
                disabled={checkingPayment}
              >
                {checkingPayment ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Aguardando pagamento
                  </>
                )}
              </Button>

              {/* Already paid */}
              <Button
                variant="ghost"
                className="w-full gap-2 text-muted-foreground"
                onClick={handleCheckPayment}
                disabled={checkingPayment}
              >
                <CheckCircle className="w-4 h-4" />
                Já fiz o Pagamento
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

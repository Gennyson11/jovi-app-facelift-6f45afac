import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Coins, Trophy, Star, Target, Gift, CheckCircle, Lock, ArrowRight, Zap, Clock } from 'lucide-react';
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

// Generate 100 progressive missions
const MISSIONS: MissionDef[] = [
  // Bronze (1-20) — Fácil, baixa recompensa
  { id: 'lvl_1', title: 'Primeiro Acesso', description: 'Faça login na plataforma', target: 1, reward: 1, level: 1, tier: 'bronze', icon: '🚀' },
  { id: 'lvl_2', title: 'Explorador Iniciante', description: 'Acesse 3 ferramentas diferentes', target: 3, reward: 1, level: 2, tier: 'bronze', icon: '🔍' },
  { id: 'lvl_3', title: 'Visitante', description: 'Acesse a plataforma por 2 dias seguidos', target: 2, reward: 1, level: 3, tier: 'bronze', icon: '📅' },
  { id: 'lvl_4', title: 'Curioso', description: 'Visualize 5 plataformas de streaming', target: 5, reward: 1, level: 4, tier: 'bronze', icon: '👀' },
  { id: 'lvl_5', title: 'Primeiro Passo', description: 'Complete seu perfil', target: 1, reward: 1, level: 5, tier: 'bronze', icon: '✏️' },
  { id: 'lvl_6', title: 'Navegador', description: 'Acesse 5 ferramentas diferentes', target: 5, reward: 1, level: 6, tier: 'bronze', icon: '🧭' },
  { id: 'lvl_7', title: 'Rotina', description: 'Acesse a plataforma por 3 dias seguidos', target: 3, reward: 1, level: 7, tier: 'bronze', icon: '🔄' },
  { id: 'lvl_8', title: 'Clicador', description: 'Clique em 10 plataformas', target: 10, reward: 1, level: 8, tier: 'bronze', icon: '🖱️' },
  { id: 'lvl_9', title: 'Madrugador', description: 'Acesse antes das 8h da manhã', target: 1, reward: 1, level: 9, tier: 'bronze', icon: '🌅' },
  { id: 'lvl_10', title: 'Persistente', description: 'Acesse a plataforma por 5 dias seguidos', target: 5, reward: 2, level: 10, tier: 'bronze', icon: '💪' },
  { id: 'lvl_11', title: 'Colecionador', description: 'Acesse 10 ferramentas diferentes', target: 10, reward: 1, level: 11, tier: 'bronze', icon: '📦' },
  { id: 'lvl_12', title: 'Amigo da IA', description: 'Use o Jovi.ia 3 vezes', target: 3, reward: 1, level: 12, tier: 'bronze', icon: '🤖' },
  { id: 'lvl_13', title: 'Artista Iniciante', description: 'Gere 3 imagens com IA', target: 3, reward: 1, level: 13, tier: 'bronze', icon: '🎨' },
  { id: 'lvl_14', title: 'Frequentador', description: 'Acesse 7 dias seguidos', target: 7, reward: 2, level: 14, tier: 'bronze', icon: '📆' },
  { id: 'lvl_15', title: 'Multi-Plataforma', description: 'Acesse 15 ferramentas diferentes', target: 15, reward: 2, level: 15, tier: 'bronze', icon: '🌐' },
  { id: 'lvl_16', title: 'Noturno', description: 'Acesse após as 22h', target: 3, reward: 1, level: 16, tier: 'bronze', icon: '🌙' },
  { id: 'lvl_17', title: 'Produtivo', description: 'Use 5 ferramentas no mesmo dia', target: 5, reward: 2, level: 17, tier: 'bronze', icon: '⚡' },
  { id: 'lvl_18', title: 'Streaming Fan', description: 'Acesse 10 streamings diferentes', target: 10, reward: 2, level: 18, tier: 'bronze', icon: '📺' },
  { id: 'lvl_19', title: 'Quinzena', description: 'Acesse 14 dias seguidos', target: 14, reward: 2, level: 19, tier: 'bronze', icon: '🗓️' },
  { id: 'lvl_20', title: 'Graduado Bronze', description: 'Complete todas as 19 missões anteriores', target: 19, reward: 3, level: 20, tier: 'bronze', icon: '🎓' },

  // Prata (21-40) — Moderado
  { id: 'lvl_21', title: 'Artista Digital', description: 'Gere 10 imagens com IA', target: 10, reward: 2, level: 21, tier: 'prata', icon: '🖼️' },
  { id: 'lvl_22', title: 'Assistente de IA', description: 'Use o Jovi.ia 10 vezes', target: 10, reward: 2, level: 22, tier: 'prata', icon: '💬' },
  { id: 'lvl_23', title: 'Maratonista', description: 'Acesse 21 dias seguidos', target: 21, reward: 3, level: 23, tier: 'prata', icon: '🏃' },
  { id: 'lvl_24', title: 'Mestre das Ferramentas', description: 'Acesse 20 ferramentas diferentes', target: 20, reward: 2, level: 24, tier: 'prata', icon: '🔧' },
  { id: 'lvl_25', title: 'Clicador Pro', description: 'Clique em 50 plataformas', target: 50, reward: 2, level: 25, tier: 'prata', icon: '🎯' },
  { id: 'lvl_26', title: 'Galeria', description: 'Gere 25 imagens com IA', target: 25, reward: 3, level: 26, tier: 'prata', icon: '🖌️' },
  { id: 'lvl_27', title: 'Mensal', description: 'Acesse 30 dias seguidos', target: 30, reward: 3, level: 27, tier: 'prata', icon: '📅' },
  { id: 'lvl_28', title: 'Explorador Completo', description: 'Acesse todas as categorias', target: 5, reward: 2, level: 28, tier: 'prata', icon: '🗺️' },
  { id: 'lvl_29', title: 'Conversador', description: 'Use o Jovi.ia 25 vezes', target: 25, reward: 3, level: 29, tier: 'prata', icon: '🗣️' },
  { id: 'lvl_30', title: 'Super Produtivo', description: 'Use 10 ferramentas no mesmo dia', target: 10, reward: 3, level: 30, tier: 'prata', icon: '🚀' },
  { id: 'lvl_31', title: 'Artista Avançado', description: 'Gere 50 imagens com IA', target: 50, reward: 3, level: 31, tier: 'prata', icon: '🎭' },
  { id: 'lvl_32', title: 'Clicador Master', description: 'Clique em 100 plataformas', target: 100, reward: 3, level: 32, tier: 'prata', icon: '💫' },
  { id: 'lvl_33', title: 'Veterano', description: 'Acesse 45 dias seguidos', target: 45, reward: 3, level: 33, tier: 'prata', icon: '🏅' },
  { id: 'lvl_34', title: 'Conselheiro IA', description: 'Use o Jovi.ia 50 vezes', target: 50, reward: 3, level: 34, tier: 'prata', icon: '🧠' },
  { id: 'lvl_35', title: 'Multitarefa', description: 'Use 15 ferramentas no mesmo dia', target: 15, reward: 3, level: 35, tier: 'prata', icon: '🔀' },
  { id: 'lvl_36', title: 'Bimestral', description: 'Acesse 60 dias seguidos', target: 60, reward: 4, level: 36, tier: 'prata', icon: '⏰' },
  { id: 'lvl_37', title: 'Criador', description: 'Gere 75 imagens com IA', target: 75, reward: 3, level: 37, tier: 'prata', icon: '✨' },
  { id: 'lvl_38', title: 'Influenciador', description: 'Use todas as ferramentas disponíveis', target: 30, reward: 4, level: 38, tier: 'prata', icon: '📣' },
  { id: 'lvl_39', title: 'Mente Brilhante', description: 'Use o Jovi.ia 75 vezes', target: 75, reward: 4, level: 39, tier: 'prata', icon: '💡' },
  { id: 'lvl_40', title: 'Graduado Prata', description: 'Complete todas as missões Bronze + Prata', target: 39, reward: 5, level: 40, tier: 'prata', icon: '🏆' },

  // Ouro (41-60) — Difícil
  { id: 'lvl_41', title: 'Artista Master', description: 'Gere 100 imagens com IA', target: 100, reward: 4, level: 41, tier: 'ouro', icon: '🎨' },
  { id: 'lvl_42', title: 'Trimestral', description: 'Acesse 90 dias seguidos', target: 90, reward: 5, level: 42, tier: 'ouro', icon: '📆' },
  { id: 'lvl_43', title: 'Guru da IA', description: 'Use o Jovi.ia 100 vezes', target: 100, reward: 5, level: 43, tier: 'ouro', icon: '🤖' },
  { id: 'lvl_44', title: 'Viciado', description: 'Acesse 120 dias seguidos', target: 120, reward: 5, level: 44, tier: 'ouro', icon: '🔥' },
  { id: 'lvl_45', title: 'Galeria Premium', description: 'Gere 150 imagens com IA', target: 150, reward: 5, level: 45, tier: 'ouro', icon: '🖼️' },
  { id: 'lvl_46', title: 'Semestral', description: 'Acesse 180 dias seguidos', target: 180, reward: 6, level: 46, tier: 'ouro', icon: '⏳' },
  { id: 'lvl_47', title: 'IA Expert', description: 'Use o Jovi.ia 200 vezes', target: 200, reward: 5, level: 47, tier: 'ouro', icon: '🧪' },
  { id: 'lvl_48', title: 'Artista Lendário', description: 'Gere 200 imagens com IA', target: 200, reward: 6, level: 48, tier: 'ouro', icon: '🌟' },
  { id: 'lvl_49', title: 'Clicador Lendário', description: 'Clique em 500 plataformas', target: 500, reward: 5, level: 49, tier: 'ouro', icon: '🎯' },
  { id: 'lvl_50', title: 'Meio Caminho', description: 'Acesse 200 dias seguidos', target: 200, reward: 7, level: 50, tier: 'ouro', icon: '🏔️' },
  { id: 'lvl_51', title: 'IA Mestre', description: 'Use o Jovi.ia 300 vezes', target: 300, reward: 6, level: 51, tier: 'ouro', icon: '🎓' },
  { id: 'lvl_52', title: 'Galeria Lendária', description: 'Gere 300 imagens com IA', target: 300, reward: 6, level: 52, tier: 'ouro', icon: '🏛️' },
  { id: 'lvl_53', title: 'Anual', description: 'Acesse 250 dias seguidos', target: 250, reward: 7, level: 53, tier: 'ouro', icon: '🌍' },
  { id: 'lvl_54', title: 'Mestre Multi', description: 'Use 20 ferramentas no mesmo dia', target: 20, reward: 5, level: 54, tier: 'ouro', icon: '⚡' },
  { id: 'lvl_55', title: 'Clicador Supremo', description: 'Clique em 750 plataformas', target: 750, reward: 6, level: 55, tier: 'ouro', icon: '🎯' },
  { id: 'lvl_56', title: 'IA Veterano', description: 'Use o Jovi.ia 400 vezes', target: 400, reward: 7, level: 56, tier: 'ouro', icon: '🤖' },
  { id: 'lvl_57', title: 'Artista Supremo', description: 'Gere 400 imagens com IA', target: 400, reward: 7, level: 57, tier: 'ouro', icon: '🎨' },
  { id: 'lvl_58', title: 'Eterno', description: 'Acesse 300 dias seguidos', target: 300, reward: 8, level: 58, tier: 'ouro', icon: '♾️' },
  { id: 'lvl_59', title: 'Prodígio', description: 'Use o Jovi.ia 500 vezes', target: 500, reward: 8, level: 59, tier: 'ouro', icon: '💫' },
  { id: 'lvl_60', title: 'Graduado Ouro', description: 'Complete todas as missões até Ouro', target: 59, reward: 10, level: 60, tier: 'ouro', icon: '👑' },

  // Platina (61-80) — Muito difícil
  { id: 'lvl_61', title: 'Legendário', description: 'Acesse 365 dias seguidos', target: 365, reward: 10, level: 61, tier: 'platina', icon: '🏆' },
  { id: 'lvl_62', title: 'Criador Supremo', description: 'Gere 500 imagens com IA', target: 500, reward: 8, level: 62, tier: 'platina', icon: '🌠' },
  { id: 'lvl_63', title: 'IA Lendário', description: 'Use o Jovi.ia 750 vezes', target: 750, reward: 9, level: 63, tier: 'platina', icon: '🧠' },
  { id: 'lvl_64', title: 'Clicador Infinito', description: 'Clique em 1000 plataformas', target: 1000, reward: 8, level: 64, tier: 'platina', icon: '♾️' },
  { id: 'lvl_65', title: 'Museu Digital', description: 'Gere 750 imagens com IA', target: 750, reward: 9, level: 65, tier: 'platina', icon: '🏛️' },
  { id: 'lvl_66', title: 'IA Supremo', description: 'Use o Jovi.ia 1000 vezes', target: 1000, reward: 10, level: 66, tier: 'platina', icon: '🤖' },
  { id: 'lvl_67', title: 'Imortal', description: 'Acesse 500 dias seguidos', target: 500, reward: 12, level: 67, tier: 'platina', icon: '🔥' },
  { id: 'lvl_68', title: 'Artista Imortal', description: 'Gere 1000 imagens com IA', target: 1000, reward: 10, level: 68, tier: 'platina', icon: '🎨' },
  { id: 'lvl_69', title: 'Consultor IA', description: 'Use o Jovi.ia 1500 vezes', target: 1500, reward: 10, level: 69, tier: 'platina', icon: '💬' },
  { id: 'lvl_70', title: 'Clicador Cósmico', description: 'Clique em 2000 plataformas', target: 2000, reward: 10, level: 70, tier: 'platina', icon: '🌌' },
  { id: 'lvl_71', title: 'Bienal', description: 'Acesse 600 dias seguidos', target: 600, reward: 12, level: 71, tier: 'platina', icon: '📆' },
  { id: 'lvl_72', title: 'Galeria Cósmica', description: 'Gere 1500 imagens com IA', target: 1500, reward: 12, level: 72, tier: 'platina', icon: '✨' },
  { id: 'lvl_73', title: 'IA Cósmico', description: 'Use o Jovi.ia 2000 vezes', target: 2000, reward: 12, level: 73, tier: 'platina', icon: '🚀' },
  { id: 'lvl_74', title: 'Mega Produtivo', description: 'Use 25 ferramentas no mesmo dia', target: 25, reward: 8, level: 74, tier: 'platina', icon: '⚡' },
  { id: 'lvl_75', title: 'Tricentenário', description: 'Acesse 730 dias seguidos', target: 730, reward: 15, level: 75, tier: 'platina', icon: '🌍' },
  { id: 'lvl_76', title: 'Artista Cósmico', description: 'Gere 2000 imagens com IA', target: 2000, reward: 12, level: 76, tier: 'platina', icon: '🎭' },
  { id: 'lvl_77', title: 'IA Divino', description: 'Use o Jovi.ia 3000 vezes', target: 3000, reward: 15, level: 77, tier: 'platina', icon: '👁️' },
  { id: 'lvl_78', title: 'Clicador Divino', description: 'Clique em 5000 plataformas', target: 5000, reward: 12, level: 78, tier: 'platina', icon: '✦' },
  { id: 'lvl_79', title: 'Artista Divino', description: 'Gere 3000 imagens com IA', target: 3000, reward: 15, level: 79, tier: 'platina', icon: '🌟' },
  { id: 'lvl_80', title: 'Graduado Platina', description: 'Complete todas as missões até Platina', target: 79, reward: 20, level: 80, tier: 'platina', icon: '💎' },

  // Diamante (81-100) — Extremamente difícil
  { id: 'lvl_81', title: 'Transcendente', description: 'Acesse 1000 dias seguidos', target: 1000, reward: 20, level: 81, tier: 'diamante', icon: '🌌' },
  { id: 'lvl_82', title: 'Criador Divino', description: 'Gere 5000 imagens com IA', target: 5000, reward: 18, level: 82, tier: 'diamante', icon: '🎨' },
  { id: 'lvl_83', title: 'IA Transcendente', description: 'Use o Jovi.ia 5000 vezes', target: 5000, reward: 18, level: 83, tier: 'diamante', icon: '🤖' },
  { id: 'lvl_84', title: 'Clicador Transcendente', description: 'Clique em 10000 plataformas', target: 10000, reward: 15, level: 84, tier: 'diamante', icon: '🎯' },
  { id: 'lvl_85', title: 'Entidade', description: 'Acesse 1500 dias seguidos', target: 1500, reward: 25, level: 85, tier: 'diamante', icon: '🔥' },
  { id: 'lvl_86', title: 'Artista Absoluto', description: 'Gere 7500 imagens com IA', target: 7500, reward: 20, level: 86, tier: 'diamante', icon: '🖼️' },
  { id: 'lvl_87', title: 'IA Absoluto', description: 'Use o Jovi.ia 7500 vezes', target: 7500, reward: 20, level: 87, tier: 'diamante', icon: '💬' },
  { id: 'lvl_88', title: 'Mega Clicador', description: 'Clique em 20000 plataformas', target: 20000, reward: 18, level: 88, tier: 'diamante', icon: '💫' },
  { id: 'lvl_89', title: 'Milenar', description: 'Acesse 2000 dias seguidos', target: 2000, reward: 30, level: 89, tier: 'diamante', icon: '⏳' },
  { id: 'lvl_90', title: 'Criador Absoluto', description: 'Gere 10000 imagens com IA', target: 10000, reward: 25, level: 90, tier: 'diamante', icon: '✨' },
  { id: 'lvl_91', title: 'IA Onisciente', description: 'Use o Jovi.ia 10000 vezes', target: 10000, reward: 25, level: 91, tier: 'diamante', icon: '🧠' },
  { id: 'lvl_92', title: 'Ultra Clicador', description: 'Clique em 50000 plataformas', target: 50000, reward: 20, level: 92, tier: 'diamante', icon: '🎯' },
  { id: 'lvl_93', title: 'Ancestral', description: 'Acesse 2500 dias seguidos', target: 2500, reward: 30, level: 93, tier: 'diamante', icon: '🏛️' },
  { id: 'lvl_94', title: 'Artista Celestial', description: 'Gere 15000 imagens com IA', target: 15000, reward: 25, level: 94, tier: 'diamante', icon: '🌠' },
  { id: 'lvl_95', title: 'IA Celestial', description: 'Use o Jovi.ia 15000 vezes', target: 15000, reward: 30, level: 95, tier: 'diamante', icon: '🤖' },
  { id: 'lvl_96', title: 'Infinito', description: 'Acesse 3000 dias seguidos', target: 3000, reward: 35, level: 96, tier: 'diamante', icon: '♾️' },
  { id: 'lvl_97', title: 'Criador Celestial', description: 'Gere 20000 imagens com IA', target: 20000, reward: 30, level: 97, tier: 'diamante', icon: '🌟' },
  { id: 'lvl_98', title: 'IA Omnipotente', description: 'Use o Jovi.ia 20000 vezes', target: 20000, reward: 35, level: 98, tier: 'diamante', icon: '👑' },
  { id: 'lvl_99', title: 'Ser Supremo', description: 'Acesse 3650 dias seguidos (10 anos)', target: 3650, reward: 50, level: 99, tier: 'diamante', icon: '🌌' },
  { id: 'lvl_100', title: '𝕃𝔼𝔾𝔼ℕ𝔻', description: 'Complete TODAS as 99 missões anteriores', target: 99, reward: 100, level: 100, tier: 'diamante', icon: '👑' },
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

    // Auto-initialize first_login mission
    if (!missionsRes.data?.find((m: any) => m.mission_id === 'first_login')) {
      await supabase.from('user_missions').insert({
        user_id: user!.id,
        mission_id: 'first_login',
        progress: 1,
        completed: true,
        completed_at: new Date().toISOString(),
      });
      setMissionProgress(prev => ({
        ...prev,
        first_login: { mission_id: 'first_login', progress: 1, completed: true, claimed: false }
      }));
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

  const handleBuyCredits = (packageId: string) => {
    toast({ title: '💳 Em breve!', description: 'A integração com Asaas está sendo configurada. Aguarde!' });
  };

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
            <div className="space-y-4">
              {['Iniciante', 'Intermediário', 'Expert'].map((level) => {
                const levelMissions = MISSIONS.filter(m => m.level === level);
                if (levelMissions.length === 0) return null;
                const colors = LEVEL_COLORS[level];
                return (
                  <div key={level}>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className={`${colors.bg} ${colors.text} ${colors.border} border`}>
                        <Star className="w-3 h-3 mr-1" /> {level}
                      </Badge>
                    </div>
                    <div className="grid gap-3">
                      {levelMissions.map((mission) => {
                        const mp = missionProgress[mission.id];
                        const progress = mp?.progress || 0;
                        const completed = mp?.completed || false;
                        const claimed = mp?.claimed || false;
                        const progressPercent = Math.min((progress / mission.target) * 100, 100);

                        return (
                          <Card key={mission.id} className={`border transition-all ${claimed ? 'opacity-60' : ''}`}>
                            <CardContent className="p-4">
                              <div className="flex items-center gap-4">
                                <div className="text-3xl flex-shrink-0">{mission.icon}</div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold text-foreground text-sm">{mission.title}</h4>
                                    {claimed && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                                  </div>
                                  <p className="text-xs text-muted-foreground mb-2">{mission.description}</p>
                                  <div className="flex items-center gap-3">
                                    <Progress value={progressPercent} className="flex-1 h-2" />
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                      {progress}/{mission.target}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                                  <div className="flex items-center gap-1 text-amber-400 text-sm font-bold">
                                    <Gift className="w-3.5 h-3.5" /> +{mission.reward}
                                  </div>
                                  {completed && !claimed ? (
                                    <Button
                                      size="sm"
                                      className="text-xs h-7 px-3"
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
                                    <span className="text-[10px] text-emerald-400">Resgatado</span>
                                  ) : (
                                    <Lock className="w-4 h-4 text-muted-foreground" />
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
    </div>
  );
}

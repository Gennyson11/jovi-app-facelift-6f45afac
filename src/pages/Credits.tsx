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

// Mission definitions (hardcoded for v1)
const MISSIONS = [
  {
    id: 'first_login',
    title: 'Primeiro Acesso',
    description: 'Faça login na plataforma pela primeira vez',
    target: 1,
    reward: 2,
    level: 'Iniciante',
    icon: '🚀',
  },
  {
    id: 'view_5_tools',
    title: 'Explorador',
    description: 'Acesse 5 ferramentas diferentes',
    target: 5,
    reward: 3,
    level: 'Iniciante',
    icon: '🔍',
  },
  {
    id: 'use_jovi_ai',
    title: 'Amigo da IA',
    description: 'Use o Jovi.ia 3 vezes',
    target: 3,
    reward: 5,
    level: 'Intermediário',
    icon: '🤖',
  },
  {
    id: 'generate_10_images',
    title: 'Artista Digital',
    description: 'Gere 10 imagens com IA',
    target: 10,
    reward: 5,
    level: 'Intermediário',
    icon: '🎨',
  },
  {
    id: 'daily_streak_7',
    title: 'Dedicado',
    description: 'Acesse a plataforma por 7 dias seguidos',
    target: 7,
    reward: 10,
    level: 'Expert',
    icon: '🔥',
  },
];

const LEVEL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Iniciante': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  'Intermediário': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  'Expert': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
};

const CREDIT_PACKAGES = [
  { id: 'pack_10', amount: 10, price: 9.90, popular: false },
  { id: 'pack_30', amount: 30, price: 24.90, popular: true },
  { id: 'pack_50', amount: 50, price: 39.90, popular: false },
  { id: 'pack_100', amount: 100, price: 69.90, popular: false },
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

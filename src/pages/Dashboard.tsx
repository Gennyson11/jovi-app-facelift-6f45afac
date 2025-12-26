import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { usePresence } from '@/hooks/usePresence';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Eye, EyeOff, Copy, Loader2, CheckCircle, AlertTriangle, ExternalLink, KeyRound, Link, Lock, Clock, Megaphone, X, MousePointerClick, Zap, QrCode } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import DashboardSidebar from '@/components/DashboardSidebar';
import JoviAIChat from '@/components/JoviAIChat';
import { Veo3Chat } from '@/components/Veo3Chat';
type StreamingStatus = 'online' | 'maintenance';
type AccessType = 'credentials' | 'link_only';
type PlatformCategory = 'ai_tools' | 'streamings' | 'software' | 'bonus_courses' | 'loja';
const CATEGORY_CONFIG: Record<PlatformCategory, {
  label: string;
  icon: string;
  color: string;
}> = {
  'ai_tools': {
    label: 'Ferramentas',
    icon: '🤖',
    color: 'from-purple-500 to-pink-500'
  },
  'streamings': {
    label: 'Streamings',
    icon: '📺',
    color: 'from-red-500 to-orange-500'
  },
  'software': {
    label: 'Softwares',
    icon: '💻',
    color: 'from-blue-500 to-cyan-500'
  },
  'bonus_courses': {
    label: 'Bônus',
    icon: '🎓',
    color: 'from-green-500 to-emerald-500'
  },
  'loja': {
    label: 'Loja',
    icon: '🛒',
    color: 'from-amber-500 to-yellow-500'
  }
};
const CATEGORY_ORDER: PlatformCategory[] = ['ai_tools', 'streamings', 'software', 'bonus_courses', 'loja'];
interface Platform {
  id: string;
  name: string;
  icon_url: string | null;
  cover_image_url: string | null;
  status: StreamingStatus;
  access_type: AccessType;
  category: PlatformCategory;
  login: string | null;
  password: string | null;
  website_url: string | null;
}
interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  name: string | null;
  has_access: boolean;
  access_expires_at: string | null;
  avatar_url: string | null;
}
interface News {
  id: string;
  title: string;
  content: string;
  is_active: boolean;
  created_at: string;
}
interface Credential {
  login: string;
  password: string;
}
interface PlatformClick {
  platform_id: string;
  click_count: number;
}
interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  original_price: number | null;
  image_url: string | null;
  stock: number;
  is_active: boolean;
}
const platformIcons: Record<string, string> = {
  'Netflix': '🎬',
  'Amazon Prime Video': '📦',
  'Disney+': '🏰',
  'HBO Max': '🎭',
  'Paramount+': '⭐',
  'Crunchyroll': '🍙'
};
export default function Dashboard() {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [showPassword, setShowPassword] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userPlatformAccess, setUserPlatformAccess] = useState<string[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [dismissedNews, setDismissedNews] = useState<string[]>([]);
  const [platformCredentials, setPlatformCredentials] = useState<Credential[]>([]);
  const [platformClicks, setPlatformClicks] = useState<Record<string, number>>({});
  const [activeCategory, setActiveCategory] = useState<string | null>('ai_tools');
  const [isSocio, setIsSocio] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [showWhatsAppPopup, setShowWhatsAppPopup] = useState(false);
  const {
    user,
    signOut,
    loading: authLoading,
    isAdmin
  } = useAuth();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();

  // Track user presence for real-time monitoring
  usePresence(user?.id, user?.email, user?.email?.split('@')[0] || null);

  // Ref to track if data has been fetched for the current user
  const hasFetchedRef = useRef(false);
  const currentUserIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  // WhatsApp popup timer - shows every 1 minute
  useEffect(() => {
    if (!user) return;
    
    // Show popup after 5 seconds initially
    const initialTimer = setTimeout(() => {
      setShowWhatsAppPopup(true);
    }, 5000);
    
    // Then show every 1 minute
    const interval = setInterval(() => {
      setShowWhatsAppPopup(true);
    }, 60000);
    
    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [user]);
  useEffect(() => {
    // Only fetch data if user exists and we haven't fetched for this user yet
    if (user?.id && user.id !== currentUserIdRef.current) {
      currentUserIdRef.current = user.id;
      hasFetchedRef.current = false;
    }
    if (user?.id && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchData();
    }
  }, [user?.id]);
  const fetchData = async () => {
    setLoading(true);

    // Fetch platforms, news, click counts, and products
    const [platformsRes, newsRes, clicksRes, productsRes] = await Promise.all([supabase.from('streaming_platforms').select('*').order('name'), supabase.from('news').select('*').eq('is_active', true).order('created_at', {
      ascending: false
    }), supabase.from('platform_clicks').select('platform_id, click_count'), supabase.from('products').select('*').eq('is_active', true).order('name')]);
    if (platformsRes.data) setPlatforms(platformsRes.data as Platform[]);
    if (newsRes.data) setNews(newsRes.data as News[]);
    if (productsRes.data) setProducts(productsRes.data as Product[]);
    if (clicksRes.data) {
      const clicksMap: Record<string, number> = {};
      clicksRes.data.forEach((c: PlatformClick) => {
        clicksMap[c.platform_id] = c.click_count;
      });
      setPlatformClicks(clicksMap);
    }

    // Fetch user profile to check access
    const {
      data: profileData
    } = await supabase.from('profiles').select('*').eq('user_id', user?.id).maybeSingle();
    if (profileData) {
      setUserProfile(profileData as UserProfile);

      // Fetch user's platform access
      const {
        data: accessData
      } = await supabase.from('user_platform_access').select('platform_id').eq('user_id', profileData.id);
      if (accessData) {
        setUserPlatformAccess(accessData.map(a => a.platform_id));
      }
      
      // Check if user has socio role
      const { data: socioRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id)
        .eq('role', 'socio')
        .maybeSingle();
      setIsSocio(!!socioRole);
    }
    setLoading(false);
  };
  const dismissNewsItem = (newsId: string) => {
    setDismissedNews(prev => [...prev, newsId]);
  };
  const visibleNews = news.filter(n => !dismissedNews.includes(n.id));
  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: '✅ Copiado!',
      description: `${label} copiado para a área de transferência`
    });
  };

  // Check if user's access has expired
  const isAccessExpired = () => {
    if (!userProfile) return true;
    if (!userProfile.has_access) return true;
    if (userProfile.access_expires_at === null) return false; // Lifetime access

    const expiresAt = new Date(userProfile.access_expires_at);
    return expiresAt < new Date();
  };

  // Check if user has access to a specific platform
  const hasPlatformSpecificAccess = (platformId: string) => {
    if (isAdmin) return true;
    if (isAccessExpired()) return false;
    return userPlatformAccess.includes(platformId);
  };
  // Increment click count for a platform
  const incrementClickCount = async (platformId: string) => {
    // First check if record exists
    const {
      data: existing
    } = await supabase.from('platform_clicks').select('click_count').eq('platform_id', platformId).maybeSingle();
    if (existing) {
      // Update existing record
      await supabase.from('platform_clicks').update({
        click_count: existing.click_count + 1
      }).eq('platform_id', platformId);
      setPlatformClicks(prev => ({
        ...prev,
        [platformId]: (prev[platformId] || 0) + 1
      }));
    } else {
      // Insert new record
      await supabase.from('platform_clicks').insert({
        platform_id: platformId,
        click_count: 1
      });
      setPlatformClicks(prev => ({
        ...prev,
        [platformId]: 1
      }));
    }
  };
  const handlePlatformClick = async (platform: Platform) => {
    // Check if user has access to this specific platform
    if (!hasPlatformSpecificAccess(platform.id)) {
      toast({
        title: '🔒 Acesso Bloqueado',
        description: 'Você não tem permissão para acessar esta streaming.',
        variant: 'destructive'
      });
      return;
    }
    const isMaintenance = platform.status === 'maintenance';
    if (isMaintenance) return;

    // Increment click count
    incrementClickCount(platform.id);
    if (platform.access_type === 'link_only' && platform.website_url) {
      window.open(platform.website_url, '_blank');
    } else if (platform.access_type === 'credentials') {
      // Load credentials from streaming_credentials table
      const {
        data: credentials
      } = await supabase.from('streaming_credentials').select('login, password').eq('platform_id', platform.id);
      if (credentials && credentials.length > 0) {
        setPlatformCredentials(credentials);
      } else if (platform.login && platform.password) {
        // Fallback to old single credential
        setPlatformCredentials([{
          login: platform.login,
          password: platform.password
        }]);
      } else {
        setPlatformCredentials([]);
      }
      setShowPassword({});
      setSelectedPlatform(platform);
    }
  };
  if (authLoading || loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>;
  }
  const hasAccess = isAdmin || userProfile?.has_access && !isAccessExpired();
  const accessExpired = userProfile?.has_access && isAccessExpired();

  // Get remaining days text
  const getRemainingDaysText = () => {
    if (!userProfile || !userProfile.has_access) return null;
    if (userProfile.access_expires_at === null) return 'Acesso Vitalício';
    const expiresAt = new Date(userProfile.access_expires_at);
    const now = new Date();
    const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysRemaining <= 0) return 'Acesso Expirado';
    if (daysRemaining === 1) return '1 dia restante';
    return `${daysRemaining} dias restantes`;
  };

  // Filter platforms by active category
  const filteredPlatforms = activeCategory ? platforms.filter(p => p.category === activeCategory) : platforms;
  const filteredCategoryOrder = activeCategory ? CATEGORY_ORDER.filter(cat => cat === activeCategory) : CATEGORY_ORDER;
  return <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex w-full">
      {/* Sidebar */}
      <DashboardSidebar userProfile={userProfile} onLogout={handleLogout} activeCategory={activeCategory} onCategorySelect={setActiveCategory} isSocio={isSocio} />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
          <div className="px-4 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 ml-12 lg:ml-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-magenta to-primary flex items-center justify-center shadow-lg shadow-magenta/30">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-display font-bold bg-gradient-to-r from-cyan to-primary bg-clip-text text-transparent">
                  JoviTools
                </h1>
                <p className="text-xs text-muted-foreground">
                  {userProfile ? `Olá, ${userProfile.name || userProfile.email}` : 'Painel de Controle'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {hasAccess && getRemainingDaysText() && <span className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${userProfile?.access_expires_at === null ? 'bg-purple-500/10 text-purple-400' : 'bg-primary/10 text-primary'}`}>
                  {getRemainingDaysText()}
                </span>}
            </div>
          </div>
        </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Access Expired Banner */}
        {accessExpired && <div className="mb-6 p-6 rounded-lg bg-red-500/10 border border-red-500/30 text-center">
            <Lock className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-red-500 mb-2">
              Acesso Expirado
            </h3>
            <p className="text-red-500/80 mb-4">
              Seu período de acesso terminou. Renove para continuar acessando as plataformas.
            </p>
            <Button onClick={() => window.open('https://bit.ly/whatsapp-suportejt', '_blank')} className="bg-green-500 hover:bg-green-600 text-white">
              Renovar Acesso via WhatsApp
            </Button>
          </div>}

        {/* Access Blocked Banner */}
        {!userProfile?.has_access && <div className="mb-6 p-6 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-center">
            <Lock className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-yellow-500 mb-2">
              Acesso Pendente
            </h3>
            <p className="text-yellow-500/80">
              Seu cadastro foi recebido! Aguarde a liberação do acesso pelo administrador.
            </p>
          </div>}

        {/* Account Validity Card */}
        {hasAccess && userProfile && <div className="mb-6 p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Validade da Sua Conta</p>
                  <p className="text-xl font-bold text-green-500">
                    {(() => {
                    if (userProfile.access_expires_at === null) {
                      return 'Acesso Vitalício';
                    }
                    const expiresAt = new Date(userProfile.access_expires_at);
                    const now = new Date();
                    const diffMs = expiresAt.getTime() - now.getTime();
                    if (diffMs <= 0) return 'Expirado';
                    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                    const hours = Math.floor(diffMs % (1000 * 60 * 60 * 24) / (1000 * 60 * 60));
                    if (days > 0) {
                      return `${days}d ${hours}h restantes`;
                    }
                    return `${hours}h restantes`;
                  })()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {userProfile.access_expires_at === null ? 'Sem data de expiração' : `Expira em ${new Date(userProfile.access_expires_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })} às ${new Date(userProfile.access_expires_at).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}`}
                  </p>
                </div>
              </div>
              <div className={`px-3 py-1.5 rounded-full border text-sm font-medium ${userProfile.access_expires_at === null ? 'border-purple-500/30 text-purple-400 bg-purple-500/10' : 'border-green-500/30 text-green-500 bg-green-500/10'}`}>
                {userProfile.access_expires_at === null ? '∞ Vitalício' : '✓ Ativa'}
              </div>
            </div>
          </div>}

        {/* Warning Banner */}
        {hasAccess && <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-sm">
            <p className="text-destructive font-medium">
              ⚠️ ATENÇÃO: É proibido revender ou compartilhar este acesso.
            </p>
            <p className="text-destructive/80 mt-1">
              🔍 Todos os acessos são monitorados e o IP é rastreável.
            </p>
            <p className="text-destructive/80 mt-1">
              ❌ Qualquer compartilhamento resultará na perda imediata do acesso.
            </p>
          </div>}

        {/* News/Announcements Section */}
        {visibleNews.length > 0 && <div className="mb-6 space-y-3">
            {visibleNews.map(newsItem => <div key={newsItem.id} className="relative rounded-xl overflow-hidden border-2 border-orange-500/50 bg-gradient-to-r from-orange-500/20 via-amber-500/15 to-orange-500/20 shadow-lg shadow-orange-500/20">
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/40 animate-pulse">
                      <Megaphone className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/30 border border-orange-400 mb-2">
                        <span className="text-orange-300 text-xs">🔔</span>
                        <span className="text-orange-300 font-bold text-xs uppercase tracking-wide">AVISO IMPORTANTE</span>
                      </div>
                      <h3 className="font-bold text-orange-400 text-lg mb-1">
                        {newsItem.title}
                      </h3>
                      <p className="text-orange-300 text-sm whitespace-pre-wrap font-medium">
                        {newsItem.content}
                      </p>
                      <p className="text-xs text-orange-300/60 mt-2 flex items-center gap-1">
                        📅 {new Date(newsItem.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>)}
          </div>}

        {/* Sorteios/Coupon Section */}
        {activeCategory === 'sorteios' && (
          <div className="space-y-8">
            {/* Header */}
            <div>
              <h2 className="text-2xl font-bold text-foreground">Resgatar Cupom</h2>
              <p className="text-muted-foreground mt-1">Digite seu código promocional para ativar benefícios exclusivos.</p>
            </div>

            {/* Coupon Redemption Card */}
            <Card className="border-border max-w-2xl mx-auto">
              <CardContent className="pt-8 pb-8">
                <div className="flex flex-col items-center text-center space-y-6">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <QrCode className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">Digite seu código</h3>
                    <p className="text-muted-foreground text-sm mt-1">Insira o código recebido para ativar</p>
                  </div>
                  <div className="flex w-full max-w-md gap-3">
                    <Input
                      placeholder="DIGITE-SEU-CÓDIGO"
                      className="flex-1 bg-background/50 border-border text-center uppercase tracking-widest"
                    />
                    <Button className="px-6">
                      Resgatar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* How to use section */}
            <div className="max-w-3xl mx-auto">
              <h3 className="text-xl font-semibold text-foreground mb-4">Como usar seu cupom</h3>
              <Card className="border-border">
                <CardContent className="pt-6 pb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Step 1 */}
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-muted-foreground">1</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">Obtenha seu código</h4>
                        <p className="text-sm text-muted-foreground">Receba através de promoções ou compras</p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-muted-foreground">2</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">Digite o código</h4>
                        <p className="text-sm text-muted-foreground">Insira exatamente como recebeu</p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-muted-foreground">3</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">Ative os benefícios</h4>
                        <p className="text-sm text-muted-foreground">Escolha seus itens ou ative automaticamente</p>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-muted-foreground">4</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">Aproveite!</h4>
                        <p className="text-sm text-muted-foreground">Acesse através do menu</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Jovi.ia Section */}
        {activeCategory === 'jovi_ia' && <JoviAIChat />}

        {/* Veo3 Section */}
        {activeCategory === 'veo3' && <Veo3Chat />}

        {/* Loja Section */}
        {activeCategory === 'loja' && (
          <div className="mb-10">
            {/* Category Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center shadow-lg">
                <span className="text-xl">🛒</span>
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-foreground">
                  Loja
                </h2>
                <p className="text-sm text-muted-foreground">
                  {products.length} {products.length === 1 ? 'produto' : 'produtos'}
                </p>
              </div>
            </div>

            {/* Products Grid */}
            {products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(product => {
                  return (
                    <div key={product.id} className="group">
                      <div className="bg-card border border-border rounded-xl overflow-hidden transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10">
                        {/* Product Image */}
                        <div className="relative aspect-video bg-gradient-to-br from-secondary to-background">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                              <span className="text-5xl">📦</span>
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="p-4 space-y-3 bg-card">
                          {/* Product Name */}
                          <h3 className="font-display font-bold text-foreground uppercase tracking-wide line-clamp-2">
                            {product.name}
                          </h3>
                          
                          {/* Rating & Badge */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1">
                              <span className="text-foreground text-sm font-semibold">4.9</span>
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <span key={i} className="text-yellow-400 text-xs">★</span>
                                ))}
                              </div>
                            </div>
                            <span className="text-green-500 text-xs font-medium">Entrega Automática</span>
                          </div>
                          
                          {/* Price Section */}
                          <div className="space-y-1">
                            <div className="text-green-500 text-2xl font-bold">
                              R$ {product.price.toFixed(2).replace('.', ',')}
                            </div>
                            <p className="text-muted-foreground text-xs">A partir de</p>
                          </div>
                          
                          {/* Buy Button */}
                          <div className="flex gap-2">
                            <button 
                              className="flex-1 py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                              disabled={product.stock === 0}
                              onClick={() => {
                                window.open('https://bit.ly/whatsapp-suportejt', '_blank');
                              }}
                            >
                              {product.stock === 0 ? 'Indisponível' : 'COMPRAR'}
                            </button>
                            <button 
                              className="py-3 px-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                              onClick={() => {
                                window.open('https://bit.ly/whatsapp-suportejt', '_blank');
                              }}
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                            </button>
                          </div>

                          {/* Ver mais detalhes */}
                          <button 
                            className="w-full text-center text-muted-foreground text-sm hover:text-foreground transition-colors flex items-center justify-center gap-1"
                            onClick={() => {
                              window.open('https://bit.ly/whatsapp-suportejt', '_blank');
                            }}
                          >
                            Ver mais detalhes
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <span className="text-4xl mb-4 block">🛒</span>
                <p className="text-muted-foreground">Nenhum produto disponível no momento</p>
              </div>
            )}
          </div>
        )}

        {/* Categories */}
        {activeCategory !== 'sorteios' && activeCategory !== 'jovi_ia' && activeCategory !== 'veo3' && activeCategory !== 'loja' && filteredCategoryOrder.map(categoryKey => {
          const categoryPlatforms = filteredPlatforms.filter(p => p.category === categoryKey);
          if (categoryPlatforms.length === 0) return null;
          const config = CATEGORY_CONFIG[categoryKey];
          return <div key={categoryKey} className="mb-10">
              {/* Category Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center shadow-lg`}>
                  <span className="text-xl">{config.icon}</span>
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold text-foreground">
                    {config.label}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {categoryPlatforms.length} {categoryPlatforms.length === 1 ? 'plataforma' : 'plataformas'}
                  </p>
                </div>
              </div>

              {/* Platforms Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryPlatforms.map(platform => {
                const hasPlatformAccess = platform.access_type === 'link_only' ? !!platform.website_url : !!(platform.login && platform.password);
                const isMaintenance = platform.status === 'maintenance';
                const isBlocked = !hasPlatformSpecificAccess(platform.id);
                return <div key={platform.id} className={`group cursor-pointer transition-all duration-300 ${!hasPlatformAccess || isMaintenance || isBlocked ? 'opacity-60' : ''}`} onClick={() => {
                  if (isBlocked) {
                    window.location.href = '/#pricing';
                  } else {
                    handlePlatformClick(platform);
                  }
                }}>
                      {/* Card Container */}
                      <div className={`bg-card border border-border rounded-xl overflow-hidden transition-all duration-300 ${isBlocked ? 'grayscale hover:grayscale-0 hover:border-green-500/50' : 'hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10'}`}>
                        {/* Cover Image Area */}
                        <div className="relative aspect-video bg-gradient-to-br from-secondary to-background">
                          {platform.cover_image_url ? <img src={platform.cover_image_url} alt={platform.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center">
                              <span className="text-6xl">{platformIcons[platform.name] || config.icon}</span>
                            </div>}

                          {/* Blocked Overlay */}
                          {isBlocked && <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-3 group-hover:bg-green-900/80 transition-colors">
                              <Lock className="w-8 h-8 text-white/80 group-hover:hidden" />
                              <ExternalLink className="w-8 h-8 text-green-400 hidden group-hover:block animate-pulse" />
                              <div className="bg-green-500 px-4 py-2 rounded-lg shadow-lg shadow-green-500/30">
                                <p className="text-white text-sm font-bold text-center">
                                  🔓 Clique aqui para adquirir seu acesso
                                </p>
                              </div>
                            </div>}

                          {/* Access Type Badge */}
                          {!isBlocked && <div className={`absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold backdrop-blur-sm ${platform.access_type === 'credentials' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'}`}>
                              {platform.access_type === 'credentials' ? <KeyRound className="w-3 h-3" /> : <Link className="w-3 h-3" />}
                            </div>}

                          {/* Rating Badge */}
                          <div className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold bg-black/70 text-white backdrop-blur-sm">
                            <span className="text-yellow-400">★</span>
                            <span>4.9</span>
                          </div>
                        </div>

                        {/* Status Bar - Below Image */}
                        <div className={`w-full py-2 px-4 flex items-center justify-center gap-2 text-sm font-bold ${platform.status === 'online' ? 'bg-emerald-500 text-white' : 'bg-yellow-500 text-black'}`}>
                          {platform.status === 'online' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                          {platform.status === 'online' ? 'ONLINE' : 'MANUTENÇÃO'}
                        </div>

                        {/* Footer */}
                        <div className="p-4 flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-display font-bold text-foreground uppercase tracking-wide">
                              {platform.name}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {isBlocked ? 'Acesso bloqueado' : isMaintenance ? 'Em manutenção' : hasPlatformAccess ? platform.access_type === 'link_only' ? 'Clique para acessar' : 'Clique para ver credencial' : 'Sem acesso configurado'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Click Counter */}
                            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary/50 border border-border">
                              <MousePointerClick className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="text-xs font-semibold text-foreground">
                                {platformClicks[platform.id] || 0}
                              </span>
                            </div>
                            {!isBlocked && hasPlatformAccess && !isMaintenance && <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                {platform.access_type === 'link_only' ? <ExternalLink className="w-5 h-5 text-primary" /> : <Eye className="w-5 h-5 text-primary" />}
                              </div>}
                          </div>
                        </div>
                      </div>
                    </div>;
              })}
              </div>
            </div>;
        })}
      </main>
      </div>

      {/* Credential Dialog - Only for credentials type */}
      <Dialog open={!!selectedPlatform} onOpenChange={() => {
      setSelectedPlatform(null);
      setShowPassword({});
      setPlatformCredentials([]);
    }}>
        <DialogContent className="bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-foreground">
              {selectedPlatform?.cover_image_url ? <img src={selectedPlatform.cover_image_url} alt={selectedPlatform.name} className="w-10 h-10 object-cover rounded" /> : <span className="text-3xl">
                  {selectedPlatform && platformIcons[selectedPlatform.name]}
                </span>}
              {selectedPlatform?.name}
            </DialogTitle>
          </DialogHeader>
          
          {platformCredentials.length > 0 ? <div className="space-y-4 mt-4">
              {platformCredentials.map((cred, index) => <div key={index} className="space-y-3 p-4 rounded-lg bg-background/30 border border-border">
                  {platformCredentials.length > 1 && <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                        Acesso {String(index + 1).padStart(2, '0')}
                      </span>
                      <Button size="sm" variant="outline" onClick={() => {
                navigator.clipboard.writeText(`Login: ${cred.login}\nSenha: ${cred.password}`);
                toast({
                  title: '✅ Copiado!',
                  description: `Acesso ${String(index + 1).padStart(2, '0')} copiado`
                });
              }}>
                        <Copy className="w-3 h-3 mr-1" />
                        Copiar
                      </Button>
                    </div>}
                  
                  {platformCredentials.length === 1 && <Button className="w-full mb-3" onClick={() => {
              navigator.clipboard.writeText(`Login: ${cred.login}\nSenha: ${cred.password}`);
              toast({
                title: '✅ Copiado!',
                description: 'Login e senha copiados para a área de transferência'
              });
            }}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar Login e Senha
                    </Button>}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Login</label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-background/50 border border-border rounded-md px-3 py-2 text-foreground cursor-pointer hover:bg-background/70 transition-colors text-sm" onClick={() => copyToClipboard(cred.login, 'Login')}>
                        {cred.login}
                      </div>
                      <Button variant="outline" size="icon" onClick={() => copyToClipboard(cred.login, 'Login')}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Senha</label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-background/50 border border-border rounded-md px-3 py-2 text-foreground font-mono cursor-pointer hover:bg-background/70 transition-colors text-sm" onClick={() => copyToClipboard(cred.password, 'Senha')}>
                        {showPassword[index] ? cred.password : '••••••••'}
                      </div>
                      <Button variant="outline" size="icon" onClick={() => setShowPassword(prev => ({
                  ...prev,
                  [index]: !prev[index]
                }))}>
                        {showPassword[index] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => copyToClipboard(cred.password, 'Senha')}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>)}

              {/* Website Link */}
              {selectedPlatform?.website_url && <Button variant="outline" className="w-full" onClick={() => window.open(selectedPlatform.website_url!, '_blank')}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Abrir Site
                </Button>}
            </div> : <p className="text-muted-foreground">
              Nenhuma credencial cadastrada para esta plataforma.
            </p>}
        </DialogContent>
      </Dialog>

      {/* WhatsApp Group Popup */}
      <Dialog open={showWhatsAppPopup} onOpenChange={setShowWhatsAppPopup}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <span className="text-2xl">📱</span>
              Entre no nosso grupo do WhatsApp!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Fique por dentro de todas as atualizações, novidades e promoções exclusivas! 
              Entre no nosso grupo do WhatsApp para não perder nada.
            </p>
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => {
                  window.open('https://chat.whatsapp.com/JcD6FVAr1euLsQGlKtoSjf', '_blank');
                  setShowWhatsAppPopup(false);
                }}
                className="w-full bg-green-500 hover:bg-green-600 text-white"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Entrar no Grupo
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowWhatsAppPopup(false)}
                className="w-full"
              >
                Agora não
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>;
}
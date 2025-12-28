import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Gift, CheckCircle, Sparkles, Film, Music, Palette, Camera, Bot, Crown, Eye, EyeOff, Lock } from 'lucide-react';

interface InviteData {
  id: string;
  code: string;
  expires_at: string;
  status: string;
  access_days: number;
  recipient_name: string | null;
  recipient_email: string | null;
  platform_ids: string[];
}

interface Platform {
  id: string;
  name: string;
  icon_url: string | null;
  category: string;
}

type PlatformCategory = 'ai_tools' | 'streamings' | 'software' | 'bonus_courses' | 'loja';

const CATEGORY_LABELS: Record<PlatformCategory, string> = {
  'ai_tools': 'Ferramentas IAs & Variadas',
  'streamings': 'Streamings',
  'software': 'Softwares',
  'bonus_courses': 'Bônus: Cursos',
  'loja': 'Loja'
};

const CATEGORY_ICONS: Record<PlatformCategory, React.ReactNode> = {
  'ai_tools': <Bot className="w-4 h-4" />,
  'streamings': <Film className="w-4 h-4" />,
  'software': <Palette className="w-4 h-4" />,
  'bonus_courses': <Crown className="w-4 h-4" />,
  'loja': <Sparkles className="w-4 h-4" />
};

export default function Invite() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [includedPlatforms, setIncludedPlatforms] = useState<Platform[]>([]);
  const [blockedPlatforms, setBlockedPlatforms] = useState<Platform[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Registration form
  const [showRegister, setShowRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (code) {
      fetchInvite();
    }
  }, [code]);

  const fetchInvite = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch invite
      const { data: inviteData, error: inviteError } = await supabase
        .from('invites')
        .select('*')
        .eq('code', code)
        .maybeSingle();
      
      if (inviteError) throw inviteError;
      
      if (!inviteData) {
        setError('Convite não encontrado');
        setLoading(false);
        return;
      }
      
      // Check if expired
      if (new Date(inviteData.expires_at) < new Date()) {
        setError('Este convite expirou');
        setLoading(false);
        return;
      }
      
      // Check if already used
      if (inviteData.status === 'used') {
        setError('Este convite já foi utilizado');
        setLoading(false);
        return;
      }
      
      setInvite(inviteData as InviteData);
      
      // Pre-fill email if provided
      if (inviteData.recipient_email) {
        setEmail(inviteData.recipient_email);
      }
      if (inviteData.recipient_name) {
        setName(inviteData.recipient_name);
      }
      
      // Fetch ALL platforms
      const { data: allPlatformsData } = await supabase
        .from('streaming_platforms')
        .select('id, name, icon_url, category')
        .order('name');
      
      if (allPlatformsData) {
        const platformIds = inviteData.platform_ids || [];
        const included = allPlatformsData.filter(p => platformIds.includes(p.id));
        const blocked = allPlatformsData.filter(p => !platformIds.includes(p.id));
        setIncludedPlatforms(included as Platform[]);
        setBlockedPlatforms(blocked as Platform[]);
      }
    } catch (err: any) {
      console.error('Error fetching invite:', err);
      setError('Erro ao carregar convite');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos',
        variant: 'destructive'
      });
      return;
    }
    
    if (password.length < 6) {
      toast({
        title: 'Erro',
        description: 'A senha deve ter pelo menos 6 caracteres',
        variant: 'destructive'
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            name: name.trim()
          }
        }
      });
      
      if (authError) {
        if (authError.message.includes('already registered')) {
          toast({
            title: 'Erro',
            description: 'Este e-mail já está cadastrado. Faça login para continuar.',
            variant: 'destructive'
          });
          setIsSubmitting(false);
          return;
        }
        throw authError;
      }
      
      if (!authData.user) {
        throw new Error('Falha ao criar usuário');
      }
      
      // Wait a moment for the trigger to create the profile
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Use invite to grant access
      const { data: useResult, error: useError } = await supabase
        .rpc('use_invite', {
          p_invite_code: code,
          p_user_id: authData.user.id
        });
      
      if (useError) throw useError;
      
      const result = useResult as { success: boolean; error?: string; access_days?: number };
      
      if (!result.success) {
        throw new Error(result.error || 'Falha ao utilizar convite');
      }
      
      toast({
        title: 'Cadastro realizado!',
        description: `Seu acesso foi liberado por ${result.access_days} dias. Redirecionando...`
      });
      
      // Redirect to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      
    } catch (err: any) {
      console.error('Registration error:', err);
      toast({
        title: 'Erro',
        description: err.message || 'Falha ao realizar cadastro',
        variant: 'destructive'
      });
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
              <Gift className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Convite Inválido</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => navigate('/')} variant="outline">
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invite) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>
      
      <div className="relative z-10 container mx-auto px-4 py-8 md:py-16">
        {!showRegister ? (
          /* Welcome Screen */
          <div className="max-w-2xl mx-auto text-center">
            {/* Gift animation */}
            <div className="mb-8 relative">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center animate-pulse">
                <Gift className="w-12 h-12 text-primary-foreground" />
              </div>
              <Sparkles className="absolute top-0 right-1/3 w-6 h-6 text-yellow-400 animate-bounce" />
              <Sparkles className="absolute bottom-0 left-1/3 w-4 h-4 text-yellow-400 animate-bounce delay-100" />
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              🎉 Parabéns! Você foi convidado!
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8">
              Você ganhou <span className="text-primary font-semibold">{invite.access_days} dias de acesso gratuito</span> à nossa plataforma premium!
            </p>
            
            {/* Benefits list */}
            <Card className="mb-8 bg-card/80 backdrop-blur-sm border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-center gap-2">
                  <Crown className="w-5 h-5 text-primary" />
                  Serviços Incluídos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Included platforms grouped by category */}
                {includedPlatforms.length > 0 && (
                  <div>
                    <p className="text-sm text-green-500 font-medium mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Liberados para você ({includedPlatforms.length})
                    </p>
                    <div className="space-y-3">
                      {(['ai_tools', 'streamings', 'software', 'bonus_courses', 'loja'] as PlatformCategory[]).map(category => {
                        const categoryPlatforms = includedPlatforms.filter(p => p.category === category);
                        if (categoryPlatforms.length === 0) return null;
                        
                        return (
                          <div key={category} className="rounded-lg border border-green-500/30 bg-green-500/5 overflow-hidden">
                            <div className="px-3 py-2 bg-green-500/10 flex items-center gap-2">
                              <span className="text-green-500">{CATEGORY_ICONS[category]}</span>
                              <span className="text-xs font-semibold text-green-600 uppercase tracking-wide">
                                {CATEGORY_LABELS[category]}
                              </span>
                            </div>
                            <div className="p-2 flex flex-wrap gap-2">
                              {categoryPlatforms.map(platform => (
                                <span 
                                  key={platform.id}
                                  className="px-3 py-1.5 text-sm bg-green-500/10 text-foreground rounded-full border border-green-500/20"
                                >
                                  {platform.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Blocked platforms grouped by category */}
                {blockedPlatforms.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground font-medium mb-3 flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Não incluídos neste convite ({blockedPlatforms.length})
                    </p>
                    <div className="space-y-2">
                      {(['ai_tools', 'streamings', 'software', 'bonus_courses', 'loja'] as PlatformCategory[]).map(category => {
                        const categoryPlatforms = blockedPlatforms.filter(p => p.category === category);
                        if (categoryPlatforms.length === 0) return null;
                        
                        return (
                          <div key={category} className="rounded-lg border border-border/30 bg-muted/20 overflow-hidden opacity-60">
                            <div className="px-3 py-1.5 bg-muted/30 flex items-center gap-2">
                              <span className="text-muted-foreground">{CATEGORY_ICONS[category]}</span>
                              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                {CATEGORY_LABELS[category]}
                              </span>
                            </div>
                            <div className="p-2 flex flex-wrap gap-1.5">
                              {categoryPlatforms.map(platform => (
                                <span 
                                  key={platform.id}
                                  className="px-2 py-1 text-xs bg-muted/30 text-muted-foreground rounded-full"
                                >
                                  {platform.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {includedPlatforms.length === 0 && blockedPlatforms.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    Carregando plataformas...
                  </p>
                )}
              </CardContent>
            </Card>
            
            <Button 
              size="lg" 
              onClick={() => setShowRegister(true)}
              className="w-full md:w-auto px-12 py-6 text-lg font-semibold"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Resgatar Meu Acesso
            </Button>
            
            <p className="text-xs text-muted-foreground mt-4">
              Convite válido até {new Date(invite.expires_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
        ) : (
          /* Registration Form */
          <Card className="max-w-md mx-auto bg-card/80 backdrop-blur-sm border-primary/20">
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <Gift className="w-8 h-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl">Complete seu Cadastro</CardTitle>
              <CardDescription>
                Crie sua conta para liberar seu acesso de {invite.access_days} dias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting || !!invite.recipient_email}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Criando conta...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Criar Conta e Liberar Acesso
                    </>
                  )}
                </Button>
                
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => setShowRegister(false)}
                  disabled={isSubmitting}
                >
                  Voltar
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

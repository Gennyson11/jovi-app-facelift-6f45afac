import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Gift, CheckCircle, Sparkles, Film, Music, Palette, Camera, Bot, Crown, Eye, EyeOff } from 'lucide-react';

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

const BENEFIT_ICONS: Record<string, React.ReactNode> = {
  'ChatGPT': <Bot className="w-5 h-5" />,
  'Canva': <Palette className="w-5 h-5" />,
  'CapCut': <Film className="w-5 h-5" />,
  'PhotoRoom': <Camera className="w-5 h-5" />,
  'Netflix': <Film className="w-5 h-5" />,
  'Disney': <Sparkles className="w-5 h-5" />,
  'HBO': <Film className="w-5 h-5" />,
  'Prime': <Film className="w-5 h-5" />,
  'YouTube': <Music className="w-5 h-5" />,
  'Paramount': <Film className="w-5 h-5" />,
  'default': <Crown className="w-5 h-5" />
};

const getIconForPlatform = (name: string) => {
  for (const key of Object.keys(BENEFIT_ICONS)) {
    if (name.toLowerCase().includes(key.toLowerCase())) {
      return BENEFIT_ICONS[key];
    }
  }
  return BENEFIT_ICONS['default'];
};

export default function Invite() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
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
      
      // Fetch platforms included in invite
      if (inviteData.platform_ids && inviteData.platform_ids.length > 0) {
        const { data: platformsData } = await supabase
          .from('streaming_platforms')
          .select('id, name, icon_url, category')
          .in('id', inviteData.platform_ids);
        
        if (platformsData) {
          setPlatforms(platformsData as Platform[]);
        }
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
              <CardContent>
                {platforms.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {platforms.map((platform) => (
                      <div
                        key={platform.id}
                        className="flex items-center gap-2 p-3 rounded-lg bg-background/50 border border-border/50"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          {getIconForPlatform(platform.name)}
                        </div>
                        <span className="text-sm font-medium text-foreground truncate">
                          {platform.name}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      'ChatGPT Plus', 'CapCut Pro', 'Canva Pro', 'PhotoRoom Pro',
                      'Netflix', 'Disney+', 'HBO Max', 'Prime Video', 
                      'YouTube Premium', 'Paramount+'
                    ].map((service) => (
                      <div
                        key={service}
                        className="flex items-center gap-2 p-3 rounded-lg bg-background/50 border border-border/50"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          {getIconForPlatform(service)}
                        </div>
                        <span className="text-sm font-medium text-foreground truncate">
                          {service}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-4">
                  E muito mais serviços exclusivos!
                </p>
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

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Gift, CheckCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';

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

export default function Invite() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Registration form
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
      
      if (new Date(inviteData.expires_at) < new Date()) {
        setError('Este convite expirou');
        setLoading(false);
        return;
      }
      
      if (inviteData.status === 'used') {
        setError('Este convite já foi utilizado');
        setLoading(false);
        return;
      }
      
      setInvite(inviteData as InviteData);
      
      if (inviteData.recipient_email) {
        setEmail(inviteData.recipient_email);
      }
      if (inviteData.recipient_name) {
        setName(inviteData.recipient_name);
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
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { data: useResult, error: useError } = await supabase
        .rpc('use_invite', {
          p_invite_code: code,
          p_user_id: authData.user.id
        });
      
      if (useError) throw useError;
      
      const result = useResult as { success: boolean; error?: string; access_hours?: number };
      
      if (!result.success) {
        throw new Error(result.error || 'Falha ao utilizar convite');
      }
      
      const hours = result.access_hours || 0;
      const timeText = hours < 24 ? `${hours} hora${hours > 1 ? 's' : ''}` : `${Math.floor(hours / 24)} dia${Math.floor(hours / 24) > 1 ? 's' : ''}`;
      
      toast({
        title: 'Cadastro realizado!',
        description: `Seu acesso foi liberado por ${timeText}.`
      });
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
      
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
        <Card className="w-full max-w-sm text-center">
          <CardContent className="pt-6">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
              <Gift className="w-7 h-7 text-destructive" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Convite Inválido</h2>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => navigate('/')} variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invite) return null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center pb-4">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
            <Gift className="w-7 h-7 text-primary" />
          </div>
          <CardTitle className="text-xl">Você foi convidado!</CardTitle>
          <CardDescription>
            {invite.access_days} dias de acesso gratuito
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
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
                  Ativar Acesso
                </>
              )}
            </Button>
          </form>
          
          <p className="text-xs text-muted-foreground text-center mt-4">
            Válido até {new Date(invite.expires_at).toLocaleDateString('pt-BR')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

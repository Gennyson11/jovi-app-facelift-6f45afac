import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, ShieldX } from 'lucide-react';
import heroImage from '@/assets/hero-jovitools.jpg';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres')
});

const signupSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  whatsapp: z.string().min(10, 'WhatsApp inválido').max(15, 'WhatsApp inválido'),
});

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockMessage, setBlockMessage] = useState<string>('');
  
  const {
    signIn,
    user,
    role,
    loading
  } = useAuth();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();

  useEffect(() => {
    if (!loading && user) {
      if (role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (role) {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, role, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = loginSchema.safeParse({ email, password });
    
    if (!validation.success) {
      toast({
        title: 'Erro de validação',
        description: validation.error.errors[0].message,
        variant: 'destructive'
      });
      return;
    }
    
    setIsLoading(true);
    const { error } = await signIn(email, password);
    
    if (error) {
      setIsLoading(false);
      toast({
        title: 'Erro ao entrar',
        description: 'Email ou senha incorretos',
        variant: 'destructive'
      });
      return;
    }
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = signupSchema.safeParse({ name, email, password, whatsapp });
    
    if (!validation.success) {
      toast({
        title: 'Erro de validação',
        description: validation.error.errors[0].message,
        variant: 'destructive'
      });
      return;
    }
    
    setIsLoading(true);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          whatsapp,
        }
      }
    });
    
    if (error) {
      setIsLoading(false);
      toast({
        title: 'Erro ao cadastrar',
        description: error.message === 'User already registered' ? 'Este email já está cadastrado.' : error.message,
        variant: 'destructive'
      });
      return;
    }

    // Update profile with whatsapp after signup
    if (data.user) {
      await supabase.from('profiles').update({ whatsapp, name }).eq('user_id', data.user.id);
    }

    setIsLoading(false);
    toast({
      title: '✅ Conta criada!',
      description: 'Sua conta foi criada com sucesso. Você já pode fazer login.',
    });
    setIsSignUp(false);
    setName('');
    setWhatsapp('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-primary/20 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-full max-w-sm rounded-2xl overflow-hidden transition-all duration-500 hover:scale-105 hover:shadow-[0_0_30px_hsl(220_90%_56%/0.5)] cursor-pointer border border-primary/30">
              <img src={heroImage} alt="JoviTools" className="w-full h-auto object-cover" />
            </div>
            <div>
              <CardTitle className="text-2xl font-display text-foreground">
                JoviTools GPainel 
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-2">
                {isSignUp ? 'Crie sua conta para começar' : 'Faça login para acessar'}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {isSignUp ? (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nome</Label>
                  <Input 
                    id="signup-name" 
                    type="text" 
                    placeholder="Seu nome completo" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    className="bg-background/50 border-border" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input 
                    id="signup-email" 
                    type="email" 
                    placeholder="seu@email.com" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    className="bg-background/50 border-border" 
                    autoComplete="email"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-whatsapp">WhatsApp</Label>
                  <Input 
                    id="signup-whatsapp" 
                    type="tel" 
                    placeholder="11999999999" 
                    value={whatsapp} 
                    onChange={e => setWhatsapp(e.target.value)} 
                    className="bg-background/50 border-border" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <Input 
                    id="signup-password" 
                    type="password" 
                    placeholder="••••••••" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    className="bg-background/50 border-border" 
                    required 
                  />
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Criar Conta
                </Button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input 
                    id="login-email" 
                    type="email" 
                    placeholder="seu@email.com" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    className="bg-background/50 border-border" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <Input 
                    id="login-password" 
                    type="password" 
                    placeholder="••••••••" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    className="bg-background/50 border-border" 
                    required 
                  />
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Entrar
                </Button>
              </form>
            )}
            <p className="text-sm text-center text-muted-foreground mt-4">
              {isSignUp ? (
                <>Já tem uma conta?{' '}
                  <button onClick={() => setIsSignUp(false)} className="text-primary hover:underline font-medium">
                    Fazer login
                  </button>
                </>
              ) : (
                <>Não tem conta?{' '}
                  <button onClick={() => setIsSignUp(true)} className="text-primary hover:underline font-medium">
                    Cadastre-se
                  </button>
                </>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Block Reason Popup */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldX className="w-6 h-6" />
              Acesso Bloqueado
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-destructive mb-2">Motivo do Bloqueio:</h4>
                  <p className="text-sm text-foreground">{blockMessage}</p>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Entre em contato com o administrador para mais informações.
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setBlockDialogOpen(false)}
              className="w-full"
            >
              Entendi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
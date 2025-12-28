import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Plus, Loader2, UserCheck, UserX, Clock, Calendar, Infinity, Users, Handshake, Eye, EyeOff } from 'lucide-react';

interface ClientProfile {
  id: string;
  user_id: string;
  masked_email: string | null;
  masked_whatsapp: string | null;
  name: string | null;
  has_access: boolean | null;
  created_at: string | null;
  access_expires_at: string | null;
}

const PLAN_OPTIONS = [
  { label: '30 dias', days: 30 },
  { label: '90 dias', days: 90 },
  { label: '1 ano', days: 365 },
];

export default function Socios() {
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSocio, setIsSocio] = useState(false);
  
  // New Client Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPassword, setClientPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<number>(30);
  const [savingClient, setSavingClient] = useState(false);

  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const hasFetchedRef = useRef(false);
  const currentUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Only fetch if user changed or first load
    if (currentUserIdRef.current === user.id && hasFetchedRef.current) {
      return;
    }
    
    currentUserIdRef.current = user.id;
    hasFetchedRef.current = true;
    
    checkSocioRole();
  }, [user?.id, authLoading, navigate]);

  const checkSocioRole = async () => {
    if (!user) return;
    
    setLoading(true);
    
    // Check if user has socio role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'socio')
      .maybeSingle();
    
    if (!roleData) {
      toast({
        title: 'Acesso Negado',
        description: 'Você não tem permissão para acessar esta página.',
        variant: 'destructive'
      });
      navigate('/dashboard');
      return;
    }
    
    setIsSocio(true);
    fetchClients();
  };

  const fetchClients = async () => {
    if (!user) return;
    
    // Usar a view partner_client_view que mascara dados sensíveis
    const { data, error } = await supabase
      .from('partner_client_view')
      .select('*')
      .eq('partner_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar clientes',
        variant: 'destructive'
      });
    } else {
      setClients((data || []) as ClientProfile[]);
    }
    
    setLoading(false);
  };

  const openNewClientDialog = () => {
    setClientName('');
    setClientEmail('');
    setClientPassword('');
    setSelectedPlan(30);
    setShowPassword(false);
    setDialogOpen(true);
  };

  const createClient = async () => {
    if (!clientName.trim() || !clientEmail.trim() || !clientPassword.trim()) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos',
        variant: 'destructive'
      });
      return;
    }

    if (clientPassword.length < 6) {
      toast({
        title: 'Erro',
        description: 'A senha deve ter pelo menos 6 caracteres',
        variant: 'destructive'
      });
      return;
    }

    setSavingClient(true);

    try {
      // Calculate expiration date
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + selectedPlan);

      // Create user via edge function with all data (bypasses RLS using service role)
      const { data: functionData, error: functionError } = await supabase.functions.invoke('setup-users', {
        body: {
          action: 'create_user',
          email: clientEmail,
          password: clientPassword,
          role: 'user',
          partner_id: user?.id,
          name: clientName,
          has_access: true,
          access_expires_at: expirationDate.toISOString()
        }
      });

      if (functionError) throw functionError;
      if (!functionData?.userId) throw new Error('Falha ao criar usuário');

      toast({
        title: 'Sucesso',
        description: `Cliente "${clientName}" cadastrado com ${selectedPlan} dias de acesso`
      });

      setDialogOpen(false);
      fetchClients();
    } catch (error: any) {
      console.error('Error creating client:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao criar cliente',
        variant: 'destructive'
      });
    } finally {
      setSavingClient(false);
    }
  };

  const toggleClientAccess = async (clientId: string, currentAccess: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ has_access: !currentAccess })
      .eq('id', clientId);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar acesso',
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: 'Sucesso',
      description: currentAccess ? 'Acesso bloqueado' : 'Acesso liberado'
    });
    fetchClients();
  };


  const getAccessStatus = (client: ClientProfile) => {
    if (!client.has_access) {
      return { text: 'Bloqueado', color: 'bg-red-500/10 text-red-500', icon: UserX };
    }
    if (client.access_expires_at === null) {
      return { text: 'Vitalício', color: 'bg-purple-500/10 text-purple-400', icon: Infinity };
    }
    const expiresAt = new Date(client.access_expires_at);
    const now = new Date();
    const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining <= 0) {
      return { text: 'Expirado', color: 'bg-red-500/10 text-red-500', icon: Clock };
    }
    if (daysRemaining <= 7) {
      return { text: `${daysRemaining}d restantes`, color: 'bg-yellow-500/10 text-yellow-500', icon: Clock };
    }
    return { text: `${daysRemaining}d restantes`, color: 'bg-green-500/10 text-green-500', icon: Calendar };
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isSocio) {
    return null;
  }

  const activeClients = clients.filter(c => c.has_access).length;
  const inactiveClients = clients.filter(c => !c.has_access).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-amber-500/5">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Handshake className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Painel do Sócio</h1>
              <p className="text-sm text-muted-foreground">Gerencie seus clientes</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Voltar ao Dashboard
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{clients.length}</p>
                  <p className="text-sm text-muted-foreground">Total de Clientes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{activeClients}</p>
                  <p className="text-sm text-muted-foreground">Com Acesso</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                  <UserX className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{inactiveClients}</p>
                  <p className="text-sm text-muted-foreground">Sem Acesso</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Clients Table */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-foreground">Meus Clientes</CardTitle>
            <Button onClick={openNewClientDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Cliente
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map(client => {
                    const status = getAccessStatus(client);
                    const StatusIcon = status.icon;
                    return (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">
                          {client.name || '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {client.masked_email || '-'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(client.created_at)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {client.access_expires_at 
                            ? formatDate(client.access_expires_at)
                            : 'Vitalício'}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {status.text}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant={client.has_access ? "destructive" : "default"}
                            size="sm"
                            onClick={() => toggleClientAccess(client.id, client.has_access)}
                          >
                            {client.has_access ? (
                              <>
                                <UserX className="w-4 h-4 mr-2" />
                                Bloquear
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-4 h-4 mr-2" />
                                Liberar
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {clients.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Você ainda não cadastrou nenhum cliente</p>
                        <p className="text-sm mt-1">Clique em "Novo Cliente" para começar</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* New Client Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Cadastrar Novo Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client-name">Nome *</Label>
              <Input
                id="client-name"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                placeholder="Nome do cliente"
                className="bg-background/50 border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-email">Email *</Label>
              <Input
                id="client-email"
                type="email"
                value={clientEmail}
                onChange={e => setClientEmail(e.target.value)}
                placeholder="email@exemplo.com"
                className="bg-background/50 border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-password">Senha *</Label>
              <div className="relative">
                <Input
                  id="client-password"
                  type={showPassword ? "text" : "password"}
                  value={clientPassword}
                  onChange={e => setClientPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="bg-background/50 border-border pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Plano de Acesso
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {PLAN_OPTIONS.map(option => (
                  <button
                    key={option.days}
                    type="button"
                    onClick={() => setSelectedPlan(option.days)}
                    className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                      selectedPlan === option.days
                        ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                        : 'border-border bg-background/50 text-muted-foreground hover:border-amber-500/50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={createClient} 
              disabled={savingClient}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
            >
              {savingClient ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Cadastrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

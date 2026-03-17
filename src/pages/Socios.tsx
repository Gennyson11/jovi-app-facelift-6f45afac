import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Plus, Loader2, UserCheck, UserX, Clock, Calendar, Infinity, Users, Handshake, Eye, EyeOff, Coins, Trophy, Gift, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

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
  { label: '7 dias', days: 7 },
  { label: '15 dias', days: 15 },
  { label: '30 dias', days: 30 },
];

export default function Socios() {
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSocio, setIsSocio] = useState(false);
  const [isSocio2, setIsSocio2] = useState(false);
  const [socioName, setSocioName] = useState<string | null>(null);
  const [socioCredits, setSocioCredits] = useState<number>(0);
  
  // New Client Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPassword, setClientPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<number>(30);
  const [savingClient, setSavingClient] = useState(false);
  const [socioWhatsapp, setSocioWhatsapp] = useState('');
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);
  const [confirmDeleteClient, setConfirmDeleteClient] = useState<ClientProfile | null>(null);

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
    
    // Check if socio has 2.0 enabled + get name
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('socio_2_enabled, whatsapp, name')
      .eq('user_id', user.id)
      .maybeSingle();
    
    console.log('Socio profile data:', profileData, 'Error:', profileError);
    
    setIsSocio2(profileData?.socio_2_enabled || false);
    setSocioName(profileData?.name || null);
    if (profileData?.whatsapp) setSocioWhatsapp(profileData.whatsapp);
    
    // Fetch credits balance
    const { data: creditsData } = await supabase
      .from('user_credits')
      .select('balance')
      .eq('user_id', user.id)
      .maybeSingle();
    
    setSocioCredits(creditsData?.balance || 0);
    
    fetchClients();
  };

  const fetchSocioWhatsapp = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('whatsapp')
      .eq('user_id', user.id)
      .maybeSingle();
    if (data?.whatsapp) setSocioWhatsapp(data.whatsapp);
  };

  const saveSocioWhatsapp = async () => {
    if (!user) return;
    setSavingWhatsapp(true);
    const { error } = await supabase
      .from('profiles')
      .update({ whatsapp: socioWhatsapp })
      .eq('user_id', user.id);
    setSavingWhatsapp(false);
    if (error) {
      toast({ title: 'Erro', description: 'Falha ao salvar WhatsApp', variant: 'destructive' });
    } else {
      toast({ title: 'Sucesso', description: 'WhatsApp de contato salvo!' });
    }
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

  const getFreshAccessToken = async () => {
    const { data, error } = await supabase.auth.refreshSession();

    if (error || !data.session?.access_token) {
      throw new Error('Sua sessão expirou. Faça login novamente para continuar.');
    }

    return data.session.access_token;
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
      // Check credits first - all socios need 1 credit to create a client
      if (socioCredits < 1) {
        toast({
          title: 'Créditos insuficientes',
          description: 'Você precisa de pelo menos 1 crédito para cadastrar um cliente.',
          variant: 'destructive'
        });
        setSavingClient(false);
        return;
      }

      // Calculate expiration date
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + selectedPlan);

      const accessToken = await getFreshAccessToken();

      // Create user via edge function with all data (bypasses RLS using service role)
      const { data: functionData, error: functionError } = await supabase.functions.invoke('setup-users', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
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

      // Deduct 1 credit
      if (user) {
        const { error: creditError } = await supabase.rpc('add_credits', {
          p_user_id: user.id,
          p_amount: -1,
          p_type: 'client_creation',
          p_description: `Cadastro de cliente: ${clientName}`
        });
        if (creditError) {
          console.error('Error deducting credit:', creditError);
        } else {
          setSocioCredits(prev => prev - 1);
        }
      }

      toast({
        title: 'Sucesso',
        description: `Cliente "${clientName}" cadastrado com ${selectedPlan} dias de acesso (1 crédito utilizado)`
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

  const deleteClient = async (client: ClientProfile) => {
    setDeletingClientId(client.id);
    try {
      const accessToken = await getFreshAccessToken();

      const { data, error } = await supabase.functions.invoke('setup-users', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        body: {
          action: 'delete_client',
          client_profile_id: client.id
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Falha ao deletar cliente');

      toast({
        title: 'Sucesso',
        description: `Cliente "${client.name || 'sem nome'}" deletado permanentemente.`
      });
      fetchClients();
    } catch (error: any) {
      console.error('Error deleting client:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao deletar cliente',
        variant: 'destructive'
      });
    } finally {
      setDeletingClientId(null);
      setConfirmDeleteClient(null);
    }
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
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-foreground">Painel do Sócio</h1>
                {isSocio2 && (
                  <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/30 border text-[10px]">2.0</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {socioName || 'Gerencie seus clientes'}
                {isSocio2 && (
                  <span className="ml-2 text-purple-400">• {socioCredits} créditos</span>
                )}
              </p>
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

        {/* WhatsApp Contact Card */}
        <Card className="border-border mb-8">
          <CardHeader>
            <CardTitle className="text-foreground text-base">Seu WhatsApp de Contato</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Este número será exibido para seus clientes quando o acesso expirar.
            </p>
            <div className="flex gap-2">
              <Input
                value={socioWhatsapp}
                onChange={e => setSocioWhatsapp(e.target.value)}
                placeholder="(11) 99999-9999"
                className="bg-background/50 border-border max-w-xs"
              />
              <Button onClick={saveSocioWhatsapp} disabled={savingWhatsapp}>
                {savingWhatsapp ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sócio 2.0 - Credits & Missions Card */}
        {isSocio2 && (
          <Card className="border-border mb-8 bg-gradient-to-r from-purple-500/5 to-pink-500/5 border-purple-500/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Gift className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <CardTitle className="text-foreground text-base">Sócio 2.0</CardTitle>
                    <p className="text-sm text-muted-foreground">Créditos, missões e funcionalidades exclusivas</p>
                  </div>
                </div>
                <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/30 border">2.0</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-center gap-2 border-purple-500/20 hover:bg-purple-500/10"
                  onClick={() => navigate('/creditos')}
                >
                  <Coins className="w-6 h-6 text-purple-400" />
                  <span className="text-sm font-medium">Meus Créditos</span>
                  <span className="text-xs text-muted-foreground">Comprar e gerenciar</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-center gap-2 border-purple-500/20 hover:bg-purple-500/10"
                  onClick={() => navigate('/creditos?tab=missions')}
                >
                  <Trophy className="w-6 h-6 text-amber-400" />
                  <span className="text-sm font-medium">Missões</span>
                  <span className="text-xs text-muted-foreground">Ganhe recompensas</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-center gap-2 border-purple-500/20 hover:bg-purple-500/10"
                  onClick={() => navigate('/creditos')}
                >
                  <Coins className="w-6 h-6 text-green-400" />
                  <span className="text-sm font-medium">Histórico</span>
                  <span className="text-xs text-muted-foreground">Transações recentes</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

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
                          <div className="flex items-center justify-end gap-2">
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
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                              onClick={() => setConfirmDeleteClient(client)}
                              disabled={deletingClientId === client.id}
                            >
                              {deletingClientId === client.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!confirmDeleteClient} onOpenChange={(open) => !open && setConfirmDeleteClient(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar o cliente <strong>{confirmDeleteClient?.name || 'sem nome'}</strong>? 
              Esta ação é <strong>permanente</strong> e não pode ser desfeita. O usuário será removido completamente do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => confirmDeleteClient && deleteClient(confirmDeleteClient)}
            >
              Deletar Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

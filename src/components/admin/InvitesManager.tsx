import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Copy, Trash2, Loader2, Link, Gift, CheckCircle, Clock, XCircle, Search, Calendar, Users, Eye } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Invite {
  id: string;
  code: string;
  expires_at: string;
  used_at: string | null;
  used_by: string | null;
  created_by: string;
  platform_ids: string[];
  access_days: number;
  recipient_name: string | null;
  recipient_email: string | null;
  status: string;
  created_at: string;
}

interface Platform {
  id: string;
  name: string;
  category: string;
}

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  name: string | null;
}

const ACCESS_DAYS_OPTIONS = [
  { label: '7 dias', value: 7 },
  { label: '15 dias', value: 15 },
  { label: '30 dias', value: 30 },
  { label: '60 dias', value: 60 },
  { label: '90 dias', value: 90 },
];

const EXPIRY_OPTIONS = [
  { label: '1 dia', days: 1 },
  { label: '3 dias', days: 3 },
  { label: '7 dias', days: 7 },
  { label: '15 dias', days: 15 },
  { label: '30 dias', days: 30 },
];

export default function InvitesManager() {
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Create invite dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [accessDays, setAccessDays] = useState(15);
  const [expiryDays, setExpiryDays] = useState(7);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  
  // View invite dialog
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedInvite, setSelectedInvite] = useState<Invite | null>(null);
  const [usedByUser, setUsedByUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    const [invitesRes, platformsRes] = await Promise.all([
      supabase.from('invites').select('*').order('created_at', { ascending: false }),
      supabase.from('streaming_platforms').select('id, name, category').order('name')
    ]);
    
    if (invitesRes.data) {
      // Update expired invites
      const now = new Date();
      const updatedInvites = invitesRes.data.map(inv => {
        if (inv.status === 'active' && new Date(inv.expires_at) < now) {
          return { ...inv, status: 'expired' };
        }
        return inv;
      }) as Invite[];
      setInvites(updatedInvites);
    }
    
    if (platformsRes.data) {
      setPlatforms(platformsRes.data as Platform[]);
      // Select all platforms by default for new invites
      setSelectedPlatforms(platformsRes.data.map(p => p.id));
    }
    
    setLoading(false);
  };

  const generateInviteCode = async (): Promise<string> => {
    const { data, error } = await supabase.rpc('generate_invite_code');
    if (error) throw error;
    return data as string;
  };

  const createInvite = async () => {
    if (selectedPlatforms.length === 0) {
      toast({
        title: 'Erro',
        description: 'Selecione pelo menos uma plataforma',
        variant: 'destructive'
      });
      return;
    }
    
    setIsCreating(true);
    
    try {
      const code = await generateInviteCode();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiryDays);
      
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase.from('invites').insert({
        code,
        expires_at: expiresAt.toISOString(),
        created_by: userData.user?.id,
        platform_ids: selectedPlatforms,
        access_days: accessDays,
        recipient_name: recipientName.trim() || null,
        recipient_email: recipientEmail.trim() || null,
        status: 'active'
      });
      
      if (error) throw error;
      
      toast({
        title: 'Convite criado!',
        description: `Código: ${code}`
      });
      
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      console.error('Error creating invite:', err);
      toast({
        title: 'Erro',
        description: 'Falha ao criar convite',
        variant: 'destructive'
      });
    } finally {
      setIsCreating(false);
    }
  };

  const deleteInvite = async (id: string) => {
    const confirmed = window.confirm('Tem certeza que deseja excluir este convite?');
    if (!confirmed) return;
    
    const { error } = await supabase.from('invites').delete().eq('id', id);
    
    if (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao excluir convite',
        variant: 'destructive'
      });
      return;
    }
    
    toast({
      title: 'Convite excluído'
    });
    fetchData();
  };

  const copyInviteLink = (code: string) => {
    const link = `${window.location.origin}/convite/${code}`;
    navigator.clipboard.writeText(link);
    toast({
      title: 'Link copiado!',
      description: link
    });
  };

  const viewInviteDetails = async (invite: Invite) => {
    setSelectedInvite(invite);
    setUsedByUser(null);
    
    if (invite.used_by) {
      const { data } = await supabase
        .from('profiles')
        .select('id, user_id, email, name')
        .eq('user_id', invite.used_by)
        .maybeSingle();
      
      if (data) {
        setUsedByUser(data as UserProfile);
      }
    }
    
    setViewDialogOpen(true);
  };

  const resetForm = () => {
    setRecipientName('');
    setRecipientEmail('');
    setAccessDays(15);
    setExpiryDays(7);
    setSelectedPlatforms(platforms.map(p => p.id));
  };

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  const selectAllPlatforms = () => {
    setSelectedPlatforms(platforms.map(p => p.id));
  };

  const deselectAllPlatforms = () => {
    setSelectedPlatforms([]);
  };

  const getStatusBadge = (invite: Invite) => {
    if (invite.status === 'used') {
      return <Badge variant="secondary" className="bg-green-500/10 text-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Usado</Badge>;
    }
    if (invite.status === 'expired' || new Date(invite.expires_at) < new Date()) {
      return <Badge variant="secondary" className="bg-red-500/10 text-red-500"><XCircle className="w-3 h-3 mr-1" /> Expirado</Badge>;
    }
    return <Badge variant="secondary" className="bg-blue-500/10 text-blue-500"><Clock className="w-3 h-3 mr-1" /> Ativo</Badge>;
  };

  const filteredInvites = invites.filter(invite => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      invite.code.toLowerCase().includes(query) ||
      invite.recipient_name?.toLowerCase().includes(query) ||
      invite.recipient_email?.toLowerCase().includes(query)
    );
  });

  const getPlatformNames = (platformIds: string[]) => {
    return platformIds
      .map(id => platforms.find(p => p.id === id)?.name)
      .filter(Boolean)
      .slice(0, 3)
      .join(', ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Gift className="w-6 h-6 text-primary" />
            Sistema de Convites
          </h2>
          <p className="text-muted-foreground">
            Gerencie links de convite para novos usuários
          </p>
        </div>
        
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Convite
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Link className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{invites.filter(i => i.status === 'active').length}</p>
                <p className="text-sm text-muted-foreground">Convites Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{invites.filter(i => i.status === 'used').length}</p>
                <p className="text-sm text-muted-foreground">Convites Utilizados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{invites.filter(i => i.status === 'expired').length}</p>
                <p className="text-sm text-muted-foreground">Convites Expirados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar convites..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Invites Table */}
      <Card className="bg-card/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Destinatário</TableHead>
                <TableHead>Acesso</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvites.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {searchQuery ? 'Nenhum convite encontrado' : 'Nenhum convite criado ainda'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvites.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell>
                      <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
                        {invite.code}
                      </code>
                    </TableCell>
                    <TableCell>
                      {invite.recipient_name || invite.recipient_email || (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{invite.access_days} dias</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {new Date(invite.expires_at).toLocaleDateString('pt-BR')}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(invite)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => viewInviteDetails(invite)}
                          title="Ver detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyInviteLink(invite.code)}
                          disabled={invite.status !== 'active'}
                          title="Copiar link"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteInvite(invite.id)}
                          className="text-destructive hover:text-destructive"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Invite Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary" />
              Criar Novo Convite
            </DialogTitle>
            <DialogDescription>
              Configure as opções do convite antes de gerar o link
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Recipient info (optional) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recipientName">Nome do Destinatário (opcional)</Label>
                <Input
                  id="recipientName"
                  placeholder="Nome do convidado"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipientEmail">E-mail do Destinatário (opcional)</Label>
                <Input
                  id="recipientEmail"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                />
              </div>
            </div>
            
            {/* Access and Expiry */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tempo de Acesso</Label>
                <Select value={accessDays.toString()} onValueChange={(v) => setAccessDays(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCESS_DAYS_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value.toString()}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Quanto tempo o usuário terá acesso após usar o convite
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Validade do Convite</Label>
                <Select value={expiryDays.toString()} onValueChange={(v) => setExpiryDays(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPIRY_OPTIONS.map(opt => (
                      <SelectItem key={opt.days} value={opt.days.toString()}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Tempo para o convite expirar se não for usado
                </p>
              </div>
            </div>
            
            {/* Platform Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Plataformas Incluídas</Label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllPlatforms}>
                    Todas
                  </Button>
                  <Button variant="outline" size="sm" onClick={deselectAllPlatforms}>
                    Nenhuma
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border rounded-lg bg-muted/50">
                {platforms.map((platform) => (
                  <div
                    key={platform.id}
                    className="flex items-center gap-2 p-2 rounded hover:bg-background cursor-pointer"
                    onClick={() => togglePlatform(platform.id)}
                  >
                    <Checkbox
                      checked={selectedPlatforms.includes(platform.id)}
                      onCheckedChange={() => togglePlatform(platform.id)}
                    />
                    <span className="text-sm truncate">{platform.name}</span>
                  </div>
                ))}
              </div>
              
              <p className="text-sm text-muted-foreground">
                {selectedPlatforms.length} de {platforms.length} plataformas selecionadas
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={createInvite} disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Link className="w-4 h-4 mr-2" />
                  Gerar Convite
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Invite Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Convite</DialogTitle>
          </DialogHeader>
          
          {selectedInvite && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <code className="font-mono text-lg">{selectedInvite.code}</code>
                {getStatusBadge(selectedInvite)}
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Destinatário</p>
                  <p className="font-medium">
                    {selectedInvite.recipient_name || selectedInvite.recipient_email || 'Não especificado'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tempo de Acesso</p>
                  <p className="font-medium">{selectedInvite.access_days} dias</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Criado em</p>
                  <p className="font-medium">
                    {new Date(selectedInvite.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Expira em</p>
                  <p className="font-medium">
                    {new Date(selectedInvite.expires_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
              
              {selectedInvite.status === 'used' && (
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Utilizado por</p>
                  <p className="font-medium text-green-500">
                    {usedByUser?.name || usedByUser?.email || 'Usuário desconhecido'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Em {new Date(selectedInvite.used_at!).toLocaleString('pt-BR')}
                  </p>
                </div>
              )}
              
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Plataformas ({selectedInvite.platform_ids.length})
                </p>
                <div className="flex flex-wrap gap-1">
                  {selectedInvite.platform_ids.map(id => {
                    const platform = platforms.find(p => p.id === id);
                    return platform ? (
                      <Badge key={id} variant="outline" className="text-xs">
                        {platform.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
              
              {selectedInvite.status === 'active' && (
                <div className="pt-2">
                  <Button 
                    onClick={() => copyInviteLink(selectedInvite.code)} 
                    className="w-full"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar Link do Convite
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

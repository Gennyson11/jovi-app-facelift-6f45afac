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
import { Plus, Copy, Trash2, Loader2, Link, Gift, CheckCircle, Clock, XCircle, Search, Calendar, Users, Eye, Edit, Save } from 'lucide-react';
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

type PlatformCategory = 'ai_tools' | 'streamings' | 'software' | 'bonus_courses' | 'loja';

const CATEGORY_LABELS: Record<PlatformCategory, string> = {
  'ai_tools': 'Ferramentas IAs & Variadas',
  'streamings': 'Streamings',
  'software': 'Softwares',
  'bonus_courses': 'Bônus: Cursos',
  'loja': 'Loja'
};

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  name: string | null;
}

const ACCESS_TIME_OPTIONS = [
  { label: '1 hora', value: 1 },
  { label: '2 horas', value: 2 },
  { label: '6 horas', value: 6 },
  { label: '12 horas', value: 12 },
  { label: '1 dia', value: 24 },
  { label: '2 dias', value: 48 },
  { label: '3 dias', value: 72 },
  { label: '7 dias', value: 168 },
  { label: '15 dias', value: 360 },
  { label: '30 dias', value: 720 },
  { label: '60 dias', value: 1440 },
  { label: '90 dias', value: 2160 },
];

// Helper to format hours into readable text
const formatAccessTime = (hours: number): string => {
  if (hours < 24) return `${hours} hora${hours > 1 ? 's' : ''}`;
  const days = Math.floor(hours / 24);
  return `${days} dia${days > 1 ? 's' : ''}`;
};

const EXPIRY_OPTIONS = [
  { label: '1 dia', days: 1 },
  { label: '3 dias', days: 3 },
  { label: '7 dias', days: 7 },
  { label: '15 dias', days: 15 },
  { label: '30 dias', days: 30 },
  { label: '1 Ano', days: 365 },
  { label: 'Vitalício', days: 36500 },
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
  const [accessDays, setAccessDays] = useState(360);
  const [expiryDays, setExpiryDays] = useState(7);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  
  // View invite dialog
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedInvite, setSelectedInvite] = useState<Invite | null>(null);
  const [usedByUser, setUsedByUser] = useState<UserProfile | null>(null);
  
  // Edit user access dialog
  const [editAccessDialogOpen, setEditAccessDialogOpen] = useState(false);
  const [editingUserProfile, setEditingUserProfile] = useState<UserProfile | null>(null);
  const [editUserPlatforms, setEditUserPlatforms] = useState<string[]>([]);
  const [editUserAccessDays, setEditUserAccessDays] = useState(30);
  const [editUserCurrentExpiry, setEditUserCurrentExpiry] = useState<Date | null>(null);
  const [isSavingAccess, setIsSavingAccess] = useState(false);
  
  // Edit invite dialog
  const [editInviteDialogOpen, setEditInviteDialogOpen] = useState(false);
  const [editingInvite, setEditingInvite] = useState<Invite | null>(null);
  const [editInvitePlatforms, setEditInvitePlatforms] = useState<string[]>([]);
  const [editInviteAccessDays, setEditInviteAccessDays] = useState(15);
  const [editInviteExpiryDays, setEditInviteExpiryDays] = useState(7);
  const [isSavingInvite, setIsSavingInvite] = useState(false);

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

  const openEditAccessDialog = async (userProfile: UserProfile) => {
    setEditingUserProfile(userProfile);
    
    // Fetch user's current platform access
    const { data: accessData } = await supabase
      .from('user_platform_access')
      .select('platform_id')
      .eq('user_id', userProfile.id);
    
    if (accessData) {
      setEditUserPlatforms(accessData.map(a => a.platform_id));
    }
    
    // Fetch user's current access expiry
    const { data: profileData } = await supabase
      .from('profiles')
      .select('access_expires_at')
      .eq('id', userProfile.id)
      .maybeSingle();
    
    if (profileData?.access_expires_at) {
      setEditUserCurrentExpiry(new Date(profileData.access_expires_at));
    } else {
      setEditUserCurrentExpiry(null);
    }
    
    setEditUserAccessDays(30);
    setEditAccessDialogOpen(true);
  };

  const saveUserAccess = async () => {
    if (!editingUserProfile) return;
    
    setIsSavingAccess(true);
    
    try {
      // Delete all current platform access
      await supabase
        .from('user_platform_access')
        .delete()
        .eq('user_id', editingUserProfile.id);
      
      // Insert new platform access
      if (editUserPlatforms.length > 0) {
        const accessRecords = editUserPlatforms.map(platformId => ({
          user_id: editingUserProfile.id,
          platform_id: platformId
        }));
        
        const { error: insertError } = await supabase
          .from('user_platform_access')
          .insert(accessRecords);
        
        if (insertError) throw insertError;
      }
      
      // Update access expiry if adding days
      if (editUserAccessDays > 0) {
        const baseDate = editUserCurrentExpiry && editUserCurrentExpiry > new Date() 
          ? editUserCurrentExpiry 
          : new Date();
        const newExpiry = new Date(baseDate);
        newExpiry.setDate(newExpiry.getDate() + editUserAccessDays);
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            access_expires_at: newExpiry.toISOString(),
            has_access: true
          })
          .eq('id', editingUserProfile.id);
        
        if (updateError) throw updateError;
      }
      
      toast({
        title: 'Acesso atualizado!',
        description: `Plataformas e tempo de acesso de ${editingUserProfile.name || editingUserProfile.email} foram atualizados.`
      });
      
      setEditAccessDialogOpen(false);
      setViewDialogOpen(false);
      fetchData();
    } catch (err: any) {
      console.error('Error updating user access:', err);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar acesso do usuário',
        variant: 'destructive'
      });
    } finally {
      setIsSavingAccess(false);
    }
  };

  const toggleEditPlatform = (platformId: string) => {
    setEditUserPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
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

  const openEditInviteDialog = (invite: Invite) => {
    setEditingInvite(invite);
    setEditInvitePlatforms(invite.platform_ids);
    setEditInviteAccessDays(invite.access_days);
    setEditInviteExpiryDays(7);
    setEditInviteDialogOpen(true);
  };

  const saveInviteChanges = async () => {
    if (!editingInvite) return;
    
    if (editInvitePlatforms.length === 0) {
      toast({
        title: 'Erro',
        description: 'Selecione pelo menos uma plataforma',
        variant: 'destructive'
      });
      return;
    }
    
    setIsSavingInvite(true);
    
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + editInviteExpiryDays);
      
      const { error } = await supabase
        .from('invites')
        .update({
          platform_ids: editInvitePlatforms,
          access_days: editInviteAccessDays,
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', editingInvite.id);
      
      if (error) throw error;
      
      toast({
        title: 'Convite atualizado!',
        description: 'As alterações foram salvas com sucesso.'
      });
      
      setEditInviteDialogOpen(false);
      setViewDialogOpen(false);
      fetchData();
    } catch (err: any) {
      console.error('Error updating invite:', err);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar convite',
        variant: 'destructive'
      });
    } finally {
      setIsSavingInvite(false);
    }
  };

  const toggleEditInvitePlatform = (platformId: string) => {
    setEditInvitePlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
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
                        {invite.status === 'active' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditInviteDialog(invite)}
                            title="Editar convite"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
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
              
              <div className="border rounded-lg max-h-64 overflow-y-auto bg-muted/50">
                {(['ai_tools', 'streamings', 'software', 'bonus_courses', 'loja'] as PlatformCategory[]).map(category => {
                  const categoryPlatforms = platforms.filter(p => p.category === category);
                  if (categoryPlatforms.length === 0) return null;
                  
                  const allSelected = categoryPlatforms.every(p => selectedPlatforms.includes(p.id));
                  const someSelected = categoryPlatforms.some(p => selectedPlatforms.includes(p.id));
                  
                  const toggleCategory = () => {
                    if (allSelected) {
                      // Deselect all in category
                      setSelectedPlatforms(prev => prev.filter(id => !categoryPlatforms.find(p => p.id === id)));
                    } else {
                      // Select all in category
                      const newIds = categoryPlatforms.map(p => p.id);
                      setSelectedPlatforms(prev => [...new Set([...prev, ...newIds])]);
                    }
                  };
                  
                  return (
                    <div key={category}>
                      <div 
                        className="sticky top-0 bg-muted/90 backdrop-blur-sm px-3 py-2 border-b border-border flex items-center justify-between cursor-pointer hover:bg-muted"
                        onClick={toggleCategory}
                      >
                        <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                          {CATEGORY_LABELS[category]} ({categoryPlatforms.length})
                        </span>
                        <Checkbox 
                          checked={allSelected}
                          className={someSelected && !allSelected ? 'opacity-50' : ''}
                          onCheckedChange={toggleCategory}
                        />
                      </div>
                      <div className="divide-y divide-border/50">
                        {categoryPlatforms.map(platform => (
                          <label 
                            key={platform.id} 
                            className="flex items-center gap-3 px-3 py-2 hover:bg-background/50 cursor-pointer"
                          >
                            <Checkbox
                              checked={selectedPlatforms.includes(platform.id)}
                              onCheckedChange={() => togglePlatform(platform.id)}
                            />
                            <span className="text-sm">{platform.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
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
              
              {selectedInvite.status === 'used' && usedByUser && (
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Utilizado por</p>
                      <p className="font-medium text-green-500">
                        {usedByUser.name || usedByUser.email || 'Usuário desconhecido'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Em {new Date(selectedInvite.used_at!).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openEditAccessDialog(usedByUser)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar Acesso
                    </Button>
                  </div>
                </div>
              )}
              
              {selectedInvite.status === 'used' && !usedByUser && (
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Utilizado por</p>
                  <p className="font-medium text-green-500">Usuário desconhecido</p>
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
                <div className="pt-2 flex gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => openEditInviteDialog(selectedInvite)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar Convite
                  </Button>
                  <Button 
                    onClick={() => copyInviteLink(selectedInvite.code)} 
                    className="flex-1"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar Link
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Access Dialog */}
      <Dialog open={editAccessDialogOpen} onOpenChange={setEditAccessDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-primary" />
              Editar Acesso do Usuário
            </DialogTitle>
            <DialogDescription>
              {editingUserProfile?.name || editingUserProfile?.email}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Current access info */}
            {editUserCurrentExpiry && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Acesso atual expira em:</p>
                <p className="font-medium">
                  {editUserCurrentExpiry.toLocaleDateString('pt-BR')} às {editUserCurrentExpiry.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            )}
            
            {/* Add more days */}
            <div className="space-y-2">
              <Label>Adicionar Dias de Acesso</Label>
              <Select value={editUserAccessDays.toString()} onValueChange={(v) => setEditUserAccessDays(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Não adicionar dias</SelectItem>
                  {ACCESS_DAYS_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value.toString()}>
                      + {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Dias serão adicionados à data atual de expiração
              </p>
            </div>
            
            {/* Platform Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Plataformas Liberadas</Label>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setEditUserPlatforms(platforms.map(p => p.id))}
                  >
                    Todas
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setEditUserPlatforms([])}
                  >
                    Nenhuma
                  </Button>
                </div>
              </div>
              
              <div className="border rounded-lg max-h-64 overflow-y-auto bg-muted/50">
                {(['ai_tools', 'streamings', 'software', 'bonus_courses', 'loja'] as PlatformCategory[]).map(category => {
                  const categoryPlatforms = platforms.filter(p => p.category === category);
                  if (categoryPlatforms.length === 0) return null;
                  
                  const allSelected = categoryPlatforms.every(p => editUserPlatforms.includes(p.id));
                  const someSelected = categoryPlatforms.some(p => editUserPlatforms.includes(p.id));
                  
                  const toggleCategory = () => {
                    if (allSelected) {
                      setEditUserPlatforms(prev => prev.filter(id => !categoryPlatforms.find(p => p.id === id)));
                    } else {
                      const newIds = categoryPlatforms.map(p => p.id);
                      setEditUserPlatforms(prev => [...new Set([...prev, ...newIds])]);
                    }
                  };
                  
                  return (
                    <div key={category}>
                      <div 
                        className="sticky top-0 bg-muted/90 backdrop-blur-sm px-3 py-2 border-b border-border flex items-center justify-between cursor-pointer hover:bg-muted"
                        onClick={toggleCategory}
                      >
                        <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                          {CATEGORY_LABELS[category]} ({categoryPlatforms.length})
                        </span>
                        <Checkbox 
                          checked={allSelected}
                          className={someSelected && !allSelected ? 'opacity-50' : ''}
                          onCheckedChange={toggleCategory}
                        />
                      </div>
                      <div className="divide-y divide-border/50">
                        {categoryPlatforms.map(platform => (
                          <label 
                            key={platform.id} 
                            className="flex items-center gap-3 px-3 py-2 hover:bg-background/50 cursor-pointer"
                          >
                            <Checkbox
                              checked={editUserPlatforms.includes(platform.id)}
                              onCheckedChange={() => toggleEditPlatform(platform.id)}
                            />
                            <span className="text-sm">{platform.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <p className="text-sm text-muted-foreground">
                {editUserPlatforms.length} de {platforms.length} plataformas selecionadas
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditAccessDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveUserAccess} disabled={isSavingAccess}>
              {isSavingAccess ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Invite Dialog */}
      <Dialog open={editInviteDialogOpen} onOpenChange={setEditInviteDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-primary" />
              Editar Convite
            </DialogTitle>
            <DialogDescription>
              Código: {editingInvite?.code}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Access and Expiry */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tempo de Acesso</Label>
                <Select value={editInviteAccessDays.toString()} onValueChange={(v) => setEditInviteAccessDays(parseInt(v))}>
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
                <Label>Nova Validade do Convite</Label>
                <Select value={editInviteExpiryDays.toString()} onValueChange={(v) => setEditInviteExpiryDays(parseInt(v))}>
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
                  A validade será renovada a partir de agora
                </p>
              </div>
            </div>
            
            {/* Platform Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Plataformas Incluídas</Label>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setEditInvitePlatforms(platforms.map(p => p.id))}
                  >
                    Todas
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setEditInvitePlatforms([])}
                  >
                    Nenhuma
                  </Button>
                </div>
              </div>
              
              <div className="border rounded-lg max-h-64 overflow-y-auto bg-muted/50">
                {(['ai_tools', 'streamings', 'software', 'bonus_courses', 'loja'] as PlatformCategory[]).map(category => {
                  const categoryPlatforms = platforms.filter(p => p.category === category);
                  if (categoryPlatforms.length === 0) return null;
                  
                  const allSelected = categoryPlatforms.every(p => editInvitePlatforms.includes(p.id));
                  const someSelected = categoryPlatforms.some(p => editInvitePlatforms.includes(p.id));
                  
                  const toggleCategory = () => {
                    if (allSelected) {
                      setEditInvitePlatforms(prev => prev.filter(id => !categoryPlatforms.find(p => p.id === id)));
                    } else {
                      const newIds = categoryPlatforms.map(p => p.id);
                      setEditInvitePlatforms(prev => [...new Set([...prev, ...newIds])]);
                    }
                  };
                  
                  return (
                    <div key={category}>
                      <div 
                        className="sticky top-0 bg-muted/90 backdrop-blur-sm px-3 py-2 border-b border-border flex items-center justify-between cursor-pointer hover:bg-muted"
                        onClick={toggleCategory}
                      >
                        <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                          {CATEGORY_LABELS[category]} ({categoryPlatforms.length})
                        </span>
                        <Checkbox 
                          checked={allSelected}
                          className={someSelected && !allSelected ? 'opacity-50' : ''}
                          onCheckedChange={toggleCategory}
                        />
                      </div>
                      <div className="divide-y divide-border/50">
                        {categoryPlatforms.map(platform => (
                          <label 
                            key={platform.id} 
                            className="flex items-center gap-3 px-3 py-2 hover:bg-background/50 cursor-pointer"
                          >
                            <Checkbox
                              checked={editInvitePlatforms.includes(platform.id)}
                              onCheckedChange={() => toggleEditInvitePlatform(platform.id)}
                            />
                            <span className="text-sm">{platform.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <p className="text-sm text-muted-foreground">
                {editInvitePlatforms.length} de {platforms.length} plataformas selecionadas
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditInviteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveInviteChanges} disabled={isSavingInvite}>
              {isSavingInvite ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

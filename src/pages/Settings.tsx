import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { User, Lock, Camera, Loader2, ArrowLeft } from 'lucide-react';
import DashboardSidebar from '@/components/DashboardSidebar';

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  name: string | null;
  whatsapp: string | null;
  avatar_url: string | null;
  has_access: boolean;
  access_expires_at: string | null;
}

export default function Settings() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  // Profile form
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  
  // Password form
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { user, signOut, loading: authLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
    }
  }, [user?.id]);

  const fetchProfile = async () => {
    setLoading(true);
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user?.id)
      .maybeSingle();
    
    if (profileData) {
      setUserProfile(profileData as UserProfile);
      setName(profileData.name || '');
      setWhatsapp(profileData.whatsapp || '');
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handleSaveProfile = async () => {
    if (!userProfile) return;
    
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        name: name.trim() || null,
        whatsapp: whatsapp.trim() || null
      })
      .eq('id', userProfile.id);
    
    if (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao salvar alterações',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Sucesso',
        description: 'Perfil atualizado com sucesso'
      });
      fetchProfile();
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast({
        title: 'Erro',
        description: 'A senha deve ter pelo menos 6 caracteres',
        variant: 'destructive'
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem',
        variant: 'destructive'
      });
      return;
    }
    
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) {
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao alterar senha',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Sucesso',
        description: 'Senha alterada com sucesso'
      });
      setNewPassword('');
      setConfirmPassword('');
    }
    setChangingPassword(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userProfile) return;
    
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Erro',
        description: 'Selecione um arquivo de imagem',
        variant: 'destructive'
      });
      return;
    }
    
    setUploadingAvatar(true);
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${userProfile.user_id}-${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('streaming-covers')
      .upload(`avatars/${fileName}`, file);
    
    if (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao fazer upload da imagem',
        variant: 'destructive'
      });
      setUploadingAvatar(false);
      return;
    }
    
    const { data: urlData } = supabase.storage
      .from('streaming-covers')
      .getPublicUrl(`avatars/${fileName}`);
    
    // Update profile with new avatar URL
    await supabase
      .from('profiles')
      .update({ avatar_url: urlData.publicUrl })
      .eq('id', userProfile.id);
    
    toast({
      title: 'Sucesso',
      description: 'Foto de perfil atualizada'
    });
    
    fetchProfile();
    setUploadingAvatar(false);
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex w-full">
      {/* Sidebar */}
      <DashboardSidebar
        userProfile={userProfile}
        onLogout={handleLogout}
        activeCategory={null}
        onCategorySelect={() => navigate('/dashboard')}
      />

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
          <div className="px-4 lg:px-8 py-6">
            <div className="flex items-center gap-4 ml-12 lg:ml-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/dashboard')}
                className="lg:hidden"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-display font-bold text-foreground">
                  Configurações
                </h1>
                <p className="text-sm text-muted-foreground">
                  Gerencie suas informações pessoais e preferências de conta.
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-4 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">
            {/* Profile Card */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <User className="w-5 h-5 text-muted-foreground" />
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Perfil</h2>
                  <p className="text-sm text-muted-foreground">Atualize suas informações pessoais</p>
                </div>
              </div>

              {/* Avatar */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative">
                  {userProfile?.avatar_url ? (
                    <img
                      src={userProfile.avatar_url}
                      alt="Avatar"
                      className="w-24 h-24 rounded-full object-cover border-4 border-background shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center text-2xl font-bold text-foreground border-4 border-background shadow-lg">
                      {getInitials(userProfile?.name || null, userProfile?.email || '')}
                    </div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Clique no ícone para alterar sua foto de perfil
                </p>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userProfile?.email || ''}
                    disabled
                    className="bg-secondary/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    O e-mail não pode ser alterado
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Digite seu nome completo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="+55 (00) 00000-0000"
                  />
                </div>

                <Button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="w-full sm:w-auto"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar alterações'
                  )}
                </Button>
              </div>
            </div>

            {/* Security Card */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <Lock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Segurança</h2>
                  <p className="text-sm text-muted-foreground">Altere sua senha de acesso</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova senha</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Digite sua nova senha"
                  />
                  <p className="text-xs text-muted-foreground">
                    A senha deve ter pelo menos 6 caracteres
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirme sua nova senha"
                  />
                </div>

                <Button
                  onClick={handleChangePassword}
                  disabled={changingPassword || !newPassword || !confirmPassword}
                  variant="secondary"
                  className="w-full sm:w-auto"
                >
                  {changingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Alterando...
                    </>
                  ) : (
                    'Alterar senha'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

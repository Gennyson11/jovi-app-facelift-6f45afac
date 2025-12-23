import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Wrench, 
  Clapperboard,
  Monitor,
  Library, 
  Gift, 
  Ticket, 
  Headphones, 
  Settings, 
  LogOut,
  Menu,
  X,
  ChevronLeft,
  Bot,
  Handshake,
  ShoppingCart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatar_url?: string | null;
}

interface DashboardSidebarProps {
  userProfile: UserProfile | null;
  onLogout: () => void;
  activeCategory: string | null;
  onCategorySelect: (category: string | null) => void;
  isSocio?: boolean;
}

const DASHBOARD_ITEMS = [
  { id: 'ferramentas', label: 'Ferramentas', icon: Wrench, category: 'ai_tools' },
  { id: 'streamings', label: 'Streamings', icon: Clapperboard, category: 'streamings' },
  { id: 'softwares', label: 'Softwares', icon: Monitor, category: 'software' },
  { id: 'biblioteca', label: 'Bônus', icon: Library, category: 'bonus_courses' },
  { id: 'loja', label: 'Loja', icon: ShoppingCart, category: 'loja' },
  { id: 'jovi_ia', label: 'Jovi.ia', icon: Bot, category: 'jovi_ia' },
];

const GENERAL_ITEMS = [
  { id: 'sorteios', label: 'Sorteios', icon: Gift, category: 'sorteios', disabled: false },
  { id: 'suporte', label: 'Suporte', icon: Headphones, href: 'https://bit.ly/whatsapp-suportejt', external: true },
  { id: 'configuracoes', label: 'Configurações', icon: Settings, href: '/settings', route: true },
];

const SOCIO_ITEM = { id: 'socios', label: 'Painel Sócio', icon: Handshake, href: '/socios', route: true };

export default function DashboardSidebar({ 
  userProfile, 
  onLogout, 
  activeCategory, 
  onCategorySelect,
  isSocio = false
}: DashboardSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  const handleItemClick = (item: typeof DASHBOARD_ITEMS[0]) => {
    // Navigate to dashboard if not already there
    if (location.pathname !== '/dashboard') {
      navigate('/dashboard');
    }
    onCategorySelect(item.category);
    setIsMobileOpen(false);
  };

  const handleGeneralItemClick = (item: typeof GENERAL_ITEMS[0]) => {
    if (item.disabled) return;
    if (item.category) {
      // Navigate to dashboard if not already there
      if (location.pathname !== '/dashboard') {
        navigate('/dashboard');
      }
      onCategorySelect(item.category);
    } else if (item.external && item.href) {
      window.open(item.href, '_blank');
    } else if (item.route && item.href) {
      navigate(item.href);
    }
    setIsMobileOpen(false);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        {!isCollapsed && (
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Dashboard
          </h2>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex h-8 w-8"
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", isCollapsed && "rotate-180")} />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {/* Dashboard Section */}
        <div className="p-3">
          {!isCollapsed && (
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-3">
              Dashboard
            </p>
          )}
          <nav className="space-y-1">
            {DASHBOARD_ITEMS.map((item) => {
              const isActive = activeCategory === item.category && item.category !== null;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
                    isCollapsed && "justify-center px-2"
                  )}
                >
                  <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-primary-foreground")} />
                  {!isCollapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* General Section */}
        <div className="p-3 pt-0">
          {!isCollapsed && (
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-3 mt-4">
              Geral
            </p>
          )}
          <nav className="space-y-1">
            {GENERAL_ITEMS.map((item) => {
              const isActive = (item.category && activeCategory === item.category) || (item.route && item.href === location.pathname);
              return (
              <button
                key={item.id}
                onClick={() => handleGeneralItemClick(item)}
                disabled={item.disabled}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
                  item.disabled && "opacity-50 cursor-not-allowed",
                  isCollapsed && "justify-center px-2"
                )}
              >
                <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-primary-foreground")} />
                {!isCollapsed && <span>{item.label}</span>}
              </button>
              );
            })}
            
            {/* Socio Panel Link - Only visible for socios */}
            {isSocio && (
              <button
                onClick={() => {
                  navigate(SOCIO_ITEM.href);
                  setIsMobileOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mt-2",
                  location.pathname === SOCIO_ITEM.href
                    ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white" 
                    : "text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 border border-amber-500/30",
                  isCollapsed && "justify-center px-2"
                )}
              >
                <SOCIO_ITEM.icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span>{SOCIO_ITEM.label}</span>}
              </button>
            )}
          </nav>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="mt-auto border-t border-border">
        {/* User Profile */}
        {userProfile && (
          <div className={cn(
            "p-4 flex items-center gap-3",
            isCollapsed && "justify-center"
          )}>
            {userProfile.avatar_url ? (
              <img 
                src={userProfile.avatar_url} 
                alt="Avatar" 
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm flex-shrink-0">
                {getInitials(userProfile.name, userProfile.email)}
              </div>
            )}
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {userProfile.name || userProfile.email.split('@')[0]}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {userProfile.email}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Logout */}
        <button
          onClick={onLogout}
          className={cn(
            "w-full flex items-center gap-3 px-6 py-4 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all border-t border-border",
            isCollapsed && "justify-center px-2"
          )}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && <span>Sair</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-card border border-border shadow-lg"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={cn(
        "lg:hidden fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <button
          onClick={() => setIsMobileOpen(false)}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-secondary/50"
        >
          <X className="h-5 w-5" />
        </button>
        <SidebarContent />
      </div>

      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden lg:block h-screen sticky top-0 transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}>
        <SidebarContent />
      </div>
    </>
  );
}

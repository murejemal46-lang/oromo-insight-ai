import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  FileText,
  PenSquare,
  LogOut,
  Sparkles,
  Globe,
  Home,
  ClipboardCheck,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { useLanguageStore } from '@/store/useLanguageStore';
import { toast } from '@/hooks/use-toast';

const menuItems = [
  { title: 'dashboard.overview', url: '/dashboard', icon: LayoutDashboard },
  { title: 'dashboard.myArticles', url: '/dashboard/articles', icon: FileText },
  { title: 'dashboard.newArticle', url: '/dashboard/new', icon: PenSquare },
];

const editorMenuItem = { 
  title: 'dashboard.review', 
  url: '/dashboard/review', 
  icon: ClipboardCheck 
};

export function DashboardSidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const { user } = useAuthStore();
  const { language, setLanguage } = useLanguageStore();

  const isCollapsed = state === 'collapsed';

  // Check if user has editor role
  const { data: isEditor } = useQuery({
    queryKey: ['user-role-editor', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase.rpc('has_role', { 
        _user_id: user.id, 
        _role: 'editor' 
      });
      if (error) return false;
      return data;
    },
    enabled: !!user,
  });

  const allMenuItems = isEditor ? [...menuItems, editorMenuItem] : menuItems;

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: t('auth.logoutSuccess') });
      navigate('/');
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="p-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center shrink-0">
            <span className="font-display font-bold text-accent-foreground">O</span>
          </div>
          {!isCollapsed && (
            <div>
              <span className="font-display font-bold text-sm">OROMO TIMES</span>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {t('qalaca.name')}
              </p>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{isCollapsed ? '' : t('dashboard.menu')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {allMenuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    tooltip={t(item.title)}
                  >
                    <Link to={item.url}>
                      <item.icon className="w-4 h-4" />
                      <span>{t(item.title)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{isCollapsed ? '' : t('common.settings')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setLanguage(language === 'om' ? 'en' : 'om')}
                  tooltip={language === 'om' ? 'English' : 'Afaan Oromoo'}
                >
                  <Globe className="w-4 h-4" />
                  <span>{language === 'om' ? 'Afaan Oromoo' : 'English'}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={t('nav.home')}>
                  <Link to="/">
                    <Home className="w-4 h-4" />
                    <span>{t('nav.home')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        {!isCollapsed && user && (
          <div className="mb-3 px-2">
            <p className="text-sm font-medium truncate">
              {user.user_metadata?.full_name || user.email}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        )}
        <Button
          variant="ghost"
          size={isCollapsed ? 'icon' : 'default'}
          onClick={handleLogout}
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-4 h-4" />
          {!isCollapsed && <span className="ml-2">{t('nav.logout')}</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

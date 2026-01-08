import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Bot,
  FileText,
  LogOut,
  Home,
  UserPlus,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const menuItems = [
  { title: 'Overview', icon: LayoutDashboard, path: '/admin' },
  { title: 'User Management', icon: Users, path: '/admin/users' },
  { title: 'Admin Management', icon: ShieldCheck, path: '/admin/admins' },
  { title: 'AI Control Panel', icon: Bot, path: '/admin/ai' },
  { title: 'Audit Logs', icon: FileText, path: '/admin/logs' },
];

export function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { open } = useSidebar();
  const { user } = useAuthStore();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b p-4">
        {open ? (
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">Admin Panel</span>
          </div>
        ) : (
          <ShieldCheck className="h-6 w-6 text-primary mx-auto" />
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Administration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton
                        asChild
                        isActive={location.pathname === item.path}
                      >
                        <button onClick={() => navigate(item.path)}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </button>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {!open && (
                      <TooltipContent side="right">{item.title}</TooltipContent>
                    )}
                  </Tooltip>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton asChild>
                      <button onClick={() => navigate('/dashboard')}>
                        <Home className="h-4 w-4" />
                        <span>Dashboard</span>
                      </button>
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  {!open && (
                    <TooltipContent side="right">Dashboard</TooltipContent>
                  )}
                </Tooltip>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton asChild>
                      <button onClick={() => navigate('/')}>
                        <Home className="h-4 w-4" />
                        <span>Home</span>
                      </button>
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  {!open && (
                    <TooltipContent side="right">Home</TooltipContent>
                  )}
                </Tooltip>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        {open && user && (
          <div className="mb-2 text-sm text-muted-foreground truncate">
            {user.email}
          </div>
        )}
        <Button
          variant="outline"
          size={open ? 'default' : 'icon'}
          onClick={handleLogout}
          className="w-full"
        >
          <LogOut className="h-4 w-4" />
          {open && <span className="ml-2">Logout</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

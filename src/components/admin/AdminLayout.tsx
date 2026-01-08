import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { AdminSidebar } from './AdminSidebar';
import { AdminRoute } from '@/components/auth/AdminRoute';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AdminRoute>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AdminSidebar />
          <SidebarInset className="flex-1">
            <header className="h-14 border-b flex items-center px-4 sticky top-0 bg-background z-10">
              <SidebarTrigger />
              <span className="ml-4 font-semibold text-lg">Admin Panel</span>
            </header>
            <main className="p-6">{children}</main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AdminRoute>
  );
}

import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { DashboardSidebar } from './DashboardSidebar';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <DashboardSidebar />
          <SidebarInset className="flex-1">
            <header className="h-14 border-b flex items-center px-4 sticky top-0 bg-background z-10">
              <SidebarTrigger />
            </header>
            <main className="p-6">{children}</main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
}

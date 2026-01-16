import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/store/useAuthStore";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { JournalistRoute } from "@/components/auth/JournalistRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import "@/i18n";

import Index from "./pages/Index";
import CategoryPage from "./pages/CategoryPage";
import ArticlePage from "./pages/ArticlePage";
import SearchPage from "./pages/SearchPage";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import MyArticlesPage from "./pages/dashboard/MyArticlesPage";
import ArticleEditorPage from "./pages/dashboard/ArticleEditorPage";
import EditorReviewPage from "./pages/dashboard/EditorReviewPage";
import AdminRequestsPage from "./pages/dashboard/AdminRequestsPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminManagePage from "./pages/admin/AdminManagePage";
import AdminAIPage from "./pages/admin/AdminAIPage";
import AdminLogsPage from "./pages/admin/AdminLogsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setSession, setIsLoading } = useAuthStore();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [setUser, setSession, setIsLoading]);

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/category/:category" element={<CategoryPage />} />
            <Route path="/article/:slug" element={<ArticlePage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/dashboard/articles" element={<JournalistRoute><MyArticlesPage /></JournalistRoute>} />
            <Route path="/dashboard/new" element={<JournalistRoute><ArticleEditorPage /></JournalistRoute>} />
            <Route path="/dashboard/edit/:slug" element={<JournalistRoute><ArticleEditorPage /></JournalistRoute>} />
            <Route path="/dashboard/review" element={<ProtectedRoute><EditorReviewPage /></ProtectedRoute>} />
            <Route path="/dashboard/requests" element={<AdminRoute><AdminRequestsPage /></AdminRoute>} />
            {/* Admin Panel Routes */}
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/admins" element={<AdminManagePage />} />
            <Route path="/admin/ai" element={<AdminAIPage />} />
            <Route path="/admin/logs" element={<AdminLogsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

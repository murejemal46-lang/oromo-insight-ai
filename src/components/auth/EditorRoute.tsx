import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { useUserRole } from '@/hooks/useUserRole';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface EditorRouteProps {
  children: ReactNode;
}

export function EditorRoute({ children }: EditorRouteProps) {
  const { user, isLoading: authLoading } = useAuthStore();
  const { isEditor, isLoading: roleLoading } = useUserRole();
  const navigate = useNavigate();

  const isLoading = authLoading || roleLoading;

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    } else if (!isLoading && user && !isEditor) {
      toast({
        title: 'Access Denied',
        description: 'You need editor access to view this page.',
        variant: 'destructive',
      });
      navigate('/dashboard');
    }
  }, [user, isLoading, isEditor, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isEditor) {
    return null;
  }

  return <>{children}</>;
}

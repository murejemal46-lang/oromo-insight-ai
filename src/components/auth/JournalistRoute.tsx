import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { useUserRole } from '@/hooks/useUserRole';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface JournalistRouteProps {
  children: ReactNode;
}

export function JournalistRoute({ children }: JournalistRouteProps) {
  const { user, isLoading: authLoading } = useAuthStore();
  const { isJournalist, isLoading: roleLoading } = useUserRole();
  const navigate = useNavigate();

  const isLoading = authLoading || roleLoading;

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    } else if (!isLoading && user && !isJournalist) {
      toast({
        title: 'Access Denied',
        description: 'You need journalist access to view this page.',
        variant: 'destructive',
      });
      navigate('/dashboard');
    }
  }, [user, isLoading, isJournalist, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isJournalist) {
    return null;
  }

  return <>{children}</>;
}

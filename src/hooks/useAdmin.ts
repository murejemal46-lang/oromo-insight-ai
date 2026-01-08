import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';

interface AdminStats {
  totalUsers: number;
  totalArticles: number;
  pendingJournalistRequests: number;
  totalAiLogs: number;
  roleCounts: {
    admin: number;
    editor: number;
    journalist: number;
    reader: number;
  };
  aiSettings: Record<string, unknown>;
}

interface AdminUser {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  isSystemOwner: boolean;
  createdAt: string;
  lastSignIn: string | null;
}

interface AuditLog {
  id: string;
  admin_id: string;
  admin_email: string;
  action_type: string;
  target_user_id: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

export function useAdminStats() {
  const { session } = useAuthStore();

  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async (): Promise<AdminStats> => {
      const { data, error } = await supabase.functions.invoke('admin-actions', {
        body: { action: 'get_stats' }
      });

      if (error) throw error;
      return data;
    },
    enabled: !!session,
  });
}

export function useAdminUsers(page = 1, roleFilter?: string) {
  const { session } = useAuthStore();

  return useQuery({
    queryKey: ['admin-users', page, roleFilter],
    queryFn: async (): Promise<{ users: AdminUser[]; total: number }> => {
      const { data, error } = await supabase.functions.invoke('admin-actions', {
        body: { action: 'list_users', page, limit: 20, roleFilter }
      });

      if (error) throw error;
      return data;
    },
    enabled: !!session,
  });
}

export function useAdminList() {
  const { session } = useAuthStore();

  return useQuery({
    queryKey: ['admin-list'],
    queryFn: async (): Promise<{ admins: AdminUser[] }> => {
      const { data, error } = await supabase.functions.invoke('admin-actions', {
        body: { action: 'list_admins' }
      });

      if (error) throw error;
      return data;
    },
    enabled: !!session,
  });
}

export function useAuditLogs(page = 1, actionType?: string, startDate?: string, endDate?: string) {
  const { session } = useAuthStore();

  return useQuery({
    queryKey: ['audit-logs', page, actionType, startDate, endDate],
    queryFn: async (): Promise<{ logs: AuditLog[]; total: number }> => {
      const { data, error } = await supabase.functions.invoke('admin-actions', {
        body: { action: 'get_audit_logs', page, limit: 50, actionType, startDate, endDate }
      });

      if (error) throw error;
      return data;
    },
    enabled: !!session,
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ targetUserId, newRole }: { targetUserId: string; newRole: string }) => {
      const { data, error } = await supabase.functions.invoke('admin-actions', {
        body: { action: 'update_user_role', targetUserId, newRole }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-list'] });
    },
  });
}

export function useUpdateAISettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: unknown }) => {
      const { data, error } = await supabase.functions.invoke('admin-actions', {
        body: { action: 'update_ai_settings', key, value }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });
}

export function useInviteAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (email: string) => {
      const { data, error } = await supabase.functions.invoke('admin-invite', {
        body: { action: 'create', email }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-invitations'] });
    },
  });
}

export function useRevokeAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      const { data, error } = await supabase.functions.invoke('admin-invite', {
        body: { action: 'revoke', targetUserId }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });
}

export function useBootstrapAdmin() {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('admin-bootstrap');

      if (error) throw error;
      return data;
    },
  });
}

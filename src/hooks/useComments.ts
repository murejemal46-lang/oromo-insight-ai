import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { useEffect } from 'react';
import { toast } from 'sonner';

export interface Comment {
  id: string;
  article_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  is_approved: boolean;
  is_hidden: boolean;
  moderated_by: string | null;
  moderated_at: string | null;
  moderation_reason: string | null;
  created_at: string;
  updated_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  replies?: Comment[];
}

export function useComments(articleId: string) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: comments, isLoading, error } = useQuery({
    queryKey: ['comments', articleId],
    queryFn: async () => {
      // Fetch comments with user profiles
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('article_id', articleId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch profiles for all unique user_ids
      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Organize into threads
      const commentMap = new Map<string, Comment>();
      const rootComments: Comment[] = [];

      data.forEach(comment => {
        const enrichedComment: Comment = {
          ...comment,
          profile: profileMap.get(comment.user_id) || undefined,
          replies: [],
        };
        commentMap.set(comment.id, enrichedComment);
      });

      data.forEach(comment => {
        const enrichedComment = commentMap.get(comment.id)!;
        if (comment.parent_id) {
          const parent = commentMap.get(comment.parent_id);
          if (parent) {
            parent.replies = parent.replies || [];
            parent.replies.push(enrichedComment);
          }
        } else {
          rootComments.push(enrichedComment);
        }
      });

      return rootComments;
    },
    enabled: !!articleId,
  });

  // Realtime subscription
  useEffect(() => {
    if (!articleId) return;

    const channel = supabase
      .channel(`comments-${articleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `article_id=eq.${articleId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['comments', articleId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [articleId, queryClient]);

  const addComment = useMutation({
    mutationFn: async ({ content, parentId }: { content: string; parentId?: string }) => {
      if (!user) throw new Error('Must be logged in to comment');

      const { data, error } = await supabase
        .from('comments')
        .insert({
          article_id: articleId,
          user_id: user.id,
          parent_id: parentId || null,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', articleId] });
      toast.success('Comment submitted! Awaiting moderation.');
    },
    onError: (error) => {
      toast.error(`Failed to submit comment: ${error.message}`);
    },
  });

  const updateComment = useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string; content: string }) => {
      const { data, error } = await supabase
        .from('comments')
        .update({ content })
        .eq('id', commentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', articleId] });
      toast.success('Comment updated');
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', articleId] });
      toast.success('Comment deleted');
    },
  });

  // Moderation actions
  const approveComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { data, error } = await supabase
        .from('comments')
        .update({
          is_approved: true,
          moderated_by: user?.id,
          moderated_at: new Date().toISOString(),
        })
        .eq('id', commentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', articleId] });
      toast.success('Comment approved');
    },
  });

  const hideComment = useMutation({
    mutationFn: async ({ commentId, reason }: { commentId: string; reason?: string }) => {
      const { data, error } = await supabase
        .from('comments')
        .update({
          is_hidden: true,
          moderated_by: user?.id,
          moderated_at: new Date().toISOString(),
          moderation_reason: reason || null,
        })
        .eq('id', commentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', articleId] });
      toast.success('Comment hidden');
    },
  });

  const unhideComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { data, error } = await supabase
        .from('comments')
        .update({
          is_hidden: false,
          moderated_by: user?.id,
          moderated_at: new Date().toISOString(),
          moderation_reason: null,
        })
        .eq('id', commentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', articleId] });
      toast.success('Comment restored');
    },
  });

  return {
    comments: comments || [],
    isLoading,
    error,
    addComment,
    updateComment,
    deleteComment,
    approveComment,
    hideComment,
    unhideComment,
  };
}

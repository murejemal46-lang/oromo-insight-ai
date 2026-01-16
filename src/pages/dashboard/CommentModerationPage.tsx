import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Check,
  EyeOff,
  Eye,
  Trash2,
  Search,
  Shield,
  MessageSquare,
  ExternalLink,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

type FilterStatus = 'all' | 'pending' | 'approved' | 'hidden';

interface CommentWithDetails {
  id: string;
  content: string;
  is_approved: boolean;
  is_hidden: boolean;
  moderation_reason: string | null;
  created_at: string;
  user_id: string;
  article_id: string;
  article_slug: string;
  article_title: string;
  user_name: string | null;
  user_avatar: string | null;
}

export default function CommentModerationPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  const [filter, setFilter] = useState<FilterStatus>('pending');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkHideDialog, setShowBulkHideDialog] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [bulkHideReason, setBulkHideReason] = useState('');

  // Fetch all comments with article and user details
  const { data: comments, isLoading } = useQuery({
    queryKey: ['moderation-comments', filter, search],
    queryFn: async () => {
      // Get comments
      let query = supabase
        .from('comments')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter === 'pending') {
        query = query.eq('is_approved', false).eq('is_hidden', false);
      } else if (filter === 'approved') {
        query = query.eq('is_approved', true).eq('is_hidden', false);
      } else if (filter === 'hidden') {
        query = query.eq('is_hidden', true);
      }

      const { data: commentsData, error } = await query;
      if (error) throw error;

      if (!commentsData || commentsData.length === 0) return [];

      // Get unique article and user IDs
      const articleIds = [...new Set(commentsData.map(c => c.article_id))];
      const userIds = [...new Set(commentsData.map(c => c.user_id))];

      // Fetch articles
      const { data: articles } = await supabase
        .from('articles')
        .select('id, slug, title_en, title_om')
        .in('id', articleIds);

      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);

      const articleMap = new Map(articles?.map(a => [a.id, a]) || []);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Combine data
      const enrichedComments: CommentWithDetails[] = commentsData.map(comment => {
        const article = articleMap.get(comment.article_id);
        const profile = profileMap.get(comment.user_id);
        return {
          id: comment.id,
          content: comment.content,
          is_approved: comment.is_approved,
          is_hidden: comment.is_hidden,
          moderation_reason: comment.moderation_reason,
          created_at: comment.created_at,
          user_id: comment.user_id,
          article_id: comment.article_id,
          article_slug: article?.slug || '',
          article_title: article?.title_en || article?.title_om || 'Unknown Article',
          user_name: profile?.full_name || null,
          user_avatar: profile?.avatar_url || null,
        };
      });

      // Filter by search
      if (search) {
        const searchLower = search.toLowerCase();
        return enrichedComments.filter(
          c =>
            c.content.toLowerCase().includes(searchLower) ||
            c.article_title.toLowerCase().includes(searchLower) ||
            c.user_name?.toLowerCase().includes(searchLower)
        );
      }

      return enrichedComments;
    },
  });

  // Bulk approve mutation
  const bulkApprove = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('comments')
        .update({
          is_approved: true,
          moderated_by: user?.id,
          moderated_at: new Date().toISOString(),
        })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation-comments'] });
      setSelectedIds(new Set());
      toast.success(t('moderation.bulkApproveSuccess', 'Comments approved successfully'));
    },
    onError: () => {
      toast.error(t('moderation.bulkApproveError', 'Failed to approve comments'));
    },
  });

  // Bulk hide mutation
  const bulkHide = useMutation({
    mutationFn: async ({ ids, reason }: { ids: string[]; reason?: string }) => {
      const { error } = await supabase
        .from('comments')
        .update({
          is_hidden: true,
          moderated_by: user?.id,
          moderated_at: new Date().toISOString(),
          moderation_reason: reason || null,
        })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation-comments'] });
      setSelectedIds(new Set());
      setShowBulkHideDialog(false);
      setBulkHideReason('');
      toast.success(t('moderation.bulkHideSuccess', 'Comments hidden successfully'));
    },
    onError: () => {
      toast.error(t('moderation.bulkHideError', 'Failed to hide comments'));
    },
  });

  // Bulk unhide mutation
  const bulkUnhide = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('comments')
        .update({
          is_hidden: false,
          moderated_by: user?.id,
          moderated_at: new Date().toISOString(),
          moderation_reason: null,
        })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation-comments'] });
      setSelectedIds(new Set());
      toast.success(t('moderation.bulkUnhideSuccess', 'Comments restored successfully'));
    },
    onError: () => {
      toast.error(t('moderation.bulkUnhideError', 'Failed to restore comments'));
    },
  });

  // Bulk delete mutation
  const bulkDelete = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('comments').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation-comments'] });
      setSelectedIds(new Set());
      setShowBulkDeleteDialog(false);
      toast.success(t('moderation.bulkDeleteSuccess', 'Comments deleted successfully'));
    },
    onError: () => {
      toast.error(t('moderation.bulkDeleteError', 'Failed to delete comments'));
    },
  });

  const toggleSelectAll = () => {
    if (selectedIds.size === comments?.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(comments?.map(c => c.id) || []));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const pendingCount = comments?.filter(c => !c.is_approved && !c.is_hidden).length || 0;
  const hiddenCount = comments?.filter(c => c.is_hidden).length || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">{t('moderation.title', 'Comment Moderation')}</h1>
              <p className="text-muted-foreground text-sm">
                {t('moderation.subtitle', 'Review and moderate comments across all articles')}
              </p>
            </div>
          </div>

          {/* Stats badges */}
          <div className="flex gap-2">
            <Badge variant="outline" className="text-warning border-warning">
              <Clock className="h-3 w-3 mr-1" />
              {pendingCount} {t('moderation.pending', 'Pending')}
            </Badge>
            <Badge variant="outline" className="text-destructive border-destructive">
              <EyeOff className="h-3 w-3 mr-1" />
              {hiddenCount} {t('moderation.hidden', 'Hidden')}
            </Badge>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('moderation.searchPlaceholder', 'Search comments, articles, users...')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filter} onValueChange={(v: FilterStatus) => setFilter(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('moderation.filterAll', 'All Comments')}</SelectItem>
              <SelectItem value="pending">{t('moderation.filterPending', 'Pending Review')}</SelectItem>
              <SelectItem value="approved">{t('moderation.filterApproved', 'Approved')}</SelectItem>
              <SelectItem value="hidden">{t('moderation.filterHidden', 'Hidden')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Actions */}
        <AnimatePresence>
          {selectedIds.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg"
            >
              <span className="text-sm font-medium">
                {selectedIds.size} {t('moderation.selected', 'selected')}
              </span>
              <div className="flex-1" />
              <Button
                size="sm"
                variant="outline"
                onClick={() => bulkApprove.mutate([...selectedIds])}
                disabled={bulkApprove.isPending}
                className="text-green-600 border-green-600 hover:bg-green-50"
              >
                <Check className="h-4 w-4 mr-1" />
                {t('moderation.approveAll', 'Approve')}
              </Button>
              {filter === 'hidden' ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => bulkUnhide.mutate([...selectedIds])}
                  disabled={bulkUnhide.isPending}
                  className="text-blue-600 border-blue-600 hover:bg-blue-50"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  {t('moderation.unhideAll', 'Unhide')}
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowBulkHideDialog(true)}
                  className="text-orange-600 border-orange-600 hover:bg-orange-50"
                >
                  <EyeOff className="h-4 w-4 mr-1" />
                  {t('moderation.hideAll', 'Hide')}
                </Button>
              )}
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setShowBulkDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {t('moderation.deleteAll', 'Delete')}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Comments Table */}
        <div className="border rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !comments || comments.length === 0 ? (
            <div className="p-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                {t('moderation.noComments', 'No comments to review')}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedIds.size === comments.length && comments.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>{t('moderation.comment', 'Comment')}</TableHead>
                  <TableHead>{t('moderation.article', 'Article')}</TableHead>
                  <TableHead>{t('moderation.user', 'User')}</TableHead>
                  <TableHead>{t('moderation.status', 'Status')}</TableHead>
                  <TableHead>{t('moderation.date', 'Date')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comments.map(comment => (
                  <TableRow
                    key={comment.id}
                    className={
                      comment.is_hidden
                        ? 'bg-destructive/5'
                        : !comment.is_approved
                        ? 'bg-warning/5'
                        : ''
                    }
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(comment.id)}
                        onCheckedChange={() => toggleSelect(comment.id)}
                      />
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="truncate text-sm">{comment.content}</p>
                      {comment.moderation_reason && (
                        <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                          <AlertTriangle className="h-3 w-3" />
                          {comment.moderation_reason}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link
                        to={`/article/${comment.article_slug}`}
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                        target="_blank"
                      >
                        {comment.article_title.slice(0, 30)}...
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={comment.user_avatar || undefined} />
                          <AvatarFallback className="text-xs">
                            {getInitials(comment.user_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{comment.user_name || 'Anonymous'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {comment.is_hidden ? (
                        <Badge variant="destructive">
                          <EyeOff className="h-3 w-3 mr-1" />
                          {t('comments.hidden', 'Hidden')}
                        </Badge>
                      ) : comment.is_approved ? (
                        <Badge variant="default" className="bg-green-600">
                          <Check className="h-3 w-3 mr-1" />
                          {t('comments.approved', 'Approved')}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-warning border-warning">
                          <Clock className="h-3 w-3 mr-1" />
                          {t('comments.pending', 'Pending')}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Bulk Hide Dialog */}
      <AlertDialog open={showBulkHideDialog} onOpenChange={setShowBulkHideDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('moderation.bulkHideTitle', 'Hide Selected Comments?')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'moderation.bulkHideDescription',
                'This will hide {count} comments from public view. You can provide a reason for your records.'
              ).replace('{count}', String(selectedIds.size))}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={bulkHideReason}
            onChange={e => setBulkHideReason(e.target.value)}
            placeholder={t('moderation.hideReasonPlaceholder', 'Reason (optional)')}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bulkHide.mutate({ ids: [...selectedIds], reason: bulkHideReason })}
            >
              {t('moderation.hideAll', 'Hide')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('moderation.bulkDeleteTitle', 'Delete Selected Comments?')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'moderation.bulkDeleteDescription',
                'This will permanently delete {count} comments. This action cannot be undone.'
              ).replace('{count}', String(selectedIds.size))}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bulkDelete.mutate([...selectedIds])}
              className="bg-destructive hover:bg-destructive/90"
            >
              {t('moderation.deleteAll', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

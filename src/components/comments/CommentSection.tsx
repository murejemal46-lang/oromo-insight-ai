import { useComments } from '@/hooks/useComments';
import { useUserRole } from '@/hooks/useUserRole';
import { CommentForm } from './CommentForm';
import { CommentItem } from './CommentItem';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Shield, Filter } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CommentSectionProps {
  articleId: string;
}

type FilterType = 'all' | 'pending' | 'approved' | 'hidden';

export function CommentSection({ articleId }: CommentSectionProps) {
  const { t } = useTranslation();
  const { isEditor } = useUserRole();
  const [filter, setFilter] = useState<FilterType>('all');
  
  const {
    comments,
    isLoading,
    addComment,
    updateComment,
    deleteComment,
    approveComment,
    hideComment,
    unhideComment,
  } = useComments(articleId);

  const handleAddComment = (content: string) => {
    addComment.mutate({ content });
  };

  const handleReply = (parentId: string, content: string) => {
    addComment.mutate({ content, parentId });
  };

  const handleEdit = (commentId: string, content: string) => {
    updateComment.mutate({ commentId, content });
  };

  const handleDelete = (commentId: string) => {
    deleteComment.mutate(commentId);
  };

  const handleApprove = (commentId: string) => {
    approveComment.mutate(commentId);
  };

  const handleHide = (commentId: string, reason?: string) => {
    hideComment.mutate({ commentId, reason });
  };

  const handleUnhide = (commentId: string) => {
    unhideComment.mutate(commentId);
  };

  // Flatten comments for filtering (includes replies)
  const flattenComments = (commentsToFlatten: typeof comments): typeof comments => {
    return commentsToFlatten.reduce((acc, comment) => {
      acc.push(comment);
      if (comment.replies && comment.replies.length > 0) {
        acc.push(...flattenComments(comment.replies));
      }
      return acc;
    }, [] as typeof comments);
  };

  const allFlattened = flattenComments(comments);
  const pendingCount = allFlattened.filter(c => !c.is_approved && !c.is_hidden).length;
  const hiddenCount = allFlattened.filter(c => c.is_hidden).length;

  // Filter root comments only (replies stay nested)
  const filteredComments = comments.filter(comment => {
    if (filter === 'pending') return !comment.is_approved && !comment.is_hidden;
    if (filter === 'approved') return comment.is_approved && !comment.is_hidden;
    if (filter === 'hidden') return comment.is_hidden;
    return true;
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold">
            {t('comments.title', 'Comments')}
          </h2>
          <Badge variant="secondary">{allFlattened.length}</Badge>
        </div>

        {/* Moderation filters */}
        {isEditor && (
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <div className="flex gap-1">
              {(['all', 'pending', 'approved', 'hidden'] as FilterType[]).map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(f)}
                  className={cn(
                    'text-xs',
                    filter === f && 'pointer-events-none'
                  )}
                >
                  {f === 'all' && t('comments.filterAll', 'All')}
                  {f === 'pending' && (
                    <>
                      {t('comments.filterPending', 'Pending')}
                      {pendingCount > 0 && (
                        <Badge variant="secondary" className="ml-1 h-5 px-1">
                          {pendingCount}
                        </Badge>
                      )}
                    </>
                  )}
                  {f === 'approved' && t('comments.filterApproved', 'Approved')}
                  {f === 'hidden' && (
                    <>
                      {t('comments.filterHidden', 'Hidden')}
                      {hiddenCount > 0 && (
                        <Badge variant="secondary" className="ml-1 h-5 px-1">
                          {hiddenCount}
                        </Badge>
                      )}
                    </>
                  )}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Comment form */}
      <CommentForm
        onSubmit={handleAddComment}
        isLoading={addComment.isPending}
      />

      {/* Comments list */}
      <AnimatePresence mode="popLayout">
        {filteredComments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 text-muted-foreground"
          >
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>
              {filter === 'all'
                ? t('comments.noComments', 'Be the first to comment!')
                : t('comments.noFilteredComments', 'No comments match this filter.')}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filteredComments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onReply={handleReply}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onApprove={handleApprove}
                onHide={handleHide}
                onUnhide={handleUnhide}
                isLoading={
                  addComment.isPending ||
                  updateComment.isPending ||
                  deleteComment.isPending ||
                  approveComment.isPending ||
                  hideComment.isPending ||
                  unhideComment.isPending
                }
              />
            ))}
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}

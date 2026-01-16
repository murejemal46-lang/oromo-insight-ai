import { useState } from 'react';
import { Comment } from '@/hooks/useComments';
import { useAuthStore } from '@/store/useAuthStore';
import { useUserRole } from '@/hooks/useUserRole';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Input } from '@/components/ui/input';
import { CommentForm } from './CommentForm';
import {
  MessageCircle,
  MoreVertical,
  Check,
  EyeOff,
  Eye,
  Trash2,
  Edit2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CommentItemProps {
  comment: Comment;
  onReply: (parentId: string, content: string) => void;
  onEdit: (commentId: string, content: string) => void;
  onDelete: (commentId: string) => void;
  onApprove: (commentId: string) => void;
  onHide: (commentId: string, reason?: string) => void;
  onUnhide: (commentId: string) => void;
  isLoading?: boolean;
  depth?: number;
}

export function CommentItem({
  comment,
  onReply,
  onEdit,
  onDelete,
  onApprove,
  onHide,
  onUnhide,
  isLoading,
  depth = 0,
}: CommentItemProps) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { isEditor } = useUserRole();
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showHideDialog, setShowHideDialog] = useState(false);
  const [hideReason, setHideReason] = useState('');

  const isOwner = user?.id === comment.user_id;
  const canModerate = isEditor;
  const isPending = !comment.is_approved && !comment.is_hidden;
  const isHidden = comment.is_hidden;

  const handleReply = (content: string) => {
    onReply(comment.id, content);
    setIsReplying(false);
  };

  const handleEdit = () => {
    onEdit(comment.id, editContent);
    setIsEditing(false);
  };

  const handleDelete = () => {
    onDelete(comment.id);
    setShowDeleteDialog(false);
  };

  const handleHide = () => {
    onHide(comment.id, hideReason);
    setShowHideDialog(false);
    setHideReason('');
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative',
        depth > 0 && 'ml-8 border-l-2 border-border pl-4'
      )}
    >
      <div
        className={cn(
          'rounded-lg p-4 transition-colors',
          isHidden && 'bg-destructive/5 border border-destructive/20',
          isPending && 'bg-warning/5 border border-warning/20',
          !isHidden && !isPending && 'bg-card border border-border'
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={comment.profile?.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {getInitials(comment.profile?.full_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">
                {comment.profile?.full_name || t('comments.anonymous', 'Anonymous')}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Status badges */}
            {isPending && (
              <Badge variant="outline" className="text-warning border-warning">
                <Clock className="h-3 w-3 mr-1" />
                {t('comments.pending', 'Pending')}
              </Badge>
            )}
            {isHidden && (
              <Badge variant="destructive">
                <EyeOff className="h-3 w-3 mr-1" />
                {t('comments.hidden', 'Hidden')}
              </Badge>
            )}

            {/* Actions dropdown */}
            {(isOwner || canModerate) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isOwner && !comment.is_approved && (
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      {t('common.edit', 'Edit')}
                    </DropdownMenuItem>
                  )}

                  {canModerate && (
                    <>
                      {isPending && (
                        <DropdownMenuItem onClick={() => onApprove(comment.id)}>
                          <Check className="h-4 w-4 mr-2 text-green-500" />
                          {t('comments.approve', 'Approve')}
                        </DropdownMenuItem>
                      )}
                      {!isHidden ? (
                        <DropdownMenuItem onClick={() => setShowHideDialog(true)}>
                          <EyeOff className="h-4 w-4 mr-2 text-orange-500" />
                          {t('comments.hide', 'Hide')}
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => onUnhide(comment.id)}>
                          <Eye className="h-4 w-4 mr-2 text-blue-500" />
                          {t('comments.unhide', 'Unhide')}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                    </>
                  )}

                  {(isOwner || canModerate) && (
                    <DropdownMenuItem
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t('common.delete', 'Delete')}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Moderation reason */}
        {isHidden && comment.moderation_reason && canModerate && (
          <div className="flex items-center gap-2 mb-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span>{comment.moderation_reason}</span>
          </div>
        )}

        {/* Content */}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full min-h-[80px] p-2 rounded border border-border bg-background resize-none"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button size="sm" onClick={handleEdit} disabled={isLoading}>
                {t('common.save', 'Save')}
              </Button>
            </div>
          </div>
        ) : (
          <p className={cn('text-sm whitespace-pre-wrap', isHidden && 'opacity-50')}>
            {comment.content}
          </p>
        )}

        {/* Reply button */}
        {user && !isEditing && !isHidden && (
          <div className="mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsReplying(!isReplying)}
              className="text-muted-foreground hover:text-foreground"
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              {t('comments.reply', 'Reply')}
            </Button>
          </div>
        )}

        {/* Reply form */}
        <AnimatePresence>
          {isReplying && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3"
            >
              <CommentForm
                onSubmit={handleReply}
                onCancel={() => setIsReplying(false)}
                isLoading={isLoading}
                isReply
                placeholder={t('comments.replyPlaceholder', 'Write a reply...')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && depth < 3 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onApprove={onApprove}
              onHide={onHide}
              onUnhide={onUnhide}
              isLoading={isLoading}
              depth={depth + 1}
            />
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('comments.deleteTitle', 'Delete Comment?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'comments.deleteDescription',
                'This action cannot be undone. This will permanently delete the comment.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              {t('common.delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Hide reason dialog */}
      <AlertDialog open={showHideDialog} onOpenChange={setShowHideDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('comments.hideTitle', 'Hide Comment?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'comments.hideDescription',
                'This will hide the comment from public view. You can provide a reason for moderation records.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={hideReason}
            onChange={(e) => setHideReason(e.target.value)}
            placeholder={t('comments.hideReasonPlaceholder', 'Reason (optional)')}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleHide}>
              {t('comments.hide', 'Hide')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/store/useAuthStore';
import { Send, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

interface CommentFormProps {
  onSubmit: (content: string) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  placeholder?: string;
  isReply?: boolean;
}

export function CommentForm({ onSubmit, onCancel, isLoading, placeholder, isReply }: CommentFormProps) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onSubmit(content.trim());
    setContent('');
  };

  if (!user) {
    return (
      <div className="rounded-lg border border-border bg-muted/50 p-4 text-center">
        <p className="text-sm text-muted-foreground mb-2">
          {t('comments.loginToComment', 'Sign in to join the conversation')}
        </p>
        <Button asChild size="sm">
          <Link to="/auth">{t('common.signIn', 'Sign In')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder || t('comments.placeholder', 'Share your thoughts...')}
        className="min-h-[100px] resize-none"
        disabled={isLoading}
      />
      <div className="flex items-center justify-end gap-2">
        {isReply && onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4 mr-1" />
            {t('common.cancel', 'Cancel')}
          </Button>
        )}
        <Button type="submit" size="sm" disabled={!content.trim() || isLoading}>
          <Send className="h-4 w-4 mr-1" />
          {isReply ? t('comments.reply', 'Reply') : t('comments.submit', 'Submit')}
        </Button>
      </div>
    </form>
  );
}

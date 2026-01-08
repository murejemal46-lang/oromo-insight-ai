import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  Clock, 
  Eye,
  Loader2,
  FileText,
  User
} from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { useLanguageStore } from '@/store/useLanguageStore';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

type ReviewAction = 'approve' | 'reject' | 'revise';

export default function EditorReviewPage() {
  const { user } = useAuthStore();
  const { language } = useLanguageStore();
  const queryClient = useQueryClient();
  
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionType, setActionType] = useState<ReviewAction | null>(null);

  const { data: pendingArticles, isLoading } = useQuery({
    queryKey: ['pending-articles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('status', 'pending_review')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch author names separately
      const authorIds = [...new Set(data?.map(a => a.author_id).filter(Boolean))];
      let authorMap: Record<string, string> = {};
      
      if (authorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', authorIds);
        
        profiles?.forEach(p => {
          authorMap[p.user_id] = p.full_name || '';
        });
      }
      
      return data?.map(article => ({
        ...article,
        author_name: authorMap[article.author_id || ''] || null
      }));
    },
    enabled: !!user,
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ articleId, action, notes }: { articleId: string; action: ReviewAction; notes: string }) => {
      const newStatus = action === 'approve' ? 'published' : action === 'reject' ? 'archived' : 'draft';
      
      const { error } = await supabase
        .from('articles')
        .update({
          status: newStatus,
          review_notes: notes || null,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          ...(action === 'approve' && { published_at: new Date().toISOString() }),
        })
        .eq('id', articleId);

      if (error) throw error;
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ['pending-articles'] });
      const messages = {
        approve: language === 'om' ? 'Barruu maxxanfameera' : 'Article published',
        reject: language === 'om' ? 'Barruu didameera' : 'Article rejected',
        revise: language === 'om' ? 'Barruu irra deebi\'uuf ergameera' : 'Sent back for revision',
      };
      toast({ title: messages[action] });
      closeDialog();
    },
    onError: (error: any) => {
      toast({
        title: language === 'om' ? 'Dogoggora' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const openDialog = (article: any, action: ReviewAction) => {
    setSelectedArticle(article);
    setActionType(action);
    setReviewNotes('');
  };

  const closeDialog = () => {
    setSelectedArticle(null);
    setActionType(null);
    setReviewNotes('');
  };

  const handleSubmit = () => {
    if (!selectedArticle || !actionType) return;
    reviewMutation.mutate({
      articleId: selectedArticle.id,
      action: actionType,
      notes: reviewNotes,
    });
  };

  const getTitle = (article: any) => language === 'om' ? article.title_om : article.title_en;
  const getExcerpt = (article: any) => language === 'om' ? article.excerpt_om : article.excerpt_en;

  const getActionTitle = () => {
    const titles = {
      approve: language === 'om' ? 'Barruu Maxxansi' : 'Publish Article',
      reject: language === 'om' ? 'Barruu Didi' : 'Reject Article',
      revise: language === 'om' ? 'Irra Deebi\'uu Gaafadhu' : 'Request Revision',
    };
    return actionType ? titles[actionType] : '';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold">
            {language === 'om' ? 'Gamaaggama Gulaalaa' : 'Editor Review'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'om' 
              ? 'Barruulee eeggataa jiran gamaaggami fi raggaasisi'
              : 'Review and approve pending articles'}
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : pendingArticles && pendingArticles.length > 0 ? (
          <div className="space-y-4">
            {pendingArticles.map((article, index) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <CardTitle className="text-lg truncate">{getTitle(article)}</CardTitle>
                        <CardDescription className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="gap-1">
                            <Clock className="w-3 h-3" />
                            {language === 'om' ? 'Eeggataa' : 'Pending'}
                          </Badge>
                          <span className="flex items-center gap-1 text-xs">
                            <User className="w-3 h-3" />
                            {article.author_name || (language === 'om' ? 'Barreessaa hin beekamne' : 'Unknown author')}
                          </span>
                          <span className="text-xs">
                            {format(new Date(article.created_at), 'MMM d, yyyy')}
                          </span>
                        </CardDescription>
                      </div>
                      {article.featured_image && (
                        <img 
                          src={article.featured_image} 
                          alt=""
                          className="w-20 h-14 object-cover rounded-md shrink-0"
                        />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {getExcerpt(article) && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {getExcerpt(article)}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap gap-2">
                      <Link to={`/article/${article.slug}`} target="_blank">
                        <Button variant="outline" size="sm" className="gap-1">
                          <Eye className="w-4 h-4" />
                          {language === 'om' ? 'Dubbisi' : 'Preview'}
                        </Button>
                      </Link>
                      <Button 
                        size="sm" 
                        className="gap-1 bg-success hover:bg-success/90"
                        onClick={() => openDialog(article, 'approve')}
                      >
                        <CheckCircle className="w-4 h-4" />
                        {language === 'om' ? 'Maxxansi' : 'Approve'}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-1"
                        onClick={() => openDialog(article, 'revise')}
                      >
                        <MessageSquare className="w-4 h-4" />
                        {language === 'om' ? 'Irra Deebi\'i' : 'Request Revision'}
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="gap-1"
                        onClick={() => openDialog(article, 'reject')}
                      >
                        <XCircle className="w-4 h-4" />
                        {language === 'om' ? 'Didi' : 'Reject'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {language === 'om' ? 'Barruulee eeggataa hin jiran' : 'No pending articles'}
              </h3>
              <p className="text-muted-foreground">
                {language === 'om' 
                  ? 'Barruuleen gamaaggamaaf dhiyaatan yeroo ammaa hin jiran.'
                  : 'There are no articles awaiting review at this time.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={!!selectedArticle} onOpenChange={() => closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{getActionTitle()}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium text-sm">{selectedArticle && getTitle(selectedArticle)}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === 'om' ? 'Yaada (Dirqama miti)' : 'Notes (Optional)'}
              </label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder={language === 'om' ? 'Yaada barreessaaf...' : 'Feedback for the author...'}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              {language === 'om' ? 'Haqi' : 'Cancel'}
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={reviewMutation.isPending}
              variant={actionType === 'reject' ? 'destructive' : 'default'}
              className={actionType === 'approve' ? 'bg-success hover:bg-success/90' : ''}
            >
              {reviewMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {language === 'om' ? 'Mirkaneessi' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

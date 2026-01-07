import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { PenSquare, Eye, Edit, Trash2, Clock, CheckCircle, AlertCircle, MoreHorizontal } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { useLanguageStore } from '@/store/useLanguageStore';
import { toast } from '@/hooks/use-toast';

export default function MyArticlesPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { language } = useLanguageStore();

  const { data: articles, isLoading, refetch } = useQuery({
    queryKey: ['my-articles', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('author_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const getTitle = (article: any) => language === 'om' ? article.title_om : article.title_en;

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: 'default' | 'secondary' | 'outline'; icon: any; label: { om: string; en: string } }> = {
      published: { variant: 'default', icon: CheckCircle, label: { om: 'Maxxanfame', en: 'Published' } },
      pending_review: { variant: 'secondary', icon: Clock, label: { om: 'Eeggataa', en: 'Pending' } },
      draft: { variant: 'outline', icon: AlertCircle, label: { om: 'Qopha\'aa', en: 'Draft' } },
    };
    const c = config[status] || config.draft;
    return (
      <Badge variant={c.variant} className="gap-1">
        <c.icon className="w-3 h-3" />
        {c.label[language]}
      </Badge>
    );
  };

  const handleDelete = async (id: string) => {
    if (!confirm(language === 'om' ? 'Dhugaan haquu barbaaddaa?' : 'Are you sure you want to delete this article?')) {
      return;
    }

    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', id)
      .eq('author_id', user?.id);

    if (error) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: language === 'om' ? 'Haqame' : 'Deleted',
      });
      refetch();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'om' ? 'am-ET' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">
              {language === 'om' ? 'Barruulee Koo' : 'My Articles'}
            </h1>
            <p className="text-muted-foreground">
              {language === 'om' ? 'Barruulee kee bulchi fi gulaali' : 'Manage and edit your articles'}
            </p>
          </div>
          <Link to="/dashboard/new">
            <Button className="gap-2">
              <PenSquare className="w-4 h-4" />
              {language === 'om' ? 'Barruu Haaraa' : 'New Article'}
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-24 h-16 rounded" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : articles && articles.length > 0 ? (
          <div className="space-y-4">
            {articles.map((article, i) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card>
                  <CardContent className="py-4">
                    <div className="flex items-center gap-4">
                      {article.featured_image && (
                        <img
                          src={article.featured_image}
                          alt=""
                          className="w-24 h-16 object-cover rounded"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusBadge(article.status)}
                          <span className="text-xs text-muted-foreground">
                            {t(`categories.${article.category}`)}
                          </span>
                        </div>
                        <h3 className="font-semibold truncate">{getTitle(article)}</h3>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          <span>{formatDate(article.updated_at)}</span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {article.view_count}
                          </span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/dashboard/edit/${article.slug}`}>
                              <Edit className="w-4 h-4 mr-2" />
                              {language === 'om' ? 'Gulaali' : 'Edit'}
                            </Link>
                          </DropdownMenuItem>
                          {article.status === 'published' && (
                            <DropdownMenuItem asChild>
                              <Link to={`/article/${article.slug}`}>
                                <Eye className="w-4 h-4 mr-2" />
                                {language === 'om' ? 'Ilaali' : 'View'}
                              </Link>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleDelete(article.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {language === 'om' ? 'Haqi' : 'Delete'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <PenSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-display text-xl font-semibold mb-2">
                {language === 'om' ? 'Barruuleen hin jiran' : 'No articles yet'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {language === 'om' 
                  ? 'Barruu jalqabaa kee barreessuu jalqabi!'
                  : 'Start writing your first article!'}
              </p>
              <Link to="/dashboard/new">
                <Button>
                  <PenSquare className="w-4 h-4 mr-2" />
                  {language === 'om' ? 'Barruu Haaraa Barreessi' : 'Write New Article'}
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

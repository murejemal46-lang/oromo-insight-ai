import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FileText, Eye, PenSquare, Clock, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { useLanguageStore } from '@/store/useLanguageStore';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { language } = useLanguageStore();

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data: articles, error } = await supabase
        .from('articles')
        .select('id, status, view_count')
        .eq('author_id', user.id);

      if (error) throw error;

      const total = articles?.length || 0;
      const published = articles?.filter(a => a.status === 'published').length || 0;
      const draft = articles?.filter(a => a.status === 'draft').length || 0;
      const pending = articles?.filter(a => a.status === 'pending_review').length || 0;
      const totalViews = articles?.reduce((sum, a) => sum + (a.view_count || 0), 0) || 0;

      return { total, published, draft, pending, totalViews };
    },
    enabled: !!user,
  });

  const { data: recentArticles } = useQuery({
    queryKey: ['recent-articles', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('articles')
        .select('id, title_om, title_en, status, created_at, slug')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const getTitle = (article: any) => language === 'om' ? article.title_om : article.title_en;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published': return <CheckCircle className="w-4 h-4 text-success" />;
      case 'pending_review': return <Clock className="w-4 h-4 text-warning" />;
      case 'draft': return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
      default: return null;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, { om: string; en: string }> = {
      published: { om: 'Maxxanfame', en: 'Published' },
      pending_review: { om: 'Eeggataa', en: 'Pending Review' },
      draft: { om: 'Qopha\'aa', en: 'Draft' },
    };
    return labels[status]?.[language] || status;
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-3xl font-bold mb-2">
            {language === 'om' ? 'Baga nagaan dhufte!' : 'Welcome back!'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'om' 
              ? 'Barruulee kee bulchi fi QALACA AI waliin barreessi.'
              : 'Manage your articles and write with QALACA AI assistance.'}
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: language === 'om' ? 'Barruulee Hunda' : 'Total Articles', value: stats?.total || 0, icon: FileText, color: 'text-primary' },
            { label: language === 'om' ? 'Maxxanfaman' : 'Published', value: stats?.published || 0, icon: CheckCircle, color: 'text-success' },
            { label: language === 'om' ? 'Qopha\'aa' : 'Drafts', value: stats?.draft || 0, icon: AlertCircle, color: 'text-muted-foreground' },
            { label: language === 'om' ? 'Ilaalcha Waliigalaa' : 'Total Views', value: stats?.totalViews || 0, icon: Eye, color: 'text-accent' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-3xl font-bold">{stat.value}</p>
                    </div>
                    <stat.icon className={`w-8 h-8 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-ai" />
              {language === 'om' ? 'Hojii Ariifataa' : 'Quick Actions'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Link to="/dashboard/new">
                <Button className="gap-2">
                  <PenSquare className="w-4 h-4" />
                  {language === 'om' ? 'Barruu Haaraa Barreessi' : 'Write New Article'}
                </Button>
              </Link>
              <Link to="/dashboard/articles">
                <Button variant="outline" className="gap-2">
                  <FileText className="w-4 h-4" />
                  {language === 'om' ? 'Barruulee Koo Ilaali' : 'View My Articles'}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Articles */}
        <Card>
          <CardHeader>
            <CardTitle>{language === 'om' ? 'Barruulee Dhiyoo' : 'Recent Articles'}</CardTitle>
          </CardHeader>
          <CardContent>
            {recentArticles && recentArticles.length > 0 ? (
              <div className="space-y-3">
                {recentArticles.map((article) => (
                  <Link
                    key={article.id}
                    to={`/dashboard/edit/${article.slug}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {getStatusIcon(article.status)}
                      <span className="truncate font-medium">{getTitle(article)}</span>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 ml-4">
                      {getStatusLabel(article.status)}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                {language === 'om' 
                  ? 'Barruuleen hin jiran. Barruu haaraa barreessuu jalqabi!'
                  : 'No articles yet. Start writing your first article!'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

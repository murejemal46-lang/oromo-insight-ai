import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Shield, Sparkles, ArrowLeft, Calendar, Eye } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useLanguageStore } from '@/store/useLanguageStore';
import { ArticleCategory } from '@/types/article';

const categoryImages: Record<string, string> = {
  politics: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1200',
  business: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1200',
  culture: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200',
  sports: 'https://images.unsplash.com/photo-1461896836934- voices8b5777?w=1200',
  technology: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200',
  health: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200',
  education: 'https://images.unsplash.com/photo-1562774053-701939374585?w=1200',
  world: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1200',
};

export default function CategoryPage() {
  const { category } = useParams<{ category: string }>();
  const { t } = useTranslation();
  const { language } = useLanguageStore();

  const { data: articles, isLoading } = useQuery({
    queryKey: ['articles', 'category', category],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('category', category as ArticleCategory)
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!category,
  });

  const getTitle = (article: any) => language === 'om' ? article.title_om : article.title_en;
  const getExcerpt = (article: any) => language === 'om' ? article.excerpt_om : article.excerpt_en;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'om' ? 'am-ET' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="relative h-64 md:h-80 overflow-hidden">
        <img
          src={categoryImages[category || 'politics']}
          alt={t(`categories.${category}`)}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/50 to-transparent" />
        <div className="absolute inset-0 flex items-end">
          <div className="container pb-8">
            <Link to="/">
              <Button variant="ghost" size="sm" className="text-primary-foreground/80 hover:text-primary-foreground mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('nav.home')}
              </Button>
            </Link>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-primary-foreground">
              {t(`categories.${category}`)}
            </h1>
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="py-12">
        <div className="container">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card rounded-xl overflow-hidden shadow-card">
                  <Skeleton className="aspect-video" />
                  <div className="p-5">
                    <Skeleton className="h-4 w-20 mb-3" />
                    <Skeleton className="h-6 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : articles && articles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article, i) => (
                <motion.article
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    to={`/article/${article.slug}`}
                    className="block bg-card rounded-xl overflow-hidden shadow-card hover:shadow-elevated transition-shadow group"
                  >
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={article.featured_image || categoryImages[category || 'politics']}
                        alt={getTitle(article)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        {article.credibility_level && (
                          <span className={`credibility-badge credibility-${article.credibility_level}`}>
                            <Shield className="w-3 h-3" />
                            {t(`qalaca.credibilityLevels.${article.credibility_level}`)}
                          </span>
                        )}
                        {article.is_featured && (
                          <span className="category-pill bg-accent/10 text-accent">
                            {t('home.featured')}
                          </span>
                        )}
                      </div>
                      <h3 className="font-display text-lg font-semibold mb-2 line-clamp-2 group-hover:text-accent transition-colors">
                        {getTitle(article)}
                      </h3>
                      <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                        {getExcerpt(article)}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(article.published_at || article.created_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {article.view_count} {t('article.views')}
                          </span>
                        </div>
                        <span className="flex items-center gap-1 text-ai hover:underline">
                          <Sparkles className="w-3 h-3" />
                          {t('qalaca.ask')}
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">
                {language === 'om' ? 'Barruuleen hin argamne' : 'No articles found'}
              </p>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}

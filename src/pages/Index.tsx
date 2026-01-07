import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sparkles, Shield, BookOpen, TrendingUp, ArrowRight, Calendar, Eye } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useLanguageStore } from '@/store/useLanguageStore';

const categories = ['politics', 'business', 'culture', 'sports', 'technology', 'health', 'education', 'world'] as const;

export default function Index() {
  const { t } = useTranslation();
  const { language } = useLanguageStore();

  const { data: featuredArticles, isLoading: loadingFeatured } = useQuery({
    queryKey: ['articles', 'featured'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('status', 'published')
        .eq('is_featured', true)
        .order('published_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      return data;
    },
  });

  const { data: latestArticles, isLoading: loadingLatest } = useQuery({
    queryKey: ['articles', 'latest'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      return data;
    },
  });

  const getTitle = (article: any) => language === 'om' ? article.title_om : article.title_en;
  const getExcerpt = (article: any) => language === 'om' ? article.excerpt_om : article.excerpt_en;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'om' ? 'am-ET' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative bg-primary text-primary-foreground py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-accent/20" />
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 bg-accent/20 text-accent px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              {t('home.aiPowered')}
            </div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-balance">
              {t('home.hero')}
            </h1>
            <p className="text-xl text-primary-foreground/80 mb-8">
              {t('home.heroSubtitle')}
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/category/politics">
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  {t('common.readMore')}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 bg-secondary/30">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Shield, label: t('qalaca.verify'), desc: t('qalaca.verifyDesc') },
              { icon: BookOpen, label: t('qalaca.summarize'), desc: t('qalaca.summarizeDesc') },
              { icon: TrendingUp, label: t('qalaca.explain'), desc: t('qalaca.explainDesc') },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-card p-6 rounded-xl shadow-card flex items-start gap-4"
              >
                <div className="w-12 h-12 bg-ai-surface rounded-lg flex items-center justify-center shrink-0">
                  <feature.icon className="w-6 h-6 text-ai" />
                </div>
                <div>
                  <h3 className="font-display font-semibold mb-1">{feature.label}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Articles */}
      <section className="py-16">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-3xl font-bold">{t('home.featured')}</h2>
          </div>
          
          {loadingFeatured ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
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
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredArticles?.map((article, i) => (
                <motion.article
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link
                    to={`/article/${article.slug}`}
                    className="block bg-card rounded-xl overflow-hidden shadow-card hover:shadow-elevated transition-shadow group"
                  >
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={article.featured_image || 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800'}
                        alt={getTitle(article)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="category-pill bg-accent/10 text-accent">
                          {t(`categories.${article.category}`)}
                        </span>
                        {article.credibility_level && (
                          <span className={`credibility-badge credibility-${article.credibility_level}`}>
                            <Shield className="w-3 h-3" />
                            {t(`qalaca.credibilityLevels.${article.credibility_level}`)}
                          </span>
                        )}
                      </div>
                      <h3 className="font-display text-lg font-semibold mb-2 line-clamp-2 group-hover:text-accent transition-colors">
                        {getTitle(article)}
                      </h3>
                      <p className="text-muted-foreground text-sm line-clamp-2">
                        {getExcerpt(article)}
                      </p>
                      <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(article.published_at || article.created_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {article.view_count}
                          </span>
                        </div>
                        <span className="flex items-center gap-1 text-ai">
                          <Sparkles className="w-3 h-3" />
                          {t('qalaca.ask')}
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 bg-secondary/30">
        <div className="container">
          <h2 className="font-display text-2xl font-bold mb-6">{t('home.categories')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {categories.map((category, i) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={`/category/${category}`}
                  className="block p-4 bg-card rounded-lg text-center hover:bg-accent hover:text-accent-foreground transition-colors shadow-card"
                >
                  <span className="font-medium text-sm">{t(`categories.${category}`)}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Articles */}
      <section className="py-16">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-3xl font-bold">{t('home.latest')}</h2>
            <Link to="/category/politics">
              <Button variant="ghost">
                {t('common.seeAll')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          
          {loadingLatest ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex gap-4 p-4 bg-card rounded-xl shadow-card">
                  <Skeleton className="w-32 h-24 rounded-lg shrink-0" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-5 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {latestArticles?.map((article, i) => (
                <motion.article
                  key={article.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    to={`/article/${article.slug}`}
                    className="flex gap-4 p-4 bg-card rounded-xl shadow-card hover:shadow-elevated transition-shadow group"
                  >
                    <div className="w-32 h-24 rounded-lg overflow-hidden shrink-0">
                      <img
                        src={article.featured_image || 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=400'}
                        alt={getTitle(article)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-accent">
                          {t(`categories.${article.category}`)}
                        </span>
                        {article.credibility_level && (
                          <span className={`inline-flex items-center gap-1 text-xs credibility-${article.credibility_level}`}>
                            <Shield className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <h3 className="font-display font-semibold line-clamp-2 group-hover:text-accent transition-colors">
                        {getTitle(article)}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(article.published_at || article.created_at)}
                      </p>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}

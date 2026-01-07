import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Shield, Sparkles, ArrowLeft, Calendar, Eye, Share2, BookOpen, CheckCircle, HelpCircle } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useLanguageStore } from '@/store/useLanguageStore';
import { QalacaPanel } from '@/components/qalaca/QalacaPanel';
import { useState } from 'react';

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const [qalacaAction, setQalacaAction] = useState<'verify' | 'summarize' | 'explain' | null>(null);

  const { data: article, isLoading } = useQuery({
    queryKey: ['article', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const getTitle = () => language === 'om' ? article?.title_om : article?.title_en;
  const getContent = () => language === 'om' ? article?.content_om : article?.content_en;
  const getExcerpt = () => language === 'om' ? article?.excerpt_om : article?.excerpt_en;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'om' ? 'am-ET' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="aspect-video rounded-xl mb-8" />
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!article) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-display font-bold mb-4">
            {language === 'om' ? 'Barruun hin argamne' : 'Article not found'}
          </h1>
          <Link to="/">
            <Button>{t('nav.home')}</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <article className="pb-16">
        {/* Header */}
        <div className="container py-6">
          <Link to={`/category/${article.category}`}>
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t(`categories.${article.category}`)}
            </Button>
          </Link>
        </div>

        {/* Featured Image */}
        {article.featured_image && (
          <div className="container mb-8">
            <div className="aspect-video md:aspect-[21/9] rounded-xl overflow-hidden">
              <img
                src={article.featured_image}
                alt={getTitle()}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        <div className="container">
          <div className="max-w-4xl mx-auto">
            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
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

            {/* Title */}
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-balance">
              {getTitle()}
            </h1>

            {/* Excerpt */}
            {getExcerpt() && (
              <p className="text-xl text-muted-foreground mb-6">
                {getExcerpt()}
              </p>
            )}

            {/* Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8 pb-8 border-b">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(article.published_at || article.created_at)}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {article.view_count} {t('article.views')}
              </span>
              <Button variant="ghost" size="sm" className="ml-auto">
                <Share2 className="w-4 h-4 mr-2" />
                {t('common.share')}
              </Button>
            </div>

            {/* QALACA Actions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-ai-surface border border-ai-border rounded-xl p-4 mb-8"
            >
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-ai" />
                <span className="font-display font-semibold">{t('qalaca.name')}</span>
                <span className="text-xs text-muted-foreground">— {t('qalaca.tagline')}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQalacaAction('verify')}
                  className="bg-background hover:bg-success/10 hover:text-success hover:border-success"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {t('qalaca.verify')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQalacaAction('summarize')}
                  className="bg-background hover:bg-ai/10 hover:text-ai hover:border-ai"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  {t('qalaca.summarize')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQalacaAction('explain')}
                  className="bg-background hover:bg-accent/10 hover:text-accent hover:border-accent"
                >
                  <HelpCircle className="w-4 h-4 mr-2" />
                  {t('qalaca.explain')}
                </Button>
              </div>
            </motion.div>

            {/* Content */}
            <div className="article-content prose prose-slate max-w-none">
              {getContent()?.split('\n').map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>

            {/* AI Disclaimer */}
            {article.ai_verification_score && (
              <div className="mt-8 p-4 bg-muted rounded-lg text-sm text-muted-foreground">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-ai" />
                  <span className="font-medium">{t('qalaca.aiGenerated')}</span>
                </div>
                <p>{t('qalaca.disclaimer')}</p>
              </div>
            )}
          </div>
        </div>
      </article>

      {/* QALACA Panel */}
      <QalacaPanel
        isOpen={qalacaAction !== null}
        onClose={() => setQalacaAction(null)}
        action={qalacaAction}
        article={article}
      />
    </Layout>
  );
}

import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Sparkles, Shield, BookOpen, TrendingUp } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';

const mockArticles = [
  {
    id: '1',
    title_om: 'Mootummaan Itoophiyaa Imaammata Haaraa Labse',
    title_en: 'Ethiopian Government Announces New Policy',
    excerpt_om: 'Mootummaan federaalaa imaammata dinagdee haaraa labse...',
    excerpt_en: 'The federal government has announced a new economic policy...',
    category: 'politics',
    credibility_level: 'high',
    featured_image: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800',
    published_at: '2026-01-07',
  },
  {
    id: '2',
    title_om: 'Waldaan Daldaltootaa Walgahii Geggeesse',
    title_en: 'Business Association Holds Conference',
    excerpt_om: 'Waldaan daldaltootaa biyyaalessaa walgahii waggaa geggeesse...',
    excerpt_en: 'The national business association held its annual conference...',
    category: 'business',
    credibility_level: 'verified',
    featured_image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800',
    published_at: '2026-01-06',
  },
  {
    id: '3',
    title_om: 'Ayyaanni Irreechaa Kabajame',
    title_en: 'Irreecha Festival Celebrated',
    excerpt_om: 'Ayyaanni Irreechaa bara kanaa haala ho\'aadhaan kabajame...',
    excerpt_en: 'This year\'s Irreecha festival was celebrated with great enthusiasm...',
    category: 'culture',
    credibility_level: 'high',
    featured_image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800',
    published_at: '2026-01-05',
  },
];

export default function Index() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'om' | 'en';

  const getTitle = (article: typeof mockArticles[0]) => 
    lang === 'om' ? article.title_om : article.title_en;
  
  const getExcerpt = (article: typeof mockArticles[0]) => 
    lang === 'om' ? article.excerpt_om : article.excerpt_en;

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
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                {t('common.readMore')}
              </Button>
              <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                <Sparkles className="w-4 h-4 mr-2" />
                {t('qalaca.ask')}
              </Button>
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
          <h2 className="font-display text-3xl font-bold mb-8">{t('home.featured')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockArticles.map((article, i) => (
              <motion.article
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-card rounded-xl overflow-hidden shadow-card hover:shadow-elevated transition-shadow group cursor-pointer"
              >
                <div className="aspect-video overflow-hidden">
                  <img
                    src={article.featured_image}
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
                    <span>{article.published_at}</span>
                    <button className="flex items-center gap-1 text-ai hover:underline">
                      <Sparkles className="w-3 h-3" />
                      {t('qalaca.ask')}
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Loader2, Shield, BookOpen, HelpCircle, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useLanguageStore } from '@/store/useLanguageStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';

interface QalacaPanelProps {
  isOpen: boolean;
  onClose: () => void;
  action: 'verify' | 'summarize' | 'explain' | null;
  article: any;
}

export function QalacaPanel({ isOpen, onClose, action, article }: QalacaPanelProps) {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const getTitle = () => language === 'om' ? article?.title_om : article?.title_en;
  const getContent = () => language === 'om' ? article?.content_om : article?.content_en;

  const actionConfig = {
    verify: {
      icon: Shield,
      title: t('qalaca.verifyTitle'),
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    summarize: {
      icon: BookOpen,
      title: t('qalaca.summarizeTitle'),
      color: 'text-ai',
      bgColor: 'bg-ai/10',
    },
    explain: {
      icon: HelpCircle,
      title: t('qalaca.explainTitle'),
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
  };

  useEffect(() => {
    if (isOpen && action && article) {
      performAction();
    }
  }, [isOpen, action, article]);

  const performAction = async () => {
    if (!action || !article) return;

    setIsLoading(true);
    setResponse('');

    try {
      const res = await supabase.functions.invoke('qalaca-ai', {
        body: {
          action,
          title: getTitle(),
          content: getContent(),
          language,
          category: article.category,
        },
      });

      if (res.error) {
        throw new Error(res.error.message);
      }

      setResponse(res.data?.result || '');
    } catch (error: any) {
      console.error('QALACA error:', error);
      
      if (error.message?.includes('429')) {
        toast({
          title: t('qalaca.rateLimit'),
          variant: 'destructive',
        });
      } else if (error.message?.includes('402')) {
        toast({
          title: t('qalaca.paymentRequired'),
          variant: 'destructive',
        });
      } else {
        toast({
          title: t('common.error'),
          description: error.message,
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const config = action ? actionConfig[action] : null;
  const Icon = config?.icon || Sparkles;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed top-0 right-0 h-full w-full max-w-lg bg-background border-l shadow-modal z-50 flex flex-col"
          >
            {/* Header */}
            <div className={`flex items-center justify-between p-4 border-b ${config?.bgColor || 'bg-ai-surface'}`}>
              <div className="flex items-center gap-2">
                <Icon className={`w-5 h-5 ${config?.color || 'text-ai'}`} />
                <span className="font-display font-semibold">{config?.title || t('qalaca.name')}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Loader2 className="w-8 h-8 text-ai animate-spin mb-4" />
                  <p className="text-muted-foreground">{t('qalaca.thinking')}</p>
                </div>
              ) : response ? (
                <div className="animate-fade-in">
                  {/* Article Context */}
                  <div className="mb-6 pb-4 border-b">
                    <p className="text-sm text-muted-foreground mb-1">{t('article.publishedOn')}</p>
                    <h3 className="font-display font-semibold line-clamp-2">{getTitle()}</h3>
                  </div>

                  {/* AI Response */}
                  <div className="prose prose-slate prose-sm max-w-none">
                    <ReactMarkdown>{response}</ReactMarkdown>
                  </div>

                  {/* Disclaimer */}
                  <div className="mt-6 p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Sparkles className="w-3 h-3" />
                      <span className="font-medium">{t('qalaca.aiGenerated')}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('qalaca.disclaimer')}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                  <Sparkles className="w-12 h-12 mb-4 text-ai" />
                  <p>{t('qalaca.tagline')}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-muted/30">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setResponse('');
                    performAction();
                  }}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {t('common.retry')}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={onClose}
                  className="flex-1"
                >
                  {t('common.close')}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

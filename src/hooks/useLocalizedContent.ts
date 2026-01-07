import { useLanguageStore } from '@/store/useLanguageStore';
import { Article } from '@/types/article';

export function useLocalizedContent() {
  const { language } = useLanguageStore();

  const getLocalizedField = <T extends Record<string, any>>(
    item: T,
    fieldPrefix: string
  ): string => {
    const fieldName = `${fieldPrefix}_${language}` as keyof T;
    const fallbackField = `${fieldPrefix}_en` as keyof T;
    
    return (item[fieldName] as string) || (item[fallbackField] as string) || '';
  };

  const getArticleTitle = (article: Article): string => {
    return language === 'om' ? article.title_om : article.title_en;
  };

  const getArticleExcerpt = (article: Article): string => {
    return language === 'om' 
      ? (article.excerpt_om || '') 
      : (article.excerpt_en || '');
  };

  const getArticleContent = (article: Article): string => {
    return language === 'om' ? article.content_om : article.content_en;
  };

  const getArticleSummary = (article: Article): string | undefined => {
    return language === 'om' ? article.ai_summary_om : article.ai_summary_en;
  };

  return {
    language,
    getLocalizedField,
    getArticleTitle,
    getArticleExcerpt,
    getArticleContent,
    getArticleSummary,
  };
}

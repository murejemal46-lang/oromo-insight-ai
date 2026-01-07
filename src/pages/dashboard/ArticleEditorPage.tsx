import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Save, 
  Send, 
  Sparkles, 
  Image as ImageIcon, 
  Loader2,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  FileText
} from 'lucide-react';
import { z } from 'zod';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { useLanguageStore } from '@/store/useLanguageStore';
import { toast } from '@/hooks/use-toast';
import { ArticleCategory } from '@/types/article';

const categories: ArticleCategory[] = [
  'politics', 'business', 'culture', 'sports', 
  'technology', 'health', 'education', 'world'
];

const articleSchema = z.object({
  title_om: z.string().trim().min(5, 'Title must be at least 5 characters').max(200),
  title_en: z.string().trim().min(5, 'Title must be at least 5 characters').max(200),
  excerpt_om: z.string().trim().max(500).optional(),
  excerpt_en: z.string().trim().max(500).optional(),
  content_om: z.string().trim().min(50, 'Content must be at least 50 characters'),
  content_en: z.string().trim().min(50, 'Content must be at least 50 characters'),
  category: z.enum(['politics', 'business', 'culture', 'sports', 'technology', 'health', 'education', 'world']),
  featured_image: z.string().url().optional().or(z.literal('')),
});

type ArticleFormData = z.infer<typeof articleSchema>;

export default function ArticleEditorPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { slug } = useParams();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { language } = useLanguageStore();
  const isEditing = !!slug;

  const [formData, setFormData] = useState<ArticleFormData>({
    title_om: '',
    title_en: '',
    excerpt_om: '',
    excerpt_en: '',
    content_om: '',
    content_en: '',
    category: 'politics',
    featured_image: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [aiSuggestion, setAiSuggestion] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'om' | 'en'>('om');

  // Fetch existing article if editing
  const { data: existingArticle, isLoading: isLoadingArticle } = useQuery({
    queryKey: ['article-edit', slug],
    queryFn: async () => {
      if (!slug || !user) return null;
      
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('slug', slug)
        .eq('author_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!slug && !!user,
  });

  useEffect(() => {
    if (existingArticle) {
      setFormData({
        title_om: existingArticle.title_om || '',
        title_en: existingArticle.title_en || '',
        excerpt_om: existingArticle.excerpt_om || '',
        excerpt_en: existingArticle.excerpt_en || '',
        content_om: existingArticle.content_om || '',
        content_en: existingArticle.content_en || '',
        category: existingArticle.category as ArticleCategory,
        featured_image: existingArticle.featured_image || '',
      });
    }
  }, [existingArticle]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 100) + '-' + Date.now().toString(36);
  };

  const saveMutation = useMutation({
    mutationFn: async ({ status }: { status: 'draft' | 'pending_review' }) => {
      if (!user) throw new Error('Not authenticated');

      const validation = articleSchema.safeParse(formData);
      if (!validation.success) {
        const newErrors: Record<string, string> = {};
        validation.error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
        throw new Error('Validation failed');
      }
      setErrors({});

      const slug = isEditing ? existingArticle?.slug : generateSlug(formData.title_en);

      if (isEditing && existingArticle) {
        const { error } = await supabase
          .from('articles')
          .update({
            title_om: formData.title_om,
            title_en: formData.title_en,
            excerpt_om: formData.excerpt_om || null,
            excerpt_en: formData.excerpt_en || null,
            content_om: formData.content_om,
            content_en: formData.content_en,
            category: formData.category,
            featured_image: formData.featured_image || null,
            status,
          })
          .eq('id', existingArticle.id)
          .eq('author_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('articles')
          .insert({
            title_om: formData.title_om,
            title_en: formData.title_en,
            excerpt_om: formData.excerpt_om || null,
            excerpt_en: formData.excerpt_en || null,
            content_om: formData.content_om,
            content_en: formData.content_en,
            category: formData.category,
            featured_image: formData.featured_image || null,
            status,
            author_id: user.id,
            slug,
          });

        if (error) throw error;
      }
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['my-articles'] });
      toast({
        title: status === 'draft' 
          ? (language === 'om' ? 'Kuufame' : 'Saved as draft')
          : (language === 'om' ? 'Gaaffii ergame' : 'Submitted for review'),
      });
      navigate('/dashboard/articles');
    },
    onError: (error: any) => {
      if (error.message !== 'Validation failed') {
        toast({
          title: t('common.error'),
          description: error.message,
          variant: 'destructive',
        });
      }
    },
  });

  const handleAiAssist = async (action: 'check' | 'improve' | 'translate') => {
    setIsAiLoading(true);
    setAiSuggestion('');

    try {
      const content = activeTab === 'om' ? formData.content_om : formData.content_en;
      const title = activeTab === 'om' ? formData.title_om : formData.title_en;

      const { data, error } = await supabase.functions.invoke('qalaca-journalist', {
        body: {
          action,
          title,
          content,
          language: activeTab,
          category: formData.category,
        },
      });

      if (error) throw error;
      setAiSuggestion(data?.result || '');
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const updateField = (field: keyof ArticleFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (isEditing && isLoadingArticle) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">
        <div>
          <h1 className="font-display text-3xl font-bold">
            {isEditing 
              ? (language === 'om' ? 'Barruu Gulaali' : 'Edit Article')
              : (language === 'om' ? 'Barruu Haaraa' : 'New Article')}
          </h1>
          <p className="text-muted-foreground">
            {language === 'om' 
              ? 'QALACA AI waliin barruu kee barreessi'
              : 'Write your article with QALACA AI assistance'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Editor */}
          <div className="lg:col-span-2 space-y-6">
            {/* Category & Image */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{language === 'om' ? 'Ramaddii' : 'Category'}</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(v) => updateField('category', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {t(`categories.${cat}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{language === 'om' ? 'Suuraa' : 'Featured Image URL'}</Label>
                    <div className="relative">
                      <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="https://..."
                        value={formData.featured_image}
                        onChange={(e) => updateField('featured_image', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Content Tabs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  {language === 'om' ? 'Qabiyyee' : 'Content'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'om' | 'en')}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="om">Afaan Oromoo</TabsTrigger>
                    <TabsTrigger value="en">English</TabsTrigger>
                  </TabsList>

                  <TabsContent value="om" className="space-y-4">
                    <div className="space-y-2">
                      <Label>{language === 'om' ? 'Mata Duree' : 'Title'} (Oromo)</Label>
                      <Input
                        value={formData.title_om}
                        onChange={(e) => updateField('title_om', e.target.value)}
                        placeholder={language === 'om' ? 'Mata duree barruu...' : 'Article title...'}
                        maxLength={200}
                      />
                      {errors.title_om && <p className="text-sm text-destructive">{errors.title_om}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>{language === 'om' ? 'Cuunfaa' : 'Excerpt'} (Oromo)</Label>
                      <Textarea
                        value={formData.excerpt_om}
                        onChange={(e) => updateField('excerpt_om', e.target.value)}
                        placeholder={language === 'om' ? 'Cuunfaa gabaabaa...' : 'Short excerpt...'}
                        rows={2}
                        maxLength={500}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{language === 'om' ? 'Qabiyyee' : 'Content'} (Oromo)</Label>
                      <Textarea
                        value={formData.content_om}
                        onChange={(e) => updateField('content_om', e.target.value)}
                        placeholder={language === 'om' ? 'Qabiyyee barruu kee barreessi...' : 'Write your article content...'}
                        rows={12}
                        className="font-body"
                      />
                      {errors.content_om && <p className="text-sm text-destructive">{errors.content_om}</p>}
                    </div>
                  </TabsContent>

                  <TabsContent value="en" className="space-y-4">
                    <div className="space-y-2">
                      <Label>Title (English)</Label>
                      <Input
                        value={formData.title_en}
                        onChange={(e) => updateField('title_en', e.target.value)}
                        placeholder="Article title..."
                        maxLength={200}
                      />
                      {errors.title_en && <p className="text-sm text-destructive">{errors.title_en}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Excerpt (English)</Label>
                      <Textarea
                        value={formData.excerpt_en}
                        onChange={(e) => updateField('excerpt_en', e.target.value)}
                        placeholder="Short excerpt..."
                        rows={2}
                        maxLength={500}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Content (English)</Label>
                      <Textarea
                        value={formData.content_en}
                        onChange={(e) => updateField('content_en', e.target.value)}
                        placeholder="Write your article content..."
                        rows={12}
                        className="font-body"
                      />
                      {errors.content_en && <p className="text-sm text-destructive">{errors.content_en}</p>}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => saveMutation.mutate({ status: 'draft' })}
                disabled={saveMutation.isPending}
                variant="outline"
              >
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {language === 'om' ? 'Qopha\'aa Kuusi' : 'Save Draft'}
              </Button>
              <Button
                onClick={() => saveMutation.mutate({ status: 'pending_review' })}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                {language === 'om' ? 'Gamaaggamaaf Ergi' : 'Submit for Review'}
              </Button>
            </div>
          </div>

          {/* AI Assistant Panel */}
          <div className="space-y-4">
            <Card className="sticky top-20">
              <CardHeader className="bg-ai-surface rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="w-5 h-5 text-ai" />
                  {t('qalaca.name')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  {language === 'om' 
                    ? 'QALACA AI\'n barruulee kee fooyyessuu keessatti si gargaara.'
                    : 'Let QALACA AI help you improve your articles.'}
                </p>
                
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleAiAssist('check')}
                    disabled={isAiLoading}
                  >
                    <CheckCircle className="w-4 h-4 mr-2 text-success" />
                    {language === 'om' ? 'Dhugaa Mirkaneessi' : 'Check Facts'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleAiAssist('improve')}
                    disabled={isAiLoading}
                  >
                    <Lightbulb className="w-4 h-4 mr-2 text-warning" />
                    {language === 'om' ? 'Fooyyessi' : 'Suggest Improvements'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleAiAssist('translate')}
                    disabled={isAiLoading}
                  >
                    <FileText className="w-4 h-4 mr-2 text-ai" />
                    {language === 'om' ? 'Hiiki' : 'Help Translate'}
                  </Button>
                </div>

                {isAiLoading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('qalaca.thinking')}
                  </div>
                )}

                {aiSuggestion && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-muted rounded-lg text-sm"
                  >
                    <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                      <Sparkles className="w-3 h-3" />
                      {t('qalaca.aiGenerated')}
                    </div>
                    <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                      {aiSuggestion}
                    </div>
                  </motion.div>
                )}

                <div className="pt-3 border-t">
                  <p className="text-xs text-muted-foreground flex items-start gap-1">
                    <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                    {t('qalaca.disclaimer')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

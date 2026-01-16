import { useState, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { 
  Search, 
  Filter, 
  X, 
  Calendar,
  Loader2,
  FileText,
  Clock,
  Eye
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useLanguageStore } from '@/store/useLanguageStore';
import { cn } from '@/lib/utils';
import { ArticleCategory } from '@/types/article';

const categories: ArticleCategory[] = [
  'politics', 'business', 'culture', 'sports', 
  'technology', 'health', 'education', 'world'
];

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export default function SearchPage() {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const initialQuery = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [selectedCategories, setSelectedCategories] = useState<ArticleCategory[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Debounce search query
  const debounce = useCallback((value: string) => {
    const timer = setTimeout(() => {
      setDebouncedQuery(value);
      if (value) {
        setSearchParams({ q: value });
      } else {
        setSearchParams({});
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [setSearchParams]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    debounce(value);
  };

  // Fetch articles with search and filters
  const { data: articles, isLoading } = useQuery({
    queryKey: ['search-articles', debouncedQuery, selectedCategories, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('published_articles_public')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      // Full-text search on title and content
      if (debouncedQuery.trim()) {
        const searchTerm = `%${debouncedQuery.trim()}%`;
        query = query.or(
          `title_om.ilike.${searchTerm},title_en.ilike.${searchTerm},content_om.ilike.${searchTerm},content_en.ilike.${searchTerm},excerpt_om.ilike.${searchTerm},excerpt_en.ilike.${searchTerm}`
        );
      }

      // Category filter
      if (selectedCategories.length > 0) {
        query = query.in('category', selectedCategories);
      }

      // Date range filter
      if (dateRange.from) {
        query = query.gte('published_at', dateRange.from.toISOString());
      }
      if (dateRange.to) {
        const endOfDay = new Date(dateRange.to);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte('published_at', endOfDay.toISOString());
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      return data;
    },
  });

  const toggleCategory = (category: ArticleCategory) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setDateRange({ from: undefined, to: undefined });
  };

  const hasActiveFilters = selectedCategories.length > 0 || dateRange.from || dateRange.to;

  const getTitle = (article: any) => language === 'om' ? article.title_om : article.title_en;
  const getExcerpt = (article: any) => language === 'om' ? article.excerpt_om : article.excerpt_en;

  // Filter sidebar content
  const FilterContent = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="font-medium mb-3">{t('home.categories')}</h3>
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category} className="flex items-center space-x-2">
              <Checkbox
                id={`cat-${category}`}
                checked={selectedCategories.includes(category)}
                onCheckedChange={() => toggleCategory(category)}
              />
              <Label 
                htmlFor={`cat-${category}`}
                className="text-sm cursor-pointer"
              >
                {t(`categories.${category}`)}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Date Range */}
      <div>
        <h3 className="font-medium mb-3">
          {language === 'om' ? 'Guyyaa' : 'Date Range'}
        </h3>
        <div className="space-y-3">
          {/* From Date */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">
              {language === 'om' ? 'Irraa' : 'From'}
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRange.from && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {dateRange.from ? format(dateRange.from, "PPP") : (
                    <span>{language === 'om' ? 'Guyyaa filadhu' : 'Pick a date'}</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={dateRange.from}
                  onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* To Date */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">
              {language === 'om' ? 'Hanga' : 'To'}
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRange.to && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {dateRange.to ? format(dateRange.to, "PPP") : (
                    <span>{language === 'om' ? 'Guyyaa filadhu' : 'Pick a date'}</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={dateRange.to}
                  onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                  disabled={(date) => dateRange.from ? date < dateRange.from : false}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {hasActiveFilters && (
        <>
          <Separator />
          <Button 
            variant="outline" 
            className="w-full"
            onClick={clearFilters}
          >
            <X className="w-4 h-4 mr-2" />
            {language === 'om' ? 'Filtera Haqii' : 'Clear Filters'}
          </Button>
        </>
      )}
    </div>
  );

  return (
    <Layout>
      <div className="container py-6 md:py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            {language === 'om' ? 'Barbaadi' : 'Search'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'om' 
              ? 'Barruulee fi odeeffannoo barbaadi'
              : 'Find articles and news content'}
          </p>
        </div>

        {/* Search Bar */}
        <div className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder={language === 'om' ? 'Barruulee barbaadi...' : 'Search articles...'}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 h-12 text-base"
              autoFocus
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => handleSearchChange('')}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          
          {/* Mobile Filter Button */}
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-12 w-12 lg:hidden relative">
                <Filter className="w-5 h-5" />
                {hasActiveFilters && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle>{language === 'om' ? 'Filtera' : 'Filters'}</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <FilterContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Active Filters Display */}
        <AnimatePresence>
          {hasActiveFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm text-muted-foreground">
                  {language === 'om' ? 'Filtera:' : 'Filters:'}
                </span>
                {selectedCategories.map((cat) => (
                  <Badge
                    key={cat}
                    variant="secondary"
                    className="cursor-pointer hover:bg-destructive/10"
                    onClick={() => toggleCategory(cat)}
                  >
                    {t(`categories.${cat}`)}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
                {dateRange.from && (
                  <Badge
                    variant="secondary"
                    className="cursor-pointer hover:bg-destructive/10"
                    onClick={() => setDateRange(prev => ({ ...prev, from: undefined }))}
                  >
                    {language === 'om' ? 'Irraa' : 'From'}: {format(dateRange.from, "PP")}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                )}
                {dateRange.to && (
                  <Badge
                    variant="secondary"
                    className="cursor-pointer hover:bg-destructive/10"
                    onClick={() => setDateRange(prev => ({ ...prev, to: undefined }))}
                  >
                    {language === 'om' ? 'Hanga' : 'To'}: {format(dateRange.to, "PP")}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-destructive hover:text-destructive"
                >
                  {language === 'om' ? 'Hunda Haqii' : 'Clear All'}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-8">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden lg:block w-64 shrink-0">
            <Card>
              <CardContent className="pt-6">
                <FilterContent />
              </CardContent>
            </Card>
          </aside>

          {/* Results */}
          <div className="flex-1">
            {/* Results Count */}
            {!isLoading && articles && (
              <p className="text-sm text-muted-foreground mb-4">
                {articles.length === 0 
                  ? (language === 'om' ? 'Bu\'aa hin argamne' : 'No results found')
                  : (language === 'om' 
                      ? `Bu\'aa ${articles.length} argame`
                      : `${articles.length} result${articles.length === 1 ? '' : 's'} found`
                    )
                }
              </p>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <Skeleton className="w-32 h-24 rounded-md shrink-0" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-5 w-3/4" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-2/3" />
                          <div className="flex gap-2 pt-2">
                            <Skeleton className="h-5 w-16" />
                            <Skeleton className="h-5 w-20" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Results List */}
            {!isLoading && articles && (
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {articles.map((article, index) => (
                    <motion.div
                      key={article.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link to={`/article/${article.slug}`}>
                        <Card className="group hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex gap-4">
                              {/* Image */}
                              {article.featured_image ? (
                                <div className="w-32 h-24 md:w-40 md:h-28 rounded-md overflow-hidden shrink-0 bg-muted">
                                  <img
                                    src={article.featured_image}
                                    alt={getTitle(article)}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                </div>
                              ) : (
                                <div className="w-32 h-24 md:w-40 md:h-28 rounded-md shrink-0 bg-muted flex items-center justify-center">
                                  <FileText className="w-8 h-8 text-muted-foreground" />
                                </div>
                              )}

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <Badge variant="outline" className="shrink-0">
                                    {t(`categories.${article.category}`)}
                                  </Badge>
                                  {article.credibility_level && (
                                    <Badge 
                                      variant="secondary"
                                      className={cn(
                                        "shrink-0 text-xs",
                                        article.credibility_level === 'verified' && "bg-success/10 text-success",
                                        article.credibility_level === 'high' && "bg-success/10 text-success",
                                        article.credibility_level === 'medium' && "bg-warning/10 text-warning",
                                        article.credibility_level === 'low' && "bg-destructive/10 text-destructive"
                                      )}
                                    >
                                      {article.credibility_level}
                                    </Badge>
                                  )}
                                </div>

                                <h2 className="font-display font-semibold text-lg leading-tight mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                                  {getTitle(article)}
                                </h2>

                                {getExcerpt(article) && (
                                  <p className="text-muted-foreground text-sm line-clamp-2 mb-2">
                                    {getExcerpt(article)}
                                  </p>
                                )}

                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {article.published_at && format(new Date(article.published_at), 'PP')}
                                  </span>
                                  {article.view_count !== null && (
                                    <span className="flex items-center gap-1">
                                      <Eye className="w-3 h-3" />
                                      {article.view_count}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Empty State */}
                {articles.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-16"
                  >
                    <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-display text-xl font-semibold mb-2">
                      {language === 'om' ? 'Bu\'aa hin argamne' : 'No results found'}
                    </h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      {language === 'om'
                        ? 'Jecha barbaaddu jijjiiri ykn filtera haqii.'
                        : 'Try adjusting your search terms or clearing some filters.'}
                    </p>
                    {hasActiveFilters && (
                      <Button variant="outline" className="mt-4" onClick={clearFilters}>
                        {language === 'om' ? 'Filtera Haqii' : 'Clear Filters'}
                      </Button>
                    )}
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

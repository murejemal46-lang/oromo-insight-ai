-- Create a view for public article access that excludes sensitive fields
CREATE VIEW public.published_articles_public AS
SELECT 
  id,
  slug,
  title_om,
  title_en,
  content_om,
  content_en,
  excerpt_om,
  excerpt_en,
  category,
  featured_image,
  status,
  is_featured,
  view_count,
  credibility_level,
  ai_verification_score,
  ai_summary_om,
  ai_summary_en,
  published_at,
  created_at,
  updated_at
FROM public.articles
WHERE status = 'published';

-- Grant access to the view
GRANT SELECT ON public.published_articles_public TO anon, authenticated;
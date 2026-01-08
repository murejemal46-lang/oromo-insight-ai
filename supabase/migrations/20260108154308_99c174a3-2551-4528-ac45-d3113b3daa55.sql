-- Add review_notes column to articles for editor feedback
ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS review_notes TEXT,
ADD COLUMN IF NOT EXISTS reviewed_by UUID,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;

-- Create RLS policy for editors to view pending articles
CREATE POLICY "Editors can view pending articles" 
ON public.articles 
FOR SELECT 
USING (
  status = 'pending_review' 
  AND public.has_role(auth.uid(), 'editor')
);

-- Create RLS policy for editors to update article status
CREATE POLICY "Editors can review articles" 
ON public.articles 
FOR UPDATE 
USING (
  status = 'pending_review' 
  AND public.has_role(auth.uid(), 'editor')
);

-- Allow authors to see their own articles regardless of status
CREATE POLICY "Authors can view their own articles" 
ON public.articles 
FOR SELECT 
USING (auth.uid() = author_id);
-- Create comments table
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  moderated_by UUID,
  moderated_at TIMESTAMP WITH TIME ZONE,
  moderation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_comments_article_id ON public.comments(article_id);
CREATE INDEX idx_comments_parent_id ON public.comments(parent_id);
CREATE INDEX idx_comments_user_id ON public.comments(user_id);

-- Enable RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Anyone can view approved, non-hidden comments on published articles
CREATE POLICY "Anyone can view approved comments"
ON public.comments
FOR SELECT
USING (
  is_approved = true 
  AND is_hidden = false
  AND EXISTS (
    SELECT 1 FROM public.articles 
    WHERE articles.id = comments.article_id 
    AND articles.status = 'published'
  )
);

-- Users can view their own comments (even if not approved)
CREATE POLICY "Users can view their own comments"
ON public.comments
FOR SELECT
USING (auth.uid() = user_id);

-- Editors can view all comments for moderation
CREATE POLICY "Editors can view all comments"
ON public.comments
FOR SELECT
USING (
  has_role(auth.uid(), 'editor'::app_role) 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments"
ON public.comments
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.articles 
    WHERE articles.id = article_id 
    AND articles.status = 'published'
  )
);

-- Users can update their own comments
CREATE POLICY "Users can update their own comments"
ON public.comments
FOR UPDATE
USING (auth.uid() = user_id AND is_approved = false);

-- Editors can moderate comments
CREATE POLICY "Editors can moderate comments"
ON public.comments
FOR UPDATE
USING (
  has_role(auth.uid(), 'editor'::app_role) 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
ON public.comments
FOR DELETE
USING (auth.uid() = user_id);

-- Editors can delete any comment
CREATE POLICY "Editors can delete any comment"
ON public.comments
FOR DELETE
USING (
  has_role(auth.uid(), 'editor'::app_role) 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Create trigger for updated_at
CREATE TRIGGER update_comments_updated_at
BEFORE UPDATE ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
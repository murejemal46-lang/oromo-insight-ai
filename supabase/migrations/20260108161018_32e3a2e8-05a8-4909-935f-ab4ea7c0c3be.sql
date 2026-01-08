-- Add 'journalist' to app_role enum if not exists
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'journalist';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';

-- Create journalist requests table
CREATE TABLE public.journalist_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  portfolio_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, status)
);

-- Enable RLS
ALTER TABLE public.journalist_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view their own requests"
ON public.journalist_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own requests (only if no pending request exists)
CREATE POLICY "Users can create journalist requests"
ON public.journalist_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Admins can view all requests
CREATE POLICY "Admins can view all requests"
ON public.journalist_requests
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admins can update requests (approve/reject)
CREATE POLICY "Admins can update requests"
ON public.journalist_requests
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Update articles RLS policies to require journalist role
DROP POLICY IF EXISTS "Authenticated users can create articles" ON public.articles;
DROP POLICY IF EXISTS "Authors can update their own articles" ON public.articles;

-- Only journalists can create articles
CREATE POLICY "Journalists can create articles"
ON public.articles
FOR INSERT
WITH CHECK (
  auth.uid() = author_id AND 
  (has_role(auth.uid(), 'journalist') OR has_role(auth.uid(), 'editor') OR has_role(auth.uid(), 'admin'))
);

-- Only journalists can update their own articles (draft/revision status)
CREATE POLICY "Journalists can update their own articles"
ON public.articles
FOR UPDATE
USING (
  auth.uid() = author_id AND 
  (has_role(auth.uid(), 'journalist') OR has_role(auth.uid(), 'editor') OR has_role(auth.uid(), 'admin'))
);

-- Trigger for updated_at
CREATE TRIGGER update_journalist_requests_updated_at
BEFORE UPDATE ON public.journalist_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
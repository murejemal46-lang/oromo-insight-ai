-- Create enum for article status
CREATE TYPE public.article_status AS ENUM ('draft', 'pending_review', 'published', 'archived');

-- Create enum for article category
CREATE TYPE public.article_category AS ENUM ('politics', 'business', 'culture', 'sports', 'technology', 'health', 'education', 'world');

-- Create enum for AI action type
CREATE TYPE public.ai_action_type AS ENUM ('verify', 'summarize', 'explain');

-- Create enum for credibility level
CREATE TYPE public.credibility_level AS ENUM ('low', 'medium', 'high', 'verified');

-- Create articles table with multilingual support
CREATE TABLE public.articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title_om TEXT NOT NULL,
  title_en TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt_om TEXT,
  excerpt_en TEXT,
  content_om TEXT NOT NULL,
  content_en TEXT NOT NULL,
  category article_category NOT NULL DEFAULT 'politics',
  status article_status NOT NULL DEFAULT 'draft',
  featured_image TEXT,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ai_summary_om TEXT,
  ai_summary_en TEXT,
  ai_verification_score DECIMAL(3,2),
  ai_verification_sources JSONB DEFAULT '[]'::jsonb,
  ai_last_verified TIMESTAMP WITH TIME ZONE,
  credibility_level credibility_level,
  view_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create AI logs table
CREATE TABLE public.ai_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action ai_action_type NOT NULL,
  language TEXT NOT NULL DEFAULT 'om',
  input_text TEXT,
  result TEXT,
  confidence_score DECIMAL(3,2),
  sources JSONB DEFAULT '[]'::jsonb,
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  preferred_language TEXT NOT NULL DEFAULT 'om',
  ai_usage_count INTEGER DEFAULT 0,
  ai_usage_limit INTEGER DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user roles enum and table
CREATE TYPE public.app_role AS ENUM ('admin', 'editor', 'journalist', 'reader');

CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'reader',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on all tables
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Articles policies (public read for published, restricted write)
CREATE POLICY "Anyone can view published articles"
ON public.articles FOR SELECT
USING (status = 'published');

CREATE POLICY "Authenticated users can create articles"
ON public.articles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own articles"
ON public.articles FOR UPDATE
TO authenticated
USING (auth.uid() = author_id);

-- AI logs policies
CREATE POLICY "Users can view their own AI logs"
ON public.ai_logs FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create AI logs"
ON public.ai_logs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Profiles policies
CREATE POLICY "Users can view all profiles"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- User roles policies (security definer function to check roles)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, preferred_language)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', COALESCE(NEW.raw_user_meta_data ->> 'preferred_language', 'om'));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'reader');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for timestamp updates
CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
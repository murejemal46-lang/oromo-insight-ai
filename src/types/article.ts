export type ArticleStatus = 'draft' | 'pending_review' | 'published' | 'archived';

export type ArticleCategory = 
  | 'politics' 
  | 'business' 
  | 'culture' 
  | 'sports' 
  | 'technology' 
  | 'health' 
  | 'education' 
  | 'world';

export type CredibilityLevel = 'low' | 'medium' | 'high' | 'verified';

export interface Article {
  id: string;
  title_om: string;
  title_en: string;
  slug: string;
  excerpt_om?: string;
  excerpt_en?: string;
  content_om: string;
  content_en: string;
  category: ArticleCategory;
  status: ArticleStatus;
  featured_image?: string;
  author_id?: string;
  ai_summary_om?: string;
  ai_summary_en?: string;
  ai_verification_score?: number;
  ai_verification_sources?: VerificationSource[];
  ai_last_verified?: string;
  credibility_level?: CredibilityLevel;
  view_count: number;
  is_featured: boolean;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface VerificationSource {
  name: string;
  url: string;
  reliability: 'high' | 'medium' | 'low';
}

export interface AIActionResult {
  success: boolean;
  result: string;
  confidence_score?: number;
  sources?: VerificationSource[];
  processing_time_ms?: number;
}

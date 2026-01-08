export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_logs: {
        Row: {
          action: Database["public"]["Enums"]["ai_action_type"]
          article_id: string | null
          confidence_score: number | null
          created_at: string
          id: string
          input_text: string | null
          language: string
          processing_time_ms: number | null
          result: string | null
          sources: Json | null
          user_id: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["ai_action_type"]
          article_id?: string | null
          confidence_score?: number | null
          created_at?: string
          id?: string
          input_text?: string | null
          language?: string
          processing_time_ms?: number | null
          result?: string | null
          sources?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["ai_action_type"]
          article_id?: string | null
          confidence_score?: number | null
          created_at?: string
          id?: string
          input_text?: string | null
          language?: string
          processing_time_ms?: number | null
          result?: string | null
          sources?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_logs_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_logs_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "published_articles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          ai_last_verified: string | null
          ai_summary_en: string | null
          ai_summary_om: string | null
          ai_verification_score: number | null
          ai_verification_sources: Json | null
          author_id: string | null
          category: Database["public"]["Enums"]["article_category"]
          content_en: string
          content_om: string
          created_at: string
          credibility_level:
            | Database["public"]["Enums"]["credibility_level"]
            | null
          excerpt_en: string | null
          excerpt_om: string | null
          featured_image: string | null
          id: string
          is_featured: boolean | null
          published_at: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          slug: string
          status: Database["public"]["Enums"]["article_status"]
          title_en: string
          title_om: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          ai_last_verified?: string | null
          ai_summary_en?: string | null
          ai_summary_om?: string | null
          ai_verification_score?: number | null
          ai_verification_sources?: Json | null
          author_id?: string | null
          category?: Database["public"]["Enums"]["article_category"]
          content_en: string
          content_om: string
          created_at?: string
          credibility_level?:
            | Database["public"]["Enums"]["credibility_level"]
            | null
          excerpt_en?: string | null
          excerpt_om?: string | null
          featured_image?: string | null
          id?: string
          is_featured?: boolean | null
          published_at?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          slug: string
          status?: Database["public"]["Enums"]["article_status"]
          title_en: string
          title_om: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          ai_last_verified?: string | null
          ai_summary_en?: string | null
          ai_summary_om?: string | null
          ai_verification_score?: number | null
          ai_verification_sources?: Json | null
          author_id?: string | null
          category?: Database["public"]["Enums"]["article_category"]
          content_en?: string
          content_om?: string
          created_at?: string
          credibility_level?:
            | Database["public"]["Enums"]["credibility_level"]
            | null
          excerpt_en?: string | null
          excerpt_om?: string | null
          featured_image?: string | null
          id?: string
          is_featured?: boolean | null
          published_at?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["article_status"]
          title_en?: string
          title_om?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: []
      }
      journalist_requests: {
        Row: {
          created_at: string
          id: string
          portfolio_url: string | null
          reason: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          portfolio_url?: string | null
          reason: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          portfolio_url?: string | null
          reason?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ai_usage_count: number | null
          ai_usage_limit: number | null
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          preferred_language: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_usage_count?: number | null
          ai_usage_limit?: number | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          preferred_language?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_usage_count?: number | null
          ai_usage_limit?: number | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          preferred_language?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      published_articles_public: {
        Row: {
          ai_summary_en: string | null
          ai_summary_om: string | null
          ai_verification_score: number | null
          category: Database["public"]["Enums"]["article_category"] | null
          content_en: string | null
          content_om: string | null
          created_at: string | null
          credibility_level:
            | Database["public"]["Enums"]["credibility_level"]
            | null
          excerpt_en: string | null
          excerpt_om: string | null
          featured_image: string | null
          id: string | null
          is_featured: boolean | null
          published_at: string | null
          slug: string | null
          status: Database["public"]["Enums"]["article_status"] | null
          title_en: string | null
          title_om: string | null
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          ai_summary_en?: string | null
          ai_summary_om?: string | null
          ai_verification_score?: number | null
          category?: Database["public"]["Enums"]["article_category"] | null
          content_en?: string | null
          content_om?: string | null
          created_at?: string | null
          credibility_level?:
            | Database["public"]["Enums"]["credibility_level"]
            | null
          excerpt_en?: string | null
          excerpt_om?: string | null
          featured_image?: string | null
          id?: string | null
          is_featured?: boolean | null
          published_at?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["article_status"] | null
          title_en?: string | null
          title_om?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          ai_summary_en?: string | null
          ai_summary_om?: string | null
          ai_verification_score?: number | null
          category?: Database["public"]["Enums"]["article_category"] | null
          content_en?: string | null
          content_om?: string | null
          created_at?: string | null
          credibility_level?:
            | Database["public"]["Enums"]["credibility_level"]
            | null
          excerpt_en?: string | null
          excerpt_om?: string | null
          featured_image?: string | null
          id?: string | null
          is_featured?: boolean | null
          published_at?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["article_status"] | null
          title_en?: string | null
          title_om?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      ai_action_type: "verify" | "summarize" | "explain"
      app_role: "admin" | "editor" | "journalist" | "reader"
      article_category:
        | "politics"
        | "business"
        | "culture"
        | "sports"
        | "technology"
        | "health"
        | "education"
        | "world"
      article_status: "draft" | "pending_review" | "published" | "archived"
      credibility_level: "low" | "medium" | "high" | "verified"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      ai_action_type: ["verify", "summarize", "explain"],
      app_role: ["admin", "editor", "journalist", "reader"],
      article_category: [
        "politics",
        "business",
        "culture",
        "sports",
        "technology",
        "health",
        "education",
        "world",
      ],
      article_status: ["draft", "pending_review", "published", "archived"],
      credibility_level: ["low", "medium", "high", "verified"],
    },
  },
} as const

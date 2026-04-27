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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      academies: {
        Row: {
          academy_type: Database["public"]["Enums"]["academy_type"]
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          primary_language: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          academy_type: Database["public"]["Enums"]["academy_type"]
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          primary_language?: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          academy_type?: Database["public"]["Enums"]["academy_type"]
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          primary_language?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      access_codes: {
        Row: {
          code: string
          content_id: string
          created_at: string | null
          created_by: string
          current_uses: number | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          notes: string | null
        }
        Insert: {
          code: string
          content_id: string
          created_at?: string | null
          created_by: string
          current_uses?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          notes?: string | null
        }
        Update: {
          code?: string
          content_id?: string
          created_at?: string | null
          created_by?: string
          current_uses?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "access_codes_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_chat_sessions: {
        Row: {
          agent_key: string
          created_at: string | null
          credits_charged: number | null
          id: string
          is_active: boolean | null
          messages: Json | null
          session_expires_at: string | null
          session_started_at: string | null
          talent_id: string
          updated_at: string | null
        }
        Insert: {
          agent_key: string
          created_at?: string | null
          credits_charged?: number | null
          id?: string
          is_active?: boolean | null
          messages?: Json | null
          session_expires_at?: string | null
          session_started_at?: string | null
          talent_id: string
          updated_at?: string | null
        }
        Update: {
          agent_key?: string
          created_at?: string | null
          credits_charged?: number | null
          id?: string
          is_active?: boolean | null
          messages?: Json | null
          session_expires_at?: string | null
          session_started_at?: string | null
          talent_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_chat_sessions_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agents: {
        Row: {
          agent_key: string
          agent_type: string | null
          avatar_url: string | null
          average_rating: number | null
          bg_color: string | null
          capabilities: string[] | null
          category: string | null
          color: string | null
          company_id: string | null
          created_at: string | null
          credit_cost: number | null
          delivery_credit_cost: number | null
          description: string
          display_order: number | null
          expertise_areas: string[] | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          monthly_target: number | null
          name: string
          personality_traits: Json | null
          sample_conversations: Json | null
          session_duration_minutes: number | null
          system_prompt: string
          total_conversations: number | null
          updated_at: string | null
        }
        Insert: {
          agent_key: string
          agent_type?: string | null
          avatar_url?: string | null
          average_rating?: number | null
          bg_color?: string | null
          capabilities?: string[] | null
          category?: string | null
          color?: string | null
          company_id?: string | null
          created_at?: string | null
          credit_cost?: number | null
          delivery_credit_cost?: number | null
          description: string
          display_order?: number | null
          expertise_areas?: string[] | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          monthly_target?: number | null
          name: string
          personality_traits?: Json | null
          sample_conversations?: Json | null
          session_duration_minutes?: number | null
          system_prompt: string
          total_conversations?: number | null
          updated_at?: string | null
        }
        Update: {
          agent_key?: string
          agent_type?: string | null
          avatar_url?: string | null
          average_rating?: number | null
          bg_color?: string | null
          capabilities?: string[] | null
          category?: string | null
          color?: string | null
          company_id?: string | null
          created_at?: string | null
          credit_cost?: number | null
          delivery_credit_cost?: number | null
          description?: string
          display_order?: number | null
          expertise_areas?: string[] | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          monthly_target?: number | null
          name?: string
          personality_traits?: Json | null
          sample_conversations?: Json | null
          session_duration_minutes?: number | null
          system_prompt?: string
          total_conversations?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_agents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_chat_sessions: {
        Row: {
          ai_instructor_id: string
          context_id: string | null
          context_type: string
          created_at: string | null
          id: string
          is_active: boolean | null
          messages: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          ai_instructor_id: string
          context_id?: string | null
          context_type?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          messages?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          ai_instructor_id?: string
          context_id?: string | null
          context_type?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          messages?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_sessions_ai_instructor_id_fkey"
            columns: ["ai_instructor_id"]
            isOneToOne: false
            referencedRelation: "ai_instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_instructors: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          expertise_areas: string[] | null
          id: string
          is_active: boolean | null
          name: string
          persona: string
          profession_line_id: string
          system_prompt: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          expertise_areas?: string[] | null
          id?: string
          is_active?: boolean | null
          name: string
          persona: string
          profession_line_id: string
          system_prompt: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          expertise_areas?: string[] | null
          id?: string
          is_active?: boolean | null
          name?: string
          persona?: string
          profession_line_id?: string
          system_prompt?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_instructors_profession_line_id_fkey"
            columns: ["profession_line_id"]
            isOneToOne: true
            referencedRelation: "profession_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_job_recommendations: {
        Row: {
          generated_at: string
          id: string
          job_id: string
          match_score: number
          reason: string | null
          talent_id: string
        }
        Insert: {
          generated_at?: string
          id?: string
          job_id: string
          match_score?: number
          reason?: string | null
          talent_id: string
        }
        Update: {
          generated_at?: string
          id?: string
          job_id?: string
          match_score?: number
          reason?: string | null
          talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_job_recommendations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_job_recommendations_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_recommendations: {
        Row: {
          career_insights: Json | null
          created_at: string | null
          expires_at: string | null
          generated_at: string | null
          id: string
          recommendations: Json
          talent_id: string
        }
        Insert: {
          career_insights?: Json | null
          created_at?: string | null
          expires_at?: string | null
          generated_at?: string | null
          id?: string
          recommendations?: Json
          talent_id: string
        }
        Update: {
          career_insights?: Json | null
          created_at?: string | null
          expires_at?: string | null
          generated_at?: string | null
          id?: string
          recommendations?: Json
          talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_recommendations_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_access_codes: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          email: string
          expires_at: string | null
          id: string
          is_used: boolean | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          email: string
          expires_at?: string | null
          id?: string
          is_used?: boolean | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          is_used?: boolean | null
        }
        Relationships: []
      }
      assessment_questions: {
        Row: {
          category: string
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          options: Json | null
          profession_category_id: string | null
          question_text: string
          question_type: Database["public"]["Enums"]["question_type"]
          weight: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          options?: Json | null
          profession_category_id?: string | null
          question_text: string
          question_type?: Database["public"]["Enums"]["question_type"]
          weight?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          options?: Json | null
          profession_category_id?: string | null
          question_text?: string
          question_type?: Database["public"]["Enums"]["question_type"]
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_questions_profession_category_id_fkey"
            columns: ["profession_category_id"]
            isOneToOne: false
            referencedRelation: "profession_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      banners: {
        Row: {
          created_at: string | null
          created_by: string
          display_order: number | null
          id: string
          image_url: string
          is_active: boolean | null
          link_content_id: string | null
          placement: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          display_order?: number | null
          id?: string
          image_url: string
          is_active?: boolean | null
          link_content_id?: string | null
          placement?: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          display_order?: number | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          link_content_id?: string | null
          placement?: string
        }
        Relationships: [
          {
            foreignKeyName: "banners_link_content_id_fkey"
            columns: ["link_content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
        ]
      }
      batch_uploads: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_log: Json | null
          failed_count: number | null
          file_count: number
          id: string
          processed_count: number | null
          skipped_count: number | null
          status: string
          uploaded_by: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_log?: Json | null
          failed_count?: number | null
          file_count?: number
          id?: string
          processed_count?: number | null
          skipped_count?: number | null
          status?: string
          uploaded_by?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_log?: Json | null
          failed_count?: number | null
          file_count?: number
          id?: string
          processed_count?: number | null
          skipped_count?: number | null
          status?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string | null
          author_name: string | null
          category: string | null
          content: string | null
          created_at: string | null
          excerpt: string | null
          external_url: string | null
          featured_image: string | null
          id: string
          is_featured: boolean | null
          published_at: string | null
          reading_time_mins: number | null
          slug: string
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          views: number | null
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          external_url?: string | null
          featured_image?: string | null
          id?: string
          is_featured?: boolean | null
          published_at?: string | null
          reading_time_mins?: number | null
          slug: string
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          external_url?: string | null
          featured_image?: string | null
          id?: string
          is_featured?: boolean | null
          published_at?: string | null
          reading_time_mins?: number | null
          slug?: string
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "instructors_public"
            referencedColumns: ["id"]
          },
        ]
      }
      career_assessments: {
        Row: {
          ai_analysis: Json | null
          answers: Json
          created_at: string | null
          email: string
          expires_at: string | null
          full_name: string
          id: string
          improvement_areas: string[] | null
          max_score: number
          percentage: number
          phone: string | null
          profession_category_id: string
          readiness_level: Database["public"]["Enums"]["readiness_level"]
          talent_id: string | null
          total_score: number
          user_id: string | null
        }
        Insert: {
          ai_analysis?: Json | null
          answers: Json
          created_at?: string | null
          email: string
          expires_at?: string | null
          full_name: string
          id?: string
          improvement_areas?: string[] | null
          max_score?: number
          percentage?: number
          phone?: string | null
          profession_category_id: string
          readiness_level?: Database["public"]["Enums"]["readiness_level"]
          talent_id?: string | null
          total_score?: number
          user_id?: string | null
        }
        Update: {
          ai_analysis?: Json | null
          answers?: Json
          created_at?: string | null
          email?: string
          expires_at?: string | null
          full_name?: string
          id?: string
          improvement_areas?: string[] | null
          max_score?: number
          percentage?: number
          phone?: string | null
          profession_category_id?: string
          readiness_level?: Database["public"]["Enums"]["readiness_level"]
          talent_id?: string | null
          total_score?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "career_assessments_profession_category_id_fkey"
            columns: ["profession_category_id"]
            isOneToOne: false
            referencedRelation: "profession_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "career_assessments_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          content_id: string
          course_title: string
          created_at: string
          enrollment_id: string
          holder_name: string
          id: string
          issued_at: string
          percentage: number | null
          score: number | null
          talent_id: string
          total_questions: number | null
          verify_code: string
        }
        Insert: {
          content_id: string
          course_title: string
          created_at?: string
          enrollment_id: string
          holder_name: string
          id?: string
          issued_at?: string
          percentage?: number | null
          score?: number | null
          talent_id: string
          total_questions?: number | null
          verify_code?: string
        }
        Update: {
          content_id?: string
          course_title?: string
          created_at?: string
          enrollment_id?: string
          holder_name?: string
          id?: string
          issued_at?: string
          percentage?: number | null
          score?: number | null
          talent_id?: string
          total_questions?: number | null
          verify_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: true
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          created_at: string | null
          facebook_url: string | null
          id: string
          industry: string | null
          is_verified: boolean | null
          linkedin_url: string | null
          logo_url: string | null
          name: string
          notes: string | null
          primary_email: string | null
          secondary_emails: Json | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          facebook_url?: string | null
          id?: string
          industry?: string | null
          is_verified?: boolean | null
          linkedin_url?: string | null
          logo_url?: string | null
          name: string
          notes?: string | null
          primary_email?: string | null
          secondary_emails?: Json | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          facebook_url?: string | null
          id?: string
          industry?: string | null
          is_verified?: boolean | null
          linkedin_url?: string | null
          logo_url?: string | null
          name?: string
          notes?: string | null
          primary_email?: string | null
          secondary_emails?: Json | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      company_agent_leads: {
        Row: {
          agent_id: string | null
          company_agent_id: string
          created_at: string | null
          id: string
          lead_company: string | null
          lead_email: string | null
          lead_interest: string | null
          lead_name: string | null
          lead_phone: string | null
          session_id: string | null
          status: string | null
          talent_id: string | null
        }
        Insert: {
          agent_id?: string | null
          company_agent_id: string
          created_at?: string | null
          id?: string
          lead_company?: string | null
          lead_email?: string | null
          lead_interest?: string | null
          lead_name?: string | null
          lead_phone?: string | null
          session_id?: string | null
          status?: string | null
          talent_id?: string | null
        }
        Update: {
          agent_id?: string | null
          company_agent_id?: string
          created_at?: string | null
          id?: string
          lead_company?: string | null
          lead_email?: string | null
          lead_interest?: string | null
          lead_name?: string | null
          lead_phone?: string | null
          session_id?: string | null
          status?: string | null
          talent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_agent_leads_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_agent_leads_company_agent_id_fkey"
            columns: ["company_agent_id"]
            isOneToOne: false
            referencedRelation: "company_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_agent_leads_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "agent_chat_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_agent_leads_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
        ]
      }
      company_agents: {
        Row: {
          agent_id: string
          company_id: string
          created_at: string | null
          credits_used: number | null
          id: string
          is_active: boolean | null
          lead_config: Json | null
          monthly_budget: number | null
          sponsorship_type: string | null
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          company_id: string
          created_at?: string | null
          credits_used?: number | null
          id?: string
          is_active?: boolean | null
          lead_config?: Json | null
          monthly_budget?: number | null
          sponsorship_type?: string | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          company_id?: string
          created_at?: string | null
          credits_used?: number | null
          id?: string
          is_active?: boolean | null
          lead_config?: Json | null
          monthly_budget?: number | null
          sponsorship_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_agents_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_agents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_submissions: {
        Row: {
          competition_id: string
          created_at: string | null
          description: string | null
          feedback: string | null
          id: string
          score: number | null
          status: string | null
          submission_data: Json | null
          submission_url: string | null
          submitted_at: string | null
          talent_id: string
          updated_at: string | null
        }
        Insert: {
          competition_id: string
          created_at?: string | null
          description?: string | null
          feedback?: string | null
          id?: string
          score?: number | null
          status?: string | null
          submission_data?: Json | null
          submission_url?: string | null
          submitted_at?: string | null
          talent_id: string
          updated_at?: string | null
        }
        Update: {
          competition_id?: string
          created_at?: string | null
          description?: string | null
          feedback?: string | null
          id?: string
          score?: number | null
          status?: string | null
          submission_data?: Json | null
          submission_url?: string | null
          submitted_at?: string | null
          talent_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competition_submissions_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_submissions_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
        ]
      }
      competitions: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          end_date: string | null
          featured_image: string | null
          id: string
          is_featured: boolean | null
          max_participants: number | null
          prizes: Json | null
          rules: string | null
          slug: string
          start_date: string | null
          status: string | null
          submission_deadline: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          featured_image?: string | null
          id?: string
          is_featured?: boolean | null
          max_participants?: number | null
          prizes?: Json | null
          rules?: string | null
          slug: string
          start_date?: string | null
          status?: string | null
          submission_deadline?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          featured_image?: string | null
          id?: string
          is_featured?: boolean | null
          max_participants?: number | null
          prizes?: Json | null
          rules?: string | null
          slug?: string
          start_date?: string | null
          status?: string | null
          submission_deadline?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      contact_outreach: {
        Row: {
          channel: string
          company_id: string | null
          contact_id: string | null
          id: string
          message_content: string | null
          message_type: string | null
          sent_at: string | null
          sent_by: string | null
          status: string | null
        }
        Insert: {
          channel: string
          company_id?: string | null
          contact_id?: string | null
          id?: string
          message_content?: string | null
          message_type?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string | null
        }
        Update: {
          channel?: string
          company_id?: string | null
          contact_id?: string | null
          id?: string
          message_content?: string | null
          message_type?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_outreach_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_outreach_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          company_id: string | null
          created_at: string | null
          department: string | null
          designation: string | null
          email: string | null
          full_name: string
          id: string
          is_primary: boolean | null
          last_contacted_at: string | null
          linkedin_url: string | null
          notes: string | null
          phone: string | null
          source: string | null
          updated_at: string | null
          whatsapp_number: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          department?: string | null
          designation?: string | null
          email?: string | null
          full_name: string
          id?: string
          is_primary?: boolean | null
          last_contacted_at?: string | null
          linkedin_url?: string | null
          notes?: string | null
          phone?: string | null
          source?: string | null
          updated_at?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          department?: string | null
          designation?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_primary?: boolean | null
          last_contacted_at?: string | null
          linkedin_url?: string | null
          notes?: string | null
          phone?: string | null
          source?: string | null
          updated_at?: string | null
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      content: {
        Row: {
          content_type: Database["public"]["Enums"]["content_type"]
          cover_image_url: string | null
          created_at: string | null
          credit_cost: number | null
          currency: string | null
          current_enrollment: number | null
          description: string | null
          display_order: number | null
          duration_hours: number | null
          estimated_hours: number | null
          event_date: string | null
          event_duration_minutes: number | null
          id: string
          instructor_name: string | null
          is_private: boolean | null
          is_published: boolean | null
          learning_objectives: Json | null
          max_capacity: number | null
          modules_count: number | null
          pass_threshold: number | null
          price: number | null
          profession_level_id: string | null
          profession_line_id: string | null
          quiz_enabled: boolean | null
          slug: string
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          venue_address: string | null
          venue_name: string | null
          whatsapp_group_link: string | null
          youtube_url: string | null
        }
        Insert: {
          content_type: Database["public"]["Enums"]["content_type"]
          cover_image_url?: string | null
          created_at?: string | null
          credit_cost?: number | null
          currency?: string | null
          current_enrollment?: number | null
          description?: string | null
          display_order?: number | null
          duration_hours?: number | null
          estimated_hours?: number | null
          event_date?: string | null
          event_duration_minutes?: number | null
          id?: string
          instructor_name?: string | null
          is_private?: boolean | null
          is_published?: boolean | null
          learning_objectives?: Json | null
          max_capacity?: number | null
          modules_count?: number | null
          pass_threshold?: number | null
          price?: number | null
          profession_level_id?: string | null
          profession_line_id?: string | null
          quiz_enabled?: boolean | null
          slug: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          venue_address?: string | null
          venue_name?: string | null
          whatsapp_group_link?: string | null
          youtube_url?: string | null
        }
        Update: {
          content_type?: Database["public"]["Enums"]["content_type"]
          cover_image_url?: string | null
          created_at?: string | null
          credit_cost?: number | null
          currency?: string | null
          current_enrollment?: number | null
          description?: string | null
          display_order?: number | null
          duration_hours?: number | null
          estimated_hours?: number | null
          event_date?: string | null
          event_duration_minutes?: number | null
          id?: string
          instructor_name?: string | null
          is_private?: boolean | null
          is_published?: boolean | null
          learning_objectives?: Json | null
          max_capacity?: number | null
          modules_count?: number | null
          pass_threshold?: number | null
          price?: number | null
          profession_level_id?: string | null
          profession_line_id?: string | null
          quiz_enabled?: boolean | null
          slug?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          venue_address?: string | null
          venue_name?: string | null
          whatsapp_group_link?: string | null
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_profession_level_id_fkey"
            columns: ["profession_level_id"]
            isOneToOne: false
            referencedRelation: "profession_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_profession_line_id_fkey"
            columns: ["profession_line_id"]
            isOneToOne: false
            referencedRelation: "profession_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      content_analytics: {
        Row: {
          clicked_at: string | null
          content_id: string | null
          id: string
          source: string
        }
        Insert: {
          clicked_at?: string | null
          content_id?: string | null
          id?: string
          source: string
        }
        Update: {
          clicked_at?: string | null
          content_id?: string | null
          id?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_analytics_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
        ]
      }
      content_instructors: {
        Row: {
          content_id: string
          created_at: string | null
          id: string
          instructor_id: string
          role: string | null
        }
        Insert: {
          content_id: string
          created_at?: string | null
          id?: string
          instructor_id: string
          role?: string | null
        }
        Update: {
          content_id?: string
          created_at?: string | null
          id?: string
          instructor_id?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_instructors_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_instructors_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_instructors_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors_public"
            referencedColumns: ["id"]
          },
        ]
      }
      content_share_logs: {
        Row: {
          channel: string
          content_id: string | null
          id: string
          shared_at: string | null
          shared_by: string | null
        }
        Insert: {
          channel: string
          content_id?: string | null
          id?: string
          shared_at?: string | null
          shared_by?: string | null
        }
        Update: {
          channel?: string
          content_id?: string | null
          id?: string
          shared_at?: string | null
          shared_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_share_logs_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          content_id: string
          created_at: string | null
          description: string | null
          display_order: number | null
          duration_minutes: number | null
          estimated_time_minutes: number | null
          id: string
          is_preview: boolean | null
          learning_objectives: string[] | null
          stage_order: number | null
          title: string
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          content_id: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          duration_minutes?: number | null
          estimated_time_minutes?: number | null
          id?: string
          is_preview?: boolean | null
          learning_objectives?: string[] | null
          stage_order?: number | null
          title: string
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          content_id?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          duration_minutes?: number | null
          estimated_time_minutes?: number | null
          id?: string
          is_preview?: boolean | null
          learning_objectives?: string[] | null
          stage_order?: number | null
          title?: string
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
        ]
      }
      course_sessions: {
        Row: {
          content_id: string
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          instructor_id: string | null
          meeting_link: string | null
          recording_link: string | null
          scheduled_date: string
          status: Database["public"]["Enums"]["session_status"]
          title: string
          updated_at: string
        }
        Insert: {
          content_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          instructor_id?: string | null
          meeting_link?: string | null
          recording_link?: string | null
          scheduled_date: string
          status?: Database["public"]["Enums"]["session_status"]
          title: string
          updated_at?: string
        }
        Update: {
          content_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          instructor_id?: string | null
          meeting_link?: string | null
          recording_link?: string | null
          scheduled_date?: string
          status?: Database["public"]["Enums"]["session_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_sessions_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_sessions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_sessions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors_public"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_invoices: {
        Row: {
          admin_notes: string | null
          approved_by: string | null
          bundle_credits: number
          bundle_price_local: number | null
          bundle_price_usd: number
          cancellation_reason: string | null
          channel: string
          created_at: string
          credit_transaction_id: string | null
          credits_disbursed: boolean
          currency: string
          id: string
          invoice_number: string | null
          paid_at: string | null
          payment_method: string | null
          payment_proof_url: string | null
          payment_reference: string | null
          status: string
          talent_id: string
          updated_at: string
          whatsapp_message_sent: boolean
        }
        Insert: {
          admin_notes?: string | null
          approved_by?: string | null
          bundle_credits: number
          bundle_price_local?: number | null
          bundle_price_usd: number
          cancellation_reason?: string | null
          channel?: string
          created_at?: string
          credit_transaction_id?: string | null
          credits_disbursed?: boolean
          currency?: string
          id?: string
          invoice_number?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_proof_url?: string | null
          payment_reference?: string | null
          status?: string
          talent_id: string
          updated_at?: string
          whatsapp_message_sent?: boolean
        }
        Update: {
          admin_notes?: string | null
          approved_by?: string | null
          bundle_credits?: number
          bundle_price_local?: number | null
          bundle_price_usd?: number
          cancellation_reason?: string | null
          channel?: string
          created_at?: string
          credit_transaction_id?: string | null
          credits_disbursed?: boolean
          currency?: string
          id?: string
          invoice_number?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_proof_url?: string | null
          payment_reference?: string | null
          status?: string
          talent_id?: string
          updated_at?: string
          whatsapp_message_sent?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "credit_invoices_credit_transaction_id_fkey"
            columns: ["credit_transaction_id"]
            isOneToOne: false
            referencedRelation: "credit_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_invoices_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string | null
          description: string | null
          id: string
          is_earned: boolean
          reference_id: string | null
          service_type: string | null
          talent_id: string
          transaction_type: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_earned?: boolean
          reference_id?: string | null
          service_type?: string | null
          talent_id: string
          transaction_type: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_earned?: boolean
          reference_id?: string | null
          service_type?: string | null
          talent_id?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
        ]
      }
      email_notifications_log: {
        Row: {
          created_at: string
          email_type: string
          error_message: string | null
          id: string
          metadata: Json | null
          recipient_email: string
          resend_id: string | null
          status: string
          talent_id: string
        }
        Insert: {
          created_at?: string
          email_type: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipient_email: string
          resend_id?: string | null
          status?: string
          talent_id: string
        }
        Update: {
          created_at?: string
          email_type?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipient_email?: string
          resend_id?: string | null
          status?: string
          talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_notifications_log_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      enrollment_stage_progress: {
        Row: {
          completed_stages: number[] | null
          created_at: string | null
          current_stage: number | null
          enrollment_id: string
          id: string
          module_id: string
          resource_view_states: Json | null
          updated_at: string | null
        }
        Insert: {
          completed_stages?: number[] | null
          created_at?: string | null
          current_stage?: number | null
          enrollment_id: string
          id?: string
          module_id: string
          resource_view_states?: Json | null
          updated_at?: string | null
        }
        Update: {
          completed_stages?: number[] | null
          created_at?: string | null
          current_stage?: number | null
          enrollment_id?: string
          id?: string
          module_id?: string
          resource_view_states?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enrollment_stage_progress_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollment_stage_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          completed_at: string | null
          content_id: string
          created_at: string | null
          current_module_id: string | null
          enrolled_at: string | null
          id: string
          last_accessed_at: string | null
          notes: string | null
          payment_amount: number | null
          progress: number | null
          status: Database["public"]["Enums"]["enrollment_status"] | null
          student_id: string
          talent_id: string | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          content_id: string
          created_at?: string | null
          current_module_id?: string | null
          enrolled_at?: string | null
          id?: string
          last_accessed_at?: string | null
          notes?: string | null
          payment_amount?: number | null
          progress?: number | null
          status?: Database["public"]["Enums"]["enrollment_status"] | null
          student_id: string
          talent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          content_id?: string
          created_at?: string | null
          current_module_id?: string | null
          enrolled_at?: string | null
          id?: string
          last_accessed_at?: string | null
          notes?: string | null
          payment_amount?: number | null
          progress?: number | null
          status?: Database["public"]["Enums"]["enrollment_status"] | null
          student_id?: string
          talent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_current_module_id_fkey"
            columns: ["current_module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
        ]
      }
      external_application_questions: {
        Row: {
          application_url: string
          created_at: string
          extraction_method: string
          id: string
          job_id: string | null
          questions: Json
          updated_at: string
        }
        Insert: {
          application_url: string
          created_at?: string
          extraction_method?: string
          id?: string
          job_id?: string | null
          questions?: Json
          updated_at?: string
        }
        Update: {
          application_url?: string
          created_at?: string
          extraction_method?: string
          id?: string
          job_id?: string | null
          questions?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "external_application_questions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_interactions: {
        Row: {
          created_at: string | null
          id: string
          interaction_type: string
          item_id: string
          item_type: string
          talent_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          interaction_type: string
          item_id: string
          item_type: string
          talent_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          interaction_type?: string
          item_id?: string
          item_type?: string
          talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_interactions_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_posts: {
        Row: {
          author_avatar: string | null
          author_name: string
          author_title: string | null
          content_type: Database["public"]["Enums"]["post_content_type"]
          created_at: string | null
          id: string
          is_active: boolean | null
          is_pinned: boolean | null
          link_preview: Json | null
          link_url: string | null
          media_url: string | null
          poll_ends_at: string | null
          poll_options: Json | null
          status: string
          tags: string[] | null
          talent_id: string | null
          text_content: string
          updated_at: string | null
        }
        Insert: {
          author_avatar?: string | null
          author_name: string
          author_title?: string | null
          content_type?: Database["public"]["Enums"]["post_content_type"]
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_pinned?: boolean | null
          link_preview?: Json | null
          link_url?: string | null
          media_url?: string | null
          poll_ends_at?: string | null
          poll_options?: Json | null
          status?: string
          tags?: string[] | null
          talent_id?: string | null
          text_content: string
          updated_at?: string | null
        }
        Update: {
          author_avatar?: string | null
          author_name?: string
          author_title?: string | null
          content_type?: Database["public"]["Enums"]["post_content_type"]
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_pinned?: boolean | null
          link_preview?: Json | null
          link_url?: string | null
          media_url?: string | null
          poll_ends_at?: string | null
          poll_options?: Json | null
          status?: string
          tags?: string[] | null
          talent_id?: string | null
          text_content?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feed_posts_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
        ]
      }
      gig_share_logs: {
        Row: {
          channel: string
          gig_submission_id: string | null
          id: string
          job_id: string | null
          shared_at: string
          talent_id: string
        }
        Insert: {
          channel: string
          gig_submission_id?: string | null
          id?: string
          job_id?: string | null
          shared_at?: string
          talent_id: string
        }
        Update: {
          channel?: string
          gig_submission_id?: string | null
          id?: string
          job_id?: string | null
          shared_at?: string
          talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gig_share_logs_gig_submission_id_fkey"
            columns: ["gig_submission_id"]
            isOneToOne: false
            referencedRelation: "gig_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gig_share_logs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gig_share_logs_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
        ]
      }
      gig_submissions: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          credits_awarded: number | null
          gig_id: string
          id: string
          reviewed_at: string | null
          status: string
          submission_data: Json | null
          talent_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          credits_awarded?: number | null
          gig_id: string
          id?: string
          reviewed_at?: string | null
          status?: string
          submission_data?: Json | null
          talent_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          credits_awarded?: number | null
          gig_id?: string
          id?: string
          reviewed_at?: string | null
          status?: string
          submission_data?: Json | null
          talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gig_submissions_gig_id_fkey"
            columns: ["gig_id"]
            isOneToOne: false
            referencedRelation: "gigs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gig_submissions_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
        ]
      }
      gigs: {
        Row: {
          category: string
          created_at: string | null
          credit_reward: number
          description: string
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          max_completions_per_user: number | null
          requirements: string | null
          title: string
          total_budget: number | null
          total_completed: number | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          credit_reward?: number
          description: string
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          max_completions_per_user?: number | null
          requirements?: string | null
          title: string
          total_budget?: number | null
          total_completed?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          credit_reward?: number
          description?: string
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          max_completions_per_user?: number | null
          requirements?: string | null
          title?: string
          total_budget?: number | null
          total_completed?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ielts_resource_access: {
        Row: {
          id: string
          purchased_at: string
          resource_id: string
          talent_id: string
        }
        Insert: {
          id?: string
          purchased_at?: string
          resource_id: string
          talent_id: string
        }
        Update: {
          id?: string
          purchased_at?: string
          resource_id?: string
          talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ielts_resource_access_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "ielts_resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ielts_resource_access_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
        ]
      }
      ielts_resources: {
        Row: {
          content_data: Json | null
          content_type: string
          content_url: string | null
          created_at: string | null
          description: string | null
          difficulty_level: string | null
          display_order: number | null
          duration_mins: number | null
          id: string
          is_active: boolean | null
          is_free: boolean | null
          section: string
          title: string
          updated_at: string | null
        }
        Insert: {
          content_data?: Json | null
          content_type: string
          content_url?: string | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          display_order?: number | null
          duration_mins?: number | null
          id?: string
          is_active?: boolean | null
          is_free?: boolean | null
          section: string
          title: string
          updated_at?: string | null
        }
        Update: {
          content_data?: Json | null
          content_type?: string
          content_url?: string | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          display_order?: number | null
          duration_mins?: number | null
          id?: string
          is_active?: boolean | null
          is_free?: boolean | null
          section?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      instructors: {
        Row: {
          bank_details: Json | null
          bio: string | null
          created_at: string | null
          email: string
          expertise: string[] | null
          full_name: string
          hourly_rate: number | null
          id: string
          phone: string | null
          profile_image_url: string | null
          social_links: Json | null
          status: string | null
          team_role: string
          updated_at: string | null
        }
        Insert: {
          bank_details?: Json | null
          bio?: string | null
          created_at?: string | null
          email: string
          expertise?: string[] | null
          full_name: string
          hourly_rate?: number | null
          id?: string
          phone?: string | null
          profile_image_url?: string | null
          social_links?: Json | null
          status?: string | null
          team_role: string
          updated_at?: string | null
        }
        Update: {
          bank_details?: Json | null
          bio?: string | null
          created_at?: string | null
          email?: string
          expertise?: string[] | null
          full_name?: string
          hourly_rate?: number | null
          id?: string
          phone?: string | null
          profile_image_url?: string | null
          social_links?: Json | null
          status?: string | null
          team_role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ir_email_communications: {
        Row: {
          ai_generated: boolean | null
          click_count: number | null
          content: string | null
          created_at: string | null
          email_type: string
          id: string
          investor_id: string | null
          open_count: number | null
          sent_at: string | null
          sent_by: string | null
          status: string | null
          subject: string
        }
        Insert: {
          ai_generated?: boolean | null
          click_count?: number | null
          content?: string | null
          created_at?: string | null
          email_type: string
          id?: string
          investor_id?: string | null
          open_count?: number | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string | null
          subject: string
        }
        Update: {
          ai_generated?: boolean | null
          click_count?: number | null
          content?: string | null
          created_at?: string | null
          email_type?: string
          id?: string
          investor_id?: string | null
          open_count?: number | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string | null
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "ir_email_communications_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "ir_investors"
            referencedColumns: ["id"]
          },
        ]
      }
      ir_investor_interactions: {
        Row: {
          content: string | null
          created_at: string | null
          created_by: string | null
          follow_up_date: string | null
          follow_up_needed: boolean | null
          id: string
          interaction_type: string
          investor_id: string | null
          key_points: string[] | null
          sentiment: string | null
          subject: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          follow_up_date?: string | null
          follow_up_needed?: boolean | null
          id?: string
          interaction_type: string
          investor_id?: string | null
          key_points?: string[] | null
          sentiment?: string | null
          subject?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          follow_up_date?: string | null
          follow_up_needed?: boolean | null
          id?: string
          interaction_type?: string
          investor_id?: string | null
          key_points?: string[] | null
          sentiment?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ir_investor_interactions_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "ir_investors"
            referencedColumns: ["id"]
          },
        ]
      }
      ir_investors: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          investment_stage_pref: string | null
          investor_interests: string[] | null
          last_contacted_at: string | null
          last_feedback_summary: string | null
          linkedin_url: string | null
          notes: string | null
          phone: string | null
          relationship_summary: string | null
          subscription_status: string | null
          title: string | null
          twitter_handle: string | null
          updated_at: string | null
          vc_firm_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          investment_stage_pref?: string | null
          investor_interests?: string[] | null
          last_contacted_at?: string | null
          last_feedback_summary?: string | null
          linkedin_url?: string | null
          notes?: string | null
          phone?: string | null
          relationship_summary?: string | null
          subscription_status?: string | null
          title?: string | null
          twitter_handle?: string | null
          updated_at?: string | null
          vc_firm_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          investment_stage_pref?: string | null
          investor_interests?: string[] | null
          last_contacted_at?: string | null
          last_feedback_summary?: string | null
          linkedin_url?: string | null
          notes?: string | null
          phone?: string | null
          relationship_summary?: string | null
          subscription_status?: string | null
          title?: string | null
          twitter_handle?: string | null
          updated_at?: string | null
          vc_firm_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ir_investors_vc_firm_id_fkey"
            columns: ["vc_firm_id"]
            isOneToOne: false
            referencedRelation: "ir_vc_firms"
            referencedColumns: ["id"]
          },
        ]
      }
      ir_metrics_snapshots: {
        Row: {
          arr_usd: number | null
          created_at: string | null
          id: string
          mom_growth_rate: number | null
          mrr_usd: number | null
          paying_users: number | null
          service_breakdown: Json | null
          snapshot_date: string
          total_credits_consumed: number | null
          total_users: number | null
        }
        Insert: {
          arr_usd?: number | null
          created_at?: string | null
          id?: string
          mom_growth_rate?: number | null
          mrr_usd?: number | null
          paying_users?: number | null
          service_breakdown?: Json | null
          snapshot_date?: string
          total_credits_consumed?: number | null
          total_users?: number | null
        }
        Update: {
          arr_usd?: number | null
          created_at?: string | null
          id?: string
          mom_growth_rate?: number | null
          mrr_usd?: number | null
          paying_users?: number | null
          service_breakdown?: Json | null
          snapshot_date?: string
          total_credits_consumed?: number | null
          total_users?: number | null
        }
        Relationships: []
      }
      ir_monthly_targets: {
        Row: {
          active_talents: number | null
          actual_credits_consumed: number | null
          actual_mrr_usd: number | null
          closed_at: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_closed: boolean | null
          month: string
          mrr_target_usd: number
          notes: string | null
          service_actuals: Json | null
          service_mix: Json | null
          target_churn_rate: number | null
          target_paying_users: number | null
          total_talents: number | null
          updated_at: string | null
        }
        Insert: {
          active_talents?: number | null
          actual_credits_consumed?: number | null
          actual_mrr_usd?: number | null
          closed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_closed?: boolean | null
          month: string
          mrr_target_usd: number
          notes?: string | null
          service_actuals?: Json | null
          service_mix?: Json | null
          target_churn_rate?: number | null
          target_paying_users?: number | null
          total_talents?: number | null
          updated_at?: string | null
        }
        Update: {
          active_talents?: number | null
          actual_credits_consumed?: number | null
          actual_mrr_usd?: number | null
          closed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_closed?: boolean | null
          month?: string
          mrr_target_usd?: number
          notes?: string | null
          service_actuals?: Json | null
          service_mix?: Json | null
          target_churn_rate?: number | null
          target_paying_users?: number | null
          total_talents?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ir_vc_firms: {
        Row: {
          created_at: string | null
          id: string
          linkedin_url: string | null
          logo_url: string | null
          name: string
          notes: string | null
          sector_focus: string[] | null
          stage_focus: string[] | null
          status: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          linkedin_url?: string | null
          logo_url?: string | null
          name: string
          notes?: string | null
          sector_focus?: string[] | null
          stage_focus?: string[] | null
          status?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          linkedin_url?: string | null
          logo_url?: string | null
          name?: string
          notes?: string | null
          sector_focus?: string[] | null
          stage_focus?: string[] | null
          status?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      job_analytics: {
        Row: {
          clicked_at: string | null
          id: string
          job_id: string | null
          source: string
        }
        Insert: {
          clicked_at?: string | null
          id?: string
          job_id?: string | null
          source: string
        }
        Update: {
          clicked_at?: string | null
          id?: string
          job_id?: string | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_analytics_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_application_access_codes: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          email: string
          expires_at: string | null
          id: string
          is_used: boolean | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          email: string
          expires_at?: string | null
          id?: string
          is_used?: boolean | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          is_used?: boolean | null
        }
        Relationships: []
      }
      job_application_usage: {
        Row: {
          created_at: string | null
          free_applications_used: number | null
          id: string
          month_year: string
          paid_applications_count: number | null
          professional_id: string
          talent_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          free_applications_used?: number | null
          id?: string
          month_year: string
          paid_applications_count?: number | null
          professional_id: string
          talent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          free_applications_used?: number | null
          id?: string
          month_year?: string
          paid_applications_count?: number | null
          professional_id?: string
          talent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_application_usage_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_application_usage_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          added_by: string | null
          ai_match_rationale: string | null
          ai_match_score: number | null
          ai_scored_at: string | null
          applicant_notified_at: string | null
          application_status:
            | Database["public"]["Enums"]["application_status"]
            | null
          cover_letter: string | null
          created_at: string | null
          cv_url: string | null
          delivery_error: string | null
          delivery_status: Database["public"]["Enums"]["delivery_status"] | null
          external_notes: string | null
          id: string
          is_paid: boolean | null
          job_id: string
          professional_id: string | null
          source: string
          talent_id: string | null
        }
        Insert: {
          added_by?: string | null
          ai_match_rationale?: string | null
          ai_match_score?: number | null
          ai_scored_at?: string | null
          applicant_notified_at?: string | null
          application_status?:
            | Database["public"]["Enums"]["application_status"]
            | null
          cover_letter?: string | null
          created_at?: string | null
          cv_url?: string | null
          delivery_error?: string | null
          delivery_status?:
            | Database["public"]["Enums"]["delivery_status"]
            | null
          external_notes?: string | null
          id?: string
          is_paid?: boolean | null
          job_id: string
          professional_id?: string | null
          source?: string
          talent_id?: string | null
        }
        Update: {
          added_by?: string | null
          ai_match_rationale?: string | null
          ai_match_score?: number | null
          ai_scored_at?: string | null
          applicant_notified_at?: string | null
          application_status?:
            | Database["public"]["Enums"]["application_status"]
            | null
          cover_letter?: string | null
          created_at?: string | null
          cv_url?: string | null
          delivery_error?: string | null
          delivery_status?:
            | Database["public"]["Enums"]["delivery_status"]
            | null
          external_notes?: string | null
          id?: string
          is_paid?: boolean | null
          job_id?: string
          professional_id?: string | null
          source?: string
          talent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
        ]
      }
      job_apply_clicks: {
        Row: {
          clicked_at: string
          id: string
          job_id: string
          source: string
          talent_id: string | null
        }
        Insert: {
          clicked_at?: string
          id?: string
          job_id: string
          source?: string
          talent_id?: string | null
        }
        Update: {
          clicked_at?: string
          id?: string
          job_id?: string
          source?: string
          talent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_apply_clicks_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_apply_clicks_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
        ]
      }
      job_assessments: {
        Row: {
          ai_analysis: Json | null
          ai_score: number | null
          answers: Json | null
          completed_at: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          job_application_id: string | null
          job_id: string
          questions: Json
          started_at: string | null
          status: string
          talent_id: string
          voice_recordings: Json | null
        }
        Insert: {
          ai_analysis?: Json | null
          ai_score?: number | null
          answers?: Json | null
          completed_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          job_application_id?: string | null
          job_id: string
          questions: Json
          started_at?: string | null
          status?: string
          talent_id: string
          voice_recordings?: Json | null
        }
        Update: {
          ai_analysis?: Json | null
          ai_score?: number | null
          answers?: Json | null
          completed_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          job_application_id?: string | null
          job_id?: string
          questions?: Json
          started_at?: string | null
          status?: string
          talent_id?: string
          voice_recordings?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "job_assessments_job_application_id_fkey"
            columns: ["job_application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_assessments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_assessments_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
        ]
      }
      job_channel_posts: {
        Row: {
          caption: string | null
          channel: string
          id: string
          job_id: string
          posted_at: string
          posted_by: string | null
        }
        Insert: {
          caption?: string | null
          channel: string
          id?: string
          job_id: string
          posted_at?: string
          posted_by?: string | null
        }
        Update: {
          caption?: string | null
          channel?: string
          id?: string
          job_id?: string
          posted_at?: string
          posted_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_channel_posts_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_share_clicks: {
        Row: {
          clicked_at: string
          id: string
          ip_hash: string | null
          job_id: string
          ref_code: string
          talent_id: string
        }
        Insert: {
          clicked_at?: string
          id?: string
          ip_hash?: string | null
          job_id: string
          ref_code: string
          talent_id: string
        }
        Update: {
          clicked_at?: string
          id?: string
          ip_hash?: string | null
          job_id?: string
          ref_code?: string
          talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_share_clicks_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_share_clicks_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
        ]
      }
      job_share_logs: {
        Row: {
          channel: string
          id: string
          job_id: string | null
          shared_at: string | null
          shared_by: string | null
        }
        Insert: {
          channel: string
          id?: string
          job_id?: string | null
          shared_at?: string | null
          shared_by?: string | null
        }
        Update: {
          channel?: string
          id?: string
          job_id?: string | null
          shared_at?: string | null
          shared_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_share_logs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          ai_assessment_enabled: boolean | null
          ai_enhanced_description: string | null
          application_email: string | null
          application_type: Database["public"]["Enums"]["application_type"]
          application_url: string | null
          assessment_config: Json | null
          company_id: string | null
          company_logo_url: string | null
          company_name: string
          created_at: string | null
          deadline: string | null
          description: string
          experience_level: Database["public"]["Enums"]["experience_level"]
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          job_type: Database["public"]["Enums"]["job_type"]
          location: string | null
          posted_by: string | null
          preferred_skills: Json | null
          profession_category_id: string | null
          requirements: Json | null
          salary_currency: string | null
          salary_range_max: number | null
          salary_range_min: number | null
          source_image_url: string | null
          source_platform: Database["public"]["Enums"]["source_platform"] | null
          source_url: string | null
          title: string
          updated_at: string | null
          vacancies: number | null
        }
        Insert: {
          ai_assessment_enabled?: boolean | null
          ai_enhanced_description?: string | null
          application_email?: string | null
          application_type?: Database["public"]["Enums"]["application_type"]
          application_url?: string | null
          assessment_config?: Json | null
          company_id?: string | null
          company_logo_url?: string | null
          company_name: string
          created_at?: string | null
          deadline?: string | null
          description: string
          experience_level?: Database["public"]["Enums"]["experience_level"]
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          job_type?: Database["public"]["Enums"]["job_type"]
          location?: string | null
          posted_by?: string | null
          preferred_skills?: Json | null
          profession_category_id?: string | null
          requirements?: Json | null
          salary_currency?: string | null
          salary_range_max?: number | null
          salary_range_min?: number | null
          source_image_url?: string | null
          source_platform?:
            | Database["public"]["Enums"]["source_platform"]
            | null
          source_url?: string | null
          title: string
          updated_at?: string | null
          vacancies?: number | null
        }
        Update: {
          ai_assessment_enabled?: boolean | null
          ai_enhanced_description?: string | null
          application_email?: string | null
          application_type?: Database["public"]["Enums"]["application_type"]
          application_url?: string | null
          assessment_config?: Json | null
          company_id?: string | null
          company_logo_url?: string | null
          company_name?: string
          created_at?: string | null
          deadline?: string | null
          description?: string
          experience_level?: Database["public"]["Enums"]["experience_level"]
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          job_type?: Database["public"]["Enums"]["job_type"]
          location?: string | null
          posted_by?: string | null
          preferred_skills?: Json | null
          profession_category_id?: string | null
          requirements?: Json | null
          salary_currency?: string | null
          salary_range_max?: number | null
          salary_range_min?: number | null
          source_image_url?: string | null
          source_platform?:
            | Database["public"]["Enums"]["source_platform"]
            | null
          source_url?: string | null
          title?: string
          updated_at?: string | null
          vacancies?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_profession_category_id_fkey"
            columns: ["profession_category_id"]
            isOneToOne: false
            referencedRelation: "profession_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_targets: {
        Row: {
          created_at: string | null
          id: string
          metric_name: string
          period_start: string | null
          period_type: string | null
          target_value: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          metric_name: string
          period_start?: string | null
          period_type?: string | null
          target_value: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          metric_name?: string
          period_start?: string | null
          period_type?: string | null
          target_value?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      lead_hunt_matches: {
        Row: {
          ai_analysis: Json | null
          ai_match_score: number | null
          created_at: string | null
          id: string
          initial_score: number | null
          notes: string | null
          scored_at: string | null
          session_id: string
          shortlisted: boolean | null
          talent_id: string
        }
        Insert: {
          ai_analysis?: Json | null
          ai_match_score?: number | null
          created_at?: string | null
          id?: string
          initial_score?: number | null
          notes?: string | null
          scored_at?: string | null
          session_id: string
          shortlisted?: boolean | null
          talent_id: string
        }
        Update: {
          ai_analysis?: Json | null
          ai_match_score?: number | null
          created_at?: string | null
          id?: string
          initial_score?: number | null
          notes?: string | null
          scored_at?: string | null
          session_id?: string
          shortlisted?: boolean | null
          talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_hunt_matches_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "lead_hunt_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_hunt_matches_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_hunt_sessions: {
        Row: {
          company_name: string | null
          created_at: string | null
          created_by: string
          id: string
          job_description: string
          job_title: string
          leads_requested: number | null
          parsed_requirements: Json | null
          status: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          created_by: string
          id?: string
          job_description: string
          job_title: string
          leads_requested?: number | null
          parsed_requirements?: Json | null
          status?: string
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          created_by?: string
          id?: string
          job_description?: string
          job_title?: string
          leads_requested?: number | null
          parsed_requirements?: Json | null
          status?: string
        }
        Relationships: []
      }
      learning_activity: {
        Row: {
          activity_date: string
          created_at: string | null
          id: string
          minutes_learned: number | null
          modules_completed: number | null
          stages_completed: number | null
          talent_id: string
          updated_at: string | null
        }
        Insert: {
          activity_date?: string
          created_at?: string | null
          id?: string
          minutes_learned?: number | null
          modules_completed?: number | null
          stages_completed?: number | null
          talent_id: string
          updated_at?: string | null
        }
        Update: {
          activity_date?: string
          created_at?: string | null
          id?: string
          minutes_learned?: number | null
          modules_completed?: number | null
          stages_completed?: number | null
          talent_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_activity_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_bids: {
        Row: {
          bid_amount: number
          cover_letter: string
          created_at: string | null
          estimated_days: number | null
          gig_id: string
          id: string
          portfolio_links: Json | null
          status: string
          talent_id: string
          updated_at: string | null
        }
        Insert: {
          bid_amount: number
          cover_letter: string
          created_at?: string | null
          estimated_days?: number | null
          gig_id: string
          id?: string
          portfolio_links?: Json | null
          status?: string
          talent_id: string
          updated_at?: string | null
        }
        Update: {
          bid_amount?: number
          cover_letter?: string
          created_at?: string | null
          estimated_days?: number | null
          gig_id?: string
          id?: string
          portfolio_links?: Json | null
          status?: string
          talent_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_bids_gig_id_fkey"
            columns: ["gig_id"]
            isOneToOne: false
            referencedRelation: "marketplace_gigs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_bids_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_contracts: {
        Row: {
          agreed_amount: number
          bid_id: string
          completed_at: string | null
          created_at: string | null
          employer_name: string | null
          freelancer_id: string
          gig_id: string
          id: string
          started_at: string | null
          status: string
        }
        Insert: {
          agreed_amount?: number
          bid_id: string
          completed_at?: string | null
          created_at?: string | null
          employer_name?: string | null
          freelancer_id: string
          gig_id: string
          id?: string
          started_at?: string | null
          status?: string
        }
        Update: {
          agreed_amount?: number
          bid_id?: string
          completed_at?: string | null
          created_at?: string | null
          employer_name?: string | null
          freelancer_id?: string
          gig_id?: string
          id?: string
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_contracts_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: false
            referencedRelation: "marketplace_bids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_contracts_freelancer_id_fkey"
            columns: ["freelancer_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_contracts_gig_id_fkey"
            columns: ["gig_id"]
            isOneToOne: false
            referencedRelation: "marketplace_gigs"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_deliverables: {
        Row: {
          admin_notes: string | null
          contract_id: string
          created_at: string | null
          description: string | null
          file_url: string | null
          id: string
          reviewed_at: string | null
          status: string
          submitted_at: string | null
          title: string
        }
        Insert: {
          admin_notes?: string | null
          contract_id: string
          created_at?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          reviewed_at?: string | null
          status?: string
          submitted_at?: string | null
          title: string
        }
        Update: {
          admin_notes?: string | null
          contract_id?: string
          created_at?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          reviewed_at?: string | null
          status?: string
          submitted_at?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_deliverables_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "marketplace_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_gigs: {
        Row: {
          attachments: Json | null
          budget_amount: number | null
          budget_currency: string | null
          created_at: string | null
          deadline: string | null
          description: string
          employer_email: string | null
          employer_name: string | null
          id: string
          is_featured: boolean | null
          posted_by: string | null
          pricing_type: string
          requirements: string | null
          selected_bid_id: string | null
          skill_category: string
          skill_subcategory: string | null
          status: string
          title: string
          total_bids: number | null
          updated_at: string | null
        }
        Insert: {
          attachments?: Json | null
          budget_amount?: number | null
          budget_currency?: string | null
          created_at?: string | null
          deadline?: string | null
          description: string
          employer_email?: string | null
          employer_name?: string | null
          id?: string
          is_featured?: boolean | null
          posted_by?: string | null
          pricing_type?: string
          requirements?: string | null
          selected_bid_id?: string | null
          skill_category: string
          skill_subcategory?: string | null
          status?: string
          title: string
          total_bids?: number | null
          updated_at?: string | null
        }
        Update: {
          attachments?: Json | null
          budget_amount?: number | null
          budget_currency?: string | null
          created_at?: string | null
          deadline?: string | null
          description?: string
          employer_email?: string | null
          employer_name?: string | null
          id?: string
          is_featured?: boolean | null
          posted_by?: string | null
          pricing_type?: string
          requirements?: string | null
          selected_bid_id?: string | null
          skill_category?: string
          skill_subcategory?: string | null
          status?: string
          title?: string
          total_bids?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      marketplace_reviews: {
        Row: {
          comment: string | null
          contract_id: string
          created_at: string | null
          id: string
          rating: number
          reviewer_type: string
        }
        Insert: {
          comment?: string | null
          contract_id: string
          created_at?: string | null
          id?: string
          rating: number
          reviewer_type?: string
        }
        Update: {
          comment?: string | null
          contract_id?: string
          created_at?: string | null
          id?: string
          rating?: number
          reviewer_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_reviews_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "marketplace_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      mock_interview_access_codes: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          email: string
          expires_at: string | null
          id: string
          is_used: boolean | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          email: string
          expires_at?: string | null
          id?: string
          is_used?: boolean | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          is_used?: boolean | null
        }
        Relationships: []
      }
      mock_interviews: {
        Row: {
          additional_notes: string | null
          ai_feedback: Json | null
          answers: Json | null
          company_name: string | null
          completed_at: string | null
          created_at: string | null
          difficulty: string | null
          email: string
          expires_at: string | null
          full_name: string
          id: string
          improvement_areas: string[] | null
          job_description: string
          job_title: string | null
          performance_level: string | null
          phone: string | null
          profession_category_id: string | null
          question_count: number | null
          questions: Json | null
          selection_percentage: number | null
          started_at: string | null
          status: string | null
          strengths: string[] | null
          talent_id: string | null
          user_id: string | null
        }
        Insert: {
          additional_notes?: string | null
          ai_feedback?: Json | null
          answers?: Json | null
          company_name?: string | null
          completed_at?: string | null
          created_at?: string | null
          difficulty?: string | null
          email: string
          expires_at?: string | null
          full_name: string
          id?: string
          improvement_areas?: string[] | null
          job_description: string
          job_title?: string | null
          performance_level?: string | null
          phone?: string | null
          profession_category_id?: string | null
          question_count?: number | null
          questions?: Json | null
          selection_percentage?: number | null
          started_at?: string | null
          status?: string | null
          strengths?: string[] | null
          talent_id?: string | null
          user_id?: string | null
        }
        Update: {
          additional_notes?: string | null
          ai_feedback?: Json | null
          answers?: Json | null
          company_name?: string | null
          completed_at?: string | null
          created_at?: string | null
          difficulty?: string | null
          email?: string
          expires_at?: string | null
          full_name?: string
          id?: string
          improvement_areas?: string[] | null
          job_description?: string
          job_title?: string | null
          performance_level?: string | null
          phone?: string | null
          profession_category_id?: string | null
          question_count?: number | null
          questions?: Json | null
          selection_percentage?: number | null
          started_at?: string | null
          status?: string | null
          strengths?: string[] | null
          talent_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mock_interviews_profession_category_id_fkey"
            columns: ["profession_category_id"]
            isOneToOne: false
            referencedRelation: "profession_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mock_interviews_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
        ]
      }
      module_resources: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_required: boolean | null
          module_id: string
          resource_data: Json | null
          resource_type: Database["public"]["Enums"]["resource_type"]
          resource_url: string | null
          stage_number: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_required?: boolean | null
          module_id: string
          resource_data?: Json | null
          resource_type: Database["public"]["Enums"]["resource_type"]
          resource_url?: string | null
          stage_number?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_required?: boolean | null
          module_id?: string
          resource_data?: Json | null
          resource_type?: Database["public"]["Enums"]["resource_type"]
          resource_url?: string | null
          stage_number?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "module_resources_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          icon: string | null
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          read_at: string | null
          talent_id: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          read_at?: string | null
          talent_id: string
          title: string
          type: string
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          read_at?: string | null
          talent_id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_waitlist: {
        Row: {
          company_name: string | null
          email: string
          id: string
          notes: string | null
          notified_at: string | null
          submitted_at: string
        }
        Insert: {
          company_name?: string | null
          email: string
          id?: string
          notes?: string | null
          notified_at?: string | null
          submitted_at?: string
        }
        Update: {
          company_name?: string | null
          email?: string
          id?: string
          notes?: string | null
          notified_at?: string | null
          submitted_at?: string
        }
        Relationships: []
      }
      outreach_messages: {
        Row: {
          channel: string
          course_id: string | null
          created_at: string | null
          id: string
          message_content: string | null
          notes: string | null
          product: string
          sent_at: string | null
          sent_by: string | null
          talent_id: string
        }
        Insert: {
          channel?: string
          course_id?: string | null
          created_at?: string | null
          id?: string
          message_content?: string | null
          notes?: string | null
          product: string
          sent_at?: string | null
          sent_by?: string | null
          talent_id: string
        }
        Update: {
          channel?: string
          course_id?: string | null
          created_at?: string | null
          id?: string
          message_content?: string | null
          notes?: string | null
          product?: string
          sent_at?: string | null
          sent_by?: string | null
          talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outreach_messages_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outreach_messages_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          description: string | null
          id: string
          is_secret: boolean | null
          key: string
          updated_at: string | null
          updated_by: string | null
          value: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          is_secret?: boolean | null
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          is_secret?: boolean | null
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: string | null
        }
        Relationships: []
      }
      poll_votes: {
        Row: {
          id: string
          option_id: string
          post_id: string | null
          talent_id: string | null
          voted_at: string | null
        }
        Insert: {
          id?: string
          option_id: string
          post_id?: string | null
          talent_id?: string | null
          voted_at?: string | null
        }
        Update: {
          id?: string
          option_id?: string
          post_id?: string | null
          talent_id?: string | null
          voted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_requests: {
        Row: {
          achievements: string | null
          additional_notes: string | null
          admin_notes: string | null
          assigned_to: string | null
          certificates: Json | null
          created_at: string
          custom_profession: string | null
          cv_url: string | null
          delivered_at: string | null
          delivery_email_sent: boolean | null
          delivery_email_sent_at: string | null
          delivery_screenshot_url: string | null
          email: string
          full_name: string
          id: string
          payment_reference_url: string | null
          payment_status: string | null
          phone: string
          portfolio_credentials: Json | null
          portfolio_url: string | null
          profession_category_id: string | null
          profile_data: Json | null
          social_links: Json | null
          status: Database["public"]["Enums"]["portfolio_status"]
          talent_id: string | null
          updated_at: string
        }
        Insert: {
          achievements?: string | null
          additional_notes?: string | null
          admin_notes?: string | null
          assigned_to?: string | null
          certificates?: Json | null
          created_at?: string
          custom_profession?: string | null
          cv_url?: string | null
          delivered_at?: string | null
          delivery_email_sent?: boolean | null
          delivery_email_sent_at?: string | null
          delivery_screenshot_url?: string | null
          email: string
          full_name: string
          id?: string
          payment_reference_url?: string | null
          payment_status?: string | null
          phone: string
          portfolio_credentials?: Json | null
          portfolio_url?: string | null
          profession_category_id?: string | null
          profile_data?: Json | null
          social_links?: Json | null
          status?: Database["public"]["Enums"]["portfolio_status"]
          talent_id?: string | null
          updated_at?: string
        }
        Update: {
          achievements?: string | null
          additional_notes?: string | null
          admin_notes?: string | null
          assigned_to?: string | null
          certificates?: Json | null
          created_at?: string
          custom_profession?: string | null
          cv_url?: string | null
          delivered_at?: string | null
          delivery_email_sent?: boolean | null
          delivery_email_sent_at?: string | null
          delivery_screenshot_url?: string | null
          email?: string
          full_name?: string
          id?: string
          payment_reference_url?: string | null
          payment_status?: string | null
          phone?: string
          portfolio_credentials?: Json | null
          portfolio_url?: string | null
          profession_category_id?: string | null
          profile_data?: Json | null
          social_links?: Json | null
          status?: Database["public"]["Enums"]["portfolio_status"]
          talent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "instructors_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_requests_profession_category_id_fkey"
            columns: ["profession_category_id"]
            isOneToOne: false
            referencedRelation: "profession_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_requests_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reactions: {
        Row: {
          created_at: string | null
          id: string
          post_id: string | null
          reaction_type: Database["public"]["Enums"]["reaction_type"]
          talent_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          reaction_type: Database["public"]["Enums"]["reaction_type"]
          talent_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          reaction_type?: Database["public"]["Enums"]["reaction_type"]
          talent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_reactions_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
        ]
      }
      profession_categories: {
        Row: {
          career_outcome: string | null
          created_at: string | null
          credit_cost: number | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          school_id: string | null
          slug: string
          target_audience: string | null
        }
        Insert: {
          career_outcome?: string | null
          created_at?: string | null
          credit_cost?: number | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          school_id?: string | null
          slug: string
          target_audience?: string | null
        }
        Update: {
          career_outcome?: string | null
          created_at?: string | null
          credit_cost?: number | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          school_id?: string | null
          slug?: string
          target_audience?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profession_categories_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      profession_levels: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          level_type: Database["public"]["Enums"]["profession_level_type"]
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          level_type: Database["public"]["Enums"]["profession_level_type"]
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          level_type?: Database["public"]["Enums"]["profession_level_type"]
          name?: string
          slug?: string
        }
        Relationships: []
      }
      professionals: {
        Row: {
          achievements: Json | null
          created_at: string | null
          current_status: string | null
          custom_profession: string | null
          cv_url: string | null
          education: Json | null
          email: string
          experience: Json | null
          field_of_study: string | null
          full_name: string
          id: string
          institution: string | null
          is_featured: boolean | null
          languages: Json | null
          linkedin_url: string | null
          phone: string | null
          portfolio_credentials: Json | null
          portfolio_url: string | null
          profession_category_id: string | null
          profile_photo_url: string | null
          profile_type: string
          projects: Json | null
          services_used: Json | null
          skills: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          achievements?: Json | null
          created_at?: string | null
          current_status?: string | null
          custom_profession?: string | null
          cv_url?: string | null
          education?: Json | null
          email: string
          experience?: Json | null
          field_of_study?: string | null
          full_name: string
          id?: string
          institution?: string | null
          is_featured?: boolean | null
          languages?: Json | null
          linkedin_url?: string | null
          phone?: string | null
          portfolio_credentials?: Json | null
          portfolio_url?: string | null
          profession_category_id?: string | null
          profile_photo_url?: string | null
          profile_type?: string
          projects?: Json | null
          services_used?: Json | null
          skills?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          achievements?: Json | null
          created_at?: string | null
          current_status?: string | null
          custom_profession?: string | null
          cv_url?: string | null
          education?: Json | null
          email?: string
          experience?: Json | null
          field_of_study?: string | null
          full_name?: string
          id?: string
          institution?: string | null
          is_featured?: boolean | null
          languages?: Json | null
          linkedin_url?: string | null
          phone?: string | null
          portfolio_credentials?: Json | null
          portfolio_url?: string | null
          profession_category_id?: string | null
          profile_photo_url?: string | null
          profile_type?: string
          projects?: Json | null
          services_used?: Json | null
          skills?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professionals_profession_category_id_fkey"
            columns: ["profession_category_id"]
            isOneToOne: false
            referencedRelation: "profession_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          answers: Json
          completed_at: string | null
          content_id: string
          created_at: string | null
          enrollment_id: string
          id: string
          passed: boolean
          score: number
          student_id: string
          total_questions: number
        }
        Insert: {
          answers: Json
          completed_at?: string | null
          content_id: string
          created_at?: string | null
          enrollment_id: string
          id?: string
          passed: boolean
          score: number
          student_id: string
          total_questions: number
        }
        Update: {
          answers?: Json
          completed_at?: string | null
          content_id?: string
          created_at?: string | null
          enrollment_id?: string
          id?: string
          passed?: boolean
          score?: number
          student_id?: string
          total_questions?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          content_id: string
          correct_answer: string
          created_at: string | null
          display_order: number | null
          explanation: string | null
          id: string
          module_id: string | null
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question_text: string
          updated_at: string | null
        }
        Insert: {
          content_id: string
          correct_answer: string
          created_at?: string | null
          display_order?: number | null
          explanation?: string | null
          id?: string
          module_id?: string | null
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question_text: string
          updated_at?: string | null
        }
        Update: {
          content_id?: string
          correct_answer?: string
          created_at?: string | null
          display_order?: number | null
          explanation?: string | null
          id?: string
          module_id?: string | null
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          question_text?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_questions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_tracking: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          ip_hash: string
          request_count: number | null
          window_start: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          ip_hash: string
          request_count?: number | null
          window_start?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          ip_hash?: string
          request_count?: number | null
          window_start?: string | null
        }
        Relationships: []
      }
      salary_analyses: {
        Row: {
          ai_analysis: Json | null
          company_name: string | null
          completed_at: string | null
          created_at: string | null
          cv_text: string | null
          cv_url: string | null
          email: string
          expires_at: string | null
          full_name: string
          id: string
          job_description: string
          job_title: string | null
          market_salary_range: Json | null
          negotiation_tips: Json | null
          phone: string | null
          profession_category_id: string | null
          skills_gap: Json | null
          status: string | null
          talent_id: string | null
          user_id: string | null
        }
        Insert: {
          ai_analysis?: Json | null
          company_name?: string | null
          completed_at?: string | null
          created_at?: string | null
          cv_text?: string | null
          cv_url?: string | null
          email: string
          expires_at?: string | null
          full_name: string
          id?: string
          job_description: string
          job_title?: string | null
          market_salary_range?: Json | null
          negotiation_tips?: Json | null
          phone?: string | null
          profession_category_id?: string | null
          skills_gap?: Json | null
          status?: string | null
          talent_id?: string | null
          user_id?: string | null
        }
        Update: {
          ai_analysis?: Json | null
          company_name?: string | null
          completed_at?: string | null
          created_at?: string | null
          cv_text?: string | null
          cv_url?: string | null
          email?: string
          expires_at?: string | null
          full_name?: string
          id?: string
          job_description?: string
          job_title?: string | null
          market_salary_range?: Json | null
          negotiation_tips?: Json | null
          phone?: string | null
          profession_category_id?: string | null
          skills_gap?: Json | null
          status?: string | null
          talent_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salary_analyses_profession_category_id_fkey"
            columns: ["profession_category_id"]
            isOneToOne: false
            referencedRelation: "profession_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salary_analyses_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
        ]
      }
      salary_analysis_access_codes: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          email: string
          expires_at: string | null
          id: string
          is_used: boolean | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          email: string
          expires_at?: string | null
          id?: string
          is_used?: boolean | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          is_used?: boolean | null
        }
        Relationships: []
      }
      saved_items: {
        Row: {
          id: string
          item_id: string
          item_type: string
          saved_at: string
          talent_id: string
        }
        Insert: {
          id?: string
          item_id: string
          item_type: string
          saved_at?: string
          talent_id: string
        }
        Update: {
          id?: string
          item_id?: string
          item_type?: string
          saved_at?: string
          talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_items_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          academy_id: string
          created_at: string | null
          description: string | null
          display_order: number | null
          executive_capability_goal: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          academy_id: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          executive_capability_goal?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          academy_id?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          executive_capability_goal?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schools_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
        ]
      }
      service_analytics: {
        Row: {
          clicked_at: string | null
          id: string
          service_slug: string
          source: string
        }
        Insert: {
          clicked_at?: string | null
          id?: string
          service_slug: string
          source: string
        }
        Update: {
          clicked_at?: string | null
          id?: string
          service_slug?: string
          source?: string
        }
        Relationships: []
      }
      service_share_logs: {
        Row: {
          channel: string
          id: string
          service_slug: string
          shared_at: string | null
          shared_by: string | null
        }
        Insert: {
          channel: string
          id?: string
          service_slug: string
          shared_at?: string | null
          shared_by?: string | null
        }
        Update: {
          channel?: string
          id?: string
          service_slug?: string
          shared_at?: string | null
          shared_by?: string | null
        }
        Relationships: []
      }
      student_progress: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          last_watched_position: number | null
          module_id: string
          student_id: string
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          last_watched_position?: number | null
          module_id: string
          student_id: string
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          last_watched_position?: number | null
          module_id?: string
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_resource_progress: {
        Row: {
          attempts: number | null
          completed_at: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          progress_data: Json | null
          resource_id: string
          score: number | null
          student_id: string
        }
        Insert: {
          attempts?: number | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          progress_data?: Json | null
          resource_id: string
          score?: number | null
          student_id: string
        }
        Update: {
          attempts?: number | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          progress_data?: Json | null
          resource_id?: string
          score?: number | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_resource_progress_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "module_resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_resource_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          status: Database["public"]["Enums"]["student_status"] | null
          student_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["student_status"] | null
          student_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["student_status"] | null
          student_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      study_abroad_programs: {
        Row: {
          application_deadline: string | null
          country_code: string
          country_name: string
          created_at: string | null
          degree_type: string | null
          duration: string | null
          featured: boolean | null
          field_of_study: string | null
          id: string
          intake_months: string[] | null
          is_active: boolean | null
          program_name: string
          requirements: Json | null
          scholarship_available: boolean | null
          tuition_range: string | null
          university_name: string
          updated_at: string | null
          url: string | null
        }
        Insert: {
          application_deadline?: string | null
          country_code: string
          country_name: string
          created_at?: string | null
          degree_type?: string | null
          duration?: string | null
          featured?: boolean | null
          field_of_study?: string | null
          id?: string
          intake_months?: string[] | null
          is_active?: boolean | null
          program_name: string
          requirements?: Json | null
          scholarship_available?: boolean | null
          tuition_range?: string | null
          university_name: string
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          application_deadline?: string | null
          country_code?: string
          country_name?: string
          created_at?: string | null
          degree_type?: string | null
          duration?: string | null
          featured?: boolean | null
          field_of_study?: string | null
          id?: string
          intake_months?: string[] | null
          is_active?: boolean | null
          program_name?: string
          requirements?: Json | null
          scholarship_available?: boolean | null
          tuition_range?: string | null
          university_name?: string
          updated_at?: string | null
          url?: string | null
        }
        Relationships: []
      }
      study_abroad_roadmaps: {
        Row: {
          budget_level: string | null
          completed_at: string | null
          created_at: string | null
          cv_text: string | null
          degree_level: string
          education_summary: Json | null
          email: string
          experience_summary: Json | null
          family_support: boolean | null
          field_of_study: string | null
          full_name: string | null
          gpa: string | null
          has_taken_ielts: boolean | null
          id: string
          ielts_score: number | null
          part_time_work_interest: boolean | null
          roadmap_result: Json | null
          special_requirements: string | null
          status: string | null
          talent_id: string | null
          target_countries: string[]
          target_intake: string | null
          updated_at: string | null
          years_experience: number | null
        }
        Insert: {
          budget_level?: string | null
          completed_at?: string | null
          created_at?: string | null
          cv_text?: string | null
          degree_level: string
          education_summary?: Json | null
          email: string
          experience_summary?: Json | null
          family_support?: boolean | null
          field_of_study?: string | null
          full_name?: string | null
          gpa?: string | null
          has_taken_ielts?: boolean | null
          id?: string
          ielts_score?: number | null
          part_time_work_interest?: boolean | null
          roadmap_result?: Json | null
          special_requirements?: string | null
          status?: string | null
          talent_id?: string | null
          target_countries: string[]
          target_intake?: string | null
          updated_at?: string | null
          years_experience?: number | null
        }
        Update: {
          budget_level?: string | null
          completed_at?: string | null
          created_at?: string | null
          cv_text?: string | null
          degree_level?: string
          education_summary?: Json | null
          email?: string
          experience_summary?: Json | null
          family_support?: boolean | null
          field_of_study?: string | null
          full_name?: string | null
          gpa?: string | null
          has_taken_ielts?: boolean | null
          id?: string
          ielts_score?: number | null
          part_time_work_interest?: boolean | null
          roadmap_result?: Json | null
          special_requirements?: string | null
          status?: string | null
          talent_id?: string | null
          target_countries?: string[]
          target_intake?: string | null
          updated_at?: string | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "study_abroad_roadmaps_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      talent_assignments: {
        Row: {
          assigned_at: string | null
          assigned_to: string
          id: string
          talent_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_to: string
          id?: string
          talent_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_to?: string
          id?: string
          talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_assignments_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "workforce_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_assignments_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_credits: {
        Row: {
          balance: number
          created_at: string | null
          earned_balance: number
          id: string
          talent_id: string
          updated_at: string | null
        }
        Insert: {
          balance?: number
          created_at?: string | null
          earned_balance?: number
          id?: string
          talent_id: string
          updated_at?: string | null
        }
        Update: {
          balance?: number
          created_at?: string | null
          earned_balance?: number
          id?: string
          talent_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "talent_credits_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: true
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
        ]
      }
      talents: {
        Row: {
          achievements: Json | null
          batch_upload_id: string | null
          country: string | null
          country_code: string | null
          cover_image_url: string | null
          created_at: string | null
          current_status: string | null
          custom_profession: string | null
          cv_parsed_at: string | null
          cv_text: string | null
          cv_url: string | null
          education: Json | null
          email: string
          experience: Json | null
          field_of_study: string | null
          full_name: string
          id: string
          institution: string | null
          is_featured: boolean | null
          job_preferences: Json | null
          learner_status: string | null
          linkedin_url: string | null
          onboarding_completed_at: string | null
          onboarding_step: number | null
          phone: string | null
          portfolio_url: string | null
          profession_category_id: string | null
          profile_photo_url: string | null
          projects: Json | null
          ref_code: string | null
          services_used: Json | null
          skills: Json | null
          student_id: string | null
          updated_at: string | null
          user_id: string | null
          welcome_sent_at: string | null
          whatsapp_bonus_claimed_at: string | null
        }
        Insert: {
          achievements?: Json | null
          batch_upload_id?: string | null
          country?: string | null
          country_code?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          current_status?: string | null
          custom_profession?: string | null
          cv_parsed_at?: string | null
          cv_text?: string | null
          cv_url?: string | null
          education?: Json | null
          email: string
          experience?: Json | null
          field_of_study?: string | null
          full_name: string
          id?: string
          institution?: string | null
          is_featured?: boolean | null
          job_preferences?: Json | null
          learner_status?: string | null
          linkedin_url?: string | null
          onboarding_completed_at?: string | null
          onboarding_step?: number | null
          phone?: string | null
          portfolio_url?: string | null
          profession_category_id?: string | null
          profile_photo_url?: string | null
          projects?: Json | null
          ref_code?: string | null
          services_used?: Json | null
          skills?: Json | null
          student_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          welcome_sent_at?: string | null
          whatsapp_bonus_claimed_at?: string | null
        }
        Update: {
          achievements?: Json | null
          batch_upload_id?: string | null
          country?: string | null
          country_code?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          current_status?: string | null
          custom_profession?: string | null
          cv_parsed_at?: string | null
          cv_text?: string | null
          cv_url?: string | null
          education?: Json | null
          email?: string
          experience?: Json | null
          field_of_study?: string | null
          full_name?: string
          id?: string
          institution?: string | null
          is_featured?: boolean | null
          job_preferences?: Json | null
          learner_status?: string | null
          linkedin_url?: string | null
          onboarding_completed_at?: string | null
          onboarding_step?: number | null
          phone?: string | null
          portfolio_url?: string | null
          profession_category_id?: string | null
          profile_photo_url?: string | null
          projects?: Json | null
          ref_code?: string | null
          services_used?: Json | null
          skills?: Json | null
          student_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          welcome_sent_at?: string | null
          whatsapp_bonus_claimed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "talents_batch_upload_id_fkey"
            columns: ["batch_upload_id"]
            isOneToOne: false
            referencedRelation: "batch_uploads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talents_profession_category_id_fkey"
            columns: ["profession_category_id"]
            isOneToOne: false
            referencedRelation: "profession_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workforce_members: {
        Row: {
          city: string | null
          country: string | null
          created_at: string | null
          hired_at: string | null
          id: string
          probation_ends_at: string | null
          reports_to: string | null
          role_type: Database["public"]["Enums"]["workforce_role_type"]
          specialization: Json | null
          status: string
          talent_id: string
          updated_at: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          hired_at?: string | null
          id?: string
          probation_ends_at?: string | null
          reports_to?: string | null
          role_type: Database["public"]["Enums"]["workforce_role_type"]
          specialization?: Json | null
          status?: string
          talent_id: string
          updated_at?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          hired_at?: string | null
          id?: string
          probation_ends_at?: string | null
          reports_to?: string | null
          role_type?: Database["public"]["Enums"]["workforce_role_type"]
          specialization?: Json | null
          status?: string
          talent_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workforce_members_reports_to_fkey"
            columns: ["reports_to"]
            isOneToOne: false
            referencedRelation: "workforce_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workforce_members_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: true
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      instructors_public: {
        Row: {
          bio: string | null
          created_at: string | null
          email: string | null
          expertise: string[] | null
          full_name: string | null
          id: string | null
          profile_image_url: string | null
          social_links: Json | null
          status: string | null
          team_role: string | null
          updated_at: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          email?: string | null
          expertise?: string[] | null
          full_name?: string | null
          id?: string | null
          profile_image_url?: string | null
          social_links?: Json | null
          status?: string | null
          team_role?: string | null
          updated_at?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          email?: string | null
          expertise?: string[] | null
          full_name?: string | null
          id?: string | null
          profile_image_url?: string | null
          social_links?: Json | null
          status?: string | null
          team_role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_credits: {
        Args: {
          p_amount: number
          p_description?: string
          p_talent_id: string
          p_transaction_type: string
        }
        Returns: Json
      }
      add_talent_service: {
        Args: { p_service: string; p_talent_id: string }
        Returns: undefined
      }
      approve_invoice_and_disburse: {
        Args: {
          p_admin_notes?: string
          p_invoice_id: string
          p_payment_method: string
          p_payment_proof_url?: string
          p_payment_reference?: string
        }
        Returns: Json
      }
      auto_deactivate_expired_jobs: { Args: never; Returns: number }
      award_gig_credits: {
        Args: { p_admin_notes?: string; p_submission_id: string }
        Returns: Json
      }
      cancel_invoice: {
        Args: { p_invoice_id: string; p_reason?: string }
        Returns: Json
      }
      check_auth_email: { Args: { lookup_email: string }; Returns: Json }
      check_rate_limit: {
        Args: {
          p_endpoint: string
          p_ip_hash: string
          p_max_requests?: number
          p_window_minutes?: number
        }
        Returns: boolean
      }
      cleanup_rate_limits: { Args: never; Returns: undefined }
      create_credit_invoice: {
        Args: {
          p_bundle_credits: number
          p_bundle_price_local?: number
          p_bundle_price_usd: number
          p_currency?: string
        }
        Returns: Json
      }
      deduct_credits:
        | {
            Args: {
              p_amount: number
              p_description?: string
              p_reference_id?: string
              p_service_type: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_amount: number
              p_description?: string
              p_reference_id?: string
              p_service_type: string
            }
            Returns: Json
          }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_or_create_talent: {
        Args: {
          p_email: string
          p_full_name?: string
          p_phone?: string
          p_user_id?: string
        }
        Returns: string
      }
      has_any_admin_role: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_agent_conversations: {
        Args: { p_agent_key: string }
        Returns: undefined
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      normalize_country_name: { Args: { p_country: string }; Returns: string }
      normalize_phone: {
        Args: { p_country_code: string; p_phone: string }
        Returns: string
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      reject_gig_submission: {
        Args: { p_admin_notes?: string; p_submission_id: string }
        Returns: Json
      }
      track_content_click: {
        Args: { p_content_id: string; p_source: string }
        Returns: undefined
      }
      track_job_apply_click: {
        Args: { p_job_id: string; p_source?: string; p_talent_id?: string }
        Returns: undefined
      }
      track_job_click: {
        Args: { p_job_id: string; p_source: string }
        Returns: undefined
      }
      track_service_click: {
        Args: { p_slug: string; p_source: string }
        Returns: undefined
      }
      track_shared_job_click: {
        Args: { p_job_id: string; p_ref_code: string }
        Returns: Json
      }
    }
    Enums: {
      academy_type:
        | "executive"
        | "technical"
        | "freelancing"
        | "entrepreneurship"
        | "influencing"
      app_role: "admin" | "student" | "talent_exec"
      application_status:
        | "submitted"
        | "sent_to_employer"
        | "viewed"
        | "shortlisted"
        | "rejected"
      application_type: "email" | "link"
      content_type:
        | "free_video"
        | "recorded_course"
        | "live_webinar"
        | "batch_class"
        | "offline_seminar"
      delivery_status: "pending" | "sent" | "failed"
      enrollment_status: "pending_payment" | "active" | "completed"
      experience_level: "entry" | "mid" | "senior" | "executive"
      job_type:
        | "full_time"
        | "part_time"
        | "contract"
        | "internship"
        | "freelance"
        | "remote"
      portfolio_status:
        | "pending"
        | "contacted"
        | "in_progress"
        | "completed"
        | "cancelled"
      post_content_type:
        | "text"
        | "poll"
        | "tip"
        | "news"
        | "announcement"
        | "media"
      profession_level_type: "foundation" | "intermediate" | "executive"
      question_type: "single_choice" | "multiple_choice" | "scale" | "text"
      reaction_type: "like" | "insightful" | "celebrate" | "support"
      readiness_level:
        | "beginner"
        | "developing"
        | "competent"
        | "proficient"
        | "expert"
      resource_type:
        | "video"
        | "slides"
        | "infographic"
        | "mindmap"
        | "audio_podcast"
        | "flashcards"
        | "ai_scenario"
        | "quiz"
        | "report"
      session_status: "scheduled" | "ongoing" | "completed" | "cancelled"
      source_platform: "facebook" | "linkedin" | "bdjobs" | "website" | "other"
      student_status: "lead" | "free_learner" | "enrolled" | "graduated"
      workforce_role_type:
        | "country_director"
        | "head_of_ta"
        | "talent_executive"
        | "bde"
        | "academy_chancellor"
        | "school_dean"
        | "career_abroad_exec"
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
      academy_type: [
        "executive",
        "technical",
        "freelancing",
        "entrepreneurship",
        "influencing",
      ],
      app_role: ["admin", "student", "talent_exec"],
      application_status: [
        "submitted",
        "sent_to_employer",
        "viewed",
        "shortlisted",
        "rejected",
      ],
      application_type: ["email", "link"],
      content_type: [
        "free_video",
        "recorded_course",
        "live_webinar",
        "batch_class",
        "offline_seminar",
      ],
      delivery_status: ["pending", "sent", "failed"],
      enrollment_status: ["pending_payment", "active", "completed"],
      experience_level: ["entry", "mid", "senior", "executive"],
      job_type: [
        "full_time",
        "part_time",
        "contract",
        "internship",
        "freelance",
        "remote",
      ],
      portfolio_status: [
        "pending",
        "contacted",
        "in_progress",
        "completed",
        "cancelled",
      ],
      post_content_type: [
        "text",
        "poll",
        "tip",
        "news",
        "announcement",
        "media",
      ],
      profession_level_type: ["foundation", "intermediate", "executive"],
      question_type: ["single_choice", "multiple_choice", "scale", "text"],
      reaction_type: ["like", "insightful", "celebrate", "support"],
      readiness_level: [
        "beginner",
        "developing",
        "competent",
        "proficient",
        "expert",
      ],
      resource_type: [
        "video",
        "slides",
        "infographic",
        "mindmap",
        "audio_podcast",
        "flashcards",
        "ai_scenario",
        "quiz",
        "report",
      ],
      session_status: ["scheduled", "ongoing", "completed", "cancelled"],
      source_platform: ["facebook", "linkedin", "bdjobs", "website", "other"],
      student_status: ["lead", "free_learner", "enrolled", "graduated"],
      workforce_role_type: [
        "country_director",
        "head_of_ta",
        "talent_executive",
        "bde",
        "academy_chancellor",
        "school_dean",
        "career_abroad_exec",
      ],
    },
  },
} as const

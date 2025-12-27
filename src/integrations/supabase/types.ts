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
        }
        Insert: {
          created_at?: string | null
          created_by: string
          display_order?: number | null
          id?: string
          image_url: string
          is_active?: boolean | null
          link_content_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          display_order?: number | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          link_content_id?: string | null
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
      companies: {
        Row: {
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
      content: {
        Row: {
          content_type: Database["public"]["Enums"]["content_type"]
          cover_image_url: string | null
          created_at: string | null
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
        ]
      }
      enrollments: {
        Row: {
          completed_at: string | null
          content_id: string
          created_at: string | null
          enrolled_at: string | null
          id: string
          notes: string | null
          payment_amount: number | null
          status: Database["public"]["Enums"]["enrollment_status"] | null
          student_id: string
          talent_id: string | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          content_id: string
          created_at?: string | null
          enrolled_at?: string | null
          id?: string
          notes?: string | null
          payment_amount?: number | null
          status?: Database["public"]["Enums"]["enrollment_status"] | null
          student_id: string
          talent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          content_id?: string
          created_at?: string | null
          enrolled_at?: string | null
          id?: string
          notes?: string | null
          payment_amount?: number | null
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
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          free_applications_used?: number | null
          id?: string
          month_year: string
          paid_applications_count?: number | null
          professional_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          free_applications_used?: number | null
          id?: string
          month_year?: string
          paid_applications_count?: number | null
          professional_id?: string
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
        ]
      }
      job_applications: {
        Row: {
          application_status:
            | Database["public"]["Enums"]["application_status"]
            | null
          cover_letter: string | null
          created_at: string | null
          cv_url: string | null
          delivery_error: string | null
          delivery_status: Database["public"]["Enums"]["delivery_status"] | null
          id: string
          is_paid: boolean | null
          job_id: string
          professional_id: string
          talent_id: string | null
        }
        Insert: {
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
          id?: string
          is_paid?: boolean | null
          job_id: string
          professional_id: string
          talent_id?: string | null
        }
        Update: {
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
          id?: string
          is_paid?: boolean | null
          job_id?: string
          professional_id?: string
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
      jobs: {
        Row: {
          ai_enhanced_description: string | null
          application_email: string | null
          application_type: Database["public"]["Enums"]["application_type"]
          application_url: string | null
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
          profession_category_id: string | null
          requirements: Json | null
          salary_range_max: number | null
          salary_range_min: number | null
          source_image_url: string | null
          source_platform: Database["public"]["Enums"]["source_platform"] | null
          source_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          ai_enhanced_description?: string | null
          application_email?: string | null
          application_type?: Database["public"]["Enums"]["application_type"]
          application_url?: string | null
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
          profession_category_id?: string | null
          requirements?: Json | null
          salary_range_max?: number | null
          salary_range_min?: number | null
          source_image_url?: string | null
          source_platform?:
            | Database["public"]["Enums"]["source_platform"]
            | null
          source_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          ai_enhanced_description?: string | null
          application_email?: string | null
          application_type?: Database["public"]["Enums"]["application_type"]
          application_url?: string | null
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
          profession_category_id?: string | null
          requirements?: Json | null
          salary_range_max?: number | null
          salary_range_min?: number | null
          source_image_url?: string | null
          source_platform?:
            | Database["public"]["Enums"]["source_platform"]
            | null
          source_url?: string | null
          title?: string
          updated_at?: string | null
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
            foreignKeyName: "portfolio_requests_profession_category_id_fkey"
            columns: ["profession_category_id"]
            isOneToOne: false
            referencedRelation: "profession_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profession_categories: {
        Row: {
          career_outcome: string | null
          created_at: string | null
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
      talents: {
        Row: {
          achievements: Json | null
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
          learner_status: string | null
          linkedin_url: string | null
          phone: string | null
          portfolio_url: string | null
          profession_category_id: string | null
          profile_photo_url: string | null
          projects: Json | null
          services_used: Json | null
          skills: Json | null
          student_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          achievements?: Json | null
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
          learner_status?: string | null
          linkedin_url?: string | null
          phone?: string | null
          portfolio_url?: string | null
          profession_category_id?: string | null
          profile_photo_url?: string | null
          projects?: Json | null
          services_used?: Json | null
          skills?: Json | null
          student_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          achievements?: Json | null
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
          learner_status?: string | null
          linkedin_url?: string | null
          phone?: string | null
          portfolio_url?: string | null
          profession_category_id?: string | null
          profile_photo_url?: string | null
          projects?: Json | null
          services_used?: Json | null
          skills?: Json | null
          student_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_talent_service: {
        Args: { p_service: string; p_talent_id: string }
        Returns: undefined
      }
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
    }
    Enums: {
      academy_type: "executive" | "technical"
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
      profession_level_type: "foundation" | "intermediate" | "executive"
      question_type: "single_choice" | "multiple_choice" | "scale" | "text"
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
      academy_type: ["executive", "technical"],
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
      profession_level_type: ["foundation", "intermediate", "executive"],
      question_type: ["single_choice", "multiple_choice", "scale", "text"],
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
    },
  },
} as const

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
      abroad_application_docs: {
        Row: {
          application_id: string
          created_at: string
          file_path: string | null
          id: string
          kind: string
          review_note: string | null
          reviewed_at: string | null
          reviewer_user_id: string | null
          status: string
          title: string | null
          uploaded_at: string | null
        }
        Insert: {
          application_id: string
          created_at?: string
          file_path?: string | null
          id?: string
          kind: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewer_user_id?: string | null
          status?: string
          title?: string | null
          uploaded_at?: string | null
        }
        Update: {
          application_id?: string
          created_at?: string
          file_path?: string | null
          id?: string
          kind?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewer_user_id?: string | null
          status?: string
          title?: string | null
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "abroad_application_docs_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "abroad_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      abroad_application_events: {
        Row: {
          actor_user_id: string | null
          application_id: string
          created_at: string
          event_kind: string
          id: string
          payload: Json | null
        }
        Insert: {
          actor_user_id?: string | null
          application_id: string
          created_at?: string
          event_kind: string
          id?: string
          payload?: Json | null
        }
        Update: {
          actor_user_id?: string | null
          application_id?: string
          created_at?: string
          event_kind?: string
          id?: string
          payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "abroad_application_events_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "abroad_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      abroad_applications: {
        Row: {
          counsellor_user_id: string | null
          created_at: string
          id: string
          intake_term: string | null
          notes: string | null
          program_id: string | null
          roadmap_id: string | null
          stage: string
          talent_user_id: string
          target_country: string
          updated_at: string
        }
        Insert: {
          counsellor_user_id?: string | null
          created_at?: string
          id?: string
          intake_term?: string | null
          notes?: string | null
          program_id?: string | null
          roadmap_id?: string | null
          stage?: string
          talent_user_id: string
          target_country: string
          updated_at?: string
        }
        Update: {
          counsellor_user_id?: string | null
          created_at?: string
          id?: string
          intake_term?: string | null
          notes?: string | null
          program_id?: string | null
          roadmap_id?: string | null
          stage?: string
          talent_user_id?: string
          target_country?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "abroad_applications_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "study_abroad_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "abroad_applications_roadmap_id_fkey"
            columns: ["roadmap_id"]
            isOneToOne: false
            referencedRelation: "study_abroad_roadmaps"
            referencedColumns: ["id"]
          },
        ]
      }
      abroad_counsellors: {
        Row: {
          bio: string | null
          commission_pct: number
          created_at: string
          display_name: string
          expertise_countries: string[]
          id: string
          is_active: boolean
          is_verified: boolean
          languages: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string | null
          commission_pct?: number
          created_at?: string
          display_name: string
          expertise_countries?: string[]
          id?: string
          is_active?: boolean
          is_verified?: boolean
          languages?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string | null
          commission_pct?: number
          created_at?: string
          display_name?: string
          expertise_countries?: string[]
          id?: string
          is_active?: boolean
          is_verified?: boolean
          languages?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
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
      admin_analyst_messages: {
        Row: {
          content: string | null
          created_at: string
          id: string
          role: string
          thread_id: string
          tool_calls: Json | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          role: string
          thread_id: string
          tool_calls?: Json | null
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          role?: string
          thread_id?: string
          tool_calls?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_analyst_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "admin_analyst_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_analyst_threads: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_chat_messages: {
        Row: {
          attachments: Json
          content: string
          created_at: string
          handoff_to: string | null
          id: string
          role: string
          thread_id: string
        }
        Insert: {
          attachments?: Json
          content: string
          created_at?: string
          handoff_to?: string | null
          id?: string
          role: string
          thread_id: string
        }
        Update: {
          attachments?: Json
          content?: string
          created_at?: string
          handoff_to?: string | null
          id?: string
          role?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_chat_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "admin_chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_chat_threads: {
        Row: {
          agent_key: string
          created_at: string
          id: string
          last_message_at: string
          last_read_at: string
          title: string | null
          user_id: string
        }
        Insert: {
          agent_key: string
          created_at?: string
          id?: string
          last_message_at?: string
          last_read_at?: string
          title?: string | null
          user_id: string
        }
        Update: {
          agent_key?: string
          created_at?: string
          id?: string
          last_message_at?: string
          last_read_at?: string
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      admin_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          metadata: Json | null
          read_at: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          metadata?: Json | null
          read_at?: string | null
          title: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          metadata?: Json | null
          read_at?: string | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      admin_reports: {
        Row: {
          created_at: string
          data_snapshot: Json
          id: string
          period: Json
          share_token: string | null
          spec_json: Json
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_snapshot?: Json
          id?: string
          period?: Json
          share_token?: string | null
          spec_json?: Json
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_snapshot?: Json
          id?: string
          period?: Json
          share_token?: string | null
          spec_json?: Json
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      agent_artifacts: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          kind: string
          message_id: string | null
          payload: Json
          status: string
          storage_path: string | null
          thread_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          kind: string
          message_id?: string | null
          payload?: Json
          status?: string
          storage_path?: string | null
          thread_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          kind?: string
          message_id?: string | null
          payload?: Json
          status?: string
          storage_path?: string | null
          thread_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_artifacts_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "agent_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_artifacts_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "agent_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_bot_credentials: {
        Row: {
          agent_key: string
          bot_token: string
          bot_username: string | null
          is_active: boolean | null
          updated_at: string | null
        }
        Insert: {
          agent_key: string
          bot_token: string
          bot_username?: string | null
          is_active?: boolean | null
          updated_at?: string | null
        }
        Update: {
          agent_key?: string
          bot_token?: string
          bot_username?: string | null
          is_active?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_bot_credentials_agent_key_fkey"
            columns: ["agent_key"]
            isOneToOne: true
            referencedRelation: "agent_outreach_admin_v"
            referencedColumns: ["agent_key"]
          },
          {
            foreignKeyName: "agent_bot_credentials_agent_key_fkey"
            columns: ["agent_key"]
            isOneToOne: true
            referencedRelation: "ai_agents"
            referencedColumns: ["agent_key"]
          },
          {
            foreignKeyName: "agent_bot_credentials_agent_key_fkey"
            columns: ["agent_key"]
            isOneToOne: true
            referencedRelation: "ai_agents_with_stats"
            referencedColumns: ["agent_key"]
          },
        ]
      }
      agent_channel_bindings: {
        Row: {
          agent_id: string
          channel_id: string
          created_at: string
          is_primary: boolean
        }
        Insert: {
          agent_id: string
          channel_id: string
          created_at?: string
          is_primary?: boolean
        }
        Update: {
          agent_id?: string
          channel_id?: string
          created_at?: string
          is_primary?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "agent_channel_bindings_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_channel_bindings_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_channel_bindings_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "agent_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_channels: {
        Row: {
          channel_key: string
          created_at: string
          description: string | null
          direction: string | null
          id: string
          is_active: boolean
          label: string
        }
        Insert: {
          channel_key: string
          created_at?: string
          description?: string | null
          direction?: string | null
          id?: string
          is_active?: boolean
          label: string
        }
        Update: {
          channel_key?: string
          created_at?: string
          description?: string | null
          direction?: string | null
          id?: string
          is_active?: boolean
          label?: string
        }
        Relationships: []
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
          thread_id: string | null
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
          thread_id?: string | null
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
          thread_id?: string | null
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
          {
            foreignKeyName: "agent_chat_sessions_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "agent_chat_sessions_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
        ]
      }
      agent_connections: {
        Row: {
          agent_id: string
          connected_at: string
          fee_paid: number
          id: string
          subject_id: string
          subject_kind: string
        }
        Insert: {
          agent_id: string
          connected_at?: string
          fee_paid?: number
          id?: string
          subject_id: string
          subject_kind: string
        }
        Update: {
          agent_id?: string
          connected_at?: string
          fee_paid?: number
          id?: string
          subject_id?: string
          subject_kind?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_connections_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_connections_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents_with_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_credit_events: {
        Row: {
          agent_id: string
          created_at: string
          credits: number
          event_kind: string
          id: string
          llm_cost_usd: number | null
          message_id: string | null
          metadata: Json | null
          prompt_variant: string | null
          subject_id: string
          subject_kind: string
          thread_id: string | null
          tokens_in: number | null
          tokens_out: number | null
          tool_key: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string
          credits: number
          event_kind: string
          id?: string
          llm_cost_usd?: number | null
          message_id?: string | null
          metadata?: Json | null
          prompt_variant?: string | null
          subject_id: string
          subject_kind: string
          thread_id?: string | null
          tokens_in?: number | null
          tokens_out?: number | null
          tool_key?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string
          credits?: number
          event_kind?: string
          id?: string
          llm_cost_usd?: number | null
          message_id?: string | null
          metadata?: Json | null
          prompt_variant?: string | null
          subject_id?: string
          subject_kind?: string
          thread_id?: string | null
          tokens_in?: number | null
          tokens_out?: number | null
          tool_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_credit_events_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_credit_events_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_credit_events_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "agent_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_credit_events_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "agent_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_knowledge_chunks: {
        Row: {
          agent_id: string
          chunk_index: number
          content: string
          created_at: string
          embedding: string | null
          id: string
          source_id: string
          token_count: number | null
        }
        Insert: {
          agent_id: string
          chunk_index: number
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
          source_id: string
          token_count?: number | null
        }
        Update: {
          agent_id?: string
          chunk_index?: number
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          source_id?: string
          token_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_knowledge_chunks_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_knowledge_chunks_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_knowledge_chunks_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "agent_knowledge_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_knowledge_sources: {
        Row: {
          agent_id: string
          chunk_count: number
          created_at: string
          created_by: string | null
          error: string | null
          id: string
          source_kind: string
          source_ref: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          chunk_count?: number
          created_at?: string
          created_by?: string | null
          error?: string | null
          id?: string
          source_kind: string
          source_ref?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          chunk_count?: number
          created_at?: string
          created_by?: string | null
          error?: string | null
          id?: string
          source_kind?: string
          source_ref?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_knowledge_sources_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_knowledge_sources_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents_with_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_marketplace_earnings: {
        Row: {
          agent_id: string
          builder_id: string
          builder_kind: string
          builder_share: number
          created_at: string
          credit_event_id: string | null
          gross_credits: number
          id: string
          platform_share: number
        }
        Insert: {
          agent_id: string
          builder_id: string
          builder_kind: string
          builder_share: number
          created_at?: string
          credit_event_id?: string | null
          gross_credits: number
          id?: string
          platform_share: number
        }
        Update: {
          agent_id?: string
          builder_id?: string
          builder_kind?: string
          builder_share?: number
          created_at?: string
          credit_event_id?: string | null
          gross_credits?: number
          id?: string
          platform_share?: number
        }
        Relationships: [
          {
            foreignKeyName: "agent_marketplace_earnings_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_marketplace_earnings_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_marketplace_earnings_credit_event_id_fkey"
            columns: ["credit_event_id"]
            isOneToOne: false
            referencedRelation: "agent_credit_events"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_messages: {
        Row: {
          artifact_ids: string[] | null
          content: string | null
          created_at: string
          credit_cost: number | null
          id: string
          llm_cost_usd: number | null
          prompt_variant: string | null
          role: string
          thread_id: string
          tokens_in: number | null
          tokens_out: number | null
          tool_calls: Json | null
        }
        Insert: {
          artifact_ids?: string[] | null
          content?: string | null
          created_at?: string
          credit_cost?: number | null
          id?: string
          llm_cost_usd?: number | null
          prompt_variant?: string | null
          role: string
          thread_id: string
          tokens_in?: number | null
          tokens_out?: number | null
          tool_calls?: Json | null
        }
        Update: {
          artifact_ids?: string[] | null
          content?: string | null
          created_at?: string
          credit_cost?: number | null
          id?: string
          llm_cost_usd?: number | null
          prompt_variant?: string | null
          role?: string
          thread_id?: string
          tokens_in?: number | null
          tokens_out?: number | null
          tool_calls?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "agent_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_outreach: {
        Row: {
          agent_id: string
          body: string
          channel: string
          conversation_id: string | null
          created_at: string
          credits_charged: number
          error_message: string | null
          event_id: string | null
          external_message_id: string | null
          id: string
          payload: Json
          recipient_id: string | null
          recipient_kind: string
          status: string
          subject: string | null
          trigger_id: string | null
        }
        Insert: {
          agent_id: string
          body: string
          channel?: string
          conversation_id?: string | null
          created_at?: string
          credits_charged?: number
          error_message?: string | null
          event_id?: string | null
          external_message_id?: string | null
          id?: string
          payload?: Json
          recipient_id?: string | null
          recipient_kind: string
          status?: string
          subject?: string | null
          trigger_id?: string | null
        }
        Update: {
          agent_id?: string
          body?: string
          channel?: string
          conversation_id?: string | null
          created_at?: string
          credits_charged?: number
          error_message?: string | null
          event_id?: string | null
          external_message_id?: string | null
          id?: string
          payload?: Json
          recipient_id?: string | null
          recipient_kind?: string
          status?: string
          subject?: string | null
          trigger_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_outreach_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_outreach_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_outreach_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "platform_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_outreach_trigger_id_fkey"
            columns: ["trigger_id"]
            isOneToOne: false
            referencedRelation: "agent_triggers"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_outreach_dedupe: {
        Row: {
          agent_id: string
          event_kind: string
          recipient_id: string | null
          recipient_kind: string
          sent_at: string
        }
        Insert: {
          agent_id: string
          event_kind: string
          recipient_id?: string | null
          recipient_kind: string
          sent_at?: string
        }
        Update: {
          agent_id?: string
          event_kind?: string
          recipient_id?: string | null
          recipient_kind?: string
          sent_at?: string
        }
        Relationships: []
      }
      agent_payout_requests: {
        Row: {
          admin_notes: string | null
          amount_credits: number
          created_at: string
          id: string
          payout_details: Json
          payout_method: string
          processed_at: string | null
          processed_by: string | null
          status: string
          talent_id: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          amount_credits: number
          created_at?: string
          id?: string
          payout_details?: Json
          payout_method: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          talent_id: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          amount_credits?: number
          created_at?: string
          id?: string
          payout_details?: Json
          payout_method?: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          talent_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_payout_requests_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_payout_requests_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "agent_payout_requests_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
        ]
      }
      agent_pitch_log: {
        Row: {
          company_id: string
          created_at: string
          dispatch_error: string | null
          dispatched: boolean
          external_chat_id: string | null
          external_message_id: string | null
          id: string
          message: string
          phone: string | null
          sent_by: string
          talent_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          dispatch_error?: string | null
          dispatched?: boolean
          external_chat_id?: string | null
          external_message_id?: string | null
          id?: string
          message: string
          phone?: string | null
          sent_by: string
          talent_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          dispatch_error?: string | null
          dispatched?: boolean
          external_chat_id?: string | null
          external_message_id?: string | null
          id?: string
          message?: string
          phone?: string | null
          sent_by?: string
          talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_pitch_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_pitch_log_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_pitch_log_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "agent_pitch_log_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
        ]
      }
      agent_reviews: {
        Row: {
          agent_key: string
          created_at: string
          id: string
          rating: number
          review_text: string | null
          talent_id: string
          updated_at: string
        }
        Insert: {
          agent_key: string
          created_at?: string
          id?: string
          rating: number
          review_text?: string | null
          talent_id: string
          updated_at?: string
        }
        Update: {
          agent_key?: string
          created_at?: string
          id?: string
          rating?: number
          review_text?: string | null
          talent_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_reviews_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_reviews_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "agent_reviews_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
        ]
      }
      agent_routing_rules: {
        Row: {
          agent_key: string | null
          audience_type: string
          created_at: string | null
          description: string | null
          event_topic: string
          id: string
          is_active: boolean | null
          telegram_chat_id: string
        }
        Insert: {
          agent_key?: string | null
          audience_type: string
          created_at?: string | null
          description?: string | null
          event_topic: string
          id?: string
          is_active?: boolean | null
          telegram_chat_id: string
        }
        Update: {
          agent_key?: string | null
          audience_type?: string
          created_at?: string | null
          description?: string | null
          event_topic?: string
          id?: string
          is_active?: boolean | null
          telegram_chat_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_routing_rules_agent_key_fkey"
            columns: ["agent_key"]
            isOneToOne: false
            referencedRelation: "agent_outreach_admin_v"
            referencedColumns: ["agent_key"]
          },
          {
            foreignKeyName: "agent_routing_rules_agent_key_fkey"
            columns: ["agent_key"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["agent_key"]
          },
          {
            foreignKeyName: "agent_routing_rules_agent_key_fkey"
            columns: ["agent_key"]
            isOneToOne: false
            referencedRelation: "ai_agents_with_stats"
            referencedColumns: ["agent_key"]
          },
        ]
      }
      agent_threads: {
        Row: {
          agent_id: string
          agent_key: string
          company_id: string | null
          created_at: string
          id: string
          is_archived: boolean
          is_pinned: boolean
          last_message_at: string
          metadata: Json
          subject_id: string
          subject_kind: string
          title: string | null
          unread_count: number
          updated_at: string
        }
        Insert: {
          agent_id: string
          agent_key: string
          company_id?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean
          is_pinned?: boolean
          last_message_at?: string
          metadata?: Json
          subject_id: string
          subject_kind: string
          title?: string | null
          unread_count?: number
          updated_at?: string
        }
        Update: {
          agent_id?: string
          agent_key?: string
          company_id?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean
          is_pinned?: boolean
          last_message_at?: string
          metadata?: Json
          subject_id?: string
          subject_kind?: string
          title?: string | null
          unread_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_threads_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_threads_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents_with_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_tool_bindings: {
        Row: {
          agent_id: string
          created_at: string
          tool_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          tool_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          tool_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_tool_bindings_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_tool_bindings_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_tool_bindings_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "agent_tools"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_tools: {
        Row: {
          audience: string[]
          category: string
          connector_id: string | null
          created_at: string
          default_credit_cost: number
          description: string
          handler_kind: string
          handler_ref: string
          id: string
          input_schema: Json
          is_active: boolean
          min_level: number
          name: string
          status: string
          tool_key: string
          updated_at: string
        }
        Insert: {
          audience?: string[]
          category: string
          connector_id?: string | null
          created_at?: string
          default_credit_cost?: number
          description: string
          handler_kind?: string
          handler_ref: string
          id?: string
          input_schema?: Json
          is_active?: boolean
          min_level?: number
          name: string
          status?: string
          tool_key: string
          updated_at?: string
        }
        Update: {
          audience?: string[]
          category?: string
          connector_id?: string | null
          created_at?: string
          default_credit_cost?: number
          description?: string
          handler_kind?: string
          handler_ref?: string
          id?: string
          input_schema?: Json
          is_active?: boolean
          min_level?: number
          name?: string
          status?: string
          tool_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      agent_triggers: {
        Row: {
          agent_id: string
          channel: string | null
          cooldown_minutes: number
          country_code: string | null
          created_at: string
          cron_expression: string | null
          event_kind: string
          goal: string | null
          id: string
          is_active: boolean
          last_fired_at: string | null
          profession_line_id: string | null
          recipient_filter: Json | null
          recipient_strategy: string
          template: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          channel?: string | null
          cooldown_minutes?: number
          country_code?: string | null
          created_at?: string
          cron_expression?: string | null
          event_kind: string
          goal?: string | null
          id?: string
          is_active?: boolean
          last_fired_at?: string | null
          profession_line_id?: string | null
          recipient_filter?: Json | null
          recipient_strategy?: string
          template: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          channel?: string | null
          cooldown_minutes?: number
          country_code?: string | null
          created_at?: string
          cron_expression?: string | null
          event_kind?: string
          goal?: string | null
          id?: string
          is_active?: boolean
          last_fired_at?: string | null
          profession_line_id?: string | null
          recipient_filter?: Json | null
          recipient_strategy?: string
          template?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_triggers_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_triggers_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents_with_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agents: {
        Row: {
          active_prompt_variant: string
          agent_key: string
          agent_level: number
          agent_type: string | null
          allowed_tools: string[]
          audience: string
          avatar_url: string | null
          average_rating: number | null
          bg_color: string | null
          builder_model: string
          canvas_mode: string
          capabilities: string[] | null
          category: string | null
          color: string | null
          company_id: string | null
          connection_fee: number
          country_code: string | null
          created_at: string | null
          credit_cost: number | null
          default_channel: string
          delivery_credit_cost: number | null
          description: string
          display_order: number | null
          expertise_areas: string[] | null
          goal: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          is_template: boolean | null
          kill_switch: boolean
          language: string | null
          marketplace_status: string
          message_credit_cost: number
          model: string
          monthly_target: number | null
          name: string
          owner_id: string | null
          owner_kind: string
          parent_template_id: string | null
          personality_traits: Json | null
          profession_line_id: string | null
          prompt_variants: Json
          region: string | null
          sample_conversations: Json | null
          session_duration_minutes: number | null
          system_prompt: string
          total_conversations: number | null
          updated_at: string | null
          visibility: string
        }
        Insert: {
          active_prompt_variant?: string
          agent_key: string
          agent_level?: number
          agent_type?: string | null
          allowed_tools?: string[]
          audience?: string
          avatar_url?: string | null
          average_rating?: number | null
          bg_color?: string | null
          builder_model?: string
          canvas_mode?: string
          capabilities?: string[] | null
          category?: string | null
          color?: string | null
          company_id?: string | null
          connection_fee?: number
          country_code?: string | null
          created_at?: string | null
          credit_cost?: number | null
          default_channel?: string
          delivery_credit_cost?: number | null
          description: string
          display_order?: number | null
          expertise_areas?: string[] | null
          goal?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          is_template?: boolean | null
          kill_switch?: boolean
          language?: string | null
          marketplace_status?: string
          message_credit_cost?: number
          model?: string
          monthly_target?: number | null
          name: string
          owner_id?: string | null
          owner_kind?: string
          parent_template_id?: string | null
          personality_traits?: Json | null
          profession_line_id?: string | null
          prompt_variants?: Json
          region?: string | null
          sample_conversations?: Json | null
          session_duration_minutes?: number | null
          system_prompt: string
          total_conversations?: number | null
          updated_at?: string | null
          visibility?: string
        }
        Update: {
          active_prompt_variant?: string
          agent_key?: string
          agent_level?: number
          agent_type?: string | null
          allowed_tools?: string[]
          audience?: string
          avatar_url?: string | null
          average_rating?: number | null
          bg_color?: string | null
          builder_model?: string
          canvas_mode?: string
          capabilities?: string[] | null
          category?: string | null
          color?: string | null
          company_id?: string | null
          connection_fee?: number
          country_code?: string | null
          created_at?: string | null
          credit_cost?: number | null
          default_channel?: string
          delivery_credit_cost?: number | null
          description?: string
          display_order?: number | null
          expertise_areas?: string[] | null
          goal?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          is_template?: boolean | null
          kill_switch?: boolean
          language?: string | null
          marketplace_status?: string
          message_credit_cost?: number
          model?: string
          monthly_target?: number | null
          name?: string
          owner_id?: string | null
          owner_kind?: string
          parent_template_id?: string | null
          personality_traits?: Json | null
          profession_line_id?: string | null
          prompt_variants?: Json
          region?: string | null
          sample_conversations?: Json | null
          session_duration_minutes?: number | null
          system_prompt?: string
          total_conversations?: number | null
          updated_at?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_agents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agents_parent_template_id_fkey"
            columns: ["parent_template_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agents_parent_template_id_fkey"
            columns: ["parent_template_id"]
            isOneToOne: false
            referencedRelation: "ai_agents_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agents_profession_line_id_fkey"
            columns: ["profession_line_id"]
            isOneToOne: false
            referencedRelation: "profession_categories"
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
          profile_coach_prompt: string | null
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
          profile_coach_prompt?: string | null
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
          profile_coach_prompt?: string | null
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
          match_reason: string | null
          match_score: number
          reason: string | null
          talent_id: string
          verified_match: Json | null
        }
        Insert: {
          generated_at?: string
          id?: string
          job_id: string
          match_reason?: string | null
          match_score?: number
          reason?: string | null
          talent_id: string
          verified_match?: Json | null
        }
        Update: {
          generated_at?: string
          id?: string
          job_id?: string
          match_reason?: string | null
          match_score?: number
          reason?: string | null
          talent_id?: string
          verified_match?: Json | null
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
          {
            foreignKeyName: "ai_job_recommendations_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "ai_job_recommendations_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
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
          {
            foreignKeyName: "ai_recommendations_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "ai_recommendations_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
        ]
      }
      aisha_conversations: {
        Row: {
          abandoned: boolean | null
          completed_at: string | null
          country: string | null
          email: string | null
          id: string
          last_step: string | null
          message_count: number | null
          name: string | null
          phone: string | null
          raw_messages: Json | null
          session_id: string
          started_at: string
          talent_id: string | null
          updated_at: string
        }
        Insert: {
          abandoned?: boolean | null
          completed_at?: string | null
          country?: string | null
          email?: string | null
          id?: string
          last_step?: string | null
          message_count?: number | null
          name?: string | null
          phone?: string | null
          raw_messages?: Json | null
          session_id: string
          started_at?: string
          talent_id?: string | null
          updated_at?: string
        }
        Update: {
          abandoned?: boolean | null
          completed_at?: string | null
          country?: string | null
          email?: string | null
          id?: string
          last_step?: string | null
          message_count?: number | null
          name?: string | null
          phone?: string | null
          raw_messages?: Json | null
          session_id?: string
          started_at?: string
          talent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "aisha_conversations_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aisha_conversations_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "aisha_conversations_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
        ]
      }
      application_audit_log: {
        Row: {
          actor_id: string | null
          actor_role: string
          application_id: string
          created_at: string
          from_status: Database["public"]["Enums"]["application_status"] | null
          id: string
          reason: string | null
          to_status: Database["public"]["Enums"]["application_status"]
        }
        Insert: {
          actor_id?: string | null
          actor_role: string
          application_id: string
          created_at?: string
          from_status?: Database["public"]["Enums"]["application_status"] | null
          id?: string
          reason?: string | null
          to_status: Database["public"]["Enums"]["application_status"]
        }
        Update: {
          actor_id?: string | null
          actor_role?: string
          application_id?: string
          created_at?: string
          from_status?: Database["public"]["Enums"]["application_status"] | null
          id?: string
          reason?: string | null
          to_status?: Database["public"]["Enums"]["application_status"]
        }
        Relationships: [
          {
            foreignKeyName: "application_audit_log_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      application_messages: {
        Row: {
          application_id: string
          attachments: Json
          body: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
          sender_role: string
        }
        Insert: {
          application_id: string
          attachments?: Json
          body: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
          sender_role: string
        }
        Update: {
          application_id?: string
          attachments?: Json
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
          sender_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_messages_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
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
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string
          table_name: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          table_name: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          table_name?: string
        }
        Relationships: []
      }
      authoring_digest_log: {
        Row: {
          channel: string
          content_id: string | null
          created_at: string
          id: string
          instructor_id: string | null
          items_flagged: number
          metadata: Json
          module_ids: string[]
          period_end: string
          period_start: string
          recipient_email: string | null
          sent_at: string
        }
        Insert: {
          channel?: string
          content_id?: string | null
          created_at?: string
          id?: string
          instructor_id?: string | null
          items_flagged?: number
          metadata?: Json
          module_ids?: string[]
          period_end: string
          period_start: string
          recipient_email?: string | null
          sent_at?: string
        }
        Update: {
          channel?: string
          content_id?: string | null
          created_at?: string
          id?: string
          instructor_id?: string | null
          items_flagged?: number
          metadata?: Json
          module_ids?: string[]
          period_end?: string
          period_start?: string
          recipient_email?: string | null
          sent_at?: string
        }
        Relationships: []
      }
      banners: {
        Row: {
          created_at: string | null
          created_by: string
          cta_label: string | null
          display_order: number | null
          end_at: string | null
          focal_point: string | null
          id: string
          image_url: string
          is_active: boolean | null
          link_content_id: string | null
          link_url: string | null
          media_type: string
          media_url: string | null
          placement: string
          poster_url: string | null
          start_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          cta_label?: string | null
          display_order?: number | null
          end_at?: string | null
          focal_point?: string | null
          id?: string
          image_url: string
          is_active?: boolean | null
          link_content_id?: string | null
          link_url?: string | null
          media_type?: string
          media_url?: string | null
          placement?: string
          poster_url?: string | null
          start_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          cta_label?: string | null
          display_order?: number | null
          end_at?: string | null
          focal_point?: string | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          link_content_id?: string | null
          link_url?: string | null
          media_type?: string
          media_url?: string | null
          placement?: string
          poster_url?: string | null
          start_at?: string | null
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
          hype_count: number
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
          hype_count?: number
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
          hype_count?: number
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
          {
            foreignKeyName: "career_assessments_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "career_assessments_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
        ]
      }
      certificates: {
        Row: {
          content_id: string
          course_title: string
          created_at: string
          enrollment_id: string | null
          holder_name: string
          id: string
          issued_at: string
          kind: string
          percentage: number | null
          score: number | null
          talent_id: string
          total_questions: number | null
          track_assignment_id: string | null
          verify_code: string
        }
        Insert: {
          content_id: string
          course_title: string
          created_at?: string
          enrollment_id?: string | null
          holder_name: string
          id?: string
          issued_at?: string
          kind?: string
          percentage?: number | null
          score?: number | null
          talent_id: string
          total_questions?: number | null
          track_assignment_id?: string | null
          verify_code?: string
        }
        Update: {
          content_id?: string
          course_title?: string
          created_at?: string
          enrollment_id?: string | null
          holder_name?: string
          id?: string
          issued_at?: string
          kind?: string
          percentage?: number | null
          score?: number | null
          talent_id?: string
          total_questions?: number | null
          track_assignment_id?: string | null
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
          {
            foreignKeyName: "certificates_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "certificates_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "certificates_track_assignment_id_fkey"
            columns: ["track_assignment_id"]
            isOneToOne: false
            referencedRelation: "learning_track_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      client_group_members: {
        Row: {
          added_at: string
          added_by: string | null
          contact_id: string | null
          conversation_id: string
          id: string
          member_kind: string
          removed_at: string | null
          role: string
          user_id: string | null
          whatsapp_id: string
        }
        Insert: {
          added_at?: string
          added_by?: string | null
          contact_id?: string | null
          conversation_id: string
          id?: string
          member_kind: string
          removed_at?: string | null
          role?: string
          user_id?: string | null
          whatsapp_id: string
        }
        Update: {
          added_at?: string
          added_by?: string | null
          contact_id?: string | null
          conversation_id?: string
          id?: string
          member_kind?: string
          removed_at?: string | null
          role?: string
          user_id?: string | null
          whatsapp_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_group_members_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_group_members_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "messaging_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      cohort_enrollments: {
        Row: {
          cohort_id: string
          enrollment_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          cohort_id: string
          enrollment_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          cohort_id?: string
          enrollment_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cohort_enrollments_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cohort_enrollments_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      cohorts: {
        Row: {
          attendance_threshold_pct: number
          brief_id: string | null
          capacity: number | null
          code: string | null
          content_id: string
          created_at: string
          created_by: string | null
          ends_on: string | null
          id: string
          instructor_engagement_id: string | null
          is_self_paced: boolean
          name: string
          sponsor_company_id: string | null
          starts_on: string | null
          status: Database["public"]["Enums"]["cohort_status"]
          timezone: string
          updated_at: string
        }
        Insert: {
          attendance_threshold_pct?: number
          brief_id?: string | null
          capacity?: number | null
          code?: string | null
          content_id: string
          created_at?: string
          created_by?: string | null
          ends_on?: string | null
          id?: string
          instructor_engagement_id?: string | null
          is_self_paced?: boolean
          name: string
          sponsor_company_id?: string | null
          starts_on?: string | null
          status?: Database["public"]["Enums"]["cohort_status"]
          timezone?: string
          updated_at?: string
        }
        Update: {
          attendance_threshold_pct?: number
          brief_id?: string | null
          capacity?: number | null
          code?: string | null
          content_id?: string
          created_at?: string
          created_by?: string | null
          ends_on?: string | null
          id?: string
          instructor_engagement_id?: string | null
          is_self_paced?: boolean
          name?: string
          sponsor_company_id?: string | null
          starts_on?: string | null
          status?: Database["public"]["Enums"]["cohort_status"]
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cohorts_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cohorts_sponsor_company_id_fkey"
            columns: ["sponsor_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_tips: {
        Row: {
          amount: number
          comment_id: string
          created_at: string
          creator_share: number
          id: string
          platform_share: number
          post_id: string
          recipient_talent_id: string
          sender_talent_id: string
        }
        Insert: {
          amount: number
          comment_id: string
          created_at?: string
          creator_share: number
          id?: string
          platform_share: number
          post_id: string
          recipient_talent_id: string
          sender_talent_id: string
        }
        Update: {
          amount?: number
          comment_id?: string
          created_at?: string
          creator_share?: number
          id?: string
          platform_share?: number
          post_id?: string
          recipient_talent_id?: string
          sender_talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_tips_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_tips_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_tips_recipient_talent_id_fkey"
            columns: ["recipient_talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_tips_recipient_talent_id_fkey"
            columns: ["recipient_talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "comment_tips_recipient_talent_id_fkey"
            columns: ["recipient_talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "comment_tips_sender_talent_id_fkey"
            columns: ["sender_talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_tips_sender_talent_id_fkey"
            columns: ["sender_talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "comment_tips_sender_talent_id_fkey"
            columns: ["sender_talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
        ]
      }
      companies: {
        Row: {
          about: string | null
          address: string | null
          auto_join_domain: string | null
          banner_url: string | null
          country: string | null
          created_at: string | null
          facebook_url: string | null
          goals: string[] | null
          id: string
          industry: string | null
          is_verified: boolean | null
          linkedin_url: string | null
          logo_url: string | null
          name: string
          notes: string | null
          onboarding_completed_at: string | null
          operating_hours: Json | null
          primary_email: string | null
          profile_completion: number
          secondary_emails: Json | null
          slug: string | null
          tagline: string | null
          updated_at: string | null
          verification_tier: Database["public"]["Enums"]["company_verification_tier"]
          website: string | null
        }
        Insert: {
          about?: string | null
          address?: string | null
          auto_join_domain?: string | null
          banner_url?: string | null
          country?: string | null
          created_at?: string | null
          facebook_url?: string | null
          goals?: string[] | null
          id?: string
          industry?: string | null
          is_verified?: boolean | null
          linkedin_url?: string | null
          logo_url?: string | null
          name: string
          notes?: string | null
          onboarding_completed_at?: string | null
          operating_hours?: Json | null
          primary_email?: string | null
          profile_completion?: number
          secondary_emails?: Json | null
          slug?: string | null
          tagline?: string | null
          updated_at?: string | null
          verification_tier?: Database["public"]["Enums"]["company_verification_tier"]
          website?: string | null
        }
        Update: {
          about?: string | null
          address?: string | null
          auto_join_domain?: string | null
          banner_url?: string | null
          country?: string | null
          created_at?: string | null
          facebook_url?: string | null
          goals?: string[] | null
          id?: string
          industry?: string | null
          is_verified?: boolean | null
          linkedin_url?: string | null
          logo_url?: string | null
          name?: string
          notes?: string | null
          onboarding_completed_at?: string | null
          operating_hours?: Json | null
          primary_email?: string | null
          profile_completion?: number
          secondary_emails?: Json | null
          slug?: string | null
          tagline?: string | null
          updated_at?: string | null
          verification_tier?: Database["public"]["Enums"]["company_verification_tier"]
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
            foreignKeyName: "company_agent_leads_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents_with_stats"
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
          {
            foreignKeyName: "company_agent_leads_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "company_agent_leads_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
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
            foreignKeyName: "company_agents_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents_with_stats"
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
      company_course_assignments: {
        Row: {
          assigned_to: string | null
          budget_credits: number
          cohort_id: string | null
          company_id: string
          completed_at: string | null
          content_id: string
          created_at: string
          created_by: string
          credit_cost: number
          due_at: string | null
          enrollment_id: string | null
          id: string
          note: string | null
          overdue_at: string | null
          sponsorship_mode: string
          status: Database["public"]["Enums"]["org_assignment_status"]
          talent_id: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          budget_credits?: number
          cohort_id?: string | null
          company_id: string
          completed_at?: string | null
          content_id: string
          created_at?: string
          created_by: string
          credit_cost?: number
          due_at?: string | null
          enrollment_id?: string | null
          id?: string
          note?: string | null
          overdue_at?: string | null
          sponsorship_mode: string
          status?: Database["public"]["Enums"]["org_assignment_status"]
          talent_id?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          budget_credits?: number
          cohort_id?: string | null
          company_id?: string
          completed_at?: string | null
          content_id?: string
          created_at?: string
          created_by?: string
          credit_cost?: number
          due_at?: string | null
          enrollment_id?: string | null
          id?: string
          note?: string | null
          overdue_at?: string | null
          sponsorship_mode?: string
          status?: Database["public"]["Enums"]["org_assignment_status"]
          talent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_course_assignments_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_course_assignments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_course_assignments_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_course_assignments_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      company_course_sponsorships: {
        Row: {
          assignment_id: string
          company_id: string
          consumed_at: string | null
          credits_granted: number
          granted_at: string
          id: string
          talent_id: string | null
          user_id: string | null
        }
        Insert: {
          assignment_id: string
          company_id: string
          consumed_at?: string | null
          credits_granted?: number
          granted_at?: string
          id?: string
          talent_id?: string | null
          user_id?: string | null
        }
        Update: {
          assignment_id?: string
          company_id?: string
          consumed_at?: string | null
          credits_granted?: number
          granted_at?: string
          id?: string
          talent_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_course_sponsorships_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "company_course_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_course_sponsorships_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_credit_transactions: {
        Row: {
          amount: number
          balance_after: number
          company_id: string
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          service_type: string | null
          transaction_type: string
        }
        Insert: {
          amount: number
          balance_after: number
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          service_type?: string | null
          transaction_type: string
        }
        Update: {
          amount?: number
          balance_after?: number
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          service_type?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_credit_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_credits: {
        Row: {
          balance: number
          company_id: string
          created_at: string
          earned_balance: number
          id: string
          updated_at: string
        }
        Insert: {
          balance?: number
          company_id: string
          created_at?: string
          earned_balance?: number
          id?: string
          updated_at?: string
        }
        Update: {
          balance?: number
          company_id?: string
          created_at?: string
          earned_balance?: number
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_credits_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_lead_activities: {
        Row: {
          activity_type: Database["public"]["Enums"]["crm_activity_type"]
          body: string
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          lead_id: string
        }
        Insert: {
          activity_type?: Database["public"]["Enums"]["crm_activity_type"]
          body: string
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id: string
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["crm_activity_type"]
          body?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_lead_activities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "company_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "v_company_sales_context"
            referencedColumns: ["lead_id"]
          },
        ]
      }
      company_leads: {
        Row: {
          company_id: string
          company_name: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          last_contacted_at: string | null
          linkedin_url: string | null
          name: string
          next_action_at: string | null
          next_step: string | null
          notes: string | null
          offering_id: string | null
          owner_id: string | null
          owner_user_id: string | null
          phone: string | null
          source: string | null
          stage: Database["public"]["Enums"]["crm_lead_stage"]
          tags: string[]
          title: string | null
          updated_at: string
          value_usd: number | null
        }
        Insert: {
          company_id: string
          company_name?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          last_contacted_at?: string | null
          linkedin_url?: string | null
          name: string
          next_action_at?: string | null
          next_step?: string | null
          notes?: string | null
          offering_id?: string | null
          owner_id?: string | null
          owner_user_id?: string | null
          phone?: string | null
          source?: string | null
          stage?: Database["public"]["Enums"]["crm_lead_stage"]
          tags?: string[]
          title?: string | null
          updated_at?: string
          value_usd?: number | null
        }
        Update: {
          company_id?: string
          company_name?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          last_contacted_at?: string | null
          linkedin_url?: string | null
          name?: string
          next_action_at?: string | null
          next_step?: string | null
          notes?: string | null
          offering_id?: string | null
          owner_id?: string | null
          owner_user_id?: string | null
          phone?: string | null
          source?: string | null
          stage?: Database["public"]["Enums"]["crm_lead_stage"]
          tags?: string[]
          title?: string | null
          updated_at?: string
          value_usd?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "company_leads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_leads_offering_id_fkey"
            columns: ["offering_id"]
            isOneToOne: false
            referencedRelation: "company_offerings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_leads_offering_id_fkey"
            columns: ["offering_id"]
            isOneToOne: false
            referencedRelation: "v_company_sales_context"
            referencedColumns: ["offering_id"]
          },
        ]
      }
      company_learning_seats: {
        Row: {
          cohort_id: string | null
          company_id: string
          content_id: string | null
          created_at: string
          expires_at: string | null
          id: string
          seats_total: number
          seats_used: number
          source: string
          updated_at: string
        }
        Insert: {
          cohort_id?: string | null
          company_id: string
          content_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          seats_total?: number
          seats_used?: number
          source?: string
          updated_at?: string
        }
        Update: {
          cohort_id?: string | null
          company_id?: string
          content_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          seats_total?: number
          seats_used?: number
          source?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_learning_seats_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_learning_seats_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_learning_seats_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
        ]
      }
      company_members: {
        Row: {
          company_id: string
          created_at: string
          id: string
          invited_email: string | null
          role: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          invited_email?: string | null
          role?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          invited_email?: string | null
          role?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_offerings: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          currency: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          kind: string
          name: string
          price_max: number | null
          price_min: number | null
          tagline: string | null
          tags: string[]
          unit: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          currency?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          kind: string
          name: string
          price_max?: number | null
          price_min?: number | null
          tagline?: string | null
          tags?: string[]
          unit?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          currency?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          kind?: string
          name?: string
          price_max?: number | null
          price_min?: number | null
          tagline?: string | null
          tags?: string[]
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_offerings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_outreach_log: {
        Row: {
          channel: string
          company_id: string | null
          contact_id: string | null
          id: string
          message: string | null
          metadata: Json | null
          response_at: string | null
          sent_at: string
          sent_by: string | null
          status: string
          subject: string | null
          template: string | null
        }
        Insert: {
          channel?: string
          company_id?: string | null
          contact_id?: string | null
          id?: string
          message?: string | null
          metadata?: Json | null
          response_at?: string | null
          sent_at?: string
          sent_by?: string | null
          status?: string
          subject?: string | null
          template?: string | null
        }
        Update: {
          channel?: string
          company_id?: string | null
          contact_id?: string | null
          id?: string
          message?: string | null
          metadata?: Json | null
          response_at?: string | null
          sent_at?: string
          sent_by?: string | null
          status?: string
          subject?: string | null
          template?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_outreach_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_outreach_log_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      company_post_drafts: {
        Row: {
          agent_key: string | null
          author_user_id: string
          company_id: string
          created_at: string
          id: string
          link_preview: Json | null
          link_url: string | null
          media_url: string | null
          published_post_id: string | null
          status: string
          tags: string[] | null
          text_content: string
          updated_at: string
        }
        Insert: {
          agent_key?: string | null
          author_user_id: string
          company_id: string
          created_at?: string
          id?: string
          link_preview?: Json | null
          link_url?: string | null
          media_url?: string | null
          published_post_id?: string | null
          status?: string
          tags?: string[] | null
          text_content: string
          updated_at?: string
        }
        Update: {
          agent_key?: string | null
          author_user_id?: string
          company_id?: string
          created_at?: string
          id?: string
          link_preview?: Json | null
          link_url?: string | null
          media_url?: string | null
          published_post_id?: string | null
          status?: string
          tags?: string[] | null
          text_content?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_post_drafts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_post_drafts_published_post_id_fkey"
            columns: ["published_post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      company_services: {
        Row: {
          company_id: string
          created_at: string
          service_key: string
        }
        Insert: {
          company_id: string
          created_at?: string
          service_key: string
        }
        Update: {
          company_id?: string
          created_at?: string
          service_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_services_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_talent_reveals: {
        Row: {
          company_id: string
          credits_spent: number
          id: string
          revealed_at: string
          revealed_by: string
          talent_id: string
        }
        Insert: {
          company_id: string
          credits_spent?: number
          id?: string
          revealed_at?: string
          revealed_by: string
          talent_id: string
        }
        Update: {
          company_id?: string
          credits_spent?: number
          id?: string
          revealed_at?: string
          revealed_by?: string
          talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_talent_reveals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_talent_reveals_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_talent_reveals_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "company_talent_reveals_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
        ]
      }
      company_talent_shortlists: {
        Row: {
          added_by: string
          company_id: string
          created_at: string
          id: string
          note: string | null
          talent_id: string
        }
        Insert: {
          added_by: string
          company_id: string
          created_at?: string
          id?: string
          note?: string | null
          talent_id: string
        }
        Update: {
          added_by?: string
          company_id?: string
          created_at?: string
          id?: string
          note?: string | null
          talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_talent_shortlists_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_talent_shortlists_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_talent_shortlists_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "company_talent_shortlists_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
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
          {
            foreignKeyName: "competition_submissions_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "competition_submissions_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
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
          institution_id: string | null
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
          institution_id?: string | null
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
          institution_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "competitions_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_bonus_grants: {
        Row: {
          company_id: string
          granted_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          granted_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          granted_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_bonus_grants_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
          source_detail: string | null
          updated_at: string | null
          user_id: string | null
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
          source_detail?: string | null
          updated_at?: string | null
          user_id?: string | null
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
          source_detail?: string | null
          updated_at?: string | null
          user_id?: string | null
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
          author_status: string
          b2b_audience: string[]
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
          event_timezone: string
          hype_count: number
          id: string
          instructor_name: string | null
          is_b2b: boolean
          is_private: boolean | null
          is_published: boolean | null
          is_ready: boolean
          learning_objectives: Json | null
          max_capacity: number | null
          modules_count: number | null
          pass_threshold: number | null
          price: number | null
          profession_level_id: string | null
          profession_line_id: string | null
          quiz_enabled: boolean | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          slug: string
          submitted_at: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          venue_address: string | null
          venue_name: string | null
          whatsapp_group_link: string | null
          youtube_url: string | null
        }
        Insert: {
          author_status?: string
          b2b_audience?: string[]
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
          event_timezone?: string
          hype_count?: number
          id?: string
          instructor_name?: string | null
          is_b2b?: boolean
          is_private?: boolean | null
          is_published?: boolean | null
          is_ready?: boolean
          learning_objectives?: Json | null
          max_capacity?: number | null
          modules_count?: number | null
          pass_threshold?: number | null
          price?: number | null
          profession_level_id?: string | null
          profession_line_id?: string | null
          quiz_enabled?: boolean | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          slug: string
          submitted_at?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          venue_address?: string | null
          venue_name?: string | null
          whatsapp_group_link?: string | null
          youtube_url?: string | null
        }
        Update: {
          author_status?: string
          b2b_audience?: string[]
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
          event_timezone?: string
          hype_count?: number
          id?: string
          instructor_name?: string | null
          is_b2b?: boolean
          is_private?: boolean | null
          is_published?: boolean | null
          is_ready?: boolean
          learning_objectives?: Json | null
          max_capacity?: number | null
          modules_count?: number | null
          pass_threshold?: number | null
          price?: number | null
          profession_level_id?: string | null
          profession_line_id?: string | null
          quiz_enabled?: boolean | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          slug?: string
          submitted_at?: string | null
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
      content_hypes: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          credits: number
          id: string
          sender_talent_id: string
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          credits?: number
          id?: string
          sender_talent_id: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          credits?: number
          id?: string
          sender_talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_hypes_sender_talent_id_fkey"
            columns: ["sender_talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_hypes_sender_talent_id_fkey"
            columns: ["sender_talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "content_hypes_sender_talent_id_fkey"
            columns: ["sender_talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
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
      content_lead_applications: {
        Row: {
          created_at: string
          id: string
          motivation: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          school_preference: string | null
          status: string
          talent_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          motivation: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          school_preference?: string | null
          status?: string
          talent_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          motivation?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          school_preference?: string | null
          status?: string
          talent_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_lead_applications_school_preference_fkey"
            columns: ["school_preference"]
            isOneToOne: false
            referencedRelation: "school_readiness_v"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "content_lead_applications_school_preference_fkey"
            columns: ["school_preference"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_lead_applications_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_lead_applications_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "content_lead_applications_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
        ]
      }
      content_reports: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          reason: string
          reporter_id: string
          resolved_at: string | null
          resolved_by: string | null
          scope: string
          scope_id: string
          status: Database["public"]["Enums"]["report_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          reason: string
          reporter_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          scope: string
          scope_id: string
          status?: Database["public"]["Enums"]["report_status"]
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          reason?: string
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          scope?: string
          scope_id?: string
          status?: Database["public"]["Enums"]["report_status"]
        }
        Relationships: []
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
      country_knowledge_packs: {
        Row: {
          body_markdown: string
          country_code: string
          created_at: string
          display_order: number
          id: string
          is_published: boolean
          kind: string
          source_url: string | null
          title: string
          updated_at: string
          valid_through: string | null
        }
        Insert: {
          body_markdown?: string
          country_code: string
          created_at?: string
          display_order?: number
          id?: string
          is_published?: boolean
          kind: string
          source_url?: string | null
          title: string
          updated_at?: string
          valid_through?: string | null
        }
        Update: {
          body_markdown?: string
          country_code?: string
          created_at?: string
          display_order?: number
          id?: string
          is_published?: boolean
          kind?: string
          source_url?: string | null
          title?: string
          updated_at?: string
          valid_through?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "country_knowledge_packs_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "destination_agents"
            referencedColumns: ["country_code"]
          },
        ]
      }
      course_affiliate_clicks: {
        Row: {
          clicked_at: string
          content_id: string
          id: string
          ref_code: string
          talent_id: string
        }
        Insert: {
          clicked_at?: string
          content_id: string
          id?: string
          ref_code: string
          talent_id: string
        }
        Update: {
          clicked_at?: string
          content_id?: string
          id?: string
          ref_code?: string
          talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_affiliate_clicks_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_affiliate_clicks_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_affiliate_clicks_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "course_affiliate_clicks_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
        ]
      }
      course_briefs: {
        Row: {
          budget_amount: number | null
          budget_currency: string
          content_id: string | null
          created_at: string
          created_by: string
          duration_weeks: number | null
          id: string
          instructor_job_id: string | null
          instructor_user_id: string | null
          language: string
          mode: string
          required_skills: Json
          revenue_share_pct: number
          status: string
          summary: string | null
          syllabus: Json
          target_launch: string | null
          title: string
          updated_at: string
        }
        Insert: {
          budget_amount?: number | null
          budget_currency?: string
          content_id?: string | null
          created_at?: string
          created_by: string
          duration_weeks?: number | null
          id?: string
          instructor_job_id?: string | null
          instructor_user_id?: string | null
          language?: string
          mode?: string
          required_skills?: Json
          revenue_share_pct?: number
          status?: string
          summary?: string | null
          syllabus?: Json
          target_launch?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          budget_amount?: number | null
          budget_currency?: string
          content_id?: string | null
          created_at?: string
          created_by?: string
          duration_weeks?: number | null
          id?: string
          instructor_job_id?: string | null
          instructor_user_id?: string | null
          language?: string
          mode?: string
          required_skills?: Json
          revenue_share_pct?: number
          status?: string
          summary?: string | null
          syllabus?: Json
          target_launch?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_briefs_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_briefs_instructor_job_id_fkey"
            columns: ["instructor_job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      course_engagements: {
        Row: {
          ai_credit_cap: number
          brief_id: string | null
          content_id: string
          created_at: string
          ended_at: string | null
          hired_via_application_id: string | null
          hired_via_offer_id: string | null
          id: string
          revenue_share_pct: number
          role: string
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_credit_cap?: number
          brief_id?: string | null
          content_id: string
          created_at?: string
          ended_at?: string | null
          hired_via_application_id?: string | null
          hired_via_offer_id?: string | null
          id?: string
          revenue_share_pct?: number
          role?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_credit_cap?: number
          brief_id?: string | null
          content_id?: string
          created_at?: string
          ended_at?: string | null
          hired_via_application_id?: string | null
          hired_via_offer_id?: string | null
          id?: string
          revenue_share_pct?: number
          role?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_engagements_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "course_briefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_engagements_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_engagements_hired_via_application_id_fkey"
            columns: ["hired_via_application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_engagements_hired_via_offer_id_fkey"
            columns: ["hired_via_offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
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
      course_project_subtasks: {
        Row: {
          ai_feedback: string | null
          ai_score: number | null
          brief: string | null
          created_at: string
          credit_reward: number
          display_order: number
          expected_format: string | null
          id: string
          kind: Database["public"]["Enums"]["course_subtask_kind"]
          module_id: string | null
          project_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          status: Database["public"]["Enums"]["course_subtask_status"]
          submitted_at: string | null
          submitted_files: Json
          submitted_notes: string | null
          title: string
          updated_at: string
        }
        Insert: {
          ai_feedback?: string | null
          ai_score?: number | null
          brief?: string | null
          created_at?: string
          credit_reward?: number
          display_order?: number
          expected_format?: string | null
          id?: string
          kind: Database["public"]["Enums"]["course_subtask_kind"]
          module_id?: string | null
          project_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["course_subtask_status"]
          submitted_at?: string | null
          submitted_files?: Json
          submitted_notes?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          ai_feedback?: string | null
          ai_score?: number | null
          brief?: string | null
          created_at?: string
          credit_reward?: number
          display_order?: number
          expected_format?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["course_subtask_kind"]
          module_id?: string | null
          project_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["course_subtask_status"]
          submitted_at?: string | null
          submitted_files?: Json
          submitted_notes?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_project_subtasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "course_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      course_projects: {
        Row: {
          approved_at: string | null
          claimed_at: string | null
          claimed_by: string | null
          completion_bonus: number
          course_id: string
          created_at: string
          created_by: string | null
          deadline: string | null
          id: string
          is_published: boolean
          paid_at: string | null
          progress_percent: number
          published_at: string | null
          reviewer_notes: string | null
          status: Database["public"]["Enums"]["course_project_status"]
          submitted_at: string | null
          total_credit_reward: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          completion_bonus?: number
          course_id: string
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          id?: string
          is_published?: boolean
          paid_at?: string | null
          progress_percent?: number
          published_at?: string | null
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["course_project_status"]
          submitted_at?: string | null
          total_credit_reward?: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          completion_bonus?: number
          course_id?: string
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          id?: string
          is_published?: boolean
          paid_at?: string | null
          progress_percent?: number
          published_at?: string | null
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["course_project_status"]
          submitted_at?: string | null
          total_credit_reward?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_projects_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_projects_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "course_projects_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "course_projects_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: true
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
        ]
      }
      course_revenue_splits: {
        Row: {
          content_id: string
          created_at: string
          currency: string
          engagement_id: string | null
          fees_amount: number
          gross_amount: number
          id: string
          instructor_amount: number
          instructor_user_id: string
          net_amount: number
          paid_at: string | null
          platform_amount: number
          share_pct: number
          source_id: string | null
          source_table: string
          status: string
        }
        Insert: {
          content_id: string
          created_at?: string
          currency?: string
          engagement_id?: string | null
          fees_amount?: number
          gross_amount?: number
          id?: string
          instructor_amount?: number
          instructor_user_id: string
          net_amount?: number
          paid_at?: string | null
          platform_amount?: number
          share_pct?: number
          source_id?: string | null
          source_table: string
          status?: string
        }
        Update: {
          content_id?: string
          created_at?: string
          currency?: string
          engagement_id?: string | null
          fees_amount?: number
          gross_amount?: number
          id?: string
          instructor_amount?: number
          instructor_user_id?: string
          net_amount?: number
          paid_at?: string | null
          platform_amount?: number
          share_pct?: number
          source_id?: string | null
          source_table?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_revenue_splits_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_revenue_splits_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "course_engagements"
            referencedColumns: ["id"]
          },
        ]
      }
      course_sessions: {
        Row: {
          attendance_threshold_pct: number | null
          cohort_id: string | null
          content_id: string
          created_at: string
          description: string | null
          duration_minutes: number | null
          event_timezone: string | null
          id: string
          instructor_id: string | null
          is_mandatory: boolean
          kind: Database["public"]["Enums"]["session_kind"]
          meeting_link: string | null
          module_id: string | null
          recording_link: string | null
          resources: Json
          scheduled_date: string
          status: Database["public"]["Enums"]["session_status"]
          title: string
          updated_at: string
        }
        Insert: {
          attendance_threshold_pct?: number | null
          cohort_id?: string | null
          content_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          event_timezone?: string | null
          id?: string
          instructor_id?: string | null
          is_mandatory?: boolean
          kind?: Database["public"]["Enums"]["session_kind"]
          meeting_link?: string | null
          module_id?: string | null
          recording_link?: string | null
          resources?: Json
          scheduled_date: string
          status?: Database["public"]["Enums"]["session_status"]
          title: string
          updated_at?: string
        }
        Update: {
          attendance_threshold_pct?: number | null
          cohort_id?: string | null
          content_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          event_timezone?: string | null
          id?: string
          instructor_id?: string | null
          is_mandatory?: boolean
          kind?: Database["public"]["Enums"]["session_kind"]
          meeting_link?: string | null
          module_id?: string | null
          recording_link?: string | null
          resources?: Json
          scheduled_date?: string
          status?: Database["public"]["Enums"]["session_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_sessions_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
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
      creator_badges: {
        Row: {
          badge: string
          granted_at: string
          talent_id: string
        }
        Insert: {
          badge: string
          granted_at?: string
          talent_id: string
        }
        Update: {
          badge?: string
          granted_at?: string
          talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_badges_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_badges_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "creator_badges_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
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
          {
            foreignKeyName: "credit_invoices_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "credit_invoices_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
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
          source: string | null
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
          source?: string | null
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
          source?: string | null
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
          {
            foreignKeyName: "credit_transactions_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "credit_transactions_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
        ]
      }
      crm_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: string | null
          company_id: string | null
          created_at: string
          diff: Json | null
          entity_id: string
          entity_type: string
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: string | null
          company_id?: string | null
          created_at?: string
          diff?: Json | null
          entity_id: string
          entity_type: string
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: string | null
          company_id?: string | null
          created_at?: string
          diff?: Json | null
          entity_id?: string
          entity_type?: string
          id?: string
        }
        Relationships: []
      }
      currency_rates: {
        Row: {
          code: string
          country_codes: string[] | null
          name: string
          symbol: string
          updated_at: string
          usd_rate: number
        }
        Insert: {
          code: string
          country_codes?: string[] | null
          name: string
          symbol: string
          updated_at?: string
          usd_rate: number
        }
        Update: {
          code?: string
          country_codes?: string[] | null
          name?: string
          symbol?: string
          updated_at?: string
          usd_rate?: number
        }
        Relationships: []
      }
      destination_agent_messages: {
        Row: {
          content: string
          country_code: string
          created_at: string
          credits_spent: number | null
          id: string
          role: string
          tool_payload: Json | null
          user_id: string
        }
        Insert: {
          content?: string
          country_code: string
          created_at?: string
          credits_spent?: number | null
          id?: string
          role: string
          tool_payload?: Json | null
          user_id: string
        }
        Update: {
          content?: string
          country_code?: string
          created_at?: string
          credits_spent?: number | null
          id?: string
          role?: string
          tool_payload?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      destination_agents: {
        Row: {
          country_code: string
          created_at: string
          default_currency: string | null
          display_name: string
          display_order: number
          flag_emoji: string | null
          intake_terms: string[] | null
          is_active: boolean
          system_prompt: string
          tagline: string | null
          updated_at: string
          visa_processing_weeks: number | null
        }
        Insert: {
          country_code: string
          created_at?: string
          default_currency?: string | null
          display_name: string
          display_order?: number
          flag_emoji?: string | null
          intake_terms?: string[] | null
          is_active?: boolean
          system_prompt?: string
          tagline?: string | null
          updated_at?: string
          visa_processing_weeks?: number | null
        }
        Update: {
          country_code?: string
          created_at?: string
          default_currency?: string | null
          display_name?: string
          display_order?: number
          flag_emoji?: string | null
          intake_terms?: string[] | null
          is_active?: boolean
          system_prompt?: string
          tagline?: string | null
          updated_at?: string
          visa_processing_weeks?: number | null
        }
        Relationships: []
      }
      direct_message_threads: {
        Row: {
          company_id: string
          created_at: string
          id: string
          last_message_at: string | null
          relationship_id: string | null
          subject: string | null
          talent_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          relationship_id?: string | null
          subject?: string | null
          talent_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          relationship_id?: string | null
          subject?: string | null
          talent_id?: string
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          attachments: Json | null
          body: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
          sender_role: string
          thread_id: string
        }
        Insert: {
          attachments?: Json | null
          body: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
          sender_role: string
          thread_id: string
        }
        Update: {
          attachments?: Json | null
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
          sender_role?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "direct_message_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      discovery_rules: {
        Row: {
          key: string
          updated_at: string
          weights: Json
        }
        Insert: {
          key: string
          updated_at?: string
          weights?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          weights?: Json
        }
        Relationships: []
      }
      discovery_signals: {
        Row: {
          created_at: string
          entity_id: string
          entity_kind: string
          id: number
          metadata: Json
          signal: string
          weight: number
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_kind: string
          id?: number
          metadata?: Json
          signal: string
          weight?: number
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_kind?: string
          id?: number
          metadata?: Json
          signal?: string
          weight?: number
        }
        Relationships: []
      }
      discussion_posts: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          is_hidden: boolean
          is_solution: boolean
          parent_post_id: string | null
          thread_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          is_hidden?: boolean
          is_solution?: boolean
          parent_post_id?: string | null
          thread_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          is_hidden?: boolean
          is_solution?: boolean
          parent_post_id?: string | null
          thread_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "discussion_posts_parent_post_id_fkey"
            columns: ["parent_post_id"]
            isOneToOne: false
            referencedRelation: "discussion_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussion_posts_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "discussion_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      discussion_threads: {
        Row: {
          author_id: string
          body: string | null
          cohort_id: string
          content_id: string | null
          created_at: string
          id: string
          is_hidden: boolean
          is_locked: boolean
          is_pinned: boolean
          last_post_at: string
          module_id: string | null
          post_count: number
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          body?: string | null
          cohort_id: string
          content_id?: string | null
          created_at?: string
          id?: string
          is_hidden?: boolean
          is_locked?: boolean
          is_pinned?: boolean
          last_post_at?: string
          module_id?: string | null
          post_count?: number
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string | null
          cohort_id?: string
          content_id?: string | null
          created_at?: string
          id?: string
          is_hidden?: boolean
          is_locked?: boolean
          is_pinned?: boolean
          last_post_at?: string
          module_id?: string | null
          post_count?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "discussion_threads_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussion_threads_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
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
          {
            foreignKeyName: "email_notifications_log_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "email_notifications_log_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
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
          resource_state: Json
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
          resource_state?: Json
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
          resource_state?: Json
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
          assignment_id: string | null
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
          sponsor_company_id: string | null
          status: Database["public"]["Enums"]["enrollment_status"] | null
          student_id: string
          talent_id: string | null
          updated_at: string | null
        }
        Insert: {
          assignment_id?: string | null
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
          sponsor_company_id?: string | null
          status?: Database["public"]["Enums"]["enrollment_status"] | null
          student_id: string
          talent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          assignment_id?: string | null
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
          sponsor_company_id?: string | null
          status?: Database["public"]["Enums"]["enrollment_status"] | null
          student_id?: string
          talent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "company_course_assignments"
            referencedColumns: ["id"]
          },
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
            foreignKeyName: "enrollments_sponsor_company_id_fkey"
            columns: ["sponsor_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
          {
            foreignKeyName: "enrollments_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "enrollments_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
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
          {
            foreignKeyName: "feed_interactions_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "feed_interactions_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
        ]
      }
      feed_posts: {
        Row: {
          audience: string
          author_avatar: string | null
          author_company_id: string | null
          author_name: string
          author_title: string | null
          author_type: string
          author_user_id: string | null
          comment_count: number
          content_type: Database["public"]["Enums"]["post_content_type"]
          created_at: string | null
          hype_count: number
          id: string
          impression_count: number
          is_active: boolean | null
          is_pinned: boolean | null
          link_preview: Json | null
          link_url: string | null
          media_url: string | null
          poll_ends_at: string | null
          poll_options: Json | null
          save_count: number
          share_count: number
          status: string
          tags: string[] | null
          talent_id: string | null
          text_content: string
          updated_at: string | null
        }
        Insert: {
          audience?: string
          author_avatar?: string | null
          author_company_id?: string | null
          author_name: string
          author_title?: string | null
          author_type?: string
          author_user_id?: string | null
          comment_count?: number
          content_type?: Database["public"]["Enums"]["post_content_type"]
          created_at?: string | null
          hype_count?: number
          id?: string
          impression_count?: number
          is_active?: boolean | null
          is_pinned?: boolean | null
          link_preview?: Json | null
          link_url?: string | null
          media_url?: string | null
          poll_ends_at?: string | null
          poll_options?: Json | null
          save_count?: number
          share_count?: number
          status?: string
          tags?: string[] | null
          talent_id?: string | null
          text_content: string
          updated_at?: string | null
        }
        Update: {
          audience?: string
          author_avatar?: string | null
          author_company_id?: string | null
          author_name?: string
          author_title?: string | null
          author_type?: string
          author_user_id?: string | null
          comment_count?: number
          content_type?: Database["public"]["Enums"]["post_content_type"]
          created_at?: string | null
          hype_count?: number
          id?: string
          impression_count?: number
          is_active?: boolean | null
          is_pinned?: boolean | null
          link_preview?: Json | null
          link_url?: string | null
          media_url?: string | null
          poll_ends_at?: string | null
          poll_options?: Json | null
          save_count?: number
          share_count?: number
          status?: string
          tags?: string[] | null
          talent_id?: string | null
          text_content?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feed_posts_author_company_id_fkey"
            columns: ["author_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_posts_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_posts_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "feed_posts_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
        ]
      }
      fin_payment_configs: {
        Row: {
          account_details: Json
          created_at: string
          id: string
          is_active: boolean
          label: string
          notes: string | null
          provider: string
          status: string
          updated_at: string
        }
        Insert: {
          account_details?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          notes?: string | null
          provider: string
          status?: string
          updated_at?: string
        }
        Update: {
          account_details?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          notes?: string | null
          provider?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      followed_companies: {
        Row: {
          company_name: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          company_name: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          company_name?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      gig_bid_events: {
        Row: {
          bid_id: string
          created_at: string
          event: string
          id: string
          payload: Json
        }
        Insert: {
          bid_id: string
          created_at?: string
          event: string
          id?: string
          payload?: Json
        }
        Update: {
          bid_id?: string
          created_at?: string
          event?: string
          id?: string
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "gig_bid_events_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: false
            referencedRelation: "marketplace_bids"
            referencedColumns: ["id"]
          },
        ]
      }
      gig_briefs: {
        Row: {
          company_id: string | null
          context: Json | null
          created_at: string
          id: string
          posted_by: string
          poster_kind: string
          preferred_deadline: string | null
          preferred_kind: string | null
          published_gig_id: string | null
          published_gig_kind: string | null
          raw_ask: string
          status: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          context?: Json | null
          created_at?: string
          id?: string
          posted_by: string
          poster_kind?: string
          preferred_deadline?: string | null
          preferred_kind?: string | null
          published_gig_id?: string | null
          published_gig_kind?: string | null
          raw_ask: string
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          context?: Json | null
          created_at?: string
          id?: string
          posted_by?: string
          poster_kind?: string
          preferred_deadline?: string | null
          preferred_kind?: string | null
          published_gig_id?: string | null
          published_gig_kind?: string | null
          raw_ask?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      gig_disputes: {
        Row: {
          created_at: string
          evidence: Json
          final_verdict: string | null
          gig_id: string
          id: string
          narrative: string
          opened_by: string
          opened_by_role: string
          reason_code: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          submission_id: string | null
          updated_at: string
          verification_id: string | null
        }
        Insert: {
          created_at?: string
          evidence?: Json
          final_verdict?: string | null
          gig_id: string
          id?: string
          narrative: string
          opened_by: string
          opened_by_role: string
          reason_code: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          submission_id?: string | null
          updated_at?: string
          verification_id?: string | null
        }
        Update: {
          created_at?: string
          evidence?: Json
          final_verdict?: string | null
          gig_id?: string
          id?: string
          narrative?: string
          opened_by?: string
          opened_by_role?: string
          reason_code?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          submission_id?: string | null
          updated_at?: string
          verification_id?: string | null
        }
        Relationships: []
      }
      gig_escrow_accounts: {
        Row: {
          balance_credits: number
          held_credits: number
          project_id: string
          refunded_credits: number
          released_credits: number
          updated_at: string
        }
        Insert: {
          balance_credits?: number
          held_credits?: number
          project_id: string
          refunded_credits?: number
          released_credits?: number
          updated_at?: string
        }
        Update: {
          balance_credits?: number
          held_credits?: number
          project_id?: string
          refunded_credits?: number
          released_credits?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gig_escrow_accounts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "gig_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      gig_escrow_ledger: {
        Row: {
          actor_id: string | null
          created_at: string
          delta: number
          id: string
          kind: string
          milestone_id: string | null
          project_id: string
          reason: string | null
          talent_id: string | null
          tx_ref: string | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          delta: number
          id?: string
          kind: string
          milestone_id?: string | null
          project_id: string
          reason?: string | null
          talent_id?: string | null
          tx_ref?: string | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          delta?: number
          id?: string
          kind?: string
          milestone_id?: string | null
          project_id?: string
          reason?: string | null
          talent_id?: string | null
          tx_ref?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gig_escrow_ledger_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "gig_project_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gig_escrow_ledger_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "gig_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gig_escrow_ledger_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gig_escrow_ledger_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "gig_escrow_ledger_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
        ]
      }
      gig_match_digests: {
        Row: {
          channel: string
          digest_date: string
          id: string
          match_count: number
          match_ids: string[]
          sent_at: string
          talent_id: string
        }
        Insert: {
          channel?: string
          digest_date?: string
          id?: string
          match_count?: number
          match_ids?: string[]
          sent_at?: string
          talent_id: string
        }
        Update: {
          channel?: string
          digest_date?: string
          id?: string
          match_count?: number
          match_ids?: string[]
          sent_at?: string
          talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gig_match_digests_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gig_match_digests_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "gig_match_digests_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
        ]
      }
      gig_matches: {
        Row: {
          created_at: string
          expires_at: string
          gig_id: string
          gig_kind: string
          id: string
          offered_at: string
          score: number
          signals: Json
          status: string
          talent_id: string
          updated_at: string
          viewed_at: string | null
          why_text: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string
          gig_id: string
          gig_kind: string
          id?: string
          offered_at?: string
          score?: number
          signals?: Json
          status?: string
          talent_id: string
          updated_at?: string
          viewed_at?: string | null
          why_text?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          gig_id?: string
          gig_kind?: string
          id?: string
          offered_at?: string
          score?: number
          signals?: Json
          status?: string
          talent_id?: string
          updated_at?: string
          viewed_at?: string | null
          why_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gig_matches_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gig_matches_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "gig_matches_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
        ]
      }
      gig_project_assignments: {
        Row: {
          accepted_at: string | null
          created_at: string
          id: string
          milestone_id: string
          role: string | null
          split_pct: number
          status: string
          talent_id: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          milestone_id: string
          role?: string | null
          split_pct?: number
          status?: string
          talent_id: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          milestone_id?: string
          role?: string | null
          split_pct?: number
          status?: string
          talent_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gig_project_assignments_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "gig_project_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gig_project_assignments_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gig_project_assignments_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "gig_project_assignments_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
        ]
      }
      gig_project_invitations: {
        Row: {
          created_at: string
          id: string
          invited_by: string
          milestone_id: string | null
          note: string | null
          project_id: string
          responded_at: string | null
          status: string
          talent_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by: string
          milestone_id?: string | null
          note?: string | null
          project_id: string
          responded_at?: string | null
          status?: string
          talent_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string
          milestone_id?: string | null
          note?: string | null
          project_id?: string
          responded_at?: string | null
          status?: string
          talent_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gig_project_invitations_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "gig_project_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gig_project_invitations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "gig_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gig_project_invitations_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gig_project_invitations_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "gig_project_invitations_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
        ]
      }
      gig_project_messages: {
        Row: {
          attachments: Json
          body: string
          created_at: string
          id: string
          project_id: string
          sender_id: string
        }
        Insert: {
          attachments?: Json
          body: string
          created_at?: string
          id?: string
          project_id: string
          sender_id: string
        }
        Update: {
          attachments?: Json
          body?: string
          created_at?: string
          id?: string
          project_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gig_project_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "gig_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      gig_project_milestones: {
        Row: {
          acceptance_criteria: Json
          budget_credits: number
          created_at: string
          due_at: string | null
          gig_id: string | null
          gig_kind: string | null
          id: string
          project_id: string
          seq: number
          status: string
          submission_id: string | null
          summary: string | null
          title: string
          updated_at: string
          verification_id: string | null
        }
        Insert: {
          acceptance_criteria?: Json
          budget_credits?: number
          created_at?: string
          due_at?: string | null
          gig_id?: string | null
          gig_kind?: string | null
          id?: string
          project_id: string
          seq?: number
          status?: string
          submission_id?: string | null
          summary?: string | null
          title: string
          updated_at?: string
          verification_id?: string | null
        }
        Update: {
          acceptance_criteria?: Json
          budget_credits?: number
          created_at?: string
          due_at?: string | null
          gig_id?: string | null
          gig_kind?: string | null
          id?: string
          project_id?: string
          seq?: number
          status?: string
          submission_id?: string | null
          summary?: string | null
          title?: string
          updated_at?: string
          verification_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gig_project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "gig_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      gig_projects: {
        Row: {
          budget_credits: number
          category: string | null
          company_id: string
          created_at: string
          created_by: string
          currency_display: string
          due_at: string | null
          id: string
          scope_doc: Json
          starts_at: string | null
          status: string
          summary: string | null
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          budget_credits?: number
          category?: string | null
          company_id: string
          created_at?: string
          created_by: string
          currency_display?: string
          due_at?: string | null
          id?: string
          scope_doc?: Json
          starts_at?: string | null
          status?: string
          summary?: string | null
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          budget_credits?: number
          category?: string | null
          company_id?: string
          created_at?: string
          created_by?: string
          currency_display?: string
          due_at?: string | null
          id?: string
          scope_doc?: Json
          starts_at?: string | null
          status?: string
          summary?: string | null
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "gig_projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      gig_review_assignments: {
        Row: {
          claimed_at: string | null
          confidence: number | null
          created_at: string
          due_at: string
          gig_id: string | null
          id: string
          kind: string
          offered_at: string
          payout_credits: number
          rationale: string | null
          reviewer_id: string
          source_id: string
          status: string
          submission_id: string | null
          submitted_at: string | null
          time_spent_s: number | null
          updated_at: string
          verdict: string | null
          verdict_payload: Json | null
        }
        Insert: {
          claimed_at?: string | null
          confidence?: number | null
          created_at?: string
          due_at?: string
          gig_id?: string | null
          id?: string
          kind: string
          offered_at?: string
          payout_credits?: number
          rationale?: string | null
          reviewer_id: string
          source_id: string
          status?: string
          submission_id?: string | null
          submitted_at?: string | null
          time_spent_s?: number | null
          updated_at?: string
          verdict?: string | null
          verdict_payload?: Json | null
        }
        Update: {
          claimed_at?: string | null
          confidence?: number | null
          created_at?: string
          due_at?: string
          gig_id?: string | null
          id?: string
          kind?: string
          offered_at?: string
          payout_credits?: number
          rationale?: string | null
          reviewer_id?: string
          source_id?: string
          status?: string
          submission_id?: string | null
          submitted_at?: string | null
          time_spent_s?: number | null
          updated_at?: string
          verdict?: string | null
          verdict_payload?: Json | null
        }
        Relationships: []
      }
      gig_revision_requests: {
        Row: {
          attempts_remaining: number
          created_at: string
          due_at: string
          id: string
          required_changes: Json
          resolution_payload: Json | null
          resolved_at: string | null
          status: string
          summary: string
          talent_id: string
          updated_at: string
          verification_id: string
        }
        Insert: {
          attempts_remaining?: number
          created_at?: string
          due_at?: string
          id?: string
          required_changes?: Json
          resolution_payload?: Json | null
          resolved_at?: string | null
          status?: string
          summary: string
          talent_id: string
          updated_at?: string
          verification_id: string
        }
        Update: {
          attempts_remaining?: number
          created_at?: string
          due_at?: string
          id?: string
          required_changes?: Json
          resolution_payload?: Json | null
          resolved_at?: string | null
          status?: string
          summary?: string
          talent_id?: string
          updated_at?: string
          verification_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gig_revision_requests_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gig_revision_requests_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "gig_revision_requests_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "gig_revision_requests_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "gig_verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      gig_scope_drafts: {
        Row: {
          acceptance_criteria: Json
          brief_id: string
          created_at: string
          deliverables: Json
          description: string
          estimated_credits: number | null
          id: string
          is_chosen: boolean
          model_used: string | null
          rationale: string | null
          recommended_kind: string
          required_skills: string[] | null
          suggested_deadline_days: number | null
          title: string
          version: number
        }
        Insert: {
          acceptance_criteria?: Json
          brief_id: string
          created_at?: string
          deliverables?: Json
          description: string
          estimated_credits?: number | null
          id?: string
          is_chosen?: boolean
          model_used?: string | null
          rationale?: string | null
          recommended_kind: string
          required_skills?: string[] | null
          suggested_deadline_days?: number | null
          title: string
          version?: number
        }
        Update: {
          acceptance_criteria?: Json
          brief_id?: string
          created_at?: string
          deliverables?: Json
          description?: string
          estimated_credits?: number | null
          id?: string
          is_chosen?: boolean
          model_used?: string | null
          rationale?: string | null
          recommended_kind?: string
          required_skills?: string[] | null
          suggested_deadline_days?: number | null
          title?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "gig_scope_drafts_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "gig_briefs"
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
          {
            foreignKeyName: "gig_share_logs_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "gig_share_logs_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
        ]
      }
      gig_submissions: {
        Row: {
          admin_notes: string | null
          ai_feedback: string | null
          ai_score: number | null
          auto_decision: string | null
          created_at: string | null
          credits_awarded: number | null
          gig_id: string
          id: string
          processed_at: string | null
          reviewed_at: string | null
          status: string
          submission_data: Json | null
          talent_id: string
        }
        Insert: {
          admin_notes?: string | null
          ai_feedback?: string | null
          ai_score?: number | null
          auto_decision?: string | null
          created_at?: string | null
          credits_awarded?: number | null
          gig_id: string
          id?: string
          processed_at?: string | null
          reviewed_at?: string | null
          status?: string
          submission_data?: Json | null
          talent_id: string
        }
        Update: {
          admin_notes?: string | null
          ai_feedback?: string | null
          ai_score?: number | null
          auto_decision?: string | null
          created_at?: string | null
          credits_awarded?: number | null
          gig_id?: string
          id?: string
          processed_at?: string | null
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
          {
            foreignKeyName: "gig_submissions_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "gig_submissions_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
        ]
      }
      gig_verification_appeals: {
        Row: {
          created_at: string
          evidence_links: Json
          id: string
          reason: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          talent_id: string
          verification_id: string
        }
        Insert: {
          created_at?: string
          evidence_links?: Json
          id?: string
          reason: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          talent_id: string
          verification_id: string
        }
        Update: {
          created_at?: string
          evidence_links?: Json
          id?: string
          reason?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          talent_id?: string
          verification_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gig_verification_appeals_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gig_verification_appeals_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "gig_verification_appeals_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "gig_verification_appeals_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "gig_verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      gig_verifications: {
        Row: {
          created_at: string
          criteria_results: Json
          gig_id: string | null
          gig_kind: string
          id: string
          latency_ms: number | null
          model: string | null
          rationale: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          risk_flags: Json
          score: number | null
          submission_id: string
          suggested_revisions: Json
          talent_id: string
          tokens_used: number | null
          updated_at: string
          verdict: string
        }
        Insert: {
          created_at?: string
          criteria_results?: Json
          gig_id?: string | null
          gig_kind: string
          id?: string
          latency_ms?: number | null
          model?: string | null
          rationale?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_flags?: Json
          score?: number | null
          submission_id: string
          suggested_revisions?: Json
          talent_id: string
          tokens_used?: number | null
          updated_at?: string
          verdict?: string
        }
        Update: {
          created_at?: string
          criteria_results?: Json
          gig_id?: string | null
          gig_kind?: string
          id?: string
          latency_ms?: number | null
          model?: string | null
          rationale?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_flags?: Json
          score?: number | null
          submission_id?: string
          suggested_revisions?: Json
          talent_id?: string
          tokens_used?: number | null
          updated_at?: string
          verdict?: string
        }
        Relationships: [
          {
            foreignKeyName: "gig_verifications_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gig_verifications_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "gig_verifications_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
        ]
      }
      gigs: {
        Row: {
          acceptance_criteria: Json | null
          auto_approval_config: Json
          auto_approval_mode: string
          category: string
          created_at: string | null
          credit_reward: number
          deadline: string | null
          description: string
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          max_completions_per_user: number | null
          requirements: string | null
          skills: string[]
          source_brief_id: string | null
          title: string
          total_budget: number | null
          total_completed: number | null
          updated_at: string | null
        }
        Insert: {
          acceptance_criteria?: Json | null
          auto_approval_config?: Json
          auto_approval_mode?: string
          category: string
          created_at?: string | null
          credit_reward?: number
          deadline?: string | null
          description: string
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          max_completions_per_user?: number | null
          requirements?: string | null
          skills?: string[]
          source_brief_id?: string | null
          title: string
          total_budget?: number | null
          total_completed?: number | null
          updated_at?: string | null
        }
        Update: {
          acceptance_criteria?: Json | null
          auto_approval_config?: Json
          auto_approval_mode?: string
          category?: string
          created_at?: string | null
          credit_reward?: number
          deadline?: string | null
          description?: string
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          max_completions_per_user?: number | null
          requirements?: string | null
          skills?: string[]
          source_brief_id?: string | null
          title?: string
          total_budget?: number | null
          total_completed?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gigs_source_brief_id_fkey"
            columns: ["source_brief_id"]
            isOneToOne: false
            referencedRelation: "gig_briefs"
            referencedColumns: ["id"]
          },
        ]
      }
      gro10x_agent_threads: {
        Row: {
          agent_key: string
          agent_thread_id: string | null
          company_id: string
          created_at: string
          id: string
          last_message: string | null
          last_message_at: string | null
          pinned: boolean
          unread_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_key: string
          agent_thread_id?: string | null
          company_id: string
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          pinned?: boolean
          unread_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_key?: string
          agent_thread_id?: string | null
          company_id?: string
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          pinned?: boolean
          unread_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gro10x_agent_threads_agent_thread_id_fkey"
            columns: ["agent_thread_id"]
            isOneToOne: false
            referencedRelation: "agent_threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gro10x_agent_threads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      gtm_cities: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          region_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          region_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          region_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gtm_cities_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "gtm_regions"
            referencedColumns: ["id"]
          },
        ]
      }
      gtm_clusters: {
        Row: {
          cities: string[] | null
          countries: string[] | null
          created_at: string
          description: string | null
          id: string
          name: string
          owner_user_id: string | null
          updated_at: string
        }
        Insert: {
          cities?: string[] | null
          countries?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_user_id?: string | null
          updated_at?: string
        }
        Update: {
          cities?: string[] | null
          countries?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_user_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      gtm_countries: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          iso2: string
          name: string
          tier: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          iso2: string
          name: string
          tier?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          iso2?: string
          name?: string
          tier?: string | null
        }
        Relationships: []
      }
      gtm_regions: {
        Row: {
          code: string | null
          country_id: string | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          code?: string | null
          country_id?: string | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string | null
          country_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "gtm_regions_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "gtm_countries"
            referencedColumns: ["id"]
          },
        ]
      }
      headless_pool: {
        Row: {
          balance: number
          id: number
          month_anchor: string
          monthly_cap: number
          spent_this_month: number
          updated_at: string
        }
        Insert: {
          balance?: number
          id?: number
          month_anchor?: string
          monthly_cap?: number
          spent_this_month?: number
          updated_at?: string
        }
        Update: {
          balance?: number
          id?: number
          month_anchor?: string
          monthly_cap?: number
          spent_this_month?: number
          updated_at?: string
        }
        Relationships: []
      }
      hr_functions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          vertical_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          vertical_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          vertical_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_functions_vertical_id_fkey"
            columns: ["vertical_id"]
            isOneToOne: false
            referencedRelation: "hr_verticals"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_grades: {
        Row: {
          created_at: string
          description: string | null
          id: string
          level: number
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          level?: number
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          level?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      hr_onboarding_tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          due_date: string | null
          id: string
          notes: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hr_payroll_runs: {
        Row: {
          base_amount: number
          created_at: string
          currency: string
          id: string
          incentive_amount: number
          notes: string | null
          period_end: string
          period_start: string
          status: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          base_amount?: number
          created_at?: string
          currency?: string
          id?: string
          incentive_amount?: number
          notes?: string | null
          period_end: string
          period_start: string
          status?: string
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          base_amount?: number
          created_at?: string
          currency?: string
          id?: string
          incentive_amount?: number
          notes?: string | null
          period_end?: string
          period_start?: string
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hr_targets: {
        Row: {
          created_at: string
          id: string
          incentive_amount: number | null
          metric: string
          notes: string | null
          period_end: string | null
          period_start: string | null
          scope: string
          scope_id: string | null
          target_value: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          incentive_amount?: number | null
          metric: string
          notes?: string | null
          period_end?: string | null
          period_start?: string | null
          scope?: string
          scope_id?: string | null
          target_value?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          incentive_amount?: number | null
          metric?: string
          notes?: string | null
          period_end?: string | null
          period_start?: string | null
          scope?: string
          scope_id?: string | null
          target_value?: number
          updated_at?: string
        }
        Relationships: []
      }
      hr_teams: {
        Row: {
          created_at: string
          description: string | null
          function_id: string | null
          id: string
          lead_user_id: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          function_id?: string | null
          id?: string
          lead_user_id?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          function_id?: string | null
          id?: string
          lead_user_id?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_teams_function_id_fkey"
            columns: ["function_id"]
            isOneToOne: false
            referencedRelation: "hr_functions"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_verticals: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      ielts_daily_challenges: {
        Row: {
          challenge_date: string
          created_at: string
          prompt_id: string | null
          section: string | null
        }
        Insert: {
          challenge_date?: string
          created_at?: string
          prompt_id?: string | null
          section?: string | null
        }
        Update: {
          challenge_date?: string
          created_at?: string
          prompt_id?: string | null
          section?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ielts_daily_challenges_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "ielts_prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      ielts_mock_attempts: {
        Row: {
          ai_band_score: number | null
          ai_feedback: Json | null
          audio_path: string | null
          created_at: string
          credits_spent: number | null
          id: string
          is_free_attempt: boolean | null
          prompt_id: string | null
          response_text: string | null
          section: string
          user_id: string
        }
        Insert: {
          ai_band_score?: number | null
          ai_feedback?: Json | null
          audio_path?: string | null
          created_at?: string
          credits_spent?: number | null
          id?: string
          is_free_attempt?: boolean | null
          prompt_id?: string | null
          response_text?: string | null
          section: string
          user_id: string
        }
        Update: {
          ai_band_score?: number | null
          ai_feedback?: Json | null
          audio_path?: string | null
          created_at?: string
          credits_spent?: number | null
          id?: string
          is_free_attempt?: boolean | null
          prompt_id?: string | null
          response_text?: string | null
          section?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ielts_mock_attempts_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "ielts_prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      ielts_prompts: {
        Row: {
          audio_url: string | null
          band_target: number | null
          created_at: string
          difficulty: string | null
          id: string
          is_active: boolean
          prompt_text: string
          reference_text: string | null
          section: string
          task_type: string | null
        }
        Insert: {
          audio_url?: string | null
          band_target?: number | null
          created_at?: string
          difficulty?: string | null
          id?: string
          is_active?: boolean
          prompt_text: string
          reference_text?: string | null
          section: string
          task_type?: string | null
        }
        Update: {
          audio_url?: string | null
          band_target?: number | null
          created_at?: string
          difficulty?: string | null
          id?: string
          is_active?: boolean
          prompt_text?: string
          reference_text?: string | null
          section?: string
          task_type?: string | null
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
          {
            foreignKeyName: "ielts_resource_access_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "ielts_resource_access_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
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
      ielts_streaks: {
        Row: {
          badges: string[] | null
          current_streak_days: number
          last_practice_at: string | null
          longest_streak_days: number
          updated_at: string
          user_id: string
          xp_total: number
        }
        Insert: {
          badges?: string[] | null
          current_streak_days?: number
          last_practice_at?: string | null
          longest_streak_days?: number
          updated_at?: string
          user_id: string
          xp_total?: number
        }
        Update: {
          badges?: string[] | null
          current_streak_days?: number
          last_practice_at?: string | null
          longest_streak_days?: number
          updated_at?: string
          user_id?: string
          xp_total?: number
        }
        Relationships: []
      }
      institution_clubs: {
        Row: {
          created_at: string
          department: string | null
          id: string
          institution_id: string
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          id?: string
          institution_id: string
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string | null
          id?: string
          institution_id?: string
          name?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "institution_clubs_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      institution_events: {
        Row: {
          created_at: string
          ends_at: string | null
          id: string
          institution_id: string
          location: string | null
          notes: string | null
          starts_at: string | null
          status: string
          title: string
          type: string
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          id?: string
          institution_id: string
          location?: string | null
          notes?: string | null
          starts_at?: string | null
          status?: string
          title: string
          type?: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          id?: string
          institution_id?: string
          location?: string | null
          notes?: string | null
          starts_at?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "institution_events_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      institution_representatives: {
        Row: {
          club_id: string | null
          created_at: string
          email: string | null
          id: string
          institution_id: string
          name: string
          notes: string | null
          phone: string | null
          role: string | null
          updated_at: string
        }
        Insert: {
          club_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          institution_id: string
          name: string
          notes?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          club_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          institution_id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "institution_representatives_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "institution_clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "institution_representatives_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      institution_types: {
        Row: {
          created_at: string
          id: string
          key: string
          label: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          label: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          label?: string
          sort_order?: number
        }
        Relationships: []
      }
      institutions: {
        Row: {
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          country: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          status: string
          type: string
          updated_at: string
          website: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          status?: string
          type?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          status?: string
          type?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      instructor_connection_requests: {
        Row: {
          created_at: string
          id: string
          instructor_id: string | null
          message: string | null
          profession_id: string | null
          school_id: string
          status: string
          talent_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          instructor_id?: string | null
          message?: string | null
          profession_id?: string | null
          school_id: string
          status?: string
          talent_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          instructor_id?: string | null
          message?: string | null
          profession_id?: string | null
          school_id?: string
          status?: string
          talent_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_connection_requests_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "ai_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_connection_requests_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "school_readiness_v"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "instructor_connection_requests_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_connection_requests_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_connection_requests_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "instructor_connection_requests_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
        ]
      }
      instructor_credit_balances: {
        Row: {
          balance: number
          content_id: string | null
          id: string
          last_grant_at: string | null
          monthly_grant: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          content_id?: string | null
          id?: string
          last_grant_at?: string | null
          monthly_grant?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          content_id?: string | null
          id?: string
          last_grant_at?: string | null
          monthly_grant?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_credit_balances_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_credit_ledger: {
        Row: {
          content_id: string | null
          created_at: string
          delta: number
          id: string
          reason: string
          ref_id: string | null
          user_id: string
        }
        Insert: {
          content_id?: string | null
          created_at?: string
          delta: number
          id?: string
          reason: string
          ref_id?: string | null
          user_id: string
        }
        Update: {
          content_id?: string | null
          created_at?: string
          delta?: number
          id?: string
          reason?: string
          ref_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_credit_ledger_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_earnings_ledger: {
        Row: {
          amount_credits: number
          created_at: string
          id: string
          instructor_id: string | null
          instructor_user_id: string
          notes: string | null
          payout_request_id: string | null
          period_month: string
          source_id: string | null
          source_kind: string
          status: string
          talent_id: string | null
          updated_at: string
        }
        Insert: {
          amount_credits: number
          created_at?: string
          id?: string
          instructor_id?: string | null
          instructor_user_id: string
          notes?: string | null
          payout_request_id?: string | null
          period_month: string
          source_id?: string | null
          source_kind: string
          status?: string
          talent_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_credits?: number
          created_at?: string
          id?: string
          instructor_id?: string | null
          instructor_user_id?: string
          notes?: string | null
          payout_request_id?: string | null
          period_month?: string
          source_id?: string | null
          source_kind?: string
          status?: string
          talent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iel_payout_fk"
            columns: ["payout_request_id"]
            isOneToOne: false
            referencedRelation: "instructor_payout_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_earnings_ledger_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_earnings_ledger_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_earnings_ledger_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_earnings_ledger_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "instructor_earnings_ledger_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
        ]
      }
      instructor_payout_requests: {
        Row: {
          admin_notes: string | null
          amount_credits: number
          created_at: string
          fx_rate_bdt: number | null
          id: string
          instructor_user_id: string
          payout_details: Json
          payout_method: string
          processed_at: string | null
          processed_by: string | null
          status: string
          talent_id: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          amount_credits: number
          created_at?: string
          fx_rate_bdt?: number | null
          id?: string
          instructor_user_id: string
          payout_details?: Json
          payout_method: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          talent_id?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          amount_credits?: number
          created_at?: string
          fx_rate_bdt?: number | null
          id?: string
          instructor_user_id?: string
          payout_details?: Json
          payout_method?: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          talent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_payout_requests_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_payout_requests_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "instructor_payout_requests_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
        ]
      }
      instructor_statements: {
        Row: {
          created_at: string
          emailed_at: string | null
          id: string
          instructor_user_id: string
          pdf_path: string | null
          period_month: string
          summary: Json
        }
        Insert: {
          created_at?: string
          emailed_at?: string | null
          id?: string
          instructor_user_id: string
          pdf_path?: string | null
          period_month: string
          summary?: Json
        }
        Update: {
          created_at?: string
          emailed_at?: string | null
          id?: string
          instructor_user_id?: string
          pdf_path?: string | null
          period_month?: string
          summary?: Json
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
      interview_slots: {
        Row: {
          created_at: string
          duration_min: number
          id: string
          interview_id: string
          proposed_by_role: string
          starts_at: string
        }
        Insert: {
          created_at?: string
          duration_min?: number
          id?: string
          interview_id: string
          proposed_by_role?: string
          starts_at: string
        }
        Update: {
          created_at?: string
          duration_min?: number
          id?: string
          interview_id?: string
          proposed_by_role?: string
          starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_slots_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "interviews"
            referencedColumns: ["id"]
          },
        ]
      }
      interviews: {
        Row: {
          application_id: string
          company_id: string
          created_at: string
          created_by: string | null
          duration_min: number
          id: string
          location: string | null
          meeting_link: string | null
          mode: Database["public"]["Enums"]["interview_mode"]
          note: string | null
          selected_slot_id: string | null
          status: Database["public"]["Enums"]["interview_status"]
          talent_id: string
          updated_at: string
        }
        Insert: {
          application_id: string
          company_id: string
          created_at?: string
          created_by?: string | null
          duration_min?: number
          id?: string
          location?: string | null
          meeting_link?: string | null
          mode?: Database["public"]["Enums"]["interview_mode"]
          note?: string | null
          selected_slot_id?: string | null
          status?: Database["public"]["Enums"]["interview_status"]
          talent_id: string
          updated_at?: string
        }
        Update: {
          application_id?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          duration_min?: number
          id?: string
          location?: string | null
          meeting_link?: string | null
          mode?: Database["public"]["Enums"]["interview_mode"]
          note?: string | null
          selected_slot_id?: string | null
          status?: Database["public"]["Enums"]["interview_status"]
          talent_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      ir_data_room_documents: {
        Row: {
          created_at: string
          created_by: string | null
          doc_type: string
          external_url: string | null
          file_url: string | null
          id: string
          is_active: boolean
          title: string
          total_slides: number | null
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          doc_type: string
          external_url?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean
          title: string
          total_slides?: number | null
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          doc_type?: string
          external_url?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean
          title?: string
          total_slides?: number | null
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      ir_data_room_share_links: {
        Row: {
          created_at: string
          created_by: string | null
          document_id: string
          expires_at: string | null
          id: string
          investor_id: string | null
          require_email: boolean
          revoked_at: string | null
          token: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          document_id: string
          expires_at?: string | null
          id?: string
          investor_id?: string | null
          require_email?: boolean
          revoked_at?: string | null
          token?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          document_id?: string
          expires_at?: string | null
          id?: string
          investor_id?: string | null
          require_email?: boolean
          revoked_at?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "ir_data_room_share_links_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "ir_data_room_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ir_data_room_share_links_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "ir_investors"
            referencedColumns: ["id"]
          },
        ]
      }
      ir_document_slide_events: {
        Row: {
          created_at: string
          dwell_seconds: number
          id: string
          slide_label: string | null
          slide_number: number
          view_id: string
        }
        Insert: {
          created_at?: string
          dwell_seconds?: number
          id?: string
          slide_label?: string | null
          slide_number: number
          view_id: string
        }
        Update: {
          created_at?: string
          dwell_seconds?: number
          id?: string
          slide_label?: string | null
          slide_number?: number
          view_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ir_document_slide_events_view_id_fkey"
            columns: ["view_id"]
            isOneToOne: false
            referencedRelation: "ir_document_views"
            referencedColumns: ["id"]
          },
        ]
      }
      ir_document_views: {
        Row: {
          completed: boolean
          document_id: string
          ended_at: string | null
          id: string
          investor_id: string | null
          share_link_id: string | null
          started_at: string
          total_seconds: number
          user_agent: string | null
          viewer_email: string | null
          viewer_ip: unknown
        }
        Insert: {
          completed?: boolean
          document_id: string
          ended_at?: string | null
          id?: string
          investor_id?: string | null
          share_link_id?: string | null
          started_at?: string
          total_seconds?: number
          user_agent?: string | null
          viewer_email?: string | null
          viewer_ip?: unknown
        }
        Update: {
          completed?: boolean
          document_id?: string
          ended_at?: string | null
          id?: string
          investor_id?: string | null
          share_link_id?: string | null
          started_at?: string
          total_seconds?: number
          user_agent?: string | null
          viewer_email?: string | null
          viewer_ip?: unknown
        }
        Relationships: [
          {
            foreignKeyName: "ir_document_views_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "ir_data_room_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ir_document_views_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "ir_investors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ir_document_views_share_link_id_fkey"
            columns: ["share_link_id"]
            isOneToOne: false
            referencedRelation: "ir_data_room_share_links"
            referencedColumns: ["id"]
          },
        ]
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
      ir_fpa_conversations: {
        Row: {
          created_at: string
          id: string
          last_answer_summary: string | null
          last_question: string | null
          message_count: number | null
          session_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_answer_summary?: string | null
          last_question?: string | null
          message_count?: number | null
          session_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          last_answer_summary?: string | null
          last_question?: string | null
          message_count?: number | null
          session_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ir_influencers: {
        Row: {
          contact_json: Json | null
          country: string | null
          created_at: string
          email: string | null
          id: string
          linkedin_url: string | null
          name: string
          notes: string | null
          organization: string | null
          owner_user_id: string | null
          role: string | null
          tags: string[] | null
          tier: string | null
          updated_at: string
        }
        Insert: {
          contact_json?: Json | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          linkedin_url?: string | null
          name: string
          notes?: string | null
          organization?: string | null
          owner_user_id?: string | null
          role?: string | null
          tags?: string[] | null
          tier?: string | null
          updated_at?: string
        }
        Update: {
          contact_json?: Json | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          linkedin_url?: string | null
          name?: string
          notes?: string | null
          organization?: string | null
          owner_user_id?: string | null
          role?: string | null
          tags?: string[] | null
          tier?: string | null
          updated_at?: string
        }
        Relationships: []
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
          check_size_max_usd: number | null
          check_size_min_usd: number | null
          created_at: string | null
          email: string | null
          expected_close_date: string | null
          full_name: string
          id: string
          investment_stage_pref: string | null
          investor_interests: string[] | null
          last_contacted_at: string | null
          last_feedback_summary: string | null
          lead_capability: string
          linkedin_url: string | null
          notes: string | null
          phone: string | null
          pipeline_position: number
          pipeline_stage: string
          probability_pct: number
          relationship_summary: string | null
          stage_changed_at: string
          subscription_status: string | null
          title: string | null
          twitter_handle: string | null
          updated_at: string | null
          vc_firm_id: string | null
        }
        Insert: {
          check_size_max_usd?: number | null
          check_size_min_usd?: number | null
          created_at?: string | null
          email?: string | null
          expected_close_date?: string | null
          full_name: string
          id?: string
          investment_stage_pref?: string | null
          investor_interests?: string[] | null
          last_contacted_at?: string | null
          last_feedback_summary?: string | null
          lead_capability?: string
          linkedin_url?: string | null
          notes?: string | null
          phone?: string | null
          pipeline_position?: number
          pipeline_stage?: string
          probability_pct?: number
          relationship_summary?: string | null
          stage_changed_at?: string
          subscription_status?: string | null
          title?: string | null
          twitter_handle?: string | null
          updated_at?: string | null
          vc_firm_id?: string | null
        }
        Update: {
          check_size_max_usd?: number | null
          check_size_min_usd?: number | null
          created_at?: string | null
          email?: string | null
          expected_close_date?: string | null
          full_name?: string
          id?: string
          investment_stage_pref?: string | null
          investor_interests?: string[] | null
          last_contacted_at?: string | null
          last_feedback_summary?: string | null
          lead_capability?: string
          linkedin_url?: string | null
          notes?: string | null
          phone?: string | null
          pipeline_position?: number
          pipeline_stage?: string
          probability_pct?: number
          relationship_summary?: string | null
          stage_changed_at?: string
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
          active_users_dau: number | null
          active_users_mau: number | null
          active_users_wau: number | null
          ai_inference_cogs_usd: number | null
          arr_usd: number | null
          automated_actions_count: number | null
          contractor_fte: number | null
          created_at: string | null
          gross_revenue_retention_pct: number | null
          headcount_fte: number | null
          hitl_actions_count: number | null
          hitl_labor_cogs_usd: number | null
          id: string
          mom_growth_rate: number | null
          mrr_usd: number | null
          net_revenue_retention_pct: number | null
          paying_users: number | null
          revenue_per_employee_usd: number | null
          service_breakdown: Json | null
          snapshot_date: string
          total_credits_consumed: number | null
          total_users: number | null
          usage_retention_pct: number | null
        }
        Insert: {
          active_users_dau?: number | null
          active_users_mau?: number | null
          active_users_wau?: number | null
          ai_inference_cogs_usd?: number | null
          arr_usd?: number | null
          automated_actions_count?: number | null
          contractor_fte?: number | null
          created_at?: string | null
          gross_revenue_retention_pct?: number | null
          headcount_fte?: number | null
          hitl_actions_count?: number | null
          hitl_labor_cogs_usd?: number | null
          id?: string
          mom_growth_rate?: number | null
          mrr_usd?: number | null
          net_revenue_retention_pct?: number | null
          paying_users?: number | null
          revenue_per_employee_usd?: number | null
          service_breakdown?: Json | null
          snapshot_date?: string
          total_credits_consumed?: number | null
          total_users?: number | null
          usage_retention_pct?: number | null
        }
        Update: {
          active_users_dau?: number | null
          active_users_mau?: number | null
          active_users_wau?: number | null
          ai_inference_cogs_usd?: number | null
          arr_usd?: number | null
          automated_actions_count?: number | null
          contractor_fte?: number | null
          created_at?: string | null
          gross_revenue_retention_pct?: number | null
          headcount_fte?: number | null
          hitl_actions_count?: number | null
          hitl_labor_cogs_usd?: number | null
          id?: string
          mom_growth_rate?: number | null
          mrr_usd?: number | null
          net_revenue_retention_pct?: number | null
          paying_users?: number | null
          revenue_per_employee_usd?: number | null
          service_breakdown?: Json | null
          snapshot_date?: string
          total_credits_consumed?: number | null
          total_users?: number | null
          usage_retention_pct?: number | null
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
      ir_outreach_log: {
        Row: {
          body: string | null
          channel: string
          created_at: string
          created_by: string | null
          id: string
          sentiment: string | null
          status: string | null
          subject: string | null
          target_id: string | null
          target_label: string | null
          target_type: string
        }
        Insert: {
          body?: string | null
          channel: string
          created_at?: string
          created_by?: string | null
          id?: string
          sentiment?: string | null
          status?: string | null
          subject?: string | null
          target_id?: string | null
          target_label?: string | null
          target_type: string
        }
        Update: {
          body?: string | null
          channel?: string
          created_at?: string
          created_by?: string | null
          id?: string
          sentiment?: string | null
          status?: string | null
          subject?: string | null
          target_id?: string | null
          target_label?: string | null
          target_type?: string
        }
        Relationships: []
      }
      ir_pipeline_events: {
        Row: {
          changed_by: string | null
          created_at: string
          from_stage: string | null
          id: string
          investor_id: string | null
          note: string | null
          to_stage: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          from_stage?: string | null
          id?: string
          investor_id?: string | null
          note?: string | null
          to_stage: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          from_stage?: string | null
          id?: string
          investor_id?: string | null
          note?: string | null
          to_stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "ir_pipeline_events_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "ir_investors"
            referencedColumns: ["id"]
          },
        ]
      }
      ir_retention_cohorts: {
        Row: {
          active_users: number
          cohort_month: string
          cohort_size: number
          created_at: string
          expansion_revenue_usd: number | null
          id: string
          period_index: number
          retained_revenue_usd: number | null
        }
        Insert: {
          active_users: number
          cohort_month: string
          cohort_size: number
          created_at?: string
          expansion_revenue_usd?: number | null
          id?: string
          period_index: number
          retained_revenue_usd?: number | null
        }
        Update: {
          active_users?: number
          cohort_month?: string
          cohort_size?: number
          created_at?: string
          expansion_revenue_usd?: number | null
          id?: string
          period_index?: number
          retained_revenue_usd?: number | null
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
          {
            foreignKeyName: "job_application_usage_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "job_application_usage_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
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
          last_status_at: string | null
          professional_id: string | null
          source: string
          sourced: boolean
          sourced_relationship_id: string | null
          talent_id: string | null
          withdrawn_at: string | null
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
          last_status_at?: string | null
          professional_id?: string | null
          source?: string
          sourced?: boolean
          sourced_relationship_id?: string | null
          talent_id?: string | null
          withdrawn_at?: string | null
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
          last_status_at?: string | null
          professional_id?: string | null
          source?: string
          sourced?: boolean
          sourced_relationship_id?: string | null
          talent_id?: string | null
          withdrawn_at?: string | null
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
            foreignKeyName: "job_applications_sourced_relationship_id_fkey"
            columns: ["sourced_relationship_id"]
            isOneToOne: false
            referencedRelation: "talent_relationships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "job_applications_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
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
          {
            foreignKeyName: "job_apply_clicks_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "job_apply_clicks_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
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
          {
            foreignKeyName: "job_assessments_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "job_assessments_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
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
      job_invitations: {
        Row: {
          company_id: string
          created_at: string
          expires_at: string
          id: string
          invited_by: string | null
          job_id: string
          note: string | null
          responded_at: string | null
          status: Database["public"]["Enums"]["invitation_status"]
          talent_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          job_id: string
          note?: string | null
          responded_at?: string | null
          status?: Database["public"]["Enums"]["invitation_status"]
          talent_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          job_id?: string
          note?: string | null
          responded_at?: string | null
          status?: Database["public"]["Enums"]["invitation_status"]
          talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_invitations_job_id_fkey"
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
          {
            foreignKeyName: "job_share_clicks_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "job_share_clicks_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
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
      job_views: {
        Row: {
          id: string
          job_id: string
          talent_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          job_id: string
          talent_id: string
          viewed_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          talent_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_views_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_views_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_views_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "job_views_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
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
          course_brief_id: string | null
          created_at: string | null
          deadline: string | null
          description: string
          experience_level: Database["public"]["Enums"]["experience_level"]
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          job_kind: string
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
          course_brief_id?: string | null
          created_at?: string | null
          deadline?: string | null
          description: string
          experience_level?: Database["public"]["Enums"]["experience_level"]
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          job_kind?: string
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
          course_brief_id?: string | null
          created_at?: string | null
          deadline?: string | null
          description?: string
          experience_level?: Database["public"]["Enums"]["experience_level"]
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          job_kind?: string
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
            foreignKeyName: "jobs_course_brief_fk"
            columns: ["course_brief_id"]
            isOneToOne: false
            referencedRelation: "course_briefs"
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
      language_bookings: {
        Row: {
          created_at: string
          credits_spent: number
          duration_mins: number
          id: string
          instructor_user_id: string
          language_code: string
          meet_url: string | null
          scheduled_at: string
          status: string
          talent_user_id: string
        }
        Insert: {
          created_at?: string
          credits_spent: number
          duration_mins?: number
          id?: string
          instructor_user_id: string
          language_code: string
          meet_url?: string | null
          scheduled_at: string
          status?: string
          talent_user_id: string
        }
        Update: {
          created_at?: string
          credits_spent?: number
          duration_mins?: number
          id?: string
          instructor_user_id?: string
          language_code?: string
          meet_url?: string | null
          scheduled_at?: string
          status?: string
          talent_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "language_bookings_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      language_instructors: {
        Row: {
          bio: string | null
          cefr_proof_url: string | null
          created_at: string
          display_name: string
          hourly_rate_credits: number
          id: string
          is_active: boolean
          is_verified: boolean
          native_language: string | null
          rating: number | null
          teaches_languages: string[]
          user_id: string
        }
        Insert: {
          bio?: string | null
          cefr_proof_url?: string | null
          created_at?: string
          display_name: string
          hourly_rate_credits?: number
          id?: string
          is_active?: boolean
          is_verified?: boolean
          native_language?: string | null
          rating?: number | null
          teaches_languages?: string[]
          user_id: string
        }
        Update: {
          bio?: string | null
          cefr_proof_url?: string | null
          created_at?: string
          display_name?: string
          hourly_rate_credits?: number
          id?: string
          is_active?: boolean
          is_verified?: boolean
          native_language?: string | null
          rating?: number | null
          teaches_languages?: string[]
          user_id?: string
        }
        Relationships: []
      }
      language_levels: {
        Row: {
          code: string
          description: string
          display_order: number
        }
        Insert: {
          code: string
          description: string
          display_order: number
        }
        Update: {
          code?: string
          description?: string
          display_order?: number
        }
        Relationships: []
      }
      language_practice_sessions: {
        Row: {
          cefr_level: string | null
          corrections: Json | null
          created_at: string
          credits_spent: number | null
          ended_at: string | null
          id: string
          language_code: string
          transcript: Json | null
          user_id: string
        }
        Insert: {
          cefr_level?: string | null
          corrections?: Json | null
          created_at?: string
          credits_spent?: number | null
          ended_at?: string | null
          id?: string
          language_code: string
          transcript?: Json | null
          user_id: string
        }
        Update: {
          cefr_level?: string | null
          corrections?: Json | null
          created_at?: string
          credits_spent?: number | null
          ended_at?: string | null
          id?: string
          language_code?: string
          transcript?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      languages: {
        Row: {
          code: string
          display_order: number
          flag_emoji: string | null
          is_active: boolean
          name: string
        }
        Insert: {
          code: string
          display_order?: number
          flag_emoji?: string | null
          is_active?: boolean
          name: string
        }
        Update: {
          code?: string
          display_order?: number
          flag_emoji?: string | null
          is_active?: boolean
          name?: string
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
          {
            foreignKeyName: "lead_hunt_matches_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "lead_hunt_matches_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
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
      leaderboard_payouts: {
        Row: {
          credits_awarded: number
          id: string
          paid_at: string
          rank: number
          talent_id: string
          week_start: string
        }
        Insert: {
          credits_awarded: number
          id?: string
          paid_at?: string
          rank: number
          talent_id: string
          week_start: string
        }
        Update: {
          credits_awarded?: number
          id?: string
          paid_at?: string
          rank?: number
          talent_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_payouts_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaderboard_payouts_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "leaderboard_payouts_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
        ]
      }
      leaderboard_snapshots: {
        Row: {
          category: string | null
          computed_at: string
          id: string
          kind: string
          payload: Json
          period: string
        }
        Insert: {
          category?: string | null
          computed_at?: string
          id?: string
          kind: string
          payload?: Json
          period: string
        }
        Update: {
          category?: string | null
          computed_at?: string
          id?: string
          kind?: string
          payload?: Json
          period?: string
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
          {
            foreignKeyName: "learning_activity_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "learning_activity_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
        ]
      }
      learning_track_assignments: {
        Row: {
          assigned_by: string | null
          completed_at: string | null
          created_at: string
          due_at: string | null
          id: string
          last_due_soon_notified_at: string | null
          org_id: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["track_assignment_status"]
          talent_id: string | null
          track_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          completed_at?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          last_due_soon_notified_at?: string | null
          org_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["track_assignment_status"]
          talent_id?: string | null
          track_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          completed_at?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          last_due_soon_notified_at?: string | null
          org_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["track_assignment_status"]
          talent_id?: string | null
          track_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_track_assignments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_track_assignments_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "learning_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_track_items: {
        Row: {
          content_id: string
          created_at: string
          id: string
          is_required: boolean
          position: number
          track_id: string
        }
        Insert: {
          content_id: string
          created_at?: string
          id?: string
          is_required?: boolean
          position?: number
          track_id: string
        }
        Update: {
          content_id?: string
          created_at?: string
          id?: string
          is_required?: boolean
          position?: number
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_track_items_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_track_items_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "learning_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_tracks: {
        Row: {
          b2b_enabled: boolean
          company_id: string | null
          cover_url: string | null
          created_at: string
          created_by: string | null
          enrollment_credits: number
          id: string
          is_published: boolean
          is_sequential: boolean
          owner_kind: string
          slug: string
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          b2b_enabled?: boolean
          company_id?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          enrollment_credits?: number
          id?: string
          is_published?: boolean
          is_sequential?: boolean
          owner_kind?: string
          slug: string
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          b2b_enabled?: boolean
          company_id?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          enrollment_credits?: number
          id?: string
          is_published?: boolean
          is_sequential?: boolean
          owner_kind?: string
          slug?: string
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_tracks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_answers: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          is_hidden: boolean
          is_instructor: boolean
          question_id: string
          updated_at: string
          upvote_count: number
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          is_hidden?: boolean
          is_instructor?: boolean
          question_id: string
          updated_at?: string
          upvote_count?: number
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          is_hidden?: boolean
          is_instructor?: boolean
          question_id?: string
          updated_at?: string
          upvote_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "lesson_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "lesson_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_questions: {
        Row: {
          accepted_answer_id: string | null
          author_id: string
          body: string
          cohort_id: string | null
          content_id: string
          created_at: string
          id: string
          is_hidden: boolean
          is_resolved: boolean
          item_id: string | null
          module_id: string | null
          updated_at: string
          upvote_count: number
        }
        Insert: {
          accepted_answer_id?: string | null
          author_id: string
          body: string
          cohort_id?: string | null
          content_id: string
          created_at?: string
          id?: string
          is_hidden?: boolean
          is_resolved?: boolean
          item_id?: string | null
          module_id?: string | null
          updated_at?: string
          upvote_count?: number
        }
        Update: {
          accepted_answer_id?: string | null
          author_id?: string
          body?: string
          cohort_id?: string | null
          content_id?: string
          created_at?: string
          id?: string
          is_hidden?: boolean
          is_resolved?: boolean
          item_id?: string | null
          module_id?: string | null
          updated_at?: string
          upvote_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "lesson_questions_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_questions_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_payment_requests: {
        Row: {
          amount_bdt: number | null
          company_id: string | null
          created_at: string | null
          id: string
          notes: string | null
          processed_at: string | null
          processed_by: string | null
          requested_credits: number | null
          requester_user_id: string | null
          status: string | null
          talent_id: string | null
          trx_id: string
        }
        Insert: {
          amount_bdt?: number | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          requested_credits?: number | null
          requester_user_id?: string | null
          status?: string | null
          talent_id?: string | null
          trx_id: string
        }
        Update: {
          amount_bdt?: number | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          requested_credits?: number | null
          requester_user_id?: string | null
          status?: string | null
          talent_id?: string | null
          trx_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manual_payment_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_bids: {
        Row: {
          ai_rationale: Json | null
          bid_amount: number
          coached_text: string | null
          cover_letter: string
          created_at: string | null
          estimated_days: number | null
          gig_id: string
          id: string
          match_id: string | null
          original_text: string | null
          portfolio_links: Json | null
          proof_links: Json | null
          status: string
          talent_id: string
          updated_at: string | null
        }
        Insert: {
          ai_rationale?: Json | null
          bid_amount: number
          coached_text?: string | null
          cover_letter: string
          created_at?: string | null
          estimated_days?: number | null
          gig_id: string
          id?: string
          match_id?: string | null
          original_text?: string | null
          portfolio_links?: Json | null
          proof_links?: Json | null
          status?: string
          talent_id: string
          updated_at?: string | null
        }
        Update: {
          ai_rationale?: Json | null
          bid_amount?: number
          coached_text?: string | null
          cover_letter?: string
          created_at?: string | null
          estimated_days?: number | null
          gig_id?: string
          id?: string
          match_id?: string | null
          original_text?: string | null
          portfolio_links?: Json | null
          proof_links?: Json | null
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
            foreignKeyName: "marketplace_bids_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "gig_matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_bids_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_bids_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "marketplace_bids_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
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
            foreignKeyName: "marketplace_contracts_freelancer_id_fkey"
            columns: ["freelancer_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "marketplace_contracts_freelancer_id_fkey"
            columns: ["freelancer_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
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
          acceptance_criteria: Json | null
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
          resource_category: string | null
          selected_bid_id: string | null
          skill_category: string
          skill_subcategory: string | null
          skills: string[]
          source_brief_id: string | null
          status: string
          title: string
          total_bids: number | null
          updated_at: string | null
        }
        Insert: {
          acceptance_criteria?: Json | null
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
          resource_category?: string | null
          selected_bid_id?: string | null
          skill_category: string
          skill_subcategory?: string | null
          skills?: string[]
          source_brief_id?: string | null
          status?: string
          title: string
          total_bids?: number | null
          updated_at?: string | null
        }
        Update: {
          acceptance_criteria?: Json | null
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
          resource_category?: string | null
          selected_bid_id?: string | null
          skill_category?: string
          skill_subcategory?: string | null
          skills?: string[]
          source_brief_id?: string | null
          status?: string
          title?: string
          total_bids?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_gigs_source_brief_id_fkey"
            columns: ["source_brief_id"]
            isOneToOne: false
            referencedRelation: "gig_briefs"
            referencedColumns: ["id"]
          },
        ]
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
      message_threads: {
        Row: {
          agent_key: string | null
          created_at: string
          id: string
          is_archived: boolean
          is_pinned: boolean
          last_message_at: string
          last_message_preview: string | null
          last_message_sender: string | null
          peer_talent_id: string | null
          talent_id: string
          thread_type: string
          unread_count: number
          updated_at: string
        }
        Insert: {
          agent_key?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean
          is_pinned?: boolean
          last_message_at?: string
          last_message_preview?: string | null
          last_message_sender?: string | null
          peer_talent_id?: string | null
          talent_id: string
          thread_type: string
          unread_count?: number
          updated_at?: string
        }
        Update: {
          agent_key?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean
          is_pinned?: boolean
          last_message_at?: string
          last_message_preview?: string | null
          last_message_sender?: string | null
          peer_talent_id?: string | null
          talent_id?: string
          thread_type?: string
          unread_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_threads_peer_talent_id_fkey"
            columns: ["peer_talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_threads_peer_talent_id_fkey"
            columns: ["peer_talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "message_threads_peer_talent_id_fkey"
            columns: ["peer_talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "message_threads_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_threads_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "message_threads_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
        ]
      }
      messaging_channels: {
        Row: {
          agent_key: string
          assigned_operator_ids: string[]
          auto_reply_enabled: boolean
          created_at: string
          created_by: string | null
          daily_outreach_cap: number
          hourly_outreach_cap: number
          id: string
          label: string
          language: string | null
          metadata: Json
          min_gap_seconds: number
          phone_e164: string | null
          provider: Database["public"]["Enums"]["messaging_provider"]
          quiet_hours_end: number
          quiet_hours_start: number
          quiet_hours_tz: string
          rate_limit_per_min: number
          reengage_window_days: number
          region: string | null
          status: Database["public"]["Enums"]["messaging_channel_status"]
          telegram_bot_id: string | null
          telegram_bot_username: string | null
          telegram_connection_key: string | null
          unipile_account_id: string | null
          updated_at: string
        }
        Insert: {
          agent_key: string
          assigned_operator_ids?: string[]
          auto_reply_enabled?: boolean
          created_at?: string
          created_by?: string | null
          daily_outreach_cap?: number
          hourly_outreach_cap?: number
          id?: string
          label: string
          language?: string | null
          metadata?: Json
          min_gap_seconds?: number
          phone_e164?: string | null
          provider: Database["public"]["Enums"]["messaging_provider"]
          quiet_hours_end?: number
          quiet_hours_start?: number
          quiet_hours_tz?: string
          rate_limit_per_min?: number
          reengage_window_days?: number
          region?: string | null
          status?: Database["public"]["Enums"]["messaging_channel_status"]
          telegram_bot_id?: string | null
          telegram_bot_username?: string | null
          telegram_connection_key?: string | null
          unipile_account_id?: string | null
          updated_at?: string
        }
        Update: {
          agent_key?: string
          assigned_operator_ids?: string[]
          auto_reply_enabled?: boolean
          created_at?: string
          created_by?: string | null
          daily_outreach_cap?: number
          hourly_outreach_cap?: number
          id?: string
          label?: string
          language?: string | null
          metadata?: Json
          min_gap_seconds?: number
          phone_e164?: string | null
          provider?: Database["public"]["Enums"]["messaging_provider"]
          quiet_hours_end?: number
          quiet_hours_start?: number
          quiet_hours_tz?: string
          rate_limit_per_min?: number
          reengage_window_days?: number
          region?: string | null
          status?: Database["public"]["Enums"]["messaging_channel_status"]
          telegram_bot_id?: string | null
          telegram_bot_username?: string | null
          telegram_connection_key?: string | null
          unipile_account_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      messaging_conversations: {
        Row: {
          assigned_human_user_id: string | null
          auto_reply_paused: boolean
          channel_id: string
          company_id: string | null
          contact_id: string | null
          created_at: string
          external_chat_id: string
          group_kind: string | null
          id: string
          is_group: boolean
          last_message_at: string | null
          last_message_preview: string | null
          metadata: Json
          peer_display_name: string | null
          peer_handle: string | null
          unread_count: number
          updated_at: string
        }
        Insert: {
          assigned_human_user_id?: string | null
          auto_reply_paused?: boolean
          channel_id: string
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          external_chat_id: string
          group_kind?: string | null
          id?: string
          is_group?: boolean
          last_message_at?: string | null
          last_message_preview?: string | null
          metadata?: Json
          peer_display_name?: string | null
          peer_handle?: string | null
          unread_count?: number
          updated_at?: string
        }
        Update: {
          assigned_human_user_id?: string | null
          auto_reply_paused?: boolean
          channel_id?: string
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          external_chat_id?: string
          group_kind?: string | null
          id?: string
          is_group?: boolean
          last_message_at?: string | null
          last_message_preview?: string | null
          metadata?: Json
          peer_display_name?: string | null
          peer_handle?: string | null
          unread_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messaging_conversations_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "messaging_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messaging_conversations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messaging_conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      messaging_messages: {
        Row: {
          agent_run_id: string | null
          attachments: Json
          author: Database["public"]["Enums"]["messaging_author"]
          body: string | null
          conversation_id: string
          created_at: string
          direction: Database["public"]["Enums"]["messaging_direction"]
          error: string | null
          external_message_id: string | null
          id: string
          sent_by_user_id: string | null
          status: Database["public"]["Enums"]["messaging_status"]
        }
        Insert: {
          agent_run_id?: string | null
          attachments?: Json
          author: Database["public"]["Enums"]["messaging_author"]
          body?: string | null
          conversation_id: string
          created_at?: string
          direction: Database["public"]["Enums"]["messaging_direction"]
          error?: string | null
          external_message_id?: string | null
          id?: string
          sent_by_user_id?: string | null
          status?: Database["public"]["Enums"]["messaging_status"]
        }
        Update: {
          agent_run_id?: string | null
          attachments?: Json
          author?: Database["public"]["Enums"]["messaging_author"]
          body?: string | null
          conversation_id?: string
          created_at?: string
          direction?: Database["public"]["Enums"]["messaging_direction"]
          error?: string | null
          external_message_id?: string | null
          id?: string
          sent_by_user_id?: string | null
          status?: Database["public"]["Enums"]["messaging_status"]
        }
        Relationships: [
          {
            foreignKeyName: "messaging_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "messaging_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      messaging_outbound_queue: {
        Row: {
          attempts: number
          body: string
          channel_id: string
          conversation_id: string | null
          created_at: string
          created_by: string | null
          id: string
          last_error: string | null
          scheduled_for: string
          sent_at: string | null
          status: Database["public"]["Enums"]["messaging_queue_status"]
          template_key: string | null
          to_handle: string
          variables: Json
        }
        Insert: {
          attempts?: number
          body: string
          channel_id: string
          conversation_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          last_error?: string | null
          scheduled_for?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["messaging_queue_status"]
          template_key?: string | null
          to_handle: string
          variables?: Json
        }
        Update: {
          attempts?: number
          body?: string
          channel_id?: string
          conversation_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          last_error?: string | null
          scheduled_for?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["messaging_queue_status"]
          template_key?: string | null
          to_handle?: string
          variables?: Json
        }
        Relationships: [
          {
            foreignKeyName: "messaging_outbound_queue_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "messaging_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messaging_outbound_queue_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "messaging_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      messaging_templates: {
        Row: {
          agent_key: string
          body: string
          created_at: string
          created_by: string | null
          id: string
          key: string
          name: string
          provider: Database["public"]["Enums"]["messaging_provider"] | null
          updated_at: string
          variables: Json
        }
        Insert: {
          agent_key: string
          body: string
          created_at?: string
          created_by?: string | null
          id?: string
          key: string
          name: string
          provider?: Database["public"]["Enums"]["messaging_provider"] | null
          updated_at?: string
          variables?: Json
        }
        Update: {
          agent_key?: string
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          key?: string
          name?: string
          provider?: Database["public"]["Enums"]["messaging_provider"] | null
          updated_at?: string
          variables?: Json
        }
        Relationships: []
      }
      mkt_channels: {
        Row: {
          created_at: string
          id: string
          name: string
          notes: string | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      mkt_community_groups: {
        Row: {
          created_at: string
          id: string
          link: string | null
          member_count: number | null
          name: string
          platform: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          member_count?: number | null
          name: string
          platform?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          member_count?: number | null
          name?: string
          platform?: string | null
          updated_at?: string
        }
        Relationships: []
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
          {
            foreignKeyName: "mock_interviews_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "mock_interviews_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
        ]
      }
      module_item_revision_log: {
        Row: {
          after: Json
          applied_at: string
          applied_by: string | null
          before: Json
          flags_addressed: string[]
          id: string
          item_id: string
          kind: string
          module_id: string | null
        }
        Insert: {
          after: Json
          applied_at?: string
          applied_by?: string | null
          before: Json
          flags_addressed?: string[]
          id?: string
          item_id: string
          kind: string
          module_id?: string | null
        }
        Update: {
          after?: Json
          applied_at?: string
          applied_by?: string | null
          before?: Json
          flags_addressed?: string[]
          id?: string
          item_id?: string
          kind?: string
          module_id?: string | null
        }
        Relationships: []
      }
      module_item_translations: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          item_id: string
          item_type: string
          language_code: string
          payload: Json
          reviewed_at: string | null
          reviewed_by: string | null
          source: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          item_id: string
          item_type: string
          language_code: string
          payload: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          source?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          item_id?: string
          item_type?: string
          language_code?: string
          payload?: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          source?: string
          updated_at?: string
        }
        Relationships: []
      }
      module_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          enrollment_id: string
          id: string
          module_id: string
          progress_pct: number
          stages_completed: number[]
          started_at: string | null
          total_stages: number
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          enrollment_id: string
          id?: string
          module_id: string
          progress_pct?: number
          stages_completed?: number[]
          started_at?: string | null
          total_stages?: number
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          enrollment_id?: string
          id?: string
          module_id?: string
          progress_pct?: number
          stages_completed?: number[]
          started_at?: string | null
          total_stages?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_progress_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      module_quiz_pool: {
        Row: {
          correct_index: number
          created_at: string
          created_by_talent_id: string | null
          difficulty: string | null
          explanation: string | null
          generated_by: string
          id: string
          module_id: string
          options: Json
          quality_score: number | null
          question: string
          times_correct: number | null
          times_served: number | null
          topic_tags: string[] | null
        }
        Insert: {
          correct_index: number
          created_at?: string
          created_by_talent_id?: string | null
          difficulty?: string | null
          explanation?: string | null
          generated_by?: string
          id?: string
          module_id: string
          options: Json
          quality_score?: number | null
          question: string
          times_correct?: number | null
          times_served?: number | null
          topic_tags?: string[] | null
        }
        Update: {
          correct_index?: number
          created_at?: string
          created_by_talent_id?: string | null
          difficulty?: string | null
          explanation?: string | null
          generated_by?: string
          id?: string
          module_id?: string
          options?: Json
          quality_score?: number | null
          question?: string
          times_correct?: number | null
          times_served?: number | null
          topic_tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "module_quiz_pool_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
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
      module_scenario_pool: {
        Row: {
          created_at: string
          created_by_talent_id: string | null
          difficulty: string | null
          generated_by: string
          id: string
          module_id: string
          quality_score: number | null
          rubric: Json
          scenario_prompt: string
          times_served: number | null
          title: string
          topic_tags: string[] | null
        }
        Insert: {
          created_at?: string
          created_by_talent_id?: string | null
          difficulty?: string | null
          generated_by?: string
          id?: string
          module_id: string
          quality_score?: number | null
          rubric?: Json
          scenario_prompt: string
          times_served?: number | null
          title: string
          topic_tags?: string[] | null
        }
        Update: {
          created_at?: string
          created_by_talent_id?: string | null
          difficulty?: string | null
          generated_by?: string
          id?: string
          module_id?: string
          quality_score?: number | null
          rubric?: Json
          scenario_prompt?: string
          times_served?: number | null
          title?: string
          topic_tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "module_scenario_pool_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_dispatch: {
        Row: {
          dispatched_at: string
          id: string
          kind: string
          payload: Json | null
          scope: string
          scope_id: string
        }
        Insert: {
          dispatched_at?: string
          id?: string
          kind: string
          payload?: Json | null
          scope: string
          scope_id: string
        }
        Update: {
          dispatched_at?: string
          id?: string
          kind?: string
          payload?: Json | null
          scope?: string
          scope_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          channel: string
          created_at: string
          enabled: boolean
          id: string
          talent_id: string
          updated_at: string
        }
        Insert: {
          channel: string
          created_at?: string
          enabled?: boolean
          id?: string
          talent_id: string
          updated_at?: string
        }
        Update: {
          channel?: string
          created_at?: string
          enabled?: boolean
          id?: string
          talent_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_preferences_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "notification_preferences_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
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
          thread_id: string | null
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
          thread_id?: string | null
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
          thread_id?: string | null
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
          {
            foreignKeyName: "notifications_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "notifications_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
        ]
      }
      offer_versions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          offer_id: string
          payload: Json
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          offer_id: string
          payload: Json
          version: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          offer_id?: string
          payload?: Json
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "offer_versions_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          application_id: string
          base_amount: number
          benefits: string | null
          company_id: string
          created_at: string
          created_by: string | null
          currency: string
          custom_note: string | null
          decision_note: string | null
          equity_note: string | null
          expires_at: string | null
          id: string
          pdf_path: string | null
          signed_at: string | null
          signed_name: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["offer_status"]
          talent_id: string
          title: string
          updated_at: string
          variable_amount: number | null
          version: number
        }
        Insert: {
          application_id: string
          base_amount?: number
          benefits?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          currency?: string
          custom_note?: string | null
          decision_note?: string | null
          equity_note?: string | null
          expires_at?: string | null
          id?: string
          pdf_path?: string | null
          signed_at?: string | null
          signed_name?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["offer_status"]
          talent_id: string
          title: string
          updated_at?: string
          variable_amount?: number | null
          version?: number
        }
        Update: {
          application_id?: string
          base_amount?: number
          benefits?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          custom_note?: string | null
          decision_note?: string | null
          equity_note?: string | null
          expires_at?: string | null
          id?: string
          pdf_path?: string | null
          signed_at?: string | null
          signed_name?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["offer_status"]
          talent_id?: string
          title?: string
          updated_at?: string
          variable_amount?: number | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "offers_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
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
          {
            foreignKeyName: "outreach_messages_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "outreach_messages_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
        ]
      }
      partner_organizations: {
        Row: {
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          country: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          status: string
          type: string
          updated_at: string
          website: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          status?: string
          type?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          status?: string
          type?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      platform_events: {
        Row: {
          created_at: string
          event_kind: string
          id: string
          payload: Json
          processed_at: string | null
          subject_id: string | null
          subject_kind: string | null
        }
        Insert: {
          created_at?: string
          event_kind: string
          id?: string
          payload?: Json
          processed_at?: string | null
          subject_id?: string | null
          subject_kind?: string | null
        }
        Update: {
          created_at?: string
          event_kind?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          subject_id?: string | null
          subject_kind?: string | null
        }
        Relationships: []
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
          {
            foreignKeyName: "poll_votes_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "poll_votes_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
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
          {
            foreignKeyName: "portfolio_requests_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "portfolio_requests_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
        ]
      }
      post_comments: {
        Row: {
          author_talent_id: string
          body: string
          created_at: string
          id: string
          post_id: string
          tip_count: number
          tip_credits: number
        }
        Insert: {
          author_talent_id: string
          body: string
          created_at?: string
          id?: string
          post_id: string
          tip_count?: number
          tip_credits?: number
        }
        Update: {
          author_talent_id?: string
          body?: string
          created_at?: string
          id?: string
          post_id?: string
          tip_count?: number
          tip_credits?: number
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_author_talent_id_fkey"
            columns: ["author_talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_author_talent_id_fkey"
            columns: ["author_talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "post_comments_author_talent_id_fkey"
            columns: ["author_talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_hypes: {
        Row: {
          created_at: string
          creator_share: number
          credits_spent: number
          id: string
          platform_share: number
          post_id: string
          recipient_talent_id: string
          sender_talent_id: string
        }
        Insert: {
          created_at?: string
          creator_share?: number
          credits_spent?: number
          id?: string
          platform_share?: number
          post_id: string
          recipient_talent_id: string
          sender_talent_id: string
        }
        Update: {
          created_at?: string
          creator_share?: number
          credits_spent?: number
          id?: string
          platform_share?: number
          post_id?: string
          recipient_talent_id?: string
          sender_talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_hypes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_hypes_recipient_talent_id_fkey"
            columns: ["recipient_talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_hypes_recipient_talent_id_fkey"
            columns: ["recipient_talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "post_hypes_recipient_talent_id_fkey"
            columns: ["recipient_talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "post_hypes_sender_talent_id_fkey"
            columns: ["sender_talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_hypes_sender_talent_id_fkey"
            columns: ["sender_talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "post_hypes_sender_talent_id_fkey"
            columns: ["sender_talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
        ]
      }
      post_impressions: {
        Row: {
          created_at: string
          day_bucket: string | null
          id: string
          post_id: string
          surface: string
          viewer_talent_id: string | null
        }
        Insert: {
          created_at?: string
          day_bucket?: string | null
          id?: string
          post_id: string
          surface?: string
          viewer_talent_id?: string | null
        }
        Update: {
          created_at?: string
          day_bucket?: string | null
          id?: string
          post_id?: string
          surface?: string
          viewer_talent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_impressions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_impressions_viewer_talent_id_fkey"
            columns: ["viewer_talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_impressions_viewer_talent_id_fkey"
            columns: ["viewer_talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "post_impressions_viewer_talent_id_fkey"
            columns: ["viewer_talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
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
          {
            foreignKeyName: "post_reactions_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "post_reactions_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
        ]
      }
      post_shares: {
        Row: {
          channel: string
          created_at: string
          id: string
          post_id: string
          sharer_talent_id: string | null
        }
        Insert: {
          channel?: string
          created_at?: string
          id?: string
          post_id: string
          sharer_talent_id?: string | null
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          post_id?: string
          sharer_talent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_shares_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_shares_sharer_talent_id_fkey"
            columns: ["sharer_talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_shares_sharer_talent_id_fkey"
            columns: ["sharer_talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "post_shares_sharer_talent_id_fkey"
            columns: ["sharer_talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
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
            referencedRelation: "school_readiness_v"
            referencedColumns: ["school_id"]
          },
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
      professional_lives: {
        Row: {
          country: string | null
          created_at: string
          id: string
          profession: string | null
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          id?: string
          profession?: string | null
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          id?: string
          profession?: string | null
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      professional_roles: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          profession_category_id: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          profession_category_id: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          profession_category_id?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_roles_profession_category_id_fkey"
            columns: ["profession_category_id"]
            isOneToOne: false
            referencedRelation: "profession_categories"
            referencedColumns: ["id"]
          },
        ]
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
      profile_card_themes: {
        Row: {
          created_at: string
          end_at: string | null
          gradient_css: string | null
          id: string
          is_active: boolean
          media_type: string
          media_url: string | null
          name: string
          overlay_opacity: number
          poster_url: string | null
          priority: number
          start_at: string | null
          text_color: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_at?: string | null
          gradient_css?: string | null
          id?: string
          is_active?: boolean
          media_type: string
          media_url?: string | null
          name: string
          overlay_opacity?: number
          poster_url?: string | null
          priority?: number
          start_at?: string | null
          text_color?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_at?: string | null
          gradient_css?: string | null
          id?: string
          is_active?: boolean
          media_type?: string
          media_url?: string | null
          name?: string
          overlay_opacity?: number
          poster_url?: string | null
          priority?: number
          start_at?: string | null
          text_color?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_public_settings: {
        Row: {
          case_study_md: string | null
          created_at: string
          featured_deliverables: Json
          is_public: boolean
          og_image_url: string | null
          project_id: string
          published_at: string | null
          seo_description: string | null
          seo_title: string | null
          share_count: number
          slug: string | null
          updated_at: string
          view_count: number
        }
        Insert: {
          case_study_md?: string | null
          created_at?: string
          featured_deliverables?: Json
          is_public?: boolean
          og_image_url?: string | null
          project_id: string
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          share_count?: number
          slug?: string | null
          updated_at?: string
          view_count?: number
        }
        Update: {
          case_study_md?: string | null
          created_at?: string
          featured_deliverables?: Json
          is_public?: boolean
          og_image_url?: string | null
          project_id?: string
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          share_count?: number
          slug?: string | null
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_public_settings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "gig_projects"
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
      review_assignments: {
        Row: {
          created_at: string
          due_at: string | null
          id: string
          is_instructor: boolean
          reviewer_id: string
          status: Database["public"]["Enums"]["review_assignment_status"]
          submission_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          due_at?: string | null
          id?: string
          is_instructor?: boolean
          reviewer_id: string
          status?: Database["public"]["Enums"]["review_assignment_status"]
          submission_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          due_at?: string | null
          id?: string
          is_instructor?: boolean
          reviewer_id?: string
          status?: Database["public"]["Enums"]["review_assignment_status"]
          submission_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_assignments_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      reviewer_calibration_attempts: {
        Row: {
          answers: Json
          attempted_at: string
          id: string
          passed: boolean
          score: number
          talent_id: string
        }
        Insert: {
          answers?: Json
          attempted_at?: string
          id?: string
          passed?: boolean
          score?: number
          talent_id: string
        }
        Update: {
          answers?: Json
          attempted_at?: string
          id?: string
          passed?: boolean
          score?: number
          talent_id?: string
        }
        Relationships: []
      }
      reviewer_calibration_items: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          difficulty: string
          id: string
          is_active: boolean
          prompt: string
          reference_answer: string
          rubric: Json
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          difficulty?: string
          id?: string
          is_active?: boolean
          prompt: string
          reference_answer: string
          rubric?: Json
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          difficulty?: string
          id?: string
          is_active?: boolean
          prompt?: string
          reference_answer?: string
          rubric?: Json
          updated_at?: string
        }
        Relationships: []
      }
      reviewer_credit_ledger: {
        Row: {
          assignment_id: string | null
          created_at: string
          delta: number
          id: string
          paid_at: string | null
          reason: string
          talent_id: string
        }
        Insert: {
          assignment_id?: string | null
          created_at?: string
          delta: number
          id?: string
          paid_at?: string | null
          reason: string
          talent_id: string
        }
        Update: {
          assignment_id?: string | null
          created_at?: string
          delta?: number
          id?: string
          paid_at?: string | null
          reason?: string
          talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviewer_credit_ledger_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "gig_review_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      reviewer_profiles: {
        Row: {
          accuracy: number
          categories: string[]
          created_at: string
          id: string
          items_resolved: number
          joined_at: string
          last_active_at: string
          notes: string | null
          status: string
          talent_id: string
          tier: string
          updated_at: string
        }
        Insert: {
          accuracy?: number
          categories?: string[]
          created_at?: string
          id?: string
          items_resolved?: number
          joined_at?: string
          last_active_at?: string
          notes?: string | null
          status?: string
          talent_id: string
          tier?: string
          updated_at?: string
        }
        Update: {
          accuracy?: number
          categories?: string[]
          created_at?: string
          id?: string
          items_resolved?: number
          joined_at?: string
          last_active_at?: string
          notes?: string | null
          status?: string
          talent_id?: string
          tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      reviewer_reputation_events: {
        Row: {
          assignment_id: string | null
          created_at: string
          event: string
          id: string
          metadata: Json
          talent_id: string
          weight: number
        }
        Insert: {
          assignment_id?: string | null
          created_at?: string
          event: string
          id?: string
          metadata?: Json
          talent_id: string
          weight?: number
        }
        Update: {
          assignment_id?: string | null
          created_at?: string
          event?: string
          id?: string
          metadata?: Json
          talent_id?: string
          weight?: number
        }
        Relationships: []
      }
      riya_conversations: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          last_step: string | null
          payload: Json | null
          session_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          last_step?: string | null
          payload?: Json | null
          session_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          last_step?: string | null
          payload?: Json | null
          session_id?: string
          updated_at?: string
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
          {
            foreignKeyName: "salary_analyses_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "salary_analyses_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
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
          {
            foreignKeyName: "saved_items_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "saved_items_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
        ]
      }
      school_waitlist: {
        Row: {
          created_at: string
          id: string
          school_id: string
          talent_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          school_id: string
          talent_id: string
        }
        Update: {
          created_at?: string
          id?: string
          school_id?: string
          talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_waitlist_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "school_readiness_v"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "school_waitlist_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_waitlist_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_waitlist_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "school_waitlist_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
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
          is_ready: boolean
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
          is_ready?: boolean
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
          is_ready?: boolean
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
      session_attendance: {
        Row: {
          created_at: string
          duration_seconds: number
          id: string
          joined_at: string | null
          left_at: string | null
          notes: string | null
          recorded_by: string | null
          session_id: string
          source: Database["public"]["Enums"]["attendance_source"]
          status: Database["public"]["Enums"]["attendance_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number
          id?: string
          joined_at?: string | null
          left_at?: string | null
          notes?: string | null
          recorded_by?: string | null
          session_id: string
          source?: Database["public"]["Enums"]["attendance_source"]
          status?: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number
          id?: string
          joined_at?: string | null
          left_at?: string | null
          notes?: string | null
          recorded_by?: string | null
          session_id?: string
          source?: Database["public"]["Enums"]["attendance_source"]
          status?: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_attendance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "course_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_credentials: {
        Row: {
          attempts_at_issue: number
          content_id: string | null
          created_at: string
          evidence: Json
          id: string
          issued_at: string
          level: string
          mastery_at_issue: number
          module_id: string | null
          revoked_at: string | null
          talent_id: string
          topic_tag: string
          verify_code: string
        }
        Insert: {
          attempts_at_issue: number
          content_id?: string | null
          created_at?: string
          evidence?: Json
          id?: string
          issued_at?: string
          level: string
          mastery_at_issue: number
          module_id?: string | null
          revoked_at?: string | null
          talent_id: string
          topic_tag: string
          verify_code?: string
        }
        Update: {
          attempts_at_issue?: number
          content_id?: string | null
          created_at?: string
          evidence?: Json
          id?: string
          issued_at?: string
          level?: string
          mastery_at_issue?: number
          module_id?: string | null
          revoked_at?: string | null
          talent_id?: string
          topic_tag?: string
          verify_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_credentials_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_credentials_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_credentials_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_credentials_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "skill_credentials_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
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
          institution_id: string | null
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
          institution_id?: string | null
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
          institution_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "study_abroad_programs_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "study_abroad_roadmaps_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "study_abroad_roadmaps_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
        ]
      }
      submission_reviews: {
        Row: {
          comments: string | null
          created_at: string
          id: string
          is_instructor: boolean
          reviewer_id: string
          rubric: Json
          score: number | null
          submission_id: string
          updated_at: string
        }
        Insert: {
          comments?: string | null
          created_at?: string
          id?: string
          is_instructor?: boolean
          reviewer_id: string
          rubric?: Json
          score?: number | null
          submission_id: string
          updated_at?: string
        }
        Update: {
          comments?: string | null
          created_at?: string
          id?: string
          is_instructor?: boolean
          reviewer_id?: string
          rubric?: Json
          score?: number | null
          submission_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "submission_reviews_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          author_id: string
          body: Json
          cohort_id: string | null
          content_id: string
          created_at: string
          files: Json
          id: string
          instructor_verdict: string | null
          is_anonymized: boolean
          kind: Database["public"]["Enums"]["submission_kind"]
          module_id: string | null
          project_id: string | null
          score: number | null
          status: Database["public"]["Enums"]["submission_status"]
          submitted_at: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          body?: Json
          cohort_id?: string | null
          content_id: string
          created_at?: string
          files?: Json
          id?: string
          instructor_verdict?: string | null
          is_anonymized?: boolean
          kind?: Database["public"]["Enums"]["submission_kind"]
          module_id?: string | null
          project_id?: string | null
          score?: number | null
          status?: Database["public"]["Enums"]["submission_status"]
          submitted_at?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: Json
          cohort_id?: string | null
          content_id?: string
          created_at?: string
          files?: Json
          id?: string
          instructor_verdict?: string | null
          is_anonymized?: boolean
          kind?: Database["public"]["Enums"]["submission_kind"]
          module_id?: string | null
          project_id?: string | null
          score?: number | null
          status?: Database["public"]["Enums"]["submission_status"]
          submitted_at?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
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
          {
            foreignKeyName: "talent_assignments_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "talent_assignments_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
        ]
      }
      talent_availability: {
        Row: {
          categories: string[]
          daily_match_cap: number
          notify_via_email: boolean
          notify_via_inapp: boolean
          paused_until: string | null
          talent_id: string
          updated_at: string
          weekly_capacity_hours: number
        }
        Insert: {
          categories?: string[]
          daily_match_cap?: number
          notify_via_email?: boolean
          notify_via_inapp?: boolean
          paused_until?: string | null
          talent_id: string
          updated_at?: string
          weekly_capacity_hours?: number
        }
        Update: {
          categories?: string[]
          daily_match_cap?: number
          notify_via_email?: boolean
          notify_via_inapp?: boolean
          paused_until?: string | null
          talent_id?: string
          updated_at?: string
          weekly_capacity_hours?: number
        }
        Relationships: [
          {
            foreignKeyName: "talent_availability_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: true
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_availability_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: true
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "talent_availability_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: true
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
        ]
      }
      talent_boosts: {
        Row: {
          boosted_until: string
          created_at: string
          credits_spent: number
          id: string
          talent_id: string
        }
        Insert: {
          boosted_until: string
          created_at?: string
          credits_spent: number
          id?: string
          talent_id: string
        }
        Update: {
          boosted_until?: string
          created_at?: string
          credits_spent?: number
          id?: string
          talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_boosts_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_boosts_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "talent_boosts_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
        ]
      }
      talent_connections: {
        Row: {
          created_at: string
          expires_at: string
          fee_paid: number
          id: string
          platform_share: number
          recipient_share: number
          recipient_talent_id: string
          responded_at: string | null
          sender_talent_id: string
          status: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          fee_paid: number
          id?: string
          platform_share?: number
          recipient_share?: number
          recipient_talent_id: string
          responded_at?: string | null
          sender_talent_id: string
          status?: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          fee_paid?: number
          id?: string
          platform_share?: number
          recipient_share?: number
          recipient_talent_id?: string
          responded_at?: string | null
          sender_talent_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_connections_recipient_talent_id_fkey"
            columns: ["recipient_talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_connections_recipient_talent_id_fkey"
            columns: ["recipient_talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "talent_connections_recipient_talent_id_fkey"
            columns: ["recipient_talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "talent_connections_sender_talent_id_fkey"
            columns: ["sender_talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_connections_sender_talent_id_fkey"
            columns: ["sender_talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "talent_connections_sender_talent_id_fkey"
            columns: ["sender_talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
        ]
      }
      talent_contact_unlocks: {
        Row: {
          company_id: string
          created_at: string
          credits_spent: number
          email: string | null
          full_name: string | null
          id: string
          linkedin_url: string | null
          phone: string | null
          talent_id: string
          unlocked_by: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          credits_spent?: number
          email?: string | null
          full_name?: string | null
          id?: string
          linkedin_url?: string | null
          phone?: string | null
          talent_id: string
          unlocked_by?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          credits_spent?: number
          email?: string | null
          full_name?: string | null
          id?: string
          linkedin_url?: string | null
          phone?: string | null
          talent_id?: string
          unlocked_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "talent_contact_unlocks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_contact_unlocks_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_contact_unlocks_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "talent_contact_unlocks_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
        ]
      }
      talent_credits: {
        Row: {
          balance: number
          contact_bonus_balance: number
          created_at: string | null
          earned_balance: number
          id: string
          talent_id: string
          updated_at: string | null
        }
        Insert: {
          balance?: number
          contact_bonus_balance?: number
          created_at?: string | null
          earned_balance?: number
          id?: string
          talent_id: string
          updated_at?: string | null
        }
        Update: {
          balance?: number
          contact_bonus_balance?: number
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
          {
            foreignKeyName: "talent_credits_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: true
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "talent_credits_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: true
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
        ]
      }
      talent_id_documents: {
        Row: {
          back_url: string | null
          created_at: string
          doc_type: string
          extracted_name: string | null
          extracted_number: string | null
          front_url: string
          id: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          talent_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          back_url?: string | null
          created_at?: string
          doc_type: string
          extracted_name?: string | null
          extracted_number?: string | null
          front_url: string
          id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          talent_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          back_url?: string | null
          created_at?: string
          doc_type?: string
          extracted_name?: string | null
          extracted_number?: string | null
          front_url?: string
          id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          talent_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_id_documents_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_id_documents_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "talent_id_documents_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
        ]
      }
      talent_inbox_settings: {
        Row: {
          boost_until: string | null
          created_at: string
          talent_id: string
          unlock_method: string | null
          unlocked: boolean
          unlocked_at: string | null
          updated_at: string
        }
        Insert: {
          boost_until?: string | null
          created_at?: string
          talent_id: string
          unlock_method?: string | null
          unlocked?: boolean
          unlocked_at?: string | null
          updated_at?: string
        }
        Update: {
          boost_until?: string | null
          created_at?: string
          talent_id?: string
          unlock_method?: string | null
          unlocked?: boolean
          unlocked_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_inbox_settings_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: true
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_inbox_settings_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: true
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "talent_inbox_settings_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: true
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
        ]
      }
      talent_language_levels: {
        Row: {
          cefr_level: string
          id: string
          language_code: string
          source: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          cefr_level: string
          id?: string
          language_code: string
          source?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          cefr_level?: string
          id?: string
          language_code?: string
          source?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "talent_language_levels_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      talent_list_members: {
        Row: {
          added_at: string
          added_by: string
          id: string
          list_id: string
          note: string | null
          talent_id: string
        }
        Insert: {
          added_at?: string
          added_by: string
          id?: string
          list_id: string
          note?: string | null
          talent_id: string
        }
        Update: {
          added_at?: string
          added_by?: string
          id?: string
          list_id?: string
          note?: string | null
          talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_list_members_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "talent_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_list_members_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_list_members_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "talent_list_members_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
        ]
      }
      talent_lists: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_lists_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_outreach_log: {
        Row: {
          channel: string
          id: string
          message: string | null
          metadata: Json
          response_at: string | null
          sent_at: string
          sent_by: string | null
          status: string
          subject: string | null
          talent_id: string | null
          template: string | null
        }
        Insert: {
          channel: string
          id?: string
          message?: string | null
          metadata?: Json
          response_at?: string | null
          sent_at?: string
          sent_by?: string | null
          status?: string
          subject?: string | null
          talent_id?: string | null
          template?: string | null
        }
        Update: {
          channel?: string
          id?: string
          message?: string | null
          metadata?: Json
          response_at?: string | null
          sent_at?: string
          sent_by?: string | null
          status?: string
          subject?: string | null
          talent_id?: string | null
          template?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "talent_outreach_log_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_outreach_log_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "talent_outreach_log_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
        ]
      }
      talent_payout_accounts: {
        Row: {
          account_name: string
          account_number: string
          bank_name: string | null
          created_at: string
          id: string
          is_primary: boolean
          method: string
          talent_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_name: string
          account_number: string
          bank_name?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          method: string
          talent_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_name?: string
          account_number?: string
          bank_name?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          method?: string
          talent_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_payout_accounts_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_payout_accounts_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "talent_payout_accounts_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
        ]
      }
      talent_quiz_attempt: {
        Row: {
          answers: Json
          attempt_no: number | null
          created_at: string
          id: string
          item_ids: string[]
          module_id: string
          score: number | null
          talent_id: string
        }
        Insert: {
          answers?: Json
          attempt_no?: number | null
          created_at?: string
          id?: string
          item_ids: string[]
          module_id: string
          score?: number | null
          talent_id: string
        }
        Update: {
          answers?: Json
          attempt_no?: number | null
          created_at?: string
          id?: string
          item_ids?: string[]
          module_id?: string
          score?: number | null
          talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_quiz_attempt_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_relationship_activities: {
        Row: {
          actor_id: string | null
          actor_role: string | null
          body: Json
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["talent_activity_kind"]
          relationship_id: string
        }
        Insert: {
          actor_id?: string | null
          actor_role?: string | null
          body?: Json
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["talent_activity_kind"]
          relationship_id: string
        }
        Update: {
          actor_id?: string | null
          actor_role?: string | null
          body?: Json
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["talent_activity_kind"]
          relationship_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_relationship_activities_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "talent_relationships"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_relationships: {
        Row: {
          company_id: string
          created_at: string
          id: string
          next_step: string | null
          next_step_at: string | null
          notes: string | null
          owner_id: string | null
          source: string | null
          stage: Database["public"]["Enums"]["talent_relationship_stage"]
          talent_id: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          next_step?: string | null
          next_step_at?: string | null
          notes?: string | null
          owner_id?: string | null
          source?: string | null
          stage?: Database["public"]["Enums"]["talent_relationship_stage"]
          talent_id: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          next_step?: string | null
          next_step_at?: string | null
          notes?: string | null
          owner_id?: string | null
          source?: string | null
          stage?: Database["public"]["Enums"]["talent_relationship_stage"]
          talent_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_relationships_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_relationships_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_relationships_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "talent_relationships_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
        ]
      }
      talent_scenario_run: {
        Row: {
          conversation: Json
          created_at: string
          evaluation: Json | null
          id: string
          module_id: string
          scenario_id: string | null
          talent_id: string
        }
        Insert: {
          conversation?: Json
          created_at?: string
          evaluation?: Json | null
          id?: string
          module_id: string
          scenario_id?: string | null
          talent_id: string
        }
        Update: {
          conversation?: Json
          created_at?: string
          evaluation?: Json | null
          id?: string
          module_id?: string
          scenario_id?: string | null
          talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_scenario_run_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_scenario_run_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "module_scenario_pool"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_skill_profile: {
        Row: {
          attempts: number
          content_id: string
          correct_count: number
          created_at: string
          due_at: string
          ease: number
          id: string
          interval_days: number
          last_attempt_at: string | null
          last_reviewed_at: string | null
          last_source: string
          mastery: number
          module_id: string
          talent_id: string
          topic_tag: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          content_id: string
          correct_count?: number
          created_at?: string
          due_at?: string
          ease?: number
          id?: string
          interval_days?: number
          last_attempt_at?: string | null
          last_reviewed_at?: string | null
          last_source?: string
          mastery?: number
          module_id: string
          talent_id: string
          topic_tag: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          content_id?: string
          correct_count?: number
          created_at?: string
          due_at?: string
          ease?: number
          id?: string
          interval_days?: number
          last_attempt_at?: string | null
          last_reviewed_at?: string | null
          last_source?: string
          mastery?: number
          module_id?: string
          talent_id?: string
          topic_tag?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_skill_profile_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_skill_profile_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_trust_events: {
        Row: {
          created_at: string
          event: string
          gig_kind: string | null
          id: string
          metadata: Json
          talent_id: string
          verification_id: string | null
          weight: number
        }
        Insert: {
          created_at?: string
          event: string
          gig_kind?: string | null
          id?: string
          metadata?: Json
          talent_id: string
          verification_id?: string | null
          weight?: number
        }
        Update: {
          created_at?: string
          event?: string
          gig_kind?: string | null
          id?: string
          metadata?: Json
          talent_id?: string
          verification_id?: string | null
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "talent_trust_events_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_trust_events_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "talent_trust_events_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "talent_trust_events_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "gig_verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_trust_score: {
        Row: {
          components: Json
          computed_at: string
          score: number
          talent_id: string
          updated_at: string
        }
        Insert: {
          components?: Json
          computed_at?: string
          score?: number
          talent_id: string
          updated_at?: string
        }
        Update: {
          components?: Json
          computed_at?: string
          score?: number
          talent_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_trust_score_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: true
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_trust_score_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: true
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "talent_trust_score_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: true
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
        ]
      }
      talents: {
        Row: {
          achievements: Json | null
          batch_upload_id: string | null
          career_coach_instructor_id: string | null
          country: string | null
          country_code: string | null
          cover_image_url: string | null
          created_at: string | null
          current_status: string | null
          current_streak: number
          custom_profession: string | null
          cv_fingerprint: string | null
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
          institution_id: string | null
          is_featured: boolean | null
          is_suspected_duplicate: boolean
          job_preferences: Json | null
          last_post_date: string | null
          learner_status: string | null
          linkedin_url: string | null
          longest_streak: number
          onboarding_completed_at: string | null
          onboarding_step: number | null
          phone: string | null
          portfolio_url: string | null
          primary_goal: string | null
          profession_category_id: string | null
          professional_role_id: string | null
          profile_photo_url: string | null
          projects: Json | null
          public_bio: string | null
          public_handle: string | null
          public_profile_enabled: boolean
          public_show_credentials: boolean
          public_show_mastery: boolean
          ref_code: string | null
          referred_by: string | null
          search_tsv: unknown
          services_used: Json | null
          skills: Json | null
          student_id: string | null
          updated_at: string | null
          user_id: string | null
          verification_status: string
          welcome_sent_at: string | null
          whatsapp_bonus_claimed_at: string | null
        }
        Insert: {
          achievements?: Json | null
          batch_upload_id?: string | null
          career_coach_instructor_id?: string | null
          country?: string | null
          country_code?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          current_status?: string | null
          current_streak?: number
          custom_profession?: string | null
          cv_fingerprint?: string | null
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
          institution_id?: string | null
          is_featured?: boolean | null
          is_suspected_duplicate?: boolean
          job_preferences?: Json | null
          last_post_date?: string | null
          learner_status?: string | null
          linkedin_url?: string | null
          longest_streak?: number
          onboarding_completed_at?: string | null
          onboarding_step?: number | null
          phone?: string | null
          portfolio_url?: string | null
          primary_goal?: string | null
          profession_category_id?: string | null
          professional_role_id?: string | null
          profile_photo_url?: string | null
          projects?: Json | null
          public_bio?: string | null
          public_handle?: string | null
          public_profile_enabled?: boolean
          public_show_credentials?: boolean
          public_show_mastery?: boolean
          ref_code?: string | null
          referred_by?: string | null
          search_tsv?: unknown
          services_used?: Json | null
          skills?: Json | null
          student_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          verification_status?: string
          welcome_sent_at?: string | null
          whatsapp_bonus_claimed_at?: string | null
        }
        Update: {
          achievements?: Json | null
          batch_upload_id?: string | null
          career_coach_instructor_id?: string | null
          country?: string | null
          country_code?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          current_status?: string | null
          current_streak?: number
          custom_profession?: string | null
          cv_fingerprint?: string | null
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
          institution_id?: string | null
          is_featured?: boolean | null
          is_suspected_duplicate?: boolean
          job_preferences?: Json | null
          last_post_date?: string | null
          learner_status?: string | null
          linkedin_url?: string | null
          longest_streak?: number
          onboarding_completed_at?: string | null
          onboarding_step?: number | null
          phone?: string | null
          portfolio_url?: string | null
          primary_goal?: string | null
          profession_category_id?: string | null
          professional_role_id?: string | null
          profile_photo_url?: string | null
          projects?: Json | null
          public_bio?: string | null
          public_handle?: string | null
          public_profile_enabled?: boolean
          public_show_credentials?: boolean
          public_show_mastery?: boolean
          ref_code?: string | null
          referred_by?: string | null
          search_tsv?: unknown
          services_used?: Json | null
          skills?: Json | null
          student_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          verification_status?: string
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
            foreignKeyName: "talents_career_coach_instructor_id_fkey"
            columns: ["career_coach_instructor_id"]
            isOneToOne: false
            referencedRelation: "ai_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talents_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talents_profession_category_id_fkey"
            columns: ["profession_category_id"]
            isOneToOne: false
            referencedRelation: "profession_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talents_professional_role_id_fkey"
            columns: ["professional_role_id"]
            isOneToOne: false
            referencedRelation: "professional_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talents_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talents_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "talents_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
        ]
      }
      tool_runs: {
        Row: {
          cost_credits: number
          created_at: string
          id: string
          job_id: string | null
          payload: Json
          tool_key: string
          user_id: string
        }
        Insert: {
          cost_credits?: number
          created_at?: string
          id?: string
          job_id?: string | null
          payload?: Json
          tool_key: string
          user_id: string
        }
        Update: {
          cost_credits?: number
          created_at?: string
          id?: string
          job_id?: string | null
          payload?: Json
          tool_key?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          scope_school_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          scope_school_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          scope_school_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_scope_school_id_fkey"
            columns: ["scope_school_id"]
            isOneToOne: false
            referencedRelation: "school_readiness_v"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "user_roles_scope_school_id_fkey"
            columns: ["scope_school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_rules: {
        Row: {
          auto_approve_floor: number
          category: string | null
          escalate_floor: number
          gig_kind: string
          id: string
          is_active: boolean
          max_revisions: number
          revision_due_hours: number
          risk_flag_overrides: Json
          updated_at: string
        }
        Insert: {
          auto_approve_floor?: number
          category?: string | null
          escalate_floor?: number
          gig_kind: string
          id?: string
          is_active?: boolean
          max_revisions?: number
          revision_due_hours?: number
          risk_flag_overrides?: Json
          updated_at?: string
        }
        Update: {
          auto_approve_floor?: number
          category?: string | null
          escalate_floor?: number
          gig_kind?: string
          id?: string
          is_active?: boolean
          max_revisions?: number
          revision_due_hours?: number
          risk_flag_overrides?: Json
          updated_at?: string
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          admin_notes: string | null
          amount_credits: number
          created_at: string
          id: string
          method: string
          payout_details: Json
          processed_at: string | null
          status: string
          talent_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount_credits: number
          created_at?: string
          id?: string
          method: string
          payout_details?: Json
          processed_at?: string | null
          status?: string
          talent_id: string
        }
        Update: {
          admin_notes?: string | null
          amount_credits?: number
          created_at?: string
          id?: string
          method?: string
          payout_details?: Json
          processed_at?: string | null
          status?: string
          talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_requests_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawal_requests_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "withdrawal_requests_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
        ]
      }
      workforce_channel_connections: {
        Row: {
          agent_key: string | null
          channel_provider: string
          client_id: string | null
          created_at: string | null
          credentials: Json
          id: string
          is_active: boolean | null
          updated_at: string | null
        }
        Insert: {
          agent_key?: string | null
          channel_provider: string
          client_id?: string | null
          created_at?: string | null
          credentials?: Json
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Update: {
          agent_key?: string | null
          channel_provider?: string
          client_id?: string | null
          created_at?: string | null
          credentials?: Json
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workforce_channel_connections_agent_key_fkey"
            columns: ["agent_key"]
            isOneToOne: false
            referencedRelation: "agent_outreach_admin_v"
            referencedColumns: ["agent_key"]
          },
          {
            foreignKeyName: "workforce_channel_connections_agent_key_fkey"
            columns: ["agent_key"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["agent_key"]
          },
          {
            foreignKeyName: "workforce_channel_connections_agent_key_fkey"
            columns: ["agent_key"]
            isOneToOne: false
            referencedRelation: "ai_agents_with_stats"
            referencedColumns: ["agent_key"]
          },
        ]
      }
      workforce_members: {
        Row: {
          city: string | null
          country: string | null
          created_at: string | null
          grade_id: string | null
          hired_at: string | null
          id: string
          probation_ends_at: string | null
          reports_to: string | null
          role_type: Database["public"]["Enums"]["workforce_role_type"]
          specialization: Json | null
          status: string
          talent_id: string
          team_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          grade_id?: string | null
          hired_at?: string | null
          id?: string
          probation_ends_at?: string | null
          reports_to?: string | null
          role_type: Database["public"]["Enums"]["workforce_role_type"]
          specialization?: Json | null
          status?: string
          talent_id: string
          team_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          grade_id?: string | null
          hired_at?: string | null
          id?: string
          probation_ends_at?: string | null
          reports_to?: string | null
          role_type?: Database["public"]["Enums"]["workforce_role_type"]
          specialization?: Json | null
          status?: string
          talent_id?: string
          team_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workforce_members_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "hr_grades"
            referencedColumns: ["id"]
          },
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
          {
            foreignKeyName: "workforce_members_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: true
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "workforce_members_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: true
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "workforce_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "hr_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      workforce_routing_rules: {
        Row: {
          agent_key: string | null
          audience_type: string | null
          channel_provider: string
          client_id: string | null
          created_at: string | null
          description: string | null
          destination_id: string
          event_topic: string
          id: string
          is_active: boolean | null
        }
        Insert: {
          agent_key?: string | null
          audience_type?: string | null
          channel_provider: string
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          destination_id: string
          event_topic: string
          id?: string
          is_active?: boolean | null
        }
        Update: {
          agent_key?: string | null
          audience_type?: string | null
          channel_provider?: string
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          destination_id?: string
          event_topic?: string
          id?: string
          is_active?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "workforce_routing_rules_agent_key_fkey"
            columns: ["agent_key"]
            isOneToOne: false
            referencedRelation: "agent_outreach_admin_v"
            referencedColumns: ["agent_key"]
          },
          {
            foreignKeyName: "workforce_routing_rules_agent_key_fkey"
            columns: ["agent_key"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["agent_key"]
          },
          {
            foreignKeyName: "workforce_routing_rules_agent_key_fkey"
            columns: ["agent_key"]
            isOneToOne: false
            referencedRelation: "ai_agents_with_stats"
            referencedColumns: ["agent_key"]
          },
        ]
      }
    }
    Views: {
      agent_outreach_admin_v: {
        Row: {
          agent_key: string | null
          agent_name: string | null
          body: string | null
          channel: string | null
          conversation_id: string | null
          created_at: string | null
          credits_charged: number | null
          error_message: string | null
          event_id: string | null
          event_kind: string | null
          external_message_id: string | null
          id: string | null
          recipient_id: string | null
          recipient_kind: string | null
          status: string | null
          subject: string | null
          trigger_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_outreach_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "platform_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_outreach_trigger_id_fkey"
            columns: ["trigger_id"]
            isOneToOne: false
            referencedRelation: "agent_triggers"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agents_with_stats: {
        Row: {
          active_prompt_variant: string | null
          agent_key: string | null
          agent_level: number | null
          agent_type: string | null
          allowed_tools: string[] | null
          audience: string | null
          avatar_url: string | null
          average_rating: number | null
          avg_rating: number | null
          bg_color: string | null
          builder_model: string | null
          canvas_mode: string | null
          capabilities: string[] | null
          category: string | null
          color: string | null
          company_id: string | null
          connection_fee: number | null
          created_at: string | null
          credit_cost: number | null
          delivery_credit_cost: number | null
          description: string | null
          display_order: number | null
          expertise_areas: string[] | null
          icon: string | null
          id: string | null
          is_active: boolean | null
          is_featured: boolean | null
          kill_switch: boolean | null
          marketplace_status: string | null
          message_credit_cost: number | null
          model: string | null
          monthly_target: number | null
          name: string | null
          owner_id: string | null
          owner_kind: string | null
          personality_traits: Json | null
          prompt_variants: Json | null
          review_count: number | null
          sample_conversations: Json | null
          session_duration_minutes: number | null
          system_prompt: string | null
          total_conversations: number | null
          total_messages: number | null
          total_users: number | null
          updated_at: string | null
          visibility: string | null
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
      gig_submissions_unified_view: {
        Row: {
          created_at: string | null
          gig_id: string | null
          gig_kind: string | null
          payload: Json | null
          reviewed_at: string | null
          status: string | null
          submission_id: string | null
          talent_id: string | null
        }
        Relationships: []
      }
      gig_verifier_override_rollup: {
        Row: {
          auto_approved: number | null
          day: string | null
          false_positive_rate: number | null
          gig_kind: string | null
          overridden_rejects: number | null
          total_verdicts: number | null
        }
        Relationships: []
      }
      gigs_unified_view: {
        Row: {
          acceptance_criteria: Json | null
          created_at: string | null
          credits: number | null
          deadline: string | null
          description: string | null
          id: string | null
          kind: string | null
          posted_by: string | null
          skill_category: string | null
          skills: string[] | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Relationships: []
      }
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
      ir_document_hot_slides: {
        Row: {
          document_id: string | null
          investor_id: string | null
          last_seen: string | null
          slide_label: string | null
          slide_number: number | null
          total_dwell: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ir_document_views_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "ir_data_room_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ir_document_views_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "ir_investors"
            referencedColumns: ["id"]
          },
        ]
      }
      school_readiness_v: {
        Row: {
          is_ready: boolean | null
          pct_ready: number | null
          ready_courses: number | null
          school_id: string | null
          school_name: string | null
          school_slug: string | null
          total_courses: number | null
        }
        Relationships: []
      }
      talent_lifetime_credits: {
        Row: {
          lifetime_earned: number | null
          lifetime_spent: number | null
          lifetime_volume: number | null
          talent_id: string | null
          transaction_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_talent_transaction_volume"
            referencedColumns: ["talent_id"]
          },
          {
            foreignKeyName: "credit_transactions_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "v_weekly_leaderboard"
            referencedColumns: ["talent_id"]
          },
        ]
      }
      v_company_sales_context: {
        Row: {
          company_id: string | null
          currency: string | null
          email: string | null
          lead_company_name: string | null
          lead_id: string | null
          name: string | null
          next_action_at: string | null
          next_step: string | null
          offering_id: string | null
          offering_kind: string | null
          offering_name: string | null
          phone: string | null
          price_max: number | null
          price_min: number | null
          recent_activities: Json | null
          stage: Database["public"]["Enums"]["crm_lead_stage"] | null
          title: string | null
          value_usd: number | null
        }
        Relationships: [
          {
            foreignKeyName: "company_leads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      v_talent_transaction_volume: {
        Row: {
          talent_id: string | null
          volume: number | null
        }
        Relationships: []
      }
      v_top_hyped_posts_week: {
        Row: {
          hypes_week: number | null
          post_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_hypes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      v_weekly_leaderboard: {
        Row: {
          credits_earned: number | null
          full_name: string | null
          hype_count: number | null
          profile_photo_url: string | null
          talent_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_gig_bid: {
        Args: { p_bid_id: string; p_company_id: string }
        Returns: Json
      }
      accept_lesson_answer: {
        Args: { _answer_id: string; _question_id: string }
        Returns: undefined
      }
      accept_offer: {
        Args: { p_offer_id: string; p_signed_name: string }
        Returns: Json
      }
      add_credits:
        | {
            Args: {
              p_amount: number
              p_description?: string
              p_talent_id: string
              p_transaction_type: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_amount: number
              p_description?: string
              p_talent_id: string
              p_transaction_type?: string
            }
            Returns: Json
          }
      add_portfolio_item: {
        Args: {
          p_description?: string
          p_image_url?: string
          p_tags?: string[]
          p_title: string
          p_url?: string
        }
        Returns: Json
      }
      add_project_milestone: {
        Args: { _payload: Json; _project_id: string }
        Returns: string
      }
      add_talent_service: {
        Args: { p_service: string; p_talent_id: string }
        Returns: undefined
      }
      admin_award_credits: {
        Args: { _amount: number; _reason: string; _talent: string }
        Returns: undefined
      }
      advance_abroad_stage: {
        Args: { _application_id: string; _next_stage: string; _note?: string }
        Returns: undefined
      }
      analyst_metric: { Args: { metric: string; period?: Json }; Returns: Json }
      analyst_series: {
        Args: { granularity?: string; metric: string; period?: Json }
        Returns: Json
      }
      analyst_top_n: {
        Args: { dimension: string; metric: string; n?: number; period?: Json }
        Returns: Json
      }
      application_company_id: {
        Args: { p_application_id: string }
        Returns: string
      }
      application_talent_user_id: {
        Args: { p_application_id: string }
        Returns: string
      }
      apply_for_reviewer: { Args: { _categories: string[] }; Returns: string }
      apply_to_job: {
        Args: {
          p_cover_letter?: string
          p_cv_url?: string
          p_job_id: string
          p_source?: string
        }
        Returns: Json
      }
      apply_verification_verdict: {
        Args: { _verification_id: string }
        Returns: undefined
      }
      approve_content_gig:
        | { Args: { p_admin_notes?: string; p_gig_id: string }; Returns: Json }
        | {
            Args: {
              p_admin_notes?: string
              p_gig_id: string
              p_quality_score?: number
            }
            Returns: Json
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
      assign_abroad_counsellor: {
        Args: { _application_id: string; _counsellor_user_id: string }
        Returns: undefined
      }
      assign_career_coach:
        | { Args: { _talent_id: string }; Returns: string }
        | { Args: { p_goal?: string; p_profession_id: string }; Returns: Json }
      assign_peer_reviewers: {
        Args: { _n?: number; _submission_id: string }
        Returns: number
      }
      auto_deactivate_expired_jobs: { Args: never; Returns: number }
      auto_finalize_gig_submission: {
        Args: {
          p_credit_amount?: number
          p_decision: string
          p_feedback?: string
          p_score?: number
          p_submission_id: string
        }
        Returns: Json
      }
      award_credits: {
        Args: { p_amount: number; p_reason: string; p_talent_id: string }
        Returns: Json
      }
      award_gig_credits: {
        Args: { p_admin_notes?: string; p_submission_id: string }
        Returns: Json
      }
      award_milestone: {
        Args: { _assignments: Json; _milestone_id: string }
        Returns: Json
      }
      boost_profile: { Args: never; Returns: Json }
      can_operate_messaging_channel: {
        Args: { _channel: string; _user: string }
        Returns: boolean
      }
      cancel_gig_project: {
        Args: { _project_id: string; _reason: string }
        Returns: Json
      }
      cancel_invoice: {
        Args: { p_invoice_id: string; p_reason?: string }
        Returns: Json
      }
      cancel_milestone: {
        Args: { _milestone_id: string; _reason: string }
        Returns: Json
      }
      charge_company_credits: {
        Args: {
          p_amount: number
          p_company_id: string
          p_description: string
          p_reference_id?: string
          p_service_type: string
          p_txn_type: string
        }
        Returns: Json
      }
      check_auth_email: { Args: { lookup_email: string }; Returns: Json }
      check_cv_duplicate: {
        Args: { _fingerprint: string; _self_user_id: string }
        Returns: {
          duplicate: boolean
          other_count: number
        }[]
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
      claim_course_project: { Args: { p_project_id: string }; Returns: Json }
      claim_review_assignment: {
        Args: { _assignment_id: string }
        Returns: Json
      }
      cleanup_rate_limits: { Args: never; Returns: undefined }
      cohort_health: {
        Args: { _cohort_id: string }
        Returns: {
          attendance_rate: number
          capacity: number
          cohort_id: string
          enrollment_count: number
          session_count: number
          upcoming_sessions: number
        }[]
      }
      compose_feed_post: {
        Args: {
          p_link_url?: string
          p_media_url?: string
          p_tags?: string[]
          p_text: string
        }
        Returns: Json
      }
      compute_company_profile_completion: {
        Args: { c: Database["public"]["Tables"]["companies"]["Row"] }
        Returns: number
      }
      confirm_interview_slot: {
        Args: { p_interview_id: string; p_slot_id: string }
        Returns: Json
      }
      connect_agent: {
        Args: { _agent_key: string; _fee?: number; _talent_id: string }
        Returns: undefined
      }
      connection_accept_and_open_thread: {
        Args: { _connection_id: string }
        Returns: string
      }
      count_jobs_by_type: {
        Args: { _country?: string }
        Returns: {
          cnt: number
          job_type: string
        }[]
      }
      create_credit_invoice: {
        Args: {
          p_bundle_credits: number
          p_bundle_price_local?: number
          p_bundle_price_usd: number
          p_currency?: string
        }
        Returns: Json
      }
      create_gig_project: { Args: { _payload: Json }; Returns: string }
      create_poll: {
        Args: {
          p_ends_at?: string
          p_options: Json
          p_question: string
          p_tags?: string[]
        }
        Returns: Json
      }
      cron_rebuild_stale_job_recs: {
        Args: { _batch?: number }
        Returns: number
      }
      debit_instructor_credit: {
        Args: {
          _amount: number
          _content_id: string
          _reason: string
          _ref_id?: string
          _user_id: string
        }
        Returns: number
      }
      decline_offer: {
        Args: { p_note?: string; p_offer_id: string }
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
      delete_course_project: { Args: { p_project_id: string }; Returns: Json }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      dm_thread_company_id: { Args: { p_thread_id: string }; Returns: string }
      dm_thread_talent_id: { Args: { p_thread_id: string }; Returns: string }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      enqueue_platform_event: {
        Args: {
          p_event_kind: string
          p_payload?: Json
          p_subject_id?: string
          p_subject_kind?: string
        }
        Returns: string
      }
      enroll_in_content: {
        Args: { p_content_id: string; p_ref_code?: string }
        Returns: Json
      }
      ensure_agent_thread: {
        Args: { _agent_key: string; _talent_id: string }
        Returns: string
      }
      ensure_system_thread: { Args: { _talent_id: string }; Returns: string }
      export_escrow_ledger_csv: {
        Args: { _project_id: string }
        Returns: string
      }
      find_or_create_company: {
        Args: {
          p_country?: string
          p_industry?: string
          p_name: string
          p_website?: string
        }
        Returns: string
      }
      fn_recompute_enrollment_progress: {
        Args: { p_enrollment_id: string }
        Returns: undefined
      }
      fund_gig_project: { Args: { _project_id: string }; Returns: Json }
      generate_course_project: {
        Args: {
          p_completion_bonus?: number
          p_course_id: string
          p_credit_per_subtask?: number
        }
        Returns: Json
      }
      get_application_buckets: { Args: { p_user_id: string }; Returns: Json }
      get_application_hire_state: {
        Args: { p_application_id: string }
        Returns: Json
      }
      get_application_thread_summary: {
        Args: { p_application_id: string }
        Returns: Json
      }
      get_authoring_review_digest: {
        Args: { _days?: number; _module_id: string }
        Returns: Json
      }
      get_authoring_trends: {
        Args: { _days?: number; _instructor_id: string }
        Returns: Json
      }
      get_companies_with_signal: {
        Args: { p_country?: string; p_limit?: number }
        Returns: {
          active_jobs: number
          company_name: string
          jobs_last_14d: number
          logo_url: string
          top_location: string
          top_type: string
        }[]
      }
      get_company_branded_catalog: { Args: { p_slug: string }; Returns: Json }
      get_company_detail: { Args: { p_company_name: string }; Returns: Json }
      get_company_project_pipeline: {
        Args: { _company_id: string }
        Returns: Json
      }
      get_company_public_projects: { Args: { _slug: string }; Returns: Json }
      get_company_unlocked_talents: {
        Args: { p_company_id: string }
        Returns: string[]
      }
      get_countries_with_signal: {
        Args: { p_limit?: number }
        Returns: {
          active_jobs: number
          country: string
          jobs_last_14d: number
          top_cities: Json
          top_companies: Json
        }[]
      }
      get_creator_scorecard: {
        Args: { _days?: number; _talent_id: string }
        Returns: Json
      }
      get_creator_top_posts: {
        Args: { _days?: number; _limit?: number; _talent_id: string }
        Returns: {
          comment_count: number
          created_at: string
          credits_earned: number
          hype_count: number
          id: string
          impression_count: number
          save_count: number
          share_count: number
          snippet: string
        }[]
      }
      get_employer_gig_bids: { Args: { p_gig_id: string }; Returns: Json }
      get_employer_jobs_dashboard: {
        Args: { p_company_id: string }
        Returns: {
          applicant_count: number
          created_at: string
          deadline: string
          id: string
          is_active: boolean
          job_kind: string
          location: string
          salary_currency: string
          salary_range_max: number
          salary_range_min: number
          title: string
          vacancies: number
        }[]
      }
      get_employer_pipeline: {
        Args: { p_company_id?: string; p_job_id?: string }
        Returns: Json
      }
      get_employer_pipeline_full: {
        Args: { p_company_id?: string; p_job_id?: string; p_limit?: number }
        Returns: Json
      }
      get_feed_engagement: {
        Args: { _post_ids: string[]; _talent_id?: string }
        Returns: {
          poll_counts: Json
          post_id: string
          reaction_counts: Json
          user_reaction: string
          user_vote: string
        }[]
      }
      get_gigs_hub_dashboard: { Args: never; Returns: Json }
      get_hiring_stats: {
        Args: { p_company_id: string; p_window_days?: number }
        Returns: Json
      }
      get_instructor_dashboard_v2: {
        Args: { _user_id?: string }
        Returns: Json
      }
      get_instructor_earnings_summary: {
        Args: { _user_id?: string }
        Returns: Json
      }
      get_instructor_summary: { Args: { _user_id?: string }; Returns: Json }
      get_jobs_hub_dashboard: { Args: { _talent_id: string }; Returns: Json }
      get_jobs_in_field: {
        Args: { _limit?: number; _talent_id: string }
        Returns: {
          ai_assessment_enabled: boolean | null
          ai_enhanced_description: string | null
          application_email: string | null
          application_type: Database["public"]["Enums"]["application_type"]
          application_url: string | null
          assessment_config: Json | null
          company_id: string | null
          company_logo_url: string | null
          company_name: string
          course_brief_id: string | null
          created_at: string | null
          deadline: string | null
          description: string
          experience_level: Database["public"]["Enums"]["experience_level"]
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          job_kind: string
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
        }[]
        SetofOptions: {
          from: "*"
          to: "jobs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_leaderboard: {
        Args: { _category?: string; _kind: string; _period?: string }
        Returns: Json
      }
      get_learning_hub_dashboard: { Args: never; Returns: Json }
      get_next_best_tool: { Args: { p_user_id: string }; Returns: Json }
      get_or_create_talent: {
        Args: {
          p_email: string
          p_full_name?: string
          p_phone?: string
          p_user_id?: string
        }
        Returns: string
      }
      get_post_insights: { Args: { _post_id: string }; Returns: Json }
      get_public_project_detail: { Args: { _slug: string }; Returns: Json }
      get_public_projects: {
        Args: { _filters?: Json; _page?: number; _page_size?: number }
        Returns: Json
      }
      get_public_talent_profile: { Args: { _handle: string }; Returns: Json }
      get_ranked_gigs_for_talent: {
        Args: { _cursor?: number; _limit?: number; _talent_id: string }
        Returns: {
          created_at: string
          credits: number
          deadline: string
          description: string
          gig_id: string
          kind: string
          match_score: number
          rank_score: number
          skill_category: string
          status: string
          title: string
        }[]
      }
      get_ranked_jobs_for_talent: {
        Args: { _cursor?: number; _limit?: number; _talent_id: string }
        Returns: {
          job: Json
          match_reason: string
          match_score: number
          rank_score: number
        }[]
      }
      get_remote_friendly_summary: { Args: never; Returns: Json }
      get_reviewer_program_health: { Args: never; Returns: Json }
      get_sourcing_stats: {
        Args: { p_company_id: string; p_window_days?: number }
        Returns: Json
      }
      get_talent_connection_price: {
        Args: { _recipient: string }
        Returns: number
      }
      get_talent_contact_unlock_cost: { Args: never; Returns: number }
      get_talent_outcome_signal: { Args: { _talent_id: string }; Returns: Json }
      get_talent_project_workload: {
        Args: { _talent_id: string }
        Returns: Json
      }
      get_talent_public_projects: { Args: { _handle: string }; Returns: Json }
      get_track_progress: { Args: { p_assignment_id: string }; Returns: Json }
      get_trending_jobs: {
        Args: { limit_n?: number }
        Returns: {
          ai_assessment_enabled: boolean | null
          ai_enhanced_description: string | null
          application_email: string | null
          application_type: Database["public"]["Enums"]["application_type"]
          application_url: string | null
          assessment_config: Json | null
          company_id: string | null
          company_logo_url: string | null
          company_name: string
          course_brief_id: string | null
          created_at: string | null
          deadline: string | null
          description: string
          experience_level: Database["public"]["Enums"]["experience_level"]
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          job_kind: string
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
        }[]
        SetofOptions: {
          from: "*"
          to: "jobs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_tutor_mastery_context: {
        Args: { _content_id?: string; _module_id?: string; _talent_id: string }
        Returns: Json
      }
      get_weekly_winners: {
        Args: { _end: string; _start: string }
        Returns: {
          credits_earned: number
          hype_count: number
          talent_id: string
        }[]
      }
      grant_company_welcome_credits: {
        Args: { p_amount?: number; p_company_id: string }
        Returns: boolean
      }
      gro10x_global_search: {
        Args: { _limit?: number; _q: string }
        Returns: Json
      }
      has_any_admin_role: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      headless_pool_charge: {
        Args: { p_amount: number; p_reason?: string }
        Returns: Json
      }
      hype_content: {
        Args: { _content_id: string; _content_type: string }
        Returns: Json
      }
      hype_post: { Args: { _post_id: string }; Returns: Json }
      increment_agent_conversations: {
        Args: { p_agent_key: string }
        Returns: undefined
      }
      increment_content_enrollment: {
        Args: { p_content_id: string }
        Returns: number
      }
      instructor_session_attendance: {
        Args: { _session_id: string }
        Returns: {
          display_name: string
          duration_seconds: number
          email: string
          joined_at: string
          source: Database["public"]["Enums"]["attendance_source"]
          status: Database["public"]["Enums"]["attendance_status"]
          user_id: string
        }[]
      }
      instructor_session_rate_credits: { Args: never; Returns: number }
      interview_company_id: {
        Args: { p_interview_id: string }
        Returns: string
      }
      interview_talent_id: { Args: { p_interview_id: string }; Returns: string }
      is_agent_connected: {
        Args: { _agent_key: string; _talent_id: string }
        Returns: boolean
      }
      is_cohort_member: {
        Args: { _cohort_id: string; _user_id: string }
        Returns: boolean
      }
      is_company_admin: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      is_company_member: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      is_content_lead_for_school: {
        Args: { _school_id: string; _user_id: string }
        Returns: boolean
      }
      is_content_learner: {
        Args: { _content_id: string; _user_id: string }
        Returns: boolean
      }
      is_course_instructor: {
        Args: { _content_id: string; _user_id: string }
        Returns: boolean
      }
      is_enrolled_in_module: { Args: { _module_id: string }; Returns: boolean }
      issue_skill_credential: {
        Args: { _module_id: string; _talent_id: string; _topic_tag: string }
        Returns: {
          attempts_at_issue: number
          content_id: string | null
          created_at: string
          evidence: Json
          id: string
          issued_at: string
          level: string
          mastery_at_issue: number
          module_id: string | null
          revoked_at: string | null
          talent_id: string
          topic_tag: string
          verify_code: string
        }
        SetofOptions: {
          from: "*"
          to: "skill_credentials"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      mark_payout_paid: {
        Args: { p_notes?: string; p_request_id: string }
        Returns: Json
      }
      mark_session_attendance: {
        Args: { _session_id: string }
        Returns: string
      }
      match_agent_knowledge: {
        Args: {
          p_agent_id: string
          p_match_count?: number
          p_query_embedding: string
        }
        Returns: {
          chunk_id: string
          content: string
          similarity: number
        }[]
      }
      match_gigs_for_talent: {
        Args: { _limit?: number; _talent_id: string }
        Returns: {
          credits: number
          deadline: string
          gig_id: string
          gig_kind: string
          match_id: string
          score: number
          signals: Json
          status: string
          title: string
          why_text: string
        }[]
      }
      match_talents_to_gig: {
        Args: { _gig_id: string; _gig_kind?: string; _limit?: number }
        Returns: {
          score: number
          signals: Json
          talent_id: string
        }[]
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
      normalize_company_name: { Args: { p_name: string }; Returns: string }
      normalize_company_website: { Args: { p_url: string }; Returns: string }
      normalize_country_name: { Args: { p_country: string }; Returns: string }
      normalize_phone: {
        Args: { p_country_code: string; p_phone: string }
        Returns: string
      }
      notify_talent_from_ai_general: {
        Args: {
          _icon?: string
          _link: string
          _message: string
          _talent_id: string
          _title: string
          _type: string
        }
        Returns: undefined
      }
      offer_company_id: { Args: { p_offer_id: string }; Returns: string }
      offer_talent_id: { Args: { p_offer_id: string }; Returns: string }
      open_gig_dispute: {
        Args: {
          _evidence?: Json
          _gig_id: string
          _narrative: string
          _opened_by_role: string
          _reason_code: string
          _submission_id: string
          _verification_id: string
        }
        Returns: string
      }
      open_verification_appeal: {
        Args: { _evidence?: Json; _reason: string; _verification_id: string }
        Returns: string
      }
      org_assign_talents: {
        Args: {
          p_budget_per_seat?: number
          p_cohort_id: string
          p_company_id: string
          p_content_id: string
          p_due_at: string
          p_note?: string
          p_user_ids: string[]
        }
        Returns: {
          assignment_id: string
          enrollment_id: string
          user_id: string
        }[]
      }
      org_assign_track: {
        Args: {
          p_company_id: string
          p_due_at?: string
          p_track_id: string
          p_user_ids: string[]
        }
        Returns: {
          assignment_id: string
          user_id: string
        }[]
      }
      org_learning_health: { Args: { p_company_id: string }; Returns: Json }
      org_mark_overdue: { Args: never; Returns: number }
      org_team_mastery: {
        Args: { p_company_id: string; p_content_id?: string }
        Returns: Json
      }
      outreach_can_send:
        | { Args: { p_channel_id: string }; Returns: boolean }
        | {
            Args: { p_channel_id: string; p_contact_id?: string }
            Returns: Json
          }
      place_gig_bid: {
        Args: {
          p_bid_amount: number
          p_cover_letter?: string
          p_estimated_days?: number
          p_gig_id: string
        }
        Returns: Json
      }
      process_instructor_payout: {
        Args: {
          _action: string
          _fx_rate?: number
          _notes?: string
          _request_id: string
        }
        Returns: Json
      }
      publish_gig_from_draft: { Args: { _draft_id: string }; Returns: string }
      publish_milestone: { Args: { _milestone_id: string }; Returns: Json }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      rebuild_job_recs_for_talent: {
        Args: { _limit?: number; _talent_id: string }
        Returns: number
      }
      recompute_all_trust_scores: { Args: never; Returns: number }
      recompute_content_readiness: {
        Args: { _content_id: string }
        Returns: undefined
      }
      recompute_course_project_progress: {
        Args: { p_project_id: string }
        Returns: undefined
      }
      recompute_enrollment_progress: {
        Args: { p_enrollment_id: string }
        Returns: undefined
      }
      recompute_module_rollup: {
        Args: { p_enrollment_id: string; p_module_id: string }
        Returns: undefined
      }
      recompute_reviewer_reputation: {
        Args: { _talent_id: string }
        Returns: undefined
      }
      recompute_school_readiness: {
        Args: { _school_id: string }
        Returns: undefined
      }
      recompute_talent_trust_score: {
        Args: { _talent_id: string }
        Returns: number
      }
      recompute_talent_trust_score_v2: {
        Args: { _talent_id: string }
        Returns: number
      }
      recompute_talent_verification: {
        Args: { p_talent_id: string }
        Returns: string
      }
      record_discovery_signal: {
        Args: {
          _id: string
          _kind: string
          _metadata?: Json
          _signal: string
          _weight?: number
        }
        Returns: undefined
      }
      record_impression: {
        Args: { _post_id: string; _surface?: string }
        Returns: undefined
      }
      record_match_event: {
        Args: { _event: string; _match_id: string }
        Returns: undefined
      }
      record_share: {
        Args: { _channel?: string; _post_id: string }
        Returns: undefined
      }
      refresh_gig_matches: {
        Args: { _gig_id: string; _gig_kind?: string; _limit?: number }
        Returns: number
      }
      reject_content_gig: {
        Args: { p_admin_notes?: string; p_gig_id: string }
        Returns: Json
      }
      reject_gig_submission: {
        Args: { p_admin_notes?: string; p_submission_id: string }
        Returns: Json
      }
      release_milestone_funds: {
        Args: { _milestone_id: string }
        Returns: Json
      }
      request_gig_verification: {
        Args: { _gig_kind: string; _submission_id: string }
        Returns: string
      }
      request_instructor_payout: {
        Args: { _amount: number; _details?: Json; _method: string }
        Returns: string
      }
      request_milestone_revision: {
        Args: { _milestone_id: string; _notes: string }
        Returns: Json
      }
      resolve_agent: {
        Args: {
          p_audience: string
          p_country?: string
          p_goal?: string
          p_profession_id?: string
        }
        Returns: string
      }
      resolve_dispute: {
        Args: { _dispute_id: string; _notes: string; _verdict: string }
        Returns: undefined
      }
      resolve_verification_appeal: {
        Args: { _appeal_id: string; _decision: string; _notes?: string }
        Returns: undefined
      }
      save_gig: { Args: { p_gig_id: string }; Returns: Json }
      save_job: { Args: { p_job_id: string }; Returns: Json }
      school_id_for_content: { Args: { _content_id: string }; Returns: string }
      score_talent_job_mastery: {
        Args: { _job_id: string; _talent_id: string }
        Returns: Json
      }
      search_public_talents: {
        Args: { p_filters?: Json; p_limit?: number; p_offset?: number }
        Returns: Json
      }
      set_skill_level: {
        Args: { p_level?: string; p_skill: string }
        Returns: Json
      }
      settle_review_panel: {
        Args: { _kind: string; _source_id: string }
        Returns: Json
      }
      shortlist_match: { Args: { _match_id: string }; Returns: undefined }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      submit_calibration_attempt: {
        Args: { _answers: Json; _score: number }
        Returns: Json
      }
      submit_course_for_review: { Args: { _content_id: string }; Returns: Json }
      submit_milestone_deliverables: {
        Args: { _milestone_id: string; _payload: Json }
        Returns: Json
      }
      submit_review_verdict: {
        Args: {
          _assignment_id: string
          _confidence?: number
          _payload?: Json
          _rationale?: string
          _time_spent_s?: number
          _verdict: string
        }
        Returns: Json
      }
      submit_revision: {
        Args: { _payload: Json; _revision_id: string }
        Returns: string
      }
      sweep_expired_connections: { Args: never; Returns: number }
      sweep_stale_talent_profiles: {
        Args: { p_days?: number }
        Returns: number
      }
      sweep_stalled_courses: { Args: never; Returns: number }
      sync_recorded_course_readiness: {
        Args: { p_content_id?: string }
        Returns: number
      }
      talent_connection_request: { Args: { _recipient: string }; Returns: Json }
      talent_connection_respond: {
        Args: { _accept: boolean; _request: string }
        Returns: Json
      }
      talent_enroll_track: { Args: { p_track_id: string }; Returns: string }
      talent_list_company_id: { Args: { _list_id: string }; Returns: string }
      talent_marketplace_summary: { Args: never; Returns: Json }
      talent_rel_company_id: { Args: { _rel_id: string }; Returns: string }
      tip_comment: {
        Args: { _amount: number; _comment_id: string }
        Returns: Json
      }
      toggle_project_public: {
        Args: { _project_id: string; _public: boolean }
        Returns: {
          case_study_md: string | null
          created_at: string
          featured_deliverables: Json
          is_public: boolean
          og_image_url: string | null
          project_id: string
          published_at: string | null
          seo_description: string | null
          seo_title: string | null
          share_count: number
          slug: string | null
          updated_at: string
          view_count: number
        }
        SetofOptions: {
          from: "*"
          to: "project_public_settings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      track_application_status: {
        Args: { p_application_id?: string; p_job_id?: string }
        Returns: Json
      }
      track_content_click: {
        Args: { p_content_id: string; p_source: string }
        Returns: undefined
      }
      track_course_referral_click: {
        Args: { p_content_id: string; p_ref_code: string }
        Returns: Json
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
      trigger_agent_report: {
        Args: {
          p_admin_user?: string
          p_agent_key: string
          p_prompt_text: string
        }
        Returns: number
      }
      try_dedupe_outreach: {
        Args: {
          p_agent_id: string
          p_cooldown_minutes?: number
          p_event_kind: string
          p_recipient_id: string
          p_recipient_kind: string
        }
        Returns: boolean
      }
      unlock_talent_contact: {
        Args: { p_company_id: string; p_talent_id: string }
        Returns: Json
      }
      unlock_talent_inbox: { Args: never; Returns: Json }
      upcoming_sessions_for_user: {
        Args: { _limit?: number; _user_id: string }
        Returns: {
          cohort_id: string
          content_id: string
          course_title: string
          duration_minutes: number
          kind: Database["public"]["Enums"]["session_kind"]
          meeting_link: string
          scheduled_date: string
          session_id: string
          status: Database["public"]["Enums"]["session_status"]
          title: string
        }[]
      }
      update_talent_profile: {
        Args: { p_field: string; p_value: string }
        Returns: Json
      }
      upsert_direct_thread: {
        Args: { p_company_id: string; p_talent_id: string }
        Returns: string
      }
      user_company_ids: { Args: { _user_id: string }; Returns: string[] }
    }
    Enums: {
      academy_type:
        | "executive"
        | "technical"
        | "freelancing"
        | "entrepreneurship"
        | "influencing"
      app_role:
        | "admin"
        | "student"
        | "talent_exec"
        | "content_lead"
        | "super_admin"
        | "talent_success_executive"
        | "instructor"
      application_status:
        | "submitted"
        | "sent_to_employer"
        | "viewed"
        | "shortlisted"
        | "rejected"
        | "withdrawn"
        | "hired"
      application_type: "email" | "link"
      attendance_source: "auto" | "self" | "instructor" | "system"
      attendance_status: "attended" | "partial" | "absent" | "excused"
      cohort_status:
        | "planning"
        | "open"
        | "in_progress"
        | "completed"
        | "archived"
      company_verification_tier: "unverified" | "self_completed" | "verified"
      content_type:
        | "free_video"
        | "recorded_course"
        | "live_webinar"
        | "batch_class"
        | "offline_seminar"
      course_project_status:
        | "open"
        | "claimed"
        | "in_progress"
        | "submitted"
        | "approved"
        | "paid"
        | "abandoned"
      course_subtask_kind:
        | "cover"
        | "intro_video"
        | "module_slides"
        | "module_quiz"
        | "module_video"
        | "reading"
        | "caption"
        | "translation"
        | "exercise"
        | "flashcards"
        | "other"
      course_subtask_status: "pending" | "in_review" | "approved" | "rejected"
      crm_activity_type: "note" | "call" | "email" | "meeting" | "task"
      crm_lead_stage:
        | "new"
        | "contacted"
        | "qualified"
        | "proposal"
        | "won"
        | "lost"
      delivery_status: "pending" | "sent" | "failed"
      enrollment_status: "pending_payment" | "active" | "completed"
      experience_level: "entry" | "mid" | "senior" | "executive"
      interview_mode: "video" | "phone" | "onsite"
      interview_status:
        | "proposed"
        | "confirmed"
        | "rescheduled"
        | "completed"
        | "no_show"
        | "cancelled"
      invitation_status:
        | "pending"
        | "accepted"
        | "declined"
        | "expired"
        | "revoked"
      job_type:
        | "full_time"
        | "part_time"
        | "contract"
        | "internship"
        | "freelance"
        | "remote"
      messaging_author: "user" | "agent" | "human_operator" | "system"
      messaging_channel_status:
        | "pending"
        | "connected"
        | "disconnected"
        | "error"
      messaging_direction: "in" | "out"
      messaging_provider: "whatsapp" | "telegram"
      messaging_queue_status:
        | "pending"
        | "processing"
        | "sent"
        | "failed"
        | "cancelled"
      messaging_status: "queued" | "sent" | "delivered" | "read" | "failed"
      offer_status:
        | "draft"
        | "sent"
        | "accepted"
        | "declined"
        | "countered"
        | "expired"
        | "withdrawn"
      org_assignment_status:
        | "invited"
        | "active"
        | "completed"
        | "overdue"
        | "cancelled"
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
      report_status: "open" | "reviewed" | "dismissed" | "removed"
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
      review_assignment_status: "pending" | "completed" | "skipped" | "expired"
      session_kind:
        | "lecture"
        | "office_hours"
        | "review"
        | "exam"
        | "orientation"
        | "workshop"
      session_status: "scheduled" | "ongoing" | "completed" | "cancelled"
      source_platform: "facebook" | "linkedin" | "bdjobs" | "website" | "other"
      student_status: "lead" | "free_learner" | "enrolled" | "graduated"
      submission_kind: "project" | "scenario" | "assignment"
      submission_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "reviewed"
        | "revisions_requested"
        | "approved"
      talent_activity_kind:
        | "note"
        | "message"
        | "status_change"
        | "call"
        | "email"
        | "task"
        | "list_added"
        | "invited"
      talent_relationship_stage:
        | "prospect"
        | "contacted"
        | "engaged"
        | "interviewing"
        | "offered"
        | "hired"
        | "passed"
        | "nurture"
      track_assignment_status:
        | "invited"
        | "active"
        | "completed"
        | "overdue"
        | "cancelled"
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
      app_role: [
        "admin",
        "student",
        "talent_exec",
        "content_lead",
        "super_admin",
        "talent_success_executive",
        "instructor",
      ],
      application_status: [
        "submitted",
        "sent_to_employer",
        "viewed",
        "shortlisted",
        "rejected",
        "withdrawn",
        "hired",
      ],
      application_type: ["email", "link"],
      attendance_source: ["auto", "self", "instructor", "system"],
      attendance_status: ["attended", "partial", "absent", "excused"],
      cohort_status: [
        "planning",
        "open",
        "in_progress",
        "completed",
        "archived",
      ],
      company_verification_tier: ["unverified", "self_completed", "verified"],
      content_type: [
        "free_video",
        "recorded_course",
        "live_webinar",
        "batch_class",
        "offline_seminar",
      ],
      course_project_status: [
        "open",
        "claimed",
        "in_progress",
        "submitted",
        "approved",
        "paid",
        "abandoned",
      ],
      course_subtask_kind: [
        "cover",
        "intro_video",
        "module_slides",
        "module_quiz",
        "module_video",
        "reading",
        "caption",
        "translation",
        "exercise",
        "flashcards",
        "other",
      ],
      course_subtask_status: ["pending", "in_review", "approved", "rejected"],
      crm_activity_type: ["note", "call", "email", "meeting", "task"],
      crm_lead_stage: [
        "new",
        "contacted",
        "qualified",
        "proposal",
        "won",
        "lost",
      ],
      delivery_status: ["pending", "sent", "failed"],
      enrollment_status: ["pending_payment", "active", "completed"],
      experience_level: ["entry", "mid", "senior", "executive"],
      interview_mode: ["video", "phone", "onsite"],
      interview_status: [
        "proposed",
        "confirmed",
        "rescheduled",
        "completed",
        "no_show",
        "cancelled",
      ],
      invitation_status: [
        "pending",
        "accepted",
        "declined",
        "expired",
        "revoked",
      ],
      job_type: [
        "full_time",
        "part_time",
        "contract",
        "internship",
        "freelance",
        "remote",
      ],
      messaging_author: ["user", "agent", "human_operator", "system"],
      messaging_channel_status: [
        "pending",
        "connected",
        "disconnected",
        "error",
      ],
      messaging_direction: ["in", "out"],
      messaging_provider: ["whatsapp", "telegram"],
      messaging_queue_status: [
        "pending",
        "processing",
        "sent",
        "failed",
        "cancelled",
      ],
      messaging_status: ["queued", "sent", "delivered", "read", "failed"],
      offer_status: [
        "draft",
        "sent",
        "accepted",
        "declined",
        "countered",
        "expired",
        "withdrawn",
      ],
      org_assignment_status: [
        "invited",
        "active",
        "completed",
        "overdue",
        "cancelled",
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
      report_status: ["open", "reviewed", "dismissed", "removed"],
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
      review_assignment_status: ["pending", "completed", "skipped", "expired"],
      session_kind: [
        "lecture",
        "office_hours",
        "review",
        "exam",
        "orientation",
        "workshop",
      ],
      session_status: ["scheduled", "ongoing", "completed", "cancelled"],
      source_platform: ["facebook", "linkedin", "bdjobs", "website", "other"],
      student_status: ["lead", "free_learner", "enrolled", "graduated"],
      submission_kind: ["project", "scenario", "assignment"],
      submission_status: [
        "draft",
        "submitted",
        "under_review",
        "reviewed",
        "revisions_requested",
        "approved",
      ],
      talent_activity_kind: [
        "note",
        "message",
        "status_change",
        "call",
        "email",
        "task",
        "list_added",
        "invited",
      ],
      talent_relationship_stage: [
        "prospect",
        "contacted",
        "engaged",
        "interviewing",
        "offered",
        "hired",
        "passed",
        "nurture",
      ],
      track_assignment_status: [
        "invited",
        "active",
        "completed",
        "overdue",
        "cancelled",
      ],
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

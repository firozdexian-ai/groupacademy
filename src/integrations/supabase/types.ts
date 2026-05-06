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
          created_at: string
          credits_charged: number
          error_message: string | null
          event_id: string | null
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
          created_at?: string
          credits_charged?: number
          error_message?: string | null
          event_id?: string | null
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
          created_at?: string
          credits_charged?: number
          error_message?: string | null
          event_id?: string | null
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
          created_at: string
          cron_expression: string | null
          event_kind: string
          id: string
          is_active: boolean
          last_fired_at: string | null
          recipient_filter: Json | null
          recipient_strategy: string
          template: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          cron_expression?: string | null
          event_kind: string
          id?: string
          is_active?: boolean
          last_fired_at?: string | null
          recipient_filter?: Json | null
          recipient_strategy?: string
          template: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          cron_expression?: string | null
          event_kind?: string
          id?: string
          is_active?: boolean
          last_fired_at?: string | null
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
          kill_switch: boolean
          marketplace_status: string
          message_credit_cost: number
          model: string
          monthly_target: number | null
          name: string
          owner_id: string | null
          owner_kind: string
          personality_traits: Json | null
          prompt_variants: Json
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
          kill_switch?: boolean
          marketplace_status?: string
          message_credit_cost?: number
          model?: string
          monthly_target?: number | null
          name: string
          owner_id?: string | null
          owner_kind?: string
          personality_traits?: Json | null
          prompt_variants?: Json
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
          kill_switch?: boolean
          marketplace_status?: string
          message_credit_cost?: number
          model?: string
          monthly_target?: number | null
          name?: string
          owner_id?: string | null
          owner_kind?: string
          personality_traits?: Json | null
          prompt_variants?: Json
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
          company_id: string
          content_id: string
          created_at: string
          created_by: string
          credit_cost: number
          due_at: string | null
          id: string
          note: string | null
          sponsorship_mode: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          company_id: string
          content_id: string
          created_at?: string
          created_by: string
          credit_cost?: number
          due_at?: string | null
          id?: string
          note?: string | null
          sponsorship_mode: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          company_id?: string
          content_id?: string
          created_at?: string
          created_by?: string
          credit_cost?: number
          due_at?: string | null
          id?: string
          note?: string | null
          sponsorship_mode?: string
          updated_at?: string
        }
        Relationships: [
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
          name: string
          next_action_at: string | null
          next_step: string | null
          notes: string | null
          offering_id: string | null
          owner_user_id: string | null
          phone: string | null
          source: string | null
          stage: Database["public"]["Enums"]["crm_lead_stage"]
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
          name: string
          next_action_at?: string | null
          next_step?: string | null
          notes?: string | null
          offering_id?: string | null
          owner_user_id?: string | null
          phone?: string | null
          source?: string | null
          stage?: Database["public"]["Enums"]["crm_lead_stage"]
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
          name?: string
          next_action_at?: string | null
          next_step?: string | null
          notes?: string | null
          offering_id?: string | null
          owner_user_id?: string | null
          phone?: string | null
          source?: string | null
          stage?: Database["public"]["Enums"]["crm_lead_stage"]
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
          content_type: Database["public"]["Enums"]["post_content_type"]
          created_at: string | null
          hype_count: number
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
          audience?: string
          author_avatar?: string | null
          author_company_id?: string | null
          author_name: string
          author_title?: string | null
          author_type?: string
          author_user_id?: string | null
          content_type?: Database["public"]["Enums"]["post_content_type"]
          created_at?: string | null
          hype_count?: number
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
          audience?: string
          author_avatar?: string | null
          author_company_id?: string | null
          author_name?: string
          author_title?: string | null
          author_type?: string
          author_user_id?: string | null
          content_type?: Database["public"]["Enums"]["post_content_type"]
          created_at?: string | null
          hype_count?: number
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
          created_at: string
          id: string
          label: string
          notes: string | null
          provider: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          notes?: string | null
          provider: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          notes?: string | null
          provider?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
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
      gigs: {
        Row: {
          auto_approval_config: Json
          auto_approval_mode: string
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
          auto_approval_config?: Json
          auto_approval_mode?: string
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
          auto_approval_config?: Json
          auto_approval_mode?: string
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
          resource_category?: string | null
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
          resource_category?: string | null
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
          id: string
          label: string
          language: string | null
          metadata: Json
          phone_e164: string | null
          provider: Database["public"]["Enums"]["messaging_provider"]
          rate_limit_per_min: number
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
          id?: string
          label: string
          language?: string | null
          metadata?: Json
          phone_e164?: string | null
          provider: Database["public"]["Enums"]["messaging_provider"]
          rate_limit_per_min?: number
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
          id?: string
          label?: string
          language?: string | null
          metadata?: Json
          phone_e164?: string | null
          provider?: Database["public"]["Enums"]["messaging_provider"]
          rate_limit_per_min?: number
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
          created_at: string
          external_chat_id: string
          id: string
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
          created_at?: string
          external_chat_id: string
          id?: string
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
          created_at?: string
          external_chat_id?: string
          id?: string
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
      talents: {
        Row: {
          achievements: Json | null
          batch_upload_id: string | null
          country: string | null
          country_code: string | null
          cover_image_url: string | null
          created_at: string | null
          current_status: string | null
          current_streak: number
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
          last_post_date: string | null
          learner_status: string | null
          linkedin_url: string | null
          longest_streak: number
          onboarding_completed_at: string | null
          onboarding_step: number | null
          phone: string | null
          portfolio_url: string | null
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
          country?: string | null
          country_code?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          current_status?: string | null
          current_streak?: number
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
          last_post_date?: string | null
          learner_status?: string | null
          linkedin_url?: string | null
          longest_streak?: number
          onboarding_completed_at?: string | null
          onboarding_step?: number | null
          phone?: string | null
          portfolio_url?: string | null
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
          country?: string | null
          country_code?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          current_status?: string | null
          current_streak?: number
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
          last_post_date?: string | null
          learner_status?: string | null
          linkedin_url?: string | null
          longest_streak?: number
          onboarding_completed_at?: string | null
          onboarding_step?: number | null
          phone?: string | null
          portfolio_url?: string | null
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
        ]
      }
    }
    Views: {
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
      admin_award_credits: {
        Args: { _amount: number; _reason: string; _talent: string }
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
      award_gig_credits: {
        Args: { p_admin_notes?: string; p_submission_id: string }
        Returns: Json
      }
      boost_profile: { Args: never; Returns: Json }
      can_operate_messaging_channel: {
        Args: { _channel: string; _user: string }
        Returns: boolean
      }
      cancel_invoice: {
        Args: { p_invoice_id: string; p_reason?: string }
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
      cleanup_rate_limits: { Args: never; Returns: undefined }
      compute_company_profile_completion: {
        Args: { c: Database["public"]["Tables"]["companies"]["Row"] }
        Returns: number
      }
      connect_agent: {
        Args: { _agent_key: string; _fee?: number; _talent_id: string }
        Returns: undefined
      }
      connection_accept_and_open_thread: {
        Args: { _connection_id: string }
        Returns: string
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
      generate_course_project: {
        Args: {
          p_completion_bonus?: number
          p_course_id: string
          p_credit_per_subtask?: number
        }
        Returns: Json
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
      get_public_talent_profile: { Args: { _handle: string }; Returns: Json }
      get_talent_connection_price: {
        Args: { _recipient: string }
        Returns: number
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
      hype_post: { Args: { _post_id: string }; Returns: Json }
      increment_agent_conversations: {
        Args: { p_agent_key: string }
        Returns: undefined
      }
      increment_content_enrollment: {
        Args: { p_content_id: string }
        Returns: number
      }
      is_agent_connected: {
        Args: { _agent_key: string; _talent_id: string }
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
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      recompute_content_readiness: {
        Args: { _content_id: string }
        Returns: undefined
      }
      recompute_course_project_progress: {
        Args: { p_project_id: string }
        Returns: undefined
      }
      recompute_school_readiness: {
        Args: { _school_id: string }
        Returns: undefined
      }
      recompute_talent_verification: {
        Args: { p_talent_id: string }
        Returns: string
      }
      reject_content_gig: {
        Args: { p_admin_notes?: string; p_gig_id: string }
        Returns: Json
      }
      reject_gig_submission: {
        Args: { p_admin_notes?: string; p_submission_id: string }
        Returns: Json
      }
      school_id_for_content: { Args: { _content_id: string }; Returns: string }
      score_talent_job_mastery: {
        Args: { _job_id: string; _talent_id: string }
        Returns: Json
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      sweep_expired_connections: { Args: never; Returns: number }
      sync_recorded_course_readiness: {
        Args: { p_content_id?: string }
        Returns: number
      }
      talent_connection_request: { Args: { _recipient: string }; Returns: Json }
      talent_connection_respond: {
        Args: { _accept: boolean; _request: string }
        Returns: Json
      }
      talent_marketplace_summary: { Args: never; Returns: Json }
      tip_comment: {
        Args: { _amount: number; _comment_id: string }
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
      unlock_talent_inbox: { Args: never; Returns: Json }
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
      application_status:
        | "submitted"
        | "sent_to_employer"
        | "viewed"
        | "shortlisted"
        | "rejected"
      application_type: "email" | "link"
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
      app_role: [
        "admin",
        "student",
        "talent_exec",
        "content_lead",
        "super_admin",
        "talent_success_executive",
      ],
      application_status: [
        "submitted",
        "sent_to_employer",
        "viewed",
        "shortlisted",
        "rejected",
      ],
      application_type: ["email", "link"],
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

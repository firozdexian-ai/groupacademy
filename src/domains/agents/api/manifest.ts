/**
 * Typed client surface for the Agents domain. Every edge-function call that
 * powers an agent flows through here so UI never imports
 * `supabase.functions.invoke` directly. New agent tools should add a method
 * to this manifest rather than calling Supabase from components.
 */
import { supabase } from "@/integrations/supabase/client";

export interface AgentRuntimeRequest {
  agent_key: string;
  thread_id?: string | null;
  message: string;
  context?: Record<string, unknown>;
}

export interface AgentRuntimeResponse {
  reply: string;
  thread_id: string;
  tool_calls?: Array<{ name: string; output: unknown }>;
  [k: string]: unknown;
}

export const agentsApi = {
  /** Single entry point for admin + talent + gro10x agent chat. */
  async runtime(payload: AgentRuntimeRequest): Promise<AgentRuntimeResponse> {
    const { data, error } = await supabase.functions.invoke("agent-runtime", {
      body: payload,
    });
    if (error) throw error;
    return data as AgentRuntimeResponse;
  },

  /** AI General concierge — talent shell entry point. */
  async general(payload: { message: string; thread_id?: string | null }) {
    const { data, error } = await supabase.functions.invoke("ai-general-chat", {
      body: payload,
    });
    if (error) throw error;
    return data;
  },
};

export type AgentsApi = typeof agentsApi;

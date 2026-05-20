/**
 * useAdminAgents — DB-backed source of truth for the Agentic Dashboard
 * sidebar. Reads `ai_agents` where `agent_type = 'admin'`, then merges in
 * the legacy meta-map (icon component + accent + functionName) from
 * `src/lib/adminAgents.ts` so the in-flight chat pipeline keeps working
 * during the staged migration.
 */
import { useQuery } from "@tanstack/react-query";
import { Bot, type LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_AGENTS_BY_KEY, type AdminAgent } from "@/lib/adminAgents";
import {
  Sparkles,
  Users,
  UserCog,
  BarChart3,
  Send,
  Building2,
  Mail,
  Briefcase,
  Landmark,
  Handshake,
  School,
  Coins,
} from "lucide-react";

const ICON_BY_KEY: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  users: Users,
  "user-cog": UserCog,
  "bar-chart-3": BarChart3,
  send: Send,
  "building-2": Building2,
  mail: Mail,
  briefcase: Briefcase,
  landmark: Landmark,
  handshake: Handshake,
  school: School,
  coins: Coins,
  bot: Bot,
};

const ACCENT_BY_COLOR: Record<string, string> = {
  primary: "bg-primary/15 text-primary",
  teal: "bg-teal-500/15 text-teal-500",
  pink: "bg-pink-500/15 text-pink-500",
  cyan: "bg-cyan-500/15 text-cyan-500",
  emerald: "bg-emerald-500/15 text-emerald-500",
  blue: "bg-blue-500/15 text-blue-500",
  violet: "bg-violet-500/15 text-violet-500",
  orange: "bg-orange-500/15 text-orange-500",
  indigo: "bg-indigo-500/15 text-indigo-500",
  amber: "bg-amber-500/15 text-amber-500",
  rose: "bg-rose-500/15 text-rose-500",
  sky: "bg-sky-500/15 text-sky-500",
  fuchsia: "bg-fuchsia-500/15 text-fuchsia-500",
};

interface AiAgentRow {
  agent_key: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  display_order: number | null;
  personality_traits: Record<string, any> | null;
  sample_conversations: any;
}

function rowToAgent(row: AiAgentRow): AdminAgent {
  const traits = row.personality_traits ?? {};
  const legacy = ADMIN_AGENTS_BY_KEY[row.agent_key];
  const icon = ICON_BY_KEY[row.icon ?? ""] ?? legacy?.icon ?? Bot;
  const accent =
    traits.accent ||
    ACCENT_BY_COLOR[row.color ?? ""] ||
    legacy?.accent ||
    "bg-muted text-foreground";
  const suggestions = Array.isArray(row.sample_conversations)
    ? row.sample_conversations.filter((s) => typeof s === "string")
    : legacy?.suggestions ?? [];
  return {
    key: row.agent_key,
    // NOTE: All admin chat traffic now flows through `agent-runtime`.
    // The `functionName` field is retained as a deprecated no-op for legacy types.
    functionName: "agent-runtime",
    name: row.name,
    tagline: traits.tagline || row.description || legacy?.tagline || "",
    icon,
    accent,
    suggestions,
  };
}

export function useAdminAgents() {
  return useQuery({
    queryKey: ["admin-agents"],
    queryFn: async (): Promise<AdminAgent[]> => {
      const { data, error } = await supabase
        .from("ai_agents")
        .select(
          "agent_key, name, description, icon, color, display_order, personality_traits, sample_conversations",
        )
        .eq("agent_type", "admin")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data as AiAgentRow[]).map(rowToAgent);
    },
    staleTime: 5 * 60 * 1000,
  });
}

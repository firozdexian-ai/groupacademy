import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MessageCircle, Star, Users, Coins, Bot, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { AgentReviewSection } from "@/components/agents/AgentReviewSection";

/**
 * LinkedIn-style human profile for an AI agent.
 * The Agent Marketplace links here; "Connect & Message" routes into /app/messages/:agentKey.
 */
export default function AgentProfile() {
  const { agentKey } = useParams<{ agentKey: string }>();
  const navigate = useNavigate();
  const { talent } = useTalent();
  const [agent, setAgent] = useState<any>(null);
  const [stats, setStats] = useState<{ users: number; messages: number; rating: number; reviews: number }>({
    users: 0,
    messages: 0,
    rating: 0,
    reviews: 0,
  });
  const [isLoading, setLoading] = useState(true);
  const [hasChatted, setHasChatted] = useState(false);

  useEffect(() => {
    if (!agentKey) return;
    (async () => {
      setLoading(true);
      const [{ data: a }, { data: s }] = await Promise.all([
        supabase.from("ai_agents").select("*").eq("agent_key", agentKey).maybeSingle(),
        supabase.from("ai_agents_with_stats").select("total_users,total_messages,avg_rating,review_count").eq("agent_key", agentKey).maybeSingle(),
      ]);
      setAgent(a);
      if (s) {
        setStats({
          users: Number(s.total_users) || 0,
          messages: Number(s.total_messages) || 0,
          rating: Number(s.avg_rating) || 0,
          reviews: Number(s.review_count) || 0,
        });
      }
      if (talent?.id) {
        const { data: sess } = await supabase
          .from("agent_chat_sessions")
          .select("id,messages")
          .eq("talent_id", talent.id)
          .eq("agent_key", agentKey)
          .limit(1);
        const total = (sess || []).reduce(
          (n, row: any) => n + (Array.isArray(row.messages) ? row.messages.length : 0),
          0,
        );
        setHasChatted(total >= 3);
      }
      setLoading(false);
    })();
  }, [agentKey, talent?.id]);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center text-muted-foreground">
        Agent not found.
        <Button variant="link" onClick={() => navigate("/app/agents")}>
          Back to marketplace
        </Button>
      </div>
    );
  }

  const expertise: string[] = agent.expertise_areas || [];
  const headlineColor = agent.bg_color || "#2A7DDE";

  return (
    <div className="max-w-2xl mx-auto pb-32">
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/40 flex items-center gap-2 px-2 py-2">
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <p className="font-bold text-sm">Agent Profile</p>
      </header>

      {/* Hero */}
      <section
        className="relative h-28"
        style={{ background: `linear-gradient(135deg, ${headlineColor}, hsl(var(--primary)))` }}
      />
      <div className="px-4 -mt-12 space-y-4">
        <div className="flex items-end gap-3">
          <Avatar className="h-24 w-24 rounded-full ring-4 ring-background">
            {agent.avatar_url && <AvatarImage src={agent.avatar_url} alt={agent.name} />}
            <AvatarFallback className="text-white text-2xl rounded-full" style={{ backgroundColor: headlineColor }}>
              <Bot className="h-10 w-10" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 pb-1">
            <h1 className="text-xl font-bold leading-tight flex items-center gap-1.5">
              {agent.name}
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </h1>
            <p className="text-xs text-muted-foreground">
              {agent.agent_type === "company" ? "Company Agent" : "GroUp Academy Agent"}
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-border/40 bg-card p-2.5 text-center">
            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 mx-auto mb-0.5" />
            <p className="text-sm font-bold">{stats.rating ? stats.rating.toFixed(1) : "—"}</p>
            <p className="text-[10px] text-muted-foreground">{stats.reviews} reviews</p>
          </div>
          <div className="rounded-xl border border-border/40 bg-card p-2.5 text-center">
            <Users className="h-4 w-4 text-primary mx-auto mb-0.5" />
            <p className="text-sm font-bold">{stats.users}</p>
            <p className="text-[10px] text-muted-foreground">users</p>
          </div>
          <div className="rounded-xl border border-border/40 bg-card p-2.5 text-center">
            <MessageCircle className="h-4 w-4 text-emerald-500 mx-auto mb-0.5" />
            <p className="text-sm font-bold">{stats.messages}</p>
            <p className="text-[10px] text-muted-foreground">messages</p>
          </div>
        </div>

        {/* About */}
        {agent.description && (
          <section>
            <h2 className="text-base font-bold mb-1.5">About</h2>
            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{agent.description}</p>
          </section>
        )}

        {/* Expertise */}
        {expertise.length > 0 && (
          <section>
            <h2 className="text-base font-bold mb-1.5">Expertise</h2>
            <div className="flex flex-wrap gap-1.5">
              {expertise.map((e) => (
                <Badge key={e} variant="secondary" className="text-xs">
                  {e}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {/* Pricing */}
        <section className="rounded-2xl border border-border/40 bg-card p-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Per response</p>
            <p className="text-lg font-bold flex items-center gap-1">
              <Coins className="h-4 w-4 text-primary" />
              {agent.delivery_credit_cost || agent.credit_cost || 1} credits
            </p>
          </div>
          {agent.connection_fee != null && agent.connection_fee > 0 && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">One-time connect</p>
              <p className="text-lg font-bold">{agent.connection_fee}</p>
            </div>
          )}
        </section>

        {/* Reviews */}
        <AgentReviewSection agentKey={agentKey!} canReview={hasChatted} />
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-background/95 backdrop-blur-md border-t border-border/40 px-3 py-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
        <div className="max-w-2xl mx-auto">
          <Button
            className="w-full h-11 rounded-full gap-2 font-bold"
            onClick={() => navigate(`/app/messages/${agentKey}`)}
          >
            <MessageCircle className="h-4 w-4" />
            {hasChatted ? "Continue Conversation" : "Connect & Message"}
          </Button>
        </div>
      </div>
    </div>
  );
}

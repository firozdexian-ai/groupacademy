import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Search, Sparkles, Star, Coins, Loader2, MessageCircle } from "lucide-react";

interface MarketAgent {
  id: string;
  name: string;
  agent_key: string;
  description: string;
  category: string | null;
  message_credit_cost: number;
  total_conversations: number | null;
  average_rating: number | null;
  avatar_url: string | null;
  owner_kind: string;
  is_featured: boolean | null;
}

const CATEGORIES = ["all", "career", "productivity", "writing", "research", "coding", "lifestyle"];

export default function AgentMarketplace() {
  const [agents, setAgents] = useState<MarketAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("ai_agents")
      .select("id,name,agent_key,description,category,message_credit_cost,total_conversations,average_rating,avatar_url,owner_kind,is_featured")
      .eq("marketplace_status", "approved")
      .eq("visibility", "public")
      .eq("is_active", true)
      .order("is_featured", { ascending: false })
      .order("total_conversations", { ascending: false })
      .limit(120);
    setAgents((data as MarketAgent[]) ?? []);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return agents.filter((a) => {
      if (category !== "all" && (a.category ?? "").toLowerCase() !== category) return false;
      if (q && !`${a.name} ${a.description}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [agents, search, category]);

  const featured = filtered.filter((a) => a.is_featured).slice(0, 3);

  return (
    <div className="container max-w-5xl py-6 space-y-5 pb-24">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Agent Marketplace</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Discover AI agents built by our community of creators. Pay per message, no subscription.
        </p>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search agents by name or what they do…"
          className="pl-9"
        />
      </div>

      <Tabs value={category} onValueChange={setCategory}>
        <TabsList className="flex-wrap h-auto">
          {CATEGORIES.map((c) => (
            <TabsTrigger key={c} value={c} className="capitalize text-xs">{c}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading marketplace…
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground space-y-2">
            <Bot className="h-10 w-10 mx-auto opacity-50" />
            <p>No agents match your search.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {featured.length > 0 && category === "all" && !search && (
            <section className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Featured</h2>
              <div className="grid md:grid-cols-3 gap-3">
                {featured.map((a) => <AgentTile key={a.id} agent={a} featured />)}
              </div>
            </section>
          )}

          <section className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              All agents ({filtered.length})
            </h2>
            <div className="grid md:grid-cols-2 gap-3">
              {filtered.map((a) => <AgentTile key={a.id} agent={a} />)}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function AgentTile({ agent, featured }: { agent: MarketAgent; featured?: boolean }) {
  return (
    <Link to={`/app/agents/${agent.agent_key}`}>
      <Card className={`hover:border-primary/40 transition-colors h-full ${featured ? "border-primary/30 bg-primary/5" : ""}`}>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
              {agent.avatar_url ? (
                <img src={agent.avatar_url} alt={agent.name} className="h-full w-full object-cover" />
              ) : (
                <Bot className="h-5 w-5 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-sm truncate">{agent.name}</h3>
                {featured && <Badge className="bg-primary/15 text-primary text-[10px]" variant="outline">Featured</Badge>}
                {agent.owner_kind === "talent" && <Badge variant="secondary" className="text-[10px]">Community</Badge>}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{agent.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-1">
            <span className="flex items-center gap-1"><Coins className="h-3 w-3" /> {agent.message_credit_cost} cr/msg</span>
            <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {agent.total_conversations ?? 0}</span>
            {agent.average_rating ? (
              <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-amber-500 text-amber-500" /> {agent.average_rating.toFixed(1)}</span>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

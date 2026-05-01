import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAgentRuntime } from "@/hooks/useAgentRuntime";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bot, Send, Loader2, Building2, Sparkles, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

/**
 * Company Portal — agentic, WhatsApp-style inbox.
 * Every "contact" is an AI agent (recruiter, growth, ops, billing, etc.).
 * No human chats. The portal is the unified Agent OS rebound to a company subject.
 */

interface CompanyMembership {
  company_id: string;
  role: string;
  company: { id: string; name: string; logo_url: string | null };
}

interface AgentRow {
  id: string;
  agent_key: string;
  name: string;
  description: string | null;
  audience: string | null;
  agent_level: number | null;
}

export default function CompanyPortal() {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const [memberships, setMemberships] = useState<CompanyMembership[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [activeAgent, setActiveAgent] = useState<AgentRow | null>(null);
  const [loading, setLoading] = useState(true);

  const subject = useMemo(
    () => (activeCompanyId ? { kind: "company" as const, id: activeCompanyId } : undefined),
    [activeCompanyId],
  );

  const runtime = useAgentRuntime(subject);

  // Auth gate
  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  // Load company memberships + company-audience agents
  useEffect(() => {
    if (!user?.id) return;
    void (async () => {
      setLoading(true);
      const [{ data: mem }, { data: ags }] = await Promise.all([
        supabase
          .from("company_members")
          .select("company_id, role, company:companies(id, name, logo_url)")
          .eq("user_id", user.id)
          .eq("status", "active"),
        supabase
          .from("ai_agents")
          .select("id, agent_key, name, description, audience, agent_level")
          .in("audience", ["company", "public"])
          .eq("is_active", true)
          .order("display_order", { ascending: true }),
      ]);
      const m = (mem ?? []) as any as CompanyMembership[];
      setMemberships(m);
      setAgents((ags as any) ?? []);
      if (m.length && !activeCompanyId) setActiveCompanyId(m[0].company_id);
      setLoading(false);
    })();
  }, [user?.id]);

  // When agent or company changes, hydrate thread
  useEffect(() => {
    if (activeAgent && activeCompanyId) {
      void runtime.startOrResumeSession(activeAgent.agent_key);
    }
  }, [activeAgent?.agent_key, activeCompanyId]);

  if (authLoading || loading) {
    return (
      <div className="h-screen p-8 space-y-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-[80vh] w-full" />
      </div>
    );
  }

  if (!memberships.length) {
    return (
      <div className="h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-black">No company access</h1>
          <p className="text-sm text-muted-foreground">
            Your account isn't linked to any company yet. If your admin has invited you,
            sign in with the same email used for the invite. Otherwise, request access below.
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <Button
              onClick={() =>
                window.open(
                  `mailto:hello@groupacademy.online?subject=${encodeURIComponent(
                    "Company Portal access request",
                  )}&body=${encodeURIComponent(
                    `Hi GroUp team,\n\nI'd like to onboard my company on the Company Portal.\n\nName: \nCompany: \nRole: \nWebsite: \n\nThanks.`,
                  )}`,
                )
              }
            >
              Request company onboarding
            </Button>
            <Button variant="outline" onClick={() => navigate("/app/feed")}>
              Go to talent app
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const activeCompany = memberships.find((m) => m.company_id === activeCompanyId)?.company;

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-14 border-b bg-card px-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Sparkles className="h-5 w-5 text-primary shrink-0" />
          <span className="font-black text-sm truncate">Company Portal</span>
          <Badge variant="outline" className="text-[9px]">AGENTIC</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Select value={activeCompanyId ?? ""} onValueChange={setActiveCompanyId}>
            <SelectTrigger className="h-8 w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {memberships.map((m) => (
                <SelectItem key={m.company_id} value={m.company_id}>
                  {m.company?.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" variant="ghost" onClick={signOut}>
            <LogOut className="h-3 w-3" />
          </Button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-[300px_1fr] overflow-hidden">
        {/* Agent list (WhatsApp contacts) */}
        <aside className="border-r bg-muted/20 overflow-y-auto">
          <div className="p-3 border-b bg-card">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {activeCompany?.name} · Agents
            </p>
          </div>
          <div className="p-2 space-y-1">
            {agents.length === 0 && (
              <p className="text-xs text-muted-foreground italic p-3">
                No company agents available yet.
              </p>
            )}
            {agents.map((a) => (
              <button
                key={a.id}
                onClick={() => setActiveAgent(a)}
                className={cn(
                  "w-full text-left p-3 rounded-lg flex items-start gap-3 transition-all border",
                  activeAgent?.id === a.id
                    ? "bg-primary/10 border-primary/40"
                    : "border-transparent hover:bg-muted",
                )}
              >
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm truncate">{a.name}</span>
                    <Badge variant="secondary" className="text-[9px]">L{a.agent_level ?? 1}</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                    {a.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Chat area */}
        <section className="flex flex-col bg-background min-w-0">
          {activeAgent ? (
            <ChatPane agent={activeAgent} runtime={runtime} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div className="max-w-sm space-y-3">
                <Bot className="h-12 w-12 mx-auto text-muted-foreground" />
                <h2 className="text-lg font-bold">Pick an agent to start</h2>
                <p className="text-xs text-muted-foreground">
                  Every conversation here is with a Lovable AI agent. No humans, no waiting —
                  post jobs, query your pipeline, or run growth ops by just chatting.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 Chat Pane                                  */
/* -------------------------------------------------------------------------- */

function ChatPane({
  agent,
  runtime,
}: {
  agent: AgentRow;
  runtime: ReturnType<typeof useAgentRuntime>;
}) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [runtime.messages.length, runtime.isStreaming]);

  const handleSend = async () => {
    const v = input.trim();
    if (!v) return;
    setInput("");
    try {
      await runtime.sendMessage(v);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to send");
    }
  };

  return (
    <>
      {/* Chat header */}
      <div className="h-14 border-b bg-card px-4 flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
          <Bot className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-sm truncate">{agent.name}</p>
          <p className="text-[10px] text-muted-foreground truncate">{agent.description}</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 bg-muted/10">
        {runtime.isLoading && runtime.messages.length === 0 ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-10 w-1/2 ml-auto" />
          </div>
        ) : runtime.messages.length === 0 ? (
          <div className="text-center text-xs text-muted-foreground italic py-12">
            Start a conversation with {agent.name}.
          </div>
        ) : (
          runtime.messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "flex",
                m.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-card border rounded-bl-sm",
                )}
              >
                {m.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-pre:my-2">
                    <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{m.content}</p>
                )}
              </div>
            </div>
          ))
        )}
        {runtime.isStreaming && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> {agent.name} is typing…
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t bg-card p-3 flex items-end gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleSend();
            }
          }}
          placeholder={`Message ${agent.name}…`}
          disabled={runtime.isStreaming}
          className="flex-1"
        />
        <Button onClick={handleSend} disabled={runtime.isStreaming || !input.trim()} size="icon">
          {runtime.isStreaming ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </>
  );
}

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { computeReadiness } from "@/lib/talentReadiness";
import { toast } from "sonner";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

export default function ProfileBuilder() {
  const { talent, refreshTalent } = useTalent();
  const navigate = useNavigate();
  const [coach, setCoach] = useState<{ name: string; agent_key: string } | null>(null);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm Aisha 👋 I'll get your Gro10x profile market-ready in under a minute. To start — what's your full name?",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  // Auto-redirect once profile is market-ready
  useEffect(() => {
    if (!talent) return;
    const r = computeReadiness(talent);
    if (r.isLive && talent.onboardingCompletedAt) {
      navigate("/app/feed", { replace: true });
    }
  }, [talent, navigate]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setSending(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not signed in");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/talent-onboarding-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            messages: next.map((m) => ({ role: m.role, content: m.content })),
          }),
        },
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Aisha could not respond");

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply || "" }]);

      // Domain coach handoff
      if (data.handoff?.agent_key && data.handoff.agent_key !== coach?.agent_key) {
        const { data: agentRow } = await supabase
          .from("ai_agents")
          .select("name, agent_key")
          .eq("agent_key", data.handoff.agent_key)
          .maybeSingle();
        if (agentRow) {
          setCoach({ name: agentRow.name, agent_key: agentRow.agent_key });
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `✨ Handing you off to ${agentRow.name}, your domain coach. They'll take it from here to finish your profile.`,
            },
          ]);
          toast.success(`Connected with ${agentRow.name}`);
        }
      }

      // Refresh talent so the next message has updated KNOWN PROFILE & we can detect completion
      await refreshTalent();

      const fresh = (await supabase.auth.getUser()).data.user;
      if (fresh) {
        const { data: t } = await supabase
          .from("talents")
          .select("public_profile_enabled, onboarding_completed_at")
          .eq("user_id", fresh.id)
          .maybeSingle();
        if (t?.public_profile_enabled && !t.onboarding_completed_at) {
          await supabase
            .from("talents")
            .update({ onboarding_completed_at: new Date().toISOString(), onboarding_step: 99 })
            .eq("user_id", fresh.id);
          await refreshTalent();
        }
      }
    } catch (e: any) {
      toast.error(e.message || "Something went wrong");
    } finally {
      setSending(false);
    }
  };

  const readiness = computeReadiness(talent);

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold text-foreground">{coach?.name ?? "Aisha"}</h1>
            <p className="text-xs text-muted-foreground">
              {coach ? "Domain Coach" : "Profile Concierge"} · {readiness.percent}% complete
            </p>
          </div>
        </div>
        <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${readiness.percent}%` }}
          />
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-muted text-foreground rounded-bl-sm"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-border bg-card/50 backdrop-blur p-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Type your reply…"
            disabled={sending}
            className="rounded-full"
          />
          <Button
            onClick={send}
            disabled={sending || !input.trim()}
            size="icon"
            className="rounded-full h-10 w-10 shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, Map, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { RoadmapBuilderSheet } from "@/components/abroad/RoadmapBuilderSheet";

interface Msg { role: "user" | "assistant"; content: string }

export default function DestinationAgentPage() {
  const { country } = useParams<{ country: string }>();
  const code = (country || "").toUpperCase();

  const { data: agent, isLoading } = useQuery({
    queryKey: ["destination-agent", code],
    queryFn: async () => {
      const { data } = await supabase.from("destination_agents").select("*").eq("country_code", code).maybeSingle();
      return data;
    },
  });

  const { data: programs } = useQuery({
    queryKey: ["dest-programs", code],
    queryFn: async () => {
      const { data } = await supabase.from("study_abroad_programs").select("id,university_name,program_name,degree_type,tuition_range").eq("country_code", code).eq("is_active", true).limit(10);
      return data ?? [];
    },
  });

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // load history
    (async () => {
      const { data } = await supabase
        .from("destination_agent_messages")
        .select("role,content")
        .eq("country_code", code)
        .order("created_at", { ascending: true })
        .limit(40);
      if (data && data.length) {
        setMessages(data.map((m: any) => ({ role: m.role === "tool" ? "assistant" : m.role, content: m.content })));
      }
    })();
  }, [code]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || busy) return;
    const text = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-destination-agent", {
        body: { country_code: code, message: text, intent: "chat" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setMessages((m) => [...m, { role: "assistant", content: data.message }]);
    } catch (e: any) {
      toast.error(e.message || "Failed");
    } finally {
      setBusy(false);
    }
  };

  if (isLoading) return <div className="p-4"><Skeleton className="h-40 w-full" /></div>;
  if (!agent) return <div className="p-4 text-center text-muted-foreground">Destination not found.</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto">
      <Card className="m-4 p-3 flex items-center gap-3">
        <div className="text-4xl">{agent.flag_emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="font-bold">{agent.display_name}</div>
          <div className="text-xs text-muted-foreground">{agent.tagline}</div>
        </div>
        <RoadmapBuilderSheet countryCode={code}>
          <Button size="sm" variant="default"><Map className="h-4 w-4 mr-1" />Roadmap</Button>
        </RoadmapBuilderSheet>
      </Card>

      <ScrollArea className="flex-1 px-4" ref={scrollRef as any}>
        <div className="space-y-3">
          {messages.length === 0 && (
            <Card className="p-4 bg-muted/30">
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-primary mt-1" />
                <div className="text-sm">
                  Hi! Ask me anything about studying in {agent.display_name.replace(" Destination Agent", "")} — visas, universities, scholarships, IELTS cutoffs. Or tap <b>Roadmap</b> to build a 12-month plan.
                </div>
              </div>
              {!!programs?.length && (
                <div className="mt-3 text-xs text-muted-foreground">
                  <div className="font-semibold mb-1">Available programs:</div>
                  <ul className="space-y-0.5">
                    {programs.slice(0, 5).map((p) => <li key={p.id}>• {p.university_name} — {p.program_name}</li>)}
                  </ul>
                </div>
              )}
            </Card>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`rounded-2xl px-3 py-2 max-w-[85%] text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
            </div>
          ))}
          {busy && <div className="flex justify-start"><div className="rounded-2xl px-3 py-2 bg-muted text-sm"><Loader2 className="h-4 w-4 animate-spin" /></div></div>}
        </div>
      </ScrollArea>

      <div className="p-3 border-t flex gap-2 sticky bottom-0 bg-background">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Ask about programs, visas, scholarships..."
          disabled={busy}
        />
        <Button onClick={send} disabled={busy || !input.trim()} size="icon"><Send className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

/**
 * Business Analyst chat — talks to /admin-analyst edge function which uses
 * Lovable AI + whitelisted DB tools.
 */
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "How many transactions happened today?",
  "Revenue this month vs last month",
  "Top 10 countries by talents this quarter",
  "Top services by revenue, lifetime",
];

export function AnalystChatTab() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    const next = [...messages, userMsg];
    setMessages(next); setInput(""); setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-analyst", {
        body: { messages: next },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setMessages([...next, { role: "assistant", content: (data as any).content || "(no answer)" }]);
    } catch (e: any) {
      toast({ title: "Analyst error", description: e.message ?? String(e), variant: "destructive" });
      setMessages([...next, { role: "assistant", content: `_Error: ${e.message ?? e}_` }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col h-[70vh] gap-4">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-primary/10 text-primary">
          <Sparkles className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter italic">Business Analyst</h2>
          <p className="text-xs text-muted-foreground">Ask anything about your platform's data.</p>
        </div>
      </div>

      <Card className="flex-1 overflow-y-auto p-6 rounded-3xl border-2 border-border/40 bg-card/30 backdrop-blur space-y-4">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Try one of these:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUGGESTIONS.map((s) => (
                <Button key={s} variant="outline" className="justify-start text-left h-auto py-3" onClick={() => send(s)}>
                  {s}
                </Button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
              m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted/50 border border-border/40"
            }`}>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Analyzing…
          </div>
        )}
        <div ref={endRef} />
      </Card>

      <div className="flex gap-2 items-end">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
          placeholder="Ask the analyst…"
          className="rounded-2xl resize-none min-h-[56px]"
        />
        <Button onClick={() => send(input)} disabled={loading || !input.trim()} className="h-14 rounded-2xl px-6">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

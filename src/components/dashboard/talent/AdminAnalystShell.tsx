/**
 * Reusable admin chat shell — used by Business Analyst, Aisha Console,
 * and AI General Console. Gives every super-admin agent the same look
 * and conversation UX.
 */
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Send, Loader2, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type Msg = { role: "user" | "assistant"; content: string };

interface AdminAnalystShellProps {
  title: string;
  eyebrow: string;
  icon: LucideIcon;
  functionName: string;
  suggestions: string[];
  placeholder?: string;
}

export function AdminAnalystShell({
  title,
  eyebrow,
  icon: Icon,
  functionName,
  suggestions,
  placeholder = "Ask anything…",
}: AdminAnalystShellProps) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { messages: next },
      });
      if (error) throw error;
      const payload = data as any;
      if (payload?.error) {
        const detail = payload.detail
          ? ` — ${typeof payload.detail === "string" ? payload.detail : JSON.stringify(payload.detail)}`
          : "";
        throw new Error(`${payload.error}${detail}`);
      }
      setMessages([...next, { role: "assistant", content: payload.content || "(no answer)" }]);
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      toast({ title: `${title} error`, description: msg, variant: "destructive" });
      setMessages([...next, { role: "assistant", content: `_Error: ${msg}_` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-primary">
            <Icon className="h-8 w-8" />
            <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">
              {title}
            </h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            {eyebrow}
          </p>
        </div>
      </header>

      <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col h-[65vh]">
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 italic">
                Try one of these
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {suggestions.map((s) => (
                  <Button
                    key={s}
                    variant="outline"
                    className="justify-start text-left h-auto py-3 rounded-2xl border-2 whitespace-normal"
                    onClick={() => send(s)}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 border border-border/40"
                }`}
              >
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="border-t border-border/20 p-4 flex gap-2 items-end bg-background/60 backdrop-blur">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder={placeholder}
            className="rounded-2xl resize-none min-h-[56px] border-2"
          />
          <Button
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            className="h-14 rounded-2xl px-6"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}

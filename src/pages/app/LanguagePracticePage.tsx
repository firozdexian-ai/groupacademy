import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface Turn { role: "user" | "assistant"; content: string; translation_en?: string }
interface Correction { original: string; corrected: string; explanation: string }

export default function LanguagePracticePage() {
  const { code } = useParams<{ code: string }>();
  const [cefr, setCefr] = useState("B1");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [showCorrections, setShowCorrections] = useState(true);
  const [showTranslation, setShowTranslation] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns]);

  const send = async () => {
    if (!input.trim() || busy) return;
    const text = input.trim();
    setInput("");
    setTurns((t) => [...t, { role: "user", content: text }]);
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-language-partner", {
        body: { language_code: code, cefr_level: cefr, message: text, session_id: sessionId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data.session_id && !sessionId) setSessionId(data.session_id);
      setTurns((t) => [...t, { role: "assistant", content: data.reply, translation_en: data.translation_en }]);
      if (data.corrections?.length) setCorrections((c) => [...c, ...data.corrections]);
    } catch (e: any) {
      toast.error(e.message || "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto">
      <Card className="m-4 p-3 flex items-center gap-2">
        <div className="font-bold capitalize flex-1">Practice {code}</div>
        <select className="text-xs border rounded px-2 py-1 bg-background" value={cefr} onChange={(e) => setCefr(e.target.value)}>
          {["A1", "A2", "B1", "B2", "C1", "C2"].map((l) => <option key={l}>{l}</option>)}
        </select>
        <Button size="icon" variant="ghost" onClick={() => setShowTranslation((v) => !v)}>{showTranslation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
      </Card>

      <ScrollArea className="flex-1 px-4" ref={scrollRef as any}>
        <div className="space-y-3">
          {turns.map((t, i) => (
            <div key={i} className={`flex ${t.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`rounded-2xl px-3 py-2 max-w-[85%] text-sm ${t.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                <div>{t.content}</div>
                {showTranslation && t.translation_en && <div className="text-[11px] mt-1 opacity-70 italic">{t.translation_en}</div>}
              </div>
            </div>
          ))}
          {busy && <div className="flex justify-start"><div className="rounded-2xl px-3 py-2 bg-muted text-sm"><Loader2 className="h-4 w-4 animate-spin" /></div></div>}
        </div>
      </ScrollArea>

      {showCorrections && corrections.length > 0 && (
        <Card className="mx-4 mb-2 p-2 max-h-32 overflow-auto">
          <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1 flex items-center justify-between">
            Corrections <button onClick={() => setShowCorrections(false)}><EyeOff className="h-3 w-3" /></button>
          </div>
          {corrections.slice(-3).map((c, i) => (
            <div key={i} className="text-xs mb-1">
              <span className="line-through text-rose-600">{c.original}</span> → <span className="text-emerald-600">{c.corrected}</span>
              <div className="text-[10px] text-muted-foreground">{c.explanation}</div>
            </div>
          ))}
        </Card>
      )}

      <div className="p-3 border-t flex gap-2 sticky bottom-0 bg-background">
        <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Type in target language..." disabled={busy} />
        <Button onClick={send} disabled={busy || !input.trim()} size="icon"><Send className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

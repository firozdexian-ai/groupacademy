/**
 * Talent Outreach Console — Refactored for Phase Z0
 * CTO Version: May 2026
 * Fixes: B3 (Column Selects), B4 (Standardized Logging)
 */
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Send, RefreshCw, Sparkles, BrainCircuit, UserSearch, MessageSquareQuote, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface TalentRow {
  id: string;
  full_name: string;
  phone: string | null;
  display_profession: string;
}

interface Channel {
  id: string;
  agent_key: string;
  status: string;
  daily_outreach_cap: number;
  hourly_outreach_cap: number;
}

const TALENT_PRODUCTS = [
  { value: "welcome-ai", label: "Global Welcome AI" },
  { value: "digital-portfolio", label: "Digital Portfolio" },
  { value: "career-scorecard", label: "Career Scorecard" },
  { value: "course-catalog", label: "Course Catalog" },
];

export function TalentOutreachConsoleTab() {
  const [channel, setChannel] = useState<Channel | null>(null);
  const [talents, setTalents] = useState<TalentRow[]>([]);
  const [selectedTalent, setSelectedTalent] = useState<TalentRow | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);

  // Firoz - Logic to fetch canonical channel
  const loadChannel = async () => {
    const { data } = await supabase
      .from("messaging_channels")
      .select("id, agent_key, status, daily_outreach_cap, hourly_outreach_cap")
      .eq("agent_key", "talent-outreach")
      .maybeSingle();
    setChannel(data as Channel | null);
  };

  // B3 Fix: Select existing columns and join for professional name
  const loadTalents = useCallback(async () => {
    setLoading(true);
    try {
      let q = supabase
        .from("talents")
        .select(
          `
          id, 
          full_name, 
          phone, 
          custom_profession, 
          profession_categories(name)
        `,
        )
        .not("phone", "is", null)
        .order("created_at", { ascending: false })
        .limit(50);

      if (search.trim()) q = q.ilike("full_name", `%${search.trim()}%`);

      const { data, error } = await q;
      if (error) throw error;

      const formatted = (data ?? []).map((t: any) => ({
        id: t.id,
        full_name: t.full_name || "Unknown Talent",
        phone: t.phone,
        display_profession: t.custom_profession || t.profession_categories?.name || "Job Seeker",
      }));
      setTalents(formatted);
    } catch (err) {
      toast.error("Talent sync fault");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadChannel();
  }, []);
  useEffect(() => {
    loadTalents();
  }, [loadTalents]);

  const generateOutreach = async () => {
    if (!selectedTalent) return toast.error("Select target talent");
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-outreach-message", {
        body: {
          talent_id: selectedTalent.id,
          product_context: TALENT_PRODUCTS.find((p) => p.value === "digital-portfolio")?.label,
        },
      });
      if (error) throw error;
      setDraft(data?.message || "");
    } catch (e: any) {
      toast.error("Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  // B4 Fix: Standardize on outreach_messages table
  const handleSend = async () => {
    if (!selectedTalent || !draft.trim()) return;
    setSending(true);
    try {
      const { error } = await supabase.from("outreach_messages").insert({
        talent_id: selectedTalent.id,
        message_content: draft,
        channel: "whatsapp",
        product: "talent-outreach",
        notes: "Sent via Talent Outreach Console",
      });

      if (error) throw error;

      toast.success("Message logged to Outreach Terminal");
      setDraft("");
      setSelectedTalent(null);
    } catch (e: any) {
      toast.error("Dispatch failure");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-muted/10 p-6 rounded-[32px] border-2 border-border/40">
        <div className="text-left">
          <h2 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-2">
            <UserSearch className="h-6 w-6 text-primary" /> Outreach Console
          </h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
            Phase Z0 Native Dispatcher
          </p>
        </div>
        <Badge variant={channel?.status === "connected" ? "default" : "secondary"} className="h-8 px-4 rounded-xl">
          LINE: {channel?.status?.toUpperCase() || "OFFLINE"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6 h-[65vh]">
        <Card className="rounded-[32px] border-2 flex flex-col overflow-hidden">
          <CardHeader className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                placeholder="Search talent..."
                className="pl-8 h-9 text-xs rounded-lg"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-2 overflow-y-auto flex-1">
            {loading ? (
              <Loader2 className="animate-spin mx-auto mt-10" />
            ) : (
              talents.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTalent(t)}
                  className={cn(
                    "w-full text-left p-3 rounded-xl mb-1 transition-all",
                    selectedTalent?.id === t.id ? "bg-primary text-white" : "hover:bg-muted",
                  )}
                >
                  <p className="text-xs font-black uppercase truncate">{t.full_name}</p>
                  <p className="text-[10px] opacity-70 truncate">{t.display_profession}</p>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border-2 flex flex-col p-6 space-y-4 relative overflow-hidden">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black uppercase italic tracking-tighter">AI Composition</h3>
            <Button
              size="sm"
              variant="secondary"
              className="rounded-lg text-[10px] font-black uppercase"
              onClick={generateOutreach}
              disabled={generating || !selectedTalent}
            >
              {generating ? <Loader2 className="animate-spin h-3 w-3 mr-2" /> : <Sparkles className="h-3 w-3 mr-2" />}
              Propose Hook
            </Button>
          </div>

          <Textarea
            className="flex-1 rounded-2xl border-2 p-4 text-sm resize-none focus-visible:ring-primary/20"
            placeholder={
              selectedTalent ? `Drafting for ${selectedTalent.full_name}...` : "Select talent to begin dispatch."
            }
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />

          <div className="flex justify-end">
            <Button
              disabled={sending || !draft || !selectedTalent}
              onClick={handleSend}
              className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2"
            >
              {sending ? <Loader2 className="animate-spin h-4 w-4" /> : <Send className="h-4 w-4" />}
              Dispatch Outreach
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

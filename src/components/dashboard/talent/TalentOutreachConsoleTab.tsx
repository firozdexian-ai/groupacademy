import { useEffect, useState } from "react";
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
  profession: string | null;
  headline: string | null;
}

interface Channel {
  id: string;
  agent_key: string;
  status: string;
  phone_e164: string | null;
  daily_outreach_cap: number;
  hourly_outreach_cap: number;
}

interface CanSend {
  ok: boolean;
  daily_used?: number;
  daily_cap?: number;
  hourly_used?: number;
  hourly_cap?: number;
  is_quiet_hours?: boolean;
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

  const [product, setProduct] = useState("digital-portfolio");
  const [professionCat] = useState("Professional");
  const [senderName, setSenderName] = useState("Firoz — GroUp Academy");
  const [translateBangla, setTranslateBangla] = useState(false);
  const [draft, setDraft] = useState("");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [canSend, setCanSend] = useState<CanSend | null>(null);

  const loadChannel = async () => {
    const { data } = await supabase
      .from("messaging_channels")
      .select("id, agent_key, status, phone_e164, daily_outreach_cap, hourly_outreach_cap")
      .eq("agent_key", "talent-outreach")
      .maybeSingle();
    setChannel(data as Channel | null);
  };

  const loadTalents = async () => {
    setLoading(true);
    let q = supabase
      .from("talents")
      .select("id, full_name, phone, profession, headline")
      .not("phone", "is", null)
      .order("created_at", { ascending: false })
      .limit(100);
    if (search.trim()) q = q.ilike("full_name", `%${search.trim()}%`);
    const { data } = await q;
    const formatted = (data ?? []).map((t: any) => ({
      id: t.id,
      full_name: t.full_name || "Unknown Talent",
      phone: t.phone,
      profession: t.profession || t.headline || "Job Seeker",
      headline: t.headline,
    }));
    setTalents(formatted);
    setLoading(false);
  };

  useEffect(() => {
    loadChannel();
  }, []);
  useEffect(() => {
    loadTalents();
  }, [search]);

  const refreshGuard = async () => {
    if (!channel?.id) return;
    const { data } = await supabase.rpc("outreach_can_send", {
      p_channel_id: channel.id,
      p_contact_id: null,
    });
    setCanSend(data as any);
  };
  useEffect(() => {
    refreshGuard();
  }, [channel, selectedTalent]);

  const generateFallback = async () => {
    if (!selectedTalent) return toast.error("Pick a talent first");
    setGenerating(true);
    try {
      const parsedCV = {
        full_name: selectedTalent.full_name,
        designation: selectedTalent.profession,
        company: "Independent",
      };
      const { data, error } = await supabase.functions.invoke("generate-outreach-message", {
        body: {
          parsedCV,
          product,
          professionCategory: professionCat,
          senderName,
          language: translateBangla ? "bangla" : "english",
        },
      });
      if (error) throw error;
      setDraft(data?.message || data?.text || "");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const generateHooks = async () => {
    if (!selectedTalent) return toast.error("Pick a talent first");
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-outreach-suggest", {
        body: { contact_id: selectedTalent.id, channel_kind: "talent" },
      });
      if (error) throw error;
      const topHook = data?.suggestions?.[0]?.message || data?.text || "";
      setDraft(topHook);
      toast.success("AI Workforce has generated talent-specific hooks.");
    } catch {
      toast.error("Falling back to standard generator...");
      generateFallback();
    } finally {
      setGenerating(false);
    }
  };

  const send = async () => {
    if (!selectedTalent || !channel?.id || !draft.trim()) return;
    setSending(true);
    try {
      const { data: existing } = await supabase
        .from("messaging_conversations")
        .select("id, external_chat_id")
        .eq("channel_id", channel.id)
        .eq("peer_handle", selectedTalent.phone!)
        .maybeSingle();

      let conversationId = existing?.id as string | undefined;
      if (!conversationId) {
        const { data: created, error: cErr } = await supabase
          .from("messaging_conversations")
          .insert({
            channel_id: channel.id,
            external_chat_id: selectedTalent.phone,
            peer_handle: selectedTalent.phone,
            peer_display_name: selectedTalent.full_name,
            is_group: false,
          })
          .select("id")
          .single();
        if (cErr) throw cErr;
        conversationId = created.id;
      }

      const { error } = await supabase.functions.invoke("messaging-send", {
        body: { conversation_id: conversationId, text: draft.trim() },
      });
      if (error) throw error;

      toast.success("Talent Outreach sent successfully.");
      setDraft("");
      refreshGuard();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-primary">
            <UserSearch className="h-8 w-8" />
            <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Outreach Console</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Deploying the AI Workforce to B2C Learners
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <Badge
            variant={channel?.status === "connected" ? "default" : "secondary"}
            className={cn(
              "px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl",
              channel?.status === "connected" ? "bg-primary text-primary-foreground" : "",
            )}
          >
            TALENT LINE: {channel?.status?.toUpperCase() || "OFFLINE"}
          </Badge>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="text-[9px] uppercase tracking-widest border-2 bg-background/50 backdrop-blur"
            >
              Daily: {canSend?.daily_used ?? 0}/{channel?.daily_outreach_cap ?? 20}
            </Badge>
            <Badge
              variant="outline"
              className="text-[9px] uppercase tracking-widest border-2 bg-background/50 backdrop-blur"
            >
              Hourly: {canSend?.hourly_used ?? 0}/{channel?.hourly_outreach_cap ?? 6}
            </Badge>
            {canSend?.is_quiet_hours && (
              <Badge
                variant="secondary"
                className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-[9px] uppercase tracking-widest"
              >
                Quiet Hours Active
              </Badge>
            )}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6">
        {/* Talent Queue Sidebar */}
        <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-lg flex flex-col h-[70vh] overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-blue-400 to-indigo-500" />
          <CardHeader className="p-5 border-b border-border/10 bg-muted/5">
            <div className="flex items-center justify-between mb-3">
              <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <UserSearch className="h-4 w-4 text-primary" /> Talent Pool
              </CardTitle>
              <Button
                size="icon"
                variant="ghost"
                onClick={loadTalents}
                className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 rounded-xl border-2 text-xs"
              />
            </div>
          </CardHeader>
          <CardContent className="p-2 flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/50" />
              </div>
            ) : talents.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                  No talents found
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {talents.map((t) => {
                  const isSelected = selectedTalent?.id === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTalent(t)}
                      className={cn(
                        "w-full text-left p-4 rounded-2xl transition-all border-2",
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                          : "bg-transparent border-transparent hover:bg-muted/50 hover:border-border/30",
                      )}
                    >
                      <div
                        className={cn(
                          "text-sm font-bold truncate",
                          isSelected ? "text-primary-foreground" : "text-foreground",
                        )}
                      >
                        {t.full_name}
                      </div>
                      <div
                        className={cn(
                          "text-[10px] uppercase tracking-wider truncate mt-1",
                          isSelected ? "text-primary-foreground/80 font-medium" : "text-muted-foreground",
                        )}
                      >
                        {t.profession}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Composer Main Area */}
        <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-lg flex flex-col h-[70vh] overflow-hidden relative">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full blur-3xl opacity-10 bg-primary pointer-events-none" />
          <div className="h-1.5 w-full bg-gradient-to-r from-primary to-purple-500 z-10" />

          <CardHeader className="p-6 border-b border-border/10 bg-muted/5 z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="text-lg font-black italic tracking-tight flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-primary" /> AI Strategy & Composition
              </CardTitle>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-xl border border-border/50">
                  <Switch checked={translateBangla} onCheckedChange={setTranslateBangla} />
                  <Label className="text-[10px] font-black uppercase tracking-widest cursor-pointer">Bangla Mode</Label>
                </div>
                <Button
                  onClick={generateHooks}
                  disabled={generating || !selectedTalent}
                  variant="secondary"
                  className="rounded-xl h-10 px-5 font-bold uppercase tracking-wider text-[10px]"
                >
                  {generating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2 text-primary" />
                  )}
                  Propose Hooks
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 flex-1 flex flex-col gap-6 z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Target Product
                </Label>
                <Select value={product} onValueChange={setProduct}>
                  <SelectTrigger className="h-12 rounded-xl border-2 font-medium text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TALENT_PRODUCTS.map((p) => (
                      <SelectItem key={p.value} value={p.value} className="text-xs">
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Sender Persona
                </Label>
                <Input
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="h-12 rounded-xl border-2 font-medium text-xs"
                />
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-2 relative">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <MessageSquareQuote className="h-3 w-3" /> Draft Message
              </Label>
              <Textarea
                placeholder={
                  selectedTalent ? `Write a message to ${selectedTalent.full_name}...` : "Select a talent to begin..."
                }
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                disabled={!selectedTalent}
                className="flex-1 rounded-2xl resize-none border-2 p-4 text-sm leading-relaxed focus-visible:ring-1"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] font-mono text-muted-foreground/70 uppercase tracking-widest">
                {draft.length} chars
              </span>
              <Button
                onClick={send}
                disabled={sending || !draft.trim() || !selectedTalent}
                className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
              >
                {sending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" /> Dispatch to Talent
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

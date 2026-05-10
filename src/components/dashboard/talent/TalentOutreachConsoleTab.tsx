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
import { Loader2, Send, RefreshCw, Sparkles, BrainCircuit } from "lucide-react";

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
  is_quiet_hours?: boolean; // Updated to match Phase 6.1 SQL telemetry
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
    <div className="p-4 space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold">Talent Outreach Console</h2>
          <p className="text-sm text-muted-foreground">Deploying the AI Workforce to B2C Learners and Candidates.</p>
        </div>
        <Badge variant={channel?.status === "connected" ? "default" : "secondary"}>
          TALENT LINE: {channel?.status?.toUpperCase() || "OFFLINE"}
        </Badge>
      </div>

      <Card>
        <CardContent className="py-3 flex flex-wrap gap-3 text-xs">
          <Badge variant="outline">
            Daily: {canSend?.daily_used ?? 0}/{channel?.daily_outreach_cap ?? 20}
          </Badge>
          <Badge variant="outline">
            Hourly: {canSend?.hourly_used ?? 0}/{channel?.hourly_outreach_cap ?? 6}
          </Badge>
          {canSend?.is_quiet_hours && (
            <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700 border-yellow-500/50">
              Quiet Hours (Soft Warning)
            </Badge>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Talent Pool Queue</CardTitle>
              <Button size="icon" variant="ghost" onClick={loadTalents}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <Input
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-xs"
            />
          </CardHeader>
          <CardContent className="p-0 max-h-[480px] overflow-y-auto">
            {loading ? (
              <div className="p-6 flex justify-center">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              talents.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTalent(t)}
                  className={`p-3 border-b cursor-pointer transition-colors ${
                    selectedTalent?.id === t.id ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-muted/30"
                  }`}
                >
                  <div className="text-sm font-medium">{t.full_name}</div>
                  <div className="text-xs text-muted-foreground">{t.profession}</div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BrainCircuit className="h-4 w-4" /> AI Strategy & Composition
                </CardTitle>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch checked={translateBangla} onCheckedChange={setTranslateBangla} />
                    <Label className="text-xs">Bangla Mode</Label>
                  </div>
                  <Button size="sm" onClick={generateHooks} disabled={generating}>
                    {generating ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Propose Best Hooks
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Target Product</Label>
                  <Select value={product} onValueChange={setProduct}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TALENT_PRODUCTS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Sender Persona</Label>
                  <Input value={senderName} onChange={(e) => setSenderName(e.target.value)} className="h-8 text-xs" />
                </div>
              </div>

              <Textarea
                rows={8}
                placeholder="Draft message to talent..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-muted-foreground">{draft.length} characters</span>
                <Button onClick={send} disabled={sending || !draft.trim()} className="px-8 shadow-lg shadow-primary/20">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                  Send to Talent
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

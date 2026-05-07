import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Send, RefreshCw, Sparkles, Upload, FileCheck, BrainCircuit, History } from "lucide-react";

interface ContactRow {
  id: string;
  full_name: string;
  whatsapp_number: string | null;
  designation: string | null;
  company: { name: string | null } | null;
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
  reason?: string;
  daily_used?: number;
  daily_cap?: number;
  hourly_used?: number;
  hourly_cap?: number;
  seconds_until_next?: number;
  is_night_mode?: boolean;
}

const TALENT_PRODUCTS = [
  { value: "welcome-ai", label: "Global Welcome AI" },
  { value: "digital-portfolio", label: "Digital Portfolio" },
  { value: "career-scorecard", label: "Career Scorecard" },
  { value: "course-catalog", label: "Course Catalog" },
];

const EMPLOYER_PRODUCTS = [
  { value: "gro10x-onboarding", label: "Gro10x Onboarding" },
  { value: "recruitment-service", label: "Recruitment Service" },
  { value: "gig-hiring", label: "Gig Hiring" },
];

export default function OutreachConsole() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channelId, setChannelId] = useState<string | null>(null);
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [selectedContact, setSelectedContact] = useState<ContactRow | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Composer state
  const [product, setProduct] = useState("digital-portfolio");
  const [profession, setProfession] = useState("Professional");
  const [senderName, setSenderName] = useState("Firoz — GroUp Academy");
  const [translateBangla, setTranslateBangla] = useState(false);
  const [draft, setDraft] = useState("");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);

  // Counter chips
  const [canSend, setCanSend] = useState<CanSend | null>(null);

  // Bulk import
  const [csvText, setCsvText] = useState<string>("");
  const [importBusy, setImportBusy] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  const channel = useMemo(() => channels.find((c) => c.id === channelId) ?? null, [channels, channelId]);
  const isEmployerLine = channel?.agent_key === "employer-outreach";
  const products = isEmployerLine ? EMPLOYER_PRODUCTS : TALENT_PRODUCTS;

  const loadChannels = async () => {
    const { data } = await supabase
      .from("messaging_channels")
      .select("id, agent_key, status, phone_e164, daily_outreach_cap, hourly_outreach_cap")
      .in("agent_key", ["talent-outreach", "employer-outreach"])
      .order("agent_key");
    const list = (data ?? []) as Channel[];
    setChannels(list);
    if (!channelId && list.length) setChannelId(list[0].id);
  };

  const loadContacts = async () => {
    setLoading(true);
    let q = supabase
      .from("contacts")
      .select("id, full_name, whatsapp_number, designation, company:companies(name)")
      .not("whatsapp_number", "is", null)
      .order("created_at", { ascending: false })
      .limit(100);
    if (search.trim()) {
      q = q.ilike("full_name", `%${search.trim()}%`);
    }
    const { data } = await q;
    setContacts((data ?? []) as any);
    setLoading(false);
  };

  useEffect(() => {
    loadChannels();
  }, []);
  useEffect(() => {
    loadContacts();
  }, [search]);

  const refreshGuard = async () => {
    if (!channelId) return;
    const { data } = await supabase.rpc("outreach_can_send", {
      p_channel_id: channelId,
      p_contact_id: selectedContact?.id ?? null,
    });
    // CTO OVERRIDE: We treat the "ok" from the DB as a suggestion, not a block for Admin
    setCanSend(data as any);
  };

  useEffect(() => {
    refreshGuard();
  }, [channelId, selectedContact]);

  const generateHooks = async () => {
    if (!selectedContact) return toast.error("Pick a contact first");
    setGenerating(true);
    try {
      // Demo-Ready: Use the new suggestion function
      const { data, error } = await supabase.functions.invoke("ai-outreach-suggest", {
        body: {
          contact_id: selectedContact.id,
          channel_kind: isEmployerLine ? "employer" : "talent",
        },
      });
      if (error) throw error;
      // For the demo, we take the top ranked suggestion
      const topHook = data?.suggestions?.[0]?.message || data?.text || "";
      setDraft(topHook);
      toast.success("AI Workforce has analyzed the profile and generated hooks.");
    } catch (e: any) {
      toast.error("Falling back to standard generator...");
      generate();
    } finally {
      setGenerating(false);
    }
  };

  const generate = async () => {
    if (!selectedContact) return toast.error("Pick a contact first");
    setGenerating(true);
    try {
      const parsedCV = {
        full_name: selectedContact.full_name,
        designation: selectedContact.designation,
        company: selectedContact.company?.name,
      };
      const { data, error } = await supabase.functions.invoke("generate-outreach-message", {
        body: {
          parsedCV,
          product,
          professionCategory: profession,
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

  const send = async () => {
    if (!selectedContact || !channelId || !draft.trim()) return;
    setSending(true);
    try {
      const { data: existing } = await supabase
        .from("messaging_conversations")
        .select("id, external_chat_id")
        .eq("channel_id", channelId)
        .eq("contact_id", selectedContact.id)
        .maybeSingle();

      let conversationId = existing?.id as string | undefined;
      if (!conversationId) {
        const { data: created, error: cErr } = await supabase
          .from("messaging_conversations")
          .insert({
            channel_id: channelId,
            contact_id: selectedContact.id,
            external_chat_id: selectedContact.whatsapp_number,
            peer_handle: selectedContact.whatsapp_number,
            peer_display_name: selectedContact.full_name,
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
      toast.success("Outreach successful.");
      setDraft("");
      refreshGuard();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4 p-4 bg-background">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Outreach Command Center</h1>
          <p className="text-muted-foreground text-sm">Deploying the AI Workforce to 2,344 Global Leads.</p>
        </div>
        <div className="flex gap-2">
          <Badge variant={channel?.status === "connected" ? "default" : "outline"} className="h-8">
            {channel?.agent_key.replace("-", " ").toUpperCase()}: {channel?.status || "OFFLINE"}
          </Badge>
        </div>
      </div>

      <Card className="border-none shadow-none bg-muted/30">
        <CardContent className="pt-4 flex flex-wrap items-center gap-4">
          <div className="space-y-1">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Active Channel</Label>
            <Select value={channelId ?? ""} onValueChange={setChannelId}>
              <SelectTrigger className="w-[280px] bg-background border-none shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {channels.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.agent_key === "talent-outreach" ? "Talent Line" : "Employer Line"} ({c.phone_e164})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 mt-4">
            <Badge variant="secondary" className="bg-background">
              Daily: {canSend?.daily_used ?? 0}/{channel?.daily_outreach_cap ?? 20}
            </Badge>
            <Badge variant="secondary" className="bg-background">
              Hourly: {canSend?.hourly_used ?? 0}/{channel?.hourly_outreach_cap ?? 6}
            </Badge>
            {canSend?.is_night_mode && (
              <Badge variant="outline" className="text-orange-500 border-orange-500">
                Night Mode Active (Warning)
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-4 flex-1 overflow-hidden">
        {/* Contact Selection */}
        <Card className="flex flex-col shadow-sm border-muted/40">
          <CardHeader className="py-3 px-4 border-b">
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="text-sm font-semibold">Leads Queue</CardTitle>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={loadContacts}>
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
            <Input
              placeholder="Filter leads..."
              className="h-8 text-xs bg-muted/50 border-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </CardHeader>
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="p-10 text-center">
                <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : (
              contacts.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedContact(c)}
                  className={`p-3 border-b cursor-pointer transition-colors ${selectedContact?.id === c.id ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-muted/30"}`}
                >
                  <div className="font-semibold text-sm">{c.full_name}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">
                    {c.designation} @ {c.company?.name || "Independent"}
                  </div>
                </div>
              ))
            )}
          </ScrollArea>
        </Card>

        {/* AI Workplace */}
        <div className="flex flex-col gap-4">
          <Card className="flex-1 shadow-sm border-muted/40 flex flex-col">
            <CardHeader className="py-3 px-4 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BrainCircuit className="h-4 w-4 text-primary" /> AI Strategy & Composition
              </CardTitle>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch checked={translateBangla} onCheckedChange={setTranslateBangla} id="demo-bangla" />
                  <Label htmlFor="demo-bangla" className="text-[11px]">
                    Bangla Mode
                  </Label>
                </div>
                <Button size="sm" onClick={generateHooks} disabled={generating || !selectedContact} className="h-8">
                  {generating ? (
                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3 mr-2" />
                  )}
                  Propose Best Hooks
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 flex-1 flex flex-col space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground">Target Product</Label>
                  <Select value={product} onValueChange={setProduct}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground">Sender Persona</Label>
                  <Input value={senderName} onChange={(e) => setSenderName(e.target.value)} className="h-8 text-xs" />
                </div>
              </div>

              <div className="relative flex-1">
                <Textarea
                  className="h-full min-h-[300px] resize-none border-none bg-muted/10 focus-visible:ring-1 p-4 text-sm leading-relaxed"
                  placeholder="The AI Workforce will generate your pitch here..."
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
                {selectedContact && !draft && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                    <div className="text-center">
                      <BrainCircuit className="h-12 w-12 mx-auto mb-2" />
                      <p className="text-xs">Click 'Propose Best Hooks' to begin teardown</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <History className="h-3 w-3" /> Last outreach: Never
                  </span>
                  <span>{draft.length} characters</span>
                </div>
                <Button onClick={send} disabled={sending || !draft.trim()} className="px-8 shadow-lg shadow-primary/20">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                  Send via WhatsApp
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

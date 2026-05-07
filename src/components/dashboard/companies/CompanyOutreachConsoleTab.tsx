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
  daily_used?: number;
  daily_cap?: number;
  hourly_used?: number;
  hourly_cap?: number;
  is_night_mode?: boolean;
}

const EMPLOYER_PRODUCTS = [
  { value: "gro10x-onboarding", label: "Gro10x Onboarding" },
  { value: "recruitment-service", label: "Recruitment Service" },
  { value: "gig-hiring", label: "Gig Hiring" },
];

export function CompanyOutreachConsoleTab() {
  const [channel, setChannel] = useState<Channel | null>(null);
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [selectedContact, setSelectedContact] = useState<ContactRow | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [product, setProduct] = useState("gro10x-onboarding");
  const [profession] = useState("Professional");
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
      .eq("agent_key", "employer-outreach")
      .maybeSingle();
    setChannel(data as Channel | null);
  };

  const loadContacts = async () => {
    setLoading(true);
    let q = supabase
      .from("contacts")
      .select("id, full_name, whatsapp_number, designation, company:companies(name)")
      .not("whatsapp_number", "is", null)
      .not("company_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(100);
    if (search.trim()) q = q.ilike("full_name", `%${search.trim()}%`);
    const { data } = await q;
    setContacts((data ?? []) as any);
    setLoading(false);
  };

  useEffect(() => { loadChannel(); }, []);
  useEffect(() => { loadContacts(); }, [search]);

  const refreshGuard = async () => {
    if (!channel?.id) return;
    const { data } = await supabase.rpc("outreach_can_send", {
      p_channel_id: channel.id,
      p_contact_id: selectedContact?.id ?? null,
    });
    setCanSend(data as any);
  };
  useEffect(() => { refreshGuard(); }, [channel, selectedContact]);

  const generateFallback = async () => {
    if (!selectedContact) return toast.error("Pick an employer first");
    setGenerating(true);
    try {
      const parsedCV = {
        full_name: selectedContact.full_name,
        designation: selectedContact.designation,
        company: selectedContact.company?.name,
      };
      const { data, error } = await supabase.functions.invoke("generate-outreach-message", {
        body: { parsedCV, product, professionCategory: profession, senderName, language: translateBangla ? "bangla" : "english" },
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
    if (!selectedContact) return toast.error("Pick an employer first");
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-outreach-suggest", {
        body: { contact_id: selectedContact.id, channel_kind: "employer" },
      });
      if (error) throw error;
      const topHook = data?.suggestions?.[0]?.message || data?.text || "";
      setDraft(topHook);
      toast.success("AI Workforce has generated B2B hooks.");
    } catch {
      toast.error("Falling back to standard generator...");
      generateFallback();
    } finally {
      setGenerating(false);
    }
  };

  const send = async () => {
    if (!selectedContact || !channel?.id || !draft.trim()) return;
    setSending(true);
    try {
      const { data: existing } = await supabase
        .from("messaging_conversations")
        .select("id, external_chat_id")
        .eq("channel_id", channel.id)
        .eq("contact_id", selectedContact.id)
        .maybeSingle();

      let conversationId = existing?.id as string | undefined;
      if (!conversationId) {
        const { data: created, error: cErr } = await supabase
          .from("messaging_conversations")
          .insert({
            channel_id: channel.id,
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

      toast.success("B2B Outreach sent successfully.");
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
          <h2 className="text-xl font-semibold">Employer Outreach Console</h2>
          <p className="text-sm text-muted-foreground">Deploying the AI Workforce to B2B Contacts and Partners.</p>
        </div>
        <Badge variant={channel?.status === "connected" ? "default" : "secondary"}>
          EMPLOYER LINE: {channel?.status?.toUpperCase() || "OFFLINE"}
        </Badge>
      </div>

      <Card>
        <CardContent className="py-3 flex flex-wrap gap-3 text-xs">
          <Badge variant="outline">Daily: {canSend?.daily_used ?? 0}/{channel?.daily_outreach_cap ?? 20}</Badge>
          <Badge variant="outline">Hourly: {canSend?.hourly_used ?? 0}/{channel?.hourly_outreach_cap ?? 6}</Badge>
          {canSend?.is_night_mode && <Badge variant="destructive">Night Mode Active</Badge>}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">B2B Leads Queue</CardTitle>
              <Button size="icon" variant="ghost" onClick={loadContacts}>
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
              <div className="p-6 flex justify-center"><Loader2 className="h-4 w-4 animate-spin" /></div>
            ) : (
              contacts.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedContact(c)}
                  className={`p-3 border-b cursor-pointer transition-colors ${
                    selectedContact?.id === c.id ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-muted/30"
                  }`}
                >
                  <div className="text-sm font-medium">{c.full_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.designation} @ {c.company?.name || "Independent"}
                  </div>
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
                    {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                    Propose B2B Hooks
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Target Product</Label>
                  <Select value={product} onValueChange={setProduct}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EMPLOYER_PRODUCTS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
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
                placeholder="Draft message to employer..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-muted-foreground">{draft.length} characters</span>
                <Button onClick={send} disabled={sending || !draft.trim()} className="px-8 shadow-lg shadow-primary/20">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                  Send to Employer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

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
import { Loader2, Send, RefreshCw, Sparkles, Upload, FileCheck } from "lucide-react";

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
  min_gap_seconds: number;
  quiet_hours_start: number;
  quiet_hours_end: number;
  quiet_hours_tz: string;
}

interface CanSend {
  ok: boolean;
  reason?: string;
  daily_used?: number;
  daily_cap?: number;
  hourly_used?: number;
  hourly_cap?: number;
  seconds_until_next?: number;
  local_hour?: number;
}

const PRODUCTS = [
  { value: "digital-portfolio", label: "Digital Portfolio (FREE)" },
  { value: "ai-efficiency", label: "AI Efficiency Accelerator" },
  { value: "career-scorecard", label: "Career Readiness Scorecard" },
  { value: "mock-interview", label: "AI Mock Interview" },
  { value: "salary-analysis", label: "AI Salary Analysis" },
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
  const [senderName, setSenderName] = useState("Aisha — GroUp Academy");
  const [translateBangla, setTranslateBangla] = useState(true);
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

  const loadChannels = async () => {
    const { data } = await supabase
      .from("messaging_channels")
      .select("*")
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

  useEffect(() => { loadChannels(); }, []);
  useEffect(() => { loadContacts(); }, [search]);

  const refreshGuard = async () => {
    if (!channelId) return;
    const { data } = await supabase.rpc("outreach_can_send", {
      p_channel_id: channelId,
      p_contact_id: selectedContact?.id ?? null,
    });
    setCanSend(data as any);
  };

  useEffect(() => { refreshGuard(); }, [channelId, selectedContact]);

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
    if (!canSend?.ok) return toast.error(`Blocked: ${canSend?.reason || "guardrail"}`);
    setSending(true);
    try {
      // Lookup or create conversation for this contact + channel
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
            external_chat_id: selectedContact.whatsapp_number, // Unipile uses phone as chat_id for new chats
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
      toast.success("Sent");
      setDraft("");
      refreshGuard();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  const onFile = async (f: File | null) => {
    if (!f) return;
    const text = await f.text();
    setCsvText(text);
    setImportResult(null);
  };

  const runImport = async (dryRun: boolean) => {
    if (!csvText) return toast.error("Choose a CSV first");
    setImportBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("import-employer-contacts", {
        body: { csv: csvText, dry_run: dryRun, source: "employer_import_2026_05" },
      });
      if (error) throw error;
      setImportResult(data);
      if (data?.error) toast.error(data.error);
      else toast.success(dryRun ? "Dry run complete" : "Import committed");
      if (!dryRun) loadContacts();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setImportBusy(false);
    }
  };

  return (
    <div className="space-y-3 p-3">
      {/* Top bar: channel + bulk import */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Send via</Label>
              <Select value={channelId ?? ""} onValueChange={setChannelId}>
                <SelectTrigger className="w-[260px]"><SelectValue placeholder="Select channel" /></SelectTrigger>
                <SelectContent>
                  {channels.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.agent_key} · {c.phone_e164 || "—"} · {c.status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Counter chips */}
            <div className="flex flex-wrap gap-2">
              <Badge variant={canSend?.ok ? "default" : "destructive"}>
                {canSend?.ok ? "OK to send" : `Blocked: ${canSend?.reason ?? "—"}`}
              </Badge>
              <Badge variant="secondary">
                Daily {canSend?.daily_used ?? 0}/{channel?.daily_outreach_cap ?? 20}
              </Badge>
              <Badge variant="secondary">
                Hourly {canSend?.hourly_used ?? 0}/{channel?.hourly_outreach_cap ?? 6}
              </Badge>
              {typeof canSend?.seconds_until_next === "number" && canSend.seconds_until_next > 0 && (
                <Badge variant="outline">Next in {canSend.seconds_until_next}s</Badge>
              )}
              {channel && (
                <Badge variant="outline">
                  Quiet {channel.quiet_hours_start}–{channel.quiet_hours_end} {channel.quiet_hours_tz}
                </Badge>
              )}
              <Button size="sm" variant="ghost" onClick={refreshGuard}>
                <RefreshCw className="h-3 w-3 mr-1" /> Refresh
              </Button>
            </div>
          </div>

          {/* Bulk import panel */}
          <div className="border rounded-md p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Upload className="h-4 w-4" /> Bulk Import (Google Contacts CSV)
              </Label>
              <input type="file" accept=".csv" onChange={(e) => onFile(e.target.files?.[0] ?? null)} className="text-xs" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={!csvText || importBusy} onClick={() => runImport(true)}>
                {importBusy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FileCheck className="h-4 w-4 mr-1" />}
                Dry run
              </Button>
              <Button size="sm" disabled={!csvText || importBusy || !importResult || importResult?.dry_run !== true} onClick={() => runImport(false)}>
                Commit import
              </Button>
            </div>
            {importResult && (
              <pre className="text-[11px] bg-muted/40 rounded p-2 overflow-auto max-h-48">
                {JSON.stringify(importResult, null, 2)}
              </pre>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-3">
        {/* Left: contact queue */}
        <Card className="flex flex-col h-[600px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Contact Queue</CardTitle>
            <Input placeholder="Search by name…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-full">
              {loading ? (
                <div className="p-6 text-center"><Loader2 className="h-4 w-4 animate-spin inline" /></div>
              ) : contacts.length === 0 ? (
                <p className="p-4 text-xs text-muted-foreground text-center">No contacts. Run a bulk import above.</p>
              ) : (
                contacts.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedContact(c)}
                    className={`w-full text-left p-3 border-b hover:bg-muted/50 ${selectedContact?.id === c.id ? "bg-muted" : ""}`}
                  >
                    <div className="font-medium text-sm truncate">{c.full_name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {c.designation || "—"} · {c.company?.name || "—"}
                    </div>
                    <div className="text-[11px] text-muted-foreground">{c.whatsapp_number}</div>
                  </button>
                ))
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Right: composer */}
        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> AI Composer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">Product</Label>
                <Select value={product} onValueChange={setProduct}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRODUCTS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Profession category</Label>
                <Input value={profession} onChange={(e) => setProfession(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Sender name</Label>
                <Input value={senderName} onChange={(e) => setSenderName(e.target.value)} />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Switch checked={translateBangla} onCheckedChange={setTranslateBangla} id="bangla" />
                <Label htmlFor="bangla" className="text-xs">Translate to Bangla</Label>
              </div>
              <Button size="sm" variant="outline" onClick={generate} disabled={generating || !selectedContact}>
                {generating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
                Generate
              </Button>
            </div>

            <div>
              <Label className="text-xs">
                Draft <span className="text-muted-foreground">({draft.length} chars)</span>
              </Label>
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={8}
                placeholder={selectedContact ? "Click Generate, then edit before sending…" : "Select a contact from the queue."}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                {selectedContact ? <>Sending to <strong>{selectedContact.full_name}</strong> ({selectedContact.whatsapp_number})</> : "No contact selected"}
              </div>
              <Button onClick={send} disabled={sending || !draft.trim() || !canSend?.ok}>
                {sending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
                Send WhatsApp
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

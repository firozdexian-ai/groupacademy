import { useState, useEffect, useCallback } from "react";
import {
  listPromotableContent,
  listOutreachableTalents,
  listCourseOutreachRecords,
  logCourseOutreach,
  listContentShareLogs,
  insertContentShareLog,
} from "@/domains/marketing/repo/marketingRepo";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getOutreachWhatsAppLink, getFirstName } from "@/lib/outreachTemplates";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Share2,
  Linkedin,
  Facebook,
  MessageCircle,
  Send,
  CheckCircle2,
  Link as LinkIcon,
  Copy,
  Check,
  Users,
  RefreshCw,
  Filter,
  ShieldCheck,
  Zap,
  Globe,
  Terminal,
  ExternalLink,
  Calendar,
} from "lucide-react";

/**
 * Platform Logic: Market Penetration Terminal (Content Outreach)
 * 2026 Standard: Blended Phase 6 UI (Registry Ledger + Distribution Engine)
 */

interface Content {
  id: string;
  title: string;
  slug: string;
  content_type: string;
  current_enrollment: number;
  is_published: boolean;
  description?: string;
}

interface Talent {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  profession_category_id: string | null;
  country: string | null;
}

interface OutreachRecord {
  talent_id: string;
  course_id: string | null;
}

interface ShareLog {
  channel: string;
  shared_at: string;
}

export function ContentOutreachTab() {
  const [contents, setContents] = useState<Content[]>([]);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [talents, setTalents] = useState<Talent[]>([]);
  const [outreachRecords, setOutreachRecords] = useState<OutreachRecord[]>([]);
  const [shareLogs, setShareLogs] = useState<ShareLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"not_enrolled" | "not_pitched" | "all">("not_pitched");
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("linkedin");
  const [customChannel, setCustomChannel] = useState("");

  const loadContents = useCallback(async () => {
    try {
      const data = await listPromotableContent();
      setContents(data as any);
    } catch (err) {
      console.error("Registry Fault:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContents();
  }, [loadContents]);

  const loadTalents = useCallback(async () => {
    if (!selectedContent) return;
    setIsLoading(true);
    try {
      const talentData = await listOutreachableTalents();
      const outreachData = await listCourseOutreachRecords(selectedContent.id);
      setOutreachRecords(outreachData || []);
      let filteredTalents = (talentData as any[]) || [];
      if (filterType === "not_pitched") {
        const pitchedTalentIds = new Set((outreachData || []).map((r: any) => r.talent_id));
        filteredTalents = filteredTalents.filter((t) => !pitchedTalentIds.has(t.id));
      }
      setTalents(filteredTalents);
    } catch (err) {
      console.error("Talent Registry Fault:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedContent, filterType]);

  const loadShareLogs = async () => {
    if (!selectedContent) return;
    const data = await listContentShareLogs(selectedContent.id);
    setShareLogs((data as any) || []);
  };

  useEffect(() => {
    if (selectedContent) {
      loadTalents();
      if (isShareOpen) loadShareLogs();
    }
  }, [selectedContent, loadTalents, isShareOpen]);

  const handleSendOutreach = async (talent: Talent) => {
    if (!talent.phone || !selectedContent) return;
    setIsSending(talent.id);

    try {
      await logCourseOutreach({
        talentId: talent.id,
        courseId: selectedContent.id,
        messageContent: `Course pitch: ${selectedContent.title}`,
      });

      const firstName = getFirstName(talent.full_name);
      const whatsappUrl = getOutreachWhatsAppLink(talent.phone, "course", firstName, selectedContent.title);
      window.open(whatsappUrl, "_blank");

      setOutreachRecords((prev) => [...prev, { talent_id: talent.id, course_id: selectedContent.id }]);
      toast.success(`Handshake Synchronized: ${talent.full_name}`);
    } catch (err) {
      toast.error("Handshake Failed: Registry rejection");
    } finally {
      setIsSending(null);
    }
  };

  const isPitched = (talentId: string) =>
    outreachRecords.some((r) => r.talent_id === talentId && r.course_id === selectedContent?.id);

  const recordShare = async (channel: string) => {
    if (!selectedContent) return;
    setShareLogs((prev) => [...prev, { channel, shared_at: new Date().toISOString() }]);
    try {
      await insertContentShareLog({ contentId: selectedContent.id, channel });
      toast.success(`Protocol Logged: Shared via ${channel}`);
    } catch {
      setShareLogs((prev) => prev.filter((l) => l.channel !== channel));
      toast.error("Log Fault: Distribution update failed");
    }
  };

  const isShared = (channel: string) => shareLogs.some((log) => log.channel === channel);

  const getShareLink = (source: string) => {
    if (!selectedContent) return "";
    return `${window.location.origin}/courses/${selectedContent.slug}?source=${source}`;
  };

  const copyLink = async (source: string) => {
    const link = getShareLink(source);
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Artifact Link Synced to Clipboard");
    } catch {}
  };

  const copyTemplate = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Payload Caption Synced");
    } catch {}
  };

  const contentTypeLabel = (type: string) =>
    ({ recorded_course: "COURSE", batch_class: "BATCH", live_webinar: "WEBINAR" })[type] || type;

  const templates = selectedContent
    ? {
        english: `🚀 Career Uplink: ${selectedContent.title}\n📚 Logic: ${contentTypeLabel(selectedContent.content_type)}\n🔥 Sync here: ${getShareLink(activeTab)}\n\n#intel #growth`,
        bangla: `📢 নতুন সুযোগ: ${selectedContent.title}\n📚 ধরণ: ${contentTypeLabel(selectedContent.content_type)}\n🔗 লিংক: ${getShareLink(activeTab)}\n\n#bdjobs #learning`,
      }
    : { english: "", bangla: "" };

  const handleSocialShare = (platform: "linkedin" | "facebook" | "whatsapp" | "telegram") => {
    if (!selectedContent) return;
    const link = getShareLink(platform);
    recordShare(platform);
    let url = "";
    switch (platform) {
      case "linkedin":
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`;
        break;
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`;
        break;
      case "whatsapp":
        url = `https://wa.me/?text=${encodeURIComponent(`Career Artifact: ${selectedContent.title}\n${link}`)}`;
        break;
      case "telegram":
        url = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(selectedContent.title)}`;
        break;
    }
    window.open(url, "_blank", "width=600,height=600");
  };

  if (isLoading && contents.length === 0)
    return (
      <div className="space-y-8 animate-pulse p-6">
        <Skeleton className="h-40 rounded-[32px] bg-muted/40" />
        <Skeleton className="h-[500px] rounded-[40px] bg-muted/40" />
      </div>
    );

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 p-4 md:p-6">
      {/* Phase 6 Executive Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-3 text-orange-500">
            <BookOpen className="h-8 w-8 text-orange-500 fill-orange-500/20" />
            <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none text-foreground">
              Content Outreach
            </h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Academy Promo Engine
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="space-y-1 text-right">
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 italic">
              Artifact Pool
            </p>
            <p className="text-2xl font-black italic tracking-tighter leading-none">{contents.length}</p>
          </div>
        </div>
      </header>

      {/* Distribution Hub Selector */}
      <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-orange-400 via-amber-500 to-orange-600" />
        <CardContent className="p-10 space-y-8">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                Target Artifact
              </Label>
              <Select
                value={selectedContent?.id || ""}
                onValueChange={(v) => setSelectedContent(contents.find((x) => x.id === v) || null)}
              >
                <SelectTrigger className="h-14 rounded-2xl border-2 font-bold bg-muted/20">
                  <SelectValue placeholder="Identify content node..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-2">
                  {contents.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="font-bold uppercase text-[10px]">
                      [{contentTypeLabel(c.content_type)}] {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                Audience Filter Protocol
              </Label>
              <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
                <SelectTrigger className="h-14 rounded-2xl border-2 font-bold bg-muted/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-2">
                  <SelectItem value="not_pitched" className="font-bold text-[10px] uppercase">
                    Protocol: Zero Pitch Nodes
                  </SelectItem>
                  <SelectItem value="all" className="font-bold text-[10px] uppercase">
                    Protocol: Global Talent Pool
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedContent && (
            <div className="flex items-center justify-between p-8 rounded-[32px] border-2 bg-primary/5 border-primary/20 shadow-inner animate-in slide-in-from-bottom-2">
              <div className="space-y-1 text-left">
                <h3 className="text-xl font-black uppercase tracking-tighter italic text-primary">
                  {selectedContent.title}
                </h3>
                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest italic">
                  {talents.length} VALID TARGETS IN RANGE
                </p>
              </div>
              <Button
                onClick={() => setIsShareOpen(true)}
                className="h-14 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-primary/30 group"
              >
                <Share2 className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" /> Broad Distribution
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Distribution Dialog */}
      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
        <DialogContent className="max-w-3xl rounded-[40px] border-4 border-border/40 bg-background/95 backdrop-blur-2xl p-0 overflow-hidden shadow-2xl">
          <div className="h-2 w-full bg-gradient-to-r from-orange-400 via-amber-500 to-orange-600" />
          <div className="p-12">
            <DialogHeader className="mb-10">
              <div className="flex items-center gap-5">
                <Globe className="h-10 w-10 text-primary" />
                <div className="text-left">
                  <DialogTitle className="text-3xl font-black uppercase tracking-tighter italic">
                    Broad Distribution Node
                  </DialogTitle>
                  <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                    Mass Artifact Promotion Protocols
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="flex flex-col md:flex-row gap-10">
              <div className="w-full md:w-1/3 space-y-3">
                {[
                  { id: "linkedin", label: "LINKEDIN", icon: Linkedin, color: "text-blue-600", bg: "bg-blue-600/10" },
                  { id: "facebook", label: "FACEBOOK", icon: Facebook, color: "text-blue-500", bg: "bg-blue-500/10" },
                  {
                    id: "whatsapp",
                    label: "WHATSAPP",
                    icon: MessageCircle,
                    color: "text-green-500",
                    bg: "bg-green-500/10",
                  },
                  { id: "telegram", label: "TELEGRAM", icon: Send, color: "text-sky-500", bg: "bg-sky-500/10" },
                  { id: "custom", label: "LOGIC LINK", icon: LinkIcon, color: "text-primary", bg: "bg-primary/10" },
                ].map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => setActiveTab(ch.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2",
                      activeTab === ch.id
                        ? "bg-primary border-primary text-white shadow-xl"
                        : "bg-muted/10 border-border/10 hover:border-primary/20",
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <ch.icon className={cn("w-4 h-4", activeTab === ch.id ? "text-white" : ch.color)} />
                      <span>{ch.label}</span>
                    </div>
                    {isShared(ch.id) && <ShieldCheck className="w-4 h-4" />}
                  </button>
                ))}
              </div>

              <div className="flex-1 space-y-8 animate-in fade-in duration-500">
                {activeTab !== "custom" ? (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1 text-left block">
                        Synthesis Payload ({activeTab})
                      </Label>
                      <div className="relative">
                        <Textarea
                          value={activeTab === "linkedin" ? templates.english : templates.bangla}
                          readOnly
                          rows={6}
                          className="rounded-2xl border-2 bg-muted/5 font-mono text-xs p-6 italic focus-visible:ring-0 leading-relaxed"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyTemplate(activeTab === "linkedin" ? templates.english : templates.bangla)}
                          className="absolute bottom-4 right-4 h-10 w-10 rounded-xl hover:bg-primary hover:text-white transition-all shadow-inner border-2 border-border/10"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <Button
                      className="w-full h-16 rounded-[20px] font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-primary/30 group"
                      onClick={() => handleSocialShare(activeTab as any)}
                    >
                      <ExternalLink className="w-5 h-5 mr-3" /> Authorize Channel Sync
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-8 animate-in slide-in-from-top-4">
                    <div className="space-y-2 text-left">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                        Channel Logic Name
                      </Label>
                      <Input
                        placeholder="e.g. CORE_NEWSLETTER_BETA"
                        value={customChannel}
                        onChange={(e) => setCustomChannel(e.target.value)}
                        className="h-12 rounded-xl border-2 font-bold"
                      />
                    </div>
                    <div className="space-y-2 text-left">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                        Tracking Artifact Link
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          readOnly
                          value={getShareLink(customChannel || "custom")}
                          className="h-12 rounded-xl border-2 bg-muted/5 font-mono text-xs"
                        />
                        <Button
                          onClick={() => copyLink(customChannel || "custom")}
                          className="h-12 w-12 rounded-xl border-2 border-border/10"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full h-14 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest"
                      onClick={() => recordShare(customChannel || "custom")}
                    >
                      <ShieldCheck className="w-4 h-4 mr-3" /> Commit Share Record
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Talent Registry Viewport */}
      {selectedContent && (
        <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden">
          <CardHeader className="p-10 bg-muted/10 border-b border-border/10">
            <div className="flex items-center justify-between">
              <div className="space-y-1 text-left">
                <CardTitle className="text-2xl font-black uppercase tracking-tighter italic flex items-center gap-4">
                  <Terminal className="h-6 w-6 text-primary" /> Target Registry
                </CardTitle>
                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest italic">
                  Interrogating individualized pitch logic nodes
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={loadTalents}
                className="h-12 w-12 rounded-full hover:bg-primary/10 transition-colors"
              >
                <RefreshCw className="h-5 w-5 text-primary" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {talents.length === 0 ? (
              <div className="py-32 text-center space-y-4 opacity-20 italic">
                <Users className="h-16 w-16 mx-auto" />
                <p className="text-[11px] font-black uppercase tracking-[0.4em]">Target Node Null</p>
              </div>
            ) : (
              <div className="divide-y divide-border/10">
                {talents.map((talent) => (
                  <div
                    key={talent.id}
                    className="group p-8 flex items-center justify-between transition-all hover:bg-primary/[0.02]"
                  >
                    <div className="flex items-center gap-6">
                      <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center border-2 border-border/40 shadow-inner group-hover:rotate-3 transition-transform">
                        <Users className="h-6 w-6 text-muted-foreground/40" />
                      </div>
                      <div className="space-y-1 text-left">
                        <p className="text-lg font-black uppercase tracking-tight italic leading-none group-hover:text-primary transition-colors">
                          {talent.full_name}
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest italic flex items-center gap-3">
                          <Globe className="h-3 w-3" /> {talent.email}{" "}
                          <span className="h-1 w-1 rounded-full bg-border" /> {talent.phone}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <Badge
                        className={cn(
                          "rounded-lg font-black text-[9px] uppercase tracking-widest px-4 py-1.5 border-none shadow-sm",
                          isPitched(talent.id) ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground",
                        )}
                      >
                        {isPitched(talent.id) ? "SYNC'D PITCH" : "PENDING NODE"}
                      </Badge>
                      {!isPitched(talent.id) && talent.phone && (
                        <Button
                          className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20"
                          onClick={() => handleSendOutreach(talent)}
                          disabled={isSending === talent.id}
                        >
                          {isSending === talent.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" /> Handshake
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ContentOutreachTab;

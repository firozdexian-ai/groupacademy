import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
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
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getOutreachWhatsAppLink, getFirstName } from "@/lib/outreachTemplates";

// --- Interfaces ---
interface Content {
  id: string;
  title: string;
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

export function ContentOutreachManager() {
  // Data State
  const [contents, setContents] = useState<Content[]>([]);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [talents, setTalents] = useState<Talent[]>([]);
  const [outreachRecords, setOutreachRecords] = useState<OutreachRecord[]>([]);
  const [shareLogs, setShareLogs] = useState<ShareLog[]>([]);

  // UI State
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"not_enrolled" | "not_pitched" | "all">("not_pitched");

  // Share Dialog State
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("linkedin");
  const [customChannel, setCustomChannel] = useState("");

  // 1. Load Content
  const loadContents = useCallback(async () => {
    const { data, error } = await supabase
      .from("content")
      .select("id, title, content_type, current_enrollment, is_published, description")
      .eq("is_published", true)
      .in("content_type", ["recorded_course", "batch_class", "live_webinar"])
      .order("title");

    if (error) {
      console.error("Error loading content:", error);
      return;
    }
    setContents(data || []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadContents();
  }, [loadContents]);

  // 2. Load Talents & Records
  const loadTalents = useCallback(async () => {
    if (!selectedContent) return;
    setIsLoading(true);

    const { data: talentData, error: talentError } = await supabase
      .from("talents")
      .select("id, full_name, email, phone, profession_category_id, country")
      .not("phone", "is", null)
      .order("created_at", { ascending: false })
      .limit(200);

    if (talentError) {
      console.error("Error loading talents:", talentError);
      setIsLoading(false);
      return;
    }

    const { data: outreachData } = await supabase
      .from("outreach_messages")
      .select("talent_id, course_id")
      .eq("product", "course")
      .eq("course_id", selectedContent.id);

    setOutreachRecords(outreachData || []);

    let filteredTalents = talentData || [];
    if (filterType === "not_pitched") {
      const pitchedTalentIds = new Set((outreachData || []).map((r) => r.talent_id));
      filteredTalents = filteredTalents.filter((t) => !pitchedTalentIds.has(t.id));
    }

    setTalents(filteredTalents);
    setIsLoading(false);
  }, [selectedContent, filterType]);

  // 3. Load Share Logs (Ticks)
  const loadShareLogs = async () => {
    if (!selectedContent) return;
    const { data } = await supabase
      .from("content_share_logs")
      .select("channel, shared_at")
      .eq("content_id", selectedContent.id);
    setShareLogs(data || []);
  };

  useEffect(() => {
    if (selectedContent) {
      loadTalents();
      if (isShareOpen) loadShareLogs();
    }
  }, [selectedContent, loadTalents, isShareOpen]);

  // --- Handlers ---
  const handleSendOutreach = async (talent: Talent) => {
    if (!talent.phone || !selectedContent) return;
    setIsSending(talent.id);

    try {
      const { error } = await supabase.from("outreach_messages").insert({
        talent_id: talent.id,
        product: "course",
        course_id: selectedContent.id,
        message_content: `Course pitch: ${selectedContent.title}`,
      });

      if (error) throw error;

      const firstName = getFirstName(talent.full_name);
      const whatsappUrl = getOutreachWhatsAppLink(talent.phone, "course", firstName, selectedContent.title);
      window.open(whatsappUrl, "_blank");

      setOutreachRecords((prev) => [...prev, { talent_id: talent.id, course_id: selectedContent.id }]);
      toast.success(`Outreach sent to ${talent.full_name}`);
    } catch (err) {
      toast.error("Failed to record outreach");
    } finally {
      setIsSending(null);
    }
  };

  const isPitched = (talentId: string) =>
    outreachRecords.some((r) => r.talent_id === talentId && r.course_id === selectedContent?.id);

  // --- Bulk Share Handlers ---
  const recordShare = async (channel: string) => {
    if (!selectedContent) return;

    // Optimistic Update
    setShareLogs((prev) => [...prev, { channel, shared_at: new Date().toISOString() }]);

    const { error } = await supabase.from("content_share_logs").insert({
      content_id: selectedContent.id,
      channel: channel,
      shared_at: new Date().toISOString(),
    });

    if (error) {
      // Revert if failed
      setShareLogs((prev) => prev.filter((l) => l.channel !== channel));
      toast.error("Failed to save progress. Check connection.");
    } else {
      toast.success(`Marked as shared on ${channel}`);
    }
  };

  const isShared = (channel: string) => shareLogs.some((log) => log.channel === channel);

  const getShareLink = (source: string) => {
    if (!selectedContent) return "";
    const typeSlug = selectedContent.content_type === "live_webinar" ? "events" : "courses";
    return `${window.location.origin}/app/learning/${typeSlug}/${selectedContent.id}?source=${source}`;
  };

  const copyLink = async (source: string) => {
    const link = getShareLink(source);
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copied!");
    } catch {}
  };

  const contentTypeLabel = (type: string) =>
    ({ recorded_course: "Course", batch_class: "Batch", live_webinar: "Webinar" })[type] || type;

  const templates = selectedContent
    ? {
        english: `🚀 Learning Opportunity: ${selectedContent.title}\n📚 Type: ${contentTypeLabel(selectedContent.content_type)}\n🔥 Join now: ${getShareLink(activeTab)}\n\n#learning #career`,
        bangla: `📢 নতুন কোর্স: ${selectedContent.title}\n📚 ধরণ: ${contentTypeLabel(selectedContent.content_type)}\n🔗 লিংক: ${getShareLink(activeTab)}\n\n#bdjobs #learning`,
      }
    : { english: "", bangla: "" };

  const copyTemplate = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Caption copied!");
    } catch {}
  };

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
        url = `https://wa.me/?text=${encodeURIComponent(`Check this out: ${selectedContent.title}\n${link}`)}`;
        break;
      case "telegram":
        url = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(selectedContent.title)}`;
        break;
    }
    window.open(url, "_blank", "width=600,height=600");
  };

  if (isLoading && contents.length === 0)
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" /> Content Outreach
          </CardTitle>
          <CardDescription>Select content to promote broadly or pitch individually.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Selectors */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Content</label>
              <Select
                value={selectedContent?.id || ""}
                onValueChange={(v) => {
                  const c = contents.find((x) => x.id === v);
                  setSelectedContent(c || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose content..." />
                </SelectTrigger>
                <SelectContent>
                  {contents.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {contentTypeLabel(c.content_type)}
                        </Badge>{" "}
                        {c.title}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Filter Individual Audience</label>
              <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_pitched">
                    <div className="flex gap-2 items-center">
                      <Filter className="h-4 w-4" /> Never pitched
                    </div>
                  </SelectItem>
                  <SelectItem value="all">
                    <div className="flex gap-2 items-center">
                      <Users className="h-4 w-4" /> All talents
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Bar */}
          {selectedContent && (
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
              <div>
                <h3 className="font-medium">{selectedContent.title}</h3>
                <p className="text-sm text-muted-foreground">{talents.length} individual targets found</p>
              </div>
              <Button onClick={() => setIsShareOpen(true)} className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-sm">
                <Share2 className="w-4 h-4" /> Promote to Socials
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Share Dialog */}
      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Promote: {selectedContent?.title}</DialogTitle>
            <DialogDescription>Share widely to increase enrollments.</DialogDescription>
          </DialogHeader>

          <div className="flex gap-6 mt-4">
            <div className="w-1/3 border-r pr-6 space-y-4">
              <div className="space-y-2">
                {[
                  { id: "linkedin", label: "LinkedIn", icon: Linkedin, color: "text-blue-600" },
                  { id: "facebook", label: "Facebook", icon: Facebook, color: "text-blue-500" },
                  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, color: "text-green-500" },
                  { id: "telegram", label: "Telegram", icon: Send, color: "text-sky-500" },
                ].map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => setActiveTab(ch.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg text-sm transition-all ${activeTab === ch.id ? "bg-primary/10 ring-1 ring-primary" : "hover:bg-muted"}`}
                  >
                    <div className="flex items-center gap-3">
                      <ch.icon className={`w-4 h-4 ${ch.color}`} /> <span>{ch.label}</span>
                    </div>
                    {isShared(ch.id) && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                  </button>
                ))}
                <div className="pt-2 mt-2 border-t">
                  <button
                    onClick={() => setActiveTab("custom")}
                    className={`w-full flex items-center justify-between p-3 rounded-lg text-sm transition-all ${activeTab === "custom" ? "bg-primary/10 ring-1 ring-primary" : "hover:bg-muted"}`}
                  >
                    <div className="flex items-center gap-3">
                      <LinkIcon className="w-4 h-4 text-gray-500" />
                      <span>Custom Link</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-6">
              {(activeTab === "linkedin" || activeTab === "facebook") && (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-3 rounded-md text-sm border border-blue-100">
                    <p className="font-semibold mb-1">Social Strategy</p>Post on feed & groups.
                  </div>
                  <div>
                    <Label className="mb-2 block">Post Template ({activeTab})</Label>
                    <Textarea
                      value={activeTab === "linkedin" ? templates.english : templates.bangla}
                      readOnly
                      rows={6}
                      className="text-xs bg-muted/30"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyTemplate(activeTab === "linkedin" ? templates.english : templates.bangla)}
                      className="mt-2 w-full"
                    >
                      <Copy className="w-3 h-3 mr-2" /> Copy Caption
                    </Button>
                  </div>
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => handleSocialShare(activeTab as any)}
                  >
                    <Share2 className="w-4 h-4 mr-2" /> Share Direct
                  </Button>
                </div>
              )}

              {(activeTab === "whatsapp" || activeTab === "telegram") && (
                <div className="space-y-4">
                  <div className="bg-green-50 p-3 rounded-md text-sm border border-green-100">
                    <p className="font-semibold mb-1">Direct Share</p>Share in channels/groups.
                  </div>

                  {/* DIRECT BUTTON */}
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => handleSocialShare(activeTab as any)}
                  >
                    Open App
                  </Button>

                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-gray-200"></div>
                    <span className="flex-shrink-0 mx-4 text-gray-400 text-xs">OR COPY LINK</span>
                    <div className="flex-grow border-t border-gray-200"></div>
                  </div>

                  {/* COPY BUTTON */}
                  <div className="flex gap-2">
                    <Input readOnly value={getShareLink(activeTab)} className="bg-muted text-xs" />
                    <Button variant="outline" onClick={() => copyLink(activeTab)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* MANUAL MARK BUTTON */}
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => {
                      recordShare(activeTab);
                      toast.success("Marked!");
                    }}
                    disabled={isShared(activeTab)}
                  >
                    {isShared(activeTab) ? (
                      <>
                        <Check className="w-4 h-4 mr-2" /> Done
                      </>
                    ) : (
                      "Mark as Done Manually"
                    )}
                  </Button>
                </div>
              )}

              {activeTab === "custom" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Channel Name</Label>
                    <Input
                      placeholder="e.g. newsletter"
                      value={customChannel}
                      onChange={(e) => setCustomChannel(e.target.value)}
                    />
                  </div>
                  <div className="pt-2">
                    <Label>Tracking Link</Label>
                    <div className="flex gap-2">
                      <Input readOnly value={getShareLink(customChannel || "custom")} className="bg-muted" />
                      <Button onClick={() => copyLink(customChannel || "custom")}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    className="w-full mt-4"
                    onClick={() => {
                      recordShare(customChannel || "custom");
                      toast.success("Marked!");
                    }}
                  >
                    <Check className="w-4 h-4 mr-2" /> Mark as Done
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Talent List (Individual Outreach) */}
      {selectedContent && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" /> Individual Outreach
              </CardTitle>
              <CardDescription>Send personal WhatsApp messages to talents</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadTalents}>
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {talents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No talents found matching criteria.</div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {talents.map((talent) => (
                      <TableRow key={talent.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{talent.full_name}</p>
                            <p className="text-xs text-muted-foreground">{talent.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{talent.phone}</TableCell>
                        <TableCell>
                          {isPitched(talent.id) ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              <Check className="h-3 w-3 mr-1" /> Pitched
                            </Badge>
                          ) : (
                            <Badge variant="outline">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {talent.phone && !isPitched(talent.id) && (
                            <Button
                              size="sm"
                              onClick={() => handleSendOutreach(talent)}
                              disabled={isSending === talent.id}
                            >
                              {isSending === talent.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Send className="h-4 w-4 mr-1" /> WhatsApp
                                </>
                              )}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

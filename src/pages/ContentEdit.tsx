import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import CourseSessionsManager from "@/components/dashboard/learning/sessions/CourseSessionsManager";
import CoursePerformanceDashboard from "@/components/dashboard/learning/content-widgets/CoursePerformanceDashboard";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Save,
  Copy,
  Check,
  Info,
  Youtube,
  MessageSquare,
  Calendar,
  MapPin,
  DollarSign,
  Hash,
  Layers,
  Globe,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/ImageUpload";
import { youtubeUrlSchema, whatsappUrlSchema } from "@/lib/validations";
import { cn } from "@/lib/utils";
import { EventDateTimeField } from "@/components/admin/EventDateTimeField";
import { DEFAULT_EVENT_TZ } from "@/lib/eventTime";
import ContentReadinessBadge, { type ModuleStats } from "@/components/dashboard/learning/content-widgets/ContentReadinessBadge";
import ContentReadinessChecklist from "@/components/dashboard/learning/content-widgets/ContentReadinessChecklist";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { AIActionButton } from "@/components/dashboard/learning/content-widgets/ContentAIActions";
import { AICoverImageSheet } from "@/components/dashboard/learning/AICoverImageSheet";

export default function ContentEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "schema";
  const setActiveTab = (t: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", t);
    setSearchParams(next, { replace: true });
  };
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [aiCoverOpen, setAiCoverOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [moduleStats, setModuleStats] = useState<ModuleStats | null>(null);
  const [isReady, setIsReady] = useState<boolean | null>(null);
  const [moduleAudit, setModuleAudit] = useState<Array<{ id: string; title: string; reason: string }>>([]);
  const [sessionCount, setSessionCount] = useState(0);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    content_type: "recorded_course" as any,
    price: "",
    currency: "USD",
    credit_cost: null as number | null,
    duration_hours: "",
    modules_count: "",
    instructor_name: "",
    venue_name: "",
    venue_address: "",
    event_date: "",                       // UTC ISO
    event_timezone: DEFAULT_EVENT_TZ,
    event_duration_minutes: "",
    max_capacity: "",
    youtube_url: "",
    cover_image_url: "",
    is_published: true,
    is_private: false,
    display_order: 0,
    whatsapp_group_link: "",
  });

  useEffect(() => {
    if (id) loadContent();
  }, [id]);

  const loadModuleStats = async () => {
    if (!id) return;
    const { data: modules } = await supabase
      .from("course_modules")
      .select("id, title, description, video_url")
      .eq("content_id", id)
      .order("order_index", { ascending: true });
    const moduleIds = (modules || []).map((m: any) => m.id);
    const { data: resources } = moduleIds.length
      ? await supabase.from("module_resources").select("module_id, resource_url").in("module_id", moduleIds)
      : { data: [] as any[] };

    const moduleHasResource = new Set<string>();
    for (const r of resources || []) {
      if (r.resource_url && String(r.resource_url).trim().length > 0) moduleHasResource.add(r.module_id);
    }

    const stats: ModuleStats = {
      module_count: modules?.length || 0,
      modules_with_desc: 0,
      modules_with_video: 0,
      playable_modules: 0,
    };
    const audit: Array<{ id: string; title: string; reason: string }> = [];
    for (const row of modules || []) {
      if (row.description && row.description.trim().length > 500) stats.modules_with_desc++;
      const hasVideo = !!(row.video_url && row.video_url.trim().length > 0);
      const hasResource = moduleHasResource.has(row.id);
      if (hasVideo) stats.modules_with_video++;
      if (hasVideo || hasResource) stats.playable_modules!++;
      else audit.push({ id: row.id, title: row.title || "Untitled module", reason: "No video URL and no resource attached" });
    }
    setModuleStats(stats);
    setModuleAudit(audit);
  };

  const loadContent = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("content").select("*").eq("id", id).single();
      if (error) throw error;

      setFormData({
        ...data,
        price: data.price?.toString() || "",
        duration_hours: data.duration_hours?.toString() || "",
        modules_count: data.modules_count?.toString() || "",
        event_date: data.event_date || "",
        event_timezone: data.event_timezone || DEFAULT_EVENT_TZ,
        event_duration_minutes: data.event_duration_minutes?.toString() || "",
        max_capacity: data.max_capacity?.toString() || "",
      });
      setIsReady(data.is_ready ?? null);
      await loadModuleStats();
      const { count: sCount } = await supabase
        .from("course_sessions")
        .select("*", { count: "exact", head: true })
        .eq("content_id", id!);
      setSessionCount(sCount || 0);
    } catch (error: any) {
      toast({ title: "Load Error", description: error.message, variant: "destructive" });
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Logic validation for URLs
      if (formData.youtube_url && !youtubeUrlSchema.safeParse(formData.youtube_url).success) {
        throw new Error("Invalid YouTube URL format.");
      }
      if (formData.whatsapp_group_link && !whatsappUrlSchema.safeParse(formData.whatsapp_group_link).success) {
        throw new Error("Invalid WhatsApp link format.");
      }

      const { error } = await supabase
        .from("content")
        .update({
          ...formData,
          price: formData.price ? parseFloat(formData.price) : null,
          duration_hours: formData.duration_hours ? parseInt(formData.duration_hours) : null,
          modules_count: formData.modules_count ? parseInt(formData.modules_count) : null,
          event_duration_minutes: formData.event_duration_minutes ? parseInt(formData.event_duration_minutes) : null,
          max_capacity: formData.max_capacity ? parseInt(formData.max_capacity) : null,
          event_date: formData.event_date || null,
        })
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Success", description: "Academy record synchronized." });
      navigate("/dashboard");
    } catch (error: any) {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center font-bold text-muted-foreground animate-pulse">
        Initializing Data Stream...
      </div>
    );

  const calculatedCredits = formData.price ? Math.ceil(parseFloat(formData.price) / 0.02) : 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <header className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="rounded-xl font-bold uppercase text-[10px] tracking-widest"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Nexus
          </Button>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="font-black uppercase text-[10px] py-1 border-primary/20 text-primary bg-primary/5 tracking-tighter"
            >
              ID: {id?.split("-")[0]}
            </Badge>
            <Badge variant="secondary" className="font-black uppercase text-[10px] py-1 tracking-tighter">
              {formData.content_type?.replace("_", " ")}
            </Badge>
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="rounded-2xl bg-muted/40 p-1">
            <TabsTrigger value="schema" className="rounded-xl text-[10px] font-black uppercase tracking-widest">Schema</TabsTrigger>
            {["live_webinar", "batch_class", "offline_seminar"].includes(formData.content_type) && (
              <TabsTrigger value="sessions" className="rounded-xl text-[10px] font-black uppercase tracking-widest">Sessions</TabsTrigger>
            )}
            <TabsTrigger value="performance" className="rounded-xl text-[10px] font-black uppercase tracking-widest">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="mt-0">
            {id && <CoursePerformanceDashboard contentId={id} contentTitle={formData.title} />}
          </TabsContent>

          <TabsContent value="sessions" className="mt-0">
            {id && (
              <CourseSessionsManager
                contentId={id}
                contentTitle={formData.title || "Untitled course"}
                defaultTimezone={formData.event_timezone}
                parentEventDate={formData.event_date || null}
              />
            )}
          </TabsContent>

          <TabsContent value="schema" className="mt-0">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-[1fr,300px] gap-8">
          <div className="space-y-6">
            {/* Core Identity Section */}
            <Card className="rounded-3xl border-border/40 overflow-hidden">
              <CardHeader className="bg-muted/30 pb-4 border-b border-border/20">
                <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" /> Content Blueprint
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6 pt-8">
                <div data-readiness-field="cover_image" className="space-y-2">
                  <ImageUpload
                    value={formData.cover_image_url}
                    onUpload={(url) => setFormData({ ...formData, cover_image_url: url })}
                    onRemove={() => setFormData({ ...formData, cover_image_url: "" })}
                  />
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAiCoverOpen(true)}
                      className="h-7 px-2 text-[10px] font-bold uppercase tracking-widest gap-1 rounded-lg border-primary/30 text-primary hover:bg-primary/10"
                    >
                      ✨ AI cover
                    </Button>
                  </div>
                </div>

                <div className="grid gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Internal Title *
                    </Label>
                    <Input data-readiness-field="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      className="rounded-xl border-border/40 font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          URL Path (Slug) *
                        </Label>
                        <AIActionButton
                          mode="slug"
                          context={{ title: formData.title, profession: formData.content_type }}
                          onResult={(slug: string) => setFormData((f) => ({ ...f, slug }))}
                        />
                      </div>
                      <Input data-readiness-field="slug"
                        value={formData.slug}
                        onChange={(e) =>
                          setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/ /g, "-") })
                        }
                        required
                        className="rounded-xl border-border/40 font-mono text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Catalog Type
                      </Label>
                      <Select
                        value={formData.content_type}
                        onValueChange={(val) => setFormData({ ...formData, content_type: val })}
                      >
                        <SelectTrigger className="rounded-xl border-border/40 font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="recorded_course">Recorded Course</SelectItem>
                          <SelectItem value="free_video">Free Video</SelectItem>
                          <SelectItem value="live_webinar">Live Webinar</SelectItem>
                          <SelectItem value="batch_class">Batch Class</SelectItem>
                          <SelectItem value="offline_seminar">Offline Seminar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                        Marketplace Description
                      </Label>
                      <AIActionButton
                        mode="description"
                        context={{ title: formData.title, description: formData.description, content_type: formData.content_type }}
                        onResult={(description: string) => setFormData((f) => ({ ...f, description }))}
                      />
                    </div>
                    <Textarea data-readiness-field="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={5}
                      className="rounded-2xl border-border/40 resize-none font-medium leading-relaxed"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Logistics & Delivery Section (Conditional) */}
            {formData.content_type !== "free_video" && (
              <Card className="rounded-3xl border-border/40 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <CardHeader className="bg-muted/30 pb-4 border-b border-border/20">
                  <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" /> Delivery Logic
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 grid gap-6 pt-8">
                  {["live_webinar", "batch_class", "offline_seminar"].includes(formData.content_type) && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <div data-readiness-field="event_date">
                          <EventDateTimeField
                            utcValue={formData.event_date}
                            timezone={formData.event_timezone}
                            onChange={({ utcValue, timezone }) =>
                              setFormData({ ...formData, event_date: utcValue, event_timezone: timezone })
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          Capacity Limit
                        </Label>
                        <Input data-readiness-field="max_capacity"
                          type="number"
                          value={formData.max_capacity}
                          onChange={(e) => setFormData({ ...formData, max_capacity: e.target.value })}
                          placeholder="Seats"
                          className="rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          Duration (Mins)
                        </Label>
                        <Input data-readiness-field="event_duration"
                          type="number"
                          value={formData.event_duration_minutes}
                          onChange={(e) => setFormData({ ...formData, event_duration_minutes: e.target.value })}
                          placeholder="60"
                          className="rounded-xl"
                        />
                      </div>
                    </div>
                  )}

                  {formData.content_type === "offline_seminar" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          Venue
                        </Label>
                        <Input data-readiness-field="venue_name"
                          value={formData.venue_name}
                          onChange={(e) => setFormData({ ...formData, venue_name: e.target.value })}
                          className="rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          Coordinates
                        </Label>
                        <Input
                          value={formData.venue_address}
                          onChange={(e) => setFormData({ ...formData, venue_address: e.target.value })}
                          className="rounded-xl"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Lead Instructor
                      </Label>
                      <Input data-readiness-field="instructor_name"
                        value={formData.instructor_name}
                        onChange={(e) => setFormData({ ...formData, instructor_name: e.target.value })}
                        className="rounded-xl font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Estimated Study Hours
                      </Label>
                      <Input
                        type="number"
                        value={formData.duration_hours}
                        onChange={(e) => setFormData({ ...formData, duration_hours: e.target.value })}
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Media & Community */}
            <Card className="rounded-3xl border-border/40 overflow-hidden">
              <CardHeader className="bg-muted/30 pb-4 border-b border-border/20">
                <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2">
                  <Youtube className="h-4 w-4 text-primary" /> Integration Channels
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6 pt-8">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Stream Target (YouTube)
                  </Label>
                  <Input data-readiness-field="youtube_url"
                    value={formData.youtube_url}
                    onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                    placeholder="https://youtube.com/..."
                    className="rounded-xl border-border/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Engagement Hub (WhatsApp)
                  </Label>
                  <Input
                    value={formData.whatsapp_group_link}
                    onChange={(e) => setFormData({ ...formData, whatsapp_group_link: e.target.value })}
                    placeholder="https://chat.whatsapp.com/..."
                    className="rounded-xl border-border/40"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Panel */}
          <aside className="space-y-6">
            <Card className="rounded-[32px] border-primary/20 bg-primary/[0.02] shadow-xl overflow-hidden sticky top-8">
              <CardHeader className="bg-primary/5 pb-4">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-primary">
                  Financial Engine
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground">
                      Currency Pricing
                    </Label>
                    <div className="flex gap-2">
                      <Input data-readiness-field="price"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="rounded-xl border-border/40 h-11"
                        placeholder="0.00"
                      />
                      <Input
                        value={formData.currency}
                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                        className="rounded-xl w-20 border-border/40 h-11 uppercase font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground">
                      Credit Cost Override
                    </Label>
                    <Input
                      type="number"
                      value={formData.credit_cost ?? ""}
                      onChange={(e) =>
                        setFormData({ ...formData, credit_cost: e.target.value ? parseInt(e.target.value) : null })
                      }
                      placeholder={calculatedCredits.toString()}
                      className="rounded-xl h-11 font-black text-primary border-primary/20"
                    />
                  </div>

                  <div className="bg-primary/10 rounded-2xl p-4 space-y-1">
                    <p className="text-[8px] font-black uppercase text-primary/60 tracking-widest">
                      Effective Marketplace Rate
                    </p>
                    <p className="text-xl font-black text-primary tracking-tighter">
                      {formData.credit_cost || calculatedCredits} Credits
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-border/20 space-y-4">
                  <div className="flex items-center justify-between space-x-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Visible</Label>
                    <Switch
                      checked={formData.is_published}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest">Exclusive Link</Label>
                      <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-tighter">
                        B2B Private Mode
                      </p>
                    </div>
                    <Switch
                      checked={formData.is_private}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_private: checked })}
                    />
                  </div>
                </div>

                <Button
                  className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20 group"
                  disabled={saving}
                  type="submit"
                >
                  {saving ? (
                    <Save className="animate-pulse" />
                  ) : (
                    <Save className="mr-2 group-hover:scale-110 transition-transform" />
                  )}
                  Update Schema
                </Button>
              </CardContent>
            </Card>

            {/* Readiness checklist */}
            {id && (
              <ContentReadinessChecklist
                contentId={id}
                formData={formData as any}
                moduleStats={moduleStats || undefined}
                moduleAudit={moduleAudit}
                sessionCount={sessionCount}
                onRecomputed={loadContent}
              />
            )}


            <div className="grid gap-4">
              <Button
                variant="outline"
                className="h-16 rounded-[24px] border-border/40 justify-between group"
                onClick={() => navigate(`/content/${id}/modules`)}
              >
                <div className="text-left">
                  <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">
                    Expansion Pack
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-widest">Manage Modules</p>
                </div>
                <Layers className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Button>
              <Button
                variant="outline"
                className="h-16 rounded-[24px] border-border/40 justify-between group"
                onClick={() => navigate(`/quiz-manage/${id}`)}
              >
                <div className="text-left">
                  <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Certification</p>
                  <p className="text-[10px] font-black uppercase tracking-widest">Manage Quiz</p>
                </div>
                <Check className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Button>
            </div>
          </aside>
        </form>
          </TabsContent>
        </Tabs>

        {formData.is_private && (
          <Card className="rounded-[32px] border-dashed border-primary/40 bg-primary/[0.01] animate-in zoom-in-95">
            <CardContent className="p-6 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary mb-1">
                  Direct Secure Access URL
                </p>
                <code className="text-xs text-muted-foreground truncate block font-mono">{`${window.location.origin}/courses/${formData.slug}`}</code>
              </div>
              <Button
                size="icon"
                variant="outline"
                className="rounded-xl shrink-0"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/courses/${formData.slug}`);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                  toast({ title: "Secure URL Cached" });
                }}
              >
                {copiedLink ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
      <AICoverImageSheet
        open={aiCoverOpen}
        onOpenChange={setAiCoverOpen}
        context={{ title: formData.title, description: formData.description, content_type: formData.content_type }}
        onApply={(url) => setFormData((f) => ({ ...f, cover_image_url: url }))}
      />
    </div>
  );
}

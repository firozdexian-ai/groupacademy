import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeIlike } from "@/lib/supabaseQuery";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Edit,
  Trash2,
  Video,
  BookOpen,
  Presentation,
  Users,
  MapPin,
  AlertCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  Layers,
  Zap,
  Eye,
  Copy,
  Power,
  PowerOff,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { CardGridSkeleton } from "@/components/ui/page-loading-skeleton";
import { useNavigate } from "react-router-dom";
import ContentFilters, { type ContentFilterValues } from "./ContentFilters";
import ContentReadinessBadge, { type ModuleStats } from "./ContentReadinessBadge";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Academic Artifact Registry (Content List)
 * High-fidelity orchestrator for multi-modal educational assets.
 * 2026 Standard: Executive Logic geometry with reinforced type-safe ingestion.
 */

type ContentType = "batch_class" | "free_video" | "live_webinar" | "offline_seminar" | "recorded_course";

interface Content {
  id: string;
  title: string;
  slug: string | null;
  content_type: string;
  description: string | null;
  price: number;
  is_published: boolean;
  is_ready: boolean | null;
  instructor_name: string | null;
  event_date: string | null;
  max_capacity: number | null;
  current_enrollment: number;
  profession_line_id: string | null;
  profession_level_id: string | null;
}

interface ContentListProps {
  filter?: ContentType;
}

const TYPE_CONFIG: Record<string, { icon: any; label: string; color: string; bg: string }> = {
  free_video: { icon: Video, label: "FREE_VIDEO", color: "text-blue-500", bg: "bg-blue-500/10" },
  recorded_course: { icon: BookOpen, label: "COURSE_NODE", color: "text-purple-500", bg: "bg-purple-500/10" },
  live_webinar: { icon: Presentation, label: "WEBINAR_LOGIC", color: "text-teal-500", bg: "bg-teal-500/10" },
  batch_class: { icon: Users, label: "BATCH_CLASS", color: "text-emerald-500", bg: "bg-emerald-500/10" },
  offline_seminar: { icon: MapPin, label: "SEMINAR_OFFLINE", color: "text-orange-500", bg: "bg-orange-500/10" },
};

const ITEMS_PER_PAGE = 9;

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

const ContentList = ({ filter }: ContentListProps) => {
  const navigate = useNavigate();
  const [content, setContent] = useState<Content[]>([]);
  const [moduleStatsMap, setModuleStatsMap] = useState<Record<string, ModuleStats>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const [filters, setFilters] = useState<ContentFilterValues>({
    programId: "all",
    levelId: "all",
    readiness: "all",
    sortBy: "newest",
  });

  // Telemetry Calculation
  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));

  const fetchModuleStats = useCallback(async (contentIds: string[]) => {
    if (contentIds.length === 0) {
      setModuleStatsMap({});
      return;
    }
    const { data: modules } = await supabase
      .from("course_modules")
      .select("id, content_id, description, video_url")
      .in("content_id", contentIds);

    const moduleIds = (modules || []).map((m: any) => m.id);
    const { data: resources } = moduleIds.length
      ? await supabase.from("module_resources").select("module_id, resource_url").in("module_id", moduleIds)
      : { data: [] as any[] };

    const moduleHasResource = new Set<string>();
    for (const r of resources || []) {
      if (r.resource_url && String(r.resource_url).trim().length > 0) moduleHasResource.add(r.module_id);
    }

    const map: Record<string, ModuleStats> = {};
    for (const row of modules || []) {
      if (!map[row.content_id])
        map[row.content_id] = { module_count: 0, modules_with_desc: 0, modules_with_video: 0, playable_modules: 0 };
      const m = map[row.content_id];
      m.module_count++;
      if (row.description && row.description.trim().length > 500) m.modules_with_desc++;
      const hasVideo = !!(row.video_url && row.video_url.trim().length > 0);
      if (hasVideo) m.modules_with_video++;
      if (hasVideo || moduleHasResource.has(row.id)) m.playable_modules = (m.playable_modules || 0) + 1;
    }
    setModuleStatsMap(map);
  }, []);

  const loadRegistry = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const sortCol =
        filters.sortBy.startsWith("title") ? "title" :
        filters.sortBy === "enrollment_desc" ? "current_enrollment" : "created_at";
      const sortAsc = filters.sortBy === "oldest" || filters.sortBy === "title_asc";

      let query = supabase.from("content").select("*", { count: "exact" }).order(sortCol, { ascending: sortAsc });

      if (filter) query = query.eq("content_type", filter as ContentType);

      if (filters.programId !== "all") query = query.eq("profession_line_id", filters.programId);
      if (filters.levelId !== "all") query = query.eq("profession_level_id", filters.levelId);

      if (filters.readiness === "inactive_only") query = query.or("is_ready.is.null,is_ready.eq.false");
      else if (filters.readiness === "ready_only") query = query.eq("is_ready", true);
      else if (filters.readiness === "published") query = query.eq("is_published", true);
      else if (filters.readiness === "draft") query = query.eq("is_published", false);

      if (debouncedSearch) {
        const safe = sanitizeIlike(debouncedSearch);
        if (safe) query = query.or(`title.ilike.%${safe}%,instructor_name.ilike.%${safe}%`);
      }

      const from = (page - 1) * ITEMS_PER_PAGE;
      const result = await withTimeout(
        Promise.resolve(query.range(from, from + ITEMS_PER_PAGE - 1)),
        TIMEOUTS.DEFAULT,
        "Registry Sync Timeout",
      );

      if (result.error) throw result.error;

      const data = (result.data || []) as Content[];
      setContent(data);
      setTotalCount(result.count || 0);
      await fetchModuleStats(data.map((c) => c.id));
    } catch (err: any) {
      setLoadError("Transmission Error: Failed to synchronize registry nodes.");
    } finally {
      setIsLoading(false);
    }
  }, [page, filter, debouncedSearch, filters, fetchModuleStats]);

  useEffect(() => {
    loadRegistry();
  }, [loadRegistry]);
  useEffect(() => {
    setPage(1);
  }, [filter, debouncedSearch, filters]);

  const confirmPurge = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase.from("content").delete().eq("id", deleteId);
      if (error) throw error;
      toast.success("Artifact purged from registry.");
      loadRegistry();
    } catch (err: any) {
      toast.error("Handshake Failed: Logic termination aborted.");
    } finally {
      setDeleteId(null);
    }
  };

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const toggleSelectAll = () =>
    setSelectedIds((prev) => (prev.size === content.length ? new Set() : new Set(content.map((c) => c.id))));
  const clearSelection = () => setSelectedIds(new Set());

  const bulkSetPublished = async (publish: boolean) => {
    if (selectedIds.size === 0) return;
    setBulkBusy(true);
    try {
      const ids = Array.from(selectedIds);
      const { error } = await supabase.from("content").update({ is_published: publish }).in("id", ids);
      if (error) throw error;
      toast.success(`${ids.length} ${publish ? "published" : "unpublished"}.`);
      clearSelection();
      loadRegistry();
    } catch (e: any) {
      toast.error(e?.message || "Bulk update failed.");
    } finally {
      setBulkBusy(false);
    }
  };

  const duplicateContent = async (item: Content) => {
    try {
      const { data: full, error: fErr } = await supabase.from("content").select("*").eq("id", item.id).single();
      if (fErr || !full) throw fErr || new Error("Source not found");
      const { id, created_at, updated_at, current_enrollment, slug, ...rest } = full as any;
      const newSlug = `${(slug || "course")}-copy-${Math.random().toString(36).slice(2, 6)}`;
      const { error } = await supabase.from("content").insert({
        ...rest,
        slug: newSlug,
        title: `${full.title} (Copy)`,
        is_published: false,
        is_ready: false,
        current_enrollment: 0,
      });
      if (error) throw error;
      toast.success("Course duplicated as draft.");
      loadRegistry();
    } catch (e: any) {
      toast.error(e?.message || "Duplicate failed.");
    }
  };

  const previewAsTalent = (item: Content) => {
    if (!item.slug) {
      toast.error("This course has no slug yet — open Edit to set one.");
      return;
    }
    const path = item.content_type === "live_webinar" || item.content_type === "batch_class"
      ? `/webinar/${item.slug}` : `/courses/${item.slug}`;
    window.open(path, "_blank");
  };

  if (isLoading && content.length === 0) return <CardGridSkeleton count={6} columns={3} />;

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      {/* Executive Query Console */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-muted/20 p-6 rounded-[32px] border-2 border-border/40 backdrop-blur-md">
        <div className="relative flex-1 group w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Query artifact by title or logic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-14 bg-card/50 border-2 border-border/10 rounded-2xl font-bold tracking-tight text-base"
          />
        </div>
        <div className="flex items-center gap-6 w-full lg:w-auto justify-between lg:justify-end">
          <div className="space-y-1 text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 italic leading-none">
              Total Nodes
            </p>
            <p className="text-3xl font-black italic tracking-tighter leading-none">{totalCount}</p>
          </div>
          <Button
            onClick={() => navigate("/content/new")}
            className="rounded-xl h-14 px-8 font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-primary/30 group"
          >
            <Plus className="h-5 w-5 mr-3 transition-transform group-hover:rotate-90" /> Initialize Node
          </Button>
        </div>
      </div>

      <ContentFilters values={filters} onChange={setFilters} className="px-2" />

      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl border-2 border-primary/30 bg-primary/5 sticky top-2 z-10 backdrop-blur">
          <p className="text-xs font-black uppercase tracking-widest">
            {selectedIds.size} selected
          </p>
          <Button size="sm" variant="outline" className="rounded-lg h-9 text-[10px] font-bold uppercase"
            onClick={() => bulkSetPublished(true)} disabled={bulkBusy}>
            <Power className="w-3.5 h-3.5 mr-1.5" /> Publish
          </Button>
          <Button size="sm" variant="outline" className="rounded-lg h-9 text-[10px] font-bold uppercase"
            onClick={() => bulkSetPublished(false)} disabled={bulkBusy}>
            <PowerOff className="w-3.5 h-3.5 mr-1.5" /> Unpublish
          </Button>
          <Button size="sm" variant="ghost" className="rounded-lg h-9 text-[10px] font-bold uppercase ml-auto"
            onClick={clearSelection}>
            Clear
          </Button>
        </div>
      )}

      {content.length > 0 && (
        <div className="flex items-center gap-2 px-2">
          <Checkbox
            checked={selectedIds.size === content.length && content.length > 0}
            onCheckedChange={toggleSelectAll}
          />
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Select all on this page
          </span>
        </div>
      )}

      {content.length === 0 ? (
        <Card className="rounded-[40px] border-2 border-dashed border-border/40 bg-card/10 py-24 text-center">
          <Layers className="h-16 w-16 text-muted-foreground/20 mx-auto mb-6" />
          <p className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 italic">
            Registry Node Null: No logic paths detected.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {content.map((item) => {
            const config = TYPE_CONFIG[item.content_type] || TYPE_CONFIG.free_video;
            const Icon = config.icon;

            return (
              <Card
                key={item.id}
                className={cn(
                  "group rounded-[40px] border-2 bg-card/30 backdrop-blur-xl transition-all duration-500 hover:border-primary/40 flex flex-col overflow-hidden",
                  selectedIds.has(item.id) ? "border-primary/60 ring-2 ring-primary/20" : "border-border/40",
                )}
              >
                <CardHeader className="p-8 pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedIds.has(item.id)}
                        onCheckedChange={() => toggleSelect(item.id)}
                      />
                      <div
                        className={cn(
                          "h-12 w-12 rounded-2xl flex items-center justify-center border-2 border-white/5 shadow-inner transition-transform duration-500 group-hover:rotate-6",
                          config.bg,
                        )}
                      >
                        <Icon className={cn("h-6 w-6", config.color)} />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge
                        className={cn(
                          "rounded-lg font-black text-[8px] uppercase tracking-[0.2em] px-3 py-1 border-none",
                          item.is_published ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground/60",
                        )}
                      >
                        {item.is_published ? "PUBLISHED" : "DRAFT"}
                      </Badge>
                      {(item.content_type === "recorded_course" || item.content_type === "live_webinar" || item.content_type === "batch_class") && (
                        <ContentReadinessBadge
                          stats={moduleStatsMap[item.id]}
                          isReady={item.is_ready ?? undefined}
                          appliesPlayableRule={item.content_type === "recorded_course"}
                          compact
                        />
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-black uppercase tracking-tighter italic leading-none group-hover:text-primary transition-colors line-clamp-2 min-h-[56px]">
                    {item.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-8 pt-0 space-y-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-muted/10 border border-border/10">
                      <ContentReadinessBadge
                        stats={moduleStatsMap[item.id]}
                        isReady={item.is_ready ?? undefined}
                        appliesPlayableRule={item.content_type === "recorded_course"}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary italic leading-none">
                        {config.label}
                      </p>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">
                          {item.current_enrollment} enrolled
                        </span>
                        {item.price > 0 ? (
                          <div className="flex items-center gap-1.5 font-black italic text-lg tracking-tighter">
                            <Zap className="h-4 w-4 fill-primary text-primary" /> ${item.price}
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-[9px] font-black uppercase">
                            FREE
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-border/10 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl h-9 text-[10px] font-bold uppercase"
                      onClick={() => navigate(`/content/${item.id}/edit`)}
                    >
                      <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit
                    </Button>
                    {(item.content_type === "recorded_course" || item.content_type === "live_webinar") && (
                      <Button
                        variant="default"
                        size="sm"
                        className="rounded-xl h-9 text-[10px] font-bold uppercase"
                        onClick={() => navigate(`/dashboard?tab=modules&id=${item.id}`)}
                      >
                        <Layers className="w-3.5 h-3.5 mr-1.5" /> Modules
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl h-9 text-[10px] font-bold uppercase"
                      onClick={() => previewAsTalent(item)}
                    >
                      <Eye className="w-3.5 h-3.5 mr-1.5" /> Preview
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl h-9 text-[10px] font-bold uppercase"
                      onClick={() => duplicateContent(item)}
                    >
                      <Copy className="w-3.5 h-3.5 mr-1.5" /> Duplicate
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-xl h-9 w-9 p-0 ml-auto text-destructive/40 hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteId(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Logic Pagination Terminal */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-8 bg-muted/20 rounded-[32px] border-2 border-border/40 backdrop-blur-md">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 italic leading-none">
              Registry Frame
            </p>
            <p className="text-xl font-black italic tracking-tighter leading-none">
              {page} <span className="text-xs opacity-20">of</span> {totalPages}
            </p>
          </div>
          <div className="flex gap-4">
            <Button
              variant="outline"
              size="icon"
              className="h-14 w-14 rounded-2xl border-2 hover:bg-primary hover:text-white transition-all"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-14 w-14 rounded-2xl border-2 hover:bg-primary hover:text-white transition-all"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-[32px] border-4 border-destructive/20 bg-background/95 p-10 shadow-2xl backdrop-blur-xl">
          <AlertDialogHeader>
            <div className="h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6 border-2 border-destructive/20">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <AlertDialogTitle className="text-3xl font-black uppercase tracking-tighter italic text-left">
              Terminate Node?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium text-muted-foreground italic leading-relaxed text-left">
              System warning: This logic cycle cannot be reversed. Artifact and all associated logic chains will be
              terminated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-10 gap-4">
            <AlertDialogCancel className="rounded-xl h-14 px-8 font-black uppercase text-[10px] border-2">
              Abort
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmPurge}
              className="bg-destructive text-white rounded-xl h-14 px-10 font-black uppercase text-[10px]"
            >
              Confirm Purge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ContentList;

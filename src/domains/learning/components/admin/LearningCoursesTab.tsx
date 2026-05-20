import { useState } from "react";
import { useLearningGraph } from "./hooks/useLearningGraph";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Tv, ShieldCheck, BookOpen, Filter, Layers, Sparkles, FileCheck2, Wand2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import ContentFilters, { type ContentFilterValues } from "./content-widgets/ContentFilters";
import ModulePickerPanel from "./modules/ModulePickerPanel";
import { BatchContentGenerator } from "./content-widgets/BatchContentGenerator";
import { AIActionButton } from "./content-widgets/ContentAIActions";
import ContentReadinessBadge from "./content-widgets/ContentReadinessBadge";
import ContentReadinessChecklist from "./content-widgets/ContentReadinessChecklist";
import { FlashcardEditor } from "./modules/FlashcardEditor";
import { ModuleResourceFileUpload } from "./modules/ModuleResourceFileUpload";

export function LearningCoursesTab() {
  const {
    learningGraphQuery,
    mutations: { upsertContent, deleteContent },
  } = useLearningGraph();
  const { data, isLoading } = learningGraphQuery;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<any>({ status: "draft", content_type: "recorded_course" });

  // Selected course for module management
  const [selectedModuleCourseId, setSelectedModuleCourseId] = useState<string | null>(null);
  const [showBatchGenerator, setShowBatchGenerator] = useState(false);
  const [selectedCourseForChecklist, setSelectedCourseForChecklist] = useState<any | null>(null);
  const [tempResourceUrl, setTempResourceUrl] = useState<string | null>(null);

  // Unified ContentFilters state
  const [filters, setFilters] = useState<ContentFilterValues>({
    programId: "all",
    levelId: "all",
    readiness: "all",
    sortBy: "newest",
    typeSegment: "all",
  });

  // Map ContentFilters → existing dataset
  const courses = (() => {
    const list = (data?.content ?? []).filter((c) => {
      const seg = filters.typeSegment ?? "all";
      const matchType =
        seg === "all" ||
        (seg === "recorded" && c.content_type === "recorded_course") ||
        (seg === "live" && (c.content_type === "live_webinar" || c.content_type === "batch_class")) ||
        (seg === "free" && c.content_type === "free_video") ||
        (seg === "offline" && c.content_type === "offline");

      const isPublished = c.is_published === true || c.status === "published";
      const matchStatus =
        filters.readiness === "all" ||
        filters.readiness === "ready_only" ||
        filters.readiness === "inactive_only" ||
        (filters.readiness === "published" && isPublished) ||
        (filters.readiness === "draft" && !isPublished);

      return matchType && matchStatus;
    });

    return [...list].sort((a, b) => {
      if (filters.sortBy === "oldest") return +new Date(a.created_at) - +new Date(b.created_at);
      if (filters.sortBy === "title_asc") return (a.title || "").localeCompare(b.title || "");
      if (filters.sortBy === "title_desc") return (b.title || "").localeCompare(a.title || "");
      return +new Date(b.created_at) - +new Date(a.created_at);
    });
  })();

  return (
    <div className="space-y-6 animate-in fade-in duration-1000 p-4 md:p-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-3 text-cyan-500">
            <Tv className="h-8 w-8 text-cyan-500 fill-cyan-500/20" />
            <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none text-foreground">
              Content Catalog
            </h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Universal Content Management
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={() => setShowBatchGenerator(true)}
            className="h-12 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 border-2 border-violet-500/40 text-violet-600 hover:bg-violet-500/10"
          >
            <Wand2 className="h-4 w-4" /> Bulk Generate
          </Button>
          <Button
            onClick={() => {
              setDraft({ status: "draft", content_type: "recorded_course" });
              setOpen(true);
            }}
            className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg shadow-cyan-500/20 bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            <Plus className="h-4 w-4" /> Inject Course
          </Button>
        </div>
      </header>

      {/* Unified Content Filters HUD */}
      <div className="flex flex-col sm:flex-row gap-4 px-2 items-start">
        <div className="flex items-center gap-2 text-muted-foreground pt-2">
          <Filter className="h-4 w-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Filters:</span>
        </div>
        <div className="flex-1">
          <ContentFilters values={filters} onChange={setFilters} />
        </div>
      </div>

      <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 shadow-2xl overflow-hidden backdrop-blur-xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500" />
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/10 border-b-2 border-border/20">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-black uppercase text-[10px] tracking-widest py-5 pl-8">
                    Course Definition
                  </TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Type</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Status</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-right">Created</TableHead>
                  <TableHead className="text-right py-5 pr-8">Manage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/5">
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-20 text-center">
                      <Skeleton className="h-8 w-32 mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : courses.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-20 text-center font-black uppercase text-[10px] tracking-widest text-muted-foreground/50 italic"
                    >
                      Zero courses detected.
                    </TableCell>
                  </TableRow>
                ) : (
                  courses.map((row) => {
                    const isRowPublished = row.is_published === true || row.status === "published";

                    return (
                      <TableRow key={row.id} className="group hover:bg-cyan-500/[0.02]">
                        <TableCell className="py-6 pl-8">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-background border-2 border-border/20 flex items-center justify-center shrink-0">
                              <BookOpen className="h-3 w-3 text-cyan-500" />
                            </div>
                            <span className="font-black text-sm uppercase italic tracking-tight">{row.title}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-[9px] uppercase tracking-widest border-2">
                            {row.content_type?.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              className={cn(
                                "font-bold text-[9px] uppercase tracking-widest border-none px-3",
                                isRowPublished ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600",
                              )}
                            >
                              {isRowPublished ? "Published" : "Unpublished"}
                            </Badge>
                            <button
                              type="button"
                              onClick={() => setSelectedCourseForChecklist(row)}
                              title="Open readiness checklist"
                              className="focus:outline-none focus:ring-2 focus:ring-primary rounded-md"
                            >
                              <ContentReadinessBadge
                                compact
                                isReady={isRowPublished}
                                stats={
                                  isRowPublished
                                    ? { module_count: 1, modules_with_desc: 1, modules_with_video: 1, playable_modules: 1 }
                                    : undefined
                                }
                              />
                            </button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-[10px] text-muted-foreground">
                          {new Date(row.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <div className="flex justify-end gap-2 opacity-20 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedModuleCourseId(row.id)}
                              className="hover:bg-indigo-500/10 hover:text-indigo-600"
                              title="Manage Modules"
                            >
                              <Layers className="h-4 w-4" />
                            </Button>
                            <AIActionButton
                              mode="description"
                              context={{
                                title: row.title,
                                content_type: row.content_type,
                              }}
                              onResult={() => {}}
                              label="AI"
                              size="sm"
                              className="hover:bg-violet-500/10 hover:text-violet-600"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                // Prep draft state matching legacy UI expectations
                                setDraft({ ...row, status: isRowPublished ? "published" : "draft" });
                                setOpen(true);
                              }}
                              className="hover:bg-cyan-500/10 hover:text-cyan-600"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                if (confirm("Purge Course?")) deleteContent.mutate(row.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-[40px] p-8 border-4 border-border/40 text-left">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-cyan-500 flex items-center gap-2">
              <Tv className="h-6 w-6" /> Inject Course
            </DialogTitle>
            <DialogDescription className="text-[10px] font-bold uppercase tracking-widest italic">
              Update course catalog entry.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Course Title</Label>
              <Input
                placeholder="Title"
                value={draft.title || ""}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                className="h-14 rounded-xl border-2 font-bold"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Content Type</Label>
              <Select value={draft.content_type} onValueChange={(v) => setDraft({ ...draft, content_type: v })}>
                <SelectTrigger className="h-14 rounded-xl border-2 font-bold text-xs uppercase">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recorded_course" className="font-bold text-xs uppercase tracking-widest">
                    Recorded Course
                  </SelectItem>
                  <SelectItem value="batch_class" className="font-bold text-xs uppercase tracking-widest">
                    Batch Class
                  </SelectItem>
                  <SelectItem value="live_webinar" className="font-bold text-xs uppercase tracking-widest">
                    Live Webinar
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                Deployment Status
              </Label>
              <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v })}>
                <SelectTrigger className="h-14 rounded-xl border-2 font-bold text-xs uppercase">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft" className="font-bold text-xs uppercase tracking-widest text-amber-500">
                    Draft / Unpublished
                  </SelectItem>
                  <SelectItem
                    value="published"
                    className="font-bold text-xs uppercase tracking-widest text-emerald-500"
                  >
                    Published
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            disabled={!draft.title || upsertContent.isPending}
            onClick={() => {
              // Map our UI "status" back to the underlying DB column "is_published"
              const payload = { ...draft, is_published: draft.status === "published" };
              delete payload.status; // Remove UI-only field
              upsertContent.mutate(payload, { onSuccess: () => setOpen(false) });
            }}
            className="h-14 rounded-xl font-black uppercase bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            <ShieldCheck className="mr-2 h-5 w-5" /> Authorize Content
          </Button>
        </DialogContent>
      </Dialog>

      {/* Module Management Dialog */}
      <Dialog open={!!selectedModuleCourseId} onOpenChange={(o) => !o && setSelectedModuleCourseId(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto rounded-[32px] p-6 border-2 border-border/40">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase italic tracking-tighter text-indigo-500 flex items-center gap-2">
              <Layers className="h-5 w-5" /> Module Curriculum
            </DialogTitle>
            <DialogDescription className="text-[10px] font-bold uppercase tracking-widest italic">
              Manage modules and learning resources for this course.
            </DialogDescription>
          </DialogHeader>
          {selectedModuleCourseId && (
            <Tabs defaultValue="modules" className="w-full">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="modules" className="text-[10px] font-black uppercase tracking-widest gap-2">
                  <Layers className="h-3.5 w-3.5" /> Modules
                </TabsTrigger>
                <TabsTrigger value="flashcards" className="text-[10px] font-black uppercase tracking-widest gap-2">
                  <Sparkles className="h-3.5 w-3.5" /> Flashcards
                </TabsTrigger>
                <TabsTrigger value="resources" className="text-[10px] font-black uppercase tracking-widest gap-2">
                  <BookOpen className="h-3.5 w-3.5" /> Resources
                </TabsTrigger>
              </TabsList>
              <TabsContent value="modules">
                <ModulePickerPanel
                  contentId={selectedModuleCourseId}
                  onClose={() => setSelectedModuleCourseId(null)}
                />
              </TabsContent>
              <TabsContent value="flashcards">
                <FlashcardEditor onSave={() => {}} />
              </TabsContent>
              <TabsContent value="resources">
                <div className="space-y-3 p-4 border-2 border-dashed border-border/40 rounded-2xl">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Attach a resource file or link for this course.
                  </p>
                  <ModuleResourceFileUpload
                    value={tempResourceUrl}
                    onChange={setTempResourceUrl}
                  />
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Content Generator */}
      <Dialog open={showBatchGenerator} onOpenChange={setShowBatchGenerator}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto rounded-[32px] p-6 border-2 border-border/40">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase italic tracking-tighter text-violet-500 flex items-center gap-2">
              <Wand2 className="h-5 w-5" /> Bulk Content Generator
            </DialogTitle>
            <DialogDescription className="text-[10px] font-bold uppercase tracking-widest italic">
              Generate multiple courses, modules, or resources in a single batch.
            </DialogDescription>
          </DialogHeader>
          <BatchContentGenerator />
        </DialogContent>
      </Dialog>

      {/* Readiness Checklist */}
      <Dialog
        open={!!selectedCourseForChecklist}
        onOpenChange={(o) => !o && setSelectedCourseForChecklist(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-[32px] p-6 border-2 border-border/40">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase italic tracking-tighter text-emerald-500 flex items-center gap-2">
              <FileCheck2 className="h-5 w-5" /> Readiness Checklist
            </DialogTitle>
            <DialogDescription className="text-[10px] font-bold uppercase tracking-widest italic">
              Live diagnostic of platform readiness rules for this course.
            </DialogDescription>
          </DialogHeader>
          {selectedCourseForChecklist && (
            <ContentReadinessChecklist
              contentId={selectedCourseForChecklist.id}
              formData={{
                title: selectedCourseForChecklist.title,
                content_type: selectedCourseForChecklist.content_type,
              }}
              moduleStats={undefined}
              moduleAudit={[]}
              sessionCount={0}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default LearningCoursesTab;

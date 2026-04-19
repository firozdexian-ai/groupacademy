import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Settings,
  Sparkles,
  Loader2,
  BookOpen,
  Save,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import ResearchPromptDialog from "@/components/modules/ResearchPromptDialog";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { ErrorState } from "@/components/ui/error-state";
import { cn } from "@/lib/utils";

interface Module {
  id?: string;
  title: string;
  description: string;
  video_url: string;
  duration_minutes: number | null;
  is_preview: boolean;
  display_order: number;
}

export default function ModuleManagement() {
  const { contentId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [generatingIndex, setGeneratingIndex] = useState<number | null>(null);
  const [researchPromptIndex, setResearchPromptIndex] = useState<number | null>(null);

  const [courseContext, setCourseContext] = useState({
    levelName: "",
    programName: "",
    schoolName: "",
    academyName: "GroUp Academy",
    courseIndex: 1,
    totalCourses: 1,
  });

  useEffect(() => {
    if (contentId) loadModules();
  }, [contentId]);

  const loadModules = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { data: c, error: courseError } = await supabase.from("content").select("*").eq("id", contentId).single();
      if (courseError || !c) throw new Error("Blueprint inaccessible.");
      setCourse(c);

      // Recursive Context Fetching (CTO Strategy: Ensure AI has full taxonomy data)
      let levelName = "",
        programName = "",
        schoolName = "";
      if (c.profession_level_id) {
        const { data: lvl } = await supabase
          .from("profession_levels")
          .select("name")
          .eq("id", c.profession_level_id)
          .single();
        levelName = lvl?.name || "";
      }
      if (c.profession_line_id) {
        const { data: prog } = await supabase
          .from("profession_categories")
          .select("name, school_id")
          .eq("id", c.profession_line_id)
          .single();
        programName = prog?.name || "";
        if (prog?.school_id) {
          const { data: sch } = await supabase.from("schools").select("name").eq("id", prog.school_id).single();
          schoolName = sch?.name || "";
        }
      }

      setCourseContext((prev) => ({ ...prev, levelName, programName, schoolName }));

      const { data: mods } = await supabase
        .from("course_modules")
        .select("*")
        .eq("content_id", contentId)
        .order("display_order");
      if (mods && mods.length > 0) setModules(mods);
      else addModule();
    } catch (err: any) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateGuide = async (index: number) => {
    const module = modules[index];
    if (!module.title) return toast.error("Identity required: Enter module title first.");

    setGeneratingIndex(index);
    try {
      const { data, error } = await supabase.functions.invoke("generate-module-guide", {
        body: {
          courseTitle: course?.title,
          moduleTitle: module.title,
          programName: courseContext.programName,
          levelName: courseContext.levelName,
        },
      });
      if (error) throw error;
      if (data?.guide) {
        updateModule(index, "description", data.guide);
        toast.success("Intelligence Synthesis Complete: Guide Generated.");
      }
    } catch (err) {
      toast.error("AI Neural Link Failed.");
    } finally {
      setGeneratingIndex(null);
    }
  };

  const addModule = () => {
    const newModule: Module = {
      title: "",
      description: "",
      video_url: "",
      duration_minutes: null,
      is_preview: false,
      display_order: modules.length,
    };
    setModules([...modules, newModule]);
  };

  const updateModule = (index: number, field: keyof Module, value: any) => {
    const updated = [...modules];
    updated[index] = { ...updated[index], [field]: value };
    setModules(updated);
  };

  const removeModule = (index: number) => {
    const updated = modules.filter((_, i) => i !== index);
    setModules(updated.map((m, i) => ({ ...m, display_order: i })));
  };

  const moveModule = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= modules.length) return;

    const updated = [...modules];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setModules(updated.map((m, i) => ({ ...m, display_order: i })));
  };

  const handleSave = async () => {
    if (modules.some((m) => !m.title)) return toast.error("Validation Error: All modules require titles.");
    setSaving(true);
    try {
      // CTO Logic: Transactional-style wipe and replace for order integrity
      await supabase.from("course_modules").delete().eq("content_id", contentId);

      const payload = modules.map((m, i) => ({
        content_id: contentId,
        title: m.title,
        description: m.description,
        video_url: m.video_url,
        duration_minutes: m.duration_minutes,
        is_preview: m.is_preview,
        display_order: i,
      }));

      const { error } = await supabase.from("course_modules").insert(payload);
      if (error) throw error;

      toast.success("Blueprint Synchronized.");
      navigate(`/content/${contentId}/edit`);
    } catch (err) {
      toast.error("Database Write Failed.");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center animate-pulse font-black text-muted-foreground uppercase tracking-widest">
        Initialising Module Pipeline...
      </div>
    );

  return (
    <div className="min-h-screen bg-muted/20 pb-20 selection:bg-primary/10">
      <header className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate(`/content/${contentId}/edit`)}
            className="rounded-xl font-bold uppercase text-[10px] tracking-widest pl-0 hover:bg-transparent"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Blueprint
          </Button>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="font-black uppercase text-[10px] tracking-tighter border-primary/20 text-primary"
            >
              Ordering Protocol Active
            </Badge>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-6 py-12 space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tighter">Curriculum Architecture</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest italic">
            Sequence for: {course?.title}
          </p>
        </div>

        <div className="space-y-6">
          {modules.map((module, index) => (
            <Card
              key={index}
              className="rounded-[32px] border-border/40 shadow-xl overflow-hidden group bg-card/50 backdrop-blur-sm"
            >
              <CardHeader className="bg-muted/30 border-b border-border/20 py-4 px-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <GripVertical className="h-5 w-5 text-muted-foreground/30" />
                    <CardTitle className="text-sm font-black uppercase tracking-widest">
                      Module <span className="text-primary">{index + 1}</span>
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-1 bg-background/50 rounded-xl p-1 border border-border/20">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveModule(index, "up")}
                      disabled={index === 0}
                      className="h-8 w-8 rounded-lg"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveModule(index, "down")}
                      disabled={index === modules.length - 1}
                      className="h-8 w-8 rounded-lg"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <div className="w-px h-4 bg-border mx-1" />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeModule(index)}
                      className="h-8 w-8 rounded-lg text-rose-500 hover:bg-rose-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="grid md:grid-cols-[1fr,200px] gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                      Identity Title *
                    </Label>
                    <Input
                      value={module.title}
                      onChange={(e) => updateModule(index, "title", e.target.value)}
                      placeholder="e.g. Fundamental Logic and Risk Ratios"
                      className="h-12 rounded-xl border-border/40 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                      Target Duration (Mins)
                    </Label>
                    <Input
                      type="number"
                      value={module.duration_minutes || ""}
                      onChange={(e) =>
                        updateModule(index, "duration_minutes", e.target.value ? parseInt(e.target.value) : null)
                      }
                      placeholder="45"
                      className="h-12 rounded-xl border-border/40"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                      Strategic Narrative (Description)
                    </Label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setResearchPromptIndex(index)}
                        className="h-8 rounded-lg border-primary/20 text-primary font-black uppercase text-[9px] tracking-widest"
                      >
                        <BookOpen className="h-3 w-3 mr-1.5" /> Research Prompt
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateGuide(index)}
                        disabled={generatingIndex !== null}
                        className="h-8 rounded-lg border-primary/20 bg-primary/5 text-primary font-black uppercase text-[9px] tracking-widest"
                      >
                        {generatingIndex === index ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                        ) : (
                          <Sparkles className="h-3 w-3 mr-1.5" />
                        )}{" "}
                        AI Synthesizer
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    value={module.description}
                    onChange={(e) => updateModule(index, "description", e.target.value)}
                    rows={5}
                    className="rounded-2xl border-border/40 resize-none leading-relaxed text-sm font-medium"
                    placeholder="Describe the core outcomes or talking points..."
                  />
                </div>

                <div className="grid md:grid-cols-[1fr,180px] gap-6 items-end pt-4 border-t border-border/20">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                      Stream Endpoint (YouTube)
                    </Label>
                    <Input
                      value={module.video_url}
                      onChange={(e) => updateModule(index, "video_url", e.target.value)}
                      placeholder="https://youtube.com/..."
                      className="h-11 rounded-xl border-border/40 font-mono text-xs"
                    />
                  </div>
                  <div className="flex items-center justify-between bg-muted/30 h-11 px-4 rounded-xl border border-border/20">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Free Preview
                    </span>
                    <Switch
                      checked={module.is_preview}
                      onCheckedChange={(val) => updateModule(index, "is_preview", val)}
                    />
                  </div>
                </div>

                {module.id && (
                  <Button
                    variant="ghost"
                    asChild
                    className="w-full h-10 rounded-xl font-black uppercase text-[9px] tracking-[0.2em] hover:bg-primary/5 text-primary/60 hover:text-primary"
                  >
                    <Link to={`/content/${contentId}/modules/${module.id}/resources`}>
                      <Settings className="h-3 w-3 mr-2" /> Extended Resource Management
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}

          <div className="grid grid-cols-2 gap-4 pt-6">
            <Button
              variant="outline"
              onClick={addModule}
              className="h-16 rounded-[24px] border-dashed border-2 border-primary/20 hover:border-primary/40 text-primary font-black uppercase tracking-widest"
            >
              <Plus className="h-5 w-5 mr-2" /> Add Sequence Node
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="h-16 rounded-[24px] shadow-2xl shadow-primary/20 font-black uppercase tracking-widest text-sm"
            >
              {saving ? <Loader2 className="animate-spin" /> : <Save className="h-5 w-5 mr-2" />} Synchronize All
              Modules
            </Button>
          </div>
        </div>
      </main>

      {researchPromptIndex !== null && (
        <ResearchPromptDialog
          open={true}
          onOpenChange={(o) => {
            if (!o) setResearchPromptIndex(null);
          }}
          moduleTitle={modules[researchPromptIndex]?.title}
          moduleDescription={modules[researchPromptIndex]?.description}
          moduleIndex={researchPromptIndex + 1}
          totalModules={modules.length}
          courseTitle={course?.title}
          courseIndex={courseContext.courseIndex}
          totalCourses={courseContext.totalCourses}
          levelName={courseContext.levelName}
          programName={courseContext.programName}
          schoolName={courseContext.schoolName}
          academyName={courseContext.academyName}
        />
      )}
    </div>
  );
}

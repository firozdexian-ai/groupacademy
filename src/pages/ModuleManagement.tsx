import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Plus, Trash2, GripVertical, Settings, Sparkles, Loader2, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import ResearchPromptDialog from "@/components/modules/ResearchPromptDialog";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { ErrorState } from "@/components/ui/error-state";

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
  const [courseContext, setCourseContext] = useState<{
    levelName: string; programName: string; schoolName: string; academyName: string;
    courseIndex: number; totalCourses: number;
  }>({ levelName: "", programName: "", schoolName: "", academyName: "Executive Academy", courseIndex: 1, totalCourses: 1 });

  const generateGuide = async (index: number) => {
    const module = modules[index];
    if (!module.title) {
      toast.error("Please enter a module title first");
      return;
    }
    setGeneratingIndex(index);
    try {
      const { data, error } = await supabase.functions.invoke("generate-module-guide", {
        body: {
          courseTitle: course?.title || "",
          moduleTitle: module.title,
          programName: "Banking & Finance",
          levelName: "",
        },
      });
      if (error) throw error;
      if (data?.guide) {
        updateModule(index, "description", data.guide);
        toast.success("Guide generated!");
      } else if (data?.error) {
        toast.error(data.error);
      }
    } catch (err: any) {
      console.error("Guide generation error:", err);
      toast.error("Failed to generate guide");
    } finally {
      setGeneratingIndex(null);
    }
  };

  useEffect(() => {
    loadModules();
  }, [contentId]);

  const loadModules = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      // Get course details
      const courseResult = await withTimeout(
        Promise.resolve(supabase.from("content").select("*").eq("id", contentId).single()),
        TIMEOUTS.DEFAULT,
        "Loading course timed out"
      );
      if (courseResult.error || !courseResult.data) {
        toast.error("Course not found");
        navigate("/dashboard");
        return;
      }
      setCourse(courseResult.data);

      // Load hierarchy context for research prompt
      const c = courseResult.data;
      let levelName = "", programName = "", schoolName = "";
      if (c.profession_level_id) {
        const { data: level } = await supabase.from("profession_levels").select("name").eq("id", c.profession_level_id).single();
        if (level) levelName = level.name || "";
      }
      if (c.profession_line_id) {
        const { data: program } = await supabase.from("profession_categories").select("name, school_id").eq("id", c.profession_line_id).single();
        if (program) {
          programName = program.name || "";
          if (program.school_id) {
            const { data: school } = await supabase.from("schools").select("name").eq("id", program.school_id).single();
            if (school) schoolName = school.name || "";
          }
        }
      }

      // Count sibling courses at same level
      let totalCourses = 1, courseIndex = 1;
      if (c.profession_level_id) {
        const { data: siblings } = await supabase.from("content").select("id").eq("profession_level_id", c.profession_level_id).order("display_order");
        if (siblings) {
          totalCourses = siblings.length;
          courseIndex = siblings.findIndex((s: any) => s.id === c.id) + 1 || 1;
        }
      }

      setCourseContext({ levelName, programName, schoolName, academyName: "Executive Academy", courseIndex, totalCourses });

      const modulesResult = await withTimeout(
        Promise.resolve(supabase.from("course_modules").select("*").eq("content_id", contentId).order("display_order")),
        TIMEOUTS.DEFAULT,
        "Loading modules timed out"
      );
      if (modulesResult.data && modulesResult.data.length > 0) {
        setModules(modulesResult.data);
      } else {
        addModule();
      }
    } catch (error: any) {
      console.error("Error loading modules:", error);
      setLoadError(error.message || "Failed to load modules");
      toast.error("Failed to load modules");
    } finally {
      setLoading(false);
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

  const removeModule = (index: number) => {
    const module = modules[index];
    if (module.id) {
      // Module exists in DB - warn about potential resource loss
      if (!confirm("Deleting this module will also remove its resources. Continue?")) {
        return;
      }
    }
    setModules(modules.filter((_, i) => i !== index));
  };

  const updateModule = (index: number, field: keyof Module, value: string | number | boolean | null) => {
    const updated = [...modules];
    updated[index] = { ...updated[index], [field]: value };
    setModules(updated);
  };

  const moveModule = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === modules.length - 1)
    ) {
      return;
    }

    const updated = [...modules];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
    
    // Update display orders
    updated.forEach((module, i) => {
      module.display_order = i;
    });
    
    setModules(updated);
  };

  const handleSave = async () => {
    // Validate modules
    if (modules.length === 0) {
      toast.error("Please add at least one module");
      return;
    }

    const incomplete = modules.some(m => !m.title);
    if (incomplete) {
      toast.error("Please complete all module titles");
      return;
    }

    setSaving(true);
    try {
      // Delete existing modules
      await supabase
        .from("course_modules")
        .delete()
        .eq("content_id", contentId);

      // Insert new modules
      const modulesToInsert = modules.map((m, index) => ({
        content_id: contentId,
        title: m.title,
        description: m.description || null,
        video_url: m.video_url,
        duration_minutes: m.duration_minutes,
        is_preview: m.is_preview,
        display_order: index,
      }));

      const { error: insertError } = await supabase
        .from("course_modules")
        .insert(modulesToInsert);

      if (insertError) throw insertError;

      toast.success("Modules saved successfully!");
      navigate(`/content/${contentId}/edit`);
    } catch (error: any) {
      console.error("Error saving modules:", error);
      toast.error("Failed to save modules");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <ErrorState
          type="server"
          title="Failed to load modules"
          description={loadError}
          onRetry={loadModules}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate(`/content/${contentId}/edit`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Content
          </Button>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Modules</CardTitle>
              <CardDescription>Manage video lessons for {course?.title}</CardDescription>
            </CardHeader>
          </Card>

          {modules.map((module, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-lg">Module {index + 1}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveModule(index, "up")}
                      disabled={index === 0}
                    >
                      ↑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveModule(index, "down")}
                      disabled={index === modules.length - 1}
                    >
                      ↓
                    </Button>
                    {module.id && (
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/content/${contentId}/modules/${module.id}/resources`}>
                          <Settings className="h-4 w-4 mr-1" />
                          Resources
                        </Link>
                      </Button>
                    )}
                    {modules.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeModule(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Module Title *</Label>
                  <Input
                    value={module.title}
                    onChange={(e) => updateModule(index, "title", e.target.value)}
                    placeholder="Enter module title"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Description / Talking Points</Label>
                    <div className="flex gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setResearchPromptIndex(index)}
                        className="gap-1.5 text-xs"
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        Research Prompt
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateGuide(index)}
                        disabled={generatingIndex !== null}
                        className="gap-1.5 text-xs"
                      >
                        {generatingIndex === index ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="h-3.5 w-3.5" />
                        )}
                        AI Generate Guide
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    value={module.description}
                    onChange={(e) => updateModule(index, "description", e.target.value)}
                    placeholder="Brief description or talking points for this module"
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>YouTube Video URL</Label>
                  <Input
                    value={module.video_url}
                    onChange={(e) => updateModule(index, "video_url", e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Primary video for Orientation stage (optional - can also add via Resources)
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Duration (minutes)</Label>
                    <Input
                      type="number"
                      value={module.duration_minutes || ""}
                      onChange={(e) => updateModule(index, "duration_minutes", e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="60"
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-7">
                    <Switch
                      checked={module.is_preview}
                      onCheckedChange={(checked) => updateModule(index, "is_preview", checked)}
                    />
                    <Label>Free Preview</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex gap-3">
            <Button variant="outline" onClick={addModule} className="flex-1">
              <Plus className="h-4 w-4 mr-2" />
              Add Module
            </Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? "Saving..." : "Save Modules"}
            </Button>
          </div>
        </div>
      </div>

      {researchPromptIndex !== null && (
        <ResearchPromptDialog
          open={true}
          onOpenChange={(open) => { if (!open) setResearchPromptIndex(null); }}
          moduleTitle={modules[researchPromptIndex]?.title || ""}
          moduleDescription={modules[researchPromptIndex]?.description || ""}
          moduleIndex={researchPromptIndex + 1}
          totalModules={modules.length}
          courseTitle={course?.title || ""}
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

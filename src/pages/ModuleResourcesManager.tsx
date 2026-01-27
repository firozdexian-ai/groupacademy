import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Upload, Video, FileText, Image, Music, Brain, HelpCircle, FileCheck, Trash2, Plus, Save, ExternalLink, RefreshCw, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";

type ResourceType = Database["public"]["Enums"]["resource_type"];

interface ModuleResource {
  id?: string;
  title: string;
  description: string;
  resource_type: ResourceType;
  resource_url: string | null;
  resource_data: any;
  stage_number: number;
  display_order: number;
  is_required: boolean;
}

interface Module {
  id: string;
  title: string;
  description: string;
  content_id: string;
}

interface Course {
  id: string;
  title: string;
}

const stageConfig = [
  { number: 1, name: "Orientation", icon: Video, resourceTypes: ["video", "infographic"] as ResourceType[] },
  { number: 2, name: "Learn", icon: FileText, resourceTypes: ["slides", "mindmap", "infographic"] as ResourceType[] },
  { number: 3, name: "Discuss", icon: Music, resourceTypes: ["audio_podcast"] as ResourceType[] },
  { number: 4, name: "Practice", icon: Brain, resourceTypes: ["flashcards", "ai_scenario"] as ResourceType[] },
  { number: 5, name: "Assess", icon: HelpCircle, resourceTypes: ["quiz"] as ResourceType[] },
  { number: 6, name: "Progress", icon: FileCheck, resourceTypes: ["report"] as ResourceType[] },
];

const resourceTypeLabels: Record<ResourceType, string> = {
  video: "Video (YouTube URL)",
  slides: "Slides (PDF)",
  infographic: "Infographic (Image)",
  mindmap: "Mind Map (Image)",
  audio_podcast: "Audio Podcast",
  flashcards: "Flashcards (JSON)",
  ai_scenario: "AI Scenario (JSON)",
  quiz: "Quiz",
  report: "Report (Markdown)",
};

export default function ModuleResourcesManager() {
  const { contentId, moduleId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [module, setModule] = useState<Module | null>(null);
  const [resources, setResources] = useState<ModuleResource[]>([]);
  const [activeStage, setActiveStage] = useState("1");
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [contentId, moduleId]);

  const loadData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      // Load course with timeout
      const { data: courseData, error: courseError } = await withTimeout(
        Promise.resolve(supabase
          .from("content")
          .select("id, title")
          .eq("id", contentId)
          .single()),
        TIMEOUTS.DEFAULT,
        "Loading course timed out"
      );

      if (courseError || !courseData) {
        toast.error("Course not found");
        navigate("/dashboard");
        return;
      }
      setCourse(courseData);

      // Load module with timeout
      const { data: moduleData, error: moduleError } = await withTimeout(
        Promise.resolve(supabase
          .from("course_modules")
          .select("id, title, description, content_id")
          .eq("id", moduleId)
          .single()),
        TIMEOUTS.DEFAULT,
        "Loading module timed out"
      );

      if (moduleError || !moduleData) {
        toast.error("Module not found");
        navigate(`/content/${contentId}/modules`);
        return;
      }
      setModule(moduleData);

      // Load existing resources with timeout
      const { data: resourcesData } = await withTimeout(
        Promise.resolve(supabase
          .from("module_resources")
          .select("*")
          .eq("module_id", moduleId)
          .order("stage_number")
          .order("display_order")),
        TIMEOUTS.DEFAULT,
        "Loading resources timed out"
      );

      if (resourcesData) {
        setResources(resourcesData.map(r => ({
          id: r.id,
          title: r.title,
          description: r.description || "",
          resource_type: r.resource_type,
          resource_url: r.resource_url,
          resource_data: r.resource_data,
          stage_number: r.stage_number || 1,
          display_order: r.display_order || 0,
          is_required: r.is_required || false,
        })));
      }
    } catch (error: any) {
      console.error("Error loading data:", error);
      const errorMessage = error.message?.includes("timed out")
        ? "Loading took too long. Please try again."
        : "Failed to load module data";
      setLoadError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getResourcesByStage = (stageNumber: number) => {
    return resources.filter(r => r.stage_number === stageNumber);
  };

  const addResource = (stageNumber: number, resourceType: ResourceType) => {
    const stageResources = getResourcesByStage(stageNumber);
    const newResource: ModuleResource = {
      title: resourceTypeLabels[resourceType],
      description: "",
      resource_type: resourceType,
      resource_url: null,
      resource_data: resourceType === "flashcards" ? { cards: [] } : 
                     resourceType === "ai_scenario" ? { scenarios: [] } :
                     resourceType === "report" ? { content: "" } : null,
      stage_number: stageNumber,
      display_order: stageResources.length,
      is_required: false,
    };
    setResources([...resources, newResource]);
  };

  const updateResource = (index: number, field: keyof ModuleResource, value: any) => {
    const updated = [...resources];
    updated[index] = { ...updated[index], [field]: value };
    setResources(updated);
  };

  const removeResource = (index: number) => {
    setResources(resources.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (
    index: number,
    file: File,
    folder: string
  ) => {
    const resourceId = `${moduleId}-${Date.now()}`;
    setUploadingFile(resourceId);
    
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `modules/${moduleId}/${folder}/${resourceId}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("course-content")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("course-content")
        .getPublicUrl(filePath);

      updateResource(index, "resource_url", publicUrl);
      toast.success("File uploaded successfully");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file");
    } finally {
      setUploadingFile(null);
    }
  };

  const handleSave = async () => {
    if (!moduleId) return;
    
    setSaving(true);
    try {
      // Filter out empty resources
      const validResources = resources.filter(r => r.title && (r.resource_url || r.resource_data));

      if (validResources.length > 0) {
        const resourcesToUpsert = validResources.map((r, idx) => ({
          id: r.id || undefined, // Keep existing ID for upsert
          module_id: moduleId,
          title: r.title,
          description: r.description || null,
          resource_type: r.resource_type,
          resource_url: r.resource_url,
          resource_data: r.resource_data,
          stage_number: r.stage_number,
          display_order: idx,
          is_required: r.is_required,
        }));

        // Use upsert instead of delete+insert for safer save
        const { error } = await withTimeout(
          Promise.resolve(supabase
            .from("module_resources")
            .upsert(resourcesToUpsert, { onConflict: 'id' })),
          TIMEOUTS.DEFAULT,
          "Saving resources timed out"
        );

        if (error) throw error;

        // Delete resources that were removed (not in current validResources but exist in DB)
        const currentIds = validResources.filter(r => r.id).map(r => r.id);
        const { data: existingResources } = await supabase
          .from("module_resources")
          .select("id")
          .eq("module_id", moduleId);
        
        if (existingResources) {
          const idsToDelete = existingResources
            .filter(r => !currentIds.includes(r.id))
            .map(r => r.id);
          
          if (idsToDelete.length > 0) {
            await supabase
              .from("module_resources")
              .delete()
              .in("id", idsToDelete);
          }
        }
      } else {
        // If no valid resources, delete all for this module
        await withTimeout(
          Promise.resolve(supabase
            .from("module_resources")
            .delete()
            .eq("module_id", moduleId)),
          TIMEOUTS.DEFAULT,
          "Deleting resources timed out"
        );
      }

      toast.success("Resources saved successfully!");
    } catch (error: any) {
      console.error("Save error:", error);
      const errorMessage = error.message?.includes("timed out")
        ? "Save operation timed out. Please try again."
        : "Failed to save resources";
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const renderResourceForm = (resource: ModuleResource, index: number) => {
    const globalIndex = resources.findIndex(r => r === resource);
    
    return (
      <Card key={index} className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{resourceTypeLabels[resource.resource_type]}</Badge>
              {resource.is_required && <Badge variant="destructive">Required</Badge>}
            </div>
            <Button variant="ghost" size="sm" onClick={() => removeResource(globalIndex)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={resource.title}
                onChange={(e) => updateResource(globalIndex, "title", e.target.value)}
                placeholder="Resource title"
              />
            </div>
            <div className="flex items-center space-x-2 pt-7">
              <Switch
                checked={resource.is_required}
                onCheckedChange={(checked) => updateResource(globalIndex, "is_required", checked)}
              />
              <Label>Required to progress</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={resource.description}
              onChange={(e) => updateResource(globalIndex, "description", e.target.value)}
              placeholder="Brief description"
              rows={2}
            />
          </div>

          {/* Type-specific fields */}
          {resource.resource_type === "video" && (
            <div className="space-y-2">
              <Label>YouTube URL</Label>
              <Input
                value={resource.resource_url || ""}
                onChange={(e) => updateResource(globalIndex, "resource_url", e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>
          )}

          {(resource.resource_type === "slides") && (
            <div className="space-y-2">
              <Label>PDF File</Label>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(globalIndex, file, "slides");
                  }}
                  disabled={uploadingFile !== null}
                />
                {resource.resource_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={resource.resource_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
              {uploadingFile && <p className="text-sm text-muted-foreground">Uploading...</p>}
            </div>
          )}

          {(resource.resource_type === "infographic" || resource.resource_type === "mindmap") && (
            <div className="space-y-2">
              <Label>Image File</Label>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(globalIndex, file, resource.resource_type);
                  }}
                  disabled={uploadingFile !== null}
                />
                {resource.resource_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={resource.resource_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
              {resource.resource_url && (
                <img src={resource.resource_url} alt="Preview" className="mt-2 max-h-40 rounded border" />
              )}
            </div>
          )}

          {resource.resource_type === "audio_podcast" && (
            <div className="space-y-2">
              <Label>Audio File (MP3, M4A, WAV)</Label>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(globalIndex, file, "audio");
                  }}
                  disabled={uploadingFile !== null}
                />
                {resource.resource_url && (
                  <audio controls src={resource.resource_url} className="h-10" />
                )}
              </div>
            </div>
          )}

          {resource.resource_type === "flashcards" && (
            <div className="space-y-2">
              <Label>Flashcards JSON</Label>
              <Textarea
                value={JSON.stringify(resource.resource_data || { cards: [] }, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    updateResource(globalIndex, "resource_data", parsed);
                  } catch {
                    // Invalid JSON, don't update
                  }
                }}
                placeholder='{"cards": [{"front": "Question", "back": "Answer", "hint": "Optional hint"}]}'
                rows={6}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Format: {`{"cards": [{"front": "...", "back": "...", "hint": "..."}]}`}
              </p>
            </div>
          )}

          {resource.resource_type === "ai_scenario" && (
            <div className="space-y-2">
              <Label>AI Scenarios JSON</Label>
              <Textarea
                value={JSON.stringify(resource.resource_data || { scenarios: [] }, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    updateResource(globalIndex, "resource_data", parsed);
                  } catch {
                    // Invalid JSON, don't update
                  }
                }}
                placeholder='{"scenarios": [{"situation": "...", "question": "...", "options": [...], "feedback": {...}}]}'
                rows={6}
                className="font-mono text-sm"
              />
            </div>
          )}

          {resource.resource_type === "quiz" && (
            <div className="space-y-2">
              <Label>Quiz Management</Label>
              <p className="text-sm text-muted-foreground">
                Quizzes are managed separately. Use the Quiz Manager to add questions.
              </p>
              <Button variant="outline" asChild>
                <Link to={`/quiz-manage/${contentId}`}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Quiz Manager
                </Link>
              </Button>
            </div>
          )}

          {resource.resource_type === "report" && (
            <div className="space-y-2">
              <Label>Report Content (Markdown)</Label>
              <Textarea
                value={resource.resource_data?.content || ""}
                onChange={(e) => updateResource(globalIndex, "resource_data", { content: e.target.value })}
                placeholder="# Module Summary&#10;&#10;Key takeaways from this module..."
                rows={8}
                className="font-mono text-sm"
              />
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container max-w-5xl mx-auto px-4 space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-40" />
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64 mt-2" />
            </CardHeader>
          </Card>
          <Skeleton className="h-12 w-full" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container max-w-5xl mx-auto px-4">
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Failed to load module data</h3>
              <p className="text-muted-foreground mb-4">{loadError}</p>
              <Button onClick={loadData} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container max-w-5xl mx-auto px-4">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(`/content/${contentId}/modules`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Modules
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save All Resources"}
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Module Resources</CardTitle>
            <CardDescription>
              {course?.title} → {module?.title}
            </CardDescription>
          </CardHeader>
        </Card>

        <Tabs value={activeStage} onValueChange={setActiveStage}>
          <TabsList className="grid grid-cols-6 mb-6">
            {stageConfig.map((stage) => {
              const StageIcon = stage.icon;
              const stageResources = getResourcesByStage(stage.number);
              return (
                <TabsTrigger key={stage.number} value={String(stage.number)} className="flex flex-col gap-1 py-2">
                  <div className="flex items-center gap-1">
                    <StageIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">{stage.name}</span>
                  </div>
                  {stageResources.length > 0 && (
                    <Badge variant="secondary" className="text-xs">{stageResources.length}</Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {stageConfig.map((stage) => {
            const stageResources = getResourcesByStage(stage.number);
            return (
              <TabsContent key={stage.number} value={String(stage.number)}>
                <Card className="mb-4">
                  <CardHeader>
                    <CardTitle className="text-lg">Stage {stage.number}: {stage.name}</CardTitle>
                    <CardDescription>
                      Available resource types: {stage.resourceTypes.map(t => resourceTypeLabels[t]).join(", ")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {stage.resourceTypes.map((type) => (
                        <Button
                          key={type}
                          variant="outline"
                          size="sm"
                          onClick={() => addResource(stage.number, type)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add {resourceTypeLabels[type]}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {stageResources.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="py-8 text-center text-muted-foreground">
                      <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No resources added for this stage yet.</p>
                      <p className="text-sm">Click the buttons above to add resources.</p>
                    </CardContent>
                  </Card>
                ) : (
                  stageResources.map((resource, idx) => renderResourceForm(resource, idx))
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
}

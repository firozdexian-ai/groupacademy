import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { UploadCloud, Loader2 } from "lucide-react";

// Strict type definitions to ensure our JSON matches the DB schema
interface ResourcePayload {
  title: string;
  resource_type: string;
}

interface ModulePayload {
  title: string;
  stage_order: number;
  resources: ResourcePayload[];
}

interface CoursePayload {
  course: {
    title: string;
    description: string;
    content_type: string;
    status: string;
    modules: ModulePayload[];
  };
}

export const CourseJSONImporter = () => {
  const [json, setJson] = useState("");
  const [busy, setBusy] = useState(false);

  // Utility to generate URL-friendly slugs for the content table
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  };

  const handleImport = async () => {
    if (!json.trim()) {
      toast.error("Paste JSON data first");
      return;
    }

    setBusy(true);

    try {
      const parsedData: CoursePayload = JSON.parse(json);
      const courseData = parsedData.course;

      if (!courseData || !courseData.title || !courseData.modules) {
        throw new Error("Invalid JSON structure. Missing core course wrapper, title, or modules.");
      }

      const generatedSlug = generateSlug(courseData.title);

      // 1. Insert the main Course (Content) record
      const { data: contentRecord, error: contentError } = await supabase
        .from("content")
        .insert({
          title: courseData.title,
          description: courseData.description,
          content_type: courseData.content_type || "recorded_course",
          status: "unpublished", // Hardcoded safety constraint
          slug: generatedSlug,
        })
        .select()
        .single();

      if (contentError) throw new Error(`Course insertion failed: ${contentError.message}`);

      // 2. Iterate and insert Modules
      for (const mod of courseData.modules) {
        const { data: moduleRecord, error: moduleError } = await supabase
          .from("course_modules")
          .insert({
            content_id: contentRecord.id,
            title: mod.title,
            stage_order: mod.stage_order,
          })
          .select()
          .single();

        if (moduleError) {
          console.error("Module error:", moduleError);
          continue; // Skip failed modules but continue pipeline
        }

        // 3. Iterate and insert Resources for this Module
        if (mod.resources && mod.resources.length > 0) {
          const resourcesToInsert = mod.resources.map((res, index) => ({
            module_id: moduleRecord.id,
            title: res.title,
            resource_type: res.resource_type,
            order_index: index + 1,
          }));

          const { error: resourceError } = await supabase.from("module_resources").insert(resourcesToInsert);

          if (resourceError) {
            console.error("Resource error:", resourceError);
          }
        }
      }

      toast.success(`Course "${courseData.title}" successfully ingested as Unpublished.`);
      setJson(""); // Clear on success
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? "Failed to parse and import JSON.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UploadCloud className="h-5 w-5 text-primary" />
          Bulk Course Importer
        </CardTitle>
        <CardDescription>
          Paste a structured JSON object to rapidly scaffold courses, modules, and resources. All imports are securely
          flagged as <span className="font-semibold text-destructive">Unpublished</span> by default.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea
          value={json}
          onChange={(e) => setJson(e.target.value)}
          placeholder={`{\n  "course": {\n    "title": "Intro to AI",\n    "modules": [...]\n  }\n}`}
          className="min-h-[400px] font-mono text-sm bg-muted/30 focus:bg-background"
        />
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleImport} disabled={busy} className="min-w-[150px]">
          {busy ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Process & Import"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CourseJSONImporter;

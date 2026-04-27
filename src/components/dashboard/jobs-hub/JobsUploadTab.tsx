import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Sparkles, Plus, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { JobFormDialog, type JobFormState } from "./JobFormDialog";
import { PendingJobSubmissions } from "./PendingJobSubmissions";
import { BatchLinkedInJobUpload } from "@/components/dashboard/BatchLinkedInJobUpload";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Tab 4 — Upload & Verify
 * Single-source intake for jobs: manual create, AI parser (single posting),
 * batch / JSON uploads, and pending gig submissions for verification.
 */
export function JobsUploadTab() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [showBatch, setShowBatch] = useState(false);
  const [prefill, setPrefill] = useState<Partial<JobFormState> | undefined>(undefined);
  const [rawText, setRawText] = useState("");
  const [parsing, setParsing] = useState(false);

  const runAIParse = async () => {
    if (!rawText.trim()) return toast.error("Paste a job description first");
    setParsing(true);
    try {
      const { data, error } = await supabase.functions.invoke("parse-job-post", {
        body: { text: rawText },
      });
      if (error) throw error;
      const p = (data?.parsed_job || data) as any;
      setPrefill({
        title: p.title || "",
        company_name: p.company_name || p.company || "",
        location: p.location || "",
        job_type: (p.job_type || "full_time") as any,
        experience_level: (p.experience_level || "mid") as any,
        description: p.description || rawText,
        application_type: p.application_url ? "link" : "internal",
        application_url: p.application_url || "",
        application_email: p.application_email || "",
        source_platform: "other",
      });
      setShowForm(true);
      toast.success("Parsed — review & save");
    } catch (e: any) {
      toast.error(e.message || "AI parser failed — fill manually");
      setPrefill({ description: rawText });
      setShowForm(true);
    } finally {
      setParsing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Upload & Verify</h2>
          <p className="text-sm text-muted-foreground">
            Add jobs manually, via AI, batch upload, or approve community submissions.
          </p>
        </div>
        <Button onClick={() => { setPrefill(undefined); setShowForm(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> New Job
        </Button>
      </div>

      <Tabs defaultValue="ai-parse" className="w-full">
        <TabsList className="w-full justify-start flex-wrap h-auto">
          <TabsTrigger value="ai-parse">AI Parser</TabsTrigger>
          <TabsTrigger value="batch">Batch Upload</TabsTrigger>
          <TabsTrigger value="pending">Pending Submissions</TabsTrigger>
        </TabsList>

        <TabsContent value="ai-parse">
          <Card className="rounded-2xl border-border/40">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> AI Parser — Single Posting
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Label className="text-xs">Paste raw job description / posting text</Label>
              <Textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste a LinkedIn / company website job posting here…"
                rows={8}
                className="resize-none"
              />
              <div className="flex gap-2">
                <Button onClick={runAIParse} disabled={parsing || !rawText.trim()} className="gap-2">
                  {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Parse with AI
                </Button>
                <Button variant="outline" onClick={() => { setPrefill({ description: rawText }); setShowForm(true); }}>
                  <LinkIcon className="h-4 w-4 mr-2" /> Skip & Fill Manually
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batch">
          <Card className="rounded-2xl border-border/40">
            <CardHeader>
              <CardTitle className="text-base">Batch LinkedIn Job Upload</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Upload a JSON export of LinkedIn jobs. Companies are auto-created/matched.
              </p>
              <Button onClick={() => setShowBatch(true)} className="gap-2">
                <Plus className="h-4 w-4" /> Open Batch Importer
              </Button>
            </CardContent>
          </Card>
          <BatchLinkedInJobUpload
            isOpen={showBatch}
            onClose={() => setShowBatch(false)}
            onComplete={() => {
              setShowBatch(false);
              qc.invalidateQueries({ queryKey: ["jobs-hub-manage"] });
            }}
          />
        </TabsContent>

        <TabsContent value="pending">
          <PendingJobSubmissions />
        </TabsContent>
      </Tabs>

      <JobFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        initialForm={prefill}
        onSaved={() => { setShowForm(false); setPrefill(undefined); setRawText(""); }}
      />
    </div>
  );
}

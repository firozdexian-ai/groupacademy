import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Plus, Link as LinkIcon, Upload, Database, ShieldCheck, Zap, Activity } from "lucide-react";
import { toast } from "sonner";
import { parseJobPost } from "@/domains/jobs/api/jobsApi";
import { JobFormDialog, type JobFormState } from "./JobFormDialog";
import { PendingJobSubmissions } from "./PendingJobSubmissions";
import { JobsLinkedInBatchUpload } from "@/domains/jobs/components/admin/JobsLinkedInBatchUpload";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { InlineSpinner } from "@/components/common/InlineSpinner";

/**
 * GroUp Academy: Job Data Ingress Orchestrator (JobsUploadTab)
 * CTO Reference: Authoritative node for manual, AI-parsed, and bulk batch ingestion.
 */
export function JobsUploadTab() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [showBatch, setShowBatch] = useState(false);
  const [prefill, setPrefill] = useState<Partial<JobFormState> | undefined>(undefined);
  const [rawText, setRawText] = useState("");
  const [parsing, setParsing] = useState(false);

  const runAIParse = async () => {
    if (!rawText.trim()) return toast.error("Please paste a job description first.");
    setParsing(true);
    const toastId = toast.loading("Initializing neural extraction...");

    try {
      const data: any = await parseJobPost({ text: rawText });

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
      toast.success("Intelligence Extracted: Review node parameters", { id: toastId });
    } catch (e: any) {
      toast.error("AI Extraction Fault: Manual sync required.", { id: toastId });
      setPrefill({ description: rawText });
      setShowForm(true);
    } finally {
      setParsing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* SECTION HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-2xl border border-border/60 text-left">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-primary">
            <Database className="h-8 w-8" />
            <h2 className="text-3xl font-semibold uppercase tracking-tight italic leading-none">Upload jobs</h2>
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            AI parse, batch import & verification queue
          </p>
        </div>
        <Button
          onClick={() => {
            setPrefill(undefined);
            setShowForm(true);
          }}
          className="h-10 px-4 rounded-xl border-2 font-semibold uppercase text-[10px] tracking-widest gap-3 shadow-lg group"
        >
          <Plus className="h-5 w-5 transition-transform group-hover:rotate-90" /> Add job manually
        </Button>
      </div>

      <Tabs defaultValue="ai-parse" className="w-full">
        {/* TAB NAVIGATION */}
        <div className="bg-card p-2 rounded-2xl border border-border/60 backdrop-blur-sm shadow-xl inline-block mb-8">
          <TabsList className="bg-transparent h-auto gap-2">
            <TabTriggerNode value="ai-parse" icon={Sparkles} label="AI parse" />
            <TabTriggerNode value="batch" icon={Upload} label="Batch import" />
            <TabTriggerNode value="pending" icon={ShieldCheck} label="Verification" />
          </TabsList>
        </div>

        {/* AI PARSER CONTENT */}
        <TabsContent value="ai-parse" className="focus-visible:ring-0">
          <Card className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden text-left">
            <div className="h-2 w-full bg-gradient-to-r from-primary via-primary to-primary" />
            <CardHeader className="p-8 pb-4">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <CardTitle className="text-2xl font-semibold uppercase italic tracking-tight flex items-center gap-3">
                    <Sparkles className="h-6 w-6 text-primary fill-primary/10" /> Parse a single job
                  </CardTitle>
                  <CardDescription className="text-[10px] font-bold">
                    Paste raw text and AI fills the structured fields.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="font-semibold px-4 py-1.5 border-2 text-[10px]">
                  AI parser
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <div className="space-y-3">
                <Label className="text-[10px] font-semibold uppercase text-primary italic ml-2">Raw text</Label>
                <Textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Paste a LinkedIn post, company careers page, or any job description..."
                  rows={10}
                  className="rounded-3xl border-2 font-medium italic text-sm leading-relaxed bg-muted/5 p-8 focus-visible:ring-primary shadow-inner resize-none"
                />
              </div>
              <div className="flex flex-wrap gap-4">
                <Button
                  onClick={runAIParse}
                  disabled={parsing || !rawText.trim()}
                  className="h-16 px-10 rounded-xl font-semibold uppercase italic tracking-tight text-xl gap-3 shadow-xl shadow-primary/20 active:scale-95 transition-all"
                >
                  {parsing ? <InlineSpinner size="md" /> : <Zap className="h-6 w-6 fill-current" />}
                  Parse with AI
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setPrefill({ description: rawText });
                    setShowForm(true);
                  }}
                  className="h-16 px-8 rounded-xl border-2 font-semibold uppercase text-[10px] tracking-widest gap-2"
                >
                  <LinkIcon className="h-4 w-4" /> Skip AI
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BATCH CONTENT */}
        <TabsContent value="batch" className="focus-visible:ring-0">
          <Card className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden text-left">
            <CardHeader className="p-8">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                  <Upload className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-semibold uppercase italic tracking-tight">
                    Bulk import
                  </CardTitle>
                  <CardDescription className="text-[10px] font-bold mt-1">
                    Upload a JSON file of jobs in bulk.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-0 border-t border-border/10 mt-4">
              <div className="flex flex-col md:flex-row items-center gap-8 py-8">
                <div className="flex-1 space-y-4">
                  <p className="text-sm font-medium italic leading-relaxed text-muted-foreground">
                    Upload a standardized LinkedIn JSON export. Our system will auto-resolve institutional identities
                     (Companies) and create new jobs in draft mode for final review.
                  </p>
                  <div className="flex gap-3">
                    <Badge className="bg-primary/5 text-primary border-none font-semibold text-[9px]">
                      Auto-link companies
                    </Badge>
                    <Badge className="bg-primary/5 text-primary border-none font-semibold text-[9px]">
                      JSON v2
                    </Badge>
                  </div>
                </div>
                <Button
                  onClick={() => setShowBatch(true)}
                  className="h-20 px-12 rounded-2xl font-semibold uppercase italic tracking-tight text-2xl gap-4 shadow-xl active:scale-95 transition-transform"
                >
                  <Plus className="h-8 w-8" /> Initialize Importer
                </Button>
              </div>
            </CardContent>
          </Card>
          <JobsLinkedInBatchUpload
            isOpen={showBatch}
            onClose={() => setShowBatch(false)}
            onComplete={() => {
              setShowBatch(false);
              qc.invalidateQueries({ queryKey: ["jobs-hub-manage"] });
            }}
          />
        </TabsContent>

        {/* PENDING SUBMISSIONS */}
        <TabsContent value="pending" className="focus-visible:ring-0">
          <PendingJobSubmissions />
        </TabsContent>
      </Tabs>

      <JobFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        initialForm={prefill}
        onSaved={() => {
          setShowForm(false);
          setPrefill(undefined);
          setRawText("");
        }}
      />
    </div>
  );
}

function TabTriggerNode({ value, icon: Icon, label }: any) {
  return (
    <TabsTrigger
      value={value}
      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-2xl px-6 py-3 transition-all font-semibold uppercase italic text-[10px] tracking-widest gap-3 border-2 border-transparent"
    >
      <Icon className="h-4 w-4" />
      {label}
    </TabsTrigger>
  );
}
